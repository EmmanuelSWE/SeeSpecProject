"use client";

import { createContext } from "react";
import type { AuthenticateInput, AuthenticateResult } from "@/app/lib/utils/services/auth-service";

export interface IUserSession extends AuthenticateResult {}

export interface IUserStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
  session: IUserSession | null;
}

export interface IUserActionContext {
  login: (payload: AuthenticateInput) => Promise<IUserSession>;
  logout: () => void;
  hydrateSession: () => void;
}

export const INITIAL_STATE: IUserStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  errorMessage: null,
  session: null
};

export const INITIAL_ACTION_STATE: IUserActionContext = {
  login: async () => {
    throw new Error("UserActionContext is not initialized.");
  },
  logout: () => {},
  hydrateSession: () => {}
};

export const UserStateContext = createContext<IUserStateContext>(INITIAL_STATE);
export const UserActionContext = createContext<IUserActionContext | undefined>(undefined);
