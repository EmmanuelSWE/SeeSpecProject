---
name: abp-auth-permissions
description: Define and implement backend authorization and matching frontend permission behavior for SeeSpec. Use when adding role-based access, ABP permission names, project or tenant scoping, section ownership checks, route visibility rules, or mutation guards.
---

# ABP Auth Permissions

Use this skill when a feature changes who can view, create, edit, approve, assign, generate, or validate.

## Read first

Review:

- `docs/permissions.md`
- `docs/spec.md`
- `docs/domain-model.md`
- `docs/api-contracts.md`
- `docs/architecture.md`
- `.codex/codex.md`

## Core rule

Backend enforcement is authoritative.

Frontend visibility must mirror backend rules, but never replace them.

## Permission design process

For each feature:

1. identify the protected resource
2. identify actions on that resource
3. identify scope: host, tenant, project, section
4. map each action to allowed roles
5. implement backend checks first
6. implement frontend hidden/disabled/read-only behavior second
7. update `docs/permissions.md` if behavior changed

## Resource/action model

Use stable action language:

- `view`
- `create`
- `edit`
- `delete`
- `assign`
- `approve`
- `generate`
- `validate`
- `manage`

Do not invent inconsistent verbs for similar operations.

## Backend implementation rules

- define permission constants in one coherent place for the affected module
- use `[AbpAuthorize]` where class-level or method-level protection is clear
- add deeper application checks for project membership and section ownership
- verify tenant and project context for every mutation endpoint
- fail closed when scope cannot be resolved

## Section ownership rules

Respect the current SeeSpec defaults:

- `ProjectLead` may edit all section types
- `BusinessAnalyst` may edit `Requirement`
- `SystemsArchitect` may edit `Architecture` and `Domain`
- `Shared` sections require explicit policy and otherwise stay restricted

If code changes this behavior, update `docs/permissions.md`.

## Frontend implementation rules

Mirror backend authority through:

- route visibility
- hidden actions
- disabled actions
- read-only editors
- explicit permission messaging

Use hidden actions when the user should not discover the capability.
Use disabled actions when the capability is visible but unavailable in the current state.

## Testing expectations

Cover:

- allowed access
- forbidden access
- cross-tenant denial
- cross-project denial
- section-type denial for unauthorized editors

For UI-sensitive changes, also verify:

- nav items appear only when allowed
- edit affordances are hidden or read-only as intended

## Final response

Report:

- the protected resources and actions
- the backend checks added
- the frontend behaviors aligned
- any remaining permission decisions still unresolved
