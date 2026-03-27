---
name: efcore-postgres-migrations
description: Handle EF Core model changes and PostgreSQL-safe migrations for SeeSpec. Use when adding or changing entities, relationships, indexes, nullability, delete behavior, DbContext registration, migration files, or provider-specific schema decisions in the ABP/Npgsql stack.
---

# EF Core PostgreSQL Migrations

Use this skill when the data model changes and the EntityFrameworkCore layer must stay correct for PostgreSQL.

## Read first

Review:

- `docs/domain-model.md`
- `docs/architecture.md`
- `.codex/codex.md`
- `.codex/skills/posgres/SKILL.md`
- `.codex/standards/backend-structure.md`

## Core rules

- target PostgreSQL through Npgsql only
- do not introduce SQL Server provider code
- keep runtime config, migrator, and EF model provider-consistent
- make schema intent explicit before generating migrations

## Change workflow

1. inspect the entity and relationship change
2. update the DbContext and model configuration
3. review nullability, defaults, and delete behavior
4. determine whether a migration should be additive, corrective, or breaking
5. generate or update migration files if the environment permits
6. verify the migration matches PostgreSQL assumptions

## Mapping rules

Be explicit about:

- required vs optional relationships
- cascade delete vs restrict
- unique constraints
- composite keys where needed
- indexes for slug, foreign key, and lookup-heavy fields
- JSON/text columns only when the shape is intentionally unstructured

## Naming rules

- use clear migration names tied to the model change
- keep table and column naming consistent with existing SeeSpec conventions
- avoid provider-specific hacks unless PostgreSQL requires them

## Safety checks

Before finalizing a migration, verify:

- no SQL Server package or `UseSqlServer()` path was introduced
- generated schema supports the declared nullability
- foreign key delete behavior matches business rules
- migration order and snapshots remain coherent

## When not to generate a migration

Do not generate a migration yet when:

- the entity shape is still unstable
- required defaults are not decided
- delete behavior is unclear
- permission or scope requirements could still change the model

In that case, update the model code and document the unresolved migration decision.

## Test expectations

When feasible, validate:

- DbContext compiles
- migration compiles
- startup/migrator config remains PostgreSQL-compatible

If runtime migration execution cannot be performed, state that clearly.

## Documentation updates

Update docs if the model change affects:

- domain structure -> `docs/domain-model.md`
- architecture or persistence assumptions -> `docs/architecture.md`
- API shape -> `docs/api-contracts.md`

## Final response

Report:

- what schema changed
- whether a migration was added or deferred
- PostgreSQL-specific considerations
- any unresolved nullability/default/delete-behavior decisions
