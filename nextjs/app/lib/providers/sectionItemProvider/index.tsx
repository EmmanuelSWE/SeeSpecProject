"use client";

import { useCallback, useContext, useMemo, useReducer } from "react";
import {
  createSectionItem as createSectionItemRequest,
  deleteSectionItem as deleteSectionItemRequest,
  getSectionItemsBySection,
  type CreateSectionItemInput,
  type SectionItemDto,
  updateSectionItem as updateSectionItemRequest,
  type UpdateSectionItemInput
} from "@/app/lib/utils/services/section-item-service";
import {
  createSectionItemSuccess,
  deleteSectionItemSuccess,
  getSectionItemsSuccess,
  resetSectionItemState,
  sectionItemError,
  sectionItemPending,
  updateSectionItemSuccess
} from "./actions";
import { SectionItemActionContext, SectionItemStateContext, INITIAL_STATE } from "./context";
import { SectionItemReducer } from "./reducer";

export function SectionItemProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(SectionItemReducer, INITIAL_STATE);

  const getItemsBySection = useCallback(async (specSectionId: string) => {
    dispatch(sectionItemPending());
    try {
      const items = await getSectionItemsBySection(specSectionId);
      dispatch(getSectionItemsSuccess(items));
      return items;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load section items.";
      dispatch(sectionItemError(message));
      throw error;
    }
  }, []);

  const createItem = useCallback(async (payload: CreateSectionItemInput) => {
    dispatch(sectionItemPending());
    try {
      const item = await createSectionItemRequest(payload);
      dispatch(createSectionItemSuccess(item));
      return item;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create section item.";
      dispatch(sectionItemError(message));
      throw error;
    }
  }, []);

  const updateItem = useCallback(async (payload: UpdateSectionItemInput) => {
    dispatch(sectionItemPending());
    try {
      const item = await updateSectionItemRequest(payload);
      dispatch(updateSectionItemSuccess(item));
      return item;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update section item.";
      dispatch(sectionItemError(message));
      throw error;
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    dispatch(sectionItemPending());
    try {
      await deleteSectionItemRequest(id);
      dispatch(deleteSectionItemSuccess(id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete section item.";
      dispatch(sectionItemError(message));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    dispatch(resetSectionItemState());
  }, []);

  const actions = useMemo(
    () => ({
      getItemsBySection,
      createItem,
      updateItem,
      deleteItem,
      reset
    }),
    [createItem, deleteItem, getItemsBySection, reset, updateItem]
  );

  return (
    <SectionItemStateContext.Provider value={state}>
      <SectionItemActionContext.Provider value={actions}>{children}</SectionItemActionContext.Provider>
    </SectionItemStateContext.Provider>
  );
}

export function useSectionItemState() {
  const context = useContext(SectionItemStateContext);

  if (!context) {
    throw new Error("useSectionItemState must be used within a SectionItemProvider");
  }

  return context;
}

export function useSectionItemActions() {
  const context = useContext(SectionItemActionContext);

  if (!context) {
    throw new Error("useSectionItemActions must be used within a SectionItemProvider");
  }

  return context;
}
