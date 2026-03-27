---
name: api-contract-to-provider
description: Generate typed frontend API wiring from SeeSpec API contracts. Use when turning an endpoint group into request models, service functions, provider state, actions, reducer, hooks, and page-consumable selectors in the Next.js app.
---

# API Contract To Provider

Use this skill when a documented backend contract needs to become reusable frontend data access and shared state.

## Read first

Review:

- `docs/api-contracts.md`
- `docs/permissions.md` when the data is role-sensitive
- `.codex/skills/provider-standards/SKILL.md`
- `.codex/skills/frontend-standards/SKILL.md`
- `.codex/standards/frontend-structure.md`

## Goal

Translate one endpoint group into:

- typed request/response models
- service functions
- provider actions
- reducer
- provider hooks
- error and pending state handling

## Workflow

1. identify the endpoint group in `docs/api-contracts.md`
2. define or update frontend types
3. implement raw service functions under `app/lib/utils/services/`
4. create or update the provider under `app/lib/providers/<entityProvider>/`
5. expose typed hooks
6. connect page components only after the provider contract is stable

## Provider structure

Follow the repo standard exactly:

- `actions.tsx`
- `context.tsx`
- `reducer.tsx`
- `index.tsx`

Do not invent a different provider layout unless the surrounding code already requires it.

## State rules

At minimum model:

- `isPending`
- `isSuccess`
- `isError`
- entity or collection data
- clear/reset behavior when the page requires it

If the API supports paging or filtering, represent that explicitly instead of hiding it in ad hoc local state.

## Service rules

- keep raw HTTP calls in service files
- keep provider orchestration in provider `index.tsx`
- type request arguments and return values
- normalize the backend response only when doing so improves consistency and does not hide important contract details

## Error handling

Represent errors predictably:

- dispatch pending before request
- dispatch success with typed payload
- dispatch error on failure
- preserve enough information for pages to show useful error messaging

## Permission alignment

If the provider exposes write actions:

- ensure the page consuming it can disable or hide actions based on permission state
- do not assume frontend permission checks are enough

## Testing expectations

When behavior changes materially, add or update:

- unit coverage if the repo has a pattern for provider logic
- Playwright coverage for the visible page flow that consumes the provider

## Final response

Report:

- which contract group was converted
- which provider or services were added or updated
- how pending/error/success are represented
- which consuming pages now depend on the provider
