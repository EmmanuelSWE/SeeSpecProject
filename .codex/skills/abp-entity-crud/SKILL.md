---
name: abp-entity-crud
description: Generate or update backend CRUD slices for SeeSpec ABP/.NET 8 features. Use when adding or changing a domain entity and its full backend path: Core entity, EntityFrameworkCore registration, DTOs, application service, service interface, permission hooks, migrations checklist, and related documentation/tests.
---

# ABP Entity CRUD

Use this skill when one backend business entity needs to be implemented end to end in the SeeSpec ABP stack.

## Read first

Review:

- `docs/domain-model.md`
- `docs/permissions.md`
- `docs/api-contracts.md`
- `docs/architecture.md`
- `.codex/codex.md`
- `.codex/standards/backend-structure.md`

## Generate this slice

For an entity-driven backend feature, cover these layers in order:

1. domain entity in `aspnet-core/src/SeeSpec.Core`
2. EF Core registration in `aspnet-core/src/SeeSpec.EntityFrameworkCore`
3. DTOs in `aspnet-core/src/SeeSpec.Application`
4. `I{Entity}AppService`
5. `{Entity}AppService`
6. permission hooks if the feature is protected
7. integration tests or a documented reason they are deferred
8. docs updates when contracts or permissions changed

Do not stop after creating only the entity or only the DTO.

## Domain rules

- target `.NET 8`
- keep the `SeeSpec.*` project naming, not legacy `SeeSpecApi.*`
- use singular entity names
- prefer `Guid` ids unless the repo already defines otherwise
- extend audited ABP base entities where appropriate
- place validation and invariants in the domain layer when they represent business rules
- avoid persistence-specific hacks in the application layer

## Entity checklist

When creating or updating the entity:

- define required properties and max lengths
- define tenant and project scoping where applicable
- define navigation properties only when they add clear value
- define lifecycle/status fields as explicit enums when the state matters
- keep names aligned with `docs/domain-model.md`

## EF Core checklist

- add the `DbSet<T>` to the DbContext
- configure indexes, uniqueness, and delete behavior explicitly when needed
- configure composite relationships in `OnModelCreating` when annotations are not enough
- keep PostgreSQL/Npgsql consistency
- do not introduce SQL Server provider assumptions

## DTO rules

Create explicit DTOs rather than leaking entities:

- `{Entity}Dto`
- `Create{Entity}Input`
- `Update{Entity}Input`
- list/filter DTOs if the route needs them

DTOs must:

- expose only contract-safe fields
- carry readable related names only when the UI needs them
- exclude internal navigation graphs
- stay aligned with `docs/api-contracts.md`

## Application service rules

Create:

- `I{Entity}AppService`
- `{Entity}AppService`

Use:

- CRUD base services only when the entity truly fits CRUD
- custom methods when permissions, scoping, or workflow steps are non-trivial

Always handle:

- tenant scope
- project scope
- permission checks
- paging/filtering when listing
- auditability-sensitive mutations carefully

## Permission hook

If the entity is role-sensitive:

- consult `docs/permissions.md`
- add or update permission names
- apply `[AbpAuthorize]` or equivalent checks to mutation paths
- ensure list/detail endpoints do not overexpose cross-tenant or cross-project data

## Migration checklist

Do not treat the feature as done until migration impact is understood.

For each entity change:

- determine whether a migration is required
- name the migration after the behavior change
- ensure the schema is valid for PostgreSQL
- verify required defaults and nullability decisions before generating migration files

## Test expectations

Add backend tests that cover:

- create/read/update/delete happy path
- forbidden mutation path
- tenant/project scoping
- validation failures for bad input

If tests are deferred, state why in the final response.

## Documentation updates

Update docs when you change:

- permissions -> `docs/permissions.md`
- API contract -> `docs/api-contracts.md`
- domain structure -> `docs/domain-model.md`
- architecture assumptions -> `docs/architecture.md`

## Final response

Report:

- what layers were added or changed
- whether migrations are required
- whether tests were added or deferred
- which docs were updated
