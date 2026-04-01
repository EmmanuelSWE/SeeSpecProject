# Generic Backend Architecture & Standards Template

## Purpose

This template defines the required backend architecture and coding standards for systems that must follow the same folder structure and implementation discipline as this template set.

Target stack:

- ASP.NET Core
- ABP application services
- Entity Framework Core
- PostgreSQL
- layered modular monolith
- canonical spec-first orchestration

This document is the base law. Every specialized template inherits from it and may only become stricter.

---

## Primary Goal

Generate or evolve backends that follow the same standards as this template set so that:

- services are predictable
- persistence is consistent
- configuration is deployment-safe
- validation is centralized
- canonical structured data remains authoritative
- new code can be introduced into a similarly structured solution without architectural drift

---

## Canonical Rule

Canonical structured data is the single source of truth.

Rules:

- raw scanner output is never authoritative
- diagrams are never authoritative
- generated code is never authoritative by itself
- projections must be derived from canonical persisted structure
- no parallel truth model is allowed

If a feature cannot map back into the canonical model, it must not be introduced.

---

## Required Solution Shape

Backends generated from these standards must match this solution layout closely.

```text
src/
  Project.Core/
  Project.Application/
  Project.EntityFrameworkCore/
  Project.Web.Core/
  Project.Web.Host/
```

Expected responsibilities:

- `Project.Core`
  - entities
  - enums
  - domain services
  - value objects
  - domain events
- `Project.Application`
  - app services
  - DTOs
  - orchestration
  - backend validation and canonical assembly logic
- `Project.EntityFrameworkCore`
  - DbContext
  - EF Core configuration
  - migrations
  - repository persistence wiring
- `Project.Web.Core`
  - API controllers only when ABP dynamic app services are not the public contract
  - web-specific transport glue
- `Project.Web.Host`
  - startup
  - middleware
  - request limits
  - Swagger
  - CORS
  - host configuration

Do not introduce alternate top-level backend folders unless the existing solution already has them.

---

## Dependency Direction

The dependency direction must stay strict:

```text
Web.Host -> Web.Core -> Application -> Core
EntityFrameworkCore -> Core
Application -> EntityFrameworkCore only through approved repository or infrastructure patterns already used in the solution
```

Rules:

- no Core reference to Application
- no Core reference to Web
- no Host business logic
- no controller-owned orchestration
- no renderer-owned business logic

---

## ABP Service Standard

Public backend behavior must follow ABP application service conventions.

Required patterns:

- app services expose the public backend contract
- controllers stay thin or disappear from the active contract when ABP dynamic endpoints are used
- DTOs live in the application layer
- authorization is applied at app-service boundaries
- repositories are injected into services, not controllers

Preferred service style:

```csharp
[AbpAuthorize]
public class ProjectAppService : AsyncCrudAppService<Entity, EntityDto, Guid, PagedAndSortedResultRequestDto, EntityDto, EntityDto>
{
    private readonly IRepository<Entity, Guid> _entityRepository;

    public ProjectAppService(IRepository<Entity, Guid> entityRepository)
        : base(entityRepository)
    {
        _entityRepository = entityRepository;
    }
}
```

Rules:

- business orchestration belongs in app services
- controllers may validate request shape only
- do not split one workflow across controller, service, and helper arbitrarily

---

## Repository and Persistence Standard

Persistence must follow the same patterns defined by this template set.

Required behavior:

- use EF Core repositories
- store entities in PostgreSQL
- keep business logic out of repositories
- perform canonical linking in services before persistence is considered complete

Rules:

- no raw SQL first unless already required nearby
- no custom mini-ORM
- no duplicate persistence path beside EF Core
- migrations must remain EF Core driven

---

## Configuration Standard

Configuration must be explicit, deployment-safe, and stored in standard host/appsettings paths.

Required examples:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=ProjectDb;Username=postgres;Password=postgres"
  },
  "App": {
    "ServerRootAddress": "https://localhost:44311/",
    "ClientRootAddress": "http://localhost:3000/",
    "CorsOrigins": "http://localhost:3000"
  },
  "BackendImport": {
    "MaxUploadSizeBytes": 536870912,
    "MemoryBufferThresholdBytes": 65536
  }
}
```

Host startup should configure explicit upload and form limits when large imports are supported:

```csharp
services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = maxUploadSizeBytes;
    options.MemoryBufferThreshold = memoryBufferThresholdBytes;
});

services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = maxUploadSizeBytes;
});
```

Rules:

- no hardcoded developer-machine paths
- no hidden magic defaults for important limits
- environment-specific values belong in configuration, not service logic

---

## Coding Standards

Generated backend code must follow these rules:

- explicit names
- strict DTO boundaries
- explicit null handling
- deterministic ordering
- concise comments only for non-obvious logic
- async service methods for I/O
- no hidden side effects
- no dynamic or weakly typed authoritative models

Naming rules:

- entities: business nouns
- app services: `<Capability>AppService`
- DTOs: `<Capability>Dto`, `<Action><Capability>Dto`, or existing ABP CRUD naming convention
- interfaces: `I<Capability>AppService`
- enums: singular category names, explicit members

Restrictions:

- no god services
- no parallel "manager", "helper", and "processor" layers for the same workflow unless already standard nearby
- no implicit conversions when explicit mapping is safer
- no controller-heavy business logic
- no alternate storage path for canonical relationships

---

## Canonical Storage Standard

Structured backend content must persist through canonical entities such as:

- `Spec`
- `SpecSection`
- `SectionItem`
- `SectionDependency`

Rules:

- relationships are explicit
- identifiers are stable
- dependencies are persisted explicitly
- projection layers read canonical persisted content first
- no visual cache or renderer output becomes authority

---

## Validation and Transition Gates

Each major phase must have a hard gate.

Typical gates:

- backend exists
- backend validated
- overview accepted
- spec bootstrapped
- dependencies resolved
- ordering valid
- graph generation allowed
- diagram rendering allowed

Rules:

- if a gate fails, downstream phases do not run
- no partial authoritative writes after a failed gate
- error reasons must be deterministic and attributable

---

## Import and File Handling Standard

When backend import exists, use this deployment-safe approach.

Required behavior:

- ZIP upload is the primary portable import mode
- upload streams to temp disk
- extraction occurs in isolated temp workspace
- validation happens before backend creation
- folder import is secondary and trusted-only

Restrictions:

- no browser-local folder path assumptions for deployed environments
- no memory-buffered giant uploads by default
- no permanent raw archive storage in the import milestone unless explicitly required

---

## API Contract Standard

Frontend-facing contracts must be stable and explicit.

Preferred ABP route style:

- `/services/app/Backend/Upload`
- `/services/app/Backend/ImportFolder`
- `/services/app/Spec/Assemble`

Rules:

- do not mix old controller routes with new app-service routes
- do not bypass provider/service client conventions on the frontend
- request shape and response shape must be typed explicitly

---

## Prohibited Architecture Drift

The following are not allowed unless the existing solution already uses them:

- CQRS subsystem introduced for a small feature
- MediatR-only rewrite of ABP service flows
- alternate graph store
- alternate prompt store
- controller-owned workflows
- second upload subsystem
- second dependency subsystem
- second spec subsystem
- renderer-owned persistence

---

## Template Output Goals

Any backend produced from these standards should:

- compile cleanly in a solution using this folder structure
- fit ABP app-service conventions without major refactor
- use PostgreSQL-safe EF Core persistence
- expose deterministic, testable workflows
- keep canonical structured content authoritative
- be safe for deployment, not just local development

---

## One-Line Principle

Build ABP backends where application services orchestrate deterministic, validated workflows over a canonical persisted model, and every projection is derived from that model rather than competing with it.
