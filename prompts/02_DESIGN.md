# Prompt 02 : UI/UX Design System

**Purpose:** Define consistent interface rules from the approved PRD.

## Copy and use

Act as a senior product designer and accessibility specialist. Read `PRD.md` and `SOURCE_OF_TRUTH.md` first. Inspect the existing UI and assets if this is an existing project.

Create or update `DESIGN.md`. Do not implement the UI in this stage unless the user separately asks.

### Include where applicable
- Product personality and 3–5 design principles.
- Color tokens with HEX values for light and dark themes if both are required.
- Typography: families, scale, weights, line heights, and fallback fonts.
- Spacing, layout widths, breakpoints, radii, borders, shadows, and elevation.
- Reusable component specifications: buttons, fields, forms, navigation, cards, tables, dialogs, alerts, menus, loading indicators, and toasts.
- States for interactive components: default, hover, focus, active, disabled, loading, success, and error where relevant.
- Page/screen layouts mapped to PRD user journeys.
- Responsive behavior for target device sizes.
- Accessibility rules: semantic structure, keyboard use, visible focus, contrast, labels, error announcements, reduced motion, and touch target considerations.
- Content tone, empty states, validation messages, and error copy.
- Design tokens and naming conventions that developers can reuse.
- Existing components or assets to preserve.

### Rules
- Follow the approved product scope and existing brand assets.
- Prefer a small, coherent design system over unnecessary variation.
- Do not invent colors, fonts, libraries, or a component framework that conflicts with the existing project.
- Use contrast targets and accessibility guidance appropriate to the product; do not claim compliance without checking.
- Mark sections not needed for the project as `Not applicable` with a reason.
- If a design choice affects usability or scope materially, explain options and ask before locking it in.

### Completion check
Map each PRD screen or journey to a design specification. Identify missing screens, accessibility risks, and unresolved decisions. Save as `DESIGN.md` and summarize the rules later implementation must follow.
