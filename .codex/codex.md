# Project Operating Rules

## Purpose
This file defines repo-wide engineering rules that apply by default to all work in this repository.

## Product Identity
- Product name: SeeSpec
- Primary domain: visual spec-driven development platform
- Primary stack: ABP Framework (.NET 8), PostgreSQL, Next.js frontend

## Core Engineering Rules
- Always preserve architectural boundaries between domain, application, infrastructure, and presentation layers.
- Never introduce cross-layer shortcuts without explicit approval.
- Never mix provider assumptions. PostgreSQL must use Npgsql everywhere.
- Prefer explicit, reviewable code over hidden framework magic.
- Do not rewrite large unrelated areas unless the task explicitly requires it.

## Backend Standards
- Target framework: net8.0
- ORM: EF Core through ABP
- Database provider: PostgreSQL via Npgsql
- Migrations must be provider-consistent
- Application services must not contain domain persistence hacks
- Business logic belongs Application project

- Public DTOs must be explicit and versionable
- Caching must include invalidation strategy
- For dictionaries/maps used as caches or lookup accelerators, define:
  - key source
  - load source
  - refresh/invalidation path
  - concurrency behavior
  - tenant/project scoping behavior if applicable
  - follow the backend structure in `.codex\standards\backend-structure.md`

## Frontend Standards
- Use Next.js App Router
- Preserve established product visual language
- Role-aware UI is required where permissions affect behavior
- All pages must define:
  - loading state
  - empty state
  - pending state
  - error state
  - success state where relevant
- Forms must define validation behavior and disabled/loading state
  - follow the frontend structure in `.codex\standards\frontend-structure.md`

## Naming Conventions
- Entities: singular nouns
- DTOs: `{Entity}Dto`, `Create{Entity}Input`, `Update{Entity}Input`
- Services: `{Entity}AppService`
- Interfaces: `I{Entity}AppService`
- Specs and docs must use the product name “SeeSpec”

## Documentation Rules
When changing:
- permissions -> update `docs/permissions.md`
- API shape -> update `docs/api-contracts.md`
- system structure -> update `docs/architecture.md`
- UX behavior -> update `docs/ui-spec.md`
- major feature behavior -> update `docs/spec.md` and feature plan

## Testing Rules
- New backend behavior must include tests or a documented reason why not
- Migration/provider changes must be validated against runtime config
- Any performance optimization must include:
  - measured bottleneck
  - chosen structure
  - invalidation/update behavior
  - failure mode

## Definition of Done
A task is not complete unless:
- code compiles
- migrations/config are consistent
- affected docs are updated
- permissions impact is documented
- acceptance criteria are satisfied

## Backend database Consistency
- If a connection string uses PostgreSQL keys (`Host`, `Port`, `Username`, `SSL Mode`), EF Core must use Npgsql.
- `UseSqlServer()` must not appear in source code.
- SQL Server migrations must not coexist with active PostgreSQL migrations.