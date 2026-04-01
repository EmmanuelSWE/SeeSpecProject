# Diagram & Visualization Template

## Inheritance

This template inherits all rules from the Generic Backend Architecture & Standards Template.

---

## Purpose

This template defines how graphs, PlantUML, and SVG visual outputs are generated as projections of canonical backend state in any project that adopts this structure.

---

## Detailed Goals

A compliant visualization layer should:

- read canonical persisted content first
- reject projection when prerequisites are missing
- keep graph generation deterministic
- keep PlantUML generation render-only
- keep SVG read-only
- preserve ownership back to canonical spec structures

---

## Projection Rule

Diagrams are projections only.

Rules:

- no diagram is authoritative
- no SVG is authoritative
- no renderer output may be parsed back as truth unless deliberately re-normalized through a canonical write path

---

## Canonical Ownership Rule

Every diagram must be traceable to canonical spec content.

Preferred ownership path in this template style:

- `Spec`
- `SpecSection`
- `SectionItem`
- diagram metadata/content

Rules:

- no orphan diagrams
- no diagram created without a parent canonical section
- no hidden ownership in UI state only

---

## Graph Input Rule

Graphs must be built from canonical persisted structures only.

Rules:

- graph nodes must map back to canonical content
- graph edges must map back to canonical dependencies or canonical diagram content
- graph factory must not accept raw scanner output as direct authority

Restrictions:

- no graph generation before spec bootstrap
- no graph generation when dependencies are invalid

---

## PlantUML Rule

PlantUML generation is pure projection.

Rules:

- PlantUML receives already validated graph input
- PlantUML generator performs no semantic inference
- PlantUML text is deterministic for the same graph

Restrictions:

- no business validation inside renderer
- no renderer-invented nodes
- no renderer-invented edges

---

## SVG Rule

SVG is a read-only visual artifact.

Rules:

- SVG is not canonical state
- SVG may be cached
- cache is not authority

If PlantUML execution fails:

- return a fallback visual only if the backend standard already supports it
- do not mark fallback output authoritative

---

## Diagram Type Rules

### Domain model diagrams

Must reflect:

- validated domain structure
- legal relationships only
- domain-relevant nodes only

### Use case diagrams

Must reflect:

- validated requirement/use-case canonical content
- actor mapping
- explicit use-case ownership

### Activity diagrams

Must reflect:

- an existing use case
- explicit link metadata back to the use case
- canonical parent section ownership

Restrictions:

- no activity diagram before use case exists
- no use case diagram before prerequisite spec state exists

---

## Renderer Configuration Example

If external PlantUML rendering is used, prefer explicit environment configuration:

```text
PLANTUML_JAR_PATH=C:\tools\plantuml.jar
```

Service behavior should:

- try configured renderer first
- fail clearly if renderer is unavailable
- optionally return fallback SVG if that is already part of the standard

---

## Review Checklist

Confirm:

- diagrams are projections only
- graph builds from canonical state
- PlantUML is render-only
- SVG is read-only
- ownership is explicit
- no orphan or premature diagrams exist

---

## One-Line Principle

Generate graphs, PlantUML, and SVG only as deterministic projections of validated canonical spec content.
