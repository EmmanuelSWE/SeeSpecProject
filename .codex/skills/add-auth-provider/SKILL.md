---
name: add-auth-provider
description: Use this skill when building or modifying the auth provider, login page, register page, or anything related to authentication state — token storage, login/logout actions, or reading the current user from context.
---

# Mosaic-Talent — Auth Provider

## Overview

The auth provider manages login, register, logout, and the current user's session. It differs from other providers because ABP's login endpoint (`/api/TokenAuth/Authenticate`) has a different shape than the standard CRUD services.

## Production Auth Rules

- Never implement mock/demo auth logic (no simulated success delays, no fake auth shortcuts).
- Never persist auth session state in `localStorage`.
- Always call real backend auth/session endpoints via provider actions.
- Keep API calls in provider files only; pages/components must consume hooks/actions.

---

## File Structure

```
providers/auth-provider/
├── context.tsx    ← interfaces + initial state + createContext
├── actions.tsx    ← redux-actions createAction calls
├── reducer.tsx    ← handleActions reducer
└── index.tsx      ← AuthProvider component + useAuthState + useAuthAction hooks
```

---

## context.tsx

```typescript
"use client";
import { createContext } from "react";

export interface IUser {
  userId: number; // int64 from ABP — number not string
  accessToken: string;
  expireInSeconds: number;
}

export interface IAuthStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  isAuthenticated: boolean;
  user?: IUser;
}

export interface IAuthActionContext {
  login: (userNameOrEmailAddress: string, password: string) => void;
  register: (input: IRegisterInput) => void;
  logout: () => void;
}

export interface IRegisterInput {
  name: string;
  surname: string;
  userName: string;
  emailAddress: string;
  password: string;
}

export const INITIAL_STATE: IAuthStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  isAuthenticated: false,
};

export const AuthStateContext = createContext<IAuthStateContext>(INITIAL_STATE);
export const AuthActionContext = createContext<IAuthActionContext>({
  login: () => {},
  register: () => {},
  logout: () => {},
});
```

---

## actions.tsx

```typescript
import { createAction } from "redux-actions";
import { IAuthStateContext, IUser } from "./context";

export enum AuthStateEnums {
  LOGIN_PENDING = "LOGIN_PENDING",
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_ERROR = "LOGIN_ERROR",
  REGISTER_PENDING = "REGISTER_PENDING",
  REGISTER_SUCCESS = "REGISTER_SUCCESS",
  REGISTER_ERROR = "REGISTER_ERROR",
  LOGOUT_PENDING = "LOGOUT_PENDING",
  LOGOUT_SUCCESS = "LOGOUT_SUCCESS",
  LOGOUT_ERROR = "LOGOUT_ERROR",
}

export const loginPending = createAction<IAuthStateContext>(
  AuthStateEnums.LOGIN_PENDING,
  () => ({
    isPending: true,
    isSuccess: false,
    isError: false,
    isAuthenticated: false,
  }),
);

export const loginSuccess = createAction<IAuthStateContext, IUser>(
  AuthStateEnums.LOGIN_SUCCESS,
  (user: IUser) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    isAuthenticated: true,
    user,
  }),
);

export const loginError = createAction<IAuthStateContext>(
  AuthStateEnums.LOGIN_ERROR,
  () => ({
    isPending: false,
    isSuccess: false,
    isError: true,
    isAuthenticated: false,
  }),
);

export const registerPending = createAction<IAuthStateContext>(
  AuthStateEnums.REGISTER_PENDING,
  () => ({
    isPending: true,
    isSuccess: false,
    isError: false,
    isAuthenticated: false,
  }),
);

export const registerSuccess = createAction<IAuthStateContext, IUser>(
  AuthStateEnums.REGISTER_SUCCESS,
  (user: IUser) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    isAuthenticated: true,
    user,
  }),
);

export const registerError = createAction<IAuthStateContext>(
  AuthStateEnums.REGISTER_ERROR,
  () => ({
    isPending: false,
    isSuccess: false,
    isError: true,
    isAuthenticated: false,
  }),
);

export const logoutPending = createAction<IAuthStateContext>(
  AuthStateEnums.LOGOUT_PENDING,
  () => ({
    isPending: true,
    isSuccess: false,
    isError: false,
    isAuthenticated: false,
  }),
);

export const logoutSuccess = createAction<IAuthStateContext>(
  AuthStateEnums.LOGOUT_SUCCESS,
  () => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    isAuthenticated: false,
    user: undefined,
  }),
);

export const logoutError = createAction<IAuthStateContext>(
  AuthStateEnums.LOGOUT_ERROR,
  () => ({
    isPending: false,
    isSuccess: false,
    isError: true,
    isAuthenticated: false,
  }),
);
```

---

## reducer.tsx

```typescript
import { handleActions } from "redux-actions";
import { INITIAL_STATE, IAuthStateContext } from "./context";
import { AuthStateEnums } from "./actions";

export const AuthReducer = handleActions<IAuthStateContext, IAuthStateContext>(
  {
    [AuthStateEnums.LOGIN_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.LOGIN_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.LOGIN_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.REGISTER_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.REGISTER_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.REGISTER_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.LOGOUT_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.LOGOUT_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.LOGOUT_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  INITIAL_STATE,
);
```

---

## index.tsx

```typescript
"use client";
import { useContext, useReducer } from "react";
import { getAxiosInstance, setAuthToken, removeAuthToken } from "@/utils/axiosInstance";
import { AuthReducer } from "./reducer";
import { INITIAL_STATE, AuthStateContext, AuthActionContext, IRegisterInput } from "./context";
import {
  loginPending, loginSuccess, loginError,
  registerPending, registerSuccess, registerError,
  logoutPending, logoutSuccess, logoutError,
} from "./actions";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  const login = async (userNameOrEmailAddress: string, password: string) => {
    dispatch(loginPending());
    try {
      const res = await instance.post('/api/TokenAuth/Authenticate', {
        userNameOrEmailAddress,  // ← ABP field name, not "email"
        password,
        rememberClient: true,
      });
      const { accessToken, expireInSeconds, userId } = res.data.result;
      setAuthToken(accessToken);  // persist token to cookie
      dispatch(loginSuccess({ accessToken, expireInSeconds, userId }));
    } catch {
      dispatch(loginError());
    }
  };

  const register = async (input: IRegisterInput) => {
    dispatch(registerPending());
    try {
      const res = await instance.post('/api/services/app/Account/Register', input);
      // After register, auto-login
      await login(input.userName, input.password);
    } catch {
      dispatch(registerError());
    }
  };

  const logout = async () => {
    dispatch(logoutPending());
    try {
      removeAuthToken();
      dispatch(logoutSuccess());
    } catch {
      dispatch(logoutError());
    }
  };

  return (
    <AuthStateContext.Provider value={state}>
      <AuthActionContext.Provider value={{ login, register, logout }}>
        {children}
      </AuthActionContext.Provider>
    </AuthStateContext.Provider>
  );
};

export const useAuthState = () => {
  const context = useContext(AuthStateContext);
  if (!context) throw new Error("useAuthState must be used within AuthProvider");
  return context;
};

export const useAuthAction = () => {
  const context = useContext(AuthActionContext);
  if (!context) throw new Error("useAuthAction must be used within AuthProvider");
  return context;
};
```

---

## Usage in Components

```typescript
// Reading auth state
const { isAuthenticated, isPending, isError, user } = useAuthState();

// Triggering auth actions
const { login, logout, register } = useAuthAction();

// Login
await login("admin", "Admin@123");

// Logout
logout();

// Check role
const isHRAdmin = user?.roleNames?.includes("HRAdmin");
```

---

## Provider Composition (after creating or modifying AuthProvider)

After building or updating the auth provider, register it in the project's provider composition file. Follow these steps exactly.

### Step 1 — Find the composition file

Look for an existing composition file in the providers directory. Common names:

- `src/providers/index.tsx`
- `src/providers/AppProviders.tsx`
- `src/providers/Providers.tsx`

Read it if it exists. If it does not exist, create it at `src/providers/index.tsx`.

### Step 2 — Position AuthProvider as the outermost wrapper

`AuthProvider` must always wrap all other providers. Per the nesting order rule:

```
AuthProvider          ← outermost (Auth / Session)
  ThemeProvider       ← Theme / Style
    QueryProvider     ← Data / Query
      OtherProviders  ← Domain feature providers
        {children}
```

If the composition file already exists and `AuthProvider` is not the outermost wrapper, move it to the outside. Preserve all other providers' order.

### Step 3 — Generate or update the composition file

The file must follow this shape (adapt `'use client'` and import style to match existing files):

```tsx
"use client";

import { AuthProvider } from "./auth-provider";
// … one import per other provider …

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      {/* other providers nested here */}
      {children}
    </AuthProvider>
  );
};
```

Rules:

- Use named export `AppProviders` unless the file already uses a different name — preserve the existing name.
- Do not double-wrap providers already composed inside another provider in this list.
- Do not add logic, state, or side-effects to this file — pure composition only.

### Step 4 — Verify root layout usage

Check the root layout file (typically `src/app/layout.tsx`) to confirm `AppProviders` (or the existing composition component) wraps the app. If the composition file was newly created, import and add it:

```tsx
import { AppProviders } from "@/providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
```

If it already wraps the app, no changes are needed at the consumption site.

### Step 5 — Report

After completing composition, summarise:

- Providers included (outermost → innermost)
- Path of the written/updated composition file
- Whether the root layout needed updating
