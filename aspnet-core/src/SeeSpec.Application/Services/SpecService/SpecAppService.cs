using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.UI;
using Abp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SeeSpec.Domains.SpecManagement;
using SeeSpec.Services.SpecService.DTO;

namespace SeeSpec.Services.SpecService
{
    [AbpAuthorize]
    public class SpecAppService : AsyncCrudAppService<Spec, SpecDto, Guid, PagedAndSortedResultRequestDto, SpecDto, SpecDto>, ISpecAppService
    {
        private readonly IRepository<SpecSection, Guid> _specSectionRepository;
        private readonly IRepository<SectionItem, Guid> _sectionItemRepository;
        private readonly IRepository<SectionDependency, Guid> _sectionDependencyRepository;

        public SpecAppService(
            IRepository<Spec, Guid> repository,
            IRepository<SpecSection, Guid> specSectionRepository,
            IRepository<SectionItem, Guid> sectionItemRepository,
            IRepository<SectionDependency, Guid> sectionDependencyRepository)
            : base(repository)
        {
            _specSectionRepository = specSectionRepository;
            _sectionItemRepository = sectionItemRepository;
            _sectionDependencyRepository = sectionDependencyRepository;
        }

        public async Task<AssembledSpecDto> SaveContentAsync(SaveSpecContentDto input)
        {
            var spec = await Repository.GetAsync(input.SpecId);
            var normalizedInputType = NormalizeInputType(input.InputType);

            // Reuse an existing section when appropriate, otherwise create the minimum new section
            // needed for this saved frontend payload.
            var specSection = await GetOrCreateSpecSectionAsync(spec, input, normalizedInputType);

            // Interpret the raw frontend payload into structured section items that can be persisted
            // independently and later reassembled deterministically.
            var interpretedItems = InterpretItems(normalizedInputType, input.DiagramType, input.Content);

            // Keep the original save payload context on the section itself so assembly can expose
            // the originating input type without reinterpreting persisted item rows.
            specSection.Content = BuildSectionMetadataJson(normalizedInputType, input.DiagramType, input.Content);
            specSection.Version = Math.Max(specSection.Version, 0) + 1;

            await CurrentUnitOfWork.SaveChangesAsync();

            var existingItems = await _sectionItemRepository.GetAll()
                .Where(item => item.SpecSectionId == specSection.Id)
                .OrderBy(item => item.Position)
                .ThenBy(item => item.Id)
                .ToListAsync();

            foreach (var existingItem in existingItems)
            {
                await _sectionItemRepository.DeleteAsync(existingItem);
            }

            // SectionItem stays the persisted relational unit; each item stores its own JSON payload.
            for (var index = 0; index < interpretedItems.Count; index++)
            {
                var interpretedItem = interpretedItems[index];
                await _sectionItemRepository.InsertAsync(new SectionItem
                {
                    SpecSectionId = specSection.Id,
                    Label = interpretedItem.Label,
                    Content = interpretedItem.Content.ToString(Formatting.None),
                    Position = index + 1,
                    ItemType = interpretedItem.ItemType
                });
            }

            await CurrentUnitOfWork.SaveChangesAsync();

            return await AssembleSpecAsync(spec.Id);
        }

        public async Task<AssembledSpecDto> AssembleAsync(EntityDto<Guid> input)
        {
            return await AssembleSpecAsync(input.Id);
        }

        private async Task<AssembledSpecDto> AssembleSpecAsync(Guid specId)
        {
            var spec = await Repository.GetAsync(specId);
            var specSections = await _specSectionRepository.GetAll()
                .Where(section => section.SpecId == specId)
                .OrderBy(section => section.Order)
                .ThenBy(section => section.Id)
                .ToListAsync();

            var sectionIds = specSections.Select(section => section.Id).ToList();
            var sectionItems = await _sectionItemRepository.GetAll()
                .Where(item => sectionIds.Contains(item.SpecSectionId))
                .OrderBy(item => item.Position)
                .ThenBy(item => item.Id)
                .ToListAsync();
            var sectionDependencies = await _sectionDependencyRepository.GetAll()
                .Where(dependency => sectionIds.Contains(dependency.FromSectionId) && sectionIds.Contains(dependency.ToSectionId))
                .ToListAsync();

            // Build the dependency graph once in memory so dependency traversal, ordering, cycle
            // detection, and independent-section analysis all operate on the same runtime model.
            var graph = BuildSectionGraph(specSections, sectionItems, sectionDependencies);
            // Independent sections are captured explicitly now so future parallel processing can
            // reuse the analysis result without rebuilding the graph semantics elsewhere.
            var independentSectionIds = graph.Values
                .Where(node => node.DependencySectionIds.Count == 0)
                .Select(node => node.Section.Id)
                .ToList();
            var orderedNodes = TopologicallyOrderGraph(graph);

            var sections = orderedNodes.Select(node =>
            {
                var metadata = ParseSectionMetadata(node.Section.Content);
                return new AssembledSpecSectionDto
                {
                    Id = node.Section.Id,
                    InputType = metadata.InputType,
                    DiagramType = metadata.DiagramType,
                    Title = node.Section.Title,
                    Slug = node.Section.Slug,
                    SectionType = node.Section.SectionType,
                    OwnerRole = node.Section.OwnerRole,
                    Order = node.Section.Order,
                    Version = node.Section.Version,
                    IsIndependent = node.DependencySectionIds.Count == 0,
                    DependencySectionIds = node.DependencySectionIds,
                    DependentSectionIds = node.DependentSectionIds,
                    Items = EmitOrderedItems(node.ItemsByPosition)
                };
            }).ToList();

            return new AssembledSpecDto
            {
                Id = spec.Id,
                BackendId = spec.BackendId,
                Title = spec.Title,
                Version = spec.Version,
                Status = spec.Status,
                IndependentSectionIds = independentSectionIds,
                Sections = sections
            };
        }

        private async Task<SpecSection> GetOrCreateSpecSectionAsync(Spec spec, SaveSpecContentDto input, string normalizedInputType)
        {
            SpecSection specSection = null;

            if (input.SpecSectionId.HasValue)
            {
                specSection = await _specSectionRepository.FirstOrDefaultAsync(input.SpecSectionId.Value);
            }

            if (specSection == null && !string.IsNullOrWhiteSpace(input.Slug))
            {
                specSection = await _specSectionRepository.GetAll()
                    .FirstOrDefaultAsync(section => section.SpecId == spec.Id && section.Slug == input.Slug);
            }

            if (specSection == null && CanReuseDefaultSection(normalizedInputType))
            {
                specSection = await _specSectionRepository.GetAll()
                    .FirstOrDefaultAsync(section => section.SpecId == spec.Id && section.Slug == BuildDefaultSlug(normalizedInputType, input.DiagramType));
            }

            if (specSection != null)
            {
                // Keep updates minimal: adjust the existing section metadata instead of creating
                // a parallel structure.
                specSection.Title = string.IsNullOrWhiteSpace(input.Title) ? specSection.Title : input.Title;
                specSection.Slug = string.IsNullOrWhiteSpace(input.Slug) ? specSection.Slug : input.Slug;
                specSection.Order = input.Order ?? specSection.Order;
                specSection.SectionType = MapSectionType(normalizedInputType);
                specSection.OwnerRole = MapOwnerRole(normalizedInputType);
                return specSection;
            }

            var nextOrder = input.Order ?? await ComputeNextOrderAsync(spec.Id);
            return await _specSectionRepository.InsertAsync(new SpecSection
            {
                SpecId = spec.Id,
                Title = string.IsNullOrWhiteSpace(input.Title) ? BuildDefaultTitle(normalizedInputType, input.DiagramType) : input.Title,
                Slug = ResolveSectionSlug(input, normalizedInputType),
                SectionType = MapSectionType(normalizedInputType),
                Order = nextOrder,
                Content = string.Empty,
                OwnerRole = MapOwnerRole(normalizedInputType),
                Version = 0
            });
        }

        private async Task<int> ComputeNextOrderAsync(Guid specId)
        {
            var maxOrder = await _specSectionRepository.GetAll()
                .Where(section => section.SpecId == specId)
                .Select(section => (int?)section.Order)
                .MaxAsync();

            return (maxOrder ?? 0) + 1;
        }

        private static string NormalizeInputType(string inputType)
        {
            return (inputType ?? string.Empty).Trim().ToLowerInvariant();
        }

        private static SectionType MapSectionType(string inputType)
        {
            switch (inputType)
            {
                case "requirement":
                    return SectionType.Requirement;
                case "diagram":
                case "diagram-input":
                    return SectionType.Architecture;
                default:
                    return SectionType.Shared;
            }
        }

        private static SectionOwnerRole MapOwnerRole(string inputType)
        {
            switch (inputType)
            {
                case "requirement":
                    return SectionOwnerRole.BusinessAnalyst;
                case "diagram":
                case "diagram-input":
                    return SectionOwnerRole.SystemArchitect;
                case "user-role-list":
                    return SectionOwnerRole.ProjectLead;
                default:
                    return SectionOwnerRole.Shared;
            }
        }

        private static string BuildDefaultTitle(string inputType, DiagramType? diagramType)
        {
            switch (inputType)
            {
                case "overview":
                    return "System Overview";
                case "requirement":
                    return "Requirement";
                case "user-role-list":
                    return "User Roles";
                case "diagram":
                case "diagram-input":
                    return diagramType.HasValue ? $"{diagramType.Value} Diagram" : "Diagram";
                default:
                    return "Specification Section";
            }
        }

        private static string BuildDefaultSlug(string inputType, DiagramType? diagramType)
        {
            switch (inputType)
            {
                case "overview":
                    return "overview";
                case "requirement":
                    return "requirement";
                case "user-role-list":
                    return "user-roles";
                case "diagram":
                case "diagram-input":
                    return diagramType.HasValue ? $"{diagramType.Value.ToString().ToLowerInvariant()}-diagram" : "diagram";
                default:
                    return "spec-section";
            }
        }

        private static bool CanReuseDefaultSection(string inputType)
        {
            return inputType != "requirement";
        }

        private static string ResolveSectionSlug(SaveSpecContentDto input, string inputType)
        {
            if (!string.IsNullOrWhiteSpace(input.Slug))
            {
                return input.Slug;
            }

            if (!string.IsNullOrWhiteSpace(input.Title))
            {
                return Slugify(input.Title);
            }

            if (inputType == "requirement")
            {
                return $"requirement-{Guid.NewGuid():N}";
            }

            return BuildDefaultSlug(inputType, input.DiagramType);
        }

        private static string Slugify(string value)
        {
            return string.Join("-",
                value
                    .Trim()
                    .ToLowerInvariant()
                    .Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries));
        }

        private static string BuildSectionMetadataJson(string inputType, DiagramType? diagramType, string content)
        {
            var rawToken = ParseRawContent(content);

            // This metadata is intentionally small: it records how the section was saved while the
            // detailed interpreted content lives in SectionItem rows.
            return new JObject
            {
                ["inputType"] = inputType,
                ["diagramType"] = diagramType?.ToString(),
                ["rawContent"] = rawToken
            }.ToString(Formatting.None);
        }

        private static SectionMetadata ParseSectionMetadata(string sectionContent)
        {
            var token = ParseItemContent(sectionContent) as JObject;
            return new SectionMetadata
            {
                InputType = token?.Value<string>("inputType") ?? "unknown",
                DiagramType = TryParseDiagramType(token?.Value<string>("diagramType"))
            };
        }

        private static JToken ParseItemContent(string content)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return JValue.CreateNull();
            }

            try
            {
                return JToken.Parse(content);
            }
            catch (JsonReaderException)
            {
                return new JValue(content);
            }
        }

        private static JToken ParseRawContent(string content)
        {
            return ParseItemContent(content);
        }

        private static Dictionary<int, List<AssembledSectionItemDto>> BuildItemDictionary(List<SectionItem> sectionItems)
        {
            var orderedItems = new List<SectionItem>();

            foreach (var sectionItem in sectionItems)
            {
                var insertIndex = orderedItems.Count;

                while (insertIndex > 0 && CompareSectionItems(sectionItem, orderedItems[insertIndex - 1]) < 0)
                {
                    insertIndex--;
                }

                orderedItems.Insert(insertIndex, sectionItem);
            }

            var itemsByPosition = new Dictionary<int, List<AssembledSectionItemDto>>();
            var nextFallbackPosition = orderedItems
                .Where(HasExplicitPosition)
                .Select(item => item.Position)
                .DefaultIfEmpty(0)
                .Max();

            foreach (var item in orderedItems)
            {
                var resolvedPosition = HasExplicitPosition(item) ? item.Position : ++nextFallbackPosition;
                if (!itemsByPosition.TryGetValue(resolvedPosition, out var bucket))
                {
                    bucket = new List<AssembledSectionItemDto>();
                    itemsByPosition[resolvedPosition] = bucket;
                }

                bucket.Add(new AssembledSectionItemDto
                {
                    Id = item.Id,
                    Label = item.Label,
                    Position = resolvedPosition,
                    ItemType = item.ItemType,
                    Content = ParseItemContent(item.Content)
                });
            }

            return itemsByPosition;
        }

        private static List<AssembledSectionItemDto> EmitOrderedItems(Dictionary<int, List<AssembledSectionItemDto>> itemsByPosition)
        {
            return itemsByPosition
                .OrderBy(entry => entry.Key)
                .SelectMany(entry => entry.Value)
                .ToList();
        }

        private static Dictionary<Guid, SectionGraphNode> BuildSectionGraph(
            List<SpecSection> specSections,
            List<SectionItem> sectionItems,
            List<SectionDependency> sectionDependencies)
        {
            var itemsBySectionId = sectionItems
                .GroupBy(item => item.SpecSectionId)
                .ToDictionary(group => group.Key, group => group.ToList());

            var graph = specSections.ToDictionary(
                section => section.Id,
                section => new SectionGraphNode
                {
                    Section = section,
                    ItemsByPosition = itemsBySectionId.TryGetValue(section.Id, out var groupedItems)
                        ? BuildItemDictionary(groupedItems)
                        : new Dictionary<int, List<AssembledSectionItemDto>>()
                });

            foreach (var dependency in sectionDependencies)
            {
                if (!graph.TryGetValue(dependency.FromSectionId, out var dependentNode) ||
                    !graph.TryGetValue(dependency.ToSectionId, out var dependencyNode))
                {
                    continue;
                }

                // The declared dependency remains one-directional. A FromSection points at the
                // section it depends on, so the runtime graph stores the parent -> dependent edge
                // as ToSection -> FromSection for safe topological emission.
                if (!dependentNode.DependencySectionIds.Contains(dependency.ToSectionId))
                {
                    dependentNode.DependencySectionIds.Add(dependency.ToSectionId);
                }

                if (!dependencyNode.DependentSectionIds.Contains(dependency.FromSectionId))
                {
                    dependencyNode.DependentSectionIds.Add(dependency.FromSectionId);
                }
            }

            return graph;
        }

        private static List<SectionGraphNode> TopologicallyOrderGraph(Dictionary<Guid, SectionGraphNode> graph)
        {
            var remainingInDegree = graph.ToDictionary(
                entry => entry.Key,
                entry => entry.Value.DependencySectionIds.Count);
            var orderedNodes = new List<SectionGraphNode>();

            // Topological sort is required so every section is emitted only after its prerequisites.
            // Eligible nodes are tie-broken deterministically by section order, then by stable Id.
            var readyNodes = graph.Values
                .Where(node => remainingInDegree[node.Section.Id] == 0)
                .OrderBy(node => node.Section.Order)
                .ThenBy(node => node.Section.Id)
                .ToList();

            while (readyNodes.Count > 0)
            {
                var current = readyNodes[0];
                readyNodes.RemoveAt(0);
                orderedNodes.Add(current);

                foreach (var dependentSectionId in current.DependentSectionIds.OrderBy(id => id))
                {
                    remainingInDegree[dependentSectionId]--;

                    if (remainingInDegree[dependentSectionId] == 0)
                    {
                        InsertReadyNode(readyNodes, graph[dependentSectionId]);
                    }
                }
            }

            if (orderedNodes.Count != graph.Count)
            {
                // Cycles block assembly entirely because continuing would produce dependency-invalid
                // output with no deterministic safe ordering.
                throw new UserFriendlyException("Section dependency cycle detected. Specification assembly is blocked until the cycle is removed.");
            }

            return orderedNodes;
        }

        private static void InsertReadyNode(List<SectionGraphNode> readyNodes, SectionGraphNode node)
        {
            var insertIndex = readyNodes.Count;

            while (insertIndex > 0 && CompareSectionNodes(node, readyNodes[insertIndex - 1]) < 0)
            {
                insertIndex--;
            }

            readyNodes.Insert(insertIndex, node);
        }

        private static int CompareSectionNodes(SectionGraphNode left, SectionGraphNode right)
        {
            var byOrder = left.Section.Order.CompareTo(right.Section.Order);

            if (byOrder != 0)
            {
                return byOrder;
            }

            // When several sections are simultaneously eligible, use a stable tie-breaker so the
            // same dependency graph always produces the same topological order.
            return left.Section.Id.CompareTo(right.Section.Id);
        }

        private static int CompareSectionItems(SectionItem left, SectionItem right)
        {
            var leftHasExplicitPosition = HasExplicitPosition(left);
            var rightHasExplicitPosition = HasExplicitPosition(right);

            if (leftHasExplicitPosition && rightHasExplicitPosition)
            {
                var byPosition = left.Position.CompareTo(right.Position);
                return byPosition != 0 ? byPosition : left.Id.CompareTo(right.Id);
            }

            if (leftHasExplicitPosition != rightHasExplicitPosition)
            {
                // Older items may effectively have no explicit order. Keep explicit positions first,
                // then place unordered legacy items deterministically afterward.
                return leftHasExplicitPosition ? -1 : 1;
            }

            // Fallback for older items without explicit ordering: use stable Id ordering only at
            // assembly time. We do not rewrite persisted rows in this milestone.
            return left.Id.CompareTo(right.Id);
        }

        private static bool HasExplicitPosition(SectionItem sectionItem)
        {
            return sectionItem.Position > 0;
        }

        private static DiagramType? TryParseDiagramType(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            if (Enum.TryParse(value, true, out DiagramType diagramType))
            {
                return diagramType;
            }

            return null;
        }

        private static List<InterpretedSectionItem> InterpretItems(string inputType, DiagramType? diagramType, string content)
        {
            // Interpreter stays local to the Spec service for now: the goal is to support the
            // milestone flow without introducing a broader new architecture.
            switch (inputType)
            {
                case "overview":
                    return InterpretOverview(content);
                case "requirement":
                    return InterpretRequirement(content);
                case "user-role-list":
                    return InterpretUserRoles(content);
                case "diagram":
                case "diagram-input":
                    return InterpretDiagram(diagramType, content);
                default:
                    return new List<InterpretedSectionItem>
                    {
                        new InterpretedSectionItem
                        {
                            Label = "content",
                            ItemType = SectionItemType.Paragraph,
                            Content = new JObject
                            {
                                ["value"] = ParseRawContent(content)
                            }
                        }
                    };
            }
        }

        private static List<InterpretedSectionItem> InterpretOverview(string content)
        {
            var parsed = ParseItemContent(content);
            var overviewObject = parsed as JObject;

            if (overviewObject != null)
            {
                return new List<InterpretedSectionItem>
                {
                    BuildParagraphItem("summary", overviewObject["summary"]),
                    BuildParagraphItem("scope", overviewObject["scope"]),
                    BuildParagraphItem("goals", overviewObject["goals"])
                }.Where(item => item != null).ToList();
            }

            return new List<InterpretedSectionItem>
            {
                BuildParagraphItem("summary", parsed)
            }.Where(item => item != null).ToList();
        }

        private static List<InterpretedSectionItem> InterpretRequirement(string content)
        {
            var parsed = ParseItemContent(content);
            var requirementObject = parsed as JObject;

            if (requirementObject == null)
            {
                return new List<InterpretedSectionItem>
                {
                    BuildParagraphItem("summary", parsed)
                }.Where(item => item != null).ToList();
            }

            var items = new List<InterpretedSectionItem>
            {
                BuildParagraphItem("summary", requirementObject["summary"] ?? requirementObject["title"]),
            };

            if (requirementObject["body"] is JArray bodyArray)
            {
                items.AddRange(bodyArray
                    .Select((token, index) => new InterpretedSectionItem
                    {
                        Label = $"body-{index + 1}",
                        ItemType = SectionItemType.Paragraph,
                        Content = new JObject
                        {
                            ["text"] = token
                        }
                    }));
            }

            if (requirementObject["acceptanceCriteria"] is JArray criteriaArray)
            {
                items.AddRange(criteriaArray
                    .Select((token, index) => new InterpretedSectionItem
                    {
                        Label = $"acceptance-{index + 1}",
                        ItemType = SectionItemType.ChecklistItem,
                        Content = new JObject
                        {
                            ["text"] = token,
                            ["checked"] = false
                        }
                    }));
            }

            return items.Where(item => item != null).ToList();
        }

        private static List<InterpretedSectionItem> InterpretUserRoles(string content)
        {
            var parsed = ParseItemContent(content);
            var rolesArray = parsed as JArray ?? new JArray(parsed);

            return rolesArray
                .Select((token, index) => new InterpretedSectionItem
                {
                    Label = $"role-{index + 1}",
                    ItemType = SectionItemType.TableRow,
                    Content = token is JObject objectToken
                        ? objectToken
                        : new JObject
                        {
                            ["value"] = token
                        }
                })
                .ToList();
        }

        private static List<InterpretedSectionItem> InterpretDiagram(DiagramType? diagramType, string content)
        {
            return new List<InterpretedSectionItem>
            {
                new InterpretedSectionItem
                {
                    Label = "diagram",
                    ItemType = SectionItemType.Paragraph,
                    Content = new JObject
                    {
                        ["diagramType"] = diagramType?.ToString(),
                        ["value"] = ParseRawContent(content)
                    }
                }
            };
        }

        private static InterpretedSectionItem BuildParagraphItem(string label, JToken token)
        {
            if (token == null || token.Type == JTokenType.Null || (token.Type == JTokenType.String && string.IsNullOrWhiteSpace(token.Value<string>())))
            {
                return null;
            }

            return new InterpretedSectionItem
            {
                Label = label,
                ItemType = SectionItemType.Paragraph,
                Content = new JObject
                {
                    ["text"] = token
                }
            };
        }

        private sealed class InterpretedSectionItem
        {
            public string Label { get; set; }

            public SectionItemType ItemType { get; set; }

            public JObject Content { get; set; }
        }

        private sealed class SectionMetadata
        {
            public string InputType { get; set; }

            public DiagramType? DiagramType { get; set; }
        }

        private sealed class SectionGraphNode
        {
            public SpecSection Section { get; set; }

            public Dictionary<int, List<AssembledSectionItemDto>> ItemsByPosition { get; set; }

            public List<Guid> DependencySectionIds { get; } = new List<Guid>();

            public List<Guid> DependentSectionIds { get; } = new List<Guid>();
        }
    }
}
