---
name: frontend-page-from-contract
description: Build or update a SeeSpec frontend page from the product docs, API contracts, permissions, and Figma references. Use when creating or refactoring Next.js App Router pages, route segments, page components, loading/empty/error/success states, role-aware actions, and page-level Playwright coverage.
---

# Frontend Page From Contract

Use this skill when implementing a concrete user-facing page from documented behavior instead of inventing structure ad hoc.

## Read first

Review:

- `docs/spec.md`
- `docs/ui-spec.md`
- `docs/api-contracts.md`
- `docs/permissions.md`
- `docs/designs/figma-links.md`
- `.codex/skills/frontend-standards/SKILL.md`
- `.codex/skills/provider-standards/SKILL.md` when shared state is needed

## Page implementation flow

1. identify the route and page purpose
2. identify required API data
3. identify role-aware actions and visibility rules
4. identify Figma frame or documented layout intent
5. break the page into route entry plus page-owned components
6. implement page states
7. add or update Playwright coverage

## Route rules

- keep route files thin
- prefer server components by default
- use client components only where interaction requires them
- keep authenticated product pages inside `/app`
- prefer readable slugs in route segments

## Page structure

For each page, define:

- header area
- primary content area
- secondary or contextual area if needed
- action row
- state views

Prefer page-owned components under `nextjs/app/components/`.

## Required states

Every page must define:

- pending
- empty
- error
- success where relevant
- disabled or read-only behavior when permissions limit editing

Do not leave these implicit.

## Permission alignment

Use `docs/permissions.md` to determine:

- whether the page appears in navigation
- whether create/edit/delete actions are shown
- whether the page is editable or read-only
- whether unauthorized users should be redirected, hidden, or informed

## Data flow rules

- derive data needs from `docs/api-contracts.md`
- keep request logic out of page JSX
- use providers only when state is genuinely shared
- use typed service functions for API calls

## Design rules

- follow `docs/ui-spec.md` and the Ember Grid design direction
- use Figma for layout and spacing when a frame exists
- preserve Angular parity only where that is still a stated requirement
- keep typography, contrast, spacing, and motion intentional

## Testing expectations

Add or update Playwright tests for:

- page load
- key happy path action
- empty or error state
- permission-sensitive affordance if the page has one

## Final response

Report:

- the route or page implemented
- the states covered
- the permission behavior reflected
- the Playwright coverage added or updated
