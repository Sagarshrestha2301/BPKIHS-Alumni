# ROADMAP.md — BPKIHS Alumni Website (Frontend)

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
| 3 | Data layer (types, mocks, API client) | [x] |
| 4 | Home and About/Governance pages | [x] |
| 5 | Directory and Registration | [x] (photo upload UI is a stub) |
| 6 | Donate flow (with login gate) | [x] UI only; real gateway and receipts are backend work |
| 7 | Events and Community | [x] UI only; automated digest is backend work |
| 8 | Support and Legal | [x] draft copy needs Association/legal review |
| 9 | Admin dashboard UI (mock) | [ ] deferred; not part of the public-pages batch |
| 10 | Polish, accessibility, performance, QA | [~] foundations done; audit and Lighthouse remain |
| 11 | Backend handoff package | [ ] |

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
  notices, subscribe and unsubscribe forms.
- `/support` and `/support/faq`: contact cards, helpdesk form, searchable FAQ accordion.
- `/legal/privacy`, `/legal/terms`, `/legal/accessibility`: draft long-form pages with a table of
  contents and a clear review notice.
- README, ROADMAP and CONTEXT brought back in line with the code.
- Profile e2e updated to a public seed record after the privacy fix; full e2e suite green (102
  passed, 10 desktop-only skipped).

**Still open after this batch:** real backend, real payments and receipts, automated newsletter,
photo upload, admin dashboard, CSV import, full accessibility audit, Lighthouse pass and the
backend handoff package.

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
- [x] Dev-only `/styleguide`; contrast audit; navigation e2e

---

## Phase 3 — Data layer ✅

- [x] `lib/api/types.ts`, domain constants and Zod schemas
- [x] `lib/api/client.ts` interface + adapter switch
- [x] `mockAdapter` with latency/error simulation, seeds and moderation/privacy rules
- [x] Seed data: 58 alumni, 6 goals, current/previous boards, 12 events, 14 posts, 10 FAQ items
- [x] Pagination, search, sort and filter helpers
- [x] Money and date formatters (NPR only, decision D30)
- [x] Unit tests for filters, formatters and schemas
- [x] `httpAdapter` stub with the same signatures

---

## Phase 4 — Home and About/Governance ✅

- [x] Hero with three equal CTAs
- [x] Welcome message, stats band, three doors
- [x] Featured goals, upcoming events, community posts, board preview
- [x] Newsletter strip and partner strip
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
- [ ] Approval queue: Phase 9 admin dashboard

---

## Phase 6 — Donate flow (UI only)

- [x] `/donate` goals with progress bars, quick amounts and general fund
- [x] NPR-only display (decision D30; no USD toggle)
- [x] `/donate/checkout`: amount → mock sign-in gate → payment method
- [x] Sign-in / sign-up forms (in-memory demo; `demo@example.com`)
- [x] eSewa, Khalti, ConnectIPS, Fonepay, card and PayPal-style panels
- [x] Sticky summary, processing, failure and retry states
- [x] `/donate/thank-you`
- [x] `/donate/transparency` with a donut and table
- [x] `/donate/tribute` form and sample wall
- [x] “Demo only” notices on payment stubs
- [ ] Real gateway, webhook confirmation and emailed receipts (backend)
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
- [x] Notice-board list
- [x] Newsletter signup, interests, unsubscribe preferences and archive placeholder
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

## Phase 9 — Admin dashboard UI (mock) 🔒 deferred

- [ ] Mock admin gate
- [ ] Overview
- [ ] Alumni approval queue (approve / reject with reason)
- [ ] Post moderation queue and reported posts
- [ ] Donations list and export button (UI)
- [ ] Events manager (create/edit)
- [ ] Posts manager
- [ ] Support tickets list
- [ ] CSV import UI for the written register (upload → preview → validate → confirm)

**Exit criteria:** admin flows demonstrable on mock data.

---

## Phase 10 — Polish, accessibility, performance, QA

- [x] Keyboard basics, skip link, landmarks and visible focus
- [x] Contrast audit test
- [ ] Full keyboard walkthrough of every page
- [ ] Screen-reader pass (NVDA/VoiceOver) on forms, dialogs and tables
- [ ] Automated axe checks in CI
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95
- [ ] Image optimisation and font subsetting
- [ ] Bundle analysis; remove unused code
- [ ] Cross-browser: Chrome, Safari, Firefox, Edge; iOS Safari, Android Chrome
- [ ] Throttled 4G and low-end device test
- [ ] Copy review and placeholder audit
- [ ] Sitemap, robots and structured data

---

## Phase 11 — Backend handoff package

- [ ] `API_CONTRACT.md`: every function in `lib/api`, with request/response examples
- [ ] Zod schemas exported as the validation spec
- [ ] Auth, rate-limit and file-upload needs
- [ ] CSV import column spec
- [ ] Payment integration notes per gateway
- [ ] Checklist for switching `NEXT_PUBLIC_API_MODE` to `http`

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Proposal drift | Missing features | Public pages reconciled; re-check before launch |
| Brand colours unknown | Rework of design | Tokens only; swap in one file |
| No real content | Pages look empty or fake | Flagged placeholders; CSV import path |
| Payment UI misread as live | Trust issue | “Demo only” notices until backend |
| Privacy mistakes in directory | Reputation | Anonymous default, privacy tests, API contract |
| Slow connections in Nepal | Poor UX | Performance budget, lazy images, minimal JS |
| Scope creep into backend | Delay | Working Protocol rule 5 |

---

## Next step

**Next:** choose Phase 9 (admin mock) or start Phase 10 (accessibility, Lighthouse, cross-browser,
content review). Admin remains deferred until the public pages have had an owner review.

**Still open:** Q2/Q3 (logo and colours), Q4 (dates), Q7 (photos), Q8 (FAQ/helpdesk owner),
Q9 (social links), Q10 (donation wording).
