"use client";

import { createContext } from "react";
import type { GenerationArtifactType } from "@/app/lib/providers/backendProvider/context";
export type GenerationRunMode = 1 | 2;
export type GenerationArtifactApplyStatus = 0 | 1 | 2 | 3 | 4 | 5;

export interface ISpec {
  id: string;
  backendId: string;
  title: string;
  version: string;
  status: number;
}

export interface ITokenUsage {
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface IGeneratedSpecPreview {
  specId: string;
  workspaceKey: string;
  generationMode: GenerationRunMode;
  isPreviewOnly: boolean;
  hasAppliedArtifacts: boolean;
  prompt: string;
  model: string;
  outputText: string;
  usage: ITokenUsage | null;
  timestamp: string;
  artifacts?: IGenerationArtifactPreview[];
}

export interface IGenerationArtifactPreview {
  targetFilePath: string;
  artifactType: GenerationArtifactType;
  generatedContent: string;
  targetExists: boolean;
  hasMeaningfulDifference: boolean;
  protectedRegionsDetected: boolean;
  isGeneratorOwnedFile: boolean;
  workspaceKey: string;
  workspaceFilePath: string;
  requiresMalformedRegionDecision: boolean;
  requiresOverwriteConfirmation: boolean;
  applyStatus: GenerationArtifactApplyStatus;
  appliedMalformedRegionDecision: number;
  malformedRegionWarning?: IMalformedRegionWarning | null;
}

export interface IMalformedRegionWarning {
  targetFilePath: string;
  requiresUserDecision: boolean;
  message: string;
  affectedRegionNames: string[];
}

export interface IGenerateSpecCodeInput {
  specId: string;
  generationMode: GenerationRunMode;
  artifactType: GenerationArtifactType;
  targetFolderPath: string;
  model?: string;
  maxTokens?: number;
  malformedRegionDecision?: number;
}

export interface IApplyGeneratedCodeInput {
  specId: string;
  workspaceKey: string;
  confirmApply: boolean;
  confirmOverwriteExisting: boolean;
}

export interface IApplyGeneratedCodeResult {
  specId: string;
  workspaceKey: string;
  requiresApplyConfirmation: boolean;
  requiresOverwriteConfirmation: boolean;
  anyArtifactsApplied: boolean;
  allArtifactsApplied: boolean;
  timestamp: string;
  artifacts: IGenerationArtifactPreview[];
}

export interface ICreateSpecInput {
  backendId: string;
  title: string;
  version: string;
  status: number;
}

export interface IUpdateSpecInput extends Partial<ICreateSpecInput> {
  id: string;
}

export interface ISpecStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
  spec: ISpec | null;
  specs: ISpec[];
  isGeneratingPreview: boolean;
  previewErrorMessage: string | null;
  generatedPreview: IGeneratedSpecPreview | null;
  isApplyingGeneratedCode: boolean;
  applyGeneratedCodeErrorMessage: string | null;
}

export interface ISpecActionContext {
  getSpec: (id: string) => Promise<ISpec | null>;
  getSpecs: () => Promise<ISpec[]>;
  getSpecByBackend: (backendId: string) => Promise<ISpec | null>;
  createSpec: (payload: ICreateSpecInput) => Promise<ISpec>;
  updateSpec: (payload: IUpdateSpecInput) => Promise<ISpec>;
  generateSpecCode: (payload: IGenerateSpecCodeInput) => Promise<IGeneratedSpecPreview>;
  applyGeneratedCode: (payload: IApplyGeneratedCodeInput) => Promise<IApplyGeneratedCodeResult>;
  cleanupGenerationWorkspace: (backendId: string) => Promise<void>;
  clearGeneratedPreview: () => void;
  setActiveSpec: (spec: ISpec | null) => void;
  reset: () => void;
}

export const INITIAL_STATE: ISpecStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  errorMessage: null,
  spec: null,
  specs: [],
  isGeneratingPreview: false,
  previewErrorMessage: null,
  generatedPreview: null,
  isApplyingGeneratedCode: false,
  applyGeneratedCodeErrorMessage: null
};

export const SpecStateContext = createContext<ISpecStateContext>(INITIAL_STATE);
export const SpecActionContext = createContext<ISpecActionContext | undefined>(undefined);
