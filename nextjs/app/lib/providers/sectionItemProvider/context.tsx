"use client";

import { createContext } from "react";

export interface ISectionItem {
  id: string;
  specSectionId: string;
  label: string;
  content: string;
  position: number;
  itemType?: number;
}

export interface ICreateSectionItemInput {
  specSectionId: string;
  label: string;
  content: string;
  position: number;
  itemType?: number;
}

export interface IUpdateSectionItemInput extends Partial<ICreateSectionItemInput> {
  id: string;
}

export interface ISectionItemStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
  items: ISectionItem[];
}

export interface ISectionItemActionContext {
  getItemsBySection: (specSectionId: string) => Promise<ISectionItem[]>;
  createItem: (payload: ICreateSectionItemInput) => Promise<ISectionItem>;
  updateItem: (payload: IUpdateSectionItemInput) => Promise<ISectionItem>;
  deleteItem: (id: string) => Promise<void>;
  reset: () => void;
}

export const INITIAL_STATE: ISectionItemStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  errorMessage: null,
  items: []
};

export const SectionItemStateContext = createContext<ISectionItemStateContext>(INITIAL_STATE);
export const SectionItemActionContext = createContext<ISectionItemActionContext | undefined>(undefined);
