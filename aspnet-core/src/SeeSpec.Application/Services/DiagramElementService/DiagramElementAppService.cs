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
using SeeSpec.Domains.SpecManagement;
using SeeSpec.Services.DiagramElementService.DTO;

namespace SeeSpec.Services.DiagramElementService
{
    [AbpAuthorize]
    public class DiagramElementAppService : AsyncCrudAppService<DiagramElement, DiagramElementDto, Guid, PagedAndSortedResultRequestDto, DiagramElementDto, DiagramElementDto>, IDiagramElementAppService
    {
        private static readonly JsonSerializerOptions SerializerOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private static readonly ConcurrentDictionary<string, RenderedDiagramDto> RenderCache = new ConcurrentDictionary<string, RenderedDiagramDto>();

        public DiagramElementAppService(IRepository<DiagramElement, Guid> repository)
            : base(repository)
        {
        }

        public async Task<DiagramGraphDto> GetGraphAsync(GetDiagramGraphDto input)
        {
            DiagramElement diagram = await Repository.GetAsync(input.Id);
            RuntimeGraph graph = BuildRuntimeGraph(diagram);
            return BuildGraphDto(diagram, graph);
        }

        public async Task<DiagramSemanticActionResultDto> ApplySemanticActionAsync(ApplyDiagramSemanticActionDto input)
        {
            DiagramElement diagram = await Repository.GetAsync(input.DiagramElementId);
            RuntimeGraph graph = BuildRuntimeGraph(diagram);

            ApplySemanticAction(graph, input);

            DiagramValidationResultDto validation = ValidateGraph(graph, diagram.DiagramType);
            if (!validation.IsValid)
            {
                throw new UserFriendlyException(string.Join(Environment.NewLine, validation.Errors));
            }

            diagram.MetadataJson = SerializeGraph(graph);
            await Repository.UpdateAsync(diagram);

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
            RuntimeGraph graph = BuildRuntimeGraph(diagram);
            DiagramValidationResultDto validation = ValidateGraph(graph, diagram.DiagramType);

            // The graph stays authoritative and renderer-only output is blocked until semantics are valid.
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
            string svg = await RenderPlantUmlSvgAsync(plantUmlText);

            RenderedDiagramDto render = new RenderedDiagramDto
            {
                Svg = svg,
                GraphHash = graphHash,
                PlantUmlText = input.IncludePlantUmlText ? plantUmlText : null
            };

            // Cache by graph hash so identical valid graphs do not invoke the renderer repeatedly.
            RenderCache[graphHash] = new RenderedDiagramDto
            {
                Svg = svg,
                GraphHash = graphHash,
                PlantUmlText = plantUmlText
            };

            return render;
        }

        private static RuntimeGraph BuildRuntimeGraph(DiagramElement diagram)
        {
            if (string.IsNullOrWhiteSpace(diagram.MetadataJson))
            {
                return CreateDefaultGraph(diagram);
            }

            RuntimeGraphPayload payload = DeserializeMetadata<RuntimeGraphPayload>(diagram.MetadataJson);
            if (payload != null && payload.Nodes != null && payload.Edges != null)
            {
                return NormalizeGraphPayload(diagram, payload);
            }

            return BuildLegacyGraph(diagram);
        }

        // The semantic graph is the source of truth; MetadataJson only stores its persisted form.
        private static string SerializeGraph(RuntimeGraph graph)
        {
            RuntimeGraphPayload payload = new RuntimeGraphPayload
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

            return JsonSerializer.Serialize(payload, SerializerOptions);
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
                // Cycles are rejected before rendering so the backend remains authoritative on graph legality.
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
            string serializedGraph = SerializeGraph(graph);
            byte[] data = SHA256.HashData(Encoding.UTF8.GetBytes(serializedGraph));
            return Convert.ToHexString(data);
        }

        // PlantUML stays renderer-only; it is derived from the semantic graph instead of becoming editable state.
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

        private static string BuildUseCasePlantUml(DiagramElement diagram, RuntimeGraph graph)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("@startuml");
            builder.AppendLine("left to right direction");
            builder.AppendLine("skinparam svgLinkTarget _top");
            builder.AppendLine("skinparam shadowing false");
            builder.AppendLine("title " + EscapePlantUml(diagram.Name));

            foreach (RuntimeGraphNode node in graph.Nodes.OrderBy(item => item.Label, StringComparer.OrdinalIgnoreCase).ThenBy(item => item.Id, StringComparer.Ordinal))
            {
                string alias = BuildPlantUmlAlias(node.Id);
                string link = BuildSemanticLink("node", node.Id);
                if (NormalizeToken(node.NodeType) == "actor")
                {
                    builder.AppendLine("actor \"" + EscapePlantUml(node.Label) + "\" as " + alias + " [[" + link + "]]");
                }
                else
                {
                    builder.AppendLine("usecase \"" + EscapePlantUml(node.Label) + "\" as " + alias + " [[" + link + "]]");
                }
            }

            foreach (RuntimeGraphEdge edge in graph.Edges.OrderBy(item => item.SourceNodeId, StringComparer.Ordinal).ThenBy(item => item.TargetNodeId, StringComparer.Ordinal))
            {
                string arrow = NormalizeToken(edge.EdgeType) == "actor-link" ? "-->" : "..>";
                string label = string.IsNullOrWhiteSpace(edge.Label) ? string.Empty : " : " + EscapePlantUml(edge.Label);
                builder.AppendLine(BuildPlantUmlAlias(edge.SourceNodeId) + " " + arrow + " " + BuildPlantUmlAlias(edge.TargetNodeId) + label);
            }

            builder.AppendLine("@enduml");
            return builder.ToString();
        }

        private static string BuildDomainPlantUml(DiagramElement diagram, RuntimeGraph graph)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("@startuml");
            builder.AppendLine("skinparam svgLinkTarget _top");
            builder.AppendLine("skinparam shadowing false");
            builder.AppendLine("hide empty members");
            builder.AppendLine("title " + EscapePlantUml(diagram.Name));

            foreach (RuntimeGraphNode node in graph.Nodes.OrderBy(item => item.Label, StringComparer.OrdinalIgnoreCase).ThenBy(item => item.Id, StringComparer.Ordinal))
            {
                string alias = BuildPlantUmlAlias(node.Id);
                string link = BuildSemanticLink("node", node.Id);
                builder.AppendLine("class \"" + EscapePlantUml(node.Label) + "\" as " + alias + " [[" + link + "]] {");
                foreach (RuntimeGraphMember member in node.Members.OrderBy(item => item.Position).ThenBy(item => item.Id, StringComparer.Ordinal))
                {
                    builder.AppendLine("  " + EscapePlantUml(member.Signature));
                }

                builder.AppendLine("}");
            }

            foreach (RuntimeGraphEdge edge in graph.Edges.OrderBy(item => item.SourceNodeId, StringComparer.Ordinal).ThenBy(item => item.TargetNodeId, StringComparer.Ordinal))
            {
                string arrow = BuildDomainArrow(edge.EdgeType);
                string label = string.IsNullOrWhiteSpace(edge.Label) ? string.Empty : " : " + EscapePlantUml(edge.Label);
                builder.AppendLine(BuildPlantUmlAlias(edge.SourceNodeId) + " " + arrow + " " + BuildPlantUmlAlias(edge.TargetNodeId) + label);
            }

            builder.AppendLine("@enduml");
            return builder.ToString();
        }

        private static string BuildActivityPlantUml(DiagramElement diagram, RuntimeGraph graph)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("@startuml");
            builder.AppendLine("skinparam svgLinkTarget _top");
            builder.AppendLine("skinparam shadowing false");
            builder.AppendLine("title " + EscapePlantUml(diagram.Name));

            foreach (RuntimeGraphNode node in graph.Nodes.OrderBy(item => item.Label, StringComparer.OrdinalIgnoreCase).ThenBy(item => item.Id, StringComparer.Ordinal))
            {
                string alias = BuildPlantUmlAlias(node.Id);
                string link = BuildSemanticLink("node", node.Id);
                string keyword = ResolveActivityKeyword(node.NodeType);
                builder.AppendLine(keyword + " \"" + EscapePlantUml(node.Label) + "\" as " + alias + " [[" + link + "]]");
            }

            foreach (RuntimeGraphEdge edge in graph.Edges.OrderBy(item => item.SourceNodeId, StringComparer.Ordinal).ThenBy(item => item.TargetNodeId, StringComparer.Ordinal))
            {
                string label = string.IsNullOrWhiteSpace(edge.Label) ? string.Empty : " : " + EscapePlantUml(edge.Label);
                builder.AppendLine(BuildPlantUmlAlias(edge.SourceNodeId) + " --> " + BuildPlantUmlAlias(edge.TargetNodeId) + label);
            }

            builder.AppendLine("@enduml");
            return builder.ToString();
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

        private static string ResolveActivityKeyword(string nodeType)
        {
            switch (NormalizeToken(nodeType))
            {
                case "start":
                    return "circle";
                case "end":
                    return "circle";
                case "decision":
                    return "diamond";
                default:
                    return "rectangle";
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

        private static string BuildStableId(string prefix, string source)
        {
            string normalizedSource = string.IsNullOrWhiteSpace(source) ? Guid.NewGuid().ToString("N") : source.Trim().ToLowerInvariant();
            byte[] data = SHA256.HashData(Encoding.UTF8.GetBytes(prefix + ":" + normalizedSource));
            return prefix + "-" + Convert.ToHexString(data).Substring(0, 12);
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
