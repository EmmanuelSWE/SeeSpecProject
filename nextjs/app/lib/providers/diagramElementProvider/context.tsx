"use client";

import { createContext } from "react";
import type {
  CreateDiagramElementInput,
  DiagramElementDto,
  DiagramElementType,
  UpdateDiagramElementInput
} from "@/app/lib/utils/services/diagram-element-service";

export interface IDiagramElementStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
  diagramElement: DiagramElementDto | null;
  diagramElements: DiagramElementDto[];
  activeType: DiagramElementType | null;
}

export interface IDiagramElementActionContext {
  getDiagramElement: (id: string) => Promise<DiagramElementDto | null>;
  getDiagramElements: () => Promise<DiagramElementDto[]>;
  getDiagramElementsByBackend: (backendId: string) => Promise<DiagramElementDto[]>;
  getDiagramElementsByType: (type: DiagramElementType) => Promise<DiagramElementDto[]>;
  getDiagramElementsByBackendAndType: (backendId: string, type: DiagramElementType) => Promise<DiagramElementDto[]>;
  createDiagramElement: (payload: CreateDiagramElementInput) => Promise<DiagramElementDto>;
  updateDiagramElement: (payload: UpdateDiagramElementInput) => Promise<DiagramElementDto>;
  deleteDiagramElement: (id: string) => Promise<void>;
  setActiveDiagramElement: (diagramElement: DiagramElementDto | null) => void;
  setActiveType: (type: DiagramElementType | null) => void;
  reset: () => void;
}

export const INITIAL_STATE: IDiagramElementStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  errorMessage: null,
  diagramElement: null,
  diagramElements: [],
  activeType: null
};

export const INITIAL_ACTION_STATE: IDiagramElementActionContext = {
  getDiagramElement: async () => null,
  getDiagramElements: async () => [],
  getDiagramElementsByBackend: async () => [],
  getDiagramElementsByType: async () => [],
  getDiagramElementsByBackendAndType: async () => [],
  createDiagramElement: async () => {
    throw new Error("DiagramElementActionContext is not initialized.");
  },
  updateDiagramElement: async () => {
    throw new Error("DiagramElementActionContext is not initialized.");
  },
  deleteDiagramElement: async () => {},
  setActiveDiagramElement: () => {},
  setActiveType: () => {},
  reset: () => {}
};

export const DiagramElementStateContext = createContext<IDiagramElementStateContext>(INITIAL_STATE);
export const DiagramElementActionContext = createContext<IDiagramElementActionContext | undefined>(undefined);
