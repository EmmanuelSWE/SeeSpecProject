# SeeSpec Domain Model

## 1. Purpose

This document normalizes the core implementation model for SeeSpec so backend entities, DTOs, permissions, and UI assumptions all use the same names and relationships.

## 2. Modeling Rules

- every Backend belongs to exactly one tenant
- every spec belongs to exactly one Backend
- every assignment joins one user to one Team
- every Team belongs to exactly one Backend
- one Backend owns one backend target in the initial implementation
- one backend target may be served by multiple teams
- generation snapshots and completion notes must be attributable

## 3. Core Entities

## 3.1 Tenant

Purpose:

- top-level organizational boundary

Suggested fields:

- `Id`
- `Name`
- `Slug`
- `IsActive`

## 3.2 Backend

Purpose:

- Backend workspace inside a tenant

Suggested fields:

- `Id`
- `TenantId`
- `Name`
- `Slug`
- `Framework`
- `RuntimeVersion`
- `Description`
- `Status`
- `RepositoryUrl`


Relationships:

- one `Tenant` to many `Backend`
- one `Backend` to many `Assignment`
- one `Backend` to one `Spec`
- one `Backend` to many `Task`
- one `Backend` to many `Team`


## 3.4 Assignment

Purpose:

- Backend membership and role binding

Suggested fields:

- `Id`
- `BackendId`
- `UserId`
- `IsActive`
- `JoinedAt`

Relationships:

- many `Assignment` to one `Team`


## 3.6 Team

Purpose:

- optional grouping within a Backend around the same backend target

Suggested fields:

- `Id`
- `BackendId`
- `Name`
- `Description`

## 3.7 Spec

Purpose:

- machine-readable specification owned by a Backend

Suggested fields:

- `Id`
- `BackendId`
- `Title`
- `Version`
- `Status`

## 3.8 SpecSection

Purpose:

- hierarchical section within a spec

Suggested fields:

- `Id`
- `SpecId`
- `ParentSectionId`
- `Title`
- `Slug`
- `SectionType`
- `Order`
- `Content`
- `OwnerRole`
- `Version`

Allowed `SectionType` values:

- `Requirement`
- `Architecture`
- `Domain`
- `Shared`

Allowed `OwnerRole` values:

- `ProjectLead`
- `BusinessAnalyst`
- `SystemArchitect`
- `Shared`

## 3.9 SectionItem

Purpose:

- structured item inside a section

Suggested fields:

- `Id`
- `SpecSectionId`
- `Label`
- `Content`
- `Position`
- `ItemType`

Allowed `ItemType` values:

- `Paragraph`
- `Bullet`
- `TableRow`
- `ChecklistItem`

## 3.10 SectionDependency

Purpose:

- dependency ordering between sections

Suggested fields:

- `Id`
- `FromSectionId`
- `ToSectionId`
- `DependencyType`

Allowed `DependencyType` values:

- `DependsOn`
- `Blocks`
- `RelatesTo`

## 3.11 DiagramElement

Purpose:

- traceable diagram object linked to a section or model artifact

Suggested fields:

- `Id`
- `BackendId`
- `SpecSectionId`
- `DiagramType`
- `ExternalElementKey`
- `Name`
- `MetadataJson`

Allowed `DiagramType` values:

- `UseCase`
- `DomainModel`
- `Activity`

## 3.12 Task

Purpose:

- unit of Backend work

Suggested fields:

- `Id`
- `BackendId`
- `Title`
- `Description`
- `Status`
- `Priority`
- `CreatedByUserId`
- `AssignedToUserId`
- `TeamId`
- `SpecSectionId`
- `DueAt`

Allowed `Status` values:

- `Open`
- `InProgress`
- `Blocked`
- `Completed`
- `Cancelled`

## 3.14 Note

Purpose:

- structured traceability note for completed work or generation

Suggested fields:

- `Id`
- `BackendId`
- `TaskId`
- `GenerationSnapshotId`
- `AuthorUserId`
- `NoteType`
- `Body`
- `OutcomeSummary`

Allowed `NoteType` values:

- `Manual`
- `AutomaticGeneration`
- `Review`

## 3.15 GenerationSnapshot

Purpose:

- records a generation event and its outcome

Suggested fields:

- `Id`
- `BackendId`
- `TriggeredByUserId`
- `Mode`
- `Status`
- `Summary`
- `AffectedSectionIdsJson`
- `PromptSent`

Allowed `Mode` values:

- `Incremental`
- `Full`

Allowed `Status` values:

- `Queued`
- `Running`
- `Succeeded`
- `Failed`

## 3.16 ValidationResult

Purpose:

- stores validation output for generated or existing code

Suggested fields:

- `Id`
- `BackendId`
- `GenerationSnapshotId`
- `Passed`
- `GeneratedFilePath`
- `DiffSummary`
- `DetailsJson`

## 4. Relationship Summary

- `Tenant` 1 -> many `Backend`
- `Backend` 1 -> many `Assignment`
- `Team` 1 -> many `Task`
- `Backend` 1 -> many `Team`
- `Backend` 1 -> 1 `BackendTarget`
- `Backend` 1 -> 1 `Spec`
- `Spec` 1 -> many `SpecSection`
- `SpecSection` 1 -> many `SectionItem`
- `SpecSection` many -> many `SpecSection` through `SectionDependency`
- `SpecSection` 1 -> many `DiagramElement`
- `SpecSection` 1 -> many `Task` (optional link)
- `Backend` 1 -> many `GenerationSnapshot`
- `GenerationSnapshot` 1 -> many `Note`
- `GenerationSnapshot` 1 -> many `ValidationResult`

## 5. Audit Requirements

The following entities should be audited and soft deletable:

- `Backend`
- `Assignment`
- `Team`
- `Spec`
- `SpecSection`
- `SectionItem`
- `SectionDependency`
- `DiagramElement`
- `Task`
- `GenerationSnapshot`
- `ValidationResult`

## 6. Open Decisions To Finalize

- whether `BackendTarget` should be a separate entity or collapsed into `Backend`
- whether `Task` approval should be modeled directly on the task or through review notes
