# SeeSpec Architecture

## 1. System Context

SeeSpec is structured as a multi-project solution with a .NET backend and a Next.js frontend. The backend is responsible for identity, tenancy, authorization, persistence, specification processing, generation workflow orchestration, and migration execution. The frontend is responsible for user interaction, admin navigation, role-aware workspace presentation, and access to specification and collaboration workflows.

Current major repository areas:

- `aspnet-core/src/SeeSpec.Core`
  - core domain and shared configuration
- `aspnet-core/src/SeeSpec.Application`
  - application services and DTO-oriented business flow
- `aspnet-core/src/SeeSpec.EntityFrameworkCore`
  - EF Core persistence, DbContext configuration, migrations, and seeding
- `aspnet-core/src/SeeSpec.Web.Core`
  - shared web/API layer logic
- `aspnet-core/src/SeeSpec.Web.Host`
  - ASP.NET Core host and runtime entry point
- `aspnet-core/src/SeeSpec.Migrator`
  - database migration runner
- `nextjs`
  - frontend routes, layouts, and UI components
- `angular`
  - Angular reference UI preserved for parity and migration comparison

External system dependencies:

- PostgreSQL as the application database
- ABP Framework as the backend application foundation
- Npgsql as the EF Core database provider
- draw.io XML and future diagram tooling as specification input sources
- OpenAI-backed generation workflows as downstream specification consumers

## 2. Layered Structure

### Domain Layer

Owned by `SeeSpec.Core`.

Responsibilities:

- tenant, user, role, and core platform concepts
- domain configuration and shared constants
- localization and security primitives
- durable rules that should not depend on persistence or transport

This layer should contain stable business meaning and cross-cutting domain concepts, not HTTP or UI logic.

### Application Layer

Owned by `SeeSpec.Application`.

Responsibilities:

- application services
- DTOs and request/response models
- orchestration of use cases
- permission-aware business workflows
- transformation between external-facing contracts and domain behavior

This layer coordinates work. It should not contain infrastructure-specific persistence shortcuts when those belong lower in the stack.

### Infrastructure and Persistence Layer

Owned by `SeeSpec.EntityFrameworkCore`.

Responsibilities:

- `SeeSpecDbContext`
- EF Core mappings and provider configuration
- database migrations
- seeding routines
- migrator integration support

This layer is the boundary where database provider decisions become concrete. PostgreSQL and Npgsql consistency are mandatory here.

### Web/API Layer

Owned by `SeeSpec.Web.Core` and `SeeSpec.Web.Host`.

Responsibilities:

- API hosting
- auth configuration
- host startup
- request pipeline
- integration with ABP web behaviors

`SeeSpec.Web.Core` contains reusable web concerns, while `SeeSpec.Web.Host` contains deployment/runtime-specific startup behavior.

### Frontend Layer

Owned by `nextjs`.

Responsibilities:

- landing page and authentication screens
- admin shell navigation
- role-aware views for users, roles, tenants, and future project/spec workspaces
- rendering of product UI state and interaction flow

The current frontend includes mirrored Angular account/admin pages and a root landing page, while the long-term primary UI target is a role-aware single-page workspace.

## 3. Data Flow

### Authentication Flow

1. User accesses the frontend.
2. User authenticates against the backend host.
3. Tenant and role context determine available routes and operations.
4. Frontend reflects authorization state through route visibility and workspace behavior.

### Specification Editing Flow

1. A user opens a project-scoped specification.
2. Role and assignment determine whether the user may edit the targeted section.
3. Structured changes update specification entities such as sections, section items, dependencies, and diagram links.
4. The specification remains the machine-readable source for generation.

### Generation Flow

1. A specification change or user action identifies affected sections.
2. Dependency ordering is resolved through section relationships.
3. Generation consumes the affected specification context.
4. Output files are written in structured order.
5. A `GenerationSnapshot` is created.
6. Completion notes may be attached to document the result and responsible user.

### Migration Flow

1. The migrator reads PostgreSQL connection settings.
2. EF Core applies the Npgsql migration set.
3. Host and tenant seed routines initialize required baseline data.
4. Runtime and migrator must remain provider-consistent with PostgreSQL.

## 4. Key Technical Decisions

### ABP-Based Backend Structure

The backend follows the ABP module style rather than a flat ASP.NET application. This is important because tenancy, authorization, auditing, and conventional application service patterns are already built around ABP assumptions.

### PostgreSQL as the Database Target

The project target is PostgreSQL. As a result:

- the EF provider must be Npgsql
- runtime connection strings must use PostgreSQL format
- migrations must be generated for PostgreSQL, not SQL Server
- host, migrator, and DbContext configuration must remain consistent

### EF Core for Persistence

EF Core is the persistence mechanism used through ABP. It owns:

- entity persistence
- migration generation and execution
- provider-specific schema behavior

### Specification-Driven Generation

The system architecture assumes generated code is derived from structured specification state. This means the architecture must preserve:

- dependency ordering between sections
- traceability of generation events
- explicit ownership of specification changes

### Role-Aware Collaboration

The architecture is not only tenant-aware but also project- and role-aware. A user’s permissions should be evaluated against the active project context and assignment role, not only against tenant membership.

## 5. Module Boundaries

### `SeeSpec.Core`

Owns:

- domain-level concepts
- shared constants
- base configuration
- localization/security setup

Must not own:

- EF migrations
- HTTP endpoint behavior
- frontend concerns

### `SeeSpec.Application`

Owns:

- use case orchestration
- DTOs
- application services

Must not own:

- concrete web host startup
- direct UI logic
- provider-specific migration logic

### `SeeSpec.EntityFrameworkCore`

Owns:

- DbContext
- provider configuration
- migrations
- seeding

Must not own:

- frontend logic
- page/view behavior
- unrelated application orchestration

### `SeeSpec.Web.Core`

Owns:

- reusable API/web composition logic

Must not own:

- persistence configuration details that belong in EF Core
- frontend composition

### `SeeSpec.Web.Host`

Owns:

- runtime host process
- startup configuration
- application entry point

Must not own:

- domain or persistence logic beyond composition

### `SeeSpec.Migrator`

Owns:

- explicit migration execution
- seed orchestration at migration time

Must not own:

- product UI logic
- general application service behavior

### `nextjs`

Owns:

- product-facing web UI
- route layout composition
- auth and admin screens
- future role-aware workspace rendering

Must not own:

- authoritative business rule enforcement
- backend data ownership logic

## 6. State and Caching

### Source of Truth

- diagrams are the visual source of design intent
- structured specification entities are the machine-readable source of generation truth
- generated code is derived output
- database records remain the durable runtime source for tenant, user, project, and specification state

### Runtime State

Important runtime state includes:

- authenticated user context
- active tenant context
- active project and assignment context
- specification section and dependency state
- generation history through snapshots and completion notes

### Caching Guidance

Caching and dictionaries may be introduced for performance, but only with explicit architecture decisions. Any dictionary-based optimization must define:

- key source
- scope
- tenant/project isolation behavior
- refresh or invalidation path
- correctness guarantees after write operations

No global mutable cache should be introduced without defined invalidation behavior.

## 7. Failure Modes

- Provider mismatch:
  - if connection strings and EF provider diverge, the system fails at migration or runtime
- Migration drift:
  - if migration files do not match the active provider or current model, startup and migration paths become unstable
- Permission boundary drift:
  - if frontend visibility and backend authorization rules diverge, users may see actions they cannot perform or, worse, perform actions they should not
- Specification ownership ambiguity:
  - if project ownership and section edit boundaries are unclear, collaboration becomes inconsistent and traceability is weakened
- Stale lookup optimization:
  - if in-memory dictionaries or caches are introduced without invalidation, retrieval becomes fast but incorrect

## 8. Diagrams

Recommended architecture diagram set for this repository:

- system context diagram
  - frontend, backend host, migrator, database, diagram/spec sources
- layered module diagram
  - `SeeSpec.Core`, `SeeSpec.Application`, `SeeSpec.EntityFrameworkCore`, `SeeSpec.Web.Core`, `SeeSpec.Web.Host`, `SeeSpec.Migrator`, `nextjs`
- generation flow diagram
  - project -> spec -> section/dependency -> generation -> snapshot -> completion note

These diagram references should eventually be linked from `design/figma-links.md` or stored in a dedicated design/architecture asset folder once maintained visually.
