# Validation & Enforcement Template

## Inheritance

This template inherits all rules from the Generic Backend Architecture & Standards Template.

---

## Purpose

This template defines how backend validation and enforcement must work so invalid states never become authoritative.

---

## Detailed Goals

A compliant enforcement system should:

- block invalid phase transitions
- centralize structural validation in authoritative backend services
- keep request-shape validation separate from structural validation
- reject invalid derived outputs
- preserve deterministic errors
- prevent architectural drift from entering persistence

---

## Core Rule

Invalid structure must never produce authoritative output.

Rules:

- no graph projection from invalid spec
- no diagram rendering before required gates
- no import acceptance before backend validation
- no AI output acceptance before post-generation checks

---

## Enforcement Ownership

Validation ownership by layer:

- controllers and host: request shape only
- app services: structural and workflow gates
- domain layer: business invariants
- repositories: persistence only
- renderers: format/render only

Restrictions:

- no controller-only enforcement
- no UI-only enforcement
- no repository-owned workflow law

---

## Required Gates

Typical hard gates in a backend using this template set:

- backend exists
- backend validated
- spec exists
- overview accepted
- canonical structure valid
- dependencies valid
- ordering valid
- spec bootstrapped
- graph generation allowed
- diagram rendering allowed

Rules:

- each downstream gate depends on explicit upstream success
- gate outcomes must be deterministic

---

## Error Classification

Prefer stable categories such as:

- input validation error
- authorization error
- structural validation error
- dependency validation error
- ordering validation error
- rendering precondition error
- persistence error
- unexpected internal error

Rules:

- user-facing messages may be shorter than internal details
- structural failures must be distinguishable from transport failures

---

## Rollback Rule

If authoritative writes begin and structural validation later fails:

- rollback when transaction boundaries allow it
- do not leave half-valid canonical state
- do not leave authoritative derived output behind

---

## Canonical Compatibility Rule

Validation must operate on canonical state or normalized input about to enter canonical state.

Restrictions:

- do not validate SVG as if it were truth
- do not validate renderer layout as if it were business structure
- do not validate projections while ignoring canonical inconsistencies

---

## Deployment-Safe Enforcement

Validation must remain valid when server is deployed.

Rules:

- no developer-path assumptions
- no browser-local folder assumptions for deployed import
- no environment-specific success path hidden in service code
- config-driven limits and paths must be used where relevant

---

## Review Checklist

Confirm:

- enforcement lives in the correct layer
- blocked transitions are explicit
- invalid structure cannot create derived output
- deterministic errors exist
- no partial authoritative state survives invalid transitions

---

## One-Line Principle

Validation is the backend gatekeeper: if state, structure, dependencies, or transitions are invalid, the workflow stops before anything authoritative or projected is allowed to proceed.
