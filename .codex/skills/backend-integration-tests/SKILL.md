---
name: backend-integration-tests
description: Add or update backend integration and authorization tests for SeeSpec ABP features. Use when backend behavior changes for CRUD, permissions, tenant or project scoping, section ownership, generation workflows, or API-visible contract behavior.
---

# Backend Integration Tests

Use this skill whenever backend behavior changes and the change should be validated beyond static compilation.

## Read first

Review:

- `docs/api-contracts.md`
- `docs/permissions.md`
- `docs/domain-model.md`
- `.codex/codex.md`
- `.codex/standards/backend-structure.md`

## What to test

Prefer integration coverage for:

- CRUD behavior
- authorization boundaries
- tenant scoping
- project scoping
- section ownership rules
- generation and validation workflows
- automatic completion-note side effects

## Test design process

For each changed behavior:

1. identify the public or application-service contract
2. identify happy path inputs
3. identify forbidden inputs
4. identify cross-scope leakage risks
5. identify invalid-input paths
6. add the minimum set of tests that proves the behavior

## Minimum coverage expectations

For protected mutations, cover:

- allowed actor succeeds
- unauthorized actor fails
- cross-tenant actor fails
- cross-project actor fails when relevant

For section editing, cover:

- `ProjectLead` can edit all allowed section types
- `BusinessAnalyst` can edit `Requirement` and is denied for `Architecture`/`Domain`
- `SystemsArchitect` can edit `Architecture`/`Domain` and is denied for `Requirement`

For generation workflows, cover:

- snapshot record creation
- actor attribution
- automatic completion note creation
- validation result association when applicable

## Test style rules

- keep fixtures small and readable
- make scope explicit in setup
- prefer direct names over abstract helper overloads
- assert the important behavior, not incidental implementation details

## When tests cannot be completed

If environment or framework setup blocks execution:

- still add the best reasonable tests if code structure permits
- say exactly what could not be executed
- do not falsely claim runtime validation

## Documentation updates

If tests reveal a contract or permission mismatch, update:

- `docs/api-contracts.md`
- `docs/permissions.md`
- `docs/domain-model.md`

## Final response

Report:

- which behaviors are covered
- which permission and scope edges were tested
- whether tests were executed or only added
- any residual gaps that still need runtime verification
