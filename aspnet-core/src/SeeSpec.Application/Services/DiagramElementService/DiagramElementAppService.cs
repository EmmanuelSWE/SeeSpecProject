using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using SeeSpec.Domains.SpecManagement;
using SeeSpec.Services.DiagramElementService.DTO;

namespace SeeSpec.Services.DiagramElementService
{
    [AbpAuthorize]
    public class DiagramElementAppService : AsyncCrudAppService<DiagramElement, DiagramElementDto, Guid, PagedAndSortedResultRequestDto, DiagramElementDto, DiagramElementDto>, IDiagramElementAppService
    {
        private readonly IRepository<SpecSection, Guid> _specSectionRepository;
        private readonly IRepository<Spec, Guid> _specRepository;
        private readonly IRepository<SectionItem, Guid> _sectionItemRepository;

        private static readonly JsonSerializerOptions SerializerOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private static readonly ConcurrentDictionary<string, RenderedDiagramDto> RenderCache = new ConcurrentDictionary<string, RenderedDiagramDto>();

        public DiagramElementAppService(
            IRepository<DiagramElement, Guid> repository,
            IRepository<SpecSection, Guid> specSectionRepository,
            IRepository<Spec, Guid> specRepository,
            IRepository<SectionItem, Guid> sectionItemRepository)
            : base(repository)
        {
            _specSectionRepository = specSectionRepository;
            _specRepository = specRepository;
            _sectionItemRepository = sectionItemRepository;
        }

        public override async Task<DiagramElementDto> CreateAsync(DiagramElementDto input)
        {
            await ValidateSpecSectionLinkAsync(input.BackendId, input.SpecSectionId);
            await ValidateDiagramCreationRulesAsync(input);

            DiagramElement existingDiagram = await Repository.FirstOrDefaultAsync(
                item => item.BackendId == input.BackendId && item.ExternalElementKey == input.ExternalElementKey
            );

            if (existingDiagram != null)
            {
                existingDiagram.SpecSectionId = input.SpecSectionId;
                existingDiagram.DiagramType = input.DiagramType;
                existingDiagram.Name = input.Name;
                existingDiagram.MetadataJson = input.MetadataJson;

                DiagramElement updatedDiagram = await Repository.UpdateAsync(existingDiagram);
                await PersistDiagramMetadataAsync(updatedDiagram, input.MetadataJson);
                return MapToEntityDto(updatedDiagram);
            }

            DiagramElementDto created = await base.CreateAsync(input);
            DiagramElement createdEntity = await Repository.GetAsync(created.Id);
            await PersistDiagramMetadataAsync(createdEntity, input.MetadataJson);
            return MapToEntityDto(createdEntity);
        }

        public override async Task<DiagramElementDto> UpdateAsync(DiagramElementDto input)
        {
            await ValidateSpecSectionLinkAsync(input.BackendId, input.SpecSectionId);
            await ValidateDiagramCreationRulesAsync(input);
            DiagramElementDto updated = await base.UpdateAsync(input);
            DiagramElement updatedEntity = await Repository.GetAsync(updated.Id);
            await PersistDiagramMetadataAsync(updatedEntity, input.MetadataJson);
            return MapToEntityDto(updatedEntity);
        }

        public async Task<DiagramGraphDto> GetGraphAsync(GetDiagramGraphDto input)
        {
            DiagramElement diagram = await Repository.GetAsync(input.Id);
            await EnsureSpecBootstrappedAsync(diagram.BackendId);
            RuntimeGraph graph = await BuildRuntimeGraphAsync(diagram);
            return BuildGraphDto(diagram, graph);
        }

        public async Task<DiagramSemanticActionResultDto> ApplySemanticActionAsync(ApplyDiagramSemanticActionDto input)
        {
            DiagramElement diagram = await Repository.GetAsync(input.DiagramElementId);
            await EnsureSpecBootstrappedAsync(diagram.BackendId);
            RuntimeGraph graph = await BuildRuntimeGraphAsync(diagram);

            ApplySemanticAction(graph, input);

            DiagramValidationResultDto validation = ValidateGraph(graph, diagram.DiagramType);
            if (!validation.IsValid)
            {
                throw new UserFriendlyException(string.Join(Environment.NewLine, validation.Errors));
            }

            string metadataJson = SerializeGraph(diagram, graph);
            await PersistDiagramMetadataAsync(diagram, metadataJson);

            DiagramGraphDto graphDto = BuildGraphDto(diagram, graph);

            return new DiagramSemanticActionResultDto
            {
                Graph = graphDto,
                Validation = graphDto.Validation,
                GraphHash = graphDto.GraphHash,
                MetadataJson = diagram.MetadataJson
            };
        }

        public async Task<RenderedDiagramDto> RenderSvgAsync(RenderDiagramDto input)
        {
            DiagramElement diagram = await Repository.GetAsync(input.DiagramElementId);
            await EnsureSpecBootstrappedAsync(diagram.BackendId);
            RuntimeGraph graph = await BuildRuntimeGraphAsync(diagram);
            DiagramValidationResultDto validation = ValidateGraph(graph, diagram.DiagramType);

            if (!validation.IsValid)
            {
                throw new UserFriendlyException(string.Join(Environment.NewLine, validation.Errors));
            }

            string graphHash = ComputeGraphHash(graph);
            if (RenderCache.TryGetValue(graphHash, out RenderedDiagramDto cachedRender))
            {
                return new RenderedDiagramDto
                {
                    Svg = cachedRender.Svg,
                    GraphHash = cachedRender.GraphHash,
                    PlantUmlText = input.IncludePlantUmlText ? cachedRender.PlantUmlText : null
                };
            }

            string plantUmlText = BuildPlantUml(diagram, graph);
            string svg;
            try
            {
                svg = await RenderPlantUmlSvgAsync(plantUmlText);
            }
            catch (Exception)
            {
                svg = BuildFallbackSvg(diagram, graph);
            }

            RenderedDiagramDto render = new RenderedDiagramDto
            {
                Svg = svg,
                GraphHash = graphHash,
                PlantUmlText = input.IncludePlantUmlText ? plantUmlText : null
            };

            RenderCache[graphHash] = new RenderedDiagramDto
            {
                Svg = svg,
                GraphHash = graphHash,
                PlantUmlText = plantUmlText
            };

            return render;
        }

        private async Task<RuntimeGraph> BuildRuntimeGraphAsync(DiagramElement diagram)
        {
            SectionItem persistedItem = await FindDiagramSectionItemAsync(diagram);
            if (persistedItem != null)
            {
                PersistedDiagramSectionItemPayload sectionItemPayload = DeserializeMetadata<PersistedDiagramSectionItemPayload>(persistedItem.Content);
                if (sectionItemPayload != null && !string.IsNullOrWhiteSpace(sectionItemPayload.MetadataJson))
                {
                    return BuildRuntimeGraphFromMetadata(diagram, sectionItemPayload.MetadataJson);
                }
            }

            return BuildRuntimeGraphFromMetadata(diagram, diagram.MetadataJson);
        }

        private static RuntimeGraph BuildRuntimeGraphFromMetadata(DiagramElement diagram, string metadataJson)
        {
            if (string.IsNullOrWhiteSpace(metadataJson))
            {
                return CreateDefaultGraph(diagram);
            }

            PersistedDiagramMetadata persistedMetadata = DeserializeMetadata<PersistedDiagramMetadata>(metadataJson);
            if (persistedMetadata != null && persistedMetadata.Graph != null)
            {
                return NormalizeGraphPayload(diagram, persistedMetadata.Graph);
            }

            RuntimeGraphPayload payload = DeserializeMetadata<RuntimeGraphPayload>(metadataJson);
            if (payload != null && payload.Nodes != null && payload.Edges != null)
            {
                return NormalizeGraphPayload(diagram, payload);
            }

            return BuildLegacyGraph(diagram);
        }

        private async Task ValidateSpecSectionLinkAsync(Guid backendId, Guid? specSectionId)
        {
            if (!specSectionId.HasValue)
            {
                return;
            }

            SpecSection specSection = await _specSectionRepository.GetAsync(specSectionId.Value);
            Spec owningSpec = await _specRepository.GetAsync(specSection.SpecId);

            if (owningSpec.BackendId != backendId)
            {
                throw new UserFriendlyException("The selected diagram section does not belong to the current backend.");
            }
        }

        private async Task ValidateDiagramCreationRulesAsync(DiagramElementDto input)
        {
            if (!await IsOverviewAcceptedAsync(input.BackendId))
            {
                throw new UserFriendlyException("Accept the overview before creating diagrams.");
            }

            await EnsureSpecBootstrappedAsync(input.BackendId);

            if (input.DiagramType == DiagramType.UseCase)
            {
                await EnsureRequirementSectionAsync(input.SpecSectionId);
                return;
            }

            if (input.DiagramType != DiagramType.Activity)
            {
                return;
            }

            await EnsureRequirementSectionAsync(input.SpecSectionId);

            PersistedDiagramMetadata metadata = DeserializeMetadata<PersistedDiagramMetadata>(input.MetadataJson) ?? new PersistedDiagramMetadata();
            if (string.IsNullOrWhiteSpace(metadata.LinkedUseCaseSlug))
            {
                throw new UserFriendlyException("Activity diagrams can only be created from an existing use case.");
            }

            bool useCaseExists = await Repository.GetAll().AnyAsync(item =>
                item.BackendId == input.BackendId
                && item.DiagramType == DiagramType.UseCase
                && item.ExternalElementKey == metadata.LinkedUseCaseSlug);

            if (!useCaseExists)
            {
                throw new UserFriendlyException("Create the linked use case diagram before creating its activity diagram.");
            }
        }

        private async Task EnsureRequirementSectionAsync(Guid? specSectionId)
        {
            if (!specSectionId.HasValue)
            {
                throw new UserFriendlyException("Requirement-linked diagrams must target a requirement section.");
            }

            SpecSection section = await _specSectionRepository.GetAsync(specSectionId.Value);
            if (section.SectionType != SectionType.Requirement)
            {
                throw new UserFriendlyException("Requirement-linked diagrams must belong to a requirement section.");
            }
        }

        private async Task<bool> IsOverviewAcceptedAsync(Guid backendId)
        {
            Spec overviewSpec = await _specRepository.GetAll()
                .Where(item => item.BackendId == backendId)
                .FirstOrDefaultAsync();
            if (overviewSpec == null)
            {
                return false;
            }

            SpecSection overviewSection = await _specSectionRepository.GetAll()
                .Where(item => item.SpecId == overviewSpec.Id && item.SectionType == SectionType.Shared)
                .OrderBy(item => item.Order)
                .ThenBy(item => item.Id)
                .FirstOrDefaultAsync(item =>
                    string.Equals(item.Slug, "overview", StringComparison.OrdinalIgnoreCase)
                    || item.Slug.EndsWith("-overview", StringComparison.OrdinalIgnoreCase));

            if (overviewSection == null || string.IsNullOrWhiteSpace(overviewSection.Content))
            {
                return false;
            }

            PersistedOverviewMetadata metadata = DeserializeMetadata<PersistedOverviewMetadata>(overviewSection.Content);
            return metadata != null && metadata.IsAccepted;
        }

        private async Task EnsureSpecBootstrappedAsync(Guid backendId)
        {
            Spec spec = await _specRepository.GetAll()
                .Where(item => item.BackendId == backendId)
                .FirstOrDefaultAsync();

            if (spec == null)
            {
                throw new UserFriendlyException("Create the specification before generating diagrams.");
            }

            if (spec.Status != SpecStatus.Bootstrapped)
            {
                throw new UserFriendlyException("Complete and bootstrap the specification before generating diagrams.");
            }
        }

        private async Task PersistDiagramMetadataAsync(DiagramElement diagram, string metadataJson)
        {
            if (!diagram.SpecSectionId.HasValue)
            {
                return;
            }

            SectionItem sectionItem = await GetOrCreateDiagramSectionItemAsync(diagram);
            PersistedDiagramSectionItemPayload payload = new PersistedDiagramSectionItemPayload
            {
                DiagramType = diagram.DiagramType.ToString(),
                ExternalElementKey = diagram.ExternalElementKey,
                Name = diagram.Name,
                MetadataJson = string.IsNullOrWhiteSpace(metadataJson) ? "{}" : metadataJson
            };

            sectionItem.Content = JsonSerializer.Serialize(payload, SerializerOptions);
            await _sectionItemRepository.UpdateAsync(sectionItem);

            diagram.MetadataJson = payload.MetadataJson;
            await Repository.UpdateAsync(diagram);
        }

        private async Task<SectionItem> FindDiagramSectionItemAsync(DiagramElement diagram)
        {
            if (!diagram.SpecSectionId.HasValue)
            {
                return null;
            }

            string label = BuildDiagramSectionItemLabel(diagram);
            return await _sectionItemRepository.FirstOrDefaultAsync(item =>
                item.SpecSectionId == diagram.SpecSectionId.Value
                && item.Label == label);
        }

        private async Task<SectionItem> GetOrCreateDiagramSectionItemAsync(DiagramElement diagram)
        {
            SectionItem existingItem = await FindDiagramSectionItemAsync(diagram);
            if (existingItem != null)
            {
                existingItem.Position = existingItem.Position > 0 ? existingItem.Position : 1;
                existingItem.ItemType = SectionItemType.Paragraph;
                return existingItem;
            }

            return await _sectionItemRepository.InsertAsync(new SectionItem
            {
                SpecSectionId = diagram.SpecSectionId.Value,
                Label = BuildDiagramSectionItemLabel(diagram),
                Position = await ComputeNextItemPositionAsync(diagram.SpecSectionId.Value),
                ItemType = SectionItemType.Paragraph,
                Content = JsonSerializer.Serialize(new PersistedDiagramSectionItemPayload
                {
                    DiagramType = diagram.DiagramType.ToString(),
                    ExternalElementKey = diagram.ExternalElementKey,
                    Name = diagram.Name,
                    MetadataJson = string.IsNullOrWhiteSpace(diagram.MetadataJson) ? "{}" : diagram.MetadataJson
                }, SerializerOptions)
            });
        }

        private async Task<int> ComputeNextItemPositionAsync(Guid specSectionId)
        {
            int? maxPosition = await _sectionItemRepository.GetAll()
                .Where(item => item.SpecSectionId == specSectionId)
                .MaxAsync(item => (int?)item.Position);

            return (maxPosition ?? 0) + 1;
        }

        private static string BuildDiagramSectionItemLabel(DiagramElement diagram)
        {
            return "diagram:" + NormalizeToken(diagram.DiagramType.ToString()) + ":" + diagram.ExternalElementKey;
        }

        private static string SerializeGraph(DiagramElement diagram, RuntimeGraph graph)
        {
            PersistedDiagramMetadata metadata = DeserializeMetadata<PersistedDiagramMetadata>(diagram.MetadataJson) ?? new PersistedDiagramMetadata();
            metadata.Graph = BuildGraphPayload(graph);
            UpdatePersistedMetadataFromGraph(diagram, metadata, graph);
            return JsonSerializer.Serialize(metadata, SerializerOptions);
        }

        private static RuntimeGraphPayload BuildGraphPayload(RuntimeGraph graph)
        {
            return new RuntimeGraphPayload
            {
                Metadata = new Dictionary<string, string>(graph.Metadata),
                Nodes = graph.Nodes
                    .OrderBy(node => node.Label, StringComparer.OrdinalIgnoreCase)
                    .ThenBy(node => node.Id, StringComparer.Ordinal)
                    .Select(node => new RuntimeGraphNodePayload
                    {
                        Id = node.Id,
                        NodeType = node.NodeType,
                        Label = node.Label,
                        Description = node.Description,
                        Metadata = new Dictionary<string, string>(node.Metadata),
                        Members = node.Members
                            .OrderBy(member => member.Position)
                            .ThenBy(member => member.Id, StringComparer.Ordinal)
                            .Select(member => new RuntimeGraphMemberPayload
                            {
                                Id = member.Id,
                                MemberKind = member.MemberKind,
                                Signature = member.Signature,
                                Position = member.Position
                            })
                            .ToList()
                    })
                    .ToList(),
                Edges = graph.Edges
                    .OrderBy(edge => edge.SourceNodeId, StringComparer.Ordinal)
                    .ThenBy(edge => edge.TargetNodeId, StringComparer.Ordinal)
                    .ThenBy(edge => edge.EdgeType, StringComparer.Ordinal)
                    .ThenBy(edge => edge.Id, StringComparer.Ordinal)
                    .Select(edge => new RuntimeGraphEdgePayload
                    {
                        Id = edge.Id,
                        EdgeType = edge.EdgeType,
                        SourceNodeId = edge.SourceNodeId,
                        TargetNodeId = edge.TargetNodeId,
                        Label = edge.Label
                    })
                    .ToList()
            };
        }

        private static RuntimeGraph BuildLegacyGraph(DiagramElement diagram)
        {
            switch (diagram.DiagramType)
            {
                case DiagramType.DomainModel:
                    return BuildLegacyDomainModelGraph(diagram);
                case DiagramType.Activity:
                    return BuildLegacyActivityGraph(diagram);
                default:
                    return BuildLegacyUseCaseGraph(diagram);
            }
        }

        private static RuntimeGraph BuildLegacyUseCaseGraph(DiagramElement diagram)
        {
            LegacyUseCaseMetadata metadata = DeserializeMetadata<LegacyUseCaseMetadata>(diagram.MetadataJson) ?? new LegacyUseCaseMetadata();
            RuntimeGraph graph = CreateDefaultGraph(diagram);

            RuntimeGraphNode useCaseNode = new RuntimeGraphNode
            {
                Id = BuildStableId("node", diagram.ExternalElementKey),
                NodeType = "use-case",
                Label = diagram.Name,
                Description = metadata.Description ?? metadata.Summary ?? diagram.Name
            };

            graph.Nodes.Add(useCaseNode);

            foreach (string actor in metadata.Actors ?? new List<string>())
            {
                RuntimeGraphNode actorNode = new RuntimeGraphNode
                {
                    Id = BuildStableId("actor", actor),
                    NodeType = "actor",
                    Label = actor,
                    Description = actor
                };
                graph.Nodes.Add(actorNode);
                graph.Edges.Add(new RuntimeGraphEdge
                {
                    Id = BuildStableId("edge", actorNode.Id + ":" + useCaseNode.Id),
                    EdgeType = "actor-link",
                    SourceNodeId = actorNode.Id,
                    TargetNodeId = useCaseNode.Id,
                    Label = "participates"
                });
            }

            foreach (LegacyUseCaseDependency dependency in metadata.Dependencies ?? new List<LegacyUseCaseDependency>())
            {
                RuntimeGraphNode dependencyNode = new RuntimeGraphNode
                {
                    Id = BuildStableId("dependency", dependency.Slug ?? dependency.Name ?? Guid.NewGuid().ToString("N")),
                    NodeType = "use-case",
                    Label = dependency.Name ?? "Dependency",
                    Description = dependency.Name ?? "Dependency"
                };
                graph.Nodes.Add(dependencyNode);
                graph.Edges.Add(new RuntimeGraphEdge
                {
                    Id = BuildStableId("edge", dependencyNode.Id + ":" + useCaseNode.Id),
                    EdgeType = "dependency",
                    SourceNodeId = dependencyNode.Id,
                    TargetNodeId = useCaseNode.Id,
                    Label = "precedes"
                });
            }

            graph.Metadata["summary"] = metadata.Summary ?? diagram.Name;
            return graph;
        }

        private static RuntimeGraph BuildLegacyDomainModelGraph(DiagramElement diagram)
        {
            LegacyDomainMetadata metadata = DeserializeMetadata<LegacyDomainMetadata>(diagram.MetadataJson) ?? new LegacyDomainMetadata();
            RuntimeGraph graph = CreateDefaultGraph(diagram);

            foreach (LegacyDomainEntity entity in metadata.Entities ?? new List<LegacyDomainEntity>())
            {
                RuntimeGraphNode node = new RuntimeGraphNode
                {
                    Id = string.IsNullOrWhiteSpace(entity.Id) ? BuildStableId("entity", entity.Name) : entity.Id,
                    NodeType = "entity",
                    Label = entity.Name,
                    Description = entity.Description ?? entity.Name,
                    Members = (entity.Attributes ?? new List<string>())
                        .Select((attribute, index) => new RuntimeGraphMember
                        {
                            Id = BuildStableId("member", entity.Name + ":" + attribute),
                            MemberKind = "property",
                            Signature = attribute,
                            Position = index + 1
                        })
                        .ToList()
                };
                graph.Nodes.Add(node);
            }

            foreach (LegacyDomainRelationship relationship in metadata.Relationships ?? new List<LegacyDomainRelationship>())
            {
                string sourceId = graph.Nodes.FirstOrDefault(node => string.Equals(node.Label, relationship.Source, StringComparison.OrdinalIgnoreCase))?.Id
                    ?? BuildStableId("entity", relationship.Source);
                string targetId = graph.Nodes.FirstOrDefault(node => string.Equals(node.Label, relationship.Target, StringComparison.OrdinalIgnoreCase))?.Id
                    ?? BuildStableId("entity", relationship.Target);

                graph.Edges.Add(new RuntimeGraphEdge
                {
                    Id = string.IsNullOrWhiteSpace(relationship.Id) ? BuildStableId("edge", sourceId + ":" + targetId + ":" + relationship.Label) : relationship.Id,
                    EdgeType = "association",
                    SourceNodeId = sourceId,
                    TargetNodeId = targetId,
                    Label = relationship.Label ?? "relates"
                });
            }

            return graph;
        }

        private static RuntimeGraph BuildLegacyActivityGraph(DiagramElement diagram)
        {
            LegacyUseCaseMetadata metadata = DeserializeMetadata<LegacyUseCaseMetadata>(diagram.MetadataJson) ?? new LegacyUseCaseMetadata();
            RuntimeGraph graph = CreateDefaultGraph(diagram);

            RuntimeGraphNode startNode = new RuntimeGraphNode
            {
                Id = BuildStableId("node", diagram.ExternalElementKey + ":start"),
                NodeType = "start",
                Label = "Start",
                Description = "Entry point"
            };

            RuntimeGraphNode actionNode = new RuntimeGraphNode
            {
                Id = BuildStableId("node", diagram.ExternalElementKey + ":action"),
                NodeType = "action",
                Label = diagram.Name,
                Description = metadata.Description ?? metadata.Summary ?? diagram.Name
            };

            RuntimeGraphNode endNode = new RuntimeGraphNode
            {
                Id = BuildStableId("node", diagram.ExternalElementKey + ":end"),
                NodeType = "end",
                Label = "End",
                Description = "Exit point"
            };

            graph.Nodes.Add(startNode);
            graph.Nodes.Add(actionNode);
            graph.Nodes.Add(endNode);
            graph.Edges.Add(new RuntimeGraphEdge
            {
                Id = BuildStableId("edge", startNode.Id + ":" + actionNode.Id),
                EdgeType = "flow",
                SourceNodeId = startNode.Id,
                TargetNodeId = actionNode.Id,
                Label = "begin"
            });
            graph.Edges.Add(new RuntimeGraphEdge
            {
                Id = BuildStableId("edge", actionNode.Id + ":" + endNode.Id),
                EdgeType = "flow",
                SourceNodeId = actionNode.Id,
                TargetNodeId = endNode.Id,
                Label = "complete"
            });

            return graph;
        }

        private static RuntimeGraph CreateDefaultGraph(DiagramElement diagram)
        {
            return new RuntimeGraph
            {
                Metadata = new Dictionary<string, string>
                {
                    ["diagramName"] = diagram.Name,
                    ["diagramType"] = diagram.DiagramType.ToString()
                }
            };
        }

        private static RuntimeGraph NormalizeGraphPayload(DiagramElement diagram, RuntimeGraphPayload payload)
        {
            RuntimeGraph graph = CreateDefaultGraph(diagram);
            foreach (KeyValuePair<string, string> entry in payload.Metadata ?? new Dictionary<string, string>())
            {
                graph.Metadata[entry.Key] = entry.Value;
            }

            foreach (RuntimeGraphNodePayload node in payload.Nodes ?? new List<RuntimeGraphNodePayload>())
            {
                graph.Nodes.Add(new RuntimeGraphNode
                {
                    Id = string.IsNullOrWhiteSpace(node.Id) ? BuildStableId("node", node.Label) : node.Id,
                    NodeType = string.IsNullOrWhiteSpace(node.NodeType) ? ResolveDefaultNodeType(diagram.DiagramType) : node.NodeType,
                    Label = node.Label ?? "Untitled",
                    Description = node.Description ?? node.Label ?? "Untitled",
                    Metadata = node.Metadata ?? new Dictionary<string, string>(),
                    Members = (node.Members ?? new List<RuntimeGraphMemberPayload>())
                        .Select(member => new RuntimeGraphMember
                        {
                            Id = string.IsNullOrWhiteSpace(member.Id) ? BuildStableId("member", member.Signature) : member.Id,
                            MemberKind = string.IsNullOrWhiteSpace(member.MemberKind) ? "property" : member.MemberKind,
                            Signature = member.Signature ?? string.Empty,
                            Position = member.Position > 0 ? member.Position : 1
                        })
                        .OrderBy(member => member.Position)
                        .ThenBy(member => member.Id, StringComparer.Ordinal)
                        .ToList()
                });
            }

            foreach (RuntimeGraphEdgePayload edge in payload.Edges ?? new List<RuntimeGraphEdgePayload>())
            {
                graph.Edges.Add(new RuntimeGraphEdge
                {
                    Id = string.IsNullOrWhiteSpace(edge.Id) ? BuildStableId("edge", edge.SourceNodeId + ":" + edge.TargetNodeId) : edge.Id,
                    EdgeType = string.IsNullOrWhiteSpace(edge.EdgeType) ? ResolveDefaultEdgeType(diagram.DiagramType) : edge.EdgeType,
                    SourceNodeId = edge.SourceNodeId ?? string.Empty,
                    TargetNodeId = edge.TargetNodeId ?? string.Empty,
                    Label = edge.Label ?? string.Empty
                });
            }

            return graph;
        }

        private static string ResolveDefaultNodeType(DiagramType diagramType)
        {
            switch (diagramType)
            {
                case DiagramType.DomainModel:
                    return "entity";
                case DiagramType.Activity:
                    return "action";
                default:
                    return "use-case";
            }
        }

        private static string ResolveDefaultEdgeType(DiagramType diagramType)
        {
            switch (diagramType)
            {
                case DiagramType.DomainModel:
                    return "association";
                case DiagramType.Activity:
                    return "flow";
                default:
                    return "dependency";
            }
        }

        private static T DeserializeMetadata<T>(string value)
            where T : class
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            try
            {
                return JsonSerializer.Deserialize<T>(value, SerializerOptions);
            }
            catch
            {
                return null;
            }
        }

        private static DiagramGraphDto BuildGraphDto(DiagramElement diagram, RuntimeGraph graph)
        {
            DiagramValidationResultDto validation = ValidateGraph(graph, diagram.DiagramType);
            return new DiagramGraphDto
            {
                DiagramElementId = diagram.Id,
                Name = diagram.Name,
                DiagramType = diagram.DiagramType,
                Nodes = graph.Nodes
                    .OrderBy(node => node.Label, StringComparer.OrdinalIgnoreCase)
                    .ThenBy(node => node.Id, StringComparer.Ordinal)
                    .Select(node => new DiagramGraphNodeDto
                    {
                        Id = node.Id,
                        NodeType = node.NodeType,
                        Label = node.Label,
                        Description = node.Description,
                        Metadata = new Dictionary<string, string>(node.Metadata),
                        Members = node.Members
                            .OrderBy(member => member.Position)
                            .ThenBy(member => member.Id, StringComparer.Ordinal)
                            .Select(member => new DiagramGraphMemberDto
                            {
                                Id = member.Id,
                                MemberKind = member.MemberKind,
                                Signature = member.Signature,
                                Position = member.Position
                            })
                            .ToList()
                    })
                    .ToList(),
                Edges = graph.Edges
                    .OrderBy(edge => edge.SourceNodeId, StringComparer.Ordinal)
                    .ThenBy(edge => edge.TargetNodeId, StringComparer.Ordinal)
                    .ThenBy(edge => edge.EdgeType, StringComparer.Ordinal)
                    .ThenBy(edge => edge.Id, StringComparer.Ordinal)
                    .Select(edge => new DiagramGraphEdgeDto
                    {
                        Id = edge.Id,
                        EdgeType = edge.EdgeType,
                        SourceNodeId = edge.SourceNodeId,
                        TargetNodeId = edge.TargetNodeId,
                        Label = edge.Label
                    })
                    .ToList(),
                Metadata = new Dictionary<string, string>(graph.Metadata),
                GraphHash = ComputeGraphHash(graph),
                Validation = validation
            };
        }

        private static void ApplySemanticAction(RuntimeGraph graph, ApplyDiagramSemanticActionDto input)
        {
            string actionType = NormalizeToken(input.ActionType);
            string targetKind = NormalizeToken(input.TargetKind);

            if (actionType == "create" && targetKind == "node")
            {
                graph.Nodes.Add(new RuntimeGraphNode
                {
                    Id = string.IsNullOrWhiteSpace(input.TargetId) ? BuildStableId("node", Guid.NewGuid().ToString("N")) : input.TargetId,
                    NodeType = string.IsNullOrWhiteSpace(input.NodeType) ? "entity" : input.NodeType,
                    Label = string.IsNullOrWhiteSpace(input.Value) ? "Untitled" : input.Value.Trim(),
                    Description = string.IsNullOrWhiteSpace(input.Value) ? "Untitled" : input.Value.Trim()
                });
                return;
            }

            if (actionType == "update" && targetKind == "node")
            {
                RuntimeGraphNode node = GetRequiredNode(graph, input.TargetId);
                string nextValue = string.IsNullOrWhiteSpace(input.Value) ? node.Label : input.Value.Trim();
                node.Label = nextValue;
                node.Description = nextValue;
                if (!string.IsNullOrWhiteSpace(input.NodeType))
                {
                    node.NodeType = input.NodeType.Trim();
                }

                return;
            }

            if (actionType == "delete" && targetKind == "node")
            {
                RuntimeGraphNode node = GetRequiredNode(graph, input.TargetId);
                graph.Nodes.Remove(node);
                graph.Edges.RemoveAll(edge => edge.SourceNodeId == node.Id || edge.TargetNodeId == node.Id);
                return;
            }

            if (actionType == "create" && targetKind == "member")
            {
                RuntimeGraphNode node = GetRequiredNode(graph, input.TargetId);
                int nextPosition = node.Members.Count == 0 ? 1 : node.Members.Max(member => member.Position) + 1;
                node.Members.Add(new RuntimeGraphMember
                {
                    Id = string.IsNullOrWhiteSpace(input.RelatedId) ? BuildStableId("member", Guid.NewGuid().ToString("N")) : input.RelatedId,
                    MemberKind = string.IsNullOrWhiteSpace(input.MemberKind) ? "property" : input.MemberKind.Trim(),
                    Signature = string.IsNullOrWhiteSpace(input.Value) ? string.Empty : input.Value.Trim(),
                    Position = nextPosition
                });
                return;
            }

            if (actionType == "update" && targetKind == "member")
            {
                RuntimeGraphNode node = GetRequiredNode(graph, input.TargetId);
                RuntimeGraphMember member = GetRequiredMember(node, input.RelatedId);
                member.Signature = string.IsNullOrWhiteSpace(input.Value) ? member.Signature : input.Value.Trim();
                if (!string.IsNullOrWhiteSpace(input.MemberKind))
                {
                    member.MemberKind = input.MemberKind.Trim();
                }

                return;
            }

            if (actionType == "delete" && targetKind == "member")
            {
                RuntimeGraphNode node = GetRequiredNode(graph, input.TargetId);
                RuntimeGraphMember member = GetRequiredMember(node, input.RelatedId);
                node.Members.Remove(member);
                return;
            }

            if (actionType == "create" && targetKind == "edge")
            {
                RuntimeGraphNode sourceNode = GetRequiredNode(graph, input.TargetId);
                RuntimeGraphNode targetNode = GetRequiredNode(graph, input.RelatedId);
                graph.Edges.Add(new RuntimeGraphEdge
                {
                    Id = BuildStableId("edge", sourceNode.Id + ":" + targetNode.Id + ":" + Guid.NewGuid().ToString("N")),
                    EdgeType = string.IsNullOrWhiteSpace(input.EdgeType) ? "association" : input.EdgeType.Trim(),
                    SourceNodeId = sourceNode.Id,
                    TargetNodeId = targetNode.Id,
                    Label = string.IsNullOrWhiteSpace(input.Value) ? string.Empty : input.Value.Trim()
                });
                return;
            }

            if (actionType == "update" && targetKind == "edge")
            {
                RuntimeGraphEdge edge = GetRequiredEdge(graph, input.TargetId);
                edge.Label = string.IsNullOrWhiteSpace(input.Value) ? edge.Label : input.Value.Trim();
                if (!string.IsNullOrWhiteSpace(input.EdgeType))
                {
                    edge.EdgeType = input.EdgeType.Trim();
                }

                return;
            }

            if (actionType == "delete" && targetKind == "edge")
            {
                RuntimeGraphEdge edge = GetRequiredEdge(graph, input.TargetId);
                graph.Edges.Remove(edge);
                return;
            }

            throw new UserFriendlyException("Unsupported diagram semantic action.");
        }

        private static DiagramValidationResultDto ValidateGraph(RuntimeGraph graph, DiagramType diagramType)
        {
            DiagramValidationResultDto validation = new DiagramValidationResultDto
            {
                IsValid = true
            };

            Dictionary<string, RuntimeGraphNode> nodeMap = new Dictionary<string, RuntimeGraphNode>(StringComparer.Ordinal);
            DiagramRuleSet ruleSet = GetRuleSet(diagramType);

            foreach (RuntimeGraphNode node in graph.Nodes)
            {
                if (string.IsNullOrWhiteSpace(node.Id) || string.IsNullOrWhiteSpace(node.Label))
                {
                    validation.Errors.Add("Every diagram node must have an id and label.");
                    continue;
                }

                if (!ruleSet.AllowedNodeTypes.Contains(NormalizeToken(node.NodeType)))
                {
                    validation.Errors.Add("Node type '" + node.NodeType + "' is not allowed for this diagram.");
                }

                if (nodeMap.ContainsKey(node.Id))
                {
                    validation.Errors.Add("Duplicate node id '" + node.Id + "' was found.");
                }
                else
                {
                    nodeMap[node.Id] = node;
                }

                foreach (RuntimeGraphMember member in node.Members)
                {
                    if (!ruleSet.AllowedMemberKinds.Contains(NormalizeToken(member.MemberKind)))
                    {
                        validation.Errors.Add("Member kind '" + member.MemberKind + "' is not allowed for this diagram.");
                    }
                }
            }

            foreach (RuntimeGraphEdge edge in graph.Edges)
            {
                if (!nodeMap.ContainsKey(edge.SourceNodeId) || !nodeMap.ContainsKey(edge.TargetNodeId))
                {
                    validation.Errors.Add("Every edge must reference existing source and target nodes.");
                    continue;
                }

                if (!ruleSet.AllowedEdgeTypes.Contains(NormalizeToken(edge.EdgeType)))
                {
                    validation.Errors.Add("Edge type '" + edge.EdgeType + "' is not allowed for this diagram.");
                }
            }

            if (!ruleSet.AllowsCycles)
            {
                List<string> cycleNodes = DetectCycle(graph);
                if (cycleNodes.Count > 0)
                {
                    validation.Errors.Add("Cycle detected in diagram path: " + string.Join(" -> ", cycleNodes));
                }
            }

            validation.IsValid = validation.Errors.Count == 0;
            return validation;
        }

        private static List<string> DetectCycle(RuntimeGraph graph)
        {
            Dictionary<string, List<string>> adjacency = graph.Edges
                .GroupBy(edge => edge.SourceNodeId, StringComparer.Ordinal)
                .ToDictionary(group => group.Key, group => group.Select(edge => edge.TargetNodeId).OrderBy(id => id, StringComparer.Ordinal).ToList(), StringComparer.Ordinal);
            HashSet<string> visited = new HashSet<string>(StringComparer.Ordinal);
            HashSet<string> active = new HashSet<string>(StringComparer.Ordinal);
            List<string> stack = new List<string>();

            foreach (RuntimeGraphNode node in graph.Nodes.OrderBy(item => item.Id, StringComparer.Ordinal))
            {
                if (Visit(node.Id, adjacency, visited, active, stack))
                {
                    stack.Reverse();
                    return stack;
                }
            }

            return new List<string>();
        }

        private static bool Visit(
            string nodeId,
            Dictionary<string, List<string>> adjacency,
            HashSet<string> visited,
            HashSet<string> active,
            List<string> stack)
        {
            if (active.Contains(nodeId))
            {
                stack.Add(nodeId);
                return true;
            }

            if (visited.Contains(nodeId))
            {
                return false;
            }

            visited.Add(nodeId);
            active.Add(nodeId);

            if (adjacency.TryGetValue(nodeId, out List<string> nextNodes))
            {
                foreach (string nextNode in nextNodes)
                {
                    if (Visit(nextNode, adjacency, visited, active, stack))
                    {
                        stack.Add(nodeId);
                        return true;
                    }
                }
            }

            active.Remove(nodeId);
            return false;
        }

        private static DiagramRuleSet GetRuleSet(DiagramType diagramType)
        {
            switch (diagramType)
            {
                case DiagramType.DomainModel:
                    return new DiagramRuleSet
                    {
                        AllowedNodeTypes = new HashSet<string>(new[] { "entity" }, StringComparer.Ordinal),
                        AllowedEdgeTypes = new HashSet<string>(new[] { "association", "composition", "inheritance", "dependency" }, StringComparer.Ordinal),
                        AllowedMemberKinds = new HashSet<string>(new[] { "property", "function" }, StringComparer.Ordinal),
                        AllowsCycles = true
                    };
                case DiagramType.Activity:
                    return new DiagramRuleSet
                    {
                        AllowedNodeTypes = new HashSet<string>(new[] { "start", "action", "decision", "end" }, StringComparer.Ordinal),
                        AllowedEdgeTypes = new HashSet<string>(new[] { "flow" }, StringComparer.Ordinal),
                        AllowedMemberKinds = new HashSet<string>(StringComparer.Ordinal),
                        AllowsCycles = false
                    };
                default:
                    return new DiagramRuleSet
                    {
                        AllowedNodeTypes = new HashSet<string>(new[] { "actor", "use-case" }, StringComparer.Ordinal),
                        AllowedEdgeTypes = new HashSet<string>(new[] { "actor-link", "dependency" }, StringComparer.Ordinal),
                        AllowedMemberKinds = new HashSet<string>(StringComparer.Ordinal),
                        AllowsCycles = false
                    };
            }
        }

        private static string ComputeGraphHash(RuntimeGraph graph)
        {
            string serializedGraph = JsonSerializer.Serialize(BuildGraphPayload(graph), SerializerOptions);
            byte[] data = SHA256.HashData(Encoding.UTF8.GetBytes(serializedGraph));
            return Convert.ToHexString(data);
        }

        private static void UpdatePersistedMetadataFromGraph(DiagramElement diagram, PersistedDiagramMetadata metadata, RuntimeGraph graph)
        {
            metadata.Summary = !string.IsNullOrWhiteSpace(metadata.Summary) ? metadata.Summary : diagram.Name;
            metadata.Description = !string.IsNullOrWhiteSpace(metadata.Description) ? metadata.Description : diagram.Name;

            switch (diagram.DiagramType)
            {
                case DiagramType.DomainModel:
                    metadata.Entities = graph.Nodes
                        .OrderBy(node => node.Label, StringComparer.OrdinalIgnoreCase)
                        .ThenBy(node => node.Id, StringComparer.Ordinal)
                        .Select(node => new LegacyDomainEntity
                        {
                            Id = node.Id,
                            Name = node.Label,
                            Description = node.Description,
                            Attributes = node.Members
                                .OrderBy(member => member.Position)
                                .ThenBy(member => member.Id, StringComparer.Ordinal)
                                .Select(member => member.Signature)
                                .ToList()
                        })
                        .ToList();
                    metadata.Relationships = graph.Edges
                        .OrderBy(edge => edge.SourceNodeId, StringComparer.Ordinal)
                        .ThenBy(edge => edge.TargetNodeId, StringComparer.Ordinal)
                        .Select(edge => new LegacyDomainRelationship
                        {
                            Id = edge.Id,
                            Source = graph.Nodes.FirstOrDefault(node => node.Id == edge.SourceNodeId)?.Label ?? edge.SourceNodeId,
                            Target = graph.Nodes.FirstOrDefault(node => node.Id == edge.TargetNodeId)?.Label ?? edge.TargetNodeId,
                            Label = edge.Label
                        })
                        .ToList();
                    break;
                case DiagramType.Activity:
                    metadata.Description = graph.Nodes.FirstOrDefault(node => NormalizeToken(node.NodeType) == "action")?.Description ?? metadata.Description;
                    break;
                default:
                    metadata.Actors = graph.Nodes
                        .Where(node => NormalizeToken(node.NodeType) == "actor")
                        .OrderBy(node => node.Label, StringComparer.OrdinalIgnoreCase)
                        .ThenBy(node => node.Id, StringComparer.Ordinal)
                        .Select(node => node.Label)
                        .ToList();
                    metadata.Dependencies = graph.Edges
                        .Where(edge => NormalizeToken(edge.EdgeType) == "dependency")
                        .OrderBy(edge => edge.SourceNodeId, StringComparer.Ordinal)
                        .ThenBy(edge => edge.TargetNodeId, StringComparer.Ordinal)
                        .Select(edge => new LegacyUseCaseDependency
                        {
                            Slug = GetNodeMetadataValue(graph.Nodes.FirstOrDefault(node => node.Id == edge.SourceNodeId), "slug") ?? edge.SourceNodeId,
                            Name = graph.Nodes.FirstOrDefault(node => node.Id == edge.SourceNodeId)?.Label ?? edge.SourceNodeId
                        })
                        .ToList();
                    metadata.Description = graph.Nodes.FirstOrDefault(node => NormalizeToken(node.NodeType) == "use-case")?.Description ?? metadata.Description;
                    break;
            }
        }

        // =====================================================================
        // PlantUML Builders — each diagram type uses its own correct syntax.
        //
        // Use Case  → declarative alias syntax  (@startuml usecase)
        // Domain    → declarative class syntax  (@startuml class)
        // Activity  → imperative flow syntax    (@startuml activity / beta)
        //
        // NEVER mix alias-declaration syntax with activity flow syntax.
        // Activity diagrams are walked edge-by-edge; nodes are NOT pre-declared.
        // =====================================================================

        private static string BuildPlantUml(DiagramElement diagram, RuntimeGraph graph)
        {
            switch (diagram.DiagramType)
            {
                case DiagramType.DomainModel:
                    return BuildDomainPlantUml(diagram, graph);
                case DiagramType.Activity:
                    return BuildActivityPlantUml(diagram, graph);
                default:
                    return BuildUseCasePlantUml(diagram, graph);
            }
        }

        // -----------------------------------------------------------------------
        // Use Case — declarative alias syntax. Actors use `actor`, use-cases use
        // `usecase`. Both support [[link]] hyperlinks. Arrows use --> and ..>.
        // -----------------------------------------------------------------------
        private static string BuildUseCasePlantUml(DiagramElement diagram, RuntimeGraph graph)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("@startuml");
            builder.AppendLine("left to right direction");
            builder.AppendLine("skinparam svgLinkTarget _top");
            builder.AppendLine("skinparam shadowing false");
            builder.AppendLine("title " + EscapePlantUml(diagram.Name));
            builder.AppendLine();

            // Wrap all use-case nodes in a system rectangle so PlantUML
            // correctly separates actors (outside) from use cases (inside).
            List<RuntimeGraphNode> useCaseNodes = graph.Nodes
                .Where(n => NormalizeToken(n.NodeType) == "use-case")
                .OrderBy(n => n.Label, StringComparer.OrdinalIgnoreCase)
                .ThenBy(n => n.Id, StringComparer.Ordinal)
                .ToList();

            List<RuntimeGraphNode> actorNodes = graph.Nodes
                .Where(n => NormalizeToken(n.NodeType) == "actor")
                .OrderBy(n => n.Label, StringComparer.OrdinalIgnoreCase)
                .ThenBy(n => n.Id, StringComparer.Ordinal)
                .ToList();

            // Declare actors outside the rectangle
            foreach (RuntimeGraphNode node in actorNodes)
            {
                string alias = BuildPlantUmlAlias(node.Id);
                string link = BuildSemanticLink("node", node.Id);
                builder.AppendLine("actor \"" + EscapePlantUml(node.Label) + "\" as " + alias + " [[" + link + "]]");
            }

            builder.AppendLine();

            // Wrap use cases in a system boundary rectangle
            builder.AppendLine("rectangle \"" + EscapePlantUml(diagram.Name) + "\" {");
            foreach (RuntimeGraphNode node in useCaseNodes)
            {
                string alias = BuildPlantUmlAlias(node.Id);
                string link = BuildSemanticLink("node", node.Id);
                builder.AppendLine("  usecase \"" + EscapePlantUml(node.Label) + "\" as " + alias + " [[" + link + "]]");
            }
            builder.AppendLine("}");
            builder.AppendLine();

            // Edges
            foreach (RuntimeGraphEdge edge in graph.Edges
                .OrderBy(e => e.SourceNodeId, StringComparer.Ordinal)
                .ThenBy(e => e.TargetNodeId, StringComparer.Ordinal))
            {
                string arrow = NormalizeToken(edge.EdgeType) == "actor-link" ? "-->" : "..>";
                string label = string.IsNullOrWhiteSpace(edge.Label) ? string.Empty : " : " + EscapePlantUml(edge.Label);
                builder.AppendLine(BuildPlantUmlAlias(edge.SourceNodeId) + " " + arrow + " " + BuildPlantUmlAlias(edge.TargetNodeId) + label);
            }

            builder.AppendLine("@enduml");
            return builder.ToString();
        }

        // -----------------------------------------------------------------------
        // Domain Model — class diagram syntax. Each entity becomes a `class` block
        // with members listed inside. Relationship arrows map to PlantUML
        // association/composition/inheritance/dependency arrows.
        // -----------------------------------------------------------------------
        private static string BuildDomainPlantUml(DiagramElement diagram, RuntimeGraph graph)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("@startuml");
            builder.AppendLine("skinparam svgLinkTarget _top");
            builder.AppendLine("skinparam shadowing false");
            builder.AppendLine("hide empty members");
            builder.AppendLine("title " + EscapePlantUml(diagram.Name));
            builder.AppendLine();

            foreach (RuntimeGraphNode node in graph.Nodes
                .OrderBy(n => n.Label, StringComparer.OrdinalIgnoreCase)
                .ThenBy(n => n.Id, StringComparer.Ordinal))
            {
                string alias = BuildPlantUmlAlias(node.Id);
                string link = BuildSemanticLink("node", node.Id);
                builder.AppendLine("class \"" + EscapePlantUml(node.Label) + "\" as " + alias + " [[" + link + "]] {");
                foreach (RuntimeGraphMember member in node.Members
                    .OrderBy(m => m.Position)
                    .ThenBy(m => m.Id, StringComparer.Ordinal))
                {
                    // Prefix with + (property) or ~ (function) so PlantUML renders
                    // the correct visibility icon without needing the user to type it.
                    string prefix = NormalizeToken(member.MemberKind) == "function" ? "~ " : "+ ";
                    builder.AppendLine("  " + prefix + EscapePlantUml(member.Signature));
                }
                builder.AppendLine("}");
            }

            builder.AppendLine();

            foreach (RuntimeGraphEdge edge in graph.Edges
                .OrderBy(e => e.SourceNodeId, StringComparer.Ordinal)
                .ThenBy(e => e.TargetNodeId, StringComparer.Ordinal))
            {
                string arrow = BuildDomainArrow(edge.EdgeType);
                string label = string.IsNullOrWhiteSpace(edge.Label) ? string.Empty : " : " + EscapePlantUml(edge.Label);
                builder.AppendLine(BuildPlantUmlAlias(edge.SourceNodeId) + " " + arrow + " " + BuildPlantUmlAlias(edge.TargetNodeId) + label);
            }

            builder.AppendLine("@enduml");
            return builder.ToString();
        }

        // -----------------------------------------------------------------------
        // Activity — imperative beta-syntax. Nodes are NOT pre-declared with
        // aliases. Instead the graph is walked edge-by-edge and PlantUML keywords
        // are emitted inline:
        //
        //   start          → start node
        //   :Label;        → action node  (semicolon required)
        //   if (q) then    → decision node outgoing yes-branch
        //   else (no)      → decision node outgoing no-branch
        //   endif          → closes a decision block
        //   stop           → end node
        //
        // [[link]] is embedded directly inside the label string so semantic
        // hyperlinks survive the renderer.
        //
        // Decision nodes with exactly two outgoing edges are split into yes/no
        // branches. All other multi-outgoing cases fall back to sequential flow.
        // -----------------------------------------------------------------------
        private static string BuildActivityPlantUml(DiagramElement diagram, RuntimeGraph graph)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("@startuml");
            builder.AppendLine("skinparam svgLinkTarget _top");
            builder.AppendLine("skinparam shadowing false");
            builder.AppendLine("skinparam ActivityBorderColor #555555");
            builder.AppendLine("skinparam ActivityBackgroundColor #f8f8f8");
            builder.AppendLine("title " + EscapePlantUml(diagram.Name));
            builder.AppendLine();

            // Index nodes and build an adjacency list keyed by source node id.
            Dictionary<string, RuntimeGraphNode> nodeById = graph.Nodes
                .ToDictionary(n => n.Id, n => n, StringComparer.Ordinal);

            Dictionary<string, List<RuntimeGraphEdge>> outgoing = graph.Edges
                .GroupBy(e => e.SourceNodeId, StringComparer.Ordinal)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderBy(e => e.TargetNodeId, StringComparer.Ordinal).ToList(),
                    StringComparer.Ordinal);

            // Walk the graph starting from the start node following edges in order.
            // Visited guards against infinite loops on malformed graphs that passed
            // the cycle-free validation (edge cases with disconnected subgraphs).
            HashSet<string> visited = new HashSet<string>(StringComparer.Ordinal);

            RuntimeGraphNode startNode = graph.Nodes
                .FirstOrDefault(n => NormalizeToken(n.NodeType) == "start");

            if (startNode != null)
            {
                builder.AppendLine("start");
                EmitActivityNode(builder, startNode, nodeById, outgoing, visited, indent: "");
            }
            else
            {
                // No explicit start node — emit all action nodes in label order.
                builder.AppendLine("start");
                foreach (RuntimeGraphNode node in graph.Nodes
                    .Where(n => NormalizeToken(n.NodeType) != "end")
                    .OrderBy(n => n.Label, StringComparer.OrdinalIgnoreCase)
                    .ThenBy(n => n.Id, StringComparer.Ordinal))
                {
                    string link = BuildSemanticLink("node", node.Id);
                    builder.AppendLine(":" + EscapePlantUml(node.Label) + " [[" + link + "]];");
                }
                builder.AppendLine("stop");
            }

            builder.AppendLine("@enduml");
            return builder.ToString();
        }

        // Recursive walker that emits each node in correct PlantUML activity syntax.
        private static void EmitActivityNode(
            StringBuilder builder,
            RuntimeGraphNode node,
            Dictionary<string, RuntimeGraphNode> nodeById,
            Dictionary<string, List<RuntimeGraphEdge>> outgoing,
            HashSet<string> visited,
            string indent)
        {
            if (visited.Contains(node.Id))
            {
                return;
            }

            visited.Add(node.Id);

            string nodeType = NormalizeToken(node.NodeType);
            string link = BuildSemanticLink("node", node.Id);

            // start nodes have already emitted `start` before this call.
            if (nodeType == "start")
            {
                // Immediately follow start edges without emitting another keyword.
                if (outgoing.TryGetValue(node.Id, out List<RuntimeGraphEdge> startEdges))
                {
                    foreach (RuntimeGraphEdge edge in startEdges)
                    {
                        if (nodeById.TryGetValue(edge.TargetNodeId, out RuntimeGraphNode next))
                        {
                            EmitActivityNode(builder, next, nodeById, outgoing, visited, indent);
                        }
                    }
                }
                return;
            }

            if (nodeType == "end")
            {
                builder.AppendLine(indent + "stop");
                return;
            }

            if (nodeType == "decision")
            {
                // Decision nodes branch on their outgoing edges.
                // First edge = yes branch, second edge = no branch (if present).
                outgoing.TryGetValue(node.Id, out List<RuntimeGraphEdge> decisionEdges);
                List<RuntimeGraphEdge> branches = decisionEdges ?? new List<RuntimeGraphEdge>();

                string condition = EscapePlantUml(node.Label);
                string yesLabel = branches.Count > 0 && !string.IsNullOrWhiteSpace(branches[0].Label)
                    ? EscapePlantUml(branches[0].Label) : "yes";
                string noLabel = branches.Count > 1 && !string.IsNullOrWhiteSpace(branches[1].Label)
                    ? EscapePlantUml(branches[1].Label) : "no";

                builder.AppendLine(indent + "if (" + condition + ") then (" + yesLabel + ")");

                if (branches.Count > 0 && nodeById.TryGetValue(branches[0].TargetNodeId, out RuntimeGraphNode yesBranch))
                {
                    EmitActivityNode(builder, yesBranch, nodeById, outgoing, visited, indent + "  ");
                }

                if (branches.Count > 1)
                {
                    builder.AppendLine(indent + "else (" + noLabel + ")");
                    if (nodeById.TryGetValue(branches[1].TargetNodeId, out RuntimeGraphNode noBranch))
                    {
                        EmitActivityNode(builder, noBranch, nodeById, outgoing, visited, indent + "  ");
                    }
                }

                builder.AppendLine(indent + "endif");
                return;
            }

            // Default: action node — emit as :Label [[link]];
            builder.AppendLine(indent + ":" + EscapePlantUml(node.Label) + " [[" + link + "]];");

            // Follow outgoing edges sequentially.
            if (outgoing.TryGetValue(node.Id, out List<RuntimeGraphEdge> nextEdges))
            {
                foreach (RuntimeGraphEdge edge in nextEdges)
                {
                    if (nodeById.TryGetValue(edge.TargetNodeId, out RuntimeGraphNode next))
                    {
                        EmitActivityNode(builder, next, nodeById, outgoing, visited, indent);
                    }
                }
            }
        }

        private static string BuildDomainArrow(string edgeType)
        {
            switch (NormalizeToken(edgeType))
            {
                case "inheritance":
                    return "--|>";
                case "composition":
                    return "*--";
                case "dependency":
                    return "..>";
                default:
                    return "-->";
            }
        }

        private static string BuildPlantUmlAlias(string value)
        {
            StringBuilder builder = new StringBuilder("n_");
            foreach (char character in value ?? string.Empty)
            {
                builder.Append(char.IsLetterOrDigit(character) ? character : '_');
            }

            return builder.ToString();
        }

        private static string BuildSemanticLink(string kind, string id)
        {
            return "seespec://" + kind + "/" + Uri.EscapeDataString(id);
        }

        private static string EscapePlantUml(string value)
        {
            return (value ?? string.Empty).Replace("\"", "\\\"");
        }

        private static async Task<string> RenderPlantUmlSvgAsync(string plantUmlText)
        {
            string jarPath = Environment.GetEnvironmentVariable("PLANTUML_JAR_PATH");
            if (!string.IsNullOrWhiteSpace(jarPath))
            {
                return await ExecuteRendererAsync("java", "-jar \"" + jarPath + "\" -tsvg -pipe", plantUmlText);
            }

            return await ExecuteRendererAsync("plantuml", "-tsvg -pipe", plantUmlText);
        }

        private static async Task<string> ExecuteRendererAsync(string fileName, string arguments, string input)
        {
            ProcessStartInfo startInfo = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            try
            {
                using (Process process = new Process { StartInfo = startInfo })
                {
                    process.Start();
                    await process.StandardInput.WriteAsync(input);
                    process.StandardInput.Close();

                    string output = await process.StandardOutput.ReadToEndAsync();
                    string error = await process.StandardError.ReadToEndAsync();
                    await process.WaitForExitAsync();

                    if (process.ExitCode != 0 || string.IsNullOrWhiteSpace(output))
                    {
                        throw new UserFriendlyException("PlantUML rendering failed." + (string.IsNullOrWhiteSpace(error) ? string.Empty : " " + error));
                    }

                    return output;
                }
            }
            catch (Win32Exception)
            {
                throw new UserFriendlyException("PlantUML renderer is not available. Configure PLANTUML_JAR_PATH or install the plantuml command.");
            }
        }

        private static string BuildFallbackSvg(DiagramElement diagram, RuntimeGraph graph)
        {
            const int width = 920;
            int nodeCount = Math.Max(graph.Nodes.Count, 1);
            int height = Math.Max(260, 120 + (nodeCount * 96));
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            builder.AppendLine("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + width + "\" height=\"" + height + "\" viewBox=\"0 0 " + width + " " + height + "\">");
            builder.AppendLine("<rect width=\"100%\" height=\"100%\" fill=\"#0c0f0e\" />");
            builder.AppendLine("<text x=\"40\" y=\"46\" fill=\"#fafaf9\" font-size=\"28\" font-family=\"Segoe UI, sans-serif\" font-weight=\"700\">" + EscapeXml(diagram.Name) + "</text>");
            builder.AppendLine("<text x=\"40\" y=\"76\" fill=\"#fdba74\" font-size=\"14\" font-family=\"Segoe UI, sans-serif\">Fallback SVG renderer</text>");

            List<RuntimeGraphNode> orderedNodes = graph.Nodes
                .OrderBy(node => node.Label, StringComparer.OrdinalIgnoreCase)
                .ThenBy(node => node.Id, StringComparer.Ordinal)
                .ToList();
            Dictionary<string, int> nodeYPositions = new Dictionary<string, int>(StringComparer.Ordinal);

            for (int index = 0; index < orderedNodes.Count; index++)
            {
                RuntimeGraphNode node = orderedNodes[index];
                int y = 110 + (index * 96);
                nodeYPositions[node.Id] = y;
                string href = BuildSemanticLink("node", node.Id);

                builder.AppendLine("<a href=\"" + EscapeXml(href) + "\">");
                builder.AppendLine("<rect x=\"40\" y=\"" + y + "\" rx=\"16\" ry=\"16\" width=\"340\" height=\"68\" fill=\"#141917\" stroke=\"#f97316\" stroke-width=\"1.5\" />");
                builder.AppendLine("<text x=\"64\" y=\"" + (y + 28) + "\" fill=\"#fafaf9\" font-size=\"18\" font-family=\"Segoe UI, sans-serif\" font-weight=\"600\">" + EscapeXml(node.Label) + "</text>");
                builder.AppendLine("<text x=\"64\" y=\"" + (y + 50) + "\" fill=\"#d6d3d1\" font-size=\"13\" font-family=\"Segoe UI, sans-serif\">" + EscapeXml(node.NodeType) + "</text>");
                builder.AppendLine("</a>");
            }

            int edgeBaseX = 420;
            int edgeWidth = 420;
            int edgeOffset = 0;
            foreach (RuntimeGraphEdge edge in graph.Edges.OrderBy(item => item.SourceNodeId, StringComparer.Ordinal).ThenBy(item => item.TargetNodeId, StringComparer.Ordinal))
            {
                int sourceY = nodeYPositions.TryGetValue(edge.SourceNodeId, out int sourceValue) ? sourceValue : 110;
                int targetY = nodeYPositions.TryGetValue(edge.TargetNodeId, out int targetValue) ? targetValue : sourceY + 96;
                int lineY = Math.Min(sourceY, targetY) + 34;
                int textY = lineY - 8 + edgeOffset;
                string href = BuildSemanticLink("edge", edge.Id);

                builder.AppendLine("<a href=\"" + EscapeXml(href) + "\">");
                builder.AppendLine("<line x1=\"" + edgeBaseX + "\" y1=\"" + lineY + "\" x2=\"" + (edgeBaseX + edgeWidth) + "\" y2=\"" + (targetY + 34) + "\" stroke=\"#60a5fa\" stroke-width=\"2\" />");
                builder.AppendLine("<text x=\"" + edgeBaseX + "\" y=\"" + textY + "\" fill=\"#93c5fd\" font-size=\"13\" font-family=\"Segoe UI, sans-serif\">" + EscapeXml(string.IsNullOrWhiteSpace(edge.Label) ? edge.EdgeType : edge.Label) + "</text>");
                builder.AppendLine("</a>");
                edgeOffset = (edgeOffset + 12) % 24;
            }

            builder.AppendLine("</svg>");
            return builder.ToString();
        }

        private static string EscapeXml(string value)
        {
            return (value ?? string.Empty)
                .Replace("&", "&amp;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\"", "&quot;")
                .Replace("'", "&apos;");
        }

        private static string BuildStableId(string prefix, string source)
        {
            string normalizedSource = string.IsNullOrWhiteSpace(source) ? Guid.NewGuid().ToString("N") : source.Trim().ToLowerInvariant();
            byte[] data = SHA256.HashData(Encoding.UTF8.GetBytes(prefix + ":" + normalizedSource));
            return prefix + "-" + Convert.ToHexString(data).Substring(0, 12);
        }

        private static string GetNodeMetadataValue(RuntimeGraphNode node, string key)
        {
            if (node == null || node.Metadata == null || string.IsNullOrWhiteSpace(key))
            {
                return null;
            }

            return node.Metadata.TryGetValue(key, out string value) ? value : null;
        }

        private static string NormalizeToken(string value)
        {
            return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim().ToLowerInvariant();
        }

        private static RuntimeGraphNode GetRequiredNode(RuntimeGraph graph, string nodeId)
        {
            RuntimeGraphNode node = graph.Nodes.FirstOrDefault(item => string.Equals(item.Id, nodeId, StringComparison.Ordinal));
            if (node == null)
            {
                throw new UserFriendlyException("The selected diagram node was not found.");
            }

            return node;
        }

        private static RuntimeGraphMember GetRequiredMember(RuntimeGraphNode node, string memberId)
        {
            RuntimeGraphMember member = node.Members.FirstOrDefault(item => string.Equals(item.Id, memberId, StringComparison.Ordinal));
            if (member == null)
            {
                throw new UserFriendlyException("The selected diagram member was not found.");
            }

            return member;
        }

        private static RuntimeGraphEdge GetRequiredEdge(RuntimeGraph graph, string edgeId)
        {
            RuntimeGraphEdge edge = graph.Edges.FirstOrDefault(item => string.Equals(item.Id, edgeId, StringComparison.Ordinal));
            if (edge == null)
            {
                throw new UserFriendlyException("The selected diagram edge was not found.");
            }

            return edge;
        }

        private class RuntimeGraph
        {
            public List<RuntimeGraphNode> Nodes { get; set; } = new List<RuntimeGraphNode>();
            public List<RuntimeGraphEdge> Edges { get; set; } = new List<RuntimeGraphEdge>();
            public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();
        }

        private class RuntimeGraphNode
        {
            public string Id { get; set; }
            public string NodeType { get; set; }
            public string Label { get; set; }
            public string Description { get; set; }
            public List<RuntimeGraphMember> Members { get; set; } = new List<RuntimeGraphMember>();
            public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();
        }

        private class RuntimeGraphMember
        {
            public string Id { get; set; }
            public string MemberKind { get; set; }
            public string Signature { get; set; }
            public int Position { get; set; }
        }

        private class RuntimeGraphEdge
        {
            public string Id { get; set; }
            public string EdgeType { get; set; }
            public string SourceNodeId { get; set; }
            public string TargetNodeId { get; set; }
            public string Label { get; set; }
        }

        private class RuntimeGraphPayload
        {
            public List<RuntimeGraphNodePayload> Nodes { get; set; } = new List<RuntimeGraphNodePayload>();
            public List<RuntimeGraphEdgePayload> Edges { get; set; } = new List<RuntimeGraphEdgePayload>();
            public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();
        }

        private class PersistedDiagramMetadata
        {
            public string Summary { get; set; }
            public string Description { get; set; }
            public List<string> LinkedRequirementIds { get; set; } = new List<string>();
            public string LinkedUseCaseSlug { get; set; }
            public List<string> Actors { get; set; } = new List<string>();
            public List<LegacyUseCaseDependency> Dependencies { get; set; } = new List<LegacyUseCaseDependency>();
            public List<LegacyDomainEntity> Entities { get; set; } = new List<LegacyDomainEntity>();
            public List<LegacyDomainRelationship> Relationships { get; set; } = new List<LegacyDomainRelationship>();
            public RuntimeGraphPayload Graph { get; set; }
        }

        private class PersistedDiagramSectionItemPayload
        {
            public string DiagramType { get; set; }
            public string ExternalElementKey { get; set; }
            public string Name { get; set; }
            public string MetadataJson { get; set; }
        }

        private class PersistedOverviewMetadata
        {
            public bool IsAccepted { get; set; }
        }

        private class RuntimeGraphNodePayload
        {
            public string Id { get; set; }
            public string NodeType { get; set; }
            public string Label { get; set; }
            public string Description { get; set; }
            public List<RuntimeGraphMemberPayload> Members { get; set; } = new List<RuntimeGraphMemberPayload>();
            public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();
        }

        private class RuntimeGraphMemberPayload
        {
            public string Id { get; set; }
            public string MemberKind { get; set; }
            public string Signature { get; set; }
            public int Position { get; set; }
        }

        private class RuntimeGraphEdgePayload
        {
            public string Id { get; set; }
            public string EdgeType { get; set; }
            public string SourceNodeId { get; set; }
            public string TargetNodeId { get; set; }
            public string Label { get; set; }
        }

        private class DiagramRuleSet
        {
            public HashSet<string> AllowedNodeTypes { get; set; } = new HashSet<string>(StringComparer.Ordinal);
            public HashSet<string> AllowedEdgeTypes { get; set; } = new HashSet<string>(StringComparer.Ordinal);
            public HashSet<string> AllowedMemberKinds { get; set; } = new HashSet<string>(StringComparer.Ordinal);
            public bool AllowsCycles { get; set; }
        }

        private class LegacyUseCaseMetadata
        {
            public string Summary { get; set; }
            public string Description { get; set; }
            public List<string> Actors { get; set; } = new List<string>();
            public List<LegacyUseCaseDependency> Dependencies { get; set; } = new List<LegacyUseCaseDependency>();
        }

        private class LegacyUseCaseDependency
        {
            public string Slug { get; set; }
            public string Name { get; set; }
        }

        private class LegacyDomainMetadata
        {
            public List<LegacyDomainEntity> Entities { get; set; } = new List<LegacyDomainEntity>();
            public List<LegacyDomainRelationship> Relationships { get; set; } = new List<LegacyDomainRelationship>();
        }

        private class LegacyDomainEntity
        {
            public string Id { get; set; }
            public string Name { get; set; }
            public string Description { get; set; }
            public List<string> Attributes { get; set; } = new List<string>();
        }

        private class LegacyDomainRelationship
        {
            public string Id { get; set; }
            public string Source { get; set; }
            public string Target { get; set; }
            public string Label { get; set; }
        }
    }
}