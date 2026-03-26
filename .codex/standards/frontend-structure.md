# Frontend Standards

## Core Principles
- Write clean, readable, modular code.
- Prefer simplicity, clarity, and maintainability over cleverness.
- Use **Ant Design** for UI.
- **Do not use Tailwind**.
- **Do not use inline styles**.
- Keep presentation, logic, and data flow clearly separated.

## Naming
- Use **PascalCase** for classes, components, enums, and file names that match exported classes/components.
- Use **CamelCase** for variables, functions, methods, properties, and enum members where applicable.
- Prefix interfaces with **I** and use PascalCase, for example `IUserProfile`.
- Private class variables must start with an underscore, for example `_userName`.
- Constants must use **ALL_CAPS**.
- Do not use abbreviations in names.
- Use only alphanumeric characters in names, plus `_` for private class-scope variables.

## Files and Structure
- File names should match the main class, component, or function inside the file.
- Keep files focused and small.
- Organize code into clear modules by feature or responsibility.
- Reusable UI should be extracted into shared components.
- Shared logic should be extracted into hooks, services, or utilities.
- Respect architecture boundaries and avoid dumping logic into components.

## Styling
- Use **Ant Design** components and patterns as the default UI approach.
- Use stylesheet files, CSS modules, scoped styles, or approved theme/config patterns.
- **No inline styling**.
- Keep styling reusable, consistent, and easy to override.
- Prefer theme tokens and shared design values over hardcoded values.

## Comments and Documentation
- Document all non-obvious classes, interfaces, public methods, and exported functions.
- Add comments before non-obvious logic or assumptions.
- Use `// ` comments for inline notes, starting with a lower-case sentence.
- Use proper `/** */` documentation blocks for public APIs and interfaces.
- Do not add unnecessary comments for obvious code.

## TypeScript Rules
- All parameters must declare types.
- All functions and methods must declare return types.
- `any` is not allowed unless clearly justified and documented.
- Declare variables before use.
- Avoid global variables and global functions.
- Prefer interfaces and typed models for contracts.
- Use enums only when they add clarity.

## Functions and Methods
- Use CamelCase names.
- Keep functions short and focused.
- Use guard clauses and early returns to reduce nesting.
- Avoid excessive nesting; refactor when logic becomes hard to follow.
- Declare helper functions clearly and keep related functions close together.
- All single-line control blocks must still use curly braces.

## Classes
- Class names must use PascalCase and be documented.
- Keep member order logical:
  1. constants
  2. private variables
  3. public variables
  4. constructor
  5. public methods
  6. private methods
- Use `#region` blocks only when they genuinely improve navigation in longer files.

## Interfaces and Enums
- Interfaces must be documented and use the `I` prefix.
- Interface members should be documented when not self-explanatory.
- Enums should be documented and use explicit numeric values where needed.
- Prefer simple typed objects over enums when an enum adds no real value.

## Formatting
- Use **4 spaces** for indentation. No tabs.
- Maximum line length: **200 characters**.
- No consecutive blank lines.
- No empty blocks. If a block is intentionally empty, add a `// todo: ...` comment.
- Opening curly braces must be on the same line.
- No spaces after closing curly braces or semicolons.
- Use only **double quotes** for strings.
- All simple statements must end with a semicolon.

## JavaScript / TypeScript Safety Rules
- All comparisons must use `===` and `!==`.
- `eval` is not allowed.
- Do not use string-based property access unless absolutely necessary.
- No switch fall-through.
- No unreachable code.
- No unused variables, functions, or expressions.
- Avoid `continue` where it hurts readability.
- Do not use `with`.
- Avoid assignments inside conditions.
- Avoid confusing expressions and overly compact logic.

## Component Design
- Components should be presentational where possible.
- Move business logic, data transformation, and API handling out of UI components.
- Prefer composition over large monolithic components.
- Keep props typed and minimal.
- Avoid deeply nested JSX by extracting subcomponents.

## State and Data Flow
- Keep state close to where it is used.
- Lift state only when necessary.
- Avoid duplicated state.
- Centralize API calls and shared transformation logic.
- Make data flow predictable and easy to trace.

## Reuse and Maintainability
- Follow **DRY**: extract repeated logic into reusable utilities, hooks, or components.
- Follow **KISS**: prefer simple, direct solutions.
- Remove dead code promptly.
- Format code before committing.
- Write code that another developer can understand quickly.

## Final Checklist
Before committing, confirm that:
- Ant Design is used consistently
- Tailwind is not used
- inline styles are not used
- code is modular and clean
- names are clear and consistent
- comments exist where needed
- all types and return types are declared
- no `any`, `eval`, unused code, or unreachable code remains
- formatting rules are followed
- logic is not overly nested
- repeated code has been extracted
