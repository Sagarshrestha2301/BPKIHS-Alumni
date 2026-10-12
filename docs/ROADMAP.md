# ROADMAP.md — BPKIHS Alumni Website (Frontend)

> Companion to `CONTEXT.md` (decisions, architecture, data) and `DESIGN.md` (visuals, page specs).
> **Rule:** Every phase starts with a plan, waits for "approved", and ends with a Session Log entry in `CONTEXT.md`.
> **Legend:** `[ ]` to do · `[x]` done · `[~]` in progress · 🔒 needs a decision first

**Proposal timeline reference:** about 9–10 weeks total. The frontend phases below are sized for that, but dates are **targets, not commitments**, until Q1 (proposal re-upload) is resolved.

---

## Phase overview

| Phase | Name | Est. | Depends on | Status |
|---|---|---|---|---|
| 0 | Alignment and docs | 1 day | — | [x] |
| 1 | Project setup and tooling | 2 days | 0 | [x] |
| 2 | Design system and layout shell | 4 days | 1 | [ ] |
| 3 | Data layer (types, mocks, API client) | 3 days | 1 | [ ] |
| 4 | Home and About/Governance pages | 5 days | 2, 3 | [ ] |
| 5 | Directory and Registration | 6 days | 2, 3 | [ ] |
| 6 | Donate flow (with login gate) | 6 days | 2, 3 | [ ] |
| 7 | Events and Community | 5 days | 2, 3 | [ ] |
| 8 | Support and Legal | 3 days | 2 | [ ] |
| 9 | Admin dashboard UI (mock) 🔒 | 5 days | 3–8 | [ ] |
| 10 | Polish, accessibility, performance, QA | 5 days | all | [ ] |
| 11 | Backend handoff package | 2 days | all | [ ] |

*Phases 4–8 can run in parallel after 2 and 3 if more than one person works on it.*

---

## Phase 0 — Alignment and docs ✅

- [x] Read proposal summary and three reference sites
- [x] Ask clarifying questions and record decisions D1–D13
- [x] Create `CONTEXT.md`, `ROADMAP.md`, `DESIGN.md`
- [x] Re-upload proposal `.docx` and reconcile (Q1) — done in Session 6, see D25–D28
- [ ] 🔒 Confirm brand colours and Association logo (Q2, Q3)
- [ ] 🔒 Answer open questions Q4–Q10 (or accept defaults)

**Exit criteria:** Owner approves the three documents.

---

## Phase 1 — Project setup and tooling ✅

**Delivery rule (D15):** one step at a time; next step only after the owner says "done"; every step ends with a File order tree.

### Step tracker

| Step | Scope | Status |
|---|---|---|
| 1 | Check Node, npm, git, VS Code; create Next.js project; run dev server; extensions | [x] |
| 2 | Prettier + Tailwind plugin; config files; scripts; strict TS; folder structure; env files; docs in `docs/`; first commit | [x] |
| 3 | shadcn/ui init (Base UI, Nova) and `button` | [x] |
| 4 | Fonts (Inter, Source Serif 4, Noto Sans Devanagari); `styles/tokens.css`; shadcn variables mapped to brand tokens; light mode only; site metadata; temporary token check page | [x] |
| 5 | Remote image host for bpkihs.edu; image test; real `README.md` | [x] |
| 6 | Husky pre-commit (lint-staged + typecheck); import sorting | [x] Hook proven: it blocked a deliberately broken commit |
| 7 | `cn` helper moved to `clsx` + `tailwind-merge`; Vitest + React Testing Library; unit tests | [x] 3 tests |
| 8 | Playwright (desktop + mobile smoke tests); `npm run ci` script | [x] 4 tests |

### Checklist

- [x] Next.js App Router project, TypeScript strict, `noUncheckedIndexedAccess`
- [x] Tailwind CSS v4 and shadcn/ui (Base UI, Nova)
- [x] ESLint + Prettier + import sorting; Husky pre-commit (lint-staged and typecheck)
- [x] Path alias `@/`, folder structure from `CONTEXT.md` §5.3
- [x] Env handling: `NEXT_PUBLIC_API_MODE=mock`
- [x] Fonts via `next/font`; brand tokens; light mode only
- [x] Remote image host for bpkihs.edu
- [x] README with run, build and conventions
- [x] Testing: Vitest + React Testing Library; Playwright for key flows
- [x] CI script placeholder: `npm run ci`
- [ ] Cleanup items carried to later phases (see below)

**Cleanup items (non-blocking):**
- [ ] Replace `vite-tsconfig-paths` with Vite's native `resolve.tsconfigPaths` (Vitest prints a notice) — Phase 10
- [ ] Re-check `npm audit --omit=dev` and update shadcn when a fixed version exists (7 high warnings, all inside shadcn's CLI tooling; never use `--force`) — Phase 10
- [ ] Add the new scripts (`test`, `test:e2e`, `ci`) to the README script table — Phase 2 Step 9
- [ ] Download the logo and key images into `public/` with BPKIHS's permission instead of hotlinking — before launch
- [ ] Add `loading="eager"` to above-the-fold remote images (done on the temporary page)

**Exit criteria:** Blank app builds, lints, tests and deploys locally; conventions documented. **Met.**


---

## Phase 2 — Design system and layout shell

**Step plan and status:**

| Step | Scope | Status |
|---|---|---|
| 9 | Type scale, spacing, container and shadow tokens; `Container`, `Section`, `Eyebrow`, `SectionHeading`; `DonateButton` and `DonateLink`; heading sizes in `globals.css` | [x] Done, committed (`5d38959`) |
| 10 | Form primitives via shadcn (input, label, textarea, select, checkbox, radio group, switch); `FormField` wrapper (label, hint, error with icon, aria links); tests; `vitest.setup.ts` cleanup fix | [x] Done, committed (`92e70c1`, fix `540a0b7`); 7 tests pass |
| 11 | Surfaces and feedback: card, badge, tabs, accordion, dialog, sheet, toast, skeleton, progress, breadcrumb, pagination; custom `StatCard`, `EmptyState`, `ErrorState`, goal `ProgressBar`, `Stepper`; add a form demo to the temporary page | [ ] **Next** |
| 12 | Header (desktop) + mobile menu sheet + mobile bottom action bar; logo placeholder (needs Q2/Q3 for the real logo) | [ ] |
| 13 | Footer with newsletter strip; skip link and landmarks; 404, error and loading pages | [ ] |
| 14 | Dev-only `/styleguide`; contrast audit test; e2e tests for navigation at 360 and 1440 px | [ ] |


- [~] `styles/tokens.css`: colour tokens done in Phase 1 Step 4; type scale, spacing, shadow tokens still to do
- [x] Tailwind theme and shadcn variables mapped to tokens (Phase 1 Step 4)
- [ ] Core primitives: Button (incl. donate variant), Input, Select, Textarea, Checkbox, Radio, Switch, Combobox
- [ ] Surfaces: Card (basic, goal, event, person, post), Badge/Chip, Tabs, Accordion
- [ ] Overlays: Dialog, Sheet, Toast
- [ ] Feedback: Skeleton, EmptyState, ErrorState, ProgressBar, StatCard
- [ ] Navigation: Breadcrumb, Pagination, Stepper
- [ ] **Header** (desktop and mobile menu sheet) and **mobile bottom action bar**
- [ ] **Footer** with newsletter strip
- [ ] Skip link, landmarks, focus-ring styles
- [ ] A `/styleguide` page (dev only) showing all components and states
- [ ] Contrast audit of every colour pairing

**Exit criteria:** Styleguide approved; shell renders responsively at 360 / 768 / 1024 / 1440.

---

## Phase 3 — Data layer (backend-ready)

- [ ] `lib/api/types.ts` from `CONTEXT.md` §7.1
- [ ] Zod schemas for every input (registration, donation, RSVP, helpdesk with topic, newsletter and preferences, tribute with recipient kind, member post, post report, login/signup)
- [ ] `lib/api/client.ts` interface + adapter switch
- [ ] `mockAdapter` with latency and error simulation
- [ ] Seed data (all `placeholder: true`):
  - [ ] ~60 alumni across programmes, batches, countries
  - [ ] 4–5 donation goals + general fund
  - [ ] Current and previous boards
  - [ ] 6 upcoming and 6 past events
  - [ ] 12 feed posts (mix of tags, incl. In Memoriam), 10 FAQ items, 1 welcome message
  - [ ] Board members with vision statements; programmes include BMIT; one past event with a gallery; one event linked to a goal
- [ ] Pagination, search, sort, filter helpers
- [ ] `useAuth()` abstraction with mock session (donation gate)
- [ ] Money and date formatting utilities (NPR/USD, `12 Oct 2026`)
- [ ] Unit tests for filters, formatters, and schemas
- [ ] `httpAdapter` **stub** with the same signatures (throws "not implemented") to prove the swap

**Exit criteria:** Any page can fetch via `lib/api`; swapping the adapter requires zero component changes.

---

## Phase 4 — Home and About/Governance

**Home `/`** (`DESIGN.md` §8.1)
- [ ] Hero with three equal CTAs
- [ ] Welcome message (text or video)
- [ ] Stats band (alumni, funds raised, active programmes)
- [ ] Three doors
- [ ] Featured goals
- [ ] Upcoming events
- [ ] Community posts
- [ ] Board preview
- [ ] Association message
- [ ] Newsletter strip, partner strip
- [ ] SEO metadata and Open Graph

**About / Board / How We Work** (§8.2)
- [ ] `/about`
- [ ] `/about/board` with Current/Previous tabs and member dialog
- [ ] `/about/how-we-work` accordion

**Exit criteria:** Home and governance pages pass the Definition of Done (`CONTEXT.md` §9).

---

## Phase 5 — Directory and Registration

**Directory** (§8.3)
- [ ] Search (name, specialisation, location/country) and filters (programme incl. BMIT, batch, country/city, further studies)
- [ ] Donate button on the directory and on every profile
- [ ] Desktop sidebar; mobile bottom-sheet filters with active-filter chips
- [ ] Person cards, sorting, pagination (12 per page)
- [ ] Profile page with privacy-aware fields
- [ ] Loading, empty, error states

**Register** (§8.4)
- [ ] 3-step form with Zod validation
- [ ] Consent and privacy switches
- [ ] Photo upload UI (stub)
- [ ] Success "pending approval" screen
- [ ] E2E test: register → success

**Exit criteria:** Directory is searchable and filterable; registration works end to end on mock.

---

## Phase 6 — Donate flow (with login gate)

- [ ] `/donate` goals page with progress bars and amount chips
- [ ] NPR/USD display toggle
- [ ] `/donate/checkout` stepper: amount → **login gate** → payment method
- [ ] Mock sign-in / sign-up dialog (only here, per D3)
- [ ] Payment method panels: eSewa, Khalti, ConnectIPS, Fonepay QR, Card, PayPal-style (UI only)
- [ ] Order summary (sticky desktop, collapsible mobile)
- [ ] Processing, failure, retry states
- [ ] `/donate/thank-you`
- [ ] `/donate/transparency` with funds donut + table
- [ ] `/donate/tribute` form and wall
- [ ] "Demo only" notice on payment stubs
- [ ] E2E tests: anonymous visitor → gate → donate → thank-you

**Exit criteria:** Full donation journey works on mock; no login required anywhere else on the site.

---

## Phase 7 — Events and Community

**Events** (§8.11)
- [ ] Listing with Upcoming/Past tabs and filters
- [ ] Detail page with RSVP form (no login), capacity meter, calendar button (UI)
- [ ] Event-linked donation drive card (when `goalId` is set)
- [ ] Past-event recap layout with photo and video gallery

**Community** (§8.10)
- [ ] Feed with filter chips (News, Stories, Achievements, Event, Announcement, In Memoriam, Notices) and "Load more"
- [ ] "Share an update" form (no login, submits as pending) and Report button on posts
- [ ] Notice-board style list
- [ ] Post detail view
- [ ] Newsletter signup, subscribe/unsubscribe preferences, and archive

**Exit criteria:** RSVP and newsletter flows work on mock.

---

## Phase 8 — Support and Legal

- [ ] `/support` contact cards and helpdesk form (topics: account, profile verification, donation receipt, general)
- [ ] `/support/faq` with search, categories, accordion
- [ ] `/legal/privacy`, `/legal/terms`, `/legal/accessibility` (placeholder copy, marked for legal review)
- [ ] 404, error, loading, maintenance pages

**Exit criteria:** All footer links resolve; no dead ends.

---

## Phase 9 — Admin dashboard UI (mock) 🔒

*Confirm in Q6 whether to build now or defer.*

- [ ] Mock admin gate
- [ ] Overview
- [ ] Alumni approval queue (approve / reject with reason)
- [ ] Post moderation queue and reported posts
- [ ] Donations list and export button (UI)
- [ ] Events manager (create/edit)
- [ ] Posts manager
- [ ] Support tickets list
- [ ] CSV import UI for the written register (upload → preview → validate → confirm)

**Exit criteria:** Admin flows demonstrable on mock data.

---

## Phase 10 — Polish, accessibility, performance, QA

- [ ] Full keyboard walkthrough of every page
- [ ] Screen reader pass (NVDA/VoiceOver) on forms, dialogs, charts
- [ ] Automated a11y checks (axe) in CI
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95
- [ ] Image optimisation and font subsetting
- [ ] Bundle analysis; remove unused code
- [ ] Cross-browser: Chrome, Safari, Firefox, Edge; iOS Safari, Android Chrome
- [ ] Throttled 4G and low-end device test
- [ ] Copy review and placeholder audit (no lorem ipsum, all sample data flagged)
- [ ] Sitemap, robots, structured data

**Exit criteria:** All pages pass the Definition of Done; owner sign-off.

---

## Phase 11 — Backend handoff package

*Produces documents only; no backend code.*

- [ ] `API_CONTRACT.md`: every function in `lib/api`, with request/response JSON examples
- [ ] Zod schemas exported as the validation spec
- [ ] List of auth, rate-limit, and file-upload needs the UI assumes
- [ ] CSV import column spec for the written register
- [ ] Payment integration notes per gateway (what the UI expects back)
- [ ] Checklist for switching `NEXT_PUBLIC_API_MODE` to `http`

**Exit criteria:** A backend developer can implement the contract without reading UI code.

---

## Cross-cutting checklists

### Per-page Definition of Done
(See `CONTEXT.md` §9.) Copy it into each page's task.

### Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Proposal drift | Missing features | Reconciled in Session 6 (D25–D28); re-check at Phase 10 |
| Brand colours unknown | Rework of design | Tokens only; swap in one file |
| No real content | Pages look empty or fake | Flagged placeholders; CSV import path |
| Payment UI misread as live | Trust issue | "Demo only" notices until backend |
| Privacy mistakes in directory | Reputation | Visibility rules enforced in API contract and tests |
| Slow connections in Nepal | Poor UX | Performance budget, lazy images, minimal JS |
| Scope creep into backend | Delay | Working Protocol rule 5 |

### Decision log pointers
All decisions live in `CONTEXT.md` §3.1. Add new ones there, not here.

---

## Next step

**Now:** Phase 2, **Step 11** (cards, badge, tabs, accordion, dialog, sheet, toast, skeleton, progress, breadcrumb, pagination, plus custom StatCard, EmptyState, ErrorState, ProgressBar, Stepper).

**Still open:** README script rows (`test`, `test:e2e`, `ci`) not yet added; Q2/Q3 (logo, colours, name) before Step 12; Q5.
