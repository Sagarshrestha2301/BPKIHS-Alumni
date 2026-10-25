# ROADMAP.md — BPKIHS Alumni Website

> Companion to `CONTEXT.md` (decisions, architecture, data) and `DESIGN.md` (visuals, page specs).
> **Rule:** every phase starts with a plan and ends with a Session Log entry in `CONTEXT.md`.
> **Legend:** `[ ]` to do · `[x]` done · `[~]` partial · 🔒 needs a decision first

**Proposal timeline reference:** about 9–10 weeks total. Dates remain targets, not commitments,
until the open questions in `CONTEXT.md` §12 are answered.

---

## Phase overview

| Phase | Name | Status |
|---|---|---|
| 0 | Alignment and docs | [x] except open questions Q2–Q4, Q7–Q10 |
| 1 | Project setup and tooling | [x] |
| 2 | Design system and layout shell | [x] |
| 3 | Data layer (types, API client, contract) | [x] |
| 4 | Home and About/Governance pages | [x] |
| 5 | Directory and Registration | [x] (photo upload UI is a stub) |
| 6 | Donate flow (with login gate) | [x] UI and backend; live merchant keys still needed |
| 7 | Events and Community | [x] UI and backend; automated digest is not sent |
| 8 | Support and Legal | [x] draft copy needs Association/legal review |
| 9 | Admin dashboard UI | [x] overview, moderation, support, donations; events manager and CSV import remain |
| 10 | Polish, accessibility, performance, QA | [~] foundations done; audit and Lighthouse remain |
| 11 | Backend and deployment | [x] API, schema, auth, payments, production runbook; see `BACKEND.md` and `DEPLOYMENT.md` |

---

## What was completed on 22 October 2026

- Anonymous-viewer privacy fix: `alumni_only` profiles and contact fields are no longer exposed
  while the public site has no member sign-in. Regression tests added.
- `/register`: three-step public form, validation, consent and pending-approval result.
- `/donate`: goals, quick amounts, funds breakdown, tribute teaser, demo notice.
- `/donate/checkout`: amount → mock sign-in gate → payment method, with summary and retry states.
- `/donate/thank-you`, `/donate/transparency`, `/donate/tribute`.
- `/events` and `/events/[slug]`: upcoming/past tabs, search, capacity, RSVP, calendar file,
  linked giving goal and past gallery.
- `/community` and `/community/newsletter`: filters, load more, moderated share form, report action,
  subscribe and unsubscribe forms.
- `/support` and `/support/faq`: contact cards, helpdesk form, searchable FAQ accordion.
- `/legal/privacy`, `/legal/terms`, `/legal/accessibility`: draft long-form pages with a table of
  contents and a clear review notice.
- README, ROADMAP and CONTEXT brought back in line with the code.
- Profile e2e updated to a public seed record after the privacy fix.
- Removed mock-only extras the proposal does not call for: the home partner strip, community notice
  board, newsletter archive, tribute wall, disabled annual-report control and the dev
  `/styleguide`. The typed mock data layer stays until a backend exists.
- Full e2e suite green (92 passed, 10 desktop-only skipped).

**Still open after this batch:** real gateway credentials, automated newsletter, photo upload,
admin events manager, CSV import, full accessibility audit and the Lighthouse pass.

### Backend (same day)

- Postgres 16 schema with Drizzle migrations and a seed that keeps the frontend's ids stable
  (alumni, goals, funds, board, events, posts, FAQ, welcome message, admin and donor accounts).
- `/api/v1` covering every read and write the site needs, with Zod validation, one error
  envelope, rate limits on public forms, and same-origin checks on writes.
- Better Auth accounts and roles: donors for receipts, admins for moderation. Alumni records stay
  separate from accounts.
- Admin API for registrations, post moderation, reports, tickets and the donation ledger, with an
  audit log on every decision.
- eSewa ePay v2 and Khalti ePayment v2 adapters: redirect construction, signature and
  transaction verification, idempotent completion, callback log and receipt email.
- Email transport with a console driver for development and Resend for production.
- The UI switched from mock data to the API with no page rewrites; the shared contract suite runs
  against both adapters.
- `docs/BACKEND.md` documents the API surface, runbook, payments and open items.

**Not covered by the backend batch:** photo upload, newsletter campaigns, CSV import of the
existing register, ConnectIPS and Fonepay adapters, and shared rate limiting for multi-instance
deployments.

### Admin dashboard (same day)

- `/admin` with its own sign-in (`/admin/sign-in`), guarded server-side by session and role.
- Overview with the four queues, approved alumni, subscribers and money raised.
- Registrations: status filters, search, approve, reject with a reason stored in the audit log.
- Posts: publish or reject pending submissions.
- Reports: mark reviewed or dismiss.
- Support: filter and change ticket status.
- Donations: paginated ledger with amounts, methods, goal titles and status.
- Browser tests cover the sign-in guard, approving a registration, publishing a post and moving a
  ticket to in progress.

### Production hardening (23 October 2026)

- Removed the mock API adapter and `NEXT_PUBLIC_API_MODE`; the app has one real data path.
- Removed the payment simulator and the card/PayPal/ConnectIPS/Fonepay stubs from checkout;
  `PAYMENT_MODE` is required and only eSewa and Khalti are offered.
- Production starts empty with real content; no development-only seed dataset is loaded
  refuses to run in production. A clean database plus `npm run db:admin` is the production
  starting point.
- Demonstration copy, sample badges and placeholder contact details removed. Office contact
  details come from environment variables.
- Production environment validation at startup and in `npm run check:env`; missing payments,
  email, auth, database or contact settings stop the server.
- `/api/health` readiness endpoint, runtime migration runner and a deployment runbook.

**Still open for launch:** live merchant accounts, a verified Resend domain, real Association
content (there is no content editor yet), legal review and the accessibility audit.

---

## What was completed on 25 October 2026

- The browser suite is green and repeatable: a `setup` Playwright project seeds the admin, the
  donor and the scholarship goal (`npm run db:fixtures`) and stores one session per identity, so
  a run signs in twice instead of ten times and no longer trips the sign-in limiter.
- Port 3000 is pinned in the Playwright config; the accordion test waits for hydration instead of
  racing it.
- `/admin/donations` exports the ledger as a CSV, with spreadsheet-formula defusing and an audit
  entry.
- `sitemap.ts`, `robots.ts`, and JSON-LD for the organisation, events and breadcrumbs.
- `@axe-core/playwright` scans all 18 public pages for WCAG 2.1 A and AA; the one violation it
  found (inactive tab contrast) is fixed.
- Two production bugs found while doing it: the CSP blocked the gateway form POST that completes
  a payment, and checkout offered the sign-in form to a donor whose session had not loaded yet.

**Still open:** the manual accessibility and cross-browser passes, Lighthouse, CSV import, photo
upload, and everything in `TRACKER.md` section A (which needs the Association).

---

## Phase 0 — Alignment and docs

- [x] Read the proposal and the three reference sites
- [x] Record decisions D1–D30
- [x] Create `CONTEXT.md`, `ROADMAP.md`, `DESIGN.md`
- [ ] 🔒 Confirm brand colours and Association logo (Q2, Q3)
- [ ] Answer Q4, Q7, Q8, Q9, Q10 (or accept the defaults)

**Exit criteria:** Owner approves the three documents and the remaining open questions.

---

## Phase 1 — Project setup and tooling ✅

- [x] Next.js App Router, TypeScript strict, `noUncheckedIndexedAccess`
- [x] Tailwind CSS v4 and shadcn/ui (Base UI, Nova)
- [x] ESLint, Prettier, import sorting, Husky pre-commit (lint-staged + typecheck)
- [x] Path alias `@/`, folder structure, env files, README
- [x] Fonts, brand tokens, light mode only, image host for bpkihs.edu
- [x] Vitest + Testing Library; Playwright; `npm run ci`
- [ ] Replace `vite-tsconfig-paths` with Vite's native `resolve.tsconfigPaths` (Phase 10)
- [ ] Re-check `npm audit --omit=dev` when shadcn ships a fix (Phase 10; never use `--force`)
- [x] Add `test`, `test:e2e` and `ci` to the README script table (22 Oct 2026)

---

## Phase 2 — Design system and layout shell ✅

- [x] Type scale, spacing, container and shadow tokens
- [x] `Container`, `Section`, `Eyebrow`, `SectionHeading`, `DonateButton`/`DonateLink`
- [x] Form primitives and the `FormField` wrapper
- [x] Card, badge, tabs, accordion, dialog, sheet, toast, skeleton, progress, breadcrumb, pagination
- [x] `StatCard`, `EmptyState`, `ErrorState`, `ProgressBar`, `Stepper`
- [x] Header, mobile menu, bottom bar, footer and newsletter strip
- [x] Skip link, landmarks, 404, error and loading pages
- [x] Contrast audit; navigation e2e

---

## Phase 3 — Data layer ✅

- [x] `lib/api/types.ts`, domain constants and Zod schemas
- [x] `lib/api/contract.ts` and the real HTTP adapter
- [x] Privacy rules in `lib/api/privacy.ts`, shared by the API and the UI
- [x] Demo dataset for local development, kept out of the application and `NODE_ENV=production`
- [x] Pagination, search, sort and filter helpers
- [x] Money and date formatters (NPR only, decision D30)
- [x] Unit tests for filters, formatters and schemas

---

## Phase 4 — Home and About/Governance ✅

- [x] Hero with three equal CTAs
- [x] Welcome message, stats band, three doors
- [x] Featured goals, upcoming events, community posts, board preview
- [x] Newsletter strip
- [x] `/about`, `/about/board` (current/previous + dialog), `/about/how-we-work`
- [x] SEO metadata and Open Graph on the home page

---

## Phase 5 — Directory and Registration

**Directory**
- [x] Search, programme/batch/country/city filters and “further studies”
- [x] Donate button on the directory and every profile
- [x] Desktop sidebar, mobile filter sheet and active-filter chips
- [x] Person cards, sorting, pagination (12 per page)
- [x] Profile page with privacy-aware fields
- [x] Loading, empty, error and success states

**Registration**
- [x] Three-step form with Zod validation and per-step checks
- [x] Consent and privacy choices
- [x] Success “pending approval” screen with reference
- [ ] Photo upload: the control is a disabled stub until storage exists
- [x] Approval queue: `/admin/alumni` approves and rejects with a reason (24 Oct 2026)

---

## Phase 6 — Donate flow (UI only)

- [x] `/donate` goals with progress bars, quick amounts and general fund
- [x] NPR-only display (decision D30; no USD toggle)
- [x] `/donate/checkout`: amount → Better Auth sign-in gate → eSewa or Khalti
- [x] Sticky summary, pending, failure and retry states
- [x] `/donate/thank-you` with pending and failed states
- [x] `/donate/transparency` with a donut and table
- [x] `/donate/tribute` form
- [x] Gateway redirect, signed callback / server lookup, idempotent completion and emailed receipt
- [ ] Live merchant credentials and a verified sending domain
- [ ] Donor list on the transparency page (needs a public, privacy-aware API)

---

## Phase 7 — Events and Community (UI only)

**Events**
- [x] Listing with Upcoming/Past tabs and search
- [x] Detail with date, venue, mode, capacity meter and description
- [x] Public RSVP form with waitlist wording when full
- [x] Add-to-calendar `.ics` download
- [x] Event-linked donation drive card
- [x] Past-event recap with photo/video gallery

**Community**
- [x] Feed with type filters and “Load more”
- [x] “Share an update” form (no login; submits as pending)
- [x] Report action on posts
- [x] Newsletter signup, interests and unsubscribe preferences
- [ ] Automated digest and post-detail page (backend / later polish)

---

## Phase 8 — Support and Legal

- [x] `/support` contact cards and helpdesk form (topics: account, profile verification,
      donation receipt, general)
- [x] `/support/faq` with search, categories and accordion
- [x] `/legal/privacy`, `/legal/terms`, `/legal/accessibility` (draft copy, TOC, review notice)
- [x] 404, error and loading pages

**Exit criteria:** all footer links resolve; no dead ends. **Met.**

---

## Phase 9 — Admin dashboard UI

- [x] Admin gate (Better Auth session, `admin` role)
- [x] Overview
- [x] Alumni approval queue (approve / reject with reason)
- [x] Post moderation queue and reported posts
- [x] Donations list, with a CSV export of the whole ledger (25 Oct 2026)
- [x] Events manager: create, edit and delete under `/admin/content` (24 Oct 2026)
- [x] Posts manager
- [x] Support tickets list
- [ ] CSV import UI for the written register (upload → preview → validate → confirm)

**Exit criteria:** every moderation task the Association does weekly can be completed in the
dashboard. CSV import is the remaining gap; the ledger export is tracked as C4.

---

## Phase 10 — Polish, accessibility, performance, QA

- [x] Keyboard basics, skip link, landmarks and visible focus
- [x] Contrast audit test
- [ ] Full keyboard walkthrough of every page
- [ ] Screen-reader pass (NVDA/VoiceOver) on forms, dialogs and tables
- [x] Automated axe checks on every public page (`e2e/a11y.spec.ts`, 25 Oct 2026)
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95
- [ ] Image optimisation and font subsetting
- [ ] Bundle analysis; remove unused code
- [ ] Cross-browser: Chrome, Safari, Firefox, Edge; iOS Safari, Android Chrome
- [ ] Throttled 4G and low-end device test
- [ ] Copy review and placeholder audit
- [x] Sitemap, robots and structured data (Organization, Event, BreadcrumbList; 25 Oct 2026)

---

## Phase 11 — Backend handoff package

- [x] `docs/BACKEND.md`: every route, the contract, the data model and payment flow
- [x] Zod schemas are the validation spec, shared by forms and routes
- [x] Auth, rate-limit and file-upload needs documented
- [x] Payment integration notes per gateway
- [x] `docs/DEPLOYMENT.md`: environment, migrations, admin bootstrap, go-live and rollback
- [ ] CSV import column spec (blocked on the Association's register format)

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Proposal drift | Missing features | Public pages reconciled; re-check before launch |
| Brand colours unknown | Rework of design | Tokens only; swap in one file |
| No real content | Pages look empty | Production starts clean; `/admin/content` is the content entry path |
| Payments misconfigured | Donations fail or stay pending | Startup refuses missing keys; only configured gateways are offered |
| Privacy mistakes in directory | Reputation | Anonymous default, privacy tests, API contract |
| Slow connections in Nepal | Poor UX | Performance budget, lazy images, minimal JS |
| Scope creep into backend | Delay | Working Protocol rule 5 |

---

## Next step

**Next:** production launch (deploy, live merchant accounts, verified sending domain, real
content entered through `/admin/content`) and the manual half of Phase 10 (keyboard and
screen-reader passes, Lighthouse, cross-browser). The largest remaining product gaps are CSV
import of the written alumni register and photo upload; both need a decision from the Association
first.

**Still open:** Q2/Q3 (logo and colours), Q4 (dates), Q7 (photos), Q8 (FAQ/helpdesk owner),
Q9 (social links), Q10 (donation wording).
