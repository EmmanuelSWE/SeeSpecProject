# SeeSpec Permissions Matrix

## 1. Purpose

This document defines the authoritative permission model for SeeSpec.

Use this file when implementing:

- backend authorization attributes and permission checks
- frontend route visibility and action affordances
- section-level editing behavior
- audit and review workflows

Backend authorization remains authoritative. Frontend visibility must mirror it.

## 2. Scope Levels

Permissions are evaluated across these scopes:

- host scope
  - platform-wide administration across all tenants
- tenant scope
  - administration within one tenant
- project scope
  - collaboration and delivery actions within one project
- section scope
  - edit authority for specific specification sections inside one project

## 3. Roles

### Host Admin

- global access across tenants
- manages tenants, global users, and global roles
- may access every tenant and project for administration

### Tenant Admin

- full administrative access within one tenant
- manages users, projects, and assignments within that tenant
- cannot administer outside the tenant

### Project Lead

- coordinates project delivery
- may edit all specification sections in the project
- assigns users, manages tasks, and approves completion

### Business Analyst

- edits requirement-oriented sections only
- may create and update requirement-linked tasks when assigned
- may not edit architecture-only sections unless separately elevated

### System Architect

- edits architecture and domain-oriented sections only
- may manage diagram-linked structural artifacts
- may not edit requirement-only sections unless separately elevated

## 4. Permission Principles

- every permission decision must include tenant context
- project content requires project membership unless the user is Host Admin
- section edits require both project access and section-type authority
- hidden UI actions must not appear for users who should not know they exist
- disabled UI actions may be shown only when visibility is useful but the action is not currently allowed
- approval and completion actions must remain attributable to a user

## 5. Resource Actions

Standard action verbs used in this document:

- `view`
- `create`
- `edit`
- `delete`
- `assign`
- `approve`
- `generate`
- `validate`
- `manage`

## 6. Matrix

| Resource | Action | Host Admin | Tenant Admin | Project Lead | Business Analyst | System Architect | Notes |
|---|---|---|---|---|---|---|---|
| Tenant | view | yes | own tenant only | no | no | no | Host Admin may view all tenants |
| Tenant | create | yes | no | no | no | no | |
| Tenant | edit | yes | own tenant only | no | no | no | Tenant Admin cannot cross tenant boundary |
| Tenant | delete | yes | no | no | no | no | High-risk action, confirm explicitly |
| User | view | yes | own tenant only | project members only | self and project context only | self and project context only | Narrow UI to least required scope |
| User | create/invite | yes | own tenant only | no | no | no | |
| User | edit | yes | own tenant only | no | no | no | |
| User | remove | yes | own tenant only | no | no | no | Host Admin is the only global remover |
| Project | view | yes | own tenant only | assigned projects | assigned projects | assigned projects | |
| Project | create | yes | own tenant only | no | no | no | |
| Project | edit metadata | yes | own tenant only | assigned projects | no | no | Project Lead edits project operations, not tenant ownership |
| Assignment | view | yes | own tenant only | assigned projects | assigned projects | assigned projects | |
| Assignment | assign/manage | yes | own tenant only | assigned projects | no | no | |
| Task | view | yes | own tenant only | assigned projects | assigned projects | assigned projects | |
| Task | create | yes | own tenant only | assigned projects | assigned projects when allowed by project rules | assigned projects when allowed by project rules | Final rule can be narrowed later |
| Task | edit status | yes | own tenant only | assigned projects | own assigned tasks only | own assigned tasks only | |
| Task | assign | yes | own tenant only | assigned projects | no | no | |
| Completion Note | view | yes | own tenant only | assigned projects | assigned projects | assigned projects | |
| Completion Note | create manual | yes | own tenant only | assigned projects | assigned projects | assigned projects | Generation also creates automatic notes |
| Completion Note | approve/review | yes | own tenant only | assigned projects | no | no | |
| Spec | view | yes | own tenant only | assigned projects | assigned projects | assigned projects | |
| Spec | create | yes | own tenant only | assigned projects | no | no | |
| Spec | edit structure | yes | own tenant only | assigned projects | no | no | Structural edits include section ordering and dependency edits |
| Spec Section: Requirement | edit | yes | yes | yes | yes | no | Analyst-owned section type |
| Spec Section: Architecture | edit | yes | yes | yes | no | yes | Architect-owned section type |
| Spec Section: Domain | edit | yes | yes | yes | no | yes | Architect-owned section type |
| Diagram Element | view | yes | own tenant only | assigned projects | assigned projects | assigned projects | |
| Diagram Element | edit | yes | own tenant only | assigned projects | requirement-linked only if explicitly allowed | assigned projects | Tighten by diagram type if needed |
| Generation Snapshot | view | yes | own tenant only | assigned projects | assigned projects | assigned projects | |
| Generation Snapshot | create/generate | yes | own tenant only | assigned projects | no | no | Initial assumption: generation is lead/admin controlled |
| Validation Result | view | yes | own tenant only | assigned projects | assigned projects | assigned projects | |
| Validation Result | create/validate | yes | own tenant only | assigned projects | no | no | |
| Roles | view | yes | own tenant only | no | no | no | |
| Roles | manage | yes | own tenant only | no | no | no | Project roles are applied through assignments |

## 7. Section Ownership Rules

Section types must be classified explicitly in the data model:

- `Requirement`
- `Architecture`
- `Domain`
- `Shared`

Editing rules:

- `Project Lead` may edit all section types
- `Business Analyst` may edit `Requirement`
- `System Architect` may edit `Architecture` and `Domain`
- `Shared` sections require explicit project policy

Current default for `Shared`:

- `Project Lead` may edit
- `Business Analyst` and `System Architect` are read-only unless the project defines an owner

## 8. UI Enforcement Rules

- unauthorized routes should not appear in navigation
- unauthorized actions should be hidden when discovery is not useful
- disabled states may be used for context-sensitive actions such as locked workflow states
- empty states must explain whether the issue is lack of data or lack of permission
- section editors must render read-only mode with clear ownership messaging

## 9. Backend Enforcement Rules

- every mutation endpoint must validate tenant and project scope
- section mutation endpoints must validate section type ownership
- generation endpoints must record the acting user and target project
- automatic completion notes for generation snapshots must include actor, timestamp, and outcome summary

## 10. Open Decisions To Finalize

- whether Tenant Admin can edit all spec sections by policy or only administer projects
- whether Business Analyst and System Architect can create tasks or only update tasks assigned to them
- whether diagram editing should be split by diagram type in the permission model
- whether validation can be run by System Architect in addition to Project Lead
