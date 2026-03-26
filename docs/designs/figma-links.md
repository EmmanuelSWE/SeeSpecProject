# Figma Sources

## Source of Truth Rules
- Figma is the source of truth for layout and spacing.
- SVG exports are the source of truth for static vector assets. export into ./svgs folder
- If Figma and SVG conflict:
  - layout, spacing, typography -> Figma wins
  - icon/vector path details -> SVG wins
- Any conflict must be resolved before implementation if it changes behavior.

## Files
### Project Workspace
- Link: https://www.figma.com/design/yb7lujz1WtA1I6GjscwVcy/See-Spec?node-id=9-1522&m=dev&t=ZoPOkuBE1qpq55Ts-1
- Frames:
  - Requirements Light and Dark
  - Dashboard Light and Dark
  - Task Assignment Light and Dark
  - Users Light and Dark

### Spec Workspace
- Link: https://www.figma.com/design/yb7lujz1WtA1I6GjscwVcy/See-Spec?node-id=9-1522&m=dev&t=ZoPOkuBE1qpq55Ts-1
- Frames:
  - use case Diagram Light and Dark
  - Domain model Light and Dark
  - Activity diagram Light and Dark
  - Requirements Light and Dark

  ### User Screens
- Link: https://www.figma.com/design/yb7lujz1WtA1I6GjscwVcy/See-Spec?node-id=9-1522&m=dev&t=ZoPOkuBE1qpq55Ts-1
- Frames:
  - settings Diagram Light and Dark
  - Tenants model Light and Dark

### Auth Screens
- Link: https://www.figma.com/design/yb7lujz1WtA1I6GjscwVcy/See-Spec?node-id=9-1522&m=dev&t=ZoPOkuBE1qpq55Ts-1
- Frames:
  - Login

## Export Rules
- export SVGs at 1x
- keep naming consistent
- do not hand-edit generated SVGs without noting it

## Notes
- specify if designs are draft/final
- specify if a frame is deprecated
