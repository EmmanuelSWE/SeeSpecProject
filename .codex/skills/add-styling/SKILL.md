---
name: add-styling
description: Use this skill when styling any page, component, or layout in the Mosaic-Talent frontend. Covers the mandatory antd-style createStyles pattern, design token usage, and the styles folder structure that every route must follow.
---

# Mosaic-Talent - Styling with antd-style

## Core Rule

Every page route MUST keep styles colocated with the route file. Preferred structure is:

```text
app/<route-segment>/
|- page.tsx
`- style.ts
```

For root routes, use a route group so colocation still applies:

```text
app/(landing)/
|- page.tsx
`- style.ts
```

Styles are never written inline (except trivial one-liners) and never in CSS modules.

## Responsive-First Rule (MANDATORY)

Every frontend page/component must be mobile responsive from the first implementation.

- Build for phone first, then scale up with media queries.
- Minimum widths to verify: `360px`, `768px`, and desktop (`>=1280px`).
- No horizontal overflow at mobile widths.
- Primary actions must remain visible and usable on mobile.
- Dense horizontal rows (nav/action bars/form rows) must wrap or stack on mobile.
- Keep responsive behavior in `style.ts` via `createStyles`, not inline JSX styles.

## createStyles Pattern (CANONICAL)

```typescript
import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  pageContainer: css`
    padding: ${token.paddingLG}px;
    background: ${token.colorBgLayout};
    min-height: 100vh;
  `,

  headerRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${token.marginLG}px;

    @media (max-width: 767px) {
      flex-direction: column;
      align-items: stretch;
      gap: ${token.marginSM}px;
    }
  `,
}));
```

## Rules

- Colors: use `token.*`, never hardcoded hex values.
- Spacing: use token spacing values, never hardcoded pixel strings.
- Radius/shadow/typography: use token values.
- Inline styles: avoid; move to `style.ts`.
- Tailwind classes: do not use.

## Page Component Structure (MANDATORY)

- Always use arrow functions for page and component declarations.
- In page/components, keep this order:
1. state declarations (`useState`, local state vars)
2. hooks (`useStyles`, providers/contexts, effects/memos/callbacks)
3. computed values derived from state/hooks
4. returned JSX

## Component Styling (Non-Page)

For non-page components, colocate a `styles.ts` next to the component:

```text
components/<feature>/
|- MyComponent.tsx
`- styles.ts
```

## Responsive Checklist (Before Handoff)

1. Confirm no horizontal scrolling at `360px`.
2. Confirm typography and spacing are readable on mobile.
3. Confirm forms/cards use mobile-safe padding.
4. Confirm action groups stack or wrap on mobile.
5. Confirm tablet/desktop layouts expand cleanly.

## Preferred Antd Components

- Forms: `Form`, `Form.Item`, `Input`, `Select`, `InputNumber`
- Layout: `Layout`, `Card`, `Tabs`, `Grid`
- Feedback: `message`, `notification`, `Alert`, `Spin`, `Skeleton`
- Data display: `Table`, `Tag`, `Statistic`, `Empty`
