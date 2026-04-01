# Dependency & Ordering Template

## Inheritance

This template inherits all rules from the Generic Backend Architecture & Standards Template.

---

## Purpose

This template defines how dependencies are inferred, persisted, validated, and ordered so that graph and diagram projection stay deterministic.

---

## Detailed Goals

A compliant dependency system should:

- persist dependencies explicitly
- reject invalid references
- reject self-dependencies
- detect cycles deterministically when cycles are forbidden
- produce stable topological order
- drive downstream graph and diagram projection safely

---

## Canonical Dependency Rule

Dependencies must be persisted in canonical backend storage, not left as transient runtime facts.

Preferred canonical storage in this template style:

- `SectionDependency`

Rules:

- no visual-only edges as authority
- no in-memory-only dependency graph as the sole truth
- no alternate dependency subsystem beside canonical persistence

---

## Direction Rule

Use one direction consistently:

- dependent -> dependency

Meaning:

- if section A requires section B, A depends on B
- `FromSectionId` points to the dependent section
- `ToSectionId` points to the prerequisite section

Rules:

- no mixed conventions
- reverse views are allowed only as derived runtime views

---

## Inference Rules

Allowed dependency sources may include:

- constructor injection
- explicit canonical links
- requirement/use-case ownership
- deterministic service rules

Rules:

- inference must be deterministic
- framework noise must be filtered
- inferred edges must be resolved to canonical IDs before becoming authoritative

Restrictions:

- do not persist raw Roslyn handles as canonical IDs
- do not persist temporary graph node aliases as dependency authority

---

## Validation Phases

Required validation order:

1. reference validity
2. legality of dependency direction and category
3. self-dependency rejection
4. cycle detection
5. deterministic ordering derivation

Rules:

- downstream projection is blocked if any phase fails
- errors must be explicit and attributable

---

## Topological Ordering Rules

Use topological sort when dependency-safe ordering is required.

Required behavior:

- ordering operates on canonical dependencies
- tie-breaking is explicit
- same input yields same order

Preferred tie-break fields:

- explicit `Order`
- stable title
- stable identifier

Restrictions:

- never rely on hash iteration order
- never rely on accidental database retrieval order

---

## Section Ordering Metadata

If ordering metadata is persisted, it must reflect canonical dependency truth.

Rules:

- ordering metadata is derived, not authoritative by itself
- persisted ordering must not contradict dependency edges
- if dependency changes invalidate ordering, ordering must be recomputed

---

## Dependency Graph Rules

A runtime graph may be built only from canonical persisted dependency data.

Inputs must be:

- canonical sections
- canonical items
- canonical dependencies

It must not be built directly from:

- raw scanner output
- renderer state
- UI drag positions

---

## Failure Semantics

If dependency rules are violated:

- spec bootstrap fails
- graph projection fails
- diagram projection fails
- no authoritative downstream output is produced

---

## Review Checklist

Confirm:

- dependencies are explicit
- dependencies use canonical IDs
- self-dependencies are rejected
- missing references are rejected
- cycles are detected deterministically
- topological ordering is stable

---

## One-Line Principle

Persist dependencies explicitly, validate them strictly, and derive stable ordering from them before any graph or diagram projection is allowed.
