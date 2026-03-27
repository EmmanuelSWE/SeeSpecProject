import { INITIAL_STATE, type IUserStateContext } from "./context";
import { UserActionEnums, type UserAction } from "./actions";

export function UserReducer(state: IUserStateContext = INITIAL_STATE, action: UserAction): IUserStateContext {
  switch (action.type) {
    case UserActionEnums.hydrateSession:
      return {
        ...state,
        session: action.payload
      };
    case UserActionEnums.loginPending:
      return {
        ...state,
        isPending: true,
        isSuccess: false,
        isError: false,
        errorMessage: null
      };
    case UserActionEnums.loginSuccess:
      return {
        ...state,
        isPending: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        session: action.payload
      };
    case UserActionEnums.loginError:
      return {
        ...state,
        isPending: false,
        isSuccess: false,
        isError: true,
        errorMessage: action.payload
      };
    case UserActionEnums.logout:
      return {
        ...INITIAL_STATE
      };
    default:
      return state;
  }
}
