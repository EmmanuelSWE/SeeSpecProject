"use client";

import { createContext } from "react";
import type { CreateSpecInput, SpecDto, UpdateSpecInput } from "@/app/lib/utils/services/spec-service";

export interface ISpecStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
  spec: SpecDto | null;
  specs: SpecDto[];
}

export interface ISpecActionContext {
  getSpec: (id: string) => Promise<SpecDto | null>;
  getSpecs: () => Promise<SpecDto[]>;
  getSpecByBackend: (backendId: string) => Promise<SpecDto | null>;
  createSpec: (payload: CreateSpecInput) => Promise<SpecDto>;
  updateSpec: (payload: UpdateSpecInput) => Promise<SpecDto>;
  setActiveSpec: (spec: SpecDto | null) => void;
  reset: () => void;
}

export const INITIAL_STATE: ISpecStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  errorMessage: null,
  spec: null,
  specs: []
};

export const SpecStateContext = createContext<ISpecStateContext>(INITIAL_STATE);
export const SpecActionContext = createContext<ISpecActionContext | undefined>(undefined);
