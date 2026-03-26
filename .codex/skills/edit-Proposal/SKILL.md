---
name: update-seespec-specification
description: Edit or regenerate the SeeSpec product specification document to incorporate role-based access, collaboration models, assignments, tasks, completion notes, and UI design intent, while preserving the original structure and tone.
---

## When to use this skill

Use this skill whenever the user asks to:

- Add or update **roles and permissions** in the SeeSpec specification
- Introduce **user collaboration concepts** (projects, assignments, tasks, notes)
- Align the document with **multi-tenant ABP architecture**
- Rename or rebrand the product to **SeeSpec**
- Insert **UI design intent** (dark, artistic workspace)
- Produce a **new version** of the specification that consolidates all of the above

The input may be:
- An existing `.docx` specification (to be edited)
- Instructions to regenerate the document from scratch with the new requirements applied

---

## Core editing rules (MANDATORY)

When this skill is invoked, Codex must follow these rules strictly:

1. **Preserve document integrity**
   - Keep the original structure, numbering, tone, and intent
   - Do not rewrite sections unnecessarily
   - Only modify or extend sections relevant to the requested changes

2. **Product naming**
   - The product name must be **SeeSpec**
   - Replace all previous names consistently
   - Titles, headers, and footers must reflect the new name

3. **No fictional scope**
   - Only introduce concepts explicitly requested by the user
   - Avoid speculative features, pricing, or roadmap items unless already present

4. **Specification-first language**
   - Use clear, technical, design-oriented language
   - Avoid marketing language or vague descriptions
   - Favor structured bullet points, tables, and entity descriptions

---

## Required content to insert or update

When updating or regenerating the document, Codex **must include all of the following**.

---

### 1. Roles and responsibilities section

Add or update a section describing the **role model** with clear authority boundaries.

The document must include:

#### Platform-level role
- **Host Admin**
  - Global access across all tenants
  - Only role that can remove users globally
  - Can manage tenants and assign Tenant Admins

#### Tenant-level role
- **Tenant Admin**
  - Full control within a tenant
  - Manages users, projects, and role assignments
  - Cannot access other tenants

#### Project-level roles
- **Project Lead**
  - Owns a project
  - Assigns users to projects
  - Assigns tasks and reviews completion
- **Business Analyst**
  - Defines business and functional requirements
  - Edits requirement-related specification sections only
- **Systems Architect**
  - Designs system structure and diagrams
  - Owns domain and architecture artifacts

Users must be described as capable of:
- Holding multiple roles
- Working across multiple projects

---

### 2. User, project, and assignment model

Extend the domain model to include collaboration entities.

The document must describe the following entities and relationships:

- **User**
  - Platform identity (extends ABP IdentityUser)
- **Project**
  - A collaborative workspace owned by a tenant
- **Assignment**
  - A bridge entity linking a user to a project with a role
- **Task**
  - Unit of work within a project
- **CompletionNote**
  - Commentary attached to completed tasks or generation snapshots

It must be explicit that:
- Users ↔ Projects is a many-to-many relationship via Assignments
- Roles may differ per project
- Completion notes create traceability between work and spec evolution

---

### 3. Integration with existing spec concepts

The updated document must clearly connect new collaboration concepts to existing ones:

- **GenerationSnapshot**
  - May have associated CompletionNotes
- **Spec**
  - Owned by a project
- **SpecSection**
  - May be edited based on role permissions

No existing core entities may be removed or invalidated.

---

### 4. UI design intent (single-page focus)

Insert a concise section describing the **primary SeeSpec workspace UI**.

The description must include:

- A **dark, artistic theme**
- A **role-aware workspace**
- A single primary page containing:
  - Project overview
  - Navigation (requirements, domain, tasks, snapshots)
  - Central diagram/spec canvas
  - Activity feed or completion notes

This section must communicate design **intent**, not implementation details.

---

## Output expectations

When this skill completes, Codex must produce **one of the following**, depending on what is feasible:

1. **Edited document content**
   - Clearly indicating what sections were modified or added
   - Ready to be pasted back into the original `.docx`

OR

2. **A regenerated specification**
   - Fully updated
   - Incorporating all requested roles and collaboration features
   - Consistent with the original proposal style

The result must be suitable for:
- Sharing with technical stakeholders
- Acting as a source-of-truth specification
- Future iteration without structural rewrites

---

## Non-goals (explicitly forbidden)

- Do not generate frontend or backend code
- Do not introduce pricing, monetization, or sales language
- Do not redesign unrelated sections
- Do not remove existing architectural concepts

This skill exists solely to maintain **specification coherence** as the system evolves.