"use client";

import { createContext } from "react";

export type BackendStatus = "Draft" | "Active" | "Archived";
export type BackendRoleName = "Tenant Admin" | "Project Lead" | "Business Analyst" | "System Architect";

export type BackendOverview = {
  summary: string;
  scope: string;
  goals: string;
  isAccepted?: boolean;
};

export type BackendRole = {
  id: string;
  roleName: BackendRoleName;
  assignedTo: string;
  emailAddress: string;
  note: string;
};

export type BackendRequirementReference = {
  id: string;
};

export type BackendUseCaseReference = {
  id: string;
  slug: string;
};

export type BackendDomainEntity = {
  id: string;
  name: string;
  description: string;
  attributes: string[];
};

export type BackendDomainRelationship = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export type BackendRecord = {
  id: string;
  tenantId: number;
  slug: string;
  name: string;
  framework: string;
  runtimeVersion: string;
  description: string;
  status: BackendStatus;
  repositoryUrl: string;
  overview: BackendOverview | null;
  roles: BackendRole[];
  requirements: BackendRequirementReference[];
  useCases: BackendUseCaseReference[];
  domainEntities: BackendDomainEntity[];
  domainRelationships: BackendDomainRelationship[];
};

export type CreateBackendInput = {
  name: string;
  framework: string;
  runtimeVersion: string;
  repositoryUrl: string;
  description: string;
  status: BackendStatus;
};

export type UpdateBackendInput = Partial<BackendRecord> & {
  id: string;
};

export type BackendUploadResult = {
  backendId: string;
  name: string;
  status: BackendStatus;
  nextAction: string;
};

export type BackendFolderImportInput = {
  folderPath: string;
};

export type GenerationArtifactType =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6;

export type AllowedGenerationFolder = {
  folderPath: string;
  projectPath: string;
  projectName: string;
  moduleName: string;
  projectKind: string;
  artifactType: GenerationArtifactType;
  folderExists: boolean;
};

export interface IBackendStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
  backend: BackendRecord | null;
  backends: BackendRecord[];
}

export interface IBackendActionContext {
  getBackend: (id: string) => Promise<BackendRecord | null>;
  getBackendBySlug: (slug: string) => Promise<BackendRecord | null>;
  getBackends: (forceRefresh?: boolean) => Promise<BackendRecord[]>;
  createBackend: (payload: CreateBackendInput) => Promise<BackendRecord>;
  updateBackend: (payload: UpdateBackendInput) => Promise<BackendRecord>;
  uploadBackendArchive: (file: File) => Promise<BackendUploadResult>;
  importBackendFolder: (payload: BackendFolderImportInput) => Promise<BackendUploadResult>;
  getAllowedGenerationFolders: (
    backendId: string,
    artifactType: GenerationArtifactType
  ) => Promise<AllowedGenerationFolder[]>;
  deleteBackend: (id: string) => Promise<void>;
  setActiveBackend: (backend: BackendRecord | null) => void;
  reset: () => void;
}

export const INITIAL_STATE: IBackendStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  errorMessage: null,
  backend: null,
  backends: []
};

export const INITIAL_ACTION_STATE: IBackendActionContext = {
  getBackend: async () => null,
  getBackendBySlug: async () => null,
  getBackends: async () => [],
  createBackend: async () => {
    throw new Error("BackendActionContext is not initialized.");
  },
  updateBackend: async () => {
    throw new Error("BackendActionContext is not initialized.");
  },
  uploadBackendArchive: async () => {
    throw new Error("BackendActionContext is not initialized.");
  },
  importBackendFolder: async () => {
    throw new Error("BackendActionContext is not initialized.");
  },
  getAllowedGenerationFolders: async () => [],
  deleteBackend: async () => {},
  setActiveBackend: () => {},
  reset: () => {}
};

export const BackendStateContext = createContext<IBackendStateContext>(INITIAL_STATE);
export const BackendActionContext = createContext<IBackendActionContext | undefined>(undefined);
