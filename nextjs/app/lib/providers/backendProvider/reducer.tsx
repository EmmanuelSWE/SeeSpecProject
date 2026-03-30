import { INITIAL_STATE, type IBackendStateContext } from "./context";
import { BackendActionEnums, type BackendAction } from "./actions";

export function BackendReducer(
  state: IBackendStateContext = INITIAL_STATE,
  action: BackendAction
): IBackendStateContext {
  switch (action.type) {
    case BackendActionEnums.getBackendPending:
    case BackendActionEnums.getBackendsPending:
      return {
        ...state,
        isPending: true,
        isSuccess: false,
        isError: false,
        errorMessage: null
      };
    case BackendActionEnums.getBackendSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        backend: action.payload
      };
    case BackendActionEnums.getBackendsSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        backends: action.payload
      };
    case BackendActionEnums.getBackendError:
    case BackendActionEnums.getBackendsError:
      return {
        ...state,
        isPending: false,
        isSuccess: false,
        isError: true,
        errorMessage: action.payload
      };
    case BackendActionEnums.createBackendSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        backend: action.payload,
        backends: [...state.backends, action.payload]
      };
    case BackendActionEnums.updateBackendSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        backend: action.payload,
        backends: state.backends.map((backend) => (backend.id === action.payload.id ? action.payload : backend))
      };
    case BackendActionEnums.deleteBackendSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        backend: state.backend?.id === action.payload ? null : state.backend,
        backends: state.backends.filter((backend) => backend.id !== action.payload)
      };
    case BackendActionEnums.setActiveBackend:
      return {
        ...state,
        backend: action.payload
      };
    case BackendActionEnums.reset:
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}
