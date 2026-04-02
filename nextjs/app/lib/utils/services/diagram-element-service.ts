import { axiosInstance } from "@/app/lib/api/client";
import { getOne, getPaged, mapErrorMessage, postOne, putOne } from "@/app/lib/utils/services/service-helpers";
import type {
  BackendDomainEntity,
  BackendDomainRelationship
} from "@/app/lib/providers/backendProvider/context";

export type DiagramElementType = "use-case" | "domain-model" | "activity";
export type DiagramEditorMode = "view" | "navigate" | "edit";
export type DiagramSemanticTargetKind = "node" | "edge" | "member";
export type DiagramSemanticActionType = "create" | "update" | "delete";
export type DiagramDirection = "backward" | "forward";

export type DiagramValidationResultDto = {
  isValid: boolean;
  errors: string[];
};

export type DiagramGraphMemberDto = {
  id: string;
  memberKind: "property" | "function" | string;
  signature: string;
  position: number;
};

export type DiagramGraphNodeDto = {
  id: string;
  nodeType: string;
  label: string;
  description: string;
  members: DiagramGraphMemberDto[];
  metadata: Record<string, string>;
};

export type DiagramGraphEdgeDto = {
  id: string;
  edgeType: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string;
};

export type DiagramGraphDto = {
  diagramElementId: string;
  name: string;
  diagramType: number;
  nodes: DiagramGraphNodeDto[];
  edges: DiagramGraphEdgeDto[];
  metadata: Record<string, string>;
  graphHash: string;
  validation: DiagramValidationResultDto;
};

export type ApplyDiagramSemanticActionInput = {
  diagramElementId: string;
  actionType: DiagramSemanticActionType;
  targetKind: DiagramSemanticTargetKind;
  targetId?: string;
  relatedId?: string;
  value?: string;
  nodeType?: string;
  edgeType?: string;
  memberKind?: string;
};

export type DiagramSemanticActionResultDto = {
  graph: DiagramGraphDto;
  validation: DiagramValidationResultDto;
  graphHash: string;
  metadataJson: string;
};

export type RenderedDiagramDto = {
  svg: string;
  graphHash: string;
  plantUmlText?: string | null;
};

export type DiagramElementDto = {
  id: string;
  backendId: string;
  backendSlug: string;
  specSectionId: string | null;
  type: DiagramElementType;
  slug: string;
  name: string;
  description: string;
  summary: string;
  linkedRequirementIds: string[];
  linkedUseCaseSlug: string | null;
  linkedUseCaseNodeId: string | null;
  linkedUseCaseNodeLabel: string | null;
  actors: string[];
  dependencies: { slug: string; name: string }[];
  entities: BackendDomainEntity[];
  relationships: BackendDomainRelationship[];
  updatedAt: string;
  graphHash?: string;
};

export type CreateDiagramElementInput = {
  backendId: string;
  specSectionId?: string | null;
  type: DiagramElementType;
  slug: string;
  name: string;
  summary: string;
  description?: string;
  linkedRequirementIds?: string[];
  linkedUseCaseSlug?: string | null;
  linkedUseCaseNodeId?: string | null;
  linkedUseCaseNodeLabel?: string | null;
  actors?: string[];
  dependencies?: { slug: string; name: string }[];
  entities?: BackendDomainEntity[];
  relationships?: BackendDomainRelationship[];
};

export type UpdateDiagramElementInput = Partial<CreateDiagramElementInput> & {
  id: string;
};

type DiagramElementApiDto = {
  id: string;
  backendId: string;
  specSectionId?: string | null;
  diagramType: number;
  externalElementKey: string;
  name: string;
  metadataJson?: string | null;
};

type BackendApiDto = {
  id: string;
  slug: string;
};

type DiagramMetadata = {
  summary?: string;
  description?: string;
  linkedRequirementIds?: string[];
  linkedUseCaseSlug?: string | null;
  linkedUseCaseNodeId?: string | null;
  linkedUseCaseNodeLabel?: string | null;
  actors?: string[];
  dependencies?: { slug: string; name: string }[];
  entities?: BackendDomainEntity[];
  relationships?: BackendDomainRelationship[];
};

function parseJson<T>(value?: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function diagramTypeToApi(type: DiagramElementType): number {
  switch (type) {
    case "domain-model":
      return 2;
    case "activity":
      return 3;
    default:
      return 1;
  }
}

function apiToDiagramType(value: number): DiagramElementType {
  switch (value) {
    case 2:
      return "domain-model";
    case 3:
      return "activity";
    default:
      return "use-case";
  }
}

function buildMetadata(payload: Partial<CreateDiagramElementInput>): string {
  return JSON.stringify({
    summary: payload.summary ?? "",
    description: payload.description ?? payload.summary ?? "",
    linkedRequirementIds: payload.linkedRequirementIds ?? [],
    linkedUseCaseSlug: payload.linkedUseCaseSlug ?? null,
    linkedUseCaseNodeId: payload.linkedUseCaseNodeId ?? null,
    linkedUseCaseNodeLabel: payload.linkedUseCaseNodeLabel ?? null,
    actors: payload.actors ?? [],
    dependencies: payload.dependencies ?? [],
    entities: payload.entities ?? [],
    relationships: payload.relationships ?? []
  });
}

async function getBackendMap(): Promise<Map<string, BackendApiDto>> {
  const response = await getPaged<BackendApiDto>("/services/app/Backend/GetAll");
  const backends = response.items ?? [];
  return new Map(backends.map((backend) => [backend.id, backend]));
}

function extractUseCaseSummary(metadata: DiagramMetadata, graph: DiagramGraphDto | null): Pick<DiagramElementDto, "summary" | "description" | "actors" | "dependencies"> {
  const graphActors = graph?.nodes.filter((node) => node.nodeType === "actor").map((node) => node.label) ?? [];
  const dependencyNodeIds = new Set(
    (graph?.edges ?? []).filter((edge) => edge.edgeType === "dependency").map((edge) => edge.sourceNodeId)
  );
  const dependencyNodes =
    graph?.nodes
      .filter((node) => dependencyNodeIds.has(node.id))
      .map((node) => ({
        slug: node.metadata.slug ?? node.id,
        name: node.label
      })) ?? [];

  return {
    summary: metadata.summary ?? graph?.metadata.summary ?? graph?.name ?? "",
    description: metadata.description ?? graph?.metadata.summary ?? graph?.name ?? "",
    actors: metadata.actors?.length ? metadata.actors : graphActors,
    dependencies: metadata.dependencies?.length ? metadata.dependencies : dependencyNodes
  };
}

function extractDomainSummary(metadata: DiagramMetadata, graph: DiagramGraphDto | null): Pick<DiagramElementDto, "entities" | "relationships"> {
  const entities =
    metadata.entities?.length
      ? metadata.entities
      : (graph?.nodes ?? []).map((node) => ({
          id: node.id,
          name: node.label,
          description: node.description,
          attributes: node.members.map((member) => member.signature)
        }));

  const relationships =
    metadata.relationships?.length
      ? metadata.relationships
      : (graph?.edges ?? []).map((edge) => ({
          id: edge.id,
          source: graph?.nodes.find((node) => node.id === edge.sourceNodeId)?.label ?? edge.sourceNodeId,
          target: graph?.nodes.find((node) => node.id === edge.targetNodeId)?.label ?? edge.targetNodeId,
          label: edge.label || edge.edgeType
        }));

  return { entities, relationships };
}

function buildDiagramElementDto(
  diagram: DiagramElementApiDto,
  backendMap: Map<string, BackendApiDto>,
  graph: DiagramGraphDto | null = null
): DiagramElementDto {
  const metadata = parseJson<DiagramMetadata>(diagram.metadataJson) ?? {};
  const backend = backendMap.get(diagram.backendId);
  const type = apiToDiagramType(diagram.diagramType);
  const useCaseSummary = extractUseCaseSummary(metadata, graph);
  const domainSummary = extractDomainSummary(metadata, graph);

  return {
    id: diagram.id,
    backendId: diagram.backendId,
    backendSlug: backend?.slug ?? "",
    specSectionId: diagram.specSectionId ?? null,
    type,
    slug: diagram.externalElementKey,
    name: diagram.name,
    description: useCaseSummary.description || diagram.name,
    summary: useCaseSummary.summary || diagram.name,
    linkedRequirementIds: metadata.linkedRequirementIds ?? [],
    linkedUseCaseSlug: metadata.linkedUseCaseSlug ?? null,
    linkedUseCaseNodeId: metadata.linkedUseCaseNodeId ?? null,
    linkedUseCaseNodeLabel: metadata.linkedUseCaseNodeLabel ?? null,
    actors: type === "use-case" ? useCaseSummary.actors : [],
    dependencies: type === "use-case" ? useCaseSummary.dependencies : [],
    entities: type === "domain-model" ? domainSummary.entities : [],
    relationships: type === "domain-model" ? domainSummary.relationships : [],
    updatedAt: "Saved",
    graphHash: graph?.graphHash
  };
}

async function getDiagramRows(): Promise<DiagramElementApiDto[]> {
  const response = await getPaged<DiagramElementApiDto>("/services/app/DiagramElement/GetAll");
  return response.items ?? [];
}

export async function getDiagramGraph(diagramElementId: string): Promise<DiagramGraphDto> {
  try {
    return await getOne<DiagramGraphDto>("/services/app/DiagramElement/GetGraph", { Id: diagramElementId });
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load diagram graph."));
  }
}

export async function applyDiagramSemanticAction(
  payload: ApplyDiagramSemanticActionInput
): Promise<DiagramSemanticActionResultDto> {
  try {
    return await postOne<DiagramSemanticActionResultDto, ApplyDiagramSemanticActionInput>(
      "/services/app/DiagramElement/ApplySemanticAction",
      payload
    );
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to apply diagram action."));
  }
}

export async function renderDiagramSvg(
  diagramElementId: string,
  includePlantUmlText = false
): Promise<RenderedDiagramDto> {
  try {
    return await postOne<RenderedDiagramDto, { diagramElementId: string; includePlantUmlText: boolean }>(
      "/services/app/DiagramElement/RenderSvg",
      {
        diagramElementId,
        includePlantUmlText
      }
    );
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to render diagram."));
  }
}

export async function getDiagramElements(): Promise<DiagramElementDto[]> {
  try {
    const [diagrams, backendMap] = await Promise.all([getDiagramRows(), getBackendMap()]);
    return diagrams.map((diagram) => buildDiagramElementDto(diagram, backendMap));
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load diagram elements."));
  }
}

export async function getDiagramElementById(id: string): Promise<DiagramElementDto> {
  try {
    const [diagram, backendMap, graph] = await Promise.all([
      getOne<DiagramElementApiDto>("/services/app/DiagramElement/Get", { Id: id }),
      getBackendMap(),
      getDiagramGraph(id).catch(() => null)
    ]);

    return buildDiagramElementDto(diagram, backendMap, graph);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load diagram element."));
  }
}

export async function getDiagramElementsByBackend(backendId: string): Promise<DiagramElementDto[]> {
  const elements = await getDiagramElements();
  return elements.filter((element) => element.backendId === backendId);
}

export async function getDiagramElementsByType(type: DiagramElementType): Promise<DiagramElementDto[]> {
  const elements = await getDiagramElements();
  return elements.filter((element) => element.type === type);
}

export async function getDiagramElementsByBackendAndType(
  backendId: string,
  type: DiagramElementType
): Promise<DiagramElementDto[]> {
  const elements = await getDiagramElements();
  return elements.filter((element) => element.backendId === backendId && element.type === type);
}

export async function createDiagramElement(payload: CreateDiagramElementInput): Promise<DiagramElementDto> {
  try {
    const existingDiagram = (await getDiagramRows()).find(
      (diagram) => diagram.backendId === payload.backendId && diagram.externalElementKey === payload.slug
    );

    // Reuse the persisted backend/slug identity so retries and reopen flows update the same diagram instead of violating the unique index.
    if (existingDiagram) {
      return await updateDiagramElement({
        id: existingDiagram.id,
        ...payload
      });
    }

    const created = await postOne<DiagramElementApiDto, Omit<DiagramElementApiDto, "id">>(
      "/services/app/DiagramElement/Create",
      {
        backendId: payload.backendId,
        specSectionId: payload.specSectionId ?? null,
        diagramType: diagramTypeToApi(payload.type),
        externalElementKey: payload.slug,
        name: payload.name,
        metadataJson: buildMetadata(payload)
      }
    );

    return await getDiagramElementById(created.id);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to create diagram element."));
  }
}

export async function updateDiagramElement(payload: UpdateDiagramElementInput): Promise<DiagramElementDto> {
  try {
    const current = await getOne<DiagramElementApiDto>("/services/app/DiagramElement/Get", { Id: payload.id });
    const currentDto = await getDiagramElementById(payload.id);
    const updated = await putOne<DiagramElementApiDto, DiagramElementApiDto>("/services/app/DiagramElement/Update", {
      ...current,
      specSectionId: payload.specSectionId ?? current.specSectionId ?? null,
      diagramType: payload.type ? diagramTypeToApi(payload.type) : current.diagramType,
      externalElementKey: payload.slug ?? current.externalElementKey,
      name: payload.name ?? current.name,
      metadataJson: buildMetadata({
        ...currentDto,
        ...payload
      })
    });

    return await getDiagramElementById(updated.id);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to update diagram element."));
  }
}

export async function deleteDiagramElement(id: string): Promise<string> {
  try {
    await axiosInstance.delete("/services/app/DiagramElement/Delete", {
      params: {
        Id: id
      }
    });
    return id;
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to delete diagram element."));
  }
}
