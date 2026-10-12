# CONTEXT.md — BPKIHS Alumni Website (Frontend)

> **Purpose:** One file to paste or upload into any new chat so work continues without loss.
> **Companion files:** `ROADMAP.md` (phases and checklists) and `DESIGN.md` (visual system and per-page specs).
> **Scope:** Frontend only. Do not design or write backend code yet. Everything must be backend-ready.
> **Last updated:** 12 Oct 2026 (Session 9: Phase 3 data layer complete)

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
| D2 | Backend | None yet. Mock data behind a typed API layer; swapping to a real backend must not require UI rewrites |
| D3 | Login | No login across the public site. **Login/signup is requested only when a person chooses to donate** (mock auth gate for now) |
| D4 | Branding | Use logos and images from bpkihs.edu |
| D5 | Language | English only. Do not build i18n yet (but keep strings out of deep logic so it can be added) |
| D6 | Payments | **UI only**, national and international options; no real gateway |
| D7 | Process | Build pages straight away; no separate wireframe approval step |
| D8 | Content | No digital content exists (the alumni register is on paper). Use clearly labelled placeholders |
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
| D25 | Registration (proposal §2.2) | Public form, **no account** (A3 stands). The proposal's "create account" is a backend concern; the mock `useAuth()` is designed so registrants and donors can share one account later |
| D26 | Community posting (proposal §2.4) | Feed is read-only plus a **"Share an update" form** (no login) that submits as `pending` for moderation, and a **Report** button on posts. Post tags: Achievement, Event, Announcement, In Memoriam (plus News, Story, Notice). Newsletter has signup **and** subscribe/unsubscribe management; the automated digest is backend work |
| D27 | Admin dashboard | Stays in the plan as Phase 9 (approval and moderation queues depend on it). Q6 answered: build it, mock only, after the public pages |
| D28 | Proposal additions | `BMIT` programme; board `visionStatement`; stats = alumni, funds raised, active programmes; search by name, specialisation, location/country; Donate button on every profile; tribute recipient (batch, mentor, alumnus); event-linked donation drives; past-event galleries; helpdesk topics (account, profile verification, donation receipt); welcome message as text or video |
| D29 | Toasts | `sonner` via shadcn, fixed to the light theme; no `next-themes` dependency |
| D30 | Currency | **NPR only** (Q5). No USD toggle or amounts. Money stays integer minor units with a currency code |
| D31 | Logo | Institute logo `public/bp-koirala_logo.png` beside the text wordmark. An Association logo replaces it by editing `src/content/site.ts` |
| D32 | Form control borders | Use `neutral-500` (`#7b8794`, 3.66:1 on white) so inputs meet WCAG 2.2 non-text contrast; cards and dividers keep `neutral-300` |
| D33 | API contract names | The contract uses `login` and `signup` (not `mockLogin` and `mockSignup`); the word "mock" belongs to the adapter. Methods take the Zod input objects, for example `reportPost(id, { reason })` and `subscribeNewsletter({ email, interests })` |
| D34 | Viewer and privacy | The public site has no login, so every visitor is treated as an alumnus viewer and `alumni_only` details are visible. Hidden and unapproved profiles return `not_found`, identical to a missing id. Hidden fields are removed from the object, never blanked |
| D35 | Mock session | `useAuth()` keeps the session in memory only; a reload signs out. It is mounted around checkout in Phase 6, not site-wide |
| D36 | Simulation | Mock calls take 300 to 800 ms in development, never fail unless `NEXT_PUBLIC_MOCK_ERROR_RATE` is set, and have no delay or errors under test. A failed call changes no data |
| D37 | Adapter mode | `NEXT_PUBLIC_API_MODE` must be `mock` or `http`; blank means mock; anything else throws |

### 3.2 Reasonable assumptions (change any of these)

- A1: Light mode only; accessibility target WCAG 2.2 AA.
- A2: Payment methods shown in UI: eSewa, Khalti, ConnectIPS, Fonepay QR (national); card and PayPal-style option (international). UI only.
- A3: Alumni registration is a public form with **no account**; it submits to the mock API and is "pending approval".
- A4: The admin dashboard UI is built last, behind a mock gate, and may be deferred (Q6).
- A5: Currency is NPR only (see D30).
- A6: Hosting and deployment are out of scope for now.

### 3.3 Current status (update at the end of every step)

| Item | State |
|---|---|
| Phase | **4 - Home and About/Governance** (plan next, awaiting approval). Phases 1 to 3 complete |
| Done so far | **Phase 2**: tokens, type scale, layout and form primitives, surfaces, overlays, feedback, header, mobile menu, bottom bar, footer, skip link, 404/error/loading, contrast audit, e2e tests, dev-only `/styleguide`. **Phase 3**: `lib/api` types and Zod schemas, `ApiClient` contract (22 methods), adapter switch, mock adapter (simulation, privacy, moderation), http stub, sample data, NPR and date formatters, list helpers, `useAuth` (not mounted yet), shared contract test suite |
| Next | **Phase 4**: home page and About, Board and How We Work. Plan first, wait for "approved". Decide the data-fetching pattern for Cache Components with the first page |
| Quality gate | `npm run ci` (format check, typecheck, lint, unit tests, build); 265 unit tests in 27 files; `npm run test:e2e` 34 passed, 6 skipped (viewport-specific). Pre-commit hook runs lint-staged and typecheck |
| Waiting on owner | Association-specific logo and brand colours (Q2/Q3; institute logo and provisional palette in use meanwhile); Q4, Q7 to Q10. Q1, Q5 and Q6 answered |
| Placeholder in use | Institute logo plus text wordmark "BPKIHS Alumni Association" until an Association logo is supplied |

**Versions in use (12 Oct 2026):** Node 22.23, Next.js 16.4.0 (Turbopack, Cache Components, Partial Prefetching), React 19.3.0, Tailwind CSS v4, TypeScript 5, shadcn/ui 4.21 (Base UI, Nova), Vitest 5.0.3, Playwright (Chromium), Husky 9, lint-staged 17, lucide-react, zod.

**Scripts:** `dev`, `build`, `start`, `lint`, `typecheck`, `format`, `format:check`, `test`, `test:watch`, `test:e2e`, `ci`.

**Components built so far (`src/components`):**
- `layout/`: `container`, `section` (tone: default, tint, muted), `site-header`, `mobile-nav`, `bottom-bar`, `site-footer`, `nav-styles`
- `shared/`: `eyebrow`, `section-heading`, `donate-button`, `donate-link`, `form-field`, `stat-card`, `empty-state`, `error-state`, `progress-bar` (also exports `getPercent`), `stepper`, `newsletter-form`
- `ui/` (shadcn, Base UI): `accordion`, `badge`, `breadcrumb`, `button`, `card`, `checkbox`, `dialog`, `input`, `label`, `pagination`, `progress`, `radio-group`, `select`, `sheet`, `skeleton`, `sonner`, `switch`, `tabs`, `textarea`
- Unit tests (Vitest): `nav`, `contrast`, `utils`, `button`, `section-heading`, `donate-button`, `form-field`, `newsletter-form`, `progress-bar`, `stepper`, `states`
- E2E tests (Playwright, `e2e/`): `home`, `navigation`, `skip-link`, `not-found`, `no-overflow`, `styleguide`
- `src/app/page.tsx` is a **temporary page** (Phase 4 replaces it); `/styleguide` is dev only and returns 404 in production
**Data layer built so far (`src/lib`, `src/features`):**
- `constants/domain.ts`: value lists (programmes, visibility, payment methods, post types and so on) shared by the types, the schemas and the UI
- `api/`: `types.ts`, `schemas.ts` (form input), `record-schemas.ts` (stored records), `errors.ts` (`ApiError`), `contract.ts` (`ApiClient`, 22 methods), `client.ts` (`getApiClient()`), `list-helpers.ts`, `queries.ts`, `contract-suite.ts`
- `api/mock/`: `index.ts` (adapter), `store.ts`, `privacy.ts`, `simulate.ts`, `validate.ts`, `data/` (seeds)
- `api/http/`: stub that rejects every call with `not_implemented`
- `format/`: `money.ts` (`formatNpr`, `formatNprCompact`, `rupees`), `dates.ts` (Nepal time, fixed month names)
- `features/auth/auth-context.tsx`: `AuthProvider` and `useAuth()` (not mounted yet)
- Seeds: about 60 alumni (all three statuses, hidden profiles), 6 goals (general fund first), 14 board members over 3 terms, 12 events, 14 posts (one pending, one rejected), 10 FAQ items, 1 welcome message
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
| Notice board pattern | BPKIHS | Alumni notices on home and `/community` |
| Programme taxonomy | BPKIHS | Directory filters, registration form |
| Footer legal trio | BPKIHS | Footer |

---

## 5. Architecture (backend-ready, no rewrite later)

### 5.1 Layering

```
UI components  →  feature hooks / server actions  →  API client interface  →  adapter
                                                       (typed contract)       ├─ mockAdapter  (now)
                                                                              └─ httpAdapter  (later)
```

- Components **never** import mock JSON directly.
- All data access goes through `lib/api/` functions that return typed promises.
- A single env flag selects the adapter: `NEXT_PUBLIC_API_MODE=mock | http`.
- Every list endpoint supports `page`, `pageSize`, `q`, `sort` and returns `{ items, total, page, pageSize }`.
- Mock adapter simulates latency (300–800 ms) and occasional errors so loading and error states get built properly.

### 5.2 Rules

1. TypeScript strict mode on. No `any`.
2. A **Zod schema for every form**, shared by form validation and the API contract types (`z.infer`).
3. Server Components by default; Client Components only for interactivity.
4. Feature-based folders; shared UI in `components/ui`.
5. No hardcoded content in components. Copy lives in `content/` (typed objects) or comes from the API layer.
6. Every async view has **loading, empty, error and success** states.
7. Auth is abstracted behind `useAuth()`; the mock implementation stores a fake session in memory/cookie. Real auth swaps in later.
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
    (admin)/admin/...               # Phase 9, mock gate
    layout.tsx, not-found.tsx, error.tsx, loading.tsx
  components/
    ui/                             # shadcn primitives
    layout/                         # Header, Footer, MobileNav, DonateBar
    shared/                         # StatCard, SectionHeading, EmptyState, ...
  features/
    directory/ donations/ events/ community/ governance/ support/ auth/
      components/ hooks/ schemas.ts
  lib/
    api/{client.ts, mock/, http/, types.ts}
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
| `/community` | Feed, notices | none |
| `/community/newsletter` | Newsletter signup and archive | none |
| `/events` | Events listing | none |
| `/events/[slug]` | Event detail and RSVP | none (RSVP form is public) |
| `/support` | Contact and helpdesk | none |
| `/support/faq` | FAQ | none |
| `/legal/privacy`, `/legal/terms`, `/legal/accessibility` | Trust pages | none |
| `/admin/*` | Admin dashboard UI (mock gate) | mock admin |

---

## 7. Data model and mock API contract

Shapes the backend must later match. All IDs are strings; dates are ISO 8601.

### 7.1 Core types

> The code is now the source of truth: `src/lib/api/types.ts` (shapes), `schemas.ts` (form input, with `z.infer` input types) and `record-schemas.ts` (stored records). The block below is the original design and may lag behind it. Currency is NPR only (D30).

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
  targetMinor: number; raisedMinor: number; currency: 'NPR';
  deadline?: string; imageUrl?: string; placeholder?: boolean;
}

interface DonationInput {
  goalId?: string;                 // undefined = general fund
  amountMinor: number; currency: 'NPR';
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

### 7.2 Mock API functions (`lib/api`; see D33 for the final names)

| Function | Returns |
|---|---|
| `getSiteStats()` | `SiteStats` |
| `listAlumni(params)` | Paginated `Alumnus` (approved and visible only) |
| `getAlumnus(id)` | `Alumnus` or 404 |
| `submitRegistration(input)` | `{ id, status: 'pending' }` |
| `listGoals()` / `getGoal(id)` | `DonationGoal` |
| `createDonation(input)` | `{ donationId, status, receiptUrl? }` (mock) |
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
| `mockLogin(email)` / `mockSignup(input)` | session (donation gate only) |

### 7.3 Placeholder rule

- All seeded data carries `placeholder: true`.
- In development, placeholder content shows a small "Sample" tag; a `SHOW_PLACEHOLDER_BADGES` constant controls it.
- Names and organisations are **fictional**. No real person's data is ever used as a placeholder.
- Real BPKIHS logo and images are used only where taken from bpkihs.edu (D4).
- The written alumni register will later arrive via **CSV import** (`source: 'csv_import'`); the type already supports it.

---

## 7.4 Notes from building the data layer (Phase 3)

- `submitRsvp` returns `{ ok: true }` for both a confirmed place and a waitlist entry. Phase 7 needs the result to say which; add `waitlisted: boolean` to `OkResult` for RSVP and update the contract and tests then.
- Seed dates are fixed around 12 Oct 2026. Event `status` comes from the data, not the clock, so past and upcoming tabs stay stable.
- The funds breakdown is recomputed from the goals on every read, so it always adds up to the total raised.
- Registrations and member posts are stored as `pending` and stay invisible; there is no approval method yet (Phase 9 admin).
- A backend adapter must pass `src/lib/api/contract-suite.ts`.

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
| 6 | 12 Oct 2026 | Verified Step 10 commit (`92e70c1`); committed the Testing Library cleanup fix (`540a0b7`, `npm run ci` green, 7 tests). Read the proposal `.docx` and reconciled it with these docs. Owner chose "accept all" for the four conflicts and the smaller additions | D25–D28 added. Q1 and Q6 answered. Types in §7 extended. `ROADMAP.md` and `DESIGN.md` updated. Steps 11 to 13 done (see 3.3); D29 to D31 added. Step 14 next |
| 7 | 12 Oct 2026 | Steps 11 to 13 finished and committed locally (nothing pushed): surfaces and feedback components, `/demo` page, header with institute logo, mobile menu, bottom bar, footer with newsletter strip, skip link, main landmark, 404, error and loading pages. Docs updated for NPR only and the logo. Step 14a (colour contrast audit test) issued | D29 to D31 added. Open finding: input border `neutral-300` is about 1.5:1 on white, WCAG 2.2 wants 3:1; propose a darker input border token (about `#7B8794`) in the styleguide step and ask the owner first |
| 8 | 12 Oct 2026 | **14a** contrast audit finished (21 tests): added `neutral-500` (`#7b8794`, 3.66:1) for form control borders and mapped `--input` to it; 3:1 checks for focus ring, large text and graphics. **14b** e2e tests for navigation, skip link, 404 and no sideways scroll at 1440 and 360 px (Playwright viewports changed); they caught a duplicate `<main>` and a second `<h1>` on the temporary home page, both fixed. **14c** dev-only `/styleguide` (404 in production, colours read from `tokens.css`) replaces `/demo`; home page trimmed. **14d** README restored and updated, docs cleanup. Owner approved `/styleguide`; **Phase 2 closed**. `typecheck` now runs `next typegen` first. Lessons: PowerShell `$home` is reserved; `export const dynamic` is not allowed with Cache Components; deleting `.next` removes the generated `LayoutProps` type (run `npx next typegen`); Playwright reuses a running dev server, so stop it after big changes | D32: form control borders use `neutral-500` |
| 9 | 12 Oct 2026 | **Phase 3 built, one sub-step at a time.** 3a types, domain constants, Zod schemas. 3b money and date formatters, list helpers, query functions. 3c `ApiClient` contract, adapter switch, simulation helpers, http stub. 3d about 60 sample alumni, then goals, boards, events, posts, FAQ, welcome message, with strict record schemas. 3e mock adapter, reads then writes (privacy, moderation, validation, waitlist, donations). 3f `useAuth`. 3g shared contract suite and docs. Lessons: a script that removes a test by exact text fails silently once Prettier reflows it (match on the title); `git status` before each commit, because two seed commits were skipped and had to be made together | D33 to D37 |

*Append a new row after every working session.*

---

## 12. Open questions (answer these next)

| # | Question | Default if unanswered |
|---|----------|----------------------|
| Q1 | ~~Re-upload the proposal~~ **Answered, see 12.1** | — |
| Q2 | Exact brand colours and the logo file for the Association (not just BPKIHS)? | Provisional palette in `DESIGN.md` |
| Q3 | Association name and tagline (e.g. "BPKIHS Alumni Association")? | "BPKIHS Alumni Association" |
| Q4 | Is there a domain or a Nepali-year (BS) date requirement? | Gregorian dates only |
| Q5 | ~~Donation currencies~~ **Answered, see 12.1** | - |
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
| Q5 | NPR only, no USD toggle (D30) | 12 Oct 2026 |
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
- **shadcn can re-introduce the old `cn` import** (`from 'cn'`). After every `shadcn add`, search for it and point it at `@/lib/utils`. Search for both quote styles, because eslint and Prettier rewrite the quotes.
- **`shadcn add -y` overwrites existing files** (it replaced our fixed `button.tsx`). Run it without `-y`, answer **no** to any overwrite prompt, or `git restore` the file afterwards.
- **shadcn `sonner` pulls in `next-themes`.** We are light only (D19), so `sonner.tsx` was rewritten with `theme="light"` and `next-themes` removed.
- **A mangled paste can create a stray file** in the project root. Prettier fails on it. Check `git status --short` for unexpected `??` entries and delete them with `Remove-Item -LiteralPath`.
- **Do not name a PowerShell helper `R`.** It is a built-in alias for `Invoke-History` and wins over functions. Use `Rep` and `W`.
- **Terminal copy drops a space where a long line wraps.** A pasted result can show `(seeD30)` when the file is fine. Verify with a regex count on the file before assuming damage.
- **A re-run of an edit script prints `NOT FOUND` for every edit that already applied.** That is not a failure. Check the file before debugging.
- **Keep pasted replacement lines short.** Long single-line anchors are hard to verify; prefer short inner-text anchors.
- **Prettier re-pads markdown tables.** When scripting edits to the docs, match short inner text, not text that touches a table pipe.

**Phase 3 lessons**
- Never put Markdown backticks inside a PowerShell double-quoted string: a backtick followed by `n` becomes a newline and splits the line (this corrupted the D32 row). Use single-quoted strings or here-strings.
- `$home` is a reserved PowerShell variable. Name script variables something else (`$homePageSource`).
- A script that removes a test by exact text fails silently once Prettier reflows the file. Match on a short title and print a red NOT FOUND.
- Run `git status --short` before each commit. Two seed-data commits were skipped and had to be made later.
- Next 16 with Cache Components rejects `export const dynamic` on a route.
- Deleting `.next` removes the generated `LayoutProps` type. `typecheck` now runs `next typegen` first.
- Playwright reuses a running dev server, so stop it (and clear `.next`) after large changes.

---

## 13. Glossary

- **Backend-ready:** UI talks only to a typed API layer, so replacing the mock adapter with a real one does not change components.
- **Placeholder:** Fictional sample data, flagged and labelled.
- **Gate:** A point where login is requested (donation only).
