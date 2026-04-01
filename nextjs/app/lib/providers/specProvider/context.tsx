"use client";

import { createContext } from "react";

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
  prompt: string;
  model: string;
  outputText: string;
  usage: ITokenUsage | null;
  timestamp: string;
}

export interface IGenerateSpecCodeInput {
  specId: string;
  model?: string;
  maxTokens?: number;
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
}

export interface ISpecActionContext {
  getSpec: (id: string) => Promise<ISpec | null>;
  getSpecs: () => Promise<ISpec[]>;
  getSpecByBackend: (backendId: string) => Promise<ISpec | null>;
  createSpec: (payload: ICreateSpecInput) => Promise<ISpec>;
  updateSpec: (payload: IUpdateSpecInput) => Promise<ISpec>;
  generateSpecCode: (payload: IGenerateSpecCodeInput) => Promise<IGeneratedSpecPreview>;
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
  generatedPreview: null
};

export const SpecStateContext = createContext<ISpecStateContext>(INITIAL_STATE);
export const SpecActionContext = createContext<ISpecActionContext | undefined>(undefined);
