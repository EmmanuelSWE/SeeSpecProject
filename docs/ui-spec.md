# UI Specification

## 1. Design Intent

- visual direction:
  - SeeSpec uses the **Ember Grid** design language.
  - The interface should read like a controlled thermal map across dark geological surfaces.
  - Layout, depth, glow, and border treatment are structural meaning, not decoration.
- mood:
  - focused
  - analytical
  - precise
  - high-attention
  - calm under density
- product character:
  - serious design workspace rather than generic admin SaaS
  - role-aware, instrument-like, and built for sustained technical work
  - dense where necessary, but never visually noisy
- accessibility baseline:
  - readable contrast across dark surfaces
  - keyboard-first navigation for primary actions
  - visible focus states
  - semantic headings, landmarks, labels, and status feedback
  - no critical state communicated by color alone

### Ember Grid

#### A Design Philosophy for Systematic Luminance

Ember Grid emerges from the conviction that interfaces are topographic maps of intention. Every surface, every gradient, and every shadow encodes meaning before a single word is read. The aesthetic draws from the language of thermal imaging and geological stratification: deep earth tones form the substrate, while concentrated bands of orange and red energy trace the pathways where human attention must flow. This is not decoration. It is the calibration of luminous hierarchy across dark terrain.

Glass is used as a material metaphor for layered observation rather than transparency for its own sake. The deepest background is nearly black-green basalt. Mid-level panels float as frosted obsidian with faint warm refraction at the edges. Active elements glow like embers behind volcanic glass. Borders are treated as thermal gradients rather than hard lines.

Typography functions as spatial scaffolding. Headings are thin, wide, and luminous. Body copy recedes into warm neutrals. Labels operate as quiet coordinates. Numeric indicators and status values carry the strongest typographic emphasis and should feel technical rather than decorative.

Color follows thermodynamic logic. The palette moves from deep forest-black through amber into concentrated orange-red. Cool tones are not part of the system. Semantic colors exist, but are used sparingly:

- success: restrained phosphorescent green
- warning: amber
- error: hot red

Composition follows systematic density. Information should be grouped into dense zones separated by dark negative space. Motion should feel like gradual energy transfer:

- border brightening
- surface lift
- glow intensification

Never use abrupt or playful animation in primary workflow surfaces.

## 2. Layout Model

- app shell:
  - one authenticated `/app` shell owns the main workspace experience
  - shell contains left navigation, top utility band, workspace content region, and optional right-side contextual panel
- primary navigation:
  - persistent left vertical navigation for major workspace areas
  - top strip for tenant, project, search, notifications, and current-user controls
  - navigation labels should be semantic and should not expose raw IDs
- page regions:
  - header region for title, context, and primary actions
  - metrics region for overview cards where applicable
  - main content region for diagrams, forms, tables, or structured work panels
  - secondary region for feeds, activity, status, or supporting metadata
- role-aware panels:
  - tenant and project context affect what is shown in sidebars, action trays, and edit controls
  - sections unavailable to the current role should be hidden or clearly disabled

## 3. Screens

### Landing page

- purpose:
  - introduce SeeSpec and route users toward login, registration, or workspace entry
- content blocks:
  - hero statement
  - product summary
  - role/workspace highlights
  - primary CTA block
- actions:
  - sign in
  - register
  - enter workspace areas if already authenticated
- states:
  - pending
  - success
  - error if route/bootstrap fails
- likely components:
  - hero panel
  - feature cards
  - primary CTA group
  - footer links

### Login

- structure:
  - must preserve Angular parity where required
  - centered auth shell with logo, tenant context row, form card, footer strip, and version/copyright line
- fields:
  - username or email
  - password
  - remember me
- validation:
  - required fields
  - inline error messaging
  - failed authentication feedback
- transitions:
  - pending submit state
  - error state after invalid credentials
  - success redirects into `/app`
- likely components:
  - account shell
  - auth form card
  - input with appended icon treatment
  - remember-me checkbox row
  - primary submit button

### Register

- structure:
  - same auth shell family as login
  - role-neutral registration flow
  - compact stacked form inside centered account card
- fields:
  - name
  - surname
  - username
  - email
  - password
  - confirm password
- validation:
  - required fields
  - email format
  - password confirmation match
  - backend registration failure feedback
- transitions:
  - pending submit state
  - validation error state
  - success routes user into the next authenticated step or login flow
- likely components:
  - account shell
  - stacked registration form
  - field validation messages
  - back button
  - primary register button

### Workspace

- purpose:
  - provide the authenticated product environment for dashboard, projects, specs, tasks, teams, and administration surfaces
- overview panel:
  - top metric cards
  - current tenant/project context
  - recent activity summary
- navigation:
  - left sidebar for major areas
  - top bar for filters, tenant/project switching, and user controls
- central canvas:
  - varies by page:
    - dashboard charts and summary modules
    - requirements panels
    - task assignment boards
    - diagrams
    - project/team tables
- activity feed:
  - recent actions
  - generation snapshots
  - completion notes
  - change summaries
- likely components:
  - dashboard shell
  - metric cards
  - charts
  - data tables
  - workspace panels
  - activity feed cards
  - right-side contextual info panel

### Dashboard

- purpose:
  - give a fast operational summary of the active workspace
- content blocks:
  - KPI cards
  - trend chart
  - recent events list
  - status ring or breakdown widget
- actions:
  - change project or tenant context
  - navigate to deeper workspace pages
- states:
  - pending
  - empty if no workspace data exists
  - error if dashboard data fails to load
  - success when data is available
- likely components:
  - shell
  - KPI card row
  - area chart module
  - list panel
  - donut/ring status chart

### Requirements page

- purpose:
  - display and edit structured requirement content
- content blocks:
  - section list
  - requirement detail panel
  - comments or traceability panel
- actions:
  - edit requirement sections
  - filter sections
  - navigate to linked diagrams or tasks
- states:
  - pending
  - empty
  - error
  - success
  - disabled fields when role lacks edit permission
- likely components:
  - section tree
  - detail editor
  - status badges
  - assignment metadata

### Task Assignment page

- purpose:
  - assign work to users and track role-scoped progress
- content blocks:
  - task list
  - assignment controls
  - priority/status summary
  - recent completion notes
- actions:
  - assign user
  - change status
  - add completion note
- states:
  - pending
  - empty
  - error
  - success
  - disabled actions for unauthorized roles
- likely components:
  - task table
  - assignee selector
  - status chip group
  - completion note feed

### Use Case Diagram page

- purpose:
  - show and manage use case diagram context for the active project
- content blocks:
  - central diagram canvas
  - actor/use case metadata panel
  - dependency or linked-section panel
- actions:
  - inspect
  - edit if authorized
  - link to related sections
- states:
  - pending
  - empty if no diagram exists
  - error
  - success
- likely components:
  - diagram canvas container
  - inspector panel
  - node/edge metadata cards

### Domain Model page

- purpose:
  - represent the active domain model and its relationships
- content blocks:
  - model canvas
  - entity detail panel
  - relationship summary
- actions:
  - inspect model elements
  - edit if authorized
  - jump to related spec sections
- states:
  - pending
  - empty
  - error
  - success
- likely components:
  - diagram canvas
  - entity card
  - relationship list

### Activity Diagram page

- purpose:
  - present process flow for the active project or spec slice
- content blocks:
  - activity diagram canvas
  - step metadata
  - related requirement/task panel
- actions:
  - inspect activity flow
  - edit if authorized
  - follow traceability links
- states:
  - pending
  - empty
  - error
  - success
- likely components:
  - diagram canvas
  - metadata drawer
  - linked-artifact summary cards

### Users page

- purpose:
  - manage or inspect users based on role permissions
- content blocks:
  - user table
  - filters
  - detail preview or route into a user page
- actions:
  - search
  - inspect
  - manage users when authorized
- states:
  - pending
  - empty
  - error
  - success
- likely components:
  - table
  - filter bar
  - role badge
  - detail side panel

### User detail page

- purpose:
  - show user-specific profile, assignments, and role context
- content blocks:
  - identity summary
  - tenant/project assignments
  - activity or task involvement
- actions:
  - edit user metadata if authorized
  - inspect assignments
- states:
  - pending
  - empty if user lookup fails
  - error
  - success
- likely components:
  - profile card
  - assignment table
  - activity feed

### Tenants page

- purpose:
  - list and manage tenants for authorized administrative roles
- content blocks:
  - tenant table
  - status summary
  - management actions
- actions:
  - create tenant
  - inspect tenant
  - manage authorized settings
- states:
  - pending
  - empty
  - error
  - success
- likely components:
  - data table
  - action toolbar
  - status indicator cells

### Tenant detail page

- purpose:
  - show tenant-specific workspace context, metadata, and administrative status
- content blocks:
  - tenant summary
  - project list
  - tenant user overview
- actions:
  - inspect tenant-owned projects
  - administer tenant if authorized
- states:
  - pending
  - empty
  - error
  - success
- likely components:
  - summary cards
  - project list
  - user list panel

### Roles page

- purpose:
  - inspect and manage role definitions and role-based capabilities
- content blocks:
  - role table
  - permissions summary
  - role detail preview
- actions:
  - inspect
  - edit if authorized
- states:
  - pending
  - empty
  - error
  - success
- likely components:
  - table
  - detail panel
  - permission chip groups

### Settings page

- purpose:
  - allow current-user settings and account maintenance
- content blocks:
  - account form
  - password form
  - preferences or notification settings
- actions:
  - update account details
  - change password
- states:
  - pending
  - error
  - success
  - disabled while submitting
- likely components:
  - form sections
  - submit row
  - inline status alerts

### About page

- purpose:
  - provide product and environment context
- content blocks:
  - product summary
  - version/environment info
  - support or documentation links
- actions:
  - navigate to related docs
- states:
  - pending
  - error
  - success
- likely components:
  - info cards
  - link list
  - metadata rows

## 4. Component Rules

- forms:
  - must provide labels or accessible equivalents
  - must show validation clearly
  - must show pending and disabled submission states
  - should group related fields into clear sections
- cards:
  - should establish hierarchy through surface depth and thermal borders
  - dense data is allowed inside cards, but spacing between card groups must remain generous
- tables:
  - should degrade gracefully on smaller screens
  - should support filter and status display patterns consistently
  - row actions should reflect permission state
- dialogs:
  - use for focused confirmations or editing flows, not for primary navigation
  - destructive actions require confirmation
- sidebars:
  - left sidebar owns persistent navigation
  - right sidebar or contextual panel owns supporting metadata, inspector details, or activity context
- feeds:
  - feeds should show time ordering clearly
  - activity entries should be scan-friendly and attributable to users, tasks, or snapshots

## 5. State Rules

- pending:
  - replaces the former loading label
  - must communicate that data fetch or submission is in progress
  - use skeletons, muted placeholders, spinners, or subdued progress bands as appropriate
- empty:
  - explain why there is no data
  - provide a next action where possible
- error:
  - show a clear failure message
  - provide retry or recovery action where practical
- success:
  - confirm completed operations without overwhelming the interface
- disabled:
  - visually distinct from active elements
  - used for unauthorized or temporarily unavailable actions

## 6. Role-Aware UI Rules

- Host Admin:
  - can see global administration, tenants, roles, users, and system-wide summaries
  - can edit global administrative surfaces
  - can see actions hidden from lower roles
- Tenant Admin:
  - can see tenant-scoped administrative screens, users, projects, and assignments in their tenant
  - can edit tenant-scoped management controls
  - cannot access global-only administration
- Project Lead:
  - can see project dashboards, requirements, tasks, diagrams, teams, and project-level assignment surfaces
  - can edit project specification sections and coordination surfaces
  - can access broader project controls than analyst or architect roles
- Business Analyst:
  - can see project workspace screens relevant to requirements and traceability
  - can edit requirement-oriented content
  - should not see architecture-only edit controls
- Systems Architect:
  - can see model and architecture surfaces relevant to the project
  - can edit architecture and domain-oriented content
  - should not see requirement-only edit controls when editing is role-limited

General rules:

- hidden actions should be removed entirely if the role should not know the capability exists
- disabled actions should be used when visibility is useful but execution is not allowed in the current state
- frontend role handling must mirror backend authority but never replace it

## 7. Visual Tokens

- typography:
  - display/headings: thin, wide, luminous, architectural
  - body: warm neutral, restrained contrast
  - labels: small uppercase, quiet coordinate markers
  - metrics/status numbers: monospaced or pseudo-technical emphasis
- spacing:
  - strict grid spacing
  - dense content clusters separated by wide dark channels
  - consistent card padding and inter-panel rhythm
- colors:
  - background base: black-green basalt
  - mid surfaces: obsidian and charcoal with warm edge refraction
  - accents: amber, ember orange, restrained red-orange
  - success: sparse phosphorescent green
  - warning: amber
  - error: red
- icon rules:
  - icons should feel technical and minimal
  - avoid playful or soft rounded illustration styles in core workflow surfaces
  - icon strokes and fills should harmonize with the thermal palette
- motion rules:
  - slow thermal shifts
  - border brightening
  - subtle surface lift
  - glow intensification
  - no abrupt bouncing or novelty motion on primary workflow surfaces

## 8. Assets

- figma sources:
  - use `docs/designs/figma-links.md`
  - Figma is authoritative for layout, spacing, and screen composition
- svg assets:
  - SVGs are authoritative for vector geometry
  - exported assets should live in the frontend asset structure once added
- export rules:
  - export SVGs at 1x
  - keep names stable and descriptive
  - do not silently hand-edit exported vectors without documenting the reason
