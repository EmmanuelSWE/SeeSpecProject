"use client";

import { useCallback, useContext, useMemo, useReducer } from "react";
import {
  createBackend as createBackendRequest,
  deleteBackend as deleteBackendRequest,
  getBackendById,
  getBackendBySlug as getBackendBySlugRequest,
  getBackends as getBackendsRequest,
  updateBackend as updateBackendRequest,
  type BackendDto,
  type CreateBackendInput,
  type UpdateBackendInput
} from "@/app/lib/utils/services/backend-service";
import {
  createBackendSuccess,
  deleteBackendSuccess,
  getBackendError,
  getBackendPending,
  getBackendSuccess,
  getBackendsError,
  getBackendsPending,
  getBackendsSuccess,
  resetBackendState,
  setActiveBackend,
  updateBackendSuccess
} from "./actions";
import { BackendActionContext, BackendStateContext, INITIAL_STATE } from "./context";
import { BackendReducer } from "./reducer";

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(BackendReducer, INITIAL_STATE);

  const getBackend = useCallback(async (id: string) => {
    dispatch(getBackendPending());
    try {
      const backend = await getBackendById(id);
      dispatch(getBackendSuccess(backend));
      return backend;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load backend.";
      dispatch(getBackendError(message));
      throw error;
    }
  }, []);

  const getBackendBySlug = useCallback(async (slug: string) => {
    dispatch(getBackendPending());
    try {
      const backend = await getBackendBySlugRequest(slug);
      dispatch(getBackendSuccess(backend));
      return backend;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load backend.";
      dispatch(getBackendError(message));
      throw error;
    }
  }, []);

  const getBackends = useCallback(async () => {
    dispatch(getBackendsPending());
    try {
      const backends = await getBackendsRequest();
      dispatch(getBackendsSuccess(backends));
      return backends;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load backends.";
      dispatch(getBackendsError(message));
      throw error;
    }
  }, []);

  const createBackend = useCallback(async (payload: CreateBackendInput) => {
    dispatch(getBackendsPending());
    try {
      const backend = await createBackendRequest(payload);
      dispatch(createBackendSuccess(backend));
      return backend;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create backend.";
      dispatch(getBackendsError(message));
      throw error;
    }
  }, []);

  const updateBackend = useCallback(async (payload: UpdateBackendInput) => {
    dispatch(getBackendsPending());
    try {
      const backend = await updateBackendRequest(payload);
      dispatch(updateBackendSuccess(backend));
      return backend;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update backend.";
      dispatch(getBackendsError(message));
      throw error;
    }
  }, []);

  const deleteBackend = useCallback(async (id: string) => {
    dispatch(getBackendsPending());
    try {
      await deleteBackendRequest(id);
      dispatch(deleteBackendSuccess(id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete backend.";
      dispatch(getBackendsError(message));
      throw error;
    }
  }, []);

  const setBackend = useCallback((backend: BackendDto | null) => {
    dispatch(setActiveBackend(backend));
  }, []);

  const reset = useCallback(() => {
    dispatch(resetBackendState());
  }, []);

  const actions = useMemo(
    () => ({
      getBackend,
      getBackendBySlug,
      getBackends,
      createBackend,
      updateBackend,
      deleteBackend,
      setActiveBackend: setBackend,
      reset
    }),
    [createBackend, deleteBackend, getBackend, getBackendBySlug, getBackends, reset, setBackend, updateBackend]
  );

  return (
    <BackendStateContext.Provider value={state}>
      <BackendActionContext.Provider value={actions}>
        {children}
      </BackendActionContext.Provider>
    </BackendStateContext.Provider>
  );
}

export function useBackendState() {
  const context = useContext(BackendStateContext);

  if (!context) {
    throw new Error("useBackendState must be used within a BackendProvider");
  }

  return context;
}

export function useBackendActions() {
  const context = useContext(BackendActionContext);

  if (!context) {
    throw new Error("useBackendActions must be used within a BackendProvider");
  }

  return context;
}
