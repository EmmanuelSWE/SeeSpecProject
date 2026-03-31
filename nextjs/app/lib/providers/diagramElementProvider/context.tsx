"use client";

import { createContext } from "react";
import type {
  ApplyDiagramSemanticActionInput,
  CreateDiagramElementInput,
  DiagramEditorMode,
  DiagramElementDto,
  DiagramElementType,
  DiagramGraphDto,
  DiagramSemanticTargetKind,
  DiagramValidationResultDto,
  RenderedDiagramDto,
  UpdateDiagramElementInput
} from "@/app/lib/utils/services/diagram-element-service";

export type DiagramSelection = {
  kind: DiagramSemanticTargetKind;
  id: string;
} | null;

export type DiagramInlineEditorState = {
  isOpen: boolean;
  x: number;
  y: number;
  value: string;
  targetKind: DiagramSemanticTargetKind | null;
  targetId: string | null;
};

export interface IDiagramElementStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  isRendering: boolean;
  errorMessage: string | null;
  diagramElement: DiagramElementDto | null;
  diagramElements: DiagramElementDto[];
  activeType: DiagramElementType | null;
  graph: DiagramGraphDto | null;
  renderedDiagram: RenderedDiagramDto | null;
  validation: DiagramValidationResultDto | null;
  editorMode: DiagramEditorMode;
  selection: DiagramSelection;
  inlineEditor: DiagramInlineEditorState;
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
  getDiagramGraph: (diagramElementId: string) => Promise<DiagramGraphDto>;
  applySemanticAction: (payload: ApplyDiagramSemanticActionInput) => Promise<DiagramGraphDto>;
  renderSvg: (diagramElementId: string, includePlantUmlText?: boolean) => Promise<RenderedDiagramDto>;
  setActiveDiagramElement: (diagramElement: DiagramElementDto | null) => void;
  setActiveType: (type: DiagramElementType | null) => void;
  setEditorMode: (mode: DiagramEditorMode) => void;
  setSelection: (selection: DiagramSelection) => void;
  openInlineEditor: (payload: Omit<DiagramInlineEditorState, "isOpen">) => void;
  closeInlineEditor: () => void;
  reset: () => void;
}

export const INITIAL_STATE: IDiagramElementStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  isRendering: false,
  errorMessage: null,
  diagramElement: null,
  diagramElements: [],
  activeType: null,
  graph: null,
  renderedDiagram: null,
  validation: null,
  editorMode: "view",
  selection: null,
  inlineEditor: {
    isOpen: false,
    x: 0,
    y: 0,
    value: "",
    targetKind: null,
    targetId: null
  }
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
  getDiagramGraph: async () => {
    throw new Error("DiagramElementActionContext is not initialized.");
  },
  applySemanticAction: async () => {
    throw new Error("DiagramElementActionContext is not initialized.");
  },
  renderSvg: async () => {
    throw new Error("DiagramElementActionContext is not initialized.");
  },
  setActiveDiagramElement: () => {},
  setActiveType: () => {},
  setEditorMode: () => {},
  setSelection: () => {},
  openInlineEditor: () => {},
  closeInlineEditor: () => {},
  reset: () => {}
};

export const DiagramElementStateContext = createContext<IDiagramElementStateContext>(INITIAL_STATE);
export const DiagramElementActionContext = createContext<IDiagramElementActionContext | undefined>(undefined);
