# Application Services & Use Case Template

## Inheritance

This template inherits all rules from the Generic Backend Architecture & Standards Template.

---

## Purpose

This template defines how business intent is exposed through ABP application services using the same folder and coding standards defined by this template set.

It governs:

- app services
- use cases
- endpoint contracts
- DTO boundaries
- authorization
- orchestration

---

## Detailed Goals

A compliant application layer should:

- expose business intent cleanly
- remain thin enough to reason about
- centralize orchestration in app services
- preserve domain boundaries
- return explicit DTO contracts
- keep controllers thin or unused for public contract when ABP dynamic endpoints are active

---

## Core Rule

One meaningful use case maps to one explicit app-service endpoint.

Rules:

- endpoint names reflect business intent
- endpoint contracts are typed
- app service methods are orchestration boundaries
- authorization is explicit at the boundary

Good examples:

- `CreateRequirementAsync`
- `AcceptOverviewAsync`
- `UploadAsync`

Bad examples:

- `HandleDataAsync`
- `ExecuteAsync`
- `RunStuffAsync`

---

## ABP Contract Standard

Application services must follow the ABP conventions required by this template set.

Example:

```csharp
[AbpAuthorize]
public class BackendAppService : AsyncCrudAppService<Backend, BackendDto, Guid, PagedAndSortedResultRequestDto, BackendDto, BackendDto>, IBackendAppService
{
    private readonly IRepository<Backend, Guid> _backendRepository;

    public BackendAppService(IRepository<Backend, Guid> backendRepository)
        : base(backendRepository)
    {
        _backendRepository = backendRepository;
    }
}
```

Rules:

- app services expose the public contract
- custom workflow methods live here
- do not move workflow logic back to controllers
- do not bypass app services with ad hoc repository calls from web layer

---

## DTO Rules

DTOs define transport boundaries.

Rules:

- DTOs are not entities
- DTOs must expose only required contract data
- request and response types must stay explicit
- file upload contracts must match actual binding shape

Example upload boundary:

```csharp
public async Task<BackendUploadResultDto> UploadAsync(IFormFile file, CancellationToken cancellationToken)
```

Rules:

- use `FormData` on the frontend when backend expects multipart
- do not serialize file uploads as JSON
- do not leak internal persistence navigation graphs to frontend consumers

---

## Authorization Rules

Authorization must be explicit at the service boundary.

Rules:

- use ABP authorization attributes or equivalent boundary checks
- do not rely on frontend gating alone
- use deeper checks only when domain-critical rules require them

Restrictions:

- no "hidden" authorization implied only by route visibility
- no UI-only enforcement

---

## Orchestration Rules

Application services may:

- validate request shape
- load entities
- coordinate domain operations
- update canonical spec structures
- persist through repositories
- invoke import/validation/render pipelines only after gates pass

Application services may not:

- own host startup configuration
- act as generic dumping ground for unrelated workflows
- hold domain invariants that belong in Core

---

## Use Case Structure

Each use case should define:

- actor
- intent
- permission boundary
- input DTO
- output DTO
- side effects
- canonical storage impact
- failure cases

Rules:

- implementation facts discovered by scanning are not automatically use cases
- business intent still requires explicit use-case mapping

---

## Frontend Contract Alignment

Generated or maintained backends must support a frontend that calls ABP app-service routes directly.

Example route style:

- `/services/app/Backend/Upload`
- `/services/app/Backend/ImportFolder`
- `/services/app/Spec/Assemble`

Rules:

- do not leave stale controller-only routes as the active contract
- app-service response shape must remain typed and stable
- upload/import results must support list refresh or rehydration

---

## Configuration Awareness

App services may depend on host configuration indirectly through injected services, but should not own startup wiring.

Examples of config that app services may rely on indirectly:

- import size limits
- temp workspace settings
- PlantUML path
- connection strings

Restrictions:

- no hardcoded environment paths in app services
- no direct dependency on developer workstation assumptions

---

## Review Checklist

Confirm:

- app services are the public orchestration layer
- endpoint names reflect business intent
- DTOs are explicit
- authorization is explicit
- controllers are thin
- use cases map cleanly to canonical persisted structures

---

## One-Line Principle

Expose business intent through explicit ABP app-service endpoints that orchestrate validated workflows without stealing domain meaning or controller responsibilities.
