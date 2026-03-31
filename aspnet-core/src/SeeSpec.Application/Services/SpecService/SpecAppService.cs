using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
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

        public SpecAppService(
            IRepository<Spec, Guid> repository,
            IRepository<SpecSection, Guid> specSectionRepository,
            IRepository<SectionItem, Guid> sectionItemRepository)
            : base(repository)
        {
            _specSectionRepository = specSectionRepository;
            _sectionItemRepository = sectionItemRepository;
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

            // Deterministic assembly: prefer explicit order, then stable id fallback.
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

            var itemsBySectionId = sectionItems
                .GroupBy(item => item.SpecSectionId)
                .ToDictionary(group => group.Key, group => group.ToList());

            var sections = specSections.Select(section =>
            {
                var metadata = ParseSectionMetadata(section.Content);

                // Items are attached in-memory only for the assembled output; no extra persistence model
                // is introduced for Milestone 2.
                var items = itemsBySectionId.TryGetValue(section.Id, out var groupedItems)
                    ? groupedItems.Select(item => new AssembledSectionItemDto
                    {
                        Id = item.Id,
                        Label = item.Label,
                        Position = item.Position,
                        ItemType = item.ItemType,
                        Content = ParseItemContent(item.Content)
                    }).ToList()
                    : new List<AssembledSectionItemDto>();

                return new AssembledSpecSectionDto
                {
                    Id = section.Id,
                    InputType = metadata.InputType,
                    DiagramType = metadata.DiagramType,
                    Title = section.Title,
                    Slug = section.Slug,
                    SectionType = section.SectionType,
                    OwnerRole = section.OwnerRole,
                    Order = section.Order,
                    Version = section.Version,
                    Items = items
                };
            }).ToList();

            return new AssembledSpecDto
            {
                Id = spec.Id,
                BackendId = spec.BackendId,
                Title = spec.Title,
                Version = spec.Version,
                Status = spec.Status,
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
    }
}
