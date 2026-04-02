---
name: apply-provider-pattern
description: Use this skill when creating any new provider (employee, department, leave, or any future entity). Contains the canonical 4-file pattern with context, actions, reducer, and index — using redux-actions throughout. Always follow this template exactly.
---

# Mosaic-Talent — Provider Pattern

## Overview

Every data provider in Mosaic-Talent follows a strict 4-file pattern. This keeps state management consistent and predictable across all entities.

---

## File Structure (per provider)

```
providers/<entity>-provider/
├── context.tsx    ← interfaces, initial state, createContext
├── actions.tsx    ← createAction calls using redux-actions
├── reducer.tsx    ← handleActions reducer
└── index.tsx      ← Provider component + useXxxState + useXxxAction hooks
```

---

## context.tsx (template)

```typescript
"use client";
import { createContext } from "react";

// Replace with actual entity shape from ABP swagger
export interface IEntityItem {
  id: string; // UUID
  name: string;
  // ... other fields
}

export interface IEntityStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  items: IEntityItem[];
  selected?: IEntityItem;
  totalCount: number;
}

export interface IEntityActionContext {
  fetchAll: () => void;
  fetchById: (id: string) => void;
  create: (data: Omit<IEntityItem, "id">) => void;
  update: (data: IEntityItem) => void;
  remove: (id: string) => void;
}

export const INITIAL_STATE: IEntityStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  items: [],
  totalCount: 0,
};

export const EntityStateContext =
  createContext<IEntityStateContext>(INITIAL_STATE);
export const EntityActionContext = createContext<IEntityActionContext>({
  fetchAll: () => {},
  fetchById: () => {},
  create: () => {},
  update: () => {},
  remove: () => {},
});
```

---

## actions.tsx (template)

```typescript
import { createAction } from "redux-actions";
import { IEntityStateContext, IEntityItem } from "./context";

export enum EntityStateEnums {
  FETCH_ALL_PENDING = "FETCH_ALL_PENDING",
  FETCH_ALL_SUCCESS = "FETCH_ALL_SUCCESS",
  FETCH_ALL_ERROR = "FETCH_ALL_ERROR",
  FETCH_ONE_PENDING = "FETCH_ONE_PENDING",
  FETCH_ONE_SUCCESS = "FETCH_ONE_SUCCESS",
  FETCH_ONE_ERROR = "FETCH_ONE_ERROR",
  CREATE_PENDING = "CREATE_PENDING",
  CREATE_SUCCESS = "CREATE_SUCCESS",
  CREATE_ERROR = "CREATE_ERROR",
  UPDATE_PENDING = "UPDATE_PENDING",
  UPDATE_SUCCESS = "UPDATE_SUCCESS",
  UPDATE_ERROR = "UPDATE_ERROR",
  DELETE_PENDING = "DELETE_PENDING",
  DELETE_SUCCESS = "DELETE_SUCCESS",
  DELETE_ERROR = "DELETE_ERROR",
}

// Fetch all
export const fetchAllPending = createAction<IEntityStateContext>(
  EntityStateEnums.FETCH_ALL_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);
export const fetchAllSuccess = createAction<
  IEntityStateContext,
  { items: IEntityItem[]; totalCount: number }
>(EntityStateEnums.FETCH_ALL_SUCCESS, ({ items, totalCount }) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  items,
  totalCount,
}));
export const fetchAllError = createAction<IEntityStateContext>(
  EntityStateEnums.FETCH_ALL_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

// Fetch one
export const fetchOnePending = createAction<IEntityStateContext>(
  EntityStateEnums.FETCH_ONE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);
export const fetchOneSuccess = createAction<IEntityStateContext, IEntityItem>(
  EntityStateEnums.FETCH_ONE_SUCCESS,
  (selected) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    selected,
  }),
);
export const fetchOneError = createAction<IEntityStateContext>(
  EntityStateEnums.FETCH_ONE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

// Create
export const createPending = createAction<IEntityStateContext>(
  EntityStateEnums.CREATE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);
export const createSuccess = createAction<IEntityStateContext, IEntityItem>(
  EntityStateEnums.CREATE_SUCCESS,
  (item) => ({ isPending: false, isSuccess: true, isError: false }),
);
export const createError = createAction<IEntityStateContext>(
  EntityStateEnums.CREATE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

// Update
export const updatePending = createAction<IEntityStateContext>(
  EntityStateEnums.UPDATE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);
export const updateSuccess = createAction<IEntityStateContext>(
  EntityStateEnums.UPDATE_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false }),
);
export const updateError = createAction<IEntityStateContext>(
  EntityStateEnums.UPDATE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

// Delete
export const deletePending = createAction<IEntityStateContext>(
  EntityStateEnums.DELETE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);
export const deleteSuccess = createAction<IEntityStateContext>(
  EntityStateEnums.DELETE_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false }),
);
export const deleteError = createAction<IEntityStateContext>(
  EntityStateEnums.DELETE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);
```

---

## reducer.tsx (template)

```typescript
import { handleActions } from "redux-actions";
import { INITIAL_STATE, IEntityStateContext } from "./context";
import { EntityStateEnums } from "./actions";

export const EntityReducer = handleActions<
  IEntityStateContext,
  IEntityStateContext
>(
  {
    [EntityStateEnums.FETCH_ALL_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.FETCH_ALL_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.FETCH_ALL_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.FETCH_ONE_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.FETCH_ONE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.FETCH_ONE_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.CREATE_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.CREATE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.CREATE_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.UPDATE_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.UPDATE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.UPDATE_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.DELETE_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.DELETE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [EntityStateEnums.DELETE_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  INITIAL_STATE,
);
```

---

## index.tsx (template)

```typescript
"use client";
import { useContext, useReducer } from "react";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { EntityReducer } from "./reducer";
import { INITIAL_STATE, EntityStateContext, EntityActionContext, IEntityItem } from "./context";
import {
  fetchAllPending, fetchAllSuccess, fetchAllError,
  fetchOnePending, fetchOneSuccess, fetchOneError,
  createPending, createSuccess, createError,
  updatePending, updateSuccess, updateError,
  deletePending, deleteSuccess, deleteError,
} from "./actions";

const ENDPOINT = '/api/services/app/Entity'; // ← replace Entity with actual name

export const EntityProvider = ({ children }: { children: React.ReactNode }) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(EntityReducer, INITIAL_STATE);

  const fetchAll = async () => {
    dispatch(fetchAllPending());
    try {
      const res = await instance.get(`${ENDPOINT}/GetAll`);
      const { items, totalCount } = res.data.result; // ABP wraps in result
      dispatch(fetchAllSuccess({ items, totalCount }));
    } catch {
      dispatch(fetchAllError());
    }
  };

  const fetchById = async (id: string) => {
    dispatch(fetchOnePending());
    try {
      const res = await instance.get(`${ENDPOINT}/Get`, { params: { id } });
      dispatch(fetchOneSuccess(res.data.result));
    } catch {
      dispatch(fetchOneError());
    }
  };

  const create = async (data: Omit<IEntityItem, 'id'>) => {
    dispatch(createPending());
    try {
      await instance.post(`${ENDPOINT}/Create`, data);
      dispatch(createSuccess({} as IEntityItem));
      await fetchAll(); // refresh list
    } catch {
      dispatch(createError());
    }
  };

  const update = async (data: IEntityItem) => {
    dispatch(updatePending());
    try {
      await instance.put(`${ENDPOINT}/Update`, data);
      dispatch(updateSuccess());
      await fetchAll(); // refresh list
    } catch {
      dispatch(updateError());
    }
  };

  const remove = async (id: string) => {
    dispatch(deletePending());
    try {
      await instance.delete(`${ENDPOINT}/Delete`, { params: { id } });
      dispatch(deleteSuccess());
      await fetchAll(); // refresh list
    } catch {
      dispatch(deleteError());
    }
  };

  return (
    <EntityStateContext.Provider value={state}>
      <EntityActionContext.Provider value={{ fetchAll, fetchById, create, update, remove }}>
        {children}
      </EntityActionContext.Provider>
    </EntityStateContext.Provider>
  );
};

export const useEntityState = () => {
  const context = useContext(EntityStateContext);
  if (!context) throw new Error("useEntityState must be used within EntityProvider");
  return context;
};

export const useEntityAction = () => {
  const context = useContext(EntityActionContext);
  if (!context) throw new Error("useEntityAction must be used within EntityProvider");
  return context;
};
```

---

## Rules

- NEVER skip the 4-file split — even for simple providers
- ALWAYS call `fetchAll()` after create, update, delete to keep the list fresh
- ALWAYS unwrap ABP responses with `res.data.result`
- NEVER use `useEffect` inside the provider to auto-fetch — let the page call `fetchAll` on mount
- Prefix enum values with the entity name to avoid collisions when multiple providers exist:

  ```typescript
  // ✅ Good — no collision
  EMPLOYEE_FETCH_ALL_PENDING
  DEPARTMENT_FETCH_ALL_PENDING

  // ❌ Bad — collision possible
  FETCH_ALL_PENDING (in both providers)
  ```
