[![Link to GitHub](https://github.com/EmmanuelSWE/SeeSpecProject)](https://github.com/EmmanuelSWE/SeeSpecProject)

# SeeSpec

## What is SeeSpec?

SeeSpec is a visual spec-driven development platform that turns UML diagrams into a living specification and uses that specification to generate production-ready backend scaffolding.

## Why Choose SeeSpec?

- Uses diagrams as the single source of truth for design and implementation.
- Reduces specification drift between documentation and code.
- Supports structured, incremental code generation for ABP-based projects.
- Helps teams keep project structure and coding standards consistent.

# Documentation

## Software Requirement Specification

### Overview

SeeSpec is a visual development platform for designing systems through UML diagrams and transforming those diagrams into structured specifications and code scaffolding. The platform focuses on ABP Framework projects and aims to close the gap between design, documentation, and implementation.

### Components and Functional Requirement

**1. User and Tenant Management**
  * Users are able to log in.
  * Users are able to work within a tenant-based backend project.
  * Users are able to manage backend projects and specifications.

**2. Specification and Diagram Management**
  * Users are able to define systems visually using UML-style diagrams.
  * Users are able to maintain specification sections and ordered section items.
  * Users are able to sync diagram changes back into the structured specification.

**3. Code Generation and Validation**
  * Generates backend scaffolding from the specification.
  * Supports dependency-aware incremental generation.
  * Validates generated code against project structure using AST-based comparison.

**4. Project Scanning**
  * Scans existing ABP projects.
  * Classifies entities, services, DTOs, and related code structures.
  * Builds an initial specification from the scanned codebase.

# Design

## [MOCK UP](https://www.figma.com/design/yb7lujz1WtA1I6GjscwVcy/See-Spec?node-id=9-1522&m=dev&t=qrQNPmzXFxo3CJQm-1)


## [DOMAIN MODEL]('./DomainModel.xml')
# Running Application

## FRONTEND

- Next.js frontend:
### [nextjs folder](https://github.com/EmmanuelSWE/SeeSpecProject/tree/main/nextjs)


## BACKEND

- ASP.NET Core backend:
### [aspnet-core folder](https://github.com/EmmanuelSWE/SeeSpecProject/tree/main/aspnet-core)

## Development

- Must have git installed.
- For the Next.js frontend, install Node.js and npm.
- For the backend, use the .NET SDK and the required database setup.

1. Go to GitHub repo:
### [link to repo](https://github.com/EmmanuelSWE/SeeSpecProject)

2. Clone the repository:

```bash
git clone https://github.com/EmmanuelSWE/SeeSpecProject.git
```

3. Run the frontend:

```bash
cd nextjs
npm install
npm run dev
```

4. Run the backend from the ASP.NET Core project using your usual .NET workflow.
