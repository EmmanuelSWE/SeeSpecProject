---
name: readme-generator
description: Use this skill when generating a README.md for any project. The agent must explore the entire folder structure, read key files (package.json, .csproj, swagger, env examples), and produce a comprehensive, professional README similar to enterprise project documentation. Always includes Figma design link, tech stack, folder structure, features, API reference, roles, and getting started guide.
---

# README Generator Skill

## Overview

When asked to generate a README, the agent must **never guess** — it must explore the project first, then write based on what actually exists.

---

## Step 1 — Explore the Project (MANDATORY before writing anything)

Run ALL of these before writing a single line of the README:

```bash
# 1. Full folder structure
find . -type f -not -path "*/node_modules/*" \
       -not -path "*/.git/*" \
       -not -path "*/bin/*" \
       -not -path "*/obj/*" \
       -not -path "*/.next/*" \
       | sort

# 2. Package info (Next.js / Node projects)
cat package.json

# 3. .NET project info
find . -name "*.csproj" | xargs cat

# 4. Environment variables
cat .env.example 2>/dev/null || cat .env.local.example 2>/dev/null || echo "No env example found"

# 5. Swagger/API spec if exists
find . -name "swagger.json" -o -name "swagger.yaml" | head -5

# 6. Existing appsettings
find . -name "appsettings.json" | xargs cat 2>/dev/null

# 7. Providers / feature folders
ls src/providers 2>/dev/null || ls providers 2>/dev/null

# 8. App routes
find . -path "*/app/*" -name "page.tsx" | sort
```

Only after running all of these should the agent begin writing.

---

## Step 2 — Ask for Missing Info

Before writing, the agent must ask the user for anything it can't discover from files:

```
Things to ask:
1. Figma design link (always required)
2. Project description / purpose (if not obvious)
3. Live demo URL (if deployed)
4. Test credentials (if auth exists)
5. Any features not yet built but planned
```

---

## Step 3 — README Structure (ALWAYS follow this order)

```markdown
# {Project Name}

{One sentence description}

## Overview

{2-3 paragraph description of what the system does, who uses it, and why it exists}

## Design

| Resource     | Link                        |
| ------------ | --------------------------- |
| Figma Design | [View Designs]({figma_url}) |
| Live Demo    | [{url}]({url})              | ← only if deployed |

## Tech Stack

| Tool   | Purpose        |
| ------ | -------------- |
| {tool} | {what it does} |
...

## Roles

{Table of roles and permissions — only if auth/roles exist}

| Feature   | Role A | Role B |
| --------- | :----: | :----: |
| {feature} |   ✅    |   ❌    |

## Features

### {Feature Group}
- {bullet point describing feature}
- {bullet point}

### {Feature Group}
...

## Project Structure

{Actual folder tree discovered from the filesystem — never make this up}

\`\`\`
src/
├── app/
│   ├── (auth)/
...
\`\`\`

## API Integration

**Base URL**: \`{url}\`

{Only if swagger or API calls found in codebase}

| Module | Base Path     |
| ------ | ------------- |
| Auth   | \`/api/auth\` |
...

## State Management

{Only if providers/context found — describe the pattern}

## Getting Started

### Prerequisites

- {list actual requirements found in package.json / .csproj}

### Installation

\`\`\`bash
# 1. Clone
git clone <repository-url>
cd {project-name}

# 2. Install
npm install   # or dotnet restore

# 3. Environment variables
cp .env.example .env.local
# Fill in values:
# NEXT_PUBLIC_API_URL=...
\`\`\`

### Environment Variables

| Variable                     | Description          |     Required      |
| ---------------------------- | -------------------- | :---------------: |
| \`NEXT_PUBLIC_API_URL\`      | Backend API base URL |         ✅         |
| \`NEXT_PUBLIC_GROQ_API_KEY\` | AI key               | ⚠️ only if AI used |

### Running Locally

\`\`\`bash
npm run dev        # Next.js
# or
dotnet run         # .NET
\`\`\`

### Test Credentials

\`\`\`
{role}:    {email}
Password:  {password}
\`\`\`

{Only include if test credentials exist}

## Building for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## License

MIT
```

---

## Rules

### Always include
- Figma link (ask user if not found)
- Actual folder structure from filesystem scan
- Tech stack from `package.json` / `.csproj` — never guess versions
- Roles table if auth exists
- Environment variables table
- Real API endpoints if swagger/axios calls found

### Never do
- Never invent folder structure — always scan first
- Never hardcode version numbers without checking `package.json`
- Never include a feature that doesn't exist in the codebase
- Never skip the Figma link — if user doesn't provide it, leave a placeholder: `[View Designs](#)` and note it needs updating
- Never write a generic README — every section must reflect the actual project

### Tone
- Professional and enterprise-grade
- Clear and scannable — use tables over paragraphs where possible
- Written for a developer onboarding to the project, not for a general audience

---

## Example Figma Section

```markdown
## Design

| Resource      | Link                                                            |
| ------------- | --------------------------------------------------------------- |
| Figma Designs | [View Designs](https://www.figma.com/file/xxxxx/ProjectName)    |
| Prototype     | [View Prototype](https://www.figma.com/proto/xxxxx/ProjectName) |
| Live Demo     | [egovleave.onrender.com](https://egovleave.onrender.com)        |
```

---

## Output

The agent must:
1. Write the README to `README.md` in the project root
2. Show a preview in the response
3. Confirm what sections were auto-discovered vs manually filled
4. 