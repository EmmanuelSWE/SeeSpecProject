"use client";

import { useCallback, useContext, useMemo, useReducer } from "react";
import {
  createSpec as createSpecRequest,
  getSpecByBackendId,
  getSpecById,
  getSpecs as getSpecsRequest,
  type CreateSpecInput,
  type SpecDto,
  updateSpec as updateSpecRequest,
  type UpdateSpecInput
} from "@/app/lib/utils/services/spec-service";
import {
  createSpecSuccess,
  getSpecSuccess,
  getSpecsSuccess,
  resetSpecState,
  setActiveSpec,
  specError,
  specPending,
  updateSpecSuccess
} from "./actions";
import { SpecActionContext, SpecStateContext, INITIAL_STATE } from "./context";
import { SpecReducer } from "./reducer";

export function SpecProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(SpecReducer, INITIAL_STATE);

  const getSpec = useCallback(async (id: string) => {
    dispatch(specPending());
    try {
      const spec = await getSpecById(id);
      dispatch(getSpecSuccess(spec));
      return spec;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load spec.";
      dispatch(specError(message));
      throw error;
    }
  }, []);

  const getSpecs = useCallback(async () => {
    dispatch(specPending());
    try {
      const specs = await getSpecsRequest();
      dispatch(getSpecsSuccess(specs));
      return specs;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load specs.";
      dispatch(specError(message));
      throw error;
    }
  }, []);

  const getSpecByBackend = useCallback(async (backendId: string) => {
    dispatch(specPending());
    try {
      const spec = await getSpecByBackendId(backendId);
      dispatch(getSpecSuccess(spec));
      return spec;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load backend spec.";
      dispatch(specError(message));
      throw error;
    }
  }, []);

  const createSpec = useCallback(async (payload: CreateSpecInput) => {
    dispatch(specPending());
    try {
      const spec = await createSpecRequest(payload);
      dispatch(createSpecSuccess(spec));
      return spec;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create spec.";
      dispatch(specError(message));
      throw error;
    }
  }, []);

  const updateSpec = useCallback(async (payload: UpdateSpecInput) => {
    dispatch(specPending());
    try {
      const spec = await updateSpecRequest(payload);
      dispatch(updateSpecSuccess(spec));
      return spec;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update spec.";
      dispatch(specError(message));
      throw error;
    }
  }, []);

  const setSpec = useCallback((spec: SpecDto | null) => {
    dispatch(setActiveSpec(spec));
  }, []);

  const reset = useCallback(() => {
    dispatch(resetSpecState());
  }, []);

  const actions = useMemo(
    () => ({
      getSpec,
      getSpecs,
      getSpecByBackend,
      createSpec,
      updateSpec,
      setActiveSpec: setSpec,
      reset
    }),
    [createSpec, getSpec, getSpecByBackend, getSpecs, reset, setSpec, updateSpec]
  );

  return (
    <SpecStateContext.Provider value={state}>
      <SpecActionContext.Provider value={actions}>{children}</SpecActionContext.Provider>
    </SpecStateContext.Provider>
  );
}

export function useSpecState() {
  const context = useContext(SpecStateContext);

  if (!context) {
    throw new Error("useSpecState must be used within a SpecProvider");
  }

  return context;
}

export function useSpecActions() {
  const context = useContext(SpecActionContext);

  if (!context) {
    throw new Error("useSpecActions must be used within a SpecProvider");
  }

  return context;
}
