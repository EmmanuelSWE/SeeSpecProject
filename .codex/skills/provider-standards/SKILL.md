---
name: create-provider-context
description: Scaffold a typed React Context provider with actions and reducer for CRUD operations on a specific entity, following the Recipe provider pattern (actions.tsx, context.tsx, reducer.tsx, index.tsx).
---

## When to use this skill

Use this skill whenever the user wants to create a **new Provider + Context + Actions + Reducer** for a given domain entity (e.g. Recipe, User, Product) that follows this structure:

- `actions.tsx`
- `context.tsx`
- `reducer.tsx`
- `index.tsx`

The goal is to generate a complete, strongly-typed CRUD state management layer that mirrors the **Recipe** example:

- Uses **TypeScript**
- Uses **React Context + useReducer**
- Uses **redux-actions** (`createAction`, `handleActions`)
- Talks to an API via an axios instance (`getAxiosInstace` utility)
- Exposes **custom hooks** for state and actions

---

## Overall conventions

When using this skill, follow these conventions:

1. **Entity Naming**
   - Let the entity name be `Entity` (e.g. `Recipe`, `User`, `Product`).
   - Use the **singular** for types: `IEntity`, `IEntityStateContext`, `IEntityActionContext`.
   - Use the **plural** form for arrays and collection state: `entities`, `recipes`, `users`, etc.
   - Action enums should be prefixed with the entity name, e.g. `RecipeActionEnums`, `UserActionEnums`.

2. **Files to create**

For an entity `Recipe`, create:

- `actions.tsx`
- `context.tsx`
- `reducer.tsx`
- `index.tsx`

in the target directory (e.g. `src/providers/recipe` or similar location chosen by the user).

3. **Libraries and types**
   - Use **TypeScript**.
   - Import `createAction` and `handleActions` from **redux-actions**.
   - Use `React.ReactNode` for the `children` prop of the provider.
   - Do **not** use `any`. Always create proper interfaces/types.

4. **API access**
   - Use an existing utility like `getAxiosInstace` imported from `../../utils/axiosInstance` (or whatever path matches the repo).
   - Define a `BASE_URL` constant:
     - Prefer reusing the existing pattern in the project (e.g. `import.meta.env.Backend_API_URL` or `import.meta.env.VITE_<ENTITY>_API_URL`).
   - CRUD handlers use `async` functions and `try/catch` or `.then/.catch` to call the API and dispatch actions.

---

## context.tsx – Define types and React contexts

Create a `context.tsx` file that:

1. **Defines the entity interface**

For `Recipe` (example):

```ts
export interface IRecipe {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string[];
  image: string;
  rating: number;
}

For other entities, the fields must match the domain model described by the user.

Defines state context

export interface IRecipeStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  recipe?: IRecipe;
  recipes?: IRecipe[];
}

General pattern:

isPending, isSuccess, isError flags.

Optional entity and entities (or recipe / recipes) properties.

Defines actions context

export interface IRecipeActionContext {
  getRecipe: (id: number) => void;
  getRecipes: () => void;
  createRecipe: (recipe: Omit<IRecipe, "id">) => void;
  updateRecipe: (id: number, recipe: Partial<IRecipe>) => void;
  deleteRecipe: (id: number) => void;
}

Patterns:

get<Entity>(id: IdType)

get<Entities>()

create<Entity>(payloadWithoutId)

update<Entity>(id, partialPayload)

delete<Entity>(id)

Adjust types (e.g. string id) if the user specifies.

Initial states

export const INITIAL_STATE: IRecipeStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
};

export const INITIAL_ACTION_STATE: IRecipeActionContext = {
  getRecipe: () => {},
  getRecipes: () => {},
  createRecipe: () => {},
  updateRecipe: () => {},
  deleteRecipe: () => {},
};

Create contexts

import { createContext } from "react";

export const RecipeStateContext =
  createContext<IRecipeStateContext>(INITIAL_STATE);

export const RecipeActionContext =
  createContext<IRecipeActionContext | undefined>(undefined);
actions.tsx – Define action enums and action creators

Create an actions.tsx file that:

Imports

import { createAction } from "redux-actions";
import type { IRecipe, IRecipeStateContext } from "./context";

Defines the action enum

Follow this pattern for each CRUD operation:

export enum RecipeActionEnums {
  getRecipePending = "GET_RECIPE_PENDING",
  getRecipeSuccess = "GET_RECIPE_SUCCESS",
  getRecipeError = "GET_RECIPE_ERROR",

  getRecipesPending = "GET_RECIPES_PENDING",
  getRecipesSuccess = "GET_RECIPES_SUCCESS",
  getRecipesError = "GET_RECIPES_ERROR",

  createRecipePending = "CREATE_RECIPE_PENDING",
  createRecipeSuccess = "CREATE_RECIPE_SUCCESS",
  createRecipeError = "CREATE_RECIPE_ERROR",

  updateRecipePending = "UPDATE_RECIPE_PENDING",
  updateRecipeSuccess = "UPDATE_RECIPE_SUCCESS",
  updateRecipeError = "UPDATE_RECIPE_ERROR",

  deleteRecipePending = "DELETE_RECIPE_PENDING",
  deleteRecipeSuccess = "DELETE_RECIPE_SUCCESS",
  deleteRecipeError = "DELETE_RECIPE_ERROR",
}

For other entities, always adjust names consistently.

Action creators pattern

Pending actions: set flags (isPending, isSuccess, isError) accordingly.

Success actions: set flags and include entity or collection.

Error actions: set error flag.

Example (single entity):

export const getRecipePending = createAction<IRecipeStateContext>(
  RecipeActionEnums.getRecipePending,
  () => ({ isPending: true, isSuccess: false, isError: false })
);

export const getRecipeSuccess = createAction<IRecipeStateContext, IRecipe>(
  RecipeActionEnums.getRecipeSuccess,
  (recipe: IRecipe) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    recipe,
  })
);

export const getRecipeError = createAction<IRecipeStateContext>(
  RecipeActionEnums.getRecipeError,
  () => ({ isPending: false, isSuccess: false, isError: true })
);

Example (collection):

export const getRecipesPending = createAction<IRecipeStateContext>(
  RecipeActionEnums.getRecipesPending,
  () => ({ isPending: true, isSuccess: false, isError: false })
);

export const getRecipesSuccess = createAction<IRecipeStateContext, IRecipe[]>(
  RecipeActionEnums.getRecipesSuccess,
  (recipes: IRecipe[]) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    recipes,
  })
);

export const getRecipesError = createAction<IRecipeStateContext>(
  RecipeActionEnums.getRecipesError,
  () => ({ isPending: false, isSuccess: false, isError: true })
);

Repeat the same structure for create, update, delete.

reducer.tsx – Implement the reducer using handleActions

Create a reducer.tsx file that:

Imports

import { handleActions } from "redux-actions";
import { INITIAL_STATE } from "./context";
import type { IRecipeStateContext } from "./context";
import { RecipeActionEnums } from "./actions";

Defines reducer pattern

Use handleActions<IRecipeStateContext, IRecipeStateContext> and for each case:

Spread existing state.

Spread action.payload.

For update and delete success, adjust collection (recipes) appropriately.

Example:

export const RecipeReducer = handleActions<IRecipeStateContext, IRecipeStateContext>(
  {
    // Single Recipe
    [RecipeActionEnums.getRecipePending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [RecipeActionEnums.getRecipeSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [RecipeActionEnums.getRecipeError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),

    // All Recipes
    [RecipeActionEnums.getRecipesPending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [RecipeActionEnums.getRecipesSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [RecipeActionEnums.getRecipesError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),

    // Create Recipe
    [RecipeActionEnums.createRecipePending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [RecipeActionEnums.createRecipeSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
      // Optionally push into existing collection if present
      recipes: state.recipes
        ? [...state.recipes, action.payload.recipe!]
        : action.payload.recipes ?? state.recipes,
    }),
    [RecipeActionEnums.createRecipeError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),

    // Update Recipe
    [RecipeActionEnums.updateRecipePending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [RecipeActionEnums.updateRecipeSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
      recipes: state.recipes?.map((r) =>
        r.id === action.payload.recipe!.id ? action.payload.recipe! : r
      ),
    }),
    [RecipeActionEnums.updateRecipeError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),

    // Delete Recipe
    [RecipeActionEnums.deleteRecipePending]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
    [RecipeActionEnums.deleteRecipeSuccess]: (state, action) => ({
      ...state,
      ...action.payload,
      // Optionally remove from collection & clear single
      recipes: state.recipes?.filter(
        (r) => r.id !== (action as any).meta?.id // or include id in payload/meta
      ),
      recipe: undefined,
    }),
    [RecipeActionEnums.deleteRecipeError]: (state, action) => ({
      ...state,
      ...action.payload,
    }),
  },
  INITIAL_STATE
);

For other entities, keep the same pattern but adjust property names (recipes → users, etc.) and id field type.

index.tsx – Implement the Provider and hooks

Create an index.tsx file that:

Imports

import { useContext, useReducer } from "react";
import { getAxiosInstace } from "../../utils/axiosInstance";

import {
  createRecipePending,
  createRecipeSuccess,
  createRecipeError,
  deleteRecipePending,
  deleteRecipeSuccess,
  deleteRecipeError,
  getRecipeError,
  getRecipePending,
  getRecipeSuccess,
  getRecipesError,
  getRecipesPending,
  getRecipesSuccess,
  updateRecipePending,
  updateRecipeSuccess,
  updateRecipeError,
} from "./actions";

import type { IRecipe } from "./context";
import {
  INITIAL_STATE,
  RecipeActionContext,
  RecipeStateContext,
} from "./context";
import { RecipeReducer } from "./reducer";

Define BASE_URL

Use the project’s env convention, e.g.:

const BASE_URL = import.meta.env.Backend_API_URL;
// or const BASE_URL = import.meta.env.VITE_RECIPE_API_URL;

Define the Provider component

Pattern:

export const RecipeProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(RecipeReducer, INITIAL_STATE);
  const instance = getAxiosInstace();

  const getRecipe = async (id: number) => {
    dispatch(getRecipePending());
    try {
      const response = await instance.get(`${BASE_URL}/${id}`);
      dispatch(getRecipeSuccess(response.data));
    } catch (error) {
      console.error(error);
      dispatch(getRecipeError());
    }
  };

  const getRecipes = async () => {
    dispatch(getRecipesPending());
    try {
      const response = await instance.get(BASE_URL);
      dispatch(getRecipesSuccess(response.data.recipes));
    } catch (error) {
      console.error(error);
      dispatch(getRecipesError());
    }
  };

  const createRecipe = async (recipe: Omit<IRecipe, "id">) => {
    dispatch(createRecipePending());
    try {
      const response = await instance.post(BASE_URL, recipe);
      dispatch(createRecipeSuccess(response.data));
    } catch (error) {
      console.error(error);
      dispatch(createRecipeError());
    }
  };

  const updateRecipe = async (id: number, recipe: Partial<IRecipe>) => {
    dispatch(updateRecipePending());
    try {
      const response = await instance.put(`${BASE_URL}/${id}`, recipe);
      dispatch(updateRecipeSuccess(response.data));
    } catch (error) {
      console.error(error);
      dispatch(updateRecipeError());
    }
  };

  const deleteRecipe = async (id: number) => {
    dispatch(deleteRecipePending());
    try {
      await instance.delete(`${BASE_URL}/${id}`);
      dispatch(deleteRecipeSuccess());
    } catch (error) {
      console.error(error);
      dispatch(deleteRecipeError());
    }
  };

  return (
    <RecipeStateContext.Provider value={state}>
      <RecipeActionContext.Provider
        value={{ getRecipe, getRecipes, createRecipe, updateRecipe, deleteRecipe }}
      >
        {children}
      </RecipeActionContext.Provider>
    </RecipeStateContext.Provider>
  );
};

Custom hooks

Always generate the two hooks with error checks:

export const useRecipeState = () => {
  const context = useContext(RecipeStateContext);
  if (!context) {
    throw new Error("useRecipeState must be used within a RecipeProvider");
  }
  return context;
};

export const useRecipeActions = () => {
  const context = useContext(RecipeActionContext);
  if (!context) {
    throw new Error("useRecipeActions must be used within a RecipeProvider");
  }
  return context;
};

For other entities, rename appropriately.

## Project structure and ordering rules

For frontend work, always follow the project's required ordering and keep files small, focused, and predictable.

### File/folder ordering
When adding logic for a screen, feature, or component, prefer this order:

1. `hooks`
2. `helpers`
3. `actions`

Do not introduce a different ordering unless the repo already enforces one for that exact area.

Examples:
- `src/features/<feature>/hooks`
- `src/features/<feature>/helpers`
- `src/features/<feature>/actions`

If files live in a single folder instead of nested folders, still keep the same conceptual order when creating or updating files:
- hooks first
- helpers second
- actions third

### Rules of Hooks
Always follow the Rules of Hooks exactly:
- Only call hooks at the top level
- Never call hooks inside loops, conditions, or nested functions
- Only call hooks from React components or custom hooks
- Name custom hooks with the `use` prefix
- Keep custom hooks focused and reusable
- Move repeated stateful logic out of components into custom hooks when appropriate

### Import ordering inside frontend files
Prefer imports in this order when applicable:
1. React / Next imports
2. Third-party libraries
3. Internal hooks
4. Internal helpers
5. Internal actions
6. Types
7. Styles

### Composition preference
When implementing frontend behavior:
- put reusable stateful logic in hooks
- put pure transformation/formatting logic in helpers
- put user-triggered workflow functions in actions
- keep UI components focused on rendering and composition

### Size and readability
- Do not create overly long files
- Split complex screens into subcomponents, hooks, helpers, and actions
- Prefer short, readable functions over large multi-purpose functions
- Avoid deeply nested logic; extract helper functions or hooks instead