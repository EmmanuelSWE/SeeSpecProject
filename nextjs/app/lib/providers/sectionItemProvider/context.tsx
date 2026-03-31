"use client";

import { createContext } from "react";
import type {
  CreateSectionItemInput,
  SectionItemDto,
  UpdateSectionItemInput
} from "@/app/lib/utils/services/section-item-service";

export interface ISectionItemStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
  items: SectionItemDto[];
}

export interface ISectionItemActionContext {
  getItemsBySection: (specSectionId: string) => Promise<SectionItemDto[]>;
  createItem: (payload: CreateSectionItemInput) => Promise<SectionItemDto>;
  updateItem: (payload: UpdateSectionItemInput) => Promise<SectionItemDto>;
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
