"use client";

import { useCallback, useContext, useMemo, useReducer } from "react";
import {
  createSpecSection,
  deleteSpecSection,
  getSpecSectionById,
  getSpecSections,
  getSpecSectionsByBackend,
  getSpecSectionsByBackendAndType,
  getSpecSectionsByType,
  type CreateSpecSectionInput,
  type SpecSectionDto,
  type SpecSectionType,
  updateSpecSection,
  type UpdateSpecSectionInput
} from "@/app/lib/utils/services/spec-section-service";
import {
  createSpecSectionSuccess,
  deleteSpecSectionSuccess,
  getSpecSectionSuccess,
  getSpecSectionsSuccess,
  resetSpecSectionState,
  setActiveSpecSection,
  setActiveSpecSectionType,
  specSectionError,
  specSectionPending,
  updateSpecSectionSuccess
} from "./actions";
import { INITIAL_STATE, SpecSectionActionContext, SpecSectionStateContext } from "./context";
import { SpecSectionReducer } from "./reducer";

export function SpecSectionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(SpecSectionReducer, INITIAL_STATE);

  const getSection = useCallback(async (id: string) => {
    dispatch(specSectionPending());
    try {
      const section = await getSpecSectionById(id);
      dispatch(getSpecSectionSuccess(section));
      return section;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load spec section.";
      dispatch(specSectionError(message));
      throw error;
    }
  }, []);

  const getAllSections = useCallback(async () => {
    dispatch(specSectionPending());
    try {
      const sections = await getSpecSections();
      dispatch(getSpecSectionsSuccess(sections));
      return sections;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load spec sections.";
      dispatch(specSectionError(message));
      throw error;
    }
  }, []);

  const getSectionsForBackend = useCallback(async (backendId: string) => {
    dispatch(specSectionPending());
    try {
      const sections = await getSpecSectionsByBackend(backendId);
      dispatch(getSpecSectionsSuccess(sections));
      return sections;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load spec sections.";
      dispatch(specSectionError(message));
      throw error;
    }
  }, []);

  const getSectionsForType = useCallback(async (type: SpecSectionType) => {
    dispatch(specSectionPending());
    try {
      const sections = await getSpecSectionsByType(type);
      dispatch(getSpecSectionsSuccess(sections));
      dispatch(setActiveSpecSectionType(type));
      return sections;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load spec sections.";
      dispatch(specSectionError(message));
      throw error;
    }
  }, []);

  const getSectionsForBackendAndType = useCallback(async (backendId: string, type: SpecSectionType) => {
    dispatch(specSectionPending());
    try {
      const sections = await getSpecSectionsByBackendAndType(backendId, type);
      dispatch(getSpecSectionsSuccess(sections));
      dispatch(setActiveSpecSectionType(type));
      return sections;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load spec sections.";
      dispatch(specSectionError(message));
      throw error;
    }
  }, []);

  const createSection = useCallback(async (payload: CreateSpecSectionInput) => {
    dispatch(specSectionPending());
    try {
      const section = await createSpecSection(payload);
      dispatch(createSpecSectionSuccess(section));
      return section;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create spec section.";
      dispatch(specSectionError(message));
      throw error;
    }
  }, []);

  const updateSection = useCallback(async (payload: UpdateSpecSectionInput) => {
    dispatch(specSectionPending());
    try {
      const section = await updateSpecSection(payload);
      dispatch(updateSpecSectionSuccess(section));
      return section;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update spec section.";
      dispatch(specSectionError(message));
      throw error;
    }
  }, []);

  const removeSection = useCallback(async (id: string) => {
    dispatch(specSectionPending());
    try {
      await deleteSpecSection(id);
      dispatch(deleteSpecSectionSuccess(id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete spec section.";
      dispatch(specSectionError(message));
      throw error;
    }
  }, []);

  const setSection = useCallback((section: SpecSectionDto | null) => {
    dispatch(setActiveSpecSection(section));
  }, []);

  const setType = useCallback((type: SpecSectionType | null) => {
    dispatch(setActiveSpecSectionType(type));
  }, []);

  const reset = useCallback(() => {
    dispatch(resetSpecSectionState());
  }, []);

  const actions = useMemo(
    () => ({
      getSection,
      getSections: getAllSections,
      getSectionsByBackend: getSectionsForBackend,
      getSectionsByType: getSectionsForType,
      getSectionsByBackendAndType: getSectionsForBackendAndType,
      createSection,
      updateSection,
      deleteSection: removeSection,
      setActiveSection: setSection,
      setActiveType: setType,
      reset
    }),
    [
      createSection,
      getAllSections,
      getSection,
      getSectionsForBackend,
      getSectionsForBackendAndType,
      getSectionsForType,
      removeSection,
      reset,
      setSection,
      setType,
      updateSection
    ]
  );

  return (
    <SpecSectionStateContext.Provider value={state}>
      <SpecSectionActionContext.Provider value={actions}>
        {children}
      </SpecSectionActionContext.Provider>
    </SpecSectionStateContext.Provider>
  );
}

export function useSpecSectionState() {
  const context = useContext(SpecSectionStateContext);

  if (!context) {
    throw new Error("useSpecSectionState must be used within a SpecSectionProvider");
  }

  return context;
}

export function useSpecSectionActions() {
  const context = useContext(SpecSectionActionContext);

  if (!context) {
    throw new Error("useSpecSectionActions must be used within a SpecSectionProvider");
  }

  return context;
}
