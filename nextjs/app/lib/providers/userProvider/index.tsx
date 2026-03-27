"use client";

import { useContext, useEffect, useReducer } from "react";
import { authenticate, logout as logoutRequest, type AuthenticateInput } from "@/app/lib/utils/services/auth-service";
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

const SESSION_COOKIE_NAME = "seespec_user_session";

function readCookieValue(name: string) {
  const cookiePrefix = `${name}=`;
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((value) => value.startsWith(cookiePrefix));
  return cookie ? decodeURIComponent(cookie.slice(cookiePrefix.length)) : null;
}

function readSession(): IUserSession | null {
  const rawSessionCookie = readCookieValue(SESSION_COOKIE_NAME);

  if (!rawSessionCookie) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSessionCookie) as {
      userId: number;
      tenantId: number | null;
      userName: string;
      fullName: string;
      emailAddress: string;
      expireInSeconds: number;
    };

    return {
      accessToken: "",
      encryptedAccessToken: "",
      expireInSeconds: parsed.expireInSeconds,
      userId: parsed.userId,
      tenantId: parsed.tenantId,
      userName: parsed.userName,
      fullName: parsed.fullName,
      emailAddress: parsed.emailAddress
    };
  } catch {
    return null;
  }
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

function mapLoginResultToSession(session: IUserSession): IUserSession {
  return {
    ...session,
    accessToken: "",
    encryptedAccessToken: ""
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(UserReducer, INITIAL_STATE);

  useEffect(() => {
    dispatch(hydrateSession(readSession()));
  }, []);

  async function login(payload: AuthenticateInput) {
    dispatch(loginPending());

    try {
      const result = await authenticate(payload);
      const session = mapLoginResultToSession(result);
      dispatch(loginSuccess(session));
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      dispatch(loginError(message));
      throw error;
    }
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      clearSessionCookie();
      dispatch(logoutAction());
    }
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
