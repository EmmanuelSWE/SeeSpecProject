import { axiosInstance } from "@/app/lib/api/client";
import {
  getOne,
  getPaged,
  mapErrorMessage,
  postOne,
  putOne
} from "@/app/lib/utils/services/service-helpers";

export type BackendStatus = "Draft" | "Active" | "Archived";
export type BackendRoleName = "Tenant Admin" | "Project Lead" | "Business Analyst" | "System Architect";

export type BackendOverviewDto = {
  summary: string;
  scope: string;
  goals: string;
};

export type BackendRoleDto = {
  id: string;
  roleName: BackendRoleName;
  assignedTo: string;
  emailAddress: string;
  note: string;
};

export type BackendRequirementReferenceDto = {
  id: string;
};

export type BackendUseCaseReferenceDto = {
  id: string;
  slug: string;
};

export type BackendDomainEntityDto = {
  id: string;
  name: string;
  description: string;
  attributes: string[];
};

export type BackendDomainRelationshipDto = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export type BackendDto = {
  id: string;
  tenantId: number;
  slug: string;
  name: string;
  framework: string;
  runtimeVersion: string;
  description: string;
  status: BackendStatus;
  repositoryUrl: string;
  overview: BackendOverviewDto | null;
  roles: BackendRoleDto[];
  requirements: BackendRequirementReferenceDto[];
  useCases: BackendUseCaseReferenceDto[];
  domainEntities: BackendDomainEntityDto[];
  domainRelationships: BackendDomainRelationshipDto[];
};

type BackendApiDto = {
  id: string;
  tenantId: number;
  slug: string;
  name: string;
  framework: string;
  runtimeVersion: string;
  description: string;
  status: number;
  repositoryUrl: string;
};

type SpecApiDto = {
  id: string;
  backendId: string;
  title: string;
};

type SpecSectionApiDto = {
  id: string;
  specId: string;
  title: string;
  slug: string;
  sectionType: number;
  content: string;
};

type SectionItemApiDto = {
  id: string;
  specSectionId: string;
  label: string;
  content: string;
  position: number;
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

export type CreateBackendInput = {
  name: string;
  framework: string;
  runtimeVersion: string;
  repositoryUrl: string;
  description: string;
  status: BackendStatus;
};

export type UpdateBackendInput = Partial<BackendDto> & {
  id: string;
};

type EnrichmentPayload = {
  specs: SpecApiDto[];
  sections: SpecSectionApiDto[];
  diagrams: DiagramElementApiDto[];
  sectionItems: SectionItemApiDto[];
};

function dedupeById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    deduped.push(item);
  }

  return deduped;
}

function slugifyBackendName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapBackendStatus(value: number): BackendStatus {
  switch (value) {
    case 2:
      return "Active";
    case 3:
      return "Archived";
    default:
      return "Draft";
  }
}

function mapBackendStatusToApi(value: BackendStatus) {
  switch (value) {
    case "Active":
      return 2;
    case "Archived":
      return 3;
    default:
      return 1;
  }
}

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

function parseOverview(content: string): BackendOverviewDto | null {
  const parsed = parseJson<{ summary?: string; scope?: string; goals?: string }>(content);

  if (parsed) {
    return {
      summary: parsed.summary ?? "",
      scope: parsed.scope ?? "",
      goals: parsed.goals ?? ""
    };
  }

  if (!content.trim()) {
    return null;
  }

  const parts = content.split(/\n{2,}/).map((item) => item.trim());
  return {
    summary: parts[0] ?? content,
    scope: parts[1] ?? "",
    goals: parts[2] ?? ""
  };
}

function isOverviewSection(section: SpecSectionApiDto, backendSlug: string) {
  return section.sectionType === 4 && (section.slug === "overview" || section.slug === `${backendSlug}-overview`);
}

function parseDomainMetadata(metadataJson?: string | null) {
  const parsed = parseJson<{
    entities?: BackendDomainEntityDto[];
    relationships?: BackendDomainRelationshipDto[];
  }>(metadataJson);

  return {
    entities: parsed?.entities ?? [],
    relationships: parsed?.relationships ?? []
  };
}

function mapRoleName(value: string): BackendRoleName {
  switch (value) {
    case "Tenant Admin":
    case "Business Analyst":
    case "System Architect":
    case "Project Lead":
      return value;
    default:
      return "Project Lead";
  }
}

function buildBackendDto(backend: BackendApiDto, enrichment: EnrichmentPayload): BackendDto {
  const spec = enrichment.specs.find((item) => item.backendId === backend.id) ?? null;
  const specSections = spec ? enrichment.sections.filter((item) => item.specId === spec.id) : [];
  const overviewSection =
    specSections.find((item) => isOverviewSection(item, backend.slug) && item.slug === `${backend.slug}-overview`) ??
    specSections.find((item) => isOverviewSection(item, backend.slug) && item.slug === "overview");
  const roleSections = specSections.filter((item) => item.sectionType === 4 && item.slug.startsWith("role-"));
  const requirementSections = specSections.filter((item) => item.sectionType === 1);
  const diagramElements = enrichment.diagrams.filter((item) => item.backendId === backend.id);
  const useCaseElements = diagramElements.filter((item) => item.diagramType === 1);
  const domainModelElement = diagramElements.find((item) => item.diagramType === 2);
  const domainMetadata = parseDomainMetadata(domainModelElement?.metadataJson);

  return {
    id: backend.id,
    tenantId: backend.tenantId,
    slug: backend.slug,
    name: backend.name,
    framework: backend.framework,
    runtimeVersion: backend.runtimeVersion,
    description: backend.description ?? "",
    status: mapBackendStatus(backend.status),
    repositoryUrl: backend.repositoryUrl ?? "",
    overview: overviewSection ? parseOverview(overviewSection.content) : null,
    roles: roleSections.map((section) => {
      const roleItems = enrichment.sectionItems.filter((item) => item.specSectionId === section.id);
      return {
        id: section.id,
        roleName: mapRoleName(section.title),
        assignedTo: roleItems.find((item) => item.label === "assignedTo")?.content ?? "",
        emailAddress: roleItems.find((item) => item.label === "emailAddress")?.content ?? "",
        note: roleItems.find((item) => item.label === "note")?.content ?? ""
      };
    }),
    requirements: requirementSections.map((item) => ({ id: item.id })),
    useCases: useCaseElements.map((item) => ({
      id: item.id,
      slug: item.externalElementKey || item.name
    })),
    domainEntities: domainMetadata.entities,
    domainRelationships: domainMetadata.relationships
  };
}

async function getBackendEnrichment(): Promise<EnrichmentPayload> {
  const [specs, sections, diagrams, sectionItems] = await Promise.all([
    getPaged<SpecApiDto>("/services/app/Spec/GetAll"),
    getPaged<SpecSectionApiDto>("/services/app/SpecSection/GetAll"),
    getPaged<DiagramElementApiDto>("/services/app/DiagramElement/GetAll"),
    getPaged<SectionItemApiDto>("/services/app/SectionItem/GetAll")
  ]);

  return {
    specs: specs.items ?? [],
    sections: sections.items ?? [],
    diagrams: diagrams.items ?? [],
    sectionItems: sectionItems.items ?? []
  };
}

async function getBackendRows() {
  const response = await getPaged<BackendApiDto>("/services/app/Backend/GetAll");
  return response.items ?? [];
}

export async function getBackends() {
  try {
    const [backends, enrichment] = await Promise.all([getBackendRows(), getBackendEnrichment()]);
    // Deduping by the persisted backend id fixes the real duplicate-row source before React keys are assigned.
    return dedupeById(backends).map((backend) => buildBackendDto(backend, enrichment));
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load backends."));
  }
}

export async function getBackendById(id: string) {
  try {
    const [backend, enrichment] = await Promise.all([
      getOne<BackendApiDto>("/services/app/Backend/Get", { Id: id }),
      getBackendEnrichment()
    ]);

    return buildBackendDto(backend, enrichment);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load backend."));
  }
}

export async function getBackendBySlug(slug: string) {
  try {
    const [backend, enrichment] = await Promise.all([
      getOne<BackendApiDto | null>("/services/app/Backend/GetBySlug", { Slug: slug }),
      getBackendEnrichment()
    ]);

    return backend ? buildBackendDto(backend, enrichment) : null;
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load backend."));
  }
}

export async function createBackend(payload: CreateBackendInput) {
  try {
    const created = await postOne<BackendApiDto, Omit<BackendApiDto, "id" | "tenantId">>(
      "/services/app/Backend/Create",
      {
        slug: slugifyBackendName(payload.name),
        name: payload.name,
        framework: payload.framework,
        runtimeVersion: payload.runtimeVersion,
        description: payload.description,
        status: mapBackendStatusToApi(payload.status),
        repositoryUrl: payload.repositoryUrl
      }
    );

    return await getBackendById(created.id);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to create backend."));
  }
}

export async function updateBackend(payload: UpdateBackendInput) {
  try {
    const current = await getOne<BackendApiDto>("/services/app/Backend/Get", { Id: payload.id });
    const updated = await putOne<BackendApiDto, BackendApiDto>("/services/app/Backend/Update", {
      ...current,
      slug: payload.name ? slugifyBackendName(payload.name) : current.slug,
      name: payload.name ?? current.name,
      framework: payload.framework ?? current.framework,
      runtimeVersion: payload.runtimeVersion ?? current.runtimeVersion,
      description: payload.description ?? current.description,
      status: payload.status ? mapBackendStatusToApi(payload.status) : current.status,
      repositoryUrl: payload.repositoryUrl ?? current.repositoryUrl
    });

    return await getBackendById(updated.id);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to update backend."));
  }
}

export async function deleteBackend(id: string) {
  try {
    await axiosInstance.delete("/services/app/Backend/Delete", {
      params: {
        Id: id
      }
    });
    return id;
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to delete backend."));
  }
}

export { slugifyBackendName };
