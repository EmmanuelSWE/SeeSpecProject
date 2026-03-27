# SeeSpec API Contracts

## 1. Purpose

This document defines the backend API surface expected by the frontend and the contract rules that keep both sides aligned.

Use this file when implementing:

- application service DTOs
- frontend service calls and providers
- route loaders and form submissions
- integration and end-to-end tests

## 2. Contract Rules

- all APIs are tenant-aware
- project-scoped APIs require both project identity and permission context
- DTOs must be explicit and versionable
- responses must never leak internal-only fields by accident
- timestamps must be returned in ISO 8601 format
- ids may remain GUIDs in the backend, but UI routes should prefer readable slugs where available

## 3. Authentication and Headers

### Auth

- authentication uses bearer tokens issued by the backend
- protected endpoints require `Authorization: Bearer <token>`

### Tenant Context

One of the following patterns must be chosen and then used consistently:

- header-based tenant resolution
  - `Abp.TenantId: <tenantId>`
- route-based tenant resolution
  - tenant segment in the route

Current recommendation:

- use ABP-compatible tenant header for backend APIs
- use readable tenant slugs for frontend routes

## 4. Response Envelope Rules

### Success

Simple read/write operations should return explicit DTO payloads:

```json
{
  "id": "uuid",
  "name": "Example"
}
```

List operations should return a paged envelope:

```json
{
  "items": [],
  "totalCount": 0,
  "pageNumber": 1,
  "pageSize": 20
}
```

### Error

All errors should map into a stable shape:

```json
{
  "error": {
    "code": "spec_section_forbidden",
    "message": "You do not have permission to edit this section.",
    "details": null,
    "traceId": "trace-id"
  }
}
```

## 5. Common DTO Conventions

- identifiers
  - backend primary keys use GUIDs unless documented otherwise
- audit fields
  - `creationTime`
  - `creatorUserId`
  - `lastModificationTime`
  - `lastModifierUserId`
- status fields should use enums serialized as strings
- write DTOs should exclude derived and audit-only fields

## 6. Endpoint Groups

## 6.1 Auth

### `POST /api/token-auth/authenticate`

Purpose:

- authenticate a user and issue an access token

Request:

```json
{
  "tenancyName": "default",
  "userNameOrEmailAddress": "arch@example.com",
  "password": "string",
  "rememberClient": true
}
```

Response:

```json
{
  "accessToken": "jwt",
  "encryptedAccessToken": "encrypted-jwt",
  "expireInSeconds": 3600,
  "userId": 123,
  "tenantId": 5,
  "userName": "ada",
  "fullName": "Ada Lovelace",
  "emailAddress": "ada@example.com"
}
```

Cookie behavior:

- backend sets `seespec_auth_token` for cookie-based bearer auth
- backend sets `seespec_user_session` with partial user info and `tenantId` for frontend hydration

## 6.2 Projects

### `GET /api/projects`

Purpose:

- list projects visible to the current user

Query:

- `pageNumber`
- `pageSize`
- `search`
- `tenantId` when host context is allowed

Response item shape:

```json
{
  "id": "uuid",
  "slug": "inventory-platform",
  "name": "Inventory Platform",
  "tenantId": 5,
  "ownerAssignmentId": "uuid",
  "status": "Active",
  "teamCount": 2,
  "memberCount": 9
}
```

### `POST /api/projects`

Request:

```json
{
  "name": "Inventory Platform",
  "slug": "inventory-platform",
  "description": "Project workspace",
  "tenantId": 5
}
```

## 6.3 Assignments

### `GET /api/projects/{projectId}/assignments`

Response item shape:

```json
{
  "id": "uuid",
  "projectId": "uuid",
  "userId": 42,
  "userDisplayName": "Ada Lovelace",
  "roles": ["ProjectLead", "SystemsArchitect"],
  "isActive": true
}
```

### `POST /api/projects/{projectId}/assignments`

Request:

```json
{
  "userId": 42,
  "roles": ["BusinessAnalyst"]
}
```

## 6.4 Specs

### `GET /api/projects/{projectId}/spec`

Response:

```json
{
  "id": "uuid",
  "projectId": "uuid",
  "title": "Inventory Platform Spec",
  "version": 3,
  "updatedAt": "2026-03-27T10:00:00Z"
}
```

### `GET /api/projects/{projectId}/spec/sections`

Response item shape:

```json
{
  "id": "uuid",
  "specId": "uuid",
  "parentSectionId": null,
  "title": "Order Requirements",
  "slug": "order-requirements",
  "sectionType": "Requirement",
  "order": 1,
  "isEditable": true,
  "ownerRole": "BusinessAnalyst"
}
```

### `PATCH /api/spec-sections/{sectionId}`

Request:

```json
{
  "title": "Order Requirements",
  "content": "Updated section content",
  "version": 4
}
```

Response:

```json
{
  "id": "uuid",
  "title": "Order Requirements",
  "sectionType": "Requirement",
  "content": "Updated section content",
  "version": 5,
  "updatedAt": "2026-03-27T10:05:00Z"
}
```

## 6.5 Tasks

### `GET /api/projects/{projectId}/tasks`

Response item shape:

```json
{
  "id": "uuid",
  "projectId": "uuid",
  "title": "Review order section",
  "status": "InProgress",
  "priority": "High",
  "assigneeUserId": 42,
  "assigneeDisplayName": "Ada Lovelace",
  "linkedSectionIds": ["uuid"]
}
```

### `POST /api/projects/{projectId}/tasks`

Request:

```json
{
  "title": "Review order section",
  "description": "Validate requirement wording",
  "priority": "High",
  "assigneeUserId": 42,
  "linkedSectionIds": ["uuid"]
}
```

### `PATCH /api/tasks/{taskId}/status`

Request:

```json
{
  "status": "Completed"
}
```

## 6.6 Completion Notes

### `GET /api/projects/{projectId}/completion-notes`

Response item shape:

```json
{
  "id": "uuid",
  "projectId": "uuid",
  "taskId": "uuid",
  "generationSnapshotId": null,
  "authorUserId": 42,
  "authorDisplayName": "Ada Lovelace",
  "noteType": "Manual",
  "body": "Requirement review completed.",
  "createdAt": "2026-03-27T10:15:00Z"
}
```

### `POST /api/tasks/{taskId}/completion-notes`

Request:

```json
{
  "body": "Requirement review completed."
}
```

## 6.7 Generation Snapshots

### `GET /api/projects/{projectId}/generation-snapshots`

Response item shape:

```json
{
  "id": "uuid",
  "projectId": "uuid",
  "triggeredByUserId": 42,
  "triggeredByDisplayName": "Ada Lovelace",
  "status": "Succeeded",
  "summary": "Generated application service scaffolding for Order module.",
  "createdAt": "2026-03-27T10:20:00Z"
}
```

### `POST /api/projects/{projectId}/generation-snapshots`

Request:

```json
{
  "sectionIds": ["uuid", "uuid"],
  "mode": "Incremental"
}
```

Response:

```json
{
  "id": "uuid",
  "status": "Queued"
}
```

Contract rule:

- creating a generation snapshot must also create an automatic completion note

## 6.8 Validation Results

### `GET /api/projects/{projectId}/validation-results`

Response item shape:

```json
{
  "id": "uuid",
  "projectId": "uuid",
  "snapshotId": "uuid",
  "status": "Passed",
  "summary": "No structural drift detected.",
  "createdAt": "2026-03-27T10:25:00Z"
}
```

## 7. Frontend Data Dependencies

The frontend should be able to render these pages from the contracts above:

- dashboard
- projects list
- project overview
- requirements editor
- task assignment
- users
- tenants
- generation history and activity feed

## 8. Versioning Rules

- additive changes may be introduced without a version bump if they do not break consumers
- renames, removals, and semantic response changes require coordinated frontend and backend updates
- breaking changes must be documented in this file before implementation lands

## 9. Test Expectations

- every endpoint group should have integration coverage for auth, success, forbidden, and invalid-input paths
- frontend tests should validate the page states that depend on each endpoint

## 10. Open Decisions To Finalize

- whether ABP default response envelopes should be preserved or normalized behind custom controllers/services
- whether project identity in API routes should use GUIDs only or support slugs
- whether generation should be synchronous request/response or queued async workflow
