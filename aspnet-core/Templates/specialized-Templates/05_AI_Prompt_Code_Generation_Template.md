# AI Prompt & Code Generation Template

## Inheritance

This template inherits all rules from the Generic Backend Architecture & Standards Template.

---

## Purpose

This template defines how canonical backend data may be transformed into AI prompts and generated code while preserving the coding standards defined by this template set.

---

## Detailed Goals

Generated code should:

- fit the required ABP solution layout
- respect app-service ownership
- use repository-based persistence patterns
- follow PostgreSQL and EF Core conventions
- avoid architectural invention
- remain mergeable into a codebase shaped according to this template set

---

## Core Rule

AI may transform validated structured input. AI may not invent missing backend architecture.

Rules:

- prompt input must come from canonical validated state
- prompt structure must be deterministic
- generated code must satisfy explicit restrictions
- outputs do not become authoritative until validated

---

## Required Backend Coding Standards in Prompt Context

When generating backend code, include standards required by this template set:

- ABP app services for public workflows
- DTOs in application layer
- repositories injected into services
- EF Core + PostgreSQL persistence
- `Web.Host` startup configuration
- `appsettings.json` configuration sections
- canonical `Spec -> SpecSection -> SectionItem -> SectionDependency` model when structured content exists
- explicit validation gates
- explicit null handling

Restrictions that must be stated in prompts:

- no MediatR rewrite
- no second upload system
- no second graph system
- no controller-heavy orchestration
- no alternate truth store
- no speculative infrastructure

---

## Prompt Segment Requirements

Prompt normalization should include:

- solution structure
- target project names
- service ownership rules
- DTO rules
- persistence rules
- configuration examples
- prohibited approaches
- exact milestone scope

Rules:

- do not leave architecture to model choice
- do not omit restrictions when the project already has standards

---

## Configuration Examples to Include

Prompt context should include examples like:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=ProjectDb;Username=postgres;Password=postgres"
  },
  "App": {
    "ServerRootAddress": "https://localhost:44311/",
    "ClientRootAddress": "http://localhost:3000/",
    "CorsOrigins": "http://localhost:3000"
  }
}
```

And host startup examples like:

```csharp
services.AddAbpWithoutCreatingServiceProvider<ProjectWebHostModule>();
services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = maxUploadSizeBytes;
});
```

Rules:

- configuration examples must be deployment-safe
- no machine-local path assumptions

---

## Output Restrictions

Generated backend code must not:

- change architecture outside scope
- introduce unauthorized packages
- add a second persistence model
- bypass canonical service flow
- place business logic into controllers
- create alternate API contracts casually

---

## Post-Generation Validation

Before accepting generated code:

- solution placement is correct
- naming matches existing conventions
- service ownership is correct
- DTOs are explicit
- persistence path is valid
- configuration path is standard
- no forbidden architecture drift was introduced

---

## Review Checklist

Confirm:

- prompt input is canonical and validated
- coding standards are explicit
- configuration examples are included
- restrictions are explicit
- generated backend code matches ABP/repository/EF Core conventions

---

## One-Line Principle

Use AI only as a constrained code transformer that is explicitly told to match the backend architecture, configuration style, and service-layer standards defined by this template set.
