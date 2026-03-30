import { axiosInstance } from "@/app/lib/api/client";
import { getOne, getPaged, mapErrorMessage, postOne, putOne } from "@/app/lib/utils/services/service-helpers";
import type {
  BackendDomainEntityDto,
  BackendDomainRelationshipDto
} from "@/app/lib/utils/services/backend-service";

export type DiagramElementType = "use-case" | "domain-model" | "activity";

export type DiagramElementDto = {
  id: string;
  backendId: string;
  backendSlug: string;
  type: DiagramElementType;
  slug: string;
  name: string;
  description: string;
  summary: string;
  linkedRequirementIds: string[];
  linkedUseCaseSlug: string | null;
  actors: string[];
  dependencies: { slug: string; name: string }[];
  entities: BackendDomainEntityDto[];
  relationships: BackendDomainRelationshipDto[];
  updatedAt: string;
};

export type CreateDiagramElementInput = {
  backendId: string;
  type: DiagramElementType;
  slug: string;
  name: string;
  summary: string;
  description?: string;
  linkedRequirementIds?: string[];
  linkedUseCaseSlug?: string | null;
  actors?: string[];
  dependencies?: { slug: string; name: string }[];
  entities?: BackendDomainEntityDto[];
  relationships?: BackendDomainRelationshipDto[];
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
  actors?: string[];
  dependencies?: { slug: string; name: string }[];
  entities?: BackendDomainEntityDto[];
  relationships?: BackendDomainRelationshipDto[];
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

function diagramTypeToApi(type: DiagramElementType) {
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

function buildMetadata(payload: Partial<CreateDiagramElementInput>) {
  return JSON.stringify({
    summary: payload.summary ?? "",
    description: payload.description ?? payload.summary ?? "",
    linkedRequirementIds: payload.linkedRequirementIds ?? [],
    linkedUseCaseSlug: payload.linkedUseCaseSlug ?? null,
    actors: payload.actors ?? [],
    dependencies: payload.dependencies ?? [],
    entities: payload.entities ?? [],
    relationships: payload.relationships ?? []
  });
}

async function getBackendMap() {
  const response = await getPaged<BackendApiDto>("/services/app/Backend/GetAll");
  const backends = response.items ?? [];
  return new Map(backends.map((backend) => [backend.id, backend]));
}

function buildDiagramElementDto(
  diagram: DiagramElementApiDto,
  backendMap: Map<string, BackendApiDto>
): DiagramElementDto {
  const metadata = parseJson<DiagramMetadata>(diagram.metadataJson) ?? {};
  const backend = backendMap.get(diagram.backendId);

  return {
    id: diagram.id,
    backendId: diagram.backendId,
    backendSlug: backend?.slug ?? "",
    type: apiToDiagramType(diagram.diagramType),
    slug: diagram.externalElementKey,
    name: diagram.name,
    description: metadata.description ?? diagram.name,
    summary: metadata.summary ?? diagram.name,
    linkedRequirementIds: metadata.linkedRequirementIds ?? [],
    linkedUseCaseSlug: metadata.linkedUseCaseSlug ?? null,
    actors: metadata.actors ?? [],
    dependencies: metadata.dependencies ?? [],
    entities: metadata.entities ?? [],
    relationships: metadata.relationships ?? [],
    updatedAt: "Saved"
  };
}

async function getDiagramRows() {
  const response = await getPaged<DiagramElementApiDto>("/services/app/DiagramElement/GetAll");
  return response.items ?? [];
}

export async function getDiagramElements() {
  try {
    const [diagrams, backendMap] = await Promise.all([getDiagramRows(), getBackendMap()]);
    return diagrams.map((diagram) => buildDiagramElementDto(diagram, backendMap));
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load diagram elements."));
  }
}

export async function getDiagramElementById(id: string) {
  try {
    const [diagram, backendMap] = await Promise.all([
      getOne<DiagramElementApiDto>("/services/app/DiagramElement/Get", { Id: id }),
      getBackendMap()
    ]);

    return buildDiagramElementDto(diagram, backendMap);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load diagram element."));
  }
}

export async function getDiagramElementsByBackend(backendId: string) {
  const elements = await getDiagramElements();
  return elements.filter((element) => element.backendId === backendId);
}

export async function getDiagramElementsByType(type: DiagramElementType) {
  const elements = await getDiagramElements();
  return elements.filter((element) => element.type === type);
}

export async function getDiagramElementsByBackendAndType(backendId: string, type: DiagramElementType) {
  const elements = await getDiagramElements();
  return elements.filter((element) => element.backendId === backendId && element.type === type);
}

export async function createDiagramElement(payload: CreateDiagramElementInput) {
  try {
    const created = await postOne<DiagramElementApiDto, Omit<DiagramElementApiDto, "id">>(
      "/services/app/DiagramElement/Create",
      {
        backendId: payload.backendId,
        specSectionId: null,
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

export async function updateDiagramElement(payload: UpdateDiagramElementInput) {
  try {
    const current = await getOne<DiagramElementApiDto>("/services/app/DiagramElement/Get", { Id: payload.id });
    const currentDto = await getDiagramElementById(payload.id);
    const updated = await putOne<DiagramElementApiDto, DiagramElementApiDto>("/services/app/DiagramElement/Update", {
      ...current,
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

export async function deleteDiagramElement(id: string) {
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
