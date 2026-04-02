---
name: follow-git-workflow
description: Use this skill before starting ANY feature or fix. Covers issue-first workflow with repository issue templates, branch naming, commit message conventions, the mandatory planning step, and the push workflow. The agent must always show a plan, create a template-based issue, and create a branch before writing code.
---

# Mosaic-Talent — Git Workflow

## The Rule

**No code is written without a tracked issue and branch. No branch is pushed without tests.**
**No implementation starts until the user explicitly approves the plan.**
**Never run migration commands; always ask the user to run migrations manually.**

Every piece of work — no matter how small — follows this sequence:

```
1. Show plan
2. Create issue
3. Create branch
4. Write code, make sure to keep it under 300 lines or split into multiple files. If code exceeds 300 lines, refactor into multiple files until each file is under 300 lines.
5. Always call apis through provider actions, never directly from components. If API logic is needed in a component, add it to the relevant provider or create a new provider if necessary.
6. Install any new dependencies (if needed)
7. Write tests
8. Run tests and confirm all pass
9. If code changed, or folder structure changed, or new files added, update relevant tests to cover those changes
10. Update the ReadMe if necessary (e.g. new dependencies, new scripts, new environment variables)
11. Update any skills if necessary (e.g. new dependencies -> update setup-project skill)
12. Ask the user to test the implemented functionality and wait for explicit confirmation
13. Commit
14. Push
15. Open PR to `dev` and link issue (`Closes #<issue-number>`)
```

---

## Branch Naming

```bash
# New features
git checkout -b feature/<descriptive-name>

# Bug fixes
git checkout -b fix/<descriptive-name>

# Refactoring
git checkout -b refactor/<descriptive-name>

# Chores (deps, config, tooling)
git checkout -b chore/<descriptive-name>
```

### Examples

```bash
feature/auth-provider
feature/employee-table
feature/leave-approval-modal
feature/department-crud
fix/axios-401-interceptor
fix/leave-form-validation
refactor/extract-status-badge
chore/install-antd-style
```

---

## Starting a Branch

Always branch from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/<name>
```

## Reason for branching from `dev` instead of `main`: `dev` is the integration branch where all features are merged and tested together before going to `main`. This helps catch integration issues early and keeps `main` stable.

## Commit Message Format

```
<type>: <short description>
```

| Type       | When to use                      |
| ---------- | -------------------------------- |
| `feat`     | New feature or provider          |
| `fix`      | Bug fix                          |
| `refactor` | Code change, no behaviour change |
| `style`    | Styling only                     |
| `chore`    | Deps, config, tooling            |
| `docs`     | README, comments                 |
| `test`     | Adding or updating tests         |

### Examples

```bash
git commit -m "feat: add employee provider with CRUD actions"
git commit -m "feat: add leave approval modal with manager comment"
git commit -m "fix: correct ABP result unwrapping in department provider"
git commit -m "fix: redirect to login on 401 response"
git commit -m "style: add styles folder for employees page"
git commit -m "chore: install js-cookie and antd-style"
git commit -m "test: add unit tests for employee provider actions"
```

---

## Mandatory Testing Step (Before Push)

**No push is allowed until tests are written and passing for everything implemented.**

Before pushing, the agent MUST:

1. **Identify what was implemented** — every new function, hook, provider action, component, or utility.
2. **Write a corresponding test** for each unit of work:
   - Provider actions → test each action (success + error cases)
   - Utility functions → test all branches and edge cases
   - Components → test render output and key interactions
   - API calls → mock the request and assert the response is handled correctly
3. **Run the test suite** and confirm all tests pass:

```bash
   npm test --watchAll=false
```

4. **For frontend feature/page changes, run Playwright E2E tests unless the user explicitly asks to skip them**:

```bash
   npm run test:e2e
```

If Playwright tests do not exist for the changed frontend flow, create them before commit/push.

When skipped by explicit user request, record that exception in the final handoff and PR.

5. **Only proceed to commit and push if all executed tests pass.** If tests fail, fix the code or the test before continuing.

### Test File Naming Convention

```
src/providers/employee-provider/__tests__/actions.test.ts
src/providers/employee-provider/__tests__/reducer.test.ts
src/components/leave-approval-modal/__tests__/LeaveApprovalModal.test.tsx
src/utils/__tests__/formatLeaveDate.test.ts
```

### Minimum Test Coverage Per Type

| What was built         | Minimum tests required                   |
| ---------------------- | ---------------------------------------- |
| Provider action        | Happy path + API error case              |
| Reducer                | Each action type it handles              |
| Utility function       | All branches + one edge case             |
| UI Component           | Renders correctly + key user interaction |
| Auth/interceptor logic | Token present + token missing cases      |

---

## Push

Only after all tests are written and passing, and after the user confirms functional testing:

```bash
git push origin feature/<name>
```

---

## Issue First (Mandatory)

Before creating the branch, create a GitHub issue that documents:

- Problem summary
- Current behavior
- Expected behavior
- Planned scope

Use the issue number in branch and PR context where possible.

---

## Issue Template Rules (Mandatory)

- Always use `.github/ISSUE_TEMPLATE/bug_report.md` for bug fixes.
- Always use `.github/ISSUE_TEMPLATE/feature_request.md` for feature/chore/refactor work.
- Issue body must follow the selected template sections.

Preferred command:

```bash
gh issue create --template bug_report.md --title "<title>"
gh issue create --template feature_request.md --title "<title>"
```

If running non-interactively and `gh` cannot combine `--template` with `--body`, create the issue with `--body` but keep the body section structure identical to the selected template.

---

## Pull Request Rules

- Open pull requests against `dev` (not `main`).
- Link the issue in the PR body using `Closes #<issue-number>` or `Fixes #<issue-number>`.
- Include test evidence in the PR body.
- Before commit/push/PR, ask the user to test the implemented functionality and wait for explicit confirmation.

---

## React Effect Convention

- When a function is called inside a `useEffect`, do not include that function in the effect dependency array.

---

## Mandatory Planning Step

Before writing a single line of code, the agent MUST output a plan in this exact format:

```
## Plan: <feature name>

**Branch:** feature/<name>

**Skills to read:**
- Mosaic-Talent-api (if making API calls)
- Mosaic-Talent-provider-pattern (if building a provider)
- Mosaic-Talent-styling (if building a page/component)
- Mosaic-Talent-auth-provider (if touching auth)

**Steps:**
1. Install dependencies (if any): <list packages>
2. Create files:
   - src/providers/employee-provider/context.tsx
   - src/providers/employee-provider/actions.tsx
   - src/providers/employee-provider/reducer.tsx
   - src/providers/employee-provider/index.tsx
3. Modify files:
   - src/providers/index.tsx (add EmployeeProvider)
4. Write tests:
   - src/providers/employee-provider/__tests__/actions.test.ts
   - src/providers/employee-provider/__tests__/reducer.test.ts
5. Test: visit /employees and verify table loads

**ABP endpoints used:**
- GET /api/services/app/Employee/GetAll
- POST /api/services/app/Employee/Create
- PUT /api/services/app/Employee/Update
- DELETE /api/services/app/Employee/Delete

**Potential issues:**
- Employee IDs are UUIDs (string), not numbers
- Department must be loaded first (departmentId FK)
```

Only after the plan is shown and explicitly confirmed by the user should the agent proceed.

---

## Full Workflow Example

```bash
# 1. Start clean
git checkout main
git pull origin main

# 2. Create branch
git checkout -b feature/employee-provider

# 3. ... write code ...

# 4. Write tests for everything implemented
#    - src/providers/employee-provider/__tests__/actions.test.ts
#    - src/providers/employee-provider/__tests__/reducer.test.ts

# 5. Run tests — do NOT continue until all pass
npm test --watchAll=false

# 6. Commit (include tests in the same commit or as a follow-up test commit)
git add .
git commit -m "feat: add employee provider with full CRUD"
git commit -m "test: add unit tests for employee provider"

# 7. Push — only after green tests
git push origin feature/employee-provider
```

