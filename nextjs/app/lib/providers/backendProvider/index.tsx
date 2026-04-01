"use client";

import { useCallback, useContext, useMemo, useReducer, useRef } from "react";
import { axiosInstance } from "@/app/lib/api/client";
import {
  getOne,
  getPaged,
  mapErrorMessage,
  postOne,
  putOne,
  unwrapResponse,
  type AbpPagedResult
} from "@/app/lib/utils/services/service-helpers";
import {
  createBackendSuccess,
  deleteBackendSuccess,
  getBackendError,
  getBackendPending,
  getBackendSuccess,
  getBackendsError,
  getBackendsPending,
  getBackendsSuccess,
  resetBackendState,
  setActiveBackend,
  updateBackendSuccess
} from "./actions";
import {
  BackendActionContext,
  BackendStateContext,
  INITIAL_STATE,
  type BackendDomainEntity,
  type BackendDomainRelationship,
  type BackendOverview,
  type BackendRecord,
  type BackendRole,
  type BackendRoleName,
  type BackendStatus,
  type BackendFolderImportInput,
  type BackendUploadResult,
  type CreateBackendInput,
  type UpdateBackendInput
} from "./context";
import { BackendReducer } from "./reducer";

type BackendApiRecord = {
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

type SpecApiRecord = {
  id: string;
  backendId: string;
  title: string;
};

type SpecSectionApiRecord = {
  id: string;
  specId: string;
  title: string;
  slug: string;
  sectionType: number;
  content: string;
};

type SectionItemApiRecord = {
  id: string;
  specSectionId: string;
  label: string;
  content: string;
  position: number;
};

type DiagramElementApiRecord = {
  id: string;
  backendId: string;
  specSectionId?: string | null;
  diagramType: number;
  externalElementKey: string;
  name: string;
  metadataJson?: string | null;
};

type UploadBackendApiResponse = {
  backendId: string;
  name: string;
  status: number;
  nextAction: string;
};

type BackendEnrichmentPayload = {
  specs: SpecApiRecord[];
  sections: SpecSectionApiRecord[];
  diagrams: DiagramElementApiRecord[];
  sectionItems: SectionItemApiRecord[];
};

function dedupeById<T extends { id: string }>(items: T[]): T[] {
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

function slugifyBackendName(name: string): string {
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

function mapBackendStatusToApi(value: BackendStatus): number {
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

function parseOverview(content: string): BackendOverview | null {
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

function parseDomainMetadata(metadataJson?: string | null): {
  entities: BackendDomainEntity[];
  relationships: BackendDomainRelationship[];
} {
  const parsed = parseJson<{
    entities?: BackendDomainEntity[];
    relationships?: BackendDomainRelationship[];
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

function buildBackendRecord(
  backend: BackendApiRecord,
  enrichment: BackendEnrichmentPayload
): BackendRecord {
  const spec = enrichment.specs.find((item) => item.backendId === backend.id) ?? null;
  const specSections = spec ? enrichment.sections.filter((item) => item.specId === spec.id) : [];
  const overviewSection =
    specSections.find((item) => item.slug === `${backend.slug}-overview`) ??
    specSections.find((item) => item.sectionType === 4) ??
    null;
  const roleSections = specSections.filter((item) => item.sectionType === 4 && item.slug.startsWith("role-"));
  const requirementSections = specSections.filter((item) => item.sectionType === 1);
  const diagramElements = enrichment.diagrams.filter((item) => item.backendId === backend.id);
  const useCaseElements = diagramElements.filter((item) => item.diagramType === 1);
  const domainModelElement = diagramElements.find((item) => item.diagramType === 2);
  const domainMetadata = parseDomainMetadata(domainModelElement?.metadataJson);

  const roles: BackendRole[] = roleSections.map((section) => {
    const roleItems = enrichment.sectionItems.filter((item) => item.specSectionId === section.id);
    return {
      id: section.id,
      roleName: mapRoleName(section.title),
      assignedTo: roleItems.find((item) => item.label === "assignedTo")?.content ?? "",
      emailAddress: roleItems.find((item) => item.label === "emailAddress")?.content ?? "",
      note: roleItems.find((item) => item.label === "note")?.content ?? ""
    };
  });

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
    roles,
    requirements: requirementSections.map((item) => ({ id: item.id })),
    useCases: useCaseElements.map((item) => ({
      id: item.id,
      slug: item.externalElementKey || item.name
    })),
    domainEntities: domainMetadata.entities,
    domainRelationships: domainMetadata.relationships
  };
}

async function getBackendEnrichment(): Promise<BackendEnrichmentPayload> {
  const [specs, sections, diagrams, sectionItems] = await Promise.all([
    getPaged<SpecApiRecord>("/services/app/Spec/GetAll"),
    getPaged<SpecSectionApiRecord>("/services/app/SpecSection/GetAll"),
    getPaged<DiagramElementApiRecord>("/services/app/DiagramElement/GetAll"),
    getPaged<SectionItemApiRecord>("/services/app/SectionItem/GetAll")
  ]);

  return {
    specs: specs.items ?? [],
    sections: sections.items ?? [],
    diagrams: diagrams.items ?? [],
    sectionItems: sectionItems.items ?? []
  };
}

async function getBackendRows(): Promise<BackendApiRecord[]> {
  const response = await getPaged<BackendApiRecord>("/services/app/Backend/GetAll");
  return response.items ?? [];
}

async function loadBackendsFromApi(): Promise<BackendRecord[]> {
  const [backends, enrichment] = await Promise.all([getBackendRows(), getBackendEnrichment()]);
  return dedupeById(backends).map((backend) => buildBackendRecord(backend, enrichment));
}

async function loadBackendByIdFromApi(id: string): Promise<BackendRecord> {
  const [backend, enrichment] = await Promise.all([
    getOne<BackendApiRecord>("/services/app/Backend/Get", { Id: id }),
    getBackendEnrichment()
  ]);

  return buildBackendRecord(backend, enrichment);
}

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(BackendReducer, INITIAL_STATE);
  const backendsRequestRef = useRef<Promise<BackendRecord[]> | null>(null);

  const getBackend = useCallback(async (id: string) => {
    dispatch(getBackendPending());
    try {
      const cachedBackend = state.backends.find((item) => item.id === id) ?? null;
      if (cachedBackend) {
        dispatch(getBackendSuccess(cachedBackend));
        return cachedBackend;
      }

      const backend = await loadBackendByIdFromApi(id);
      dispatch(getBackendSuccess(backend));
      return backend;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load backend.";
      dispatch(getBackendError(message));
      throw error;
    }
  }, [state.backends]);

  const getBackendBySlug = useCallback(async (slug: string) => {
    dispatch(getBackendPending());
    try {
      const cachedBackend = state.backends.find((item) => item.slug === slug) ?? null;
      if (cachedBackend) {
        dispatch(getBackendSuccess(cachedBackend));
        return cachedBackend;
      }

      const backends = await loadBackendsFromApi();
      dispatch(getBackendsSuccess(backends));
      const backend = backends.find((item) => item.slug === slug) ?? null;
      dispatch(getBackendSuccess(backend));
      return backend;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load backend.";
      dispatch(getBackendError(message));
      throw error;
    }
  }, [state.backends]);

  const getBackends = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && state.backends.length > 0) {
      return state.backends;
    }

    if (!forceRefresh && backendsRequestRef.current) {
      return backendsRequestRef.current;
    }

    dispatch(getBackendsPending());
    const request = loadBackendsFromApi()
      .then((backends) => {
        dispatch(getBackendsSuccess(backends));
        return backends;
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unable to load backends.";
        dispatch(getBackendsError(message));
        throw error;
      })
      .finally(() => {
        backendsRequestRef.current = null;
      });

    backendsRequestRef.current = request;
    return request;
  }, [state.backends]);

  const createBackend = useCallback(async (payload: CreateBackendInput) => {
    dispatch(getBackendsPending());
    try {
      const created = await postOne<BackendApiRecord, Omit<BackendApiRecord, "id" | "tenantId">>(
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

      const backend = await loadBackendByIdFromApi(created.id);
      dispatch(createBackendSuccess(backend));
      return backend;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create backend.";
      dispatch(getBackendsError(message));
      throw error;
    }
  }, []);

  const updateBackend = useCallback(async (payload: UpdateBackendInput) => {
    dispatch(getBackendsPending());
    try {
      const current = await getOne<BackendApiRecord>("/services/app/Backend/Get", { Id: payload.id });
      const updated = await putOne<BackendApiRecord, BackendApiRecord>("/services/app/Backend/Update", {
        ...current,
        slug: payload.name ? slugifyBackendName(payload.name) : current.slug,
        name: payload.name ?? current.name,
        framework: payload.framework ?? current.framework,
        runtimeVersion: payload.runtimeVersion ?? current.runtimeVersion,
        description: payload.description ?? current.description,
        status: payload.status ? mapBackendStatusToApi(payload.status) : current.status,
        repositoryUrl: payload.repositoryUrl ?? current.repositoryUrl
      });

      const backend = await loadBackendByIdFromApi(updated.id);
      dispatch(updateBackendSuccess(backend));
      return backend;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update backend.";
      dispatch(getBackendsError(message));
      throw error;
    }
  }, []);

  const uploadBackendArchive = useCallback(async (file: File) => {
    dispatch(getBackendsPending());
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post<
        UploadBackendApiResponse | { result?: UploadBackendApiResponse }
      >("/services/app/Backend/Upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const uploadResult = unwrapResponse<UploadBackendApiResponse>(
        response.data as UploadBackendApiResponse & { result?: UploadBackendApiResponse }
      );
      const typedResult: BackendUploadResult = {
        backendId: uploadResult.backendId,
        name: uploadResult.name,
        status: mapBackendStatus(uploadResult.status),
        nextAction: uploadResult.nextAction
      };

      const refreshedBackends = await loadBackendsFromApi();
      dispatch(getBackendsSuccess(refreshedBackends));

      const createdBackend = refreshedBackends.find((item) => item.id === typedResult.backendId) ?? null;
      if (createdBackend) {
        dispatch(getBackendSuccess(createdBackend));
      }

      return typedResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload backend archive.";
      dispatch(getBackendsError(message));
      throw new Error(mapErrorMessage(error, message));
    }
  }, []);

  const importBackendFolder = useCallback(async (payload: BackendFolderImportInput) => {
    dispatch(getBackendsPending());
    try {
      const response = await postOne<
        UploadBackendApiResponse | { result?: UploadBackendApiResponse },
        BackendFolderImportInput
      >("/services/app/Backend/ImportFolder", payload);

      const importResult = unwrapResponse<UploadBackendApiResponse>(
        response as UploadBackendApiResponse & { result?: UploadBackendApiResponse }
      );
      const typedResult: BackendUploadResult = {
        backendId: importResult.backendId,
        name: importResult.name,
        status: mapBackendStatus(importResult.status),
        nextAction: importResult.nextAction
      };

      const refreshedBackends = await loadBackendsFromApi();
      dispatch(getBackendsSuccess(refreshedBackends));

      const createdBackend = refreshedBackends.find((item) => item.id === typedResult.backendId) ?? null;
      if (createdBackend) {
        dispatch(getBackendSuccess(createdBackend));
      }

      return typedResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to import backend folder.";
      dispatch(getBackendsError(message));
      throw new Error(mapErrorMessage(error, message));
    }
  }, []);

  const deleteBackend = useCallback(async (id: string) => {
    dispatch(getBackendsPending());
    try {
      await axiosInstance.delete("/services/app/Backend/Delete", {
        params: {
          Id: id
        }
      });
      dispatch(deleteBackendSuccess(id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete backend.";
      dispatch(getBackendsError(message));
      throw error;
    }
  }, []);

  const setBackend = useCallback((backend: BackendRecord | null) => {
    dispatch(setActiveBackend(backend));
  }, []);

  const reset = useCallback(() => {
    backendsRequestRef.current = null;
    dispatch(resetBackendState());
  }, []);

  const actions = useMemo(
    () => ({
      getBackend,
      getBackendBySlug,
      getBackends,
      createBackend,
      updateBackend,
      uploadBackendArchive,
      importBackendFolder,
      deleteBackend,
      setActiveBackend: setBackend,
      reset
    }),
    [
      createBackend,
      deleteBackend,
      getBackend,
      getBackendBySlug,
      getBackends,
      importBackendFolder,
      reset,
      setBackend,
      updateBackend,
      uploadBackendArchive
    ]
  );

  return (
    <BackendStateContext.Provider value={state}>
      <BackendActionContext.Provider value={actions}>
        {children}
      </BackendActionContext.Provider>
    </BackendStateContext.Provider>
  );
}

export function useBackendState() {
  const context = useContext(BackendStateContext);

  if (!context) {
    throw new Error("useBackendState must be used within a BackendProvider");
  }

  return context;
}

export function useBackendActions() {
  const context = useContext(BackendActionContext);

  if (!context) {
    throw new Error("useBackendActions must be used within a BackendProvider");
  }

  return context;
}
