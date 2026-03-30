"use client";

import { createContext } from "react";
import type {
  CreateSpecSectionInput,
  SpecSectionDto,
  SpecSectionType,
  UpdateSpecSectionInput
} from "@/app/lib/utils/services/spec-section-service";

export interface ISpecSectionStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
  section: SpecSectionDto | null;
  sections: SpecSectionDto[];
  activeType: SpecSectionType | null;
}

export interface ISpecSectionActionContext {
  getSection: (id: string) => Promise<SpecSectionDto | null>;
  getSections: () => Promise<SpecSectionDto[]>;
  getSectionsByBackend: (backendId: string) => Promise<SpecSectionDto[]>;
  getSectionsByType: (type: SpecSectionType) => Promise<SpecSectionDto[]>;
  getSectionsByBackendAndType: (backendId: string, type: SpecSectionType) => Promise<SpecSectionDto[]>;
  createSection: (payload: CreateSpecSectionInput) => Promise<SpecSectionDto>;
  updateSection: (payload: UpdateSpecSectionInput) => Promise<SpecSectionDto>;
  deleteSection: (id: string) => Promise<void>;
  setActiveSection: (section: SpecSectionDto | null) => void;
  setActiveType: (type: SpecSectionType | null) => void;
  reset: () => void;
}

export const INITIAL_STATE: ISpecSectionStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  errorMessage: null,
  section: null,
  sections: [],
  activeType: null
};

export const INITIAL_ACTION_STATE: ISpecSectionActionContext = {
  getSection: async () => null,
  getSections: async () => [],
  getSectionsByBackend: async () => [],
  getSectionsByType: async () => [],
  getSectionsByBackendAndType: async () => [],
  createSection: async () => {
    throw new Error("SpecSectionActionContext is not initialized.");
  },
  updateSection: async () => {
    throw new Error("SpecSectionActionContext is not initialized.");
  },
  deleteSection: async () => {},
  setActiveSection: () => {},
  setActiveType: () => {},
  reset: () => {}
};

export const SpecSectionStateContext = createContext<ISpecSectionStateContext>(INITIAL_STATE);
export const SpecSectionActionContext = createContext<ISpecSectionActionContext | undefined>(undefined);
