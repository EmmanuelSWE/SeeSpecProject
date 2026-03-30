"use client";

import { createContext } from "react";
import type { BackendDto, CreateBackendInput, UpdateBackendInput } from "@/app/lib/utils/services/backend-service";

export interface IBackendStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
  backend: BackendDto | null;
  backends: BackendDto[];
}

export interface IBackendActionContext {
  getBackend: (id: string) => Promise<BackendDto | null>;
  getBackendBySlug: (slug: string) => Promise<BackendDto | null>;
  getBackends: () => Promise<BackendDto[]>;
  createBackend: (payload: CreateBackendInput) => Promise<BackendDto>;
  updateBackend: (payload: UpdateBackendInput) => Promise<BackendDto>;
  deleteBackend: (id: string) => Promise<void>;
  setActiveBackend: (backend: BackendDto | null) => void;
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
  deleteBackend: async () => {},
  setActiveBackend: () => {},
  reset: () => {}
};

export const BackendStateContext = createContext<IBackendStateContext>(INITIAL_STATE);
export const BackendActionContext = createContext<IBackendActionContext | undefined>(undefined);
