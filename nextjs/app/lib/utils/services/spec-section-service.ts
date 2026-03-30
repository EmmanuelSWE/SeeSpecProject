import { axiosInstance } from "@/app/lib/api/client";
import { getOne, getPaged, mapErrorMessage, postOne, putOne } from "@/app/lib/utils/services/service-helpers";

export type SpecSectionType = "overview" | "requirement";

export type SpecSectionDto = {
  id: string;
  backendId: string;
  backendSlug: string;
  type: SpecSectionType;
  code?: string;
  title: string;
  summary: string;
  content: string[];
  tags: string[];
  updatedAt: string;
  category?: string;
  owner?: string;
  status?: "Draft" | "In Review" | "Approved";
  priority?: "High" | "Medium" | "Low";
  excerpt?: string;
  acceptanceCriteria?: string[];
  linkedArtifacts?: { label: string; href: string; kind: "Task" | "Diagram" | "Domain" }[];
  traceItems?: { title: string; detail: string; kind: "Comment" | "Task" | "Dependency" }[];
  activityItems?: { author: string; text: string; timestamp: string }[];
};

export type CreateSpecSectionInput = {
  backendId: string;
  type: SpecSectionType;
  code?: string;
  title: string;
  summary: string;
  content: string[];
  tags?: string[];
  category?: string;
  owner?: string;
  status?: "Draft" | "In Review" | "Approved";
  priority?: "High" | "Medium" | "Low";
  excerpt?: string;
  acceptanceCriteria?: string[];
  linkedArtifacts?: { label: string; href: string; kind: "Task" | "Diagram" | "Domain" }[];
  traceItems?: { title: string; detail: string; kind: "Comment" | "Task" | "Dependency" }[];
  activityItems?: { author: string; text: string; timestamp: string }[];
};

export type UpdateSpecSectionInput = Partial<SpecSectionDto> & {
  id: string;
};

type SpecApiDto = {
  id: string;
  backendId: string;
  title: string;
  version: string;
  status: number;
};

type BackendApiDto = {
  id: string;
  slug: string;
  name: string;
};

type SpecSectionApiDto = {
  id: string;
  specId: string;
  parentSectionId?: string | null;
  title: string;
  slug: string;
  sectionType: number;
  order: number;
  content: string;
  ownerRole: number;
  version: number;
};

type SectionMetadata = {
  summary?: string;
  body?: string[];
  tags?: string[];
  code?: string;
  category?: string;
  owner?: string;
  status?: "Draft" | "In Review" | "Approved";
  priority?: "High" | "Medium" | "Low";
  excerpt?: string;
  acceptanceCriteria?: string[];
  linkedArtifacts?: { label: string; href: string; kind: "Task" | "Diagram" | "Domain" }[];
  traceItems?: { title: string; detail: string; kind: "Comment" | "Task" | "Dependency" }[];
  activityItems?: { author: string; text: string; timestamp: string }[];
  scope?: string;
  goals?: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function sectionTypeToApi(type: SpecSectionType) {
  return type === "requirement" ? 1 : 4;
}

function apiTypeToSectionType(section: SpecSectionApiDto): SpecSectionType | null {
  if (section.sectionType === 1) {
    return "requirement";
  }

  if (section.sectionType === 4 && section.slug.endsWith("-overview")) {
    return "overview";
  }

  return null;
}

function ownerToApi(owner?: string) {
  switch (owner) {
    case "Project Lead":
      return 1;
    case "Business Analyst":
      return 2;
    case "System Architect":
      return 3;
    default:
      return 4;
  }
}

function parseMetadata(type: SpecSectionType, content: string): SectionMetadata {
  const parsed = parseJson<SectionMetadata>(content);

  if (parsed) {
    return parsed;
  }

  if (type === "overview") {
    const parts = content.split(/\n{2,}/).map((item) => item.trim());
    return {
      summary: parts[0] ?? content,
      scope: parts[1] ?? "",
      goals: parts[2] ?? "",
      body: parts
    };
  }

  return {
    summary: content,
    body: content ? [content] : []
  };
}

function serializeMetadata(type: SpecSectionType, payload: CreateSpecSectionInput | UpdateSpecSectionInput) {
  if (type === "overview") {
    return JSON.stringify({
      summary: payload.content?.[0] ?? payload.summary ?? "",
      scope: payload.content?.[1] ?? "",
      goals: payload.content?.[2] ?? ""
    });
  }

  return JSON.stringify({
    summary: payload.summary ?? "",
    body: payload.content ?? [],
    tags: payload.tags ?? [],
    code: payload.code,
    category: payload.category,
    owner: payload.owner,
    status: payload.status,
    priority: payload.priority,
    excerpt: payload.excerpt,
    acceptanceCriteria: payload.acceptanceCriteria ?? [],
    linkedArtifacts: payload.linkedArtifacts ?? [],
    traceItems: payload.traceItems ?? [],
    activityItems: payload.activityItems ?? []
  });
}

async function getSpecRows() {
  const response = await getPaged<SpecApiDto>("/services/app/Spec/GetAll");
  return response.items ?? [];
}

async function getBackendRows() {
  const response = await getPaged<BackendApiDto>("/services/app/Backend/GetAll");
  return response.items ?? [];
}

async function getSectionRows() {
  const response = await getPaged<SpecSectionApiDto>("/services/app/SpecSection/GetAll");
  return response.items ?? [];
}

async function getBackendMap() {
  const backends = await getBackendRows();
  return new Map(backends.map((backend) => [backend.id, backend]));
}

function buildSpecSectionDto(
  section: SpecSectionApiDto,
  specs: SpecApiDto[],
  backendMap: Map<string, BackendApiDto>
): SpecSectionDto | null {
  const type = apiTypeToSectionType(section);

  if (!type) {
    return null;
  }

  const spec = specs.find((item) => item.id === section.specId);

  if (!spec) {
    return null;
  }

  const backend = backendMap.get(spec.backendId);
  const metadata = parseMetadata(type, section.content);

  return {
    id: section.id,
    backendId: spec.backendId,
    backendSlug: backend?.slug ?? "",
    type,
    title: section.title,
    summary: metadata.summary ?? "",
    content: metadata.body ?? [metadata.summary ?? ""].filter(Boolean),
    tags: metadata.tags ?? [],
    updatedAt: `Version ${section.version}`,
    code: metadata.code,
    category: metadata.category,
    owner: metadata.owner,
    status: metadata.status,
    priority: metadata.priority,
    excerpt: metadata.excerpt,
    acceptanceCriteria: metadata.acceptanceCriteria ?? [],
    linkedArtifacts: metadata.linkedArtifacts ?? [],
    traceItems: metadata.traceItems ?? [],
    activityItems: metadata.activityItems ?? []
  };
}

async function ensureSpecForBackend(backendId: string) {
  const specs = await getSpecRows();
  const existing = specs.find((item) => item.backendId === backendId);

  if (existing) {
    return existing;
  }

  const backend = await getOne<BackendApiDto>("/services/app/Backend/Get", { Id: backendId });
  return await postOne<SpecApiDto, Omit<SpecApiDto, "id">>("/services/app/Spec/Create", {
    backendId,
    title: `${backend.name} Specification`,
    version: "1.0",
    status: 1
  });
}

export async function getSpecSections() {
  try {
    const [sections, specs, backendMap] = await Promise.all([getSectionRows(), getSpecRows(), getBackendMap()]);
    return sections
      .map((section) => buildSpecSectionDto(section, specs, backendMap))
      .filter((section): section is SpecSectionDto => section !== null);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load spec sections."));
  }
}

export async function getSpecSectionById(id: string) {
  try {
    const [section, specs, backendMap] = await Promise.all([
      getOne<SpecSectionApiDto>("/services/app/SpecSection/Get", { Id: id }),
      getSpecRows(),
      getBackendMap()
    ]);

    return buildSpecSectionDto(section, specs, backendMap);
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to load spec section."));
  }
}

export async function getSpecSectionsByBackend(backendId: string) {
  const sections = await getSpecSections();
  return sections.filter((section) => section.backendId === backendId);
}

export async function getSpecSectionsByType(type: SpecSectionType) {
  const sections = await getSpecSections();
  return sections.filter((section) => section.type === type);
}

export async function getSpecSectionsByBackendAndType(backendId: string, type: SpecSectionType) {
  const sections = await getSpecSections();
  return sections.filter((section) => section.backendId === backendId && section.type === type);
}

export async function createSpecSection(payload: CreateSpecSectionInput) {
  try {
    const [spec, backend] = await Promise.all([
      ensureSpecForBackend(payload.backendId),
      getOne<BackendApiDto>("/services/app/Backend/Get", { Id: payload.backendId })
    ]);

    const created = await postOne<SpecSectionApiDto, Omit<SpecSectionApiDto, "id" | "version">>(
      "/services/app/SpecSection/Create",
      {
        specId: spec.id,
        parentSectionId: null,
        title: payload.title,
        slug: payload.type === "overview" ? `${backend.slug}-overview` : slugify(payload.title),
        sectionType: sectionTypeToApi(payload.type),
        order: 1,
        content: serializeMetadata(payload.type, payload),
        ownerRole: ownerToApi(payload.owner)
      }
    );

    const createdSection = await getSpecSectionById(created.id);

    if (!createdSection) {
      throw new Error("Created spec section could not be loaded.");
    }

    return createdSection;
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to create spec section."));
  }
}

export async function updateSpecSection(payload: UpdateSpecSectionInput) {
  try {
    const current = await getOne<SpecSectionApiDto>("/services/app/SpecSection/Get", { Id: payload.id });
    const currentDto = await getSpecSectionById(payload.id);
    const nextType = payload.type ?? currentDto?.type ?? apiTypeToSectionType(current) ?? "requirement";
    const updated = await putOne<SpecSectionApiDto, SpecSectionApiDto>("/services/app/SpecSection/Update", {
      ...current,
      title: payload.title ?? current.title,
      slug:
        payload.type === "overview"
          ? current.slug.endsWith("-overview")
            ? current.slug
            : `${current.slug}-overview`
          : payload.title
            ? slugify(payload.title)
            : current.slug,
      sectionType: sectionTypeToApi(nextType),
      content: serializeMetadata(nextType, {
        ...currentDto,
        ...payload
      }),
      ownerRole: ownerToApi(payload.owner ?? currentDto?.owner)
    });

    const updatedSection = await getSpecSectionById(updated.id);

    if (!updatedSection) {
      throw new Error("Updated spec section could not be loaded.");
    }

    return updatedSection;
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to update spec section."));
  }
}

export async function deleteSpecSection(id: string) {
  try {
    await axiosInstance.delete("/services/app/SpecSection/Delete", {
      params: {
        Id: id
      }
    });
    return id;
  } catch (error) {
    throw new Error(mapErrorMessage(error, "Unable to delete spec section."));
  }
}
