---
name: frontend-standards
description: Use this skill for any frontend task in the repository involving Next.js App Router, TypeScript, responsive UI, UX feedback, design-token-driven styling, and Playwright test creation or maintenance. Apply it when creating, editing, refactoring, reviewing, or debugging frontend pages, layouts, components, forms, tables, flows, and user-facing interactions.
---

# Frontend Standards Skill

## When to use this skill

Use this skill for every frontend task, including:
- creating new pages, routes, layouts, and components
- editing or refactoring existing UI
- implementing forms, tables, dashboards, modals, drawers, steps, timelines, queues, and detail views
- wiring UI to API data, loaders, empty states, and error states
- improving accessibility, responsiveness, and user feedback
- adding, fixing, or updating Playwright tests for any changed frontend behavior

If the task affects visible UI or frontend behavior, this skill applies.

## Required repository references

Before making behavior-affecting changes, review:
- `docs/spec.md`
- `docs/architecture.md`
- `docs/designs/figma-links.md`
- `.codex/standards/frontend-structure.md`
- `.codex/skills/provider-standards/SKILL.md` when shared state/providers are involved

When role-aware behavior is involved, also review:
- `docs/permissions.md` if present

When a page comes from Figma:
- open the matching frame from `docs/designs/figma-links.md`
- export the frame SVG when the design relies on frame geometry, vector framing, or illustration
- treat the exported SVG as the geometry source of truth

When implementation changes documented behavior or structure:
- update the affected docs so the frontend guide and product docs do not drift

## Primary objectives

Always produce frontend work that is:
- strongly typed
- modular and easy to extend
- responsive across mobile, tablet, laptop, and desktop
- accessible and keyboard-friendly
- consistent with the SeeSpec visual language defined by Figma
- clear in user feedback and state transitions
- covered by Playwright tests when functionality is added or changed

## Stack and framework rules

### Framework
- Use Next.js App Router.
- Prefer server components by default.
- Use client components only when required for hooks, browser APIs, interactivity, form state, or imperative navigation.
- Add `"use client"` only where it is actually required.

### Language and typing
- Use TypeScript everywhere.
- Avoid `any`.
- Type all props, domain models, utility function inputs, return values, and async responses.
- Use clear interfaces or type aliases.
- Prefer domain-specific names over vague names.

### UI library
- Use Ant Design for standard UI primitives when the repository has adopted it for the affected surface.
- Prefer built-in Ant Design patterns for forms, tables, alerts, empty states, drawers, modals, steps, tabs, pagination, badges, result screens, and notifications.
- Do not reinvent common controls without a strong reason.
- If a legacy page predates Ant Design adoption, preserve behavior while moving new work toward the standard component system.

### Styling
- Use `antd-style` for component and page styling once Ant Design theme infrastructure is present in the affected surface.
- Define styles in a colocated `style.ts` or `styles.ts` file when using component-scoped styling.
- Keep a central theme file for colors, fonts, spacing, and tokens so visual changes are made in one place.
- Import shared tokens into component styles instead of hardcoding values.
- Avoid inline styles except for trivial one-off cases that do not justify a style definition.
- Keep visual language clean, deliberate, and aligned with Figma.
- Follow the Ember Grid UI specification in `docs/ui-spec.md` for dark-surface hierarchy, thermal accents, and restrained motion.

## Project structure rules

### App Router structure
- Keep route files under `nextjs/app/`.
- Use nested layouts and route groups where appropriate.
- Use a single authenticated app route space for product surfaces instead of fragmenting the workspace into unrelated top-level route trees.
- Support multi-tenancy and user-specific content through dynamic segments, but do not expose raw internal IDs in user-facing route lists or navigation labels.
- Prefer semantic route segments such as tenant slugs, project slugs, usernames, or other stable human-readable identifiers over opaque IDs when a route parameter is needed.
- Keep route entry files slim.
- Keep route entry files slim.
- Place page and feature components under `nextjs/app/components/`, segmented by page or domain.
- Place API, provider, and utility support code under `nextjs/app/lib/`.
- Keep test clients under `nextjs/app/test-clients/`.
- Keep routing concerns in route folders and UI building blocks in `app/components/`.

### Component decomposition

Break work into focused pieces such as:
- page entry
- page-scoped component folder under `app/components/`
- data section
- form section
- summary section
- table or list component
- modal or drawer component
- shared view-state component
- colocated styles
- colocated types when needed

Each major page should own its own component folder under `app/components/`, for example `app/components/dashboard/` or `app/components/loggedIn/clients/`. Reusable parts should move to a shared `app/components/global/` area only when reuse is real.

For new pages, create the components first and then assemble the route page from those components. Do not build the full page inline and split it later.

### File naming
- Use clear, intention-revealing names.
- Match file names to the main component or exported function.
- Avoid vague names like `helpers2`, `temp`, or `newComponent`.

## Responsive design requirements

Responsive design is mandatory.

For every new or edited frontend feature:
- ensure the UI works on mobile, tablet, and desktop widths
- avoid fixed widths unless they are bounded and safe
- use flexible layouts, wrapping, responsive grid, and breakpoint-aware behavior
- ensure tables and dense content degrade gracefully on smaller screens
- ensure forms remain usable on mobile
- ensure action buttons remain discoverable and reachable
- ensure modals, drawers, and panels fit small screens appropriately
- ensure typography, spacing, and hierarchy remain readable

Before considering a task done, check:
- narrow mobile layout
- tablet layout
- standard desktop layout

## UX feedback requirements

User feedback is mandatory.

Whenever the UI performs an action, provide appropriate feedback such as:
- loading indicators during async work
- disabled buttons while submitting
- skeletons or placeholders where helpful
- success confirmation after create, update, or delete actions
- clear empty states when no data exists
- clear error messages when something fails
- validation messages for bad input
- confirmation for destructive actions
- retry affordances when appropriate

Do not leave users guessing whether something worked.

## Accessibility requirements

Every frontend change should consider:
- semantic structure
- keyboard navigation
- focus visibility and focus order
- descriptive button and link text
- form labels and validation messaging
- aria attributes where needed
- contrast and readability
- screen-reader-friendly state messaging for important actions where practical

## Data and state rules

- Fetch data on the server when practical.
- Use suspense boundaries when they improve user experience.
- Keep client state local unless shared state is genuinely required.
- Avoid unnecessary global state.
- Handle pending, empty, success, and error states explicitly.
- Never assume data exists; guard null and undefined states properly.
- Use centralized Axios instances for HTTP requests rather than ad hoc fetch logic spread across components.
- Do not use raw `fetch` for normal app API integration unless the task explicitly requires it.
- Use proxy routes or proxy-aware API configuration where needed to isolate backend base URLs, auth forwarding, and environment differences from page components.
- Keep API client logic out of page JSX.
- Place Axios instance definitions in `app/lib/api/`.
- Place provider contexts in `app/lib/providers/` using the provider standards pattern.
- Place service functions and shared frontend helpers in `app/lib/utils/`.
- Call service functions from provider `index.tsx` files.

## Frontend behavior rules

When implementing or changing frontend behavior:
- preserve existing flows unless the task explicitly changes them
- do not silently remove validation, confirmations, or guardrails
- keep navigation predictable
- keep domain terminology consistent with SeeSpec docs and entities
- if a task affects forms or workflows, ensure related summaries, badges, labels, and statuses stay accurate
- keep Angular parity where the current Next.js page is intentionally mirroring an Angular reference page
- keep authenticated screens inside the shared app route space
- represent multi-tenant and user-specific context through dynamic routing only when the route needs it
- keep navigation-facing route documentation focused on page purpose, not parameter implementation details
- keep page-specific components under `app/components/` in folders matching the page or domain
- move only genuinely shared pieces to `app/components/global/`
- when shared entity state is needed, create providers in `app/lib/providers/<entityProvider>/`
- keep API orchestration in provider index files and raw HTTP logic in `app/lib/utils/`

## Coding standards

Follow the repository’s TypeScript and frontend coding standards closely, including these important rules:
- 4-space indentation
- avoid `any`
- document types and interfaces clearly where appropriate
- declare return types
- use double quotes for strings
- use `===` and `!==`
- avoid unused code, unreachable code, and empty blocks
- use braces for control blocks
- avoid abbreviations in variable and method names
- keep names descriptive and consistent
- prefer documented, well-structured code over clever code

## Testing requirements

Playwright work is mandatory when frontend behavior changes.

### When to add or update Playwright tests

Do this whenever you:
- add a new page or route
- add a new user flow
- change form behavior
- change navigation behavior
- change visible state transitions
- fix a frontend bug
- alter filtering, sorting, searching, pagination, tabs, modals, drawers, or timeline behavior

### Expectations for Playwright coverage

Where practical, tests should cover:
- happy path
- validation or guardrail behavior
- key error or empty state behavior
- responsive-critical behavior if layout changes meaningfully affect interaction

### Playwright quality rules

- prefer robust locators based on roles, labels, placeholder text, and stable test ids
- avoid brittle selectors
- keep tests readable and task-focused
- update existing tests if behavior changed
- do not leave stale failing tests behind

If a feature cannot reasonably be covered end-to-end yet, add the best achievable Playwright coverage and note the remaining gap.

## Definition of done

A frontend task is not complete unless all of the following are true:
- implementation follows App Router conventions
- server versus client boundaries are sensible
- code is typed clearly
- UI is responsive
- user feedback is present
- accessibility basics are addressed
- loading, empty, success, and error states are handled
- styles are colocated and consistent
- related Playwright tests are added or updated
- existing behavior was not broken unnecessarily
- page-specific components live in `app/components/` rather than directly inside route folders
- page-specific components are not dumped into the global component layer without reuse justification
- request logic uses shared Axios configuration rather than duplicated page-local networking
- provider-based shared state follows the `actions.tsx`, `context.tsx`, `reducer.tsx`, `index.tsx` structure in `app/lib/providers/`

## How to work

Do not stop just to produce a plan unless the user explicitly asks for one.
Proceed with implementation directly.

When responding after making frontend changes:
- briefly state what was changed
- mention user-facing feedback states added or preserved
- mention responsive considerations handled
- mention Playwright tests added or updated
- mention any limitation or follow-up only if it materially matters

## SeeSpec-specific guidance

- Follow `docs/spec.md` for role-aware workspace behavior and section ownership rules.
- Follow `docs/designs/figma-links.md` for layout, spacing, and screen intent.
- Treat Figma as the source of truth for layout and spacing.
- Treat exported SVG assets as the source of truth for vector geometry.
- If Figma and the current frontend implementation conflict, prefer the documented product direction unless the task is explicitly to preserve Angular parity.
- Keep authentication pages aligned with the Angular reference where parity is required.
- Treat the Figma page set as the canonical list of major frontend surfaces.
- For workspace pages derived from Figma, document human-facing page routes without leaking raw IDs into the route inventory.
