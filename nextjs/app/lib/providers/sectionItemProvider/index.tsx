"use client";

import { useCallback, useContext, useMemo, useReducer } from "react";
import { axiosInstance } from "@/app/lib/api/client";
import { getOne, getPaged, mapErrorMessage, postOne, putOne } from "@/app/lib/utils/services/service-helpers";
import {
  createSectionItemSuccess,
  deleteSectionItemSuccess,
  getSectionItemsSuccess,
  resetSectionItemState,
  sectionItemError,
  sectionItemPending,
  updateSectionItemSuccess
} from "./actions";
import {
  type ICreateSectionItemInput,
  type ISectionItem,
  type IUpdateSectionItemInput,
  SectionItemActionContext,
  SectionItemStateContext,
  INITIAL_STATE
} from "./context";
import { SectionItemReducer } from "./reducer";

async function getAllSectionItems(): Promise<ISectionItem[]> {
  const response = await getPaged<ISectionItem>("/services/app/SectionItem/GetAll");
  return response.items ?? [];
}

export function SectionItemProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(SectionItemReducer, INITIAL_STATE);

  const getItemsBySection = useCallback(async (specSectionId: string) => {
    dispatch(sectionItemPending());
    try {
      const items = (await getAllSectionItems()).filter((item) => item.specSectionId === specSectionId);
      dispatch(getSectionItemsSuccess(items));
      return items;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load section items.";
      dispatch(sectionItemError(message));
      throw error;
    }
  }, []);

  const createItem = useCallback(async (payload: ICreateSectionItemInput) => {
    dispatch(sectionItemPending());
    try {
      const item = await postOne<ISectionItem, Omit<ISectionItem, "id">>("/services/app/SectionItem/Create", {
        specSectionId: payload.specSectionId,
        label: payload.label,
        content: payload.content,
        position: payload.position,
        itemType: payload.itemType ?? 1
      });
      dispatch(createSectionItemSuccess(item));
      return item;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create section item.";
      dispatch(sectionItemError(message));
      throw error;
    }
  }, []);

  const updateItem = useCallback(async (payload: IUpdateSectionItemInput) => {
    dispatch(sectionItemPending());
    try {
      const current = await getOne<ISectionItem>("/services/app/SectionItem/Get", { Id: payload.id });
      const item = await putOne<ISectionItem, ISectionItem>("/services/app/SectionItem/Update", {
        ...current,
        specSectionId: payload.specSectionId ?? current.specSectionId,
        label: payload.label ?? current.label,
        content: payload.content ?? current.content,
        position: payload.position ?? current.position,
        itemType: payload.itemType ?? current.itemType
      });
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
      await axiosInstance.delete("/services/app/SectionItem/Delete", {
        params: {
          Id: id
        }
      });
      dispatch(deleteSectionItemSuccess(id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete section item.";
      dispatch(sectionItemError(mapErrorMessage(error, message)));
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
