import type { BackendDto } from "@/app/lib/utils/services/backend-service";

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
  | { type: BackendActionEnums.getBackendSuccess; payload: BackendDto | null }
  | { type: BackendActionEnums.getBackendError; payload: string }
  | { type: BackendActionEnums.getBackendsPending }
  | { type: BackendActionEnums.getBackendsSuccess; payload: BackendDto[] }
  | { type: BackendActionEnums.getBackendsError; payload: string }
  | { type: BackendActionEnums.createBackendSuccess; payload: BackendDto }
  | { type: BackendActionEnums.updateBackendSuccess; payload: BackendDto }
  | { type: BackendActionEnums.deleteBackendSuccess; payload: string }
  | { type: BackendActionEnums.setActiveBackend; payload: BackendDto | null }
  | { type: BackendActionEnums.reset };

export const getBackendPending = (): BackendAction => ({ type: BackendActionEnums.getBackendPending });
export const getBackendSuccess = (payload: BackendDto | null): BackendAction => ({ type: BackendActionEnums.getBackendSuccess, payload });
export const getBackendError = (payload: string): BackendAction => ({ type: BackendActionEnums.getBackendError, payload });
export const getBackendsPending = (): BackendAction => ({ type: BackendActionEnums.getBackendsPending });
export const getBackendsSuccess = (payload: BackendDto[]): BackendAction => ({ type: BackendActionEnums.getBackendsSuccess, payload });
export const getBackendsError = (payload: string): BackendAction => ({ type: BackendActionEnums.getBackendsError, payload });
export const createBackendSuccess = (payload: BackendDto): BackendAction => ({ type: BackendActionEnums.createBackendSuccess, payload });
export const updateBackendSuccess = (payload: BackendDto): BackendAction => ({ type: BackendActionEnums.updateBackendSuccess, payload });
export const deleteBackendSuccess = (payload: string): BackendAction => ({ type: BackendActionEnums.deleteBackendSuccess, payload });
export const setActiveBackend = (payload: BackendDto | null): BackendAction => ({ type: BackendActionEnums.setActiveBackend, payload });
export const resetBackendState = (): BackendAction => ({ type: BackendActionEnums.reset });
