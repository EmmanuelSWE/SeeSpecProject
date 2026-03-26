# SeeSpec Frontend - Architecture & Folder Structure Guide

## Overview

The SeeSpec frontend is a **Next.js App Router** application built with **TypeScript**. It currently mirrors key Angular screens for parity while moving toward a role-aware product workspace defined by the SeeSpec specification and Figma designs.

The frontend is responsible for:

- authentication and account entry screens
- landing and navigation experience
- admin-facing views for users, roles, tenants, and account settings
- future project, specification, task, and collaboration workspace screens
- presenting backend data clearly while deferring business-rule enforcement to the backend

The current implementation uses custom React components and global CSS. The project standard going forward is:

- Next.js App Router
- TypeScript
- Playwright for end-to-end coverage
- Figma-driven layout and spacing
- Ant Design plus `antd-style` as the target component and styling system for new or refactored product surfaces

The guide below reflects both:

- the structure that exists in `nextjs/` today
- the structure and standards new frontend work should follow

---

## Source of Truth

Frontend work must align with these repository documents:

- `docs/spec.md`
  - product scope, roles, behaviors, and acceptance criteria
- `docs/architecture.md`
  - system boundaries and frontend ownership
- `docs/designs/figma-links.md`
  - layout and spacing source of truth
- `.codex/skills/frontend-standards/SKILL.md`
  - execution workflow and implementation standards for frontend tasks

Design precedence:

- Figma is the source of truth for layout, spacing, and screen composition
- SVG exports are the source of truth for vector geometry
- If Angular parity is explicitly required for a screen, Angular remains the visual comparison baseline until that surface is intentionally redesigned

---

## Frontend Structure

```text
nextjs/
├── app/                                        # App Router routes, layouts, and route-level entry files
│   ├── layout.tsx                              # Root application layout
│   ├── page.tsx                                # Landing page at "/"
│   ├── globals.css                             # Global styles and current shared visual primitives
│   ├── account/                                # Public auth route group
│   │   ├── layout.tsx                          # Auth-specific layout wrapper
│   │   ├── login/
│   │   │   └── page.tsx                        # Login screen
│   │   └── register/
│   │       └── page.tsx                        # Registration screen
│   └── app/                                    # Single authenticated product route group
│       ├── layout.tsx                          # Shared workspace/dashboard shell
│       ├── page.tsx                            # Workspace entry dashboard
│       ├── settings/
│       │   └── page.tsx                        # User settings / password / account profile surface
│       ├── users/
│       │   ├── page.tsx                        # User list
│       │   └── [userSlug]/
│       │       └── page.tsx                    # User-specific view without exposing raw IDs
│       ├── tenants/
│       │   ├── page.tsx                        # Tenant list
│       │   └── [tenantSlug]/
│       │       └── page.tsx                    # Tenant-specific workspace
│       ├── projects/
│       │   ├── page.tsx                        # Project list
│       │   └── [projectSlug]/
│       │       ├── page.tsx                    # Project overview / dashboard
│       │       ├── requirements/
│       │       │   └── page.tsx                # Requirements page from Figma
│       │       ├── task-assignment/
│       │       │   └── page.tsx                # Task assignment page from Figma
│       │       ├── use-case-diagram/
│       │       │   └── page.tsx                # Spec workspace page from Figma
│       │       ├── domain-model/
│       │       │   └── page.tsx                # Spec workspace page from Figma
│       │       ├── activity-diagram/
│       │       │   └── page.tsx                # Spec workspace page from Figma
│       │       └── teams/
│       │           └── page.tsx                # Backend team view if a project owns multiple teams
│       └── administration/
│           ├── roles/
│           │   └── page.tsx                    # Roles management
│           └── about/
│               └── page.tsx                    # About / product information
├── components/                                 # Shared presentational and layout components
│   ├── account-shell.tsx                       # Auth screen shell
│   ├── dashboard-shell.tsx                     # Sidebar/topbar admin shell
│   ├── data-table-card.tsx                     # Reusable table-like card view
│   └── icons.tsx                               # Shared icon primitives
├── lib/
│   └── data.ts                                 # Static/demo data and simple shared data helpers
├── public/
│   └── img/
│       ├── logo.png                            # Shared logo asset
│       └── user.png                            # Shared user avatar asset
├── tests/
│   └── example.spec.ts                         # Current Playwright coverage baseline
├── playwright.config.ts                        # Playwright configuration
├── package.json                                # Frontend scripts and dependencies
├── tsconfig.json                               # TypeScript configuration
├── next.config.mjs                             # Next.js configuration
└── README.md                                   # Frontend-specific setup notes
```

---

## Route Groups and Responsibilities

### 1. `nextjs/app` — Route Layer

**Purpose:** Defines the user-visible route tree using the Next.js App Router.

Current and target route responsibilities:

- `/`
  - landing page introducing SeeSpec and linking into authentication or workspace entry
- `/account/login`
  - Angular-parity login experience
- `/account/register`
  - Angular-parity registration experience
- `/app`
  - authenticated workspace entry dashboard
- `/app/settings`
  - current-user account settings surface
- `/app/users`
  - user list
- `/app/users/[userSlug]`
  - user-specific profile or management surface
- `/app/tenants`
  - tenant list for authorized roles
- `/app/tenants/[tenantSlug]`
  - tenant-specific workspace entry
- `/app/projects`
  - project list
- `/app/projects/[projectSlug]`
  - project dashboard
- `/app/projects/[projectSlug]/requirements`
  - requirements workspace from Figma
- `/app/projects/[projectSlug]/task-assignment`
  - task assignment workspace from Figma
- `/app/projects/[projectSlug]/use-case-diagram`
  - use case diagram workspace from Figma
- `/app/projects/[projectSlug]/domain-model`
  - domain model workspace from Figma
- `/app/projects/[projectSlug]/activity-diagram`
  - activity diagram workspace from Figma
- `/app/projects/[projectSlug]/teams`
  - project team view where one backend is served by multiple teams
- `/app/administration/roles`
  - roles management
- `/app/administration/about`
  - about/product information

User-facing navigation and documentation should list semantic pages, not raw database IDs. Dynamic route parameters exist for implementation, tenant isolation, and user-specific/project-specific content, but they should use readable slugs and stay out of simple route inventories shown to users.

#### Rules for the Route Layer

- Route files should remain thin and delegate UI composition to components when logic grows.
- Prefer server components by default.
- Introduce `"use client"` only when interaction, hooks, or browser APIs require it.
- Keep authenticated product surfaces inside the shared `/app` route space.
- Use dynamic segments for tenant-, project-, and user-specific content when context is required.
- Prefer slugs or readable keys over opaque IDs in route parameters.
- Do not expose raw internal IDs in route lists, navigation labels, or public-facing documentation.
- Each route must handle:
  - loading state
  - empty state where applicable
  - error state where applicable
  - success feedback for form-based actions
- Route naming must follow the product URL model defined by the spec.

#### Future route expansion

Based on `docs/spec.md`, the frontend is expected to grow into:

- project workspace routes
- specification editing routes
- task and completion note routes
- role-aware project assignment screens
- generation snapshot and validation result views
- tenant-aware and user-aware detail surfaces driven by dynamic segments

These should be added under coherent route groups rather than flat route sprawl.

---

### 2. `nextjs/components` — Shared UI Composition Layer

**Purpose:** Contains reusable UI building blocks shared by routes and layouts.

Current responsibilities:

- auth shell composition
- admin/dashboard shell composition
- reusable table/card presentation
- shared icons

#### Rules for the Component Layer

- Keep components focused on presentation and interaction.
- Move data access and domain transformation out of shared UI components when complexity increases.
- Prefer decomposition into:
  - shell components
  - list/table components
  - form sections
  - empty/error/loading views
  - modal or drawer components
- Props must be typed explicitly.
- Avoid route-specific business logic inside reusable components.

#### Current gap versus target standard

The current components are custom-built and CSS-driven. New or heavily refactored shared components should move toward:

- Ant Design primitives for common controls
- `antd-style` or token-driven styling
- central design tokens for colors, spacing, radii, and typography

This should be done incrementally rather than through a blind rewrite.

---

### 3. `nextjs/lib` — Shared Data and Utility Layer

**Purpose:** Holds lightweight shared data helpers, static data, and future frontend utility modules.

Current responsibility:

- demo/static data backing current table and dashboard views

#### Rules for the Utility Layer

- Keep utilities framework-safe and typed.
- Shared UI-independent transformations belong here rather than inside components.
- API clients, serializers, and domain mappers should live here or in a future dedicated `services/` or `api/` folder once live backend integration expands.
- Avoid hiding side effects in generic helper files.

---

### 4. `nextjs/public` — Static Asset Layer

**Purpose:** Stores public assets served directly by Next.js.

Current assets:

- logo image
- user avatar/reference image

#### Rules for Assets

- Assets must use stable, descriptive names.
- Figma-exported SVGs should be stored in a dedicated asset structure once introduced.
- If design exports become substantial, introduce:

```text
nextjs/public/
├── img/
├── icons/
└── svg/
```

- Geometry should match SVG exports, while placement and sizing should follow Figma.

---

### 5. `nextjs/tests` — End-to-End Test Layer

**Purpose:** Contains Playwright coverage for visible frontend behavior.

Current state:

- a baseline example Playwright spec exists
- functional route-by-route coverage is still minimal

#### Rules for Frontend Testing

- Add or update Playwright tests whenever frontend behavior changes.
- Cover:
  - happy paths
  - validation behavior
  - visible empty/error states
  - navigation-critical flows
- Prefer stable locators based on:
  - roles
  - labels
  - placeholders
  - explicit test ids where needed
- Do not leave stale tests after UI behavior changes.

---

## Layout Strategy

The frontend currently uses two primary layout modes:

### Auth Layout

Owned by `nextjs/app/account/layout.tsx` and `nextjs/components/account-shell.tsx`.

Responsibilities:

- centered account card structure
- auth page visual framing
- parity with Angular login/register composition where required

Auth layout rules:

- preserve Angular parity for login and registration when explicitly required
- keep branding, field grouping, button placement, and footer structure aligned with reference design
- ensure the screen remains usable on smaller viewports

### App Layout

Owned by `nextjs/app/app/layout.tsx` and `nextjs/components/dashboard-shell.tsx`.

Responsibilities:

- authenticated shell
- navigation
- consistent dashboard framing
- shared chrome for admin pages

App layout rules:

- navigation structure must remain predictable
- role-aware route visibility should be added as real auth integration arrives
- shells should not embed page-specific business logic
- one authenticated route tree should serve dashboard, administration, project, and workspace surfaces
- active tenant and project context should be represented by route segments or resolved session context, not by exposing raw IDs everywhere

---

## Styling Strategy

### Current State

The current frontend uses:

- global CSS in `nextjs/app/globals.css`
- component markup with class-based styling
- custom components rather than a formal component library

### Required Target Standard

Frontend work should evolve toward:

- shared design tokens in a central file
- colocated styles per component or feature
- Ant Design for common primitives
- `antd-style` for token-aware styling

### Required Styling Rules

- no Tailwind
- no uncontrolled inline styles
- prefer shared tokens over hardcoded values
- align typography, spacing, and hierarchy with Figma
- make color changes centrally rather than page-by-page

Suggested future shape once the theme layer is introduced:

```text
nextjs/
├── theme/
│   ├── tokens.ts
│   ├── colors.ts
│   ├── typography.ts
│   └── index.ts
├── components/
│   ├── some-component/
│   │   ├── index.tsx
│   │   ├── styles.ts
│   │   └── types.ts
```

Do not claim this structure exists until it is actually introduced.

---

## Data, State, and Interaction Rules

### Data Ownership

- backend APIs remain the authoritative source for users, tenants, roles, projects, specifications, tasks, and generation data
- frontend state should represent fetched or user-entered state, not replace backend authority

### State Rules

- keep state local unless it is genuinely shared
- prefer server rendering or server data fetching when practical
- use client state for:
  - transient form state
  - interactive controls
  - local UI affordances
- guard against missing or null data explicitly

### Feedback Rules

All user-visible actions must provide feedback:

- loading indicators
- disabled submit states
- validation messages
- empty states
- clear error messages
- success confirmation where appropriate

### Role-Aware UI Rules

Based on `docs/spec.md`:

- Host Admin sees global tenant and administration surfaces
- Tenant Admin sees tenant-scoped management surfaces
- Project Lead coordinates project work and can edit specification sections
- Business Analyst edits requirement-oriented sections
- Systems Architect edits architecture and domain-oriented sections

Dynamic routing implications:

- tenant-specific pages should resolve tenant context from a readable tenant segment
- project-specific pages should resolve project context from a readable project segment
- user-specific pages should resolve user context from a readable user segment where needed
- route generation should preserve tenant isolation and role-aware visibility

Frontend visibility should reflect these boundaries, but backend authorization remains authoritative.

---

## Figma and Angular Alignment Rules

### Figma

`docs/designs/figma-links.md` currently identifies these key design groups:

- Project Workspace
- Spec Workspace
- User Screens
- Auth Screens

These map into the authenticated route space as follows:

- Project Workspace
  - `/app/projects/[projectSlug]`
  - `/app/projects/[projectSlug]/requirements`
  - `/app/projects/[projectSlug]/task-assignment`
- Spec Workspace
  - `/app/projects/[projectSlug]/use-case-diagram`
  - `/app/projects/[projectSlug]/domain-model`
  - `/app/projects/[projectSlug]/activity-diagram`
- User Screens
  - `/app/users`
  - `/app/users/[userSlug]`
  - `/app/tenants`
  - `/app/tenants/[tenantSlug]`
- Auth Screens
  - `/account/login`
  - `/account/register`

Implementation rules:

- use Figma for layout, spacing, and composition
- use exported SVGs for vector details
- do not improvise spacing or hierarchy when Figma defines them

### Angular Parity

The repository still includes `angular/` as a reference implementation.

Parity rules:

- login and register pages should remain one-to-one with Angular where requested
- existing admin pages should preserve route and content parity until intentionally redesigned
- Angular is a migration reference, not the long-term frontend architecture

---

## Adding a New Frontend Feature — Step-by-Step

Follow these steps whenever a new frontend surface is introduced.

### Step 1 — Read the product and design references

Review:

- `docs/spec.md`
- `docs/architecture.md`
- `docs/designs/figma-links.md`
- `.codex/skills/frontend-standards/SKILL.md`

If the feature is role-sensitive, also review the permission source once it exists.

### Step 2 — Define the route and layout placement

Decide:

- whether the page belongs under `/account`, `/app`, or a new route group
- whether it uses an existing shell or needs a new nested layout
- whether it should be server or client rendered

### Step 3 — Define the component breakdown

Break the feature into:

- route entry
- layout wrapper if needed
- data section
- form or table section
- empty/error/loading views
- shared primitives if reusable

### Step 4 — Add or refactor shared tokens and styles

If the feature introduces new visual primitives:

- add them to the theme/token layer once that structure exists
- do not hardcode values repeatedly across pages

### Step 5 — Wire data and interaction states

Implement:

- loading
- empty
- error
- success
- responsive behavior
- keyboard-safe interactions

### Step 6 — Add or update Playwright coverage

Cover the user-facing path that changed.

### Step 7 — Update documentation if structure or behavior changed

At minimum, update the relevant doc when:

- route structure changes
- role-aware behavior changes
- design source rules change
- frontend architecture assumptions change

---

## Cross-Cutting Concerns

| Concern | How It Is Handled |
|---|---|
| **Routing** | Next.js App Router under `nextjs/app/` |
| **Typing** | TypeScript throughout the frontend |
| **Styling** | Current global CSS, with target migration toward token-based styling and `antd-style` |
| **Design Source** | Figma for layout and spacing, SVG exports for vector geometry |
| **Auth Layout Parity** | Angular reference app for login/register alignment |
| **Responsiveness** | Mandatory across mobile, tablet, and desktop |
| **Accessibility** | Semantic structure, keyboard access, readable states, and descriptive controls |
| **Feedback States** | Explicit loading, empty, error, and success handling |
| **Testing** | Playwright for end-to-end coverage of visible behavior |
| **Role Awareness** | Frontend reflects role boundaries, backend enforces authority |

---

## Technology Stack

| Component | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| UI Runtime | React 19 |
| Styling Current State | Global CSS |
| Styling Target Standard | Ant Design plus `antd-style` with shared design tokens |
| Design Source | Figma plus exported SVG assets |
| Testing | Playwright |
| Asset Hosting | Next.js `public/` |

---

## Current Gaps to Track

The repo standard now expects Ant Design, `antd-style`, and central tokens for new frontend work. The current `nextjs` app does not yet fully implement that stack. Until those dependencies and structures are introduced:

- preserve current working behavior
- avoid fake documentation that claims Ant Design is already wired
- move new work toward the target standard deliberately
- keep the structure document honest about current state versus desired standard
