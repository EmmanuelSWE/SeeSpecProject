"use client";

import { useContext, useEffect, useReducer } from "react";
import { authenticate, type AuthenticateInput } from "@/app/lib/utils/services/auth-service";
import {
  hydrateSession,
  loginError,
  loginPending,
  loginSuccess,
  logout as logoutAction
} from "./actions";
import {
  INITIAL_STATE,
  UserActionContext,
  UserStateContext,
  type IUserSession
} from "./context";
import { UserReducer } from "./reducer";

const ACCESS_TOKEN_KEY = "seespec.accessToken";
const ENCRYPTED_ACCESS_TOKEN_KEY = "seespec.encryptedAccessToken";
const EXPIRE_IN_SECONDS_KEY = "seespec.expireInSeconds";
const USER_ID_KEY = "seespec.userId";

function writeSession(session: IUserSession) {
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(ENCRYPTED_ACCESS_TOKEN_KEY, session.encryptedAccessToken);
  localStorage.setItem(EXPIRE_IN_SECONDS_KEY, String(session.expireInSeconds));
  localStorage.setItem(USER_ID_KEY, String(session.userId));
}

function readSession(): IUserSession | null {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const encryptedAccessToken = localStorage.getItem(ENCRYPTED_ACCESS_TOKEN_KEY);
  const expireInSeconds = localStorage.getItem(EXPIRE_IN_SECONDS_KEY);
  const userId = localStorage.getItem(USER_ID_KEY);

  if (!accessToken || !encryptedAccessToken || !expireInSeconds || !userId) {
    return null;
  }

  return {
    accessToken,
    encryptedAccessToken,
    expireInSeconds: Number(expireInSeconds),
    userId: Number(userId)
  };
}

function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ENCRYPTED_ACCESS_TOKEN_KEY);
  localStorage.removeItem(EXPIRE_IN_SECONDS_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(UserReducer, INITIAL_STATE);

  useEffect(() => {
    dispatch(hydrateSession(readSession()));
  }, []);

  async function login(payload: AuthenticateInput) {
    dispatch(loginPending());

    try {
      const session = await authenticate(payload);
      writeSession(session);
      dispatch(loginSuccess(session));
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      dispatch(loginError(message));
      throw error;
    }
  }

  function logout() {
    clearSession();
    dispatch(logoutAction());
  }

  function hydrateUserSession() {
    dispatch(hydrateSession(readSession()));
  }

  return (
    <UserStateContext.Provider value={state}>
      <UserActionContext.Provider value={{ login, logout, hydrateSession: hydrateUserSession }}>
        {children}
      </UserActionContext.Provider>
    </UserStateContext.Provider>
  );
}

export function useUserState() {
  const context = useContext(UserStateContext);

  if (!context) {
    throw new Error("useUserState must be used within a UserProvider");
  }

  return context;
}

export function useUserActions() {
  const context = useContext(UserActionContext);

  if (!context) {
    throw new Error("useUserActions must be used within a UserProvider");
  }

  return context;
}
