# Domain Modeling Template

## Inheritance

This template inherits all rules from the Generic Backend Architecture & Standards Template. It may only become stricter.

---

## Purpose

This template defines how to model the domain so it matches the standards defined by this template set.

It governs:

- aggregate roots
- entities
- value objects
- domain events
- invariants
- module boundaries
- domain naming
- lifecycle transitions

It does not govern:

- host startup
- transport concerns
- rendering
- frontend behavior

---

## Detailed Goals

A compliant domain model should:

- express business meaning first
- be small enough to understand quickly
- expose invariants explicitly
- avoid technical noise in Core
- remain stable under application and infrastructure changes
- support canonical spec assembly without ambiguity

---

## Required Domain Standards

### Business-first naming

Rules:

- names must use business language
- Core types must not be named after API screens
- persistence-specific terms must not shape domain names
- temporary implementation names are forbidden

### Explicit type role

Every domain type must be clearly one of:

- aggregate root
- entity
- value object
- domain event
- domain service

If its role is unclear, the model is incomplete.

### Invariants before properties

Each aggregate root must answer:

- what must always be true
- what transitions are allowed
- what transitions are forbidden
- what related data must stay consistent

Rules:

- do not model aggregates as field bags
- do not push invariant enforcement into app services
- do not rely on UI validation for domain correctness

---

## Aggregate Root Rules

Use aggregate roots only for real consistency boundaries.

Required characteristics:

- stable identity
- protected mutation boundary
- explicit business operations
- invariant enforcement inside the root

Restrictions:

- external code must not mutate child state freely
- aggregate roots must not become giant all-purpose containers
- unrelated responsibilities must not be forced into one aggregate for convenience

---

## Entity Rules

Entities are for business concepts with identity across time.

Rules:

- identity-based equality
- mutation only when business rules allow it
- explicit lifecycle semantics when state changes matter

Do not use entities for:

- primitive wrappers with no lifecycle
- transient formatting helpers
- transport-only records

---

## Value Object Rules

Value objects model concepts defined entirely by value.

Rules:

- immutable by default
- equality by value
- business meaning required

Good examples:

- Money
- Address
- EmailAddress
- DateRange
- StatusCode with domain constraints

Restrictions:

- do not create value objects that are only renamed primitives unless they add validation or business semantics

---

## Domain Event Rules

Domain events represent meaningful past-tense facts.

Rules:

- events are not orchestration scripts
- events are not generic notifications
- names should be past tense
- payload should be sufficient for downstream reaction without leaking infrastructure detail

Examples:

- `RequirementCreated`
- `OverviewAccepted`
- `BackendValidated`

Restrictions:

- no UI-only event names
- no "did something" placeholder events

---

## Domain Service Rules

Use domain services only when business logic does not belong naturally on a single aggregate or value object.

Rules:

- stateless by default
- domain-focused
- small and cohesive

Restrictions:

- no orchestration-heavy app-service logic in domain services
- no repository-driven procedural scripts disguised as domain services

---

## Module Boundary Rules

Modules must group cohesive business capabilities.

Good module qualities:

- high cohesion
- low coupling
- clear concept ownership
- explicit cross-module dependencies

Restrictions:

- no technical junk-drawer module
- no module organized only by controller name
- no hidden cross-module domain reach-through

---

## Canonical Compatibility Rules

The domain model must map cleanly into canonical spec content.

Required outcomes:

- domain types can be represented as `SectionItem` content
- classifications remain explicit
- identity remains stable across persistence and reconstruction
- dependencies can be expressed without lossy conversion

Restrictions:

- no domain type that can only be understood through runtime reflection
- no domain identity that changes between scans/imports without controlled migration

---

## Example Alignment

Example classification targets for a backend using this structure:

- `AggregateRoot`
- `Repository`
- `DomainEvent`
- `ApplicationService`
- `Dto`

These classifications must stay explicit enough to support later canonical spec assembly.

---

## Review Checklist

Confirm:

- aggregate roots are explicit
- entities and value objects are not confused
- invariants are defined
- lifecycle transitions are explicit where needed
- Core has no transport or rendering concerns
- domain structure can be projected into canonical spec content

---

## One-Line Principle

Model the domain so meaning, identity, and invariants are explicit in Core before any application, storage, or projection layer touches them.
