# DESIGN.md : BPKIHS Alumni Website (Frontend)

> Companion to `CONTEXT.md` and `ROADMAP.md`.
> **Direction (D11):** Hybrid : *institutional trust with a modern layout.*
> **Homepage emphasis (D12):** Balanced mix of donations, directory/registration, and events/community.
> **Status:** Palette and fonts are **provisional** until the Association logo and brand colours are confirmed (Context Q2).
> **Implementation:** Tokens are applied in code in Phase 1 Step 3 and Phase 2. See section 11 for how they map to Tailwind and shadcn/ui.

---

## 1. Design principles

1. **Trust first.** This is a medical institution. Calm, credible, no gimmicks. Real structure, real names, clear numbers.
2. **Modern, not flashy.** Generous whitespace, clean cards, one strong hero, restrained motion.
3. **Balanced paths.** Three equal doors from the homepage: *Give*, *Find / Join alumni*, *Attend / Read*.
4. **Transparent by default.** Every donation surface shows where money goes.
5. **Mobile-first, desktop-rich.** Design at 360 px, then enhance.
6. **Accessible always.** WCAG 2.2 AA is a requirement, not a polish step.
7. **Honest content.** No lorem ipsum and no sample records in production; empty states are designed.

**Tone of voice:** respectful, warm, plain English. "Welcome back", not "Greetings esteemed alumni." Short sentences. No jargon.

---

## 2. Colour system (provisional)

Inspired by medical-institutional blue with a warm accent. **Verify against the real logo before build.**

| Token | Hex (provisional) | Use |
|---|---|---|
| `--color-primary-900` | `#0B2A4A` | Header, footer, headings on light |
| `--color-primary-700` | `#12467A` | Primary buttons, links |
| `--color-primary-500` | `#2A6BB0` | Hover, charts |
| `--color-primary-100` | `#E6EEF7` | Tints, section backgrounds |
| `--color-accent-600` | `#B4532A` | Donate CTA (warm, stands out from blue) |
| `--color-accent-500` | `#D9722F` | Highlights, icons, large graphics. **Not for white text** (3.3:1) |
| `--color-accent-700` | `#8F3F1D` | Donate hover and pressed state (white text 7.2:1) |
| `--color-accent-100` | `#FBEBDD` | Donation tint |
| `--color-success-600` | `#1F7A4D` | Success, "approved" |
| `--color-warning-600` | `#9A6200` | Warnings, "pending" (darkened from `#A66A00`, which was 4.49:1 on white) |
| `--color-danger-600` | `#B3261E` | Errors |
| `--color-neutral-900` | `#16202B` | Body text |
| `--color-neutral-600` | `#4A5866` | Secondary text |
| `--color-neutral-300` | `#CBD3DB` | Borders |
| `--color-neutral-100` | `#F4F6F8` | Page alt background |
| `--color-white` | `#FFFFFF` | Surfaces |

**Rules**
- Donate is the only element in the warm accent, so it is always findable.
- Donate hover **darkens** (accent-700); never lighten it under white text.
- shadcn's `accent` utility (`bg-accent`) is a subtle hover tint mapped to primary-100. The warm donate colour is `accent-600/500/700`. Do not mix them up.
- Body text on white must meet 4.5:1; large text 3:1. Check every pairing before finalising.
- Never use colour alone to convey state (add icon and text).
- Light mode only (A1).

---

## 3. Typography

| Role | Font | Fallbacks | Notes |
|---|---|---|---|
| Headings | **Source Serif 4** (600–700) | Georgia, serif | Adds institutional gravity |
| Body / UI | **Inter** (400, 500, 600) | system-ui, sans-serif | Clear at small sizes |
| Devanagari | **Noto Sans Devanagari** | sans-serif | For bilingual notices copied from bpkihs.edu |

**Scale (mobile → desktop)**

| Style | Mobile | Desktop | Weight / line-height |
|---|---|---|---|
| Display (hero) | 36 px | 56 px | 700 / 1.1 |
| H1 | 30 px | 44 px | 700 / 1.15 |
| H2 | 24 px | 34 px | 600 / 1.2 |
| H3 | 20 px | 24 px | 600 / 1.3 |
| Body L | 18 px | 18 px | 400 / 1.6 |
| Body | 16 px | 16 px | 400 / 1.6 |
| Small | 14 px | 14 px | 400 / 1.5 |
| Eyebrow | 12 px | 13 px | 600, uppercase, +0.08em tracking |

Body never below 16 px on mobile. Max line length ~70 characters.

---

## 4. Spacing, layout and shape

- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96 px.
- **Container:** max width 1200 px, side padding 16 px (mobile) / 24 px (tablet) / 32 px (desktop).
- **Section rhythm:** 48 px vertical (mobile), 96 px (desktop).
- **Grid:** 4 columns (mobile), 8 (tablet), 12 (desktop), 24 px gutter.
- **Breakpoints:** `sm 640`, `md 768`, `lg 1024`, `xl 1280`.
- **Radius:** 8 px (inputs, buttons), 12 px (cards), 9999 px (chips/avatars).
- **Elevation:** `shadow-sm` for cards at rest, `shadow-md` on hover; borders preferred over heavy shadows.

---

## 5. Components

### 5.1 Global layout

**Header (desktop)**
- Row 1 (utility, thin): link to bpkihs.edu, Contact, Support.
- Row 2: logo + name left; nav centre; **Donate button** (accent) and **Register** (outline) right.
- Nav: About · Directory · Events · Community · Donate · Support.
- Sticky on scroll with reduced height.

**Header (mobile)**
- Logo (compact) and a menu button. Full-screen menu sheet with large links, then Donate and Register.
- **Bottom action bar** (always visible on mobile): `Donate` · `Find alumni` · `Events`. Hide on checkout pages.

**Footer**
- Columns: About the Association · Get involved · Support · Legal.
- Newsletter signup row, social icons, BPKIHS link, contact details from `CONTACT_*` variables.
- Bottom line: © 2026 BPKIHS Alumni Association · Privacy · Terms · Accessibility.

### 5.2 Component list

| Component | Variants / notes |
|---|---|
| Button | primary, secondary (outline), donate (accent), ghost, destructive; sizes sm/md/lg; loading state |
| Input, Select, Textarea, Checkbox, Radio, Switch | Label above, helper text, inline error with icon |
| Combobox | For country, programme, batch |
| Card | basic, goal card, event card, person card, post card |
| StatCard | Number, label, icon; animated count-up respecting reduced motion |
| ProgressBar | For goals; shows raised, target, percent, supporters |
| Badge/Chip | status (pending/approved), programme, "Sample" |
| Tabs | For board (Current / Previous), FAQ categories |
| Accordion | FAQ, "How we work" |
| Dialog / Sheet | Mobile filters, login gate, RSVP |
| Pagination | Numbered on desktop; "Load more" on mobile feeds |
| Toast | Success and error confirmations |
| Skeleton | For every list and card |
| EmptyState | Illustration-free, icon + sentence + action |
| Breadcrumb | On inner pages |
| FundsChart | Pie or donut with legend and table fallback |
| Stepper | Registration and checkout |

### 5.3 Interaction and motion

- Transitions 150–200 ms ease-out; hover lifts of 2 px on interactive cards only (`.card-lift`):
  a lift promises a click, so static panels (board ledgers, contact details without links) stay still.
- Card links nudge their trailing arrow 2 px right on hover; post photos zoom 3% within the
  clipped corners. Both are `motion-safe:` so reduced-motion users keep the colour/shadow cue.
- Count-up on stats once when visible.
- Honour `prefers-reduced-motion`: remove count-up and lifts.
- No auto-playing carousels. Any carousel needs pause controls and arrow buttons.

### 5.4 Imagery

- The home hero uses the institute's own campus photograph: `public/hero-bpkihs-campus.jpg`,
  cropped 2:1 from the banner `bpkihs.edu` publishes (520×320 source, scaled up; the navy wash
  keeps the softness from reading). The credit is rendered beneath the hero CTAs and must stay
  while that file is in use. When the communications office supplies a higher-resolution
  original, replace the file and update the credit in `src/content/home.ts`.
- Use BPKIHS campus and institutional images from bpkihs.edu (D4), cropped consistently (16:9 hero, 4:3 cards, 1:1 avatars).
- Home community cards are photo-led: a post's `imageUrl` fills a 16:9 band at the top of the card (`object-cover`, decorative `alt` because the title sits beside it). The URL is author-supplied, so `next/image` renders it unoptimized rather than adding every possible host to the optimiser allowlist.
- A post without a photo keeps the same 16:9 band as a `primary-100` panel with the post type's icon at 45 % `primary-700`, so a mixed row still lines up. The compact `/community` listing stays text-only.
- Overlay hero images with a primary-900 wash plus a left-to-right primary-900 gradient, so the
  copy never sits on a bright part of the photograph and the image still shows on the open side.
- Every image has meaningful alt text; decorative images use empty alt.
- Avatars: initials fallback with a tinted background.

---

## 6. Responsive behaviour

| Area | 360 px | 768 px | 1024+ px |
|---|---|---|---|
| Nav | Menu sheet + bottom bar | Menu sheet | Full inline nav |
| Hero | Full-bleed photo, text over a navy overlay | Same, taller | Same, photo opens up on the right |
| Card grids | 1 column | 2 columns | 3–4 columns |
| Directory filters | Bottom sheet | Collapsible panel | Sticky left sidebar |
| Tables | Card list | Scroll container | Full table |
| Forms | 1 column | 1–2 columns | 2 columns where logical |

No horizontal page scroll at any width. Test at 360, 390, 768, 1024, 1440.

---

## 7. Accessibility checklist (applies everywhere)

- [ ] Skip-to-content link; one `<h1>` per page; logical heading order
- [ ] Landmarks: header, nav, main, footer
- [ ] Focus ring always visible (2 px primary-700 with offset)
- [ ] Forms: labels, `aria-describedby` for hints and errors, errors announced, first error focused
- [ ] Dialogs trap focus and return it on close; Escape closes
- [ ] Charts have a text/table alternative
- [ ] Touch targets ≥ 44×44 px
- [ ] Contrast AA; no information by colour alone
- [ ] Respect reduced motion; no flashing content
- [ ] Link text meaningful ("Read the board", not "Click here")
- [ ] Accessibility statement page (`/legal/accessibility`) with contact for issues

---

## 8. Page specifications

Each spec lists **sections**, **content**, **states**, **data**, and a **checklist**.

### 8.1 Home `/`

**Goal:** Give a first-time visitor three clear paths with equal weight and build trust quickly.

**Sections (in order)**
1. **Hero:** eyebrow "BPKIHS Alumni Association"; headline (placeholder: "Once BPKIHS, always BPKIHS"); one-line mission; three equal CTAs: *Give*, *Find alumni*, *Join the network*. Background: full-bleed campus photograph under a primary-900 wash and left-to-right gradient, with the photo credit beneath the CTAs.
2. **Stats band:** alumni registered, funds raised, active programmes (`getSiteStats`); countries and events held optional.
3. **Three doors:** cards for Donate / Directory + Register / Events + Community, each with a short line and arrow link.
4. **Featured giving:** top 2–3 goals with progress bars and a "See all goals" link.
5. **Upcoming events:** next 3 events, with date block and RSVP link.
6. **From the community:** 3 latest posts (news, story, achievement), each a photo-led card from the post's `imageUrl` with a type-icon panel when there is no photo.
7. **Board preview:** president + 3 members, link to full board.
8. **Welcome message from the Association** (modelled on BPKIHS's Vice-Chancellor block): photo, name, role, short message as text or an embedded video (`getWelcomeMessage`; placeholder).
9. **Newsletter signup** strip.

**States:** skeletons for stats, goals, events, posts; each block hides gracefully if empty.
**Checklist:** [ ] hero [ ] stats [ ] three doors [ ] goals [ ] events [ ] posts [ ] board [ ] message [ ] newsletter

---

### 8.2 About `/about`, Board `/about/board`, How We Work `/about/how-we-work`

**About:** mission, vision, history timeline (placeholder), what the Association does, link to BPKIHS.
**Board:** Tabs *Current board* / *Previous boards*. Person cards (photo, name, role, term, batch). Click opens a dialog with bio and personal vision statement. Previous boards grouped by term year.
**How We Work With BPKIHS:** accordion explaining the relationship, decision-making, how funds are handled, and how alumni can get involved.
**Data:** `listBoard({ current })`; static copy in `content/`.
**Checklist:** [ ] about [ ] board tabs [ ] member dialog [ ] how-we-work accordion [ ] breadcrumbs

---

### 8.3 Directory `/directory` and Profile `/directory/[id]`

**Goal:** Let alumni find each other, with privacy respected.

**Layout:** search bar at top (name, specialisation, location/country); filters (programme incl. BMIT, batch year, country/city, "further studies"); a persistent Donate button; results as person cards (photo or initials, name, programme, batch, position, location). Sorting: name, batch (newest/oldest).
**Filters:** sticky sidebar on desktop; bottom sheet on mobile with an "Apply" button and an active-filter chip row.
**Privacy:** only `approved` and `public`/`alumni_only` records appear. Hidden email and phone are never rendered. A notice: "Profiles show only what each alumnus chose to share."
**Profile page:** name, photo, programme, batch, position, location, further studies, note, and contact options only if allowed. A **Donate** button on every profile. "Back to directory" link.
**States:** skeleton grid, empty ("No alumni match these filters" + reset), error with retry.
**Pagination:** 12 per page.
**Checklist:** [ ] search [ ] filters desktop [ ] filters mobile sheet [ ] cards [ ] pagination [ ] empty/error [ ] profile [ ] privacy copy

---

### 8.4 Register `/register`

**Goal:** Submit a profile and create the account that owns it (D25). The profile lands as `pending`.

**Stepper (3 steps)**
1. **About you:** full name, programme, batch year, country, city.
2. **Career:** current position, organisation, further studies, short note, optional photo with a
   separate publication-consent checkbox. The file waits in the browser until the email code
   confirms the account, then uploads to `/account/profile`-quality storage.
3. **Account and privacy:** email (required, for verification), phone (optional), password and confirmation (8 characters minimum), visibility switches for email, phone and profile, consent checkbox, terms link.

**Validation:** Zod schema; inline errors; progress saved per step in memory only.
**Verify step:** after submitting, the form is replaced by a code screen naming the address, with a matching-code input, a resend button that counts down, and links back to sign in.
**Success:** "Thank you. Your email is confirmed and your profile is pending approval" with the reference, a link to `/account` and a link to the Directory.
**Sign-in:** `/sign-in` (email + password, no indexing) and `/account` (review state, confirm a late address, sign out).
**Checklist:** [x] 3 steps [x] validation [x] photo upload with consent [x] success [x] error [x] keyboard flow

---

### 8.5 Donate `/donate`

**Goal:** Make giving easy and trustworthy.

**Sections**
1. **Intro:** why give; a one-line transparency promise with link to `/donate/transparency`.
2. **Goal cards:** image, title, description, progress bar (raised / target, percent), supporter count, *Give to this goal* button. A "General fund" card sits first.
3. **Quick amounts:** preset chips (NPR 1,000 / 2,500 / 5,000 / custom; USD equivalents) with currency toggle.
4. **Where it goes:** small funds donut with link to transparency.
5. **Tribute giving:** teaser card linking to `/donate/tribute`.
6. **Trust row:** "Receipt by email", "Secure payment" (UI copy only), contact for questions.

**Checklist:** [ ] general fund card [ ] goal cards [ ] progress bars [ ] amount chips [ ] currency toggle [ ] funds teaser [ ] tribute teaser [ ] trust row

### 8.6 Checkout `/donate/checkout`

**Flow (stepper, 3 steps)**
1. **Amount:** goal, amount, currency, anonymous toggle, optional tribute details.
2. **Login gate (D3):** dialog or step: *Sign in* or *Create account* through Better Auth. Explains "We ask you to sign in only to give, so we can send your receipt." A restored session skips this.
3. **Payment method:** two groups.
   - **Nepal:** eSewa, Khalti
   Selecting a method shows a redirect notice. The submit button creates a pending donation and sends the browser to the gateway; card and wallet details are entered on the provider's page, never here.

**Summary panel:** sticky on desktop, collapsible on mobile; shows goal, amount, fees note (placeholder), total.
**States:** processing, success → `/donate/thank-you`, failure with retry and "try another method."
**Rules:** hide the mobile bottom bar here; never collect card numbers on this site. The gateway handles them.
**Checklist:** [ ] amount step [ ] login gate [ ] method groups [ ] each method panel [ ] summary [ ] processing/failure [ ] focus and errors

### 8.7 Thank-you `/donate/thank-you`

Confirmation with pending and failed states, summary, "receipt sent to your email", share buttons (no tracking), next steps (join an event, register, newsletter).
**Checklist:** [ ] summary [ ] receipt note [ ] next steps

### 8.8 Transparency `/donate/transparency`

Totals raised and spent; **FundsChart** (donut) with a data table beside it; breakdown by category (placeholder categories: scholarships, equipment, events, operations).
**Checklist:** [ ] totals [ ] chart + table

### 8.9 Tribute `/donate/tribute`

Explains in-honour and in-memory giving; form (type, recipient: batch, mentor or alumnus, name, message, optional notification email, amount) that routes into checkout.
**Checklist:** [ ] explainer [ ] form

---

### 8.10 Community `/community` and Newsletter `/community/newsletter`

**Community:** filter chips (All, News, Stories, Achievements, Event, Announcement, In Memoriam, Notices); card feed with image, title, excerpt, author, date; "Load more." A **Share an update** form (no login; submits as pending, with a "reviewed before it appears" notice) and a **Report** action on each post.
**Newsletter:** signup form (email, interests checkboxes) and subscribe/unsubscribe preferences, privacy note.
**Checklist:** [ ] filter chips [ ] feed cards [ ] share-an-update form [ ] report action [ ] signup [ ] preferences [ ] post detail view (modal or page)

---

### 8.11 Events `/events` and detail `/events/[slug]`

**Listing:** Tabs *Upcoming* / *Past*; event cards with date block, title, venue, mode badge, RSVP count; filter by city and mode.
**Detail:** hero, date/time, venue and map placeholder, description, agenda, speakers (placeholder), capacity meter, a donation-drive card when the event has a linked goal, **RSVP form** (name, email, guests; no login), add-to-calendar button (UI), share.
**States:** full event shows "Waitlist" wording; past events show a recap with a photo and video gallery (placeholder).
**Checklist:** [ ] tabs [ ] cards [ ] detail [ ] RSVP form [ ] capacity [ ] past recap [ ] calendar button

---

### 8.12 Support `/support`, FAQ `/support/faq`

**Support:** contact cards (email, phone, address, hours – placeholders), helpdesk form (name, email, topic: account, profile verification, donation receipt or general; message), response-time note, link to FAQ.
**FAQ:** search plus category tabs; accordion; "Still need help?" CTA.
**Checklist:** [ ] contact cards [ ] helpdesk form [ ] success state [ ] FAQ search [ ] accordion

---

### 8.13 Legal `/legal/privacy`, `/legal/terms`, `/legal/accessibility`

Readable long-form template with a table of contents, last-updated date, and print-friendly layout. Copy is **placeholder pending legal review**; mark clearly.
**Checklist:** [ ] 3 pages [ ] TOC [ ] last-updated [ ] print styles

---

### 8.14 Admin dashboard UI `/admin` (built)

Screens: Overview (stats), Alumni approvals queue (approve/reject with reason), Post moderation queue and reported posts, Donations list, Posts manager, Support tickets. Events manager and CSV import remain to build.
Desktop-first with a responsive sidebar. Same design tokens as public site.
**Checklist:** [x] overview [x] approvals [x] donations [ ] events [x] posts [x] tickets [ ] CSV import UI

---

### 8.15 System pages

- **404:** friendly message, search, links to Home, Directory, Events.
- **Error:** retry button and support link.
- **Loading:** skeleton variants per page type.
- **Maintenance:** simple notice page.

---

## 9. Content rules

- Headlines: sentence case. Buttons: verbs ("Give now", "Join the network").
- Dates: `12 Oct 2026`. Money: `NPR 5,000` with an optional `≈ USD 37` line.
- Numbers in stats and progress bars are derived from real rows (alumni, goals, donations).
- No stock-photo people presented as real alumni. If photos are needed, use initials avatars.

## 10. Design handoff checklist (before building each page)

- [ ] Spec confirmed with the product owner
- [ ] Tokens used, no hardcoded colours
- [ ] Mobile layout defined first
- [ ] All four states designed (loading, empty, error, success)
- [ ] Copy reviewed for tone
- [ ] Accessibility checklist (section 7) reviewed

---

## 11. Implementation notes: tokens in code

Applies from Phase 1 Step 3. The goal is that **changing the brand means editing one file** (`src/styles/tokens.css`).

### 11.1 Rules

1. Every colour, font, radius and shadow is defined once as a CSS variable in `src/styles/tokens.css`.
2. Tailwind's theme reads those variables; components use Tailwind classes (`bg-primary-700`), never raw hex values.
3. shadcn/ui's semantic variables (`--background`, `--foreground`, `--primary`, `--ring`, and so on) are **mapped onto** these tokens, so shadcn components inherit the brand automatically.
4. The warm accent is exposed only through the `donate` button variant and donation tints (section 2 rule).
5. Check which Tailwind version `create-next-app` installed (recent versions use Tailwind v4 with a CSS-first `@theme` block; older ones use `tailwind.config.ts`). Map tokens the way that version expects.

### 11.2 Token file outline (`src/styles/tokens.css`)

```css
:root {
  /* brand (provisional) */
  --color-primary-900: #0b2a4a;
  --color-primary-700: #12467a;
  --color-primary-500: #2a6bb0;
  --color-primary-100: #e6eef7;
  --color-accent-600: #b4532a;
  --color-accent-500: #d9722f;
  --color-accent-700: #8f3f1d;
  --color-accent-100: #fbebdd;

  /* status */
  --color-success-600: #1f7a4d;
  --color-warning-600: #9a6200;
  --color-danger-600: #b3261e;

  /* neutrals */
  --color-neutral-900: #16202b;
  --color-neutral-600: #4a5866;
  --color-neutral-300: #cbd3db;
  --color-neutral-100: #f4f6f8;

  /* shape */
  --radius-control: 8px;
  --radius-card: 12px;

  /* fonts are injected by next/font as CSS variables */
  --font-heading: var(--font-source-serif), Georgia, serif;
  --font-body: var(--font-inter), system-ui, sans-serif;
  --font-devanagari: var(--font-noto-devanagari), sans-serif;
}
```

### 11.3 shadcn/ui mapping (concept)

| shadcn variable | Points to |
|---|---|
| `--background` | `--color-white` |
| `--foreground` | `--color-neutral-900` |
| `--primary` / `--primary-foreground` | `--color-primary-700` / white |
| `--secondary` | `--color-primary-100` |
| `--muted-foreground` | `--color-neutral-600` |
| `--border`, `--input` | `--color-neutral-300` |
| `--ring` | `--color-primary-700` |
| `--destructive` | `--color-danger-600` |
| `--radius` | `--radius-control` |

### 11.4 Fonts

- Load **Inter**, **Source Serif 4** and **Noto Sans Devanagari** with `next/font/google` in `src/app/layout.tsx`, each with `variable` and `display: 'swap'`, and apply the variables on `<html>`.
- Subsets: `latin` for the first two; `devanagari` for the third.
- Headings use the serif; body and UI use Inter; Devanagari applies only to Nepali text (a `lang="ne"` wrapper).

### 11.5 Contrast pairs to verify in Phase 2

| Foreground | Background | Needed |
|---|---|---|
| white | primary-700 | 4.5:1 (buttons) |
| white | accent-600 | 4.5:1 (donate button) |
| neutral-600 | white | 4.5:1 (secondary text) |
| neutral-600 | neutral-100 | 4.5:1 |
| primary-700 | primary-100 | 4.5:1 (links on tinted sections) |
| success / warning / danger-600 | white | 4.5:1 (status text) |

---

## 12. Change log

| Date | Change |
|---|---|
| 12 Oct 2026 | Initial design system and page specs (Sessions 1–2) |
| 12 Oct 2026 | Added section 11 (implementation notes) ahead of Phase 1 Step 3 |
| 12 Oct 2026 | Reconciled with the proposal (Session 6): welcome video, stats, BMIT, search scope, tribute recipient, member posting and moderation, event donation drives and galleries, helpdesk topics |
