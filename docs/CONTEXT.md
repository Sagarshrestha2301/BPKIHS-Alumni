# CONTEXT.md — BPKIHS Alumni Website (Frontend)

> **Purpose:** One file to paste or upload into any new chat so work continues without loss.
> **Companion files:** `ROADMAP.md` (phases and checklists) and `DESIGN.md` (visual system and per-page specs).
> **Scope:** Frontend only. Do not design or write backend code yet. Everything must be backend-ready.
> **Last updated:** 25 Oct 2026 (Session 11: registration creates a member account, D25 rewritten)

---

## 0. How to use this file in a new chat

1. Upload `CONTEXT.md`, `ROADMAP.md` and `DESIGN.md`.
2. Say: "Read all three files, summarise where we are, then ask me to confirm the next step."
3. The assistant must follow the **Working Protocol** in section 2.
4. At the end of each session, ask the assistant to append to the **Session Log** (section 11) and tick boxes in `ROADMAP.md`.
5. Check **section 3.3 (Current status)** first: it says exactly which step the project is on and what the assistant is waiting for.

---

## 1. Role for the assistant

Act as a **senior frontend and fullstack engineer** who knows the whole stack, but works **frontend only** on this project.

- Builds production-quality, accessible, responsive interfaces.
- Designs for a later backend so that connecting it requires **no UI rewrite**.
- Explains decisions briefly, asks when unsure, and never silently guesses.

## 2. Working Protocol (non-negotiable)

1. **Confirm before acting.** Before creating or changing anything, state the plan and wait for "approved".
2. **One step at a time.** Do one phase item, show the result, then stop for review.
3. **Log everything.** After each step, add an entry to the Session Log (section 11) and tick `ROADMAP.md`.
4. **Ask, don't assume.** Anything not in this file goes to Open Questions (section 12), not into code as a silent assumption.
5. **No backend work.** Mock data and a typed API layer only. No server code, databases, or real payment gateways.
6. **No lorem ipsum on shipped pages.** Use realistic placeholders labelled with a `placeholder` flag (see section 7.3).
7. **Keep this file current.** If a decision changes, update section 3 and note it in the log.
8. **Coding mode (from Session 2).** Give one numbered step at a time with exact PowerShell and VS Code instructions. Do **not** give the next step until the owner replies **"done"** (or pastes an error). End every step with a **"File order"** tree showing the project structure and marking files as `(new)`, `(edited)` or `(checked)`.
9. **Windows first.** All commands must work in **PowerShell on Windows 11** (no bash-only syntax, no `rm -rf`, no `&&` chains that PowerShell 5 rejects).

---

## 3. Project summary

**What:** A lifelong alumni identity platform for the **BPKIHS Alumni Association**, with the institution being **B.P. Koirala Institute of Health Sciences** (Dharan, Koshi Province, Nepal; https://bpkihs.edu).

**Eight functional areas** (from the proposal, as summarised in Session 1):

| # | Area | Summary |
|---|------|---------|
| 1 | Landing page | Board, mission, live stats |
| 2 | Alumni directory | Self-registration, programme and batch filters, admin approval, privacy controls |
| 3 | Donations | Named goals with progress bars, transparency dashboard, tribute giving |
| 4 | Community | Feed and newsletter |
| 5 | Governance | Current and previous boards, "How We Work With BPKIHS" |
| 6 | Events | Listing and RSVP |
| 7 | Support | Contact, helpdesk, FAQ |
| 8 | Trust and admin | Privacy, Terms, Accessibility, plus an admin dashboard |

**Proposal timeline:** about 9–10 weeks over 7 phases; frontend covers design (phase 2) and most of phases 3–4.

> ✅ **Proposal reconciled (Session 6, 12 Oct 2026).** `BPKIHS_Alumni_Website_Proposal_final.docx` (Prepared by Kushal Adhikari, Project Lead, Sept 2026; 9–10 weeks plus 1 month support) was reviewed against this file. Differences are resolved in D25–D28 and the type changes in section 7. Proposal §2.1–2.8 map to the eight areas above.

### 3.1 Locked decisions

| # | Topic | Decision |
|---|-------|----------|
| D1 | Stack | Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| D2 | Backend | **Implemented.** Next.js Route Handlers, Postgres and Drizzle behind the typed API layer. The mock adapter has been removed; there is one real data path |
| D3 | Login | No login across the public site. **Login/signup is requested only when a person chooses to donate**, through Better Auth |
| D4 | Branding | Use logos and images from bpkihs.edu |
| D5 | Language | English only. Do not build i18n yet (but keep strings out of deep logic so it can be added) |
| D6 | Payments | **Real gateways only.** eSewa ePay v2 and Khalti ePayment v2, verified callbacks, no simulator. ConnectIPS and Fonepay are not offered |
| D7 | Process | Build pages straight away; no separate wireframe approval step |
| D8 | Content | No digital content exists (the alumni register is on paper). Production starts empty and the Association enters real content through `/admin/content`; there is no demo dataset |
| D9 | Responsiveness | Mobile and desktop, fully responsive |
| D10 | Files | Separate files: `CONTEXT.md`, `ROADMAP.md`, `DESIGN.md` |
| D11 | Look | **Hybrid:** institutional trust (formal, credible) with a modern layout (clean, airy, card-based) |
| D12 | Homepage emphasis | **Balanced mix** of donations, directory/registration, and events/community |
| D13 | Detail level | Very detailed documentation with per-page specs and checklists |
| D14 | Environment | **Windows 11, VS Code, PowerShell**, Node.js 20.9+ (22 LTS preferred), npm, git. Project path `C:\dev\bpkihs-alumni` (short, no spaces, outside OneDrive) |
| D15 | Delivery mode | Coding one step at a time; advance only on **"done"**; every step ends with a **File order** tree (see Working Protocol rule 8) |
| D16 | Package manager | npm (`--use-npm`). Do not mix with pnpm or yarn |
| D17 | Docs location | The three `.md` files live in `docs/` inside the repo and are committed |
| D18 | UI primitives | shadcn/ui with the **Base UI** library and **Nova** preset (not Radix). Colours, fonts and radius are overridden by our tokens |
| D19 | Colour mode | Light mode only. No `.dark` theme; the `dark:` variant stays defined but never triggers |
| D20 | Dependencies | Resolve npm peer conflicts by choosing compatible versions. **Never** use `--force`, `--legacy-peer-deps` or `npm audit fix --force` |
| D21 | Class helper | `cn` = `clsx` + `tailwind-merge` in `src/lib/utils.ts`. shadcn components import it from `@/lib/utils` |
| D22 | Quality gate | Pre-commit: lint-staged + typecheck (Husky). Before a milestone: `npm run ci` and `npm run test:e2e`. Unit tests are `*.test.ts(x)` under `src/`; end-to-end tests are `*.spec.ts` under `e2e/` |
| D23 | Forms | Every field uses `FormField` (label above, hint, inline error with icon, `aria-describedby`/`aria-invalid` linked). Required fields show `*` plus `aria-required`. Errors are never shown by colour alone |
| D24 | Layout primitives | Pages are built from `Section` (48px/96px rhythm) and `Container` (max 1200px). Headings use the serif and the scale in `tokens.css` |
| D25 | Registration (proposal §2.2) | Public form that also creates the member's account: email + password, confirmed by an emailed one-time code. The profile is stored as `pending` and published after approval in `/admin/alumni`; approval needs a confirmed address |
| D26 | Community posting (proposal §2.4) | Feed is read-only plus a **"Share an update" form** (no login) that submits as `pending` for moderation, and a **Report** button on posts. Post tags: Achievement, Event, Announcement, In Memoriam (plus News, Story, Notice). Newsletter has signup **and** subscribe/unsubscribe management; the automated digest is backend work |
| D27 | Admin dashboard | Built in Phase 9 against the real admin API: overview, registrations, posts, reports, tickets and the donation ledger |
| D28 | Proposal additions | `BMIT` programme; board `visionStatement`; stats = alumni, funds raised, active programmes; search by name, specialisation, location/country; Donate button on every profile; tribute recipient (batch, mentor, alumnus); event-linked donation drives; past-event galleries; helpdesk topics (account, profile verification, donation receipt); welcome message as text or video |
| D29 | Anonymous viewer | The public site has no member sign-in, so every visitor is treated as anonymous. Fields and profiles marked `alumni_only` are hidden in the API layer, not in the UI |
| D30 | Currency | NPR only in the UI. Money stays an integer in minor units plus a currency code, so a USD toggle can be added later without touching the data |

### 3.2 Reasonable assumptions (change any of these)

- A1: Light mode only; accessibility target WCAG 2.2 AA.
- A2: Payment methods offered: eSewa and Khalti. ConnectIPS and Fonepay need adapters before they can be shown.
- A3 (superseded by D25, 25 Oct 2026): Alumni registration used to be a public form with no account. It now creates an account so the member can confirm their email address and check the review; the profile still lands as `pending` and is approved in the admin dashboard.
- A4: ~~The admin dashboard UI is built last, behind a mock gate~~ Superseded: the dashboard is built against the real API.
- A5: ~~NPR with a USD toggle~~ Superseded by D30: NPR only for now.
- A6: Hosting and deployment are covered by `docs/DEPLOYMENT.md`.

### 3.3 Current status (update at the end of every step)

| Item | State |
|---|---|
| Phase | **11 complete.** Public site, backend and admin dashboard built; production hardening done. Phase 10 (accessibility/QA) remains |
| Public site | Home, About/Board/How We Work, Directory and profiles, Register, Donate (goals, checkout, thank-you, transparency, tribute), Events (listing, detail, RSVP, gallery), Community (feed, newsletter), Support and FAQ, Legal ×3 |
| Backend | Postgres schema and migrations, `/api/v1`, Better Auth, eSewa/Khalti with verified callbacks, admin API, health check and production env validation |
| Last change (23 Oct 2026) | Removed the mock adapter, simulator, demo checkout methods, demonstration copy and placeholder contacts. Production starts empty with real content. Added startup env checks, `/api/health`, a runtime migration runner, admin bootstrap and `DEPLOYMENT.md` |
| Next | **Production launch** (live merchant accounts, verified Resend domain, real content, legal review) and Phase 10 (accessibility audit, Lighthouse, cross-browser) |
| Quality gate | `typecheck`, `lint`, `npm test` (54 files, 299 tests), `npm run test:e2e` (106 passed, 10 skipped) and `npm run build` pass. Production smoke: `/api/health` 200, admin API 401 without a session, no admin content in the redirect HTML |
| Waiting on owner | Q2/Q3 (logo, brand colours, name), Q4, Q7–Q10, live merchant credentials, sending domain and real content |
| Placeholder in use | Text wordmark "BPKIHS Alumni Association" until a logo is supplied |

**Versions in use (22 Oct 2026):** Node 22.x, Next.js 16.4.0 (Turbopack, Cache Components, Partial Prefetching), React 19.3.0, Tailwind CSS v4, TypeScript 5, shadcn/ui 4.22 (Base UI, Nova), Zod, Vitest 5.0.3, Playwright (Chromium), Husky 9, lint-staged 17, lucide-react.

**Scripts:** `dev`, `build`, `start`, `lint`, `typecheck`, `format`, `format:check`, `test`, `test:watch`, `test:e2e`, `ci`.

**Components (`src/components`):**
- `layout/`: `container`, `section` (tone: default, tint, muted), `site-header`, `mobile-nav`, `bottom-bar`, `site-footer`, `page-header`
- `shared/`: `eyebrow`, `section-heading`, `donate-button`, `donate-link`, `form-field` (render-prop: `{(control) => <Input {...control} />}`), `stat-card`, `initials-avatar`, `empty-state`, `error-state`, `progress-bar`, `stepper`, `newsletter-form`
- `ui/` (shadcn, Base UI): `button`, `input`, `label`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `card`, `badge`, `tabs`, `accordion`, `dialog`, `sheet`, `progress`, `skeleton`, `pagination`, `breadcrumb`, `sonner`

**Feature folders (`src/features`):** `home`, `directory`, `register`, `donations`, `events`, `community`, `support`, `legal`, `governance`, `auth`. Each one holds its own components, data helpers and tests; pages in `src/app` stay thin.

**Static copy** lives in `src/content/*.ts` (typed, no JSX). Everything data-shaped still comes through `src/lib/api`.

**Base UI notes (shadcn components use Base UI primitives, not Radix):** `Checkbox` uses `CheckboxPrimitive.Root.Props`; `RadioGroup` and `RadioGroupItem` use Base UI radio props; `Select` exports `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectSeparator`. Check each component's `Props` type before wiring state (for example `onCheckedChange`, `onValueChange`).

**If the owner pastes an error:** fix that error first, then repeat the step's verification before moving on.

---

## 4. Research findings

### 4.1 bpkihs.edu (the institution)

Observed on 12 Oct 2026:

- Header: logo with name and "Dharan Sub-Metropolitan City, Koshi Province, Nepal"; utility links (Live Hospital Dashboard, Hello BPKIHS, Facebook, Contact).
- Main nav: Home, About (Introduction, Vision Mission Goal, Who is Who, Head of Departments, Administrative Support), Academic (Programs, Departments), Services (Hospital Services, Out-Patient Schedule), Research, Photo Gallery, Notice (General, Procurement, Academic, Institutional Magazine), Vacancy, Contact.
- Notices are **bilingual** (Nepali and English), so the font stack needs Devanagari support even though the UI is English only.
- Hero: "Center of Excellence" eyebrow, large headline, three CTAs.
- Programme groups: Undergraduate (MBBS, BDS, BSc Nursing, allied health), Postgraduate (MD/MS, MSc, MDS), Advanced and Research (DM/MCh, PhD, fellowships). **Use these for the directory's programme filter.**
- Vice-Chancellor message block (photo, name, role, short quote). Current VC shown on site: Prof. Dr. Smriti Karki.
- Notice board list with dates and download links; Downloads list; app download badges; officer contact cards; footer with Privacy, Terms, Accessibility.
- Image used for social sharing: `https://bpkihs.edu/file/show/images/BPKIHS520X320.jpg`.

> ⚠️ Exact brand colours and the logo file URL were **not** extractable from the page text. See `DESIGN.md` section 2 (provisional palette) and Open Question Q2.

### 4.2 dhanayogafoundation.org (closest model)

Persistent Donate button, a "we are transparent" funds pie chart, separate Board and Team pages, programme cards, newsletter signup, events. Weakness to avoid: lorem ipsum left on live pages.

### 4.3 aarogyanepaltech.com (secondary model)

Stat counters, partner logo strip, project and story cards, mixed Nepali and English content.

### 4.4 What we borrow

| Borrowed idea | From | Used in |
|---|---|---|
| Persistent donate CTA | DYF | Header and mobile bottom bar |
| Funds-use chart and transparency | DYF | `/donate/transparency` |
| Board and team pages | DYF | `/about/board` |
| Stat counters | Aarogya | Homepage stats band |
| Programme taxonomy | BPKIHS | Directory filters, registration form |
| Footer legal trio | BPKIHS | Footer |

---

## 5. Architecture (backend-ready, no rewrite later)

### 5.1 Layering

```
UI components  →  typed API client  →  /api/v1 Route Handlers  →  services  →  Postgres
                        (browser)              (or direct service calls from Server Components)
```

- Components never import the database or demo data.
- All browser data access goes through `lib/api/client.ts` and the typed contract.
- Server Components call the same services through `src/server/api` without a network hop.
- Every list endpoint supports `page`, `pageSize`, `q`, `sort` and returns `{ items, total, page, pageSize }`.

### 5.2 Rules

1. TypeScript strict mode on. No `any`.
2. A **Zod schema for every form**, shared by form validation and the API contract types (`z.infer`).
3. Server Components by default; Client Components only for interactivity.
4. Feature-based folders; shared UI in `components/ui`.
5. No hardcoded content in components. Copy lives in `content/` (typed objects) or comes from the API layer.
6. Every async view has **loading, empty, error and success** states.
7. Auth is abstracted behind `useAuth()` on the client and Better Auth cookie sessions on the server; the session survives a reload.
8. Money values are stored as integers in minor units (paisa/cents) with a currency code.
9. All images use `next/image` with alt text; remote hosts declared in config.
10. Do not use browser storage for anything critical; keep it to non-sensitive UI preferences.

### 5.3 Proposed folder structure

```
src/
  app/
    (public)/
      page.tsx                      # Home
      about/{page.tsx, board/, how-we-work/}
      directory/{page.tsx, [id]/page.tsx}
      register/page.tsx
      donate/{page.tsx, checkout/, thank-you/, transparency/, tribute/}
      community/{page.tsx, newsletter/}
      events/{page.tsx, [slug]/page.tsx}
      support/{page.tsx, faq/, helpdesk/}
      legal/{privacy/, terms/, accessibility/}
    admin/...                       # dashboard, guarded by session + role
    layout.tsx, not-found.tsx, error.tsx, loading.tsx
  components/
    ui/                             # shadcn primitives
    layout/                         # Header, Footer, MobileNav, DonateBar
    shared/                         # StatCard, SectionHeading, EmptyState, ...
  features/
    directory/ donations/ events/ community/ governance/ support/ auth/
      components/ hooks/ schemas.ts
  lib/
    api/{client.ts, contract.ts, http/, privacy.ts, types.ts}
    utils/ constants/ format/
  content/                          # static typed copy (about text, FAQ, legal)
  styles/tokens.css
  types/
```

---

## 6. Sitemap and routes

| Route | Page | Auth |
|---|---|---|
| `/` | Home | none |
| `/about` | About the Association | none |
| `/about/board` | Current and previous boards | none |
| `/about/how-we-work` | How We Work With BPKIHS | none |
| `/directory` | Alumni directory | none |
| `/directory/[id]` | Alumni profile (privacy-respecting) | none |
| `/register` | Register as alumni (public form) | none |
| `/donate` | Goals and giving | none to view |
| `/donate/checkout` | Amount, details, payment method | **login gate** |
| `/donate/thank-you` | Confirmation and receipt | after donation |
| `/donate/transparency` | Funds dashboard | none |
| `/donate/tribute` | Tribute / in-memory giving | login gate to submit |
| `/community` | Feed, share form and report action | none |
| `/community/newsletter` | Newsletter signup and preferences | none |
| `/events` | Events listing | none |
| `/events/[slug]` | Event detail and RSVP | none (RSVP form is public) |
| `/support` | Contact and helpdesk | none |
| `/support/faq` | FAQ | none |
| `/legal/privacy`, `/legal/terms`, `/legal/accessibility` | Trust pages | none |
| `/admin/*` | Admin dashboard | `admin` role |

---

## 7. Data model and API contract

Shapes returned by the real API. All IDs are strings; dates are ISO 8601.

### 7.1 Core types

```ts
type Programme =
  | 'MBBS' | 'BDS' | 'BMIT' | 'BSc Nursing' | 'Allied Health'
  | 'MD/MS' | 'MSc' | 'MDS' | 'DM/MCh' | 'PhD' | 'Fellowship';

type ApprovalStatus = 'pending' | 'approved' | 'rejected';
type Visibility = 'public' | 'alumni_only' | 'hidden';

interface Alumnus {
  id: string;
  fullName: string;
  programme: Programme;
  batchYear: number;               // graduation or batch year
  furtherStudies?: string;
  currentPosition?: string;
  organisation?: string;
  city?: string;
  country: string;
  note?: string;
  photoUrl?: string;
  email?: string;                  // visibility-controlled
  phone?: string;                  // visibility-controlled
  privacy: { email: Visibility; phone: Visibility; profile: Visibility };
  status: ApprovalStatus;
  source: 'self_registered' | 'csv_import';   // written register imported later
  placeholder?: boolean;
  createdAt: string;
}

interface DonationGoal {
  id: string; title: string; description: string;
  targetMinor: number; raisedMinor: number; currency: 'NPR' | 'USD';
  deadline?: string; imageUrl?: string; placeholder?: boolean;
}

interface DonationInput {
  goalId?: string;                 // undefined = general fund
  amountMinor: number; currency: 'NPR' | 'USD';
  method: 'esewa' | 'khalti' | 'connectips' | 'fonepay' | 'card' | 'paypal';
  anonymous: boolean;
  tribute?: {
    type: 'in_honour' | 'in_memory';
    recipientKind: 'batch' | 'mentor' | 'alumnus';
    name: string; message?: string; notifyEmail?: string;
  };
  eventId?: string;                // event-linked donation drive
}

interface FundsBreakdownItem { category: string; sharePercent: number; amountMinor: number }

interface BoardMember {
  id: string; name: string; role: string; term: string;
  batch?: string; photoUrl?: string; bio?: string; visionStatement?: string;
  isCurrent: boolean; placeholder?: boolean;
}

interface AlumniEvent {
  id: string; slug: string; title: string; summary: string; description: string;
  startsAt: string; endsAt?: string; venue: string; city: string; mode: 'in_person' | 'online' | 'hybrid';
  capacity?: number; rsvpCount: number; imageUrl?: string; status: 'upcoming' | 'past';
  goalId?: string;                 // linked donation drive
  gallery?: { type: 'photo' | 'video'; url: string; alt: string }[];   // past events
}

interface FeedPost {
  id: string; type: 'news' | 'story' | 'notice' | 'achievement' | 'event' | 'announcement' | 'in_memoriam';
  status: 'pending' | 'approved' | 'rejected';   // member posts are moderated
  title: string; excerpt: string; body: string; author: string;
  publishedAt: string; imageUrl?: string; tags: string[];
}

interface FaqItem { id: string; category: string; question: string; answer: string }
interface SiteStats {
  alumniCount: number; raisedMinor: number; activeProgrammes: number;
  countries?: number; eventsHeld?: number;
}
type HelpdeskTopic = 'account' | 'profile_verification' | 'donation_receipt' | 'general';
interface WelcomeMessage { author: string; role: string; text: string; videoUrl?: string; photoUrl?: string }
```

### 7.2 API functions (`lib/api/contract.ts`)

| Function | Returns |
|---|---|
| `getSiteStats()` | `SiteStats` |
| `listAlumni(params)` | Paginated `Alumnus` (approved and visible only) |
| `getAlumnus(id)` | `Alumnus` or 404 |
| `submitRegistration(input)` | `{ id, status: 'pending' }` |
| `listGoals()` / `getGoal(id)` | `DonationGoal` |
| `createDonation(input)` | `{ donationId, status, redirect? }` (real gateway) |
| `getFundsBreakdown()` | `FundsBreakdownItem[]` |
| `listBoard({ current })` | `BoardMember[]` |
| `listEvents(params)` / `getEvent(slug)` | `AlumniEvent` |
| `submitRsvp(eventId, input)` | `{ ok: true }` |
| `listFeed(params)` | Paginated `FeedPost` |
| `submitPost(input)` | `{ id, status: 'pending' }` (moderated) |
| `reportPost(id, reason)` | `{ ok: true }` |
| `getWelcomeMessage()` | `WelcomeMessage` |
| `subscribeNewsletter(email, interests)` / `updateNewsletterPrefs(email, optIn)` | `{ ok: true }` |
| `listFaq()` | `FaqItem[]` |
| `submitSupportTicket(input)` | `{ ticketId }` |
| `login(input)` / `signup(input)` / `logout()` | Better Auth session (donation gate and admin only) |

### 7.3 Data model

- The application starts with an empty database in production. The Association enters real content
  through the admin UI, SQL or Drizzle Studio.
- The written alumni register will later arrive via **CSV import** (`source: 'csv_import'`); the type already supports it.
- Real BPKIHS logo and images are used only where taken from bpkihs.edu (D4).

---

## 8. Page index (details in `DESIGN.md` section 8)

Home · About · Board · How We Work · Directory · Profile · Register · Donate · Checkout · Thank-you · Transparency · Tribute · Community · Newsletter · Events · Event detail · Support · FAQ · Legal ×3 · Admin ×N.

---

## 9. Definition of done (every page)

- [ ] Matches `DESIGN.md` spec for that page
- [ ] Responsive at 360, 768, 1024, 1440 px; no horizontal scroll
- [ ] Loading, empty, error and success states built
- [ ] All data via `lib/api`; no hardcoded content in components
- [ ] Forms validated with Zod; inline errors; focus moves to first error
- [ ] Keyboard navigable; visible focus; semantic landmarks; alt text
- [ ] Colour contrast AA; touch targets at least 44×44 px
- [ ] Lighthouse: Performance ≥ 90 mobile, Accessibility ≥ 95, SEO ≥ 95
- [ ] Page metadata (title, description, Open Graph) set
- [ ] `ROADMAP.md` ticked and Session Log updated

---

## 10. Performance and quality budget

- Target slow connections: LCP < 2.5 s on throttled 4G; initial JS per route kept small.
- Images: modern formats, responsive sizes, lazy-load below the fold.
- Fonts: at most two families, `font-display: swap`, subset where possible.
- No heavy animation libraries; CSS transitions first; honour `prefers-reduced-motion`.

---

## 11. Session log

| # | Date | What happened | Decisions / outputs |
|---|------|---------------|---------------------|
| 1 | 12 Oct 2026 | Reviewed proposal summary and three reference sites; asked 10 clarifying questions; confirmed decisions D1–D10; asked 3 more (look, homepage emphasis, file detail) | D11–D13 added. Created `CONTEXT.md`, `ROADMAP.md`, `DESIGN.md`. Proposal `.docx` not available in this session. |
| 2 | 12 Oct 2026 | Asked 3 more questions (look, homepage emphasis, file detail); fetched bpkihs.edu for structure; wrote the three files in full. Owner asked to start coding on Windows 11 + VS Code, one step at a time. **Step 1** completed (project created, runs). **Step 2** issued (tooling, structure, env, docs, first commit). | D14–D17 added. Working Protocol rules 8–9 added. Folder structure from §5.3 created in Step 2 (empty, `.gitkeep`). Awaiting "done" for Step 2. |
| 3 | 12 Oct 2026 | Steps 2–3 finished and committed (Prettier, strict TS, folders, env, docs; shadcn/ui init with Base UI + Nova, `button`). Found Next.js 16.4 and Tailwind v4. **Step 4** issued (fonts, tokens, metadata). | D18–D19 added. Colour fixes: `warning-600` darkened to `#9A6200`; added `accent-700` for donate hover (see `DESIGN.md` §2) |
| 4 | 12 Oct 2026 | Step 4 committed (fonts, tokens, metadata). **Step 5** image host + README. **Step 6** Husky, lint-staged, import sorting; hook proven by a deliberately broken commit that was blocked. **Step 7** replaced the `cn` package with `clsx` + `tailwind-merge`; Vitest + Testing Library (3 tests); fixed a pasted-into-wrong-file mistake (`button.tsx`) and a leftover `from 'cn'` import. **Step 8** Playwright (4 tests), `npm run ci`, missing `playwright.config.ts` fixed. | D20–D22 added. Phase 1 complete. Phase 2 plan drafted (Steps 9–14) |
| 5 | 12 Oct 2026 | Phase 1 closed (docs updated). **Step 9**: type scale and tokens, `Container`, `Section`, `Eyebrow`, `SectionHeading`, `DonateButton`/`DonateLink`, two tests; committed. **Step 10**: shadcn form controls, `FormField` with test; fixed a failing test (Testing Library `cleanup` added to `vitest.setup.ts`) and a pasted typo (`gap-1.5text-sm`). `npm run ci` passes (7 tests). Chat limit reached at this point. | D23–D24 added. Step 10 commit to be verified. Step 11 next |
| 6 | 12 Oct 2026 | Verified Step 10 commit (`92e70c1`); committed the Testing Library cleanup fix (`540a0b7`, `npm run ci` green, 7 tests). Read the proposal `.docx` and reconciled it with these docs. Owner chose "accept all" for the four conflicts and the smaller additions | D25–D28 added. Q1 and Q6 answered. Types in §7 extended. `ROADMAP.md` and `DESIGN.md` updated. Step 11 next |
| 7 | 22 Oct 2026 | Built the remaining public pages: Phases 2–5 shell, directory and profiles, then `/register`, the Donate flow (goals, checkout with mock sign-in gate and payment panels, thank-you, transparency, tribute), Events (listing, detail, RSVP, gallery), Community (feed, share, report, newsletter), Support/FAQ and the three legal pages. Fixed anonymous-viewer privacy: `alumni_only` records are hidden in the API layer while there is no sign-in, and the profile e2e now uses a public record | D29–D30 added. `README.md`, `ROADMAP.md` and this file synced. `format:check`, `typecheck`, `lint`, 393 unit tests, 102 e2e tests and `build` pass; all 21 public routes return 200 and unknown paths 404. Phase 9 (admin) and Phase 10 (audit) next |
| 8 | 22 Oct 2026 | Trimmed mock-only and non-proposal extras: removed the home partner strip, community notice board, newsletter archive placeholder, tribute sample wall, the disabled annual-report control and the dev-only `/styleguide`; simplified the affected page copy | The typed mock data layer stays because there is no backend (D2). Tests and e2e updated; 59 files / 391 unit tests, 92 e2e tests, 24-page build pass; `/styleguide` now 404 |
| 9 | 23 Oct 2026 | Built the admin dashboard against the real API (overview, registrations, posts, reports, tickets, donations). Then removed every demo path: mock adapter and `NEXT_PUBLIC_API_MODE`, payment simulator, card/PayPal/ConnectIPS/Fonepay checkout stubs, demonstration copy, sample badges and placeholder contacts; added `db:admin`, `db:migrate:prod`, startup env validation, `/api/health`, `check:env` and `docs/DEPLOYMENT.md` | One real data path (D2/D6 updated). Production smoke: health 200, public 200, admin API 401, admin page redirects without exposing content; migration and admin bootstrap tested on a throwaway database |
| 10 | 24 Oct 2026 | Completed the backend: content editor and APIs for events, goals, board, FAQ and welcome; newsletter subscribers and batched campaigns with `newsletter_campaigns`; admin audit screen. Hardened security to an ASVS Level 2 target: CSRF double-submit tokens, origin checks, bounded rate limiting with `Retry-After`, input size limits, session policy and admin idle timeout, audit logging, CSP/security headers, error redaction and request ids, dependency audit. Centralised operational values in `src/server/config.ts`; removed the demo data directory and unused Supabase dependency; added `docs/HOWTO.md` and `docs/SECURITY.md`. Fixed the missing `base_rsvp_count` and ticket `subject` columns with a catch-up migration | One guard for every admin mutation; content and campaigns verified in a production build against Postgres (create/edit event, audit rows). 53 test files / 295 unit tests, typecheck, lint and build pass; `npm audit --omit=dev` clean after upgrading Next to 16.4.3. Residual: no admin MFA, no breached-password lookup, CSP allows inline scripts because pages are prerendered, limiter is per process |

| 11 | 25 Oct 2026 | Registration now creates the member's account as well as the profile: password (12 characters minimum), a six-digit code emailed to the address, `/sign-in` and `/account`, and a resend button with a countdown. Better Auth's email-OTP plugin stores codes hashed, expires them in 15 minutes, allows five guesses and rate-limits sends per address. Approval refuses a self-registration whose address is unconfirmed, and an imported register row is claimed rather than duplicated | D25 rewritten, A3 superseded. `BACKEND.md`, `SECURITY.md`, `HOWTO.md`, `DESIGN.md` and the privacy copy updated. Verified against Postgres: register → code printed by the console transport → verify → `/account`; typecheck, lint, unit tests and build pass |

*Append a new row after every working session.*

---

## 12. Open questions (answer these next)

| # | Question | Default if unanswered |
|---|----------|----------------------|
| Q1 | ~~Re-upload the proposal~~ **Answered, see 12.1** | — |
| Q2 | Exact brand colours and the logo file for the Association (not just BPKIHS)? | Provisional palette in `DESIGN.md` |
| Q3 | Association name and tagline (e.g. "BPKIHS Alumni Association")? | "BPKIHS Alumni Association" |
| Q4 | Is there a domain or a Nepali-year (BS) date requirement? | Gregorian dates only |
| Q5 | Donation currencies: NPR only, or NPR and USD? | NPR only for now (D30); the data model already carries a currency code |
| Q6 | ~~Admin dashboard timing~~ **Answered, see 12.1** | — |
| Q7 | Should the directory show alumni photos? Consent wording? | Optional photo with consent checkbox |
| Q8 | Who is the contact for helpdesk copy and FAQ answers? (Proposal names Kushal Adhikari as Project Lead; that is the developer's contact, not Association copy) | Placeholder FAQ |
| Q9 | Social links to include (Facebook, LinkedIn, etc.)? | Facebook (from bpkihs.edu) |
| Q10 | Any compliance wording needed for donations (receipts, tax exemption, 80G-style)? | Generic "receipt by email" text |

---

## 12.1 Decision log for open questions (fill in when answered)

| # | Answer | Date |
|---|--------|------|
| Q1 | Proposal re-uploaded and reconciled (D25–D28) | 12 Oct 2026 |
| Q2 | | |
| Q3 | | |
| Q4 | | |
| Q5 | | |
| Q6 | Build admin UI in Phase 9, mock only (D27) | 12 Oct 2026 |
| Q7 | | |
| Q8 | | |
| Q9 | | |
| Q10 | | |

---

## 12.2 Windows 11 and VS Code notes (for the assistant)

- Shell is **PowerShell**. Use `New-Item`, `Copy-Item`, `Set-Content`; avoid `mkdir -p`, `cp`, `touch` unless noted.
- Multi-line values in PowerShell use a backtick `` ` `` for newline inside double quotes (``"a`nb"``).
- Keep line endings **LF** (`.gitattributes` and `.prettierrc` enforce this) to avoid Windows CRLF noise.
- If a script is blocked, the fix is `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (explain before suggesting).
- Open terminals in VS Code with **Ctrl + `**; run commands from the project root `C:\dev\bpkihs-alumni`.
- Stop the dev server with **Ctrl + C**.
- Folder names and generated files can differ slightly by `create-next-app` version; check before editing (for example `lint` may be `next lint` or `eslint`).

---

## 12.3 Lessons learned (Phase 1)

- **npm ERESOLVE conflicts** came from version peers (`@types/node` 20 vs Vitest wanting 22+; the newest `@vitejs/plugin-react` wanting Babel 8). Fix by picking compatible versions (`@types/node@^22`) or dropping the unneeded package, not by forcing.
- **Check which file you are editing.** Test code pasted into `button.tsx` replaced the real component. Restore with `git restore <file>`; every step is committed so this is always safe.
- **Hidden files:** a directory listing hides dotfiles. Use `Get-ChildItem -Force -Name` to see `.env.local`, `.prettierrc`, `.husky`, etc.
- **Playwright vs Vitest:** keep the test types apart (`*.spec.ts` in `e2e/` for Playwright, `*.test.ts(x)` in `src/` for Vitest) and set `testDir`/`testMatch` in the Playwright config.
- **`npm audit`:** the 7 high warnings are all inside shadcn's own CLI dependencies, not shipped code. Recheck in Phase 10.
- **Run the whole gate before committing.** The hook checks types and lint only, not tests. Run `npm run ci` first; a failing test can otherwise slip into a commit.
- **Testing Library cleanup:** with Vitest globals off, add `afterEach(cleanup)` in `vitest.setup.ts`, or tests see each other's output.
- **Pasting through PowerShell here-strings can drop spaces** (for example `gap-1.5text-sm`). After pasting a large block, scan for run-together class names or let Prettier and the tests catch them.
- **shadcn can re-introduce the old `cn` import** (`from 'cn'`). After every `shadcn add`, search for it and point it at `@/lib/utils`.

---

## 13. Glossary

- **Backend-ready:** the UI talks only to a typed API layer, so the transport can change without touching components.
- **Audit log:** `admin_audit_log`, the append-only record of administrator actions shown at `/admin/audit`.
- **Gate:** A point where login is requested (donation only).
