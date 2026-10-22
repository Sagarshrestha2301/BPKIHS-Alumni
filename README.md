# BPKIHS Alumni Association Website (Frontend)

Lifelong alumni platform for the B.P. Koirala Institute of Health Sciences (BPKIHS), Dharan, Nepal.
**Frontend only.** No backend yet: all data comes from mock data behind a typed API layer, so a real
backend can be connected later without rewriting the UI.

Project documents live in [`docs/`](./docs):

- [`CONTEXT.md`](./docs/CONTEXT.md): decisions, architecture, routes, data types, session log
- [`ROADMAP.md`](./docs/ROADMAP.md): phases and checklists
- [`DESIGN.md`](./docs/DESIGN.md): design system and per-page specs

## Requirements

- Node.js 20.9 or newer (22 LTS recommended)
- npm
- git

## Getting started (Windows PowerShell)

```powershell
cd C:\dev\bpkihs-alumni
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command                | What it does                   |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Start the dev server           |
| `npm run build`        | Production build               |
| `npm run start`        | Run the production build       |
| `npm run lint`         | ESLint                         |
| `npm run typecheck`    | TypeScript check (no output)   |
| `npm run format`       | Format all files with Prettier |
| `npm run format:check` | Check formatting only          |
| `npm run test`         | Unit tests (Vitest)            |
| `npm run test:e2e`     | Browser tests (Playwright)     |
| `npm run ci`           | All checks before a milestone  |

Before every commit, all four must pass: `format`, `typecheck`, `lint`, `build`. Run
`npm run test` as well when the change touches data, validation or a form.

## Tech stack

Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui (Base UI, Nova
preset), Zod, Vitest, Playwright, Prettier. Fonts: Inter, Source Serif 4, Noto Sans Devanagari.

## Environment variables

| Variable               | Purpose                                  | Default                 |
| ---------------------- | ---------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_MODE` | `mock` now; `http` once a backend exists | `mock`                  |
| `NEXT_PUBLIC_SITE_URL` | Base URL for metadata and Open Graph     | `http://localhost:3000` |

`.env.local` is private and not committed. `.env.example` is committed.

## Folder structure

```
src/
  app/            routes and layouts (Next.js App Router)
  components/
    ui/           shadcn/ui primitives
    layout/       header, footer, mobile nav
    shared/       reusable blocks (stat card, section heading, ...)
  features/       one folder per area: directory, donations, events,
                  community, governance, register, support, auth, legal, home
  lib/
    api/          typed API client; mock/ now, http/ later
    constants/ format/ utils.ts
  content/        static typed copy (about text, FAQ, legal)
  styles/         tokens.css (brand colours live here)
  types/
docs/             project documents
```

## Current status

The public site is built on mock data:

- Home; About, Board and How We Work
- Directory, filters and public profiles
- Registration (three steps, pending-approval result)
- Donations: goals, checkout, thank-you, transparency, tribute
- Events: listing, detail, RSVP, past gallery
- Community: feed, posting, reporting, newsletter
- Support, FAQ and the three legal pages

Not built yet: the mock admin dashboard (Phase 9), the real backend, real payments, email
receipts and automated newsletters. Payment screens are clearly marked "Demo only". See
`docs/ROADMAP.md` for the current phase and `docs/CONTEXT.md` for the decisions behind it.

All data currently comes from `src/lib/api/mock`; setting `NEXT_PUBLIC_API_MODE=http` selects the
stub adapter until a backend implements the contract.

## Conventions

1. TypeScript strict mode; no `any`.
2. Components never import mock data directly. All data goes through `src/lib/api`.
3. Every form has a Zod schema.
4. Server Components by default; add `'use client'` only when needed.
5. Every async view has loading, empty, error and success states.
6. No hardcoded content in components; no lorem ipsum. Sample data is flagged `placeholder: true`.
7. Colours come from design tokens (`src/styles/tokens.css`), never raw hex values in components.
8. Accessibility target is WCAG 2.2 AA. Light mode only.
9. Money is stored as integers in minor units with a currency code. The UI displays NPR only
   (decision D30).
10. The public site has no login (D3). The default viewer is anonymous; until member sign-in
    exists, an `alumni_only` field is treated as hidden (D29).
11. Commit messages follow the pattern `type: short description` (`feat`, `fix`, `chore`, `docs`).
