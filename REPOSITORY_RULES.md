# Repository Rules for AI Coding Agents

This file contains repository-specific coding conventions for AI agents working on the BPKIHS Alumni Association website.

## Project overview

Lifelong alumni platform for B.P. Koirala Institute of Health Sciences (BPKIHS), Dharan, Nepal. Next.js 16 App Router frontend with Postgres backend via Drizzle ORM. One data path: the real API. No mock mode, no payment simulator.

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19
- **Language:** TypeScript (strict mode, `noUncheckedIndexedAccess`)
- **Styling:** Tailwind CSS v4, shadcn/ui (Base UI, Nova preset)
- **Database:** Postgres 16, Drizzle ORM
- **Auth:** Better Auth
- **Payments:** eSewa and Khalti live; ConnectIPS built and hidden until configured; Fonepay pending, NPR only
- **Testing:** Vitest (unit), Playwright (e2e)
- **Email:** Resend in production, console in development

## Core conventions

1. **TypeScript strict mode; no `any`.**
2. **Components never import server code or the database.** Reads go through Server Components and `src/lib/api`; writes go through the API.
3. **Every form has a Zod schema.**
4. **Server Components by default.** Add `'use client'` only when needed.
5. **Every async view has loading, empty, error and success states.**
6. **No hardcoded content in components.** User-facing strings live in `src/content`, operational values in `src/server/config.ts` or environment variables. No lorem ipsum and no demo data.
7. **Colours come from design tokens** (`src/styles/tokens.css`), never raw hex values in components.
8. **Accessibility target is WCAG 2.2 AA.** Light mode only.

## File structure

```
src/
  app/            routes and layouts (Next.js App Router)
  components/
    ui/           shadcn/ui primitives
    layout/       header, footer, mobile nav
    shared/       reusable blocks
  features/       one folder per area: directory, donations, events,
                  community, governance, register, support, auth, legal, home, admin
  lib/
    api/          typed client and contract, HTTP adapter, privacy rules
    constants/    format/ utils.ts
  server/         server-only code: db, auth, services, payments, email, http
    api/          adapter used by Server Components
  content/        static typed copy
  styles/         tokens.css (brand colours)
  types/
docs/             project documents
drizzle/          SQL migrations
e2e/              Playwright tests
```

## Key patterns

### API layer

- All API routes under `/api/v1/*`
- JSON in/out, same-origin
- Mutations require CSRF token + origin check
- One error envelope format
- Rate limiting per IP on public forms

### Database

- Drizzle ORM with migrations in `drizzle/`
- Schema in `src/server/db/schema.ts`
- Run migrations: `npm run db:migrate` (dev) or `npm run db:migrate:prod` (production)

### Authentication

- Better Auth with session cookies
- Roles: `donor`, `alumni`, `admin`
- Admin idle timeout applies
- Two-factor optional per admin account

### Payments

- eSewa and Khalti are live; ConnectIPS is implemented and appears once configured; Fonepay has no adapter yet
- Only configured gateways are offered, and every method must verify its payment server-side
- `PAYMENT_MODE` must be `sandbox` or `live`
- No card numbers collected on-site
- Gateway handles the payment UI

### Email

- Resend for production
- Console logging for development
- Templates in `src/content/email.ts`

## Before every commit

Run these four checks:

1. `npm run format:check`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`

Also run `npm run test` when changes touch data, validation, or forms.

## Documentation

| Document             | Purpose                             |
| -------------------- | ----------------------------------- |
| `README.md`          | Overview, requirements, commands    |
| `HANDOVER.md`        | Logins, secrets, go-live order      |
| `docs/HOWTO.md`      | Setup, admin tasks, troubleshooting |
| `docs/BACKEND.md`    | API, data model, auth, payments     |
| `docs/SECURITY.md`   | Threat model, controls              |
| `docs/DEPLOYMENT.md` | Production runbook                  |
| `docs/DESIGN.md`     | Design system, page specs           |
| `docs/TRACKER.md`    | Open work, suggested order          |
| `PROJECT_STATE.md`   | Current progress and next steps     |

## Security notes

- Never commit secrets to the repository
- `.env.local` is git-ignored
- Production requires environment validation at startup
- CSP headers block inline scripts
- Rate limiting on all public forms
- Audit logging for admin actions
