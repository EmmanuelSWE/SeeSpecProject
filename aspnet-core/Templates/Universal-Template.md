# Generic Backend Architecture & Standards Template

*(DDD + Layered Modular Monolith)*

---

# 🔷 1. Overview

This template defines a **generic, reusable backend architecture** based on:

* Domain-Driven Design (DDD)
* Layered modular monolith structure
* Strict separation of concerns
* Deterministic feature and data flow

This template is framework-agnostic but aligns well with systems like ASP.NET Core + ABP.

---

# 🔷 2. Solution Structure

```
src/
├── Project.Core/                  # Domain layer
├── Project.Application/           # Application layer
├── Project.EntityFrameworkCore/   # Infrastructure / persistence
├── Project.Web.Core/              # Shared web infrastructure
└── Project.Web.Host/              # API host

test/
├── Project.Tests/
└── Project.Web.Tests/
```

---

# 🔷 3. Dependency Rules

```
Web.Host
  └── Web.Core
        └── Application
              ├── Core
              └── Infrastructure
                    └── Core
```

### Rules

* Dependencies flow **downward only**
* No layer may depend on a higher layer
* Domain layer must have **zero external dependencies**

---

# 🔷 4. Domain Layer (Core)

### Purpose

* Business entities
* Domain rules
* Domain services
* Value objects
* Enums
* Domain events

### Structure

```
Project.Core/
├── Domains/
│   ├── ModuleA/
│   ├── ModuleB/
├── Authorization/
├── Validation/
├── Localization/
├── MultiTenancy/
```

### Rules

* No EF Core / HTTP / UI code
* Use data annotations for validation
* Business logic lives here
* Entities should use a base audited entity if available

### Example

```csharp
public class Entity : FullAuditedEntity<Guid>
{
    [Required]
    public string Name { get; set; }
}
```

---

# 🔷 5. Application Layer

### Purpose

* Orchestrates use cases
* Handles DTOs
* Applies authorization
* Maps domain → DTO

### Structure

```
Project.Application/
├── Services/
│   ├── EntityService/
│   │   ├── IEntityAppService.cs
│   │   ├── EntityAppService.cs
│   │   └── DTO/
```

### Naming Conventions

| Type      | Convention          |
| --------- | ------------------- |
| Interface | I{Entity}AppService |
| Service   | {Entity}AppService  |
| DTO       | {Entity}Dto         |

### Rules

* Every service must have an interface
* Use CRUD base services where possible
* DTOs must not expose EF navigation properties
* Authorization via attributes

---

# 🔷 6. Infrastructure Layer

### Purpose

* Database access
* DbContext
* Migrations
* Seed data

### Structure

```
Project.EntityFrameworkCore/
├── DbContext/
├── Migrations/
├── Seed/
├── Repositories/
```

### Rules

* One `DbSet` per entity
* Application layer uses repositories, not DbContext
* Only use `OnModelCreating` for complex mappings

---

# 🔷 7. Web Infrastructure Layer

### Purpose

* Authentication setup
* JWT handling
* External providers
* Shared controllers

### Structure

```
Project.Web.Core/
├── Authentication/
├── Controllers/
├── Models/
```

### Rules

* No business logic
* Only infrastructure code

---

# 🔷 8. Host Layer

### Purpose

* App startup
* Middleware pipeline
* Swagger
* CORS
* Configuration

### Structure

```
Project.Web.Host/
├── Startup/
├── Controllers/
├── appsettings.json
```

### Middleware Order

1. CORS
2. Exception handling
3. Static files
4. Authentication
5. Authorization
6. Routing
7. Swagger

### Rules

* No business logic
* Delegate to Application layer

---

# 🔷 9. Feature Implementation Flow

### Step-by-step

1. Create domain entity (Core)
2. Add DbSet (Infrastructure)
3. Create migration
4. Create DTO (Application)
5. Create service interface
6. Implement service
7. API exposed automatically or via controller

---

# 🔷 10. Cross-Cutting Concerns

| Concern       | Handling              |
| ------------- | --------------------- |
| Auth          | JWT                   |
| Authorization | Attributes            |
| Logging       | Framework logger      |
| Validation    | Data annotations      |
| Mapping       | AutoMapper            |
| DI            | IoC container         |
| Exceptions    | Global handler        |
| Multi-tenancy | Tenant-aware entities |

---

# 🔷 11. Canonical Data Rule (CRITICAL)

There must be **one source of truth** for structured system data.

### Rules

* All structured data must exist in a canonical model
* No duplicate representations
* All other outputs are projections

---

# 🔷 12. Spec-First Architecture Rule (GENERIC)

### Canonical Rule

> Raw system input produces semantic facts → those facts MUST be transformed into a structured canonical model → only then may derived representations be generated.

### Implications

* No diagrams from raw data
* No graphs from raw data
* Everything must originate from structured canonical data

---

# 🔷 13. Layer Responsibility Separation

| Layer            | Responsibility      |
| ---------------- | ------------------- |
| Input Processing | Raw data extraction |
| Semantic Model   | Meaning             |
| Canonical Model  | Structure           |
| Graph            | Relationships       |
| Rendering        | Visualization       |

### Rules

* No layer overlaps responsibilities
* No shortcutting

---

# 🔷 14. Determinism Rules

The system must always produce:

* Same input → same output
* Stable ordering
* Reproducible structures

### Enforced by

* explicit ordering
* dependency graphs
* topological sorting

---

# 🔷 15. Dependency Rules

* Dependencies must be explicit
* Stored in canonical model
* Used for:

  * validation
  * ordering
  * graph construction

---

# 🔷 16. Graph & Visualization Rules

### Rules

* Graphs are derived from canonical data only
* Visualizations are projections only
* No reverse parsing of visual outputs
* No logic inside rendering layer

---

# 🔷 17. Validation Rules

Before any derived output:

* validate structure
* validate dependencies
* detect cycles
* ensure consistency

If validation fails:

* abort process
* return deterministic error

---

# 🔷 18. Strict Typing Rules

* No implicit conversions
* Strong typing enforced
* No dynamic typing

---

# 🔷 19. Minimal Context Rule

When modifying code:

* Only touch required modules
* Avoid global refactors
* Keep changes localized

---

# 🔷 20. Generic Enforcement Rules

The system must reject:

* bypassing canonical model
* generating outputs before validation
* duplicate data sources
* invalid dependency structures

---

# 🔷 21. Summary

This template enforces:

* clean layered architecture
* strict separation of concerns
* deterministic system behavior
* canonical data modeling
* projection-based outputs

---

# 🔷 One-Line Principle

> Build systems where structured data is the source of truth, and everything else—graphs, diagrams, APIs—is a deterministic projection of that truth.
