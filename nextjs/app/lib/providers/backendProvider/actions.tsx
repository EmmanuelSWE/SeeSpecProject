import type { BackendRecord } from "./context";

export enum BackendActionEnums {
  getBackendPending = "GET_BACKEND_PENDING",
  getBackendSuccess = "GET_BACKEND_SUCCESS",
  getBackendError = "GET_BACKEND_ERROR",
  getBackendsPending = "GET_BACKENDS_PENDING",
  getBackendsSuccess = "GET_BACKENDS_SUCCESS",
  getBackendsError = "GET_BACKENDS_ERROR",
  createBackendSuccess = "CREATE_BACKEND_SUCCESS",
  updateBackendSuccess = "UPDATE_BACKEND_SUCCESS",
  deleteBackendSuccess = "DELETE_BACKEND_SUCCESS",
  setActiveBackend = "SET_ACTIVE_BACKEND",
  reset = "RESET_BACKEND_STATE"
}

export type BackendAction =
  | { type: BackendActionEnums.getBackendPending }
  | { type: BackendActionEnums.getBackendSuccess; payload: BackendRecord | null }
  | { type: BackendActionEnums.getBackendError; payload: string }
  | { type: BackendActionEnums.getBackendsPending }
  | { type: BackendActionEnums.getBackendsSuccess; payload: BackendRecord[] }
  | { type: BackendActionEnums.getBackendsError; payload: string }
  | { type: BackendActionEnums.createBackendSuccess; payload: BackendRecord }
  | { type: BackendActionEnums.updateBackendSuccess; payload: BackendRecord }
  | { type: BackendActionEnums.deleteBackendSuccess; payload: string }
  | { type: BackendActionEnums.setActiveBackend; payload: BackendRecord | null }
  | { type: BackendActionEnums.reset };

export const getBackendPending = (): BackendAction => ({ type: BackendActionEnums.getBackendPending });
export const getBackendSuccess = (payload: BackendRecord | null): BackendAction => ({ type: BackendActionEnums.getBackendSuccess, payload });
export const getBackendError = (payload: string): BackendAction => ({ type: BackendActionEnums.getBackendError, payload });
export const getBackendsPending = (): BackendAction => ({ type: BackendActionEnums.getBackendsPending });
export const getBackendsSuccess = (payload: BackendRecord[]): BackendAction => ({ type: BackendActionEnums.getBackendsSuccess, payload });
export const getBackendsError = (payload: string): BackendAction => ({ type: BackendActionEnums.getBackendsError, payload });
export const createBackendSuccess = (payload: BackendRecord): BackendAction => ({ type: BackendActionEnums.createBackendSuccess, payload });
export const updateBackendSuccess = (payload: BackendRecord): BackendAction => ({ type: BackendActionEnums.updateBackendSuccess, payload });
export const deleteBackendSuccess = (payload: string): BackendAction => ({ type: BackendActionEnums.deleteBackendSuccess, payload });
export const setActiveBackend = (payload: BackendRecord | null): BackendAction => ({ type: BackendActionEnums.setActiveBackend, payload });
export const resetBackendState = (): BackendAction => ({ type: BackendActionEnums.reset });
