---
name: surgical-modification
description: Use this skill when fixing bugs or adding features to ensure minimal, safe, and non-destructive changes.
---

# SpecFlow — Surgical Modification Skill

## Overview
All fixes and feature additions must follow a strict surgical modification approach.

Fix only what is broken.
Change only what is required.
Preserve everything else.

## Core Rules

### Modification Scope
- Only modify the failing component
- Do not touch unrelated services or components

### Read Before Write
- Read full file before editing
- Understand dependencies

### Minimal Change
- Small targeted fixes only
- No unnecessary rewrites

### Add vs Modify
- Extend if correct
- Fix only wrong parts
- Ask before refactoring

### Isolation
- Prefer helper functions
- Avoid deep intrusive edits

### Do Not Touch
- Working features
- Unrelated logic
- Layout/styling not tied to issue

### Dependency Safety
- Check all dependents
- Avoid breaking changes

### Frontend Safety
- Preserve layout
- Fix only behavior/state

### Backend Safety
- Respect service architecture
- No layer violations

### Regression Prevention
- Verify all flows still work
- Validate DTO/API compatibility

### Diff Awareness
- Keep changes minimal and explainable

### Stop & Ask Conditions
- Large changes required
- Unclear behavior
- Multiple valid approaches

### Validation
- Root cause fixed
- No extra changes
- Project compiles

## Final Principle
Be precise, not clever.
Be minimal, not broad.
Be safe, not fast.
