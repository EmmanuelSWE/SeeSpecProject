import type { IUserSession, IUserStateContext } from "./context";

export enum UserActionEnums {
  hydrateSession = "HYDRATE_SESSION",
  loginPending = "LOGIN_PENDING",
  loginSuccess = "LOGIN_SUCCESS",
  loginError = "LOGIN_ERROR",
  logout = "LOGOUT"
}

export type UserAction =
  | { type: UserActionEnums.hydrateSession; payload: IUserSession | null }
  | { type: UserActionEnums.loginPending }
  | { type: UserActionEnums.loginSuccess; payload: IUserSession }
  | { type: UserActionEnums.loginError; payload: string }
  | { type: UserActionEnums.logout };

export function hydrateSession(payload: IUserSession | null): UserAction {
  return { type: UserActionEnums.hydrateSession, payload };
}

export function loginPending(): UserAction {
  return { type: UserActionEnums.loginPending };
}

export function loginSuccess(payload: IUserSession): UserAction {
  return { type: UserActionEnums.loginSuccess, payload };
}

export function loginError(payload: string): UserAction {
  return { type: UserActionEnums.loginError, payload };
}

export function logout(): UserAction {
  return { type: UserActionEnums.logout };
}

export function buildPendingState(state: IUserStateContext): IUserStateContext {
  return {
    ...state,
    isPending: true,
    isSuccess: false,
    isError: false,
    errorMessage: null
  };
}
