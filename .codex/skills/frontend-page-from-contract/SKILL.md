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
- `docs/designs/output.pdf` when present or when the user points to the rendered output as the visual reference
- `.codex/skills/frontend-standards/SKILL.md`
- `.codex/skills/provider-standards/SKILL.md` when shared state is needed

## Page implementation flow

1. identify the route and page purpose
2. identify required API data
3. identify role-aware actions and visibility rules
4. identify Figma frame or documented layout intent
5. open the matching Figma frame from `docs/designs/figma-links.md`
6. load the matching SVG export from `docs/designs/svgs` when it exists
7. verify the rendered appearance against `docs/designs/output.pdf` when that file exists or when the user says the output PDF is the final visual reference
8. treat the rendered SVG/PDF output as the source of truth for component breakdown, relative spacing, major geometry, copy, and placement of visible controls
9. identify reusable page-owned components directly from the design output before writing the route entry
10. assemble the route entry from those components
11. implement page states
12. add or update Playwright coverage

## Route rules

- keep route files thin
- prefer server components by default
- use client components only where interaction requires them
- keep authenticated product pages inside `/app`
- prefer readable slugs in route segments

## Page structure

For each page, define components first:

- shell component
- header component
- content section components
- contextual or side-panel components where needed
- state components where needed

Then compose the route entry from those components.

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
- send requests through shared Axios instances in `app/lib/api/`

## Design rules

- follow `docs/ui-spec.md` and the Ember Grid design direction
- use Figma for layout and spacing when a frame exists
- when an SVG export exists in `docs/designs/svgs`, follow that exported frame exactly unless the user explicitly approves a deviation
- when `docs/designs/output.pdf` exists, use it as the final visual check for how the page must actually look after rendering
- do not replace a form field, button, label, or visible panel from the SVG with a looser interpretation
- if the rendered output shows different copy, spacing, or control ordering than your earlier interpretation, the rendered output wins
- if the SVG shows a tenant input, search box, side panel, or control row, implement that exact surface first and make it functional where the contract allows
- export the matching frame SVG when the frame defines vector geometry the page should preserve
- rebuild the page from extracted components first, then compose the page from those components
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
