# Proposal compliance and correctness audit

**Date:** 26 October 2026
**Proposal:** `BPKIHS_Alumni_Website_Proposal_final.docx` (Kushal Adhikari, September 2026)
**Repository state:** working tree at `C:\dev\bpkihs-alumni` on 26 Oct 2026, including the uncommitted
welcome-section removal and support-form changes. This audit is against the working tree, not
`HEAD`.

**How the audit was done**

1. Extracted the full proposal text from the `.docx` (96 paragraphs; the body ends after the SDLC
   table).
2. Mapped proposal §2.1–2.8 to the corresponding pages, API routes, services, schemas and admin
   screens.
3. Cross-checked against the project documents (`README.md`, `docs/TRACKER.md`,
   `docs/ROADMAP.md`, `docs/BACKEND.md`, `docs/DEPLOYMENT.md`, `docs/HOWTO.md`,
   `docs/CONTEXT.md`, `HANDOVER.md`).
4. Ran the repository checks and the whole browser suite on 26 Oct 2026 (results in §6).
5. Walked the changed support flow and home/navigation in a real browser.

Status words used below:

| Status | Meaning |
| --- | --- |
| **Built** | Implemented, covered by checks, usable |
| **Built : blocked** | Code is complete; needs a credential, domain or content from the Association |
| **Partial** | The main path exists but a proposal detail is missing or contradicts another decision |
| **Missing** | Not implemented |
| **Removed** | Was implemented, deleted on 26 Oct 2026 |

---

## 0. Update : the findings below were acted on the same day

A second pass worked through §7 in order. Where each finding stands now:

| Finding | Status after the remediation pass (26 Oct 2026) |
| --- | --- |
| **F1 : welcome message removed** | **Fixed.** The home section, `GET /api/v1/site/welcome`, `PUT /api/v1/admin/content/welcome` (with the video and photo URL fields) and the fixtures are back; the section still hides itself while the text is empty. |
| **F2 : directory behind sign-in** | **Fixed.** `/directory` and `/directory/[id]` read the viewer without a session, the API answers 404 (not 401) for records hidden from that viewer, a guest banner offers sign-in/join, and **Directory** is back in the main navigation. `alumni_only` enforcement moved exactly as the fix proposed: it stays in the API, not the UI. New coverage in `e2e/roles.spec.ts` and `e2e/sign-in-return.spec.ts`. |
| **F3 : funds breakdown cannot be entered** | **Fixed.** A **Funds breakdown** tab under `/admin/content` and `/api/v1/admin/content/funds` create, edit and delete allocation rows; shares are refused past 100%, a partial plan shows the remainder as an unallocated line, and `/donate/transparency` renders an empty state instead of an empty donut. `DEPLOYMENT.md` §7 now describes what the editor really covers. |
| **F4 : contact form requires an account** | **Fixed.** `POST /api/v1/contact` plus a separate no-account form on `/support` (name, email, organisation, subject, message) write into the same ticket queue; the member helpdesk keeps its ask-on-submit sign-in flow. Same-origin and the 5/min `support` limit apply. |
| **F5 : no staff authoring, no member photos** | **Fixed.** `/admin/posts` gained `POST`/`PATCH`/`DELETE` for staff news, notices, events and announcements (published on save) with a composer beside the untouched moderation queue, and the member share form takes an optional https or site-relative photo URL shown on the post page. |
| **F6 : documentation drift** | **Fixed in one pass.** `README.md`, `HANDOVER.md`, `docs/TRACKER.md`, `docs/BACKEND.md`, `docs/HOWTO.md`, `docs/DEPLOYMENT.md`, `docs/ROADMAP.md` and `docs/CONTEXT.md` now describe the restored welcome routes, the public directory, the funds editor, the contact form, the staff composer, the digest and the import's publish choice : with current counts. |
| **F7 : CSV import publishes without consent** | **Fixed in code, sign-off still open.** The import asks **publish now** or **hold for review** and defaults to holding: rows become pending registrations invisible in the directory until an admin approves them or the person claims the record. The Association should still confirm the lawful basis for publishing claimed register rows. |
| **F8 : stats cached for a day** | **Left as is.** Deliberate (`use cache`, `cacheLife('days')`); flagged for the Board if “live” is a promise. |
| **F9 : allocation described as spend** | **Fixed by wording.** `/donate/transparency` now says it shows the *planned* allocation of what has been raised, not money already spent, and points at separately published statements. Adding an expense ledger remains a Board decision. |
| **F10 : dead welcome schema/table** | **Moot.** The `welcome_message` table and schema are in use again. |
| **F11 : one stale e2e test** | **Fixed**, and extended with anonymous-browsing coverage. |
| **F12 : tribute notification never sent** | **Fixed.** A confirmed gift emails the named person (never the amount, never an anonymous donor) and `/admin/donations` shows the tribute, its type and whether the person was notified. |
| **F13 : proposal has no Cost section** | **Still absent** from the document; only the cover promises it. |

**Verification after the pass:** `format:check`, `typecheck`, `lint`, **370 unit tests**, a
production build, and the full browser suite at **267 passed, 0 failed, 70 skipped**.

What is left is §1's external blockers (A1–A5), the manual accessibility/device passes, the
Association's sign-off on F7, and installing the backup, health-check and digest cron entries.

---

## 1. Executive summary

The project is much further along than a prototype: all eight functional areas have real pages,
a Postgres schema, a typed API, authentication and roles, payments, email, an admin dashboard,
and a substantial automated test suite. All eight areas are implemented; the material gaps are
concentrated in four of them (the leadership block, directory access, transparency data and
community authoring), with smaller issues in support and tribute.

It is **not launch-ready**, for two different classes of reason:

1. **External blockers** : live merchant credentials, a verified sending domain, real Association
   content, legal sign-off, and DNS/TLS. These are the five items in `TRACKER.md` section A.
2. **Product decisions that no longer match the proposal** : the leadership welcome message was
   removed on 26 Oct, the directory is entirely behind sign-in (so public privacy settings never
   apply), the funds breakdown has no way to be entered, and the general contact form now requires
   an account to send.

The highest-value work left is not more features; it is reconciling those four product gaps, then
finishing the launch checklist.

**Scoreboard:** 37 proposal requirements reviewed : 24 built, 2 built but blocked on
credentials, 9 partial, 1 missing (automated digest), 1 removed (welcome message). The
proposal's own promised “Cost” section is absent from the document.

---

## 2. Requirement-by-requirement status

### 2.1 Landing page and identity

| Proposal requirement | Status | What exists | Gap / note |
| --- | --- | --- | --- |
| Welcome message from leadership (text or video) | **Removed** | Nothing renders now. The section was deleted from the home page, admin content editor, API and fixtures on 26 Oct. | Proposal §2.1 is no longer met. Even before removal the implementation was **text-only**; the deleted component said “Text-only welcome message (no video, per the owner)”. Restore a short greeting or record the Board's approval to drop it. |
| Board member profiles : photo, name, role, vision | **Built** | `/about/board`, current/previous tabs, member dialog with bio and vision; admin editor under `/admin/content`. | Copy and photos still need real content (A3). |
| Mission and vision, relationship to BPKIHS | **Built** | `/about` and `/about/how-we-work`; draft copy with review notice. | Association sign-off still open (A4). |
| Live snapshot stats : alumni, funds raised, programmes | **Built** | `StatsBand` on the home page; counts come from the database. | Cached with `use cache` + `cacheLife('days')` ([get-home-data.ts](../src/features/home/get-home-data.ts#L8)), so “live” means up to a day old. Acceptable for traffic, but not real-time. |
| Primary CTA bar: Find Alumni / Donate / Register | **Built** | Hero has three equal CTAs (“Give now”, “Find alumni”, “Join the network”); header has Donate and Register. | The directory was removed from the header/mobile navigation on 26 Oct, so “Find alumni” is no longer a persistent header action. Footer and home still link to it. |

### 2.2 Alumni directory (core feature)

| Proposal requirement | Status | What exists | Gap / note |
| --- | --- | --- | --- |
| Self-service registration, no admin data entry | **Built** | `/register` three-step form creates the account, emails a one-time code, stores a `pending` profile; `/admin/alumni` approves or rejects with a reason. CSV import is an optional bulk path. | Approval requires a confirmed email. Imported rows bypass this and are created approved (see finding F7). |
| Programme filter : MBBS, BDS, BMIT, Nursing, others | **Built** | `PROGRAMMES` has 11 values including MBBS, BDS, BMIT, BSc Nursing, Allied Health, MD/MS, MSc, MDS, DM/MCh, PhD and Fellowship. | : |
| Batch/year filter | **Built** | Filter form + active-filter chips; options come from listed profiles. | : |
| Profile fields : further studies, position, location, note | **Built** | Further studies, current position, organisation, city, country, note, expertise tags. | : |
| Optional photo upload | **Built** | `/register` and `/account/profile`; JPEG/PNG/WebP up to 5 MB, consent checkbox, `sharp` re-encode, EXIF stripped, 512×512 WebP; served through a privacy-checked route. | Needs persistent `PHOTO_UPLOAD_DIR` and backup on the host. |
| Search : name, specialisation, location/country | **Built** | Query covers name, programme, current position, organisation, further studies, city, country and expertise. | : |
| Verification : self-declared, admin approval before public | **Built** | Pending → approved/rejected; rejected members can correct and resubmit; approval promotes the account role. | : |
| Privacy controls : alumni choose what is publicly visible | **Partial** | Three visibility values per field (`public`, `alumni_only`, `hidden`), enforced in the API and privacy helpers. | The **entire directory and every profile page are behind a sign-in gate** ([directory-content.tsx](../src/features/directory/directory-content.tsx#L32), [[id]/page.tsx](../src/app/directory/%5Bid%5D/page.tsx#L24)). A signed-out visitor sees a sign-in card instead of the records, so “public” has no public audience and shared profile links do not work. This contradicts decision D29 (“the public site can be browsed anonymously … hidden in the API layer, not in the UI”). High-severity finding F2. |

### 2.3 Donations and fundraising

| Proposal requirement | Status | What exists | Gap / note |
| --- | --- | --- | --- |
| Persistent donate button on home, directory, every profile | **Built** | Hero CTA, directory results header/footer link, `DonateLink` on each profile, header Donate. | : |
| Named goals with target and live progress bar | **Built** | `/donate`; goals and progress come from Postgres; admin can create/edit goals under `/admin/content`. | Progress only moves when a gateway confirms a payment; offline totals can be entered by an admin. |
| Transparency dashboard : breakdown of funds used | **Partial** | `/donate/transparency` renders a donut, table, total raised, active goals and recent gifts. Amounts are derived from `donation_goals.raised_minor`; category shares come from `funds_breakdown`. | There is **no admin UI or API to create the `funds_breakdown` rows and no seed**, so a clean install shows an empty donut and an empty table. The page also shows an allocation plan, not audited spend. `DEPLOYMENT.md` incorrectly says the content editor covers “the funds breakdown”. High-severity finding F3. |
| Automated receipts on every donation | **Built : blocked** | `completeDonation()` moves the goal total, records the payment event and emails a receipt; Resend transport. | Needs a verified Resend domain and `EMAIL_FROM` (A2). A failed email does not undo the donation. |
| Tribute giving : batch, mentor, alumnus | **Partial** | `/donate/tribute`, tribute fields carried through checkout and stored on the donation. | The “Notify someone by email” field is collected and stored but **no message is ever sent**, and the tribute details are not shown to admins or the public. There is no public tribute wall (deliberately removed). Finding F12. |
| Secure payment gateway integration | **Built : blocked** | eSewa ePay v2, Khalti ePayment v2 and ConnectIPS (signed form, server-side validation, short stored reference); signed/verified callbacks, idempotent completion, payment-event log, CSP allowance for gateway POSTs. | Sandbox only until the Association provides live merchant keys and gateway URLs (A1). ConnectIPS/ Fonepay are not named in the proposal; they were agreed as an extension on 29 Oct 2026. ConnectIPS is built (C7a) and waits on NCHL's UAT pack; Fonepay waits on its current integration document (C7b). |

### 2.4 Community and newsletter

| Proposal requirement | Status | What exists | Gap / note |
| --- | --- | --- | --- |
| Alumni social feed : updates, achievements, event photos, announcements | **Partial** | `/community` feed with types, post detail pages, moderated submission form for signed-in members. | Members **cannot attach a photo** to a post (`memberPostSchema` has no image field), so “event photos” in the feed are not supported. Members can only submit story, achievement, notice and In Memoriam; news, event and announcement posts are staff-only **but there is no staff composer either**, so those types can only come from direct database/fixture writes. Finding F5. |
| Post tagging : Achievement, Event, Announcement, In Memoriam | **Partial** | Seven post types, tag chips, filters; member types map to labels. | See above: Event and Announcement cannot be authored through any UI. |
| Moderation queue and reporting | **Built** | `/admin/posts` approve/reject with reason; `/admin/reports` reviewed/dismissed; public report dialog. | : |
| Automated newsletter digest from feed highlights | **Missing** | `/admin/newsletter` sends a manually written campaign in batches with unsubscribe links. | No scheduler, digest builder or periodic send. Correctly tracked as open item C8. |
| Newsletter opt-in management | **Built** | Signup with interests, preferences page, unsubscribe token, admin subscriber list and campaign log. | : |

### 2.5 Governance and team

| Proposal requirement | Status | What exists |
| --- | --- | --- |
| Know the Team : current board, roles, bios | **Built** | `/about/board`, member dialog, vision statement, admin editor. |
| Previous boards archive by term | **Built** | “Previous” tab grouped by term, empty state, admin `isCurrent` flag. |
| “How We Work With BPKIHS” page | **Built** | `/about/how-we-work`, linked in the About navigation and footer. |

### 2.6 Events

| Proposal requirement | Status | What exists | Gap / note |
| --- | --- | --- | --- |
| Upcoming events with RSVP | **Built** | Listing with upcoming/past tabs, search, capacity meter, waitlist behaviour, `.ics` download, confirmation email. | : |
| Past event photo/video galleries | **Built** | Past-event detail renders photo grids and video links; admin enters gallery JSON URLs. | Media are external URLs; no upload pipeline for event galleries. |
| Event-linked donation drives | **Built** | Optional `goalId` on an event; detail page shows the linked `GoalCard`. | : |

### 2.7 Support and contact

| Proposal requirement | Status | What exists | Gap / note |
| --- | --- | --- | --- |
| General contact form for institutional inquiries | **Partial** | `/support` has one helpdesk form with a “General enquiry” topic; contact cards show email/phone/address/hours from environment values. | Since 26 Oct, a visitor can write the form but **must sign in to send it**, so an institution without an account cannot send a message. The proposal separates the general contact form from the member helpdesk. Finding F4. |
| Helpdesk for account, profile verification, donation receipt | **Built** | Topic list matches; signed-in messages carry the member identity; admin ticket queue with status changes; ticket reference returned. | : |
| FAQ page | **Built** | Search, categories, accordion, empty state, contact CTA. | Answers are placeholders until A3/A4. |

### 2.8 Trust, compliance and admin

| Proposal requirement | Status | What exists | Gap / note |
| --- | --- | --- | --- |
| Privacy Policy | **Partial** | `/legal/privacy` with TOC, draft review notice. | Draft only; no legal review (A4). |
| Terms of Use | **Partial** | `/legal/terms`, same draft status. | : |
| Accessibility statement | **Partial** | `/legal/accessibility`, draft. | Needs a real conformance statement after the manual pass. |
| Admin dashboard for profiles, posts, donations, events | **Built** | `/admin`: overview, alumni approval/reject, CSV import, post moderation, reports, tickets, donation ledger + CSV export, content editor for events/goals/board/FAQ, newsletter, audit log, MFA. | No post composer (only moderation) and no funds-breakdown editor. |

---

## 3. What has been done correctly

These are not claims from the docs; they were checked in code and/or by running the suite.

- **Architecture and data**: one real data path, typed contract shared by HTTP and server adapters,
  Zod schemas as the validation spec, Drizzle/Postgres migrations, no mock adapter, no demo seed in
  the application.
- **Authentication and roles**: Better Auth email/password, verified email for approval, donor /
  alumni / admin roles, admin guard and idle timeout, TOTP with backup codes, session revocation on
  rejection.
- **Security**: same-origin checks and double-submit CSRF on mutations, per-IP rate limiting,
  request size caps, CSP/security headers, audit log, production environment validation, bounded
  multipart photo reading, re-encoded images.
- **Payments**: eSewa signature verification and Khalti server-side lookup, amount check,
  idempotent completion, payment-event log, receipt email, CSP form-action allowances.
- **Directory mechanics**: registration with email code, pending queue, approval/rejection,
  privacy trimming in the API, photo consent, expertise tags, search/filter/sort/pagination.
- **Events and governance**: RSVP with capacity/waitlist, calendar download, linked goals, past
  galleries, current/previous boards grouped by term.
- **Community safety**: post moderation with reasons, reporting, role-limited member post types,
  newsletter opt-in/unsubscribe.
- **Operations**: health endpoint, migration runner, admin bootstrap/recovery, backup and
  healthcheck scripts (tooling), deployment runbook, legal drafts, sitemap/robots/JSON-LD.
- **Quality gates**: format, typecheck, lint, 354 unit tests and a production build pass; the full
  Playwright suite is green at **259 passed, 70 skipped, 0 failed**. Automated axe scans (WCAG 2.1
  A/AA) and keyboard/focus checks run on every public page; Firefox and WebKit smoke projects pass.

---

## 4. What is left

### 4.1 Launch blockers (external, from `TRACKER.md` A)

1. **Live merchant credentials** for eSewa and/or Khalti, `PAYMENT_MODE=live`, live gateway URLs.
2. **Verified Resend sending domain** (SPF, DKIM, DMARC) and a real `EMAIL_FROM`.
3. **Real Association content**: board names/photos, FAQ answers, giving goals, events, contact
   details. (The welcome message is no longer part of the product : see F1.)
4. **Legal and privacy sign-off** on the three legal pages.
5. **Domain, DNS and TLS**, with `APP_URL` and `NEXT_PUBLIC_SITE_URL` matching.

### 4.2 Product gaps that still need work

6. **Reconcile the directory access model** : un-gate public profiles (and keep `alumni_only`
   hidden in the API), or explicitly make the directory members-only and change the privacy
   model/copy/decision record. Restore a visible “Find alumni” entry point.
7. **Decide the welcome message** : restore a short leadership greeting (proposal §2.1) or record a
   Board-approved scope change and update every document that still promises it.
8. **Give the funds breakdown an authoring path** : admin editor or API plus sensible defaults, and
   an empty state on `/donate/transparency`. Decide whether the page shows allocation or actual
   spend.
9. **Provide an anonymous contact channel** for institutional inquiries, or state clearly that the
   helpdesk is members-only and offer a public email address.
10. **Staff post authoring and member photos** : or formally scope these out of the feed.
11. **Send the promised tribute notification** and show tribute details in the admin donation view
    (F12).
12. **Scheduled newsletter digest** (C8) : needs a scheduler/hosting decision.
13. **Install backups and monitoring** on the production host (cron entries, off-box copy, uptime
    monitor).
14. **Choose persistent photo storage** and include it in backups; object storage if the host is
    ephemeral or multi-instance.
15. **Manual accessibility and device passes** (D4/D8): screen reader, real iOS/Android, Edge.
16. **Optional hardening**: breached-password lookup (HIBP) and shared rate limiting for more than
    one instance. ConnectIPS/Fonepay are no longer optional: they were agreed on 29 Oct 2026.
    ConnectIPS is built (`TRACKER.md` C7a) and needs NCHL's UAT pack; Fonepay is blocked on its
    current integration document (C7b).

### 4.3 The proposal document itself

- The cover promises **“Vision • Features • Development Process • Cost”**, but the document has no
  cost section; it ends after the SDLC table and the 9–10 week estimate.
- The proposal's UI/UX phase (wireframes + Board review) was replaced by decision D7 (“build pages
  straight away”). That is a process change, not a code defect, but it should be acknowledged in
  the handover.

---

## 5. What has been done incorrectly or needs attention

Ordered by impact. “Evidence” links point at the current working tree.

### F1 : High : The leadership welcome message is gone, but the proposal still requires it

- Proposal §2.1 asks for “Welcome message from the Association's leadership (text or video)”.
- On 26 Oct the home section, home loader, admin editor, API routes, contract methods, fixtures and
  test were deleted; `welcome_message` remains in the schema but nothing reads or writes it.
- Even before removal it was **text-only** (the deleted view explicitly said no video), so the
  video option from the proposal was never implemented.
- Documentation still promises the feature: [README.md](../README.md#L140),
  [BACKEND.md](./BACKEND.md#L91), [HOWTO.md](./HOWTO.md#L190),
  [DEPLOYMENT.md](./DEPLOYMENT.md#L129), [TRACKER.md](./TRACKER.md#L32),
  [HANDOVER.md](../HANDOVER.md#L215).

**Impact:** the public landing page no longer meets the signed proposal, while the handover
documents tell a maintainer to edit a screen and call an endpoint that no longer exist.

**Fix:** bring back a short, optional leadership message (photo + quote is enough), or get the
Board to approve dropping it and then remove every reference above plus the dead table.

### F2 : High : The directory is entirely behind sign-in, which defeats its own privacy model

- `/directory` renders `SignInGate` when there is no session
  ([directory-content.tsx](../src/features/directory/directory-content.tsx#L32)).
- `/directory/[id]` does the same for every profile, public or not
  ([[id]/page.tsx](../src/app/directory/%5Bid%5D/page.tsx#L24)).
- The data layer already supports anonymous viewing: privacy rules hide `alumni_only` and
  `hidden` fields per viewer ([privacy.ts](../src/lib/api/privacy.ts)).
- Decision D29 says the public site is browsable anonymously and privacy is enforced in the API,
  not the UI. The gate is the opposite.
- The proposal's search, privacy controls and “Find Alumni” CTA all assume people can look before
  they join. Removing Directory from the header on 26 Oct makes the core feature even harder to
  reach.

**Impact:** the core feature is invisible to signed-out alumni and to search engines; “public vs
alumni-only” choices have no observable meaning; shared profile links dead-end at a sign-in card.

**Fix:** let signed-out visitors browse public profiles and the list, keep `alumni_only`/`hidden`
enforced by the API, and keep the directory in the main navigation (or a prominent header CTA).
If members-only is intentional, update D29, the privacy copy and the proposal mapping instead of
leaving the contradiction.

### F3 : High : The funds breakdown cannot be entered, and the docs say it can

- `funds_breakdown` is a table with `category`, `sharePercent`, `period`, `sortOrder`.
- The only reader is `getFundsBreakdown()`; there is no admin route, no editor tab, no seed and no
  migration that inserts rows.
- `/admin/content` manages events, goals, board and FAQ only
  ([content-manager.tsx](../src/features/admin/content/content-manager.tsx#L30)).
- `/donate/transparency` still renders the donut and table, so a clean database produces an empty
  chart and an empty table.
- `DEPLOYMENT.md` §7 says content entered through `/admin/content` includes “the funds breakdown”;
  that is false.

**Impact:** a launch checklist item cannot be completed through the product; the transparency
page looks broken on the empty production database.

**Fix:** add a small admin editor/API for breakdown rows (or seed documented defaults), render an
empty state, and correct `DEPLOYMENT.md`.

### F4 : Medium : The “general contact form” now requires an account to send

- Proposal §2.7 separates a **general contact form for institutional inquiries** from the member
  helpdesk.
- Since the 26 Oct change, the single support form lets anyone write, but pressing Send while
  signed out only opens “Sign in to send your message”
  ([helpdesk-form.tsx](../src/features/support/helpdesk-form.tsx)); the API still requires a
  session (`requireSession`).
- Public contact cards are environment-driven and may be empty until configured.

**Impact:** a hospital, vendor or donor without an account cannot send the institutional inquiry
the proposal asks for.

**Fix:** add an anonymous contact route (rate-limited, with email verification/anti-spam) or a
mailto link, and keep the signed-in helpdesk for account-specific issues.

### F5 : Medium : Staff cannot author news/announcements, and members cannot attach photos

- Member post types are `story`, `achievement`, `notice`, `in_memoriam`
  ([domain.ts](../src/lib/constants/domain.ts#L56)).
- `/admin/posts` only lists pending posts for approval/rejection; there is no composer and no
  create endpoint for staff-authored news, event or announcement posts.
- `memberPostSchema` has `type`, `title`, `body`, `authorName`, `authorEmail` : no image field, so
  “event photos” in member posts are impossible.

**Impact:** the feed cannot contain the announcement/event content the proposal describes unless
someone writes to the database; the “event photos” part of §2.4 is not delivered.

**Fix:** add a staff post composer (reusing the admin content patterns) and an optional image
upload/URL for member posts, or scope both out with the Board and say so.

### F6 : Medium : Documentation drift after the 26 Oct changes (and older stale numbers)

| Document | What is now wrong |
| --- | --- |
| [README.md](../README.md#L140) | Says `/admin/content` manages the welcome message. |
| [HANDOVER.md](../HANDOVER.md#L215) | Lists `/api/v1/site/welcome` and `/admin/content/welcome`; both routes are deleted. |
| [HANDOVER.md](../HANDOVER.md#L263) | Says four e2e tests fail on a fresh database; fixtures have made the suite green. |
| [HANDOVER.md](../HANDOVER.md#L279) | Says 317 unit tests; there are 354. |
| [TRACKER.md](./TRACKER.md#L11) | Says 340 unit tests and 223 e2e tests; current run is 354 and 259 passed / 70 skipped. |
| [TRACKER.md](./TRACKER.md#L32) | Launch content still lists “welcome message”. |
| [BACKEND.md](./BACKEND.md#L91) | Documents `/site/welcome`, `/admin/content/welcome` and the welcome table as active. |
| [HOWTO.md](./HOWTO.md#L190) | Documents the removed welcome editor and its video/photo fields. |
| [DEPLOYMENT.md](./DEPLOYMENT.md#L129) | Says the welcome section hides itself; it no longer exists. Also says the content editor covers the funds breakdown (false). |
| [DEPLOYMENT.md](./DEPLOYMENT.md#L200) | Launch checklist still includes the welcome message. |
| [ROADMAP.md](./ROADMAP.md#L216) | Marks “Welcome message, stats band, three doors” as done. |
| [CONTEXT.md](./CONTEXT.md#L107) | Current-status table and test counts are several sessions behind. |

**Impact:** a maintainer following the handover will look for deleted screens, endpoints and
content fields.

**Fix:** after the product decisions above, update these in one pass and keep `TRACKER.md` as the
single open-work list.

### F7 : Medium : CSV imports publish profiles without the person's consent

- The import creates approved `csv_import` profiles with no account and hidden contact details
  (documented in `TRACKER.md` C1 and the import service).
- The proposal's model is self-declared data plus approval and privacy choices; a bulk row has no
  consent and cannot choose visibility.
- The import sets `privacyProfile: 'public'` with email and phone hidden, and there is no marker
  or claim flow in the directory, so the exposure is name/programme/batch/work/location to anyone
  (currently anyone signed in, because of F2).

**Impact:** reputational and privacy risk for people who never signed up; may conflict with the
Association's data-protection statement.

**Fix:** confirm the Association has a lawful basis for publishing register rows, let imported
people claim/opt out, or keep imported rows hidden until claimed.

### F8 : Low : “Live” stats are cached for a day

- `getHomeStats()` is `'use cache'` with `cacheLife('days')`
  ([get-home-data.ts](../src/features/home/get-home-data.ts#L8)).
- Numbers are correct but can lag a day after approvals or donations.

**Fix:** shorten the cache or revalidate on approval/donation if “live” is a promise to the Board.

### F9 : Low : Transparency describes allocation, not money already spent

- The page's copy says “how the Association allocates the funds it raises” and “not an audited
  account”, while proposal §2.3 asks for “how funds already raised have been used”.
- There is no expense or disbursement model; amounts are derived from goal totals and percentage
  shares.

**Fix:** either reword the proposal/page to “planned allocation”, or add actual spend entries.

### F10 : Low : Dead welcome schema, table and copy remain

- `welcome_message` is still in [schema.ts](../src/server/db/schema.ts#L503) and in migrations.
- No reads/writes remain, and no migration drops it.

**Fix:** keep it as a harmless historical table, or add an additive migration to drop it once the
content decision is final. Do not drop it before the decision.

### F11 : Low : A support change left one e2e test stale (now fixed)

- The full suite initially failed `sign-in-return.spec.ts` on desktop and mobile because it still
  expected `/support` to show a sign-in gate link.
- The test was updated to assert the guest form and no gate; the whole suite is green again.
- There is still **no browser test for anonymous directory browsing**, because the product does not
  allow it. When F2 is decided, add a test for the chosen behaviour.

### F12 : Medium : Tribute notifications are promised but never sent

- The tribute form offers “Notify someone by email (optional)” with the hint “We will send one
  message with the tribute details.” ([donate.ts](../src/content/donate.ts#L170)).
- `notifyEmail` is validated, passed through checkout and persisted inside `donations.tribute`,
  but nothing reads it after that: no email is sent, and the admin ledger does not display the
  tribute details.

**Impact:** a user-facing promise is broken, and the Association cannot see who a tribute honours
without opening the raw JSON in the database.

**Fix:** send the notification after a confirmed payment (best-effort, like the receipt), and show
both the tribute and its recipient in the admin donation view.

### F13 : Document gap : The proposal has no cost section

- The cover promises “Cost”; the body ends after the SDLC table. If the Board expects a price,
  timeline or payment schedule, it is not in this file.

---

## 6. Verification performed for this audit

| Check | Command | Result |
| --- | --- | --- |
| Formatting | `npm run format:check` | Pass |
| Types | `npm run typecheck` | Pass |
| Lint | `npm run lint` | Pass |
| Unit tests | `npm run test` | 62 files, **354 passed** |
| Production build | `npm run build` | Pass |
| Browser suite | `npm run test:e2e` | **259 passed, 70 skipped, 0 failed** (329 total) |
| Support flow | Manual browser walkthrough | Guest form → sign-in prompt → member sign-in → draft restored → ticket reference; dialog closes on navigation |
| Home / navigation | Manual browser check + HTML/SSR check | No “A word from us” / “A message from the Association”; header nav is About, Events, Community, Support |

The first full e2e run after the support change produced **2 failures** (desktop + mobile) in
`e2e/sign-in-return.spec.ts:33`; the stale expectation was updated and the rerun was green. This is
recorded as F11 rather than hidden.

**Not verified in this audit:** a fresh database built from migrations alone (the existing dev
database contains fixture rows), real gateway callbacks, real email delivery, screen-reader output,
and real devices. The funds-breakdown emptiness was established from the absence of an authoring
path and seed, not by wiping the local database.

---

## 7. Recommended order

1. **Decide the two product contradictions**: directory access (F2) and welcome message (F1).
   These change navigation, privacy copy and the proposal mapping, so everything else should wait.
2. **Make the transparency page honest and fillable** (F3): authoring path + empty state, and fix
   the deployment instructions.
3. **Provide a way for non-members to contact the Association** (F4), keeping the member helpdesk.
4. **Close the community authoring gap** (F5) if the feed is meant to carry announcements and
   photos.
5. **Send the tribute notification and show tributes to admins** (F12); the form already promises
   it.
6. **Update all documents in one pass** (F6), including test counts and the removal of the welcome
   endpoints.
7. **Confirm the CSV-import consent position** (F7) with the Association.
8. **Launch checklist**: A1–A5, manual accessibility/device pass, scheduled digest, backup and
   monitoring installation, persistent photo storage.
9. **Optional hardening**: HIBP and shared rate limiting. ConnectIPS/Fonepay were agreed after
   this audit (29 Oct 2026) and were not named in the proposal; ConnectIPS is now built (C7a),
   while Fonepay awaits its current document (C7b).

---

## 8. Bottom line

The engineering work is credible and well tested: the site is not a mock, the money path is
verified, the admin dashboard is real, and the automated quality gates pass. The project is being
held back mainly by five external launch items and four product decisions that currently
contradict the proposal or the project's own privacy model. Fixing those decisions is more
valuable now than adding new features.
