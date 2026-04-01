"use client";

import { useCallback, useContext, useMemo, useReducer } from "react";
import { getOne, getPaged, mapErrorMessage, postOne, putOne } from "@/app/lib/utils/services/service-helpers";
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
import {
  type ICreateSpecInput,
  type ISpec,
  type IUpdateSpecInput,
  SpecActionContext,
  SpecStateContext,
  INITIAL_STATE
} from "./context";
import { SpecReducer } from "./reducer";

async function loadSpecs(): Promise<ISpec[]> {
  const response = await getPaged<ISpec>("/services/app/Spec/GetAll");
  return response.items ?? [];
}

export function SpecProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(SpecReducer, INITIAL_STATE);

  const getSpec = useCallback(async (id: string) => {
    dispatch(specPending());
    try {
      const spec = await getOne<ISpec>("/services/app/Spec/Get", { Id: id });
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
      const specs = await loadSpecs();
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
      const spec = (await loadSpecs()).find((item) => item.backendId === backendId) ?? null;
      dispatch(getSpecSuccess(spec));
      return spec;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load backend spec.";
      dispatch(specError(message));
      throw error;
    }
  }, []);

  const createSpec = useCallback(async (payload: ICreateSpecInput) => {
    dispatch(specPending());
    try {
      const spec = await postOne<ISpec, ICreateSpecInput>("/services/app/Spec/Create", payload);
      dispatch(createSpecSuccess(spec));
      return spec;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create spec.";
      dispatch(specError(message));
      throw error;
    }
  }, []);

  const updateSpec = useCallback(async (payload: IUpdateSpecInput) => {
    dispatch(specPending());
    try {
      const current = await getOne<ISpec>("/services/app/Spec/Get", { Id: payload.id });
      const spec = await putOne<ISpec, ISpec>("/services/app/Spec/Update", {
        ...current,
        backendId: payload.backendId ?? current.backendId,
        title: payload.title ?? current.title,
        version: payload.version ?? current.version,
        status: payload.status ?? current.status
      });
      dispatch(updateSpecSuccess(spec));
      return spec;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update spec.";
      dispatch(specError(mapErrorMessage(error, message)));
      throw error;
    }
  }, []);

  const setSpec = useCallback((spec: ISpec | null) => {
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
