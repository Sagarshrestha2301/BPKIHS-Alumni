# What is left

The single list of open work, in the order it should be done. `ROADMAP.md` records how the
project was built; this file tracks what remains. Tick an item here, then tick it in the phase
it belongs to.

Status of the checks this list was written from (25 Oct 2026, `master`):

| Check                  | Result                                                             |
| ---------------------- | ------------------------------------------------------------------ |
| `npm run ci`           | Format, types, lint, 317 unit tests and build all pass             |
| `npm run test:e2e`     | 131 passed, 0 failed, 28 skipped — the suite is green and repeatable |
| `npm audit --omit=dev` | 4 moderate, all from `drizzle-kit`'s dev-only esbuild chain        |

The 28 skips are deliberate: the 18 accessibility scans run on the desktop project only, and 10
layout specs are desktop-only by design.

---

## A. Blocking launch

These stop real donors, real administrators or real money from working.

- [ ] **A1. Live merchant credentials.** eSewa and/or Khalti production keys in the
      Association's name, plus `PAYMENT_MODE=live`, `ESEWA_GATEWAY_URL` and `KHALTI_BASE_URL`.
      Sandbox keys cannot take real money. *Owner: Association.*
- [ ] **A2. Verified sending domain in Resend** (SPF, DKIM, DMARC) and a real `EMAIL_FROM`.
      Until then receipts, RSVP confirmations and newsletters do not leave the account.
      *Owner: Association.*
- [ ] **A3. Real Association content.** Board names and photos, welcome message, FAQ answers,
      giving goals, events, contact details. The database starts empty by design; today the
      public site shows empty states and draft wording. *Owner: Association.*
- [ ] **A4. Legal and privacy sign-off.** The privacy policy, terms and accessibility
      statement are drafted in `src/content/legal.ts` and have not been reviewed by anyone.
      *Owner: Association.*
- [ ] **A5. Domain, DNS and TLS.** Point the chosen hostname at the server and confirm
      `APP_URL` / `NEXT_PUBLIC_SITE_URL` match it exactly.

## B. Broken or unreliable right now

Nothing. The four failures that stood here are fixed; keep the two fixes below in mind when
touching checkout or the security headers.

- [x] **B1. The e2e suite had no fixture bootstrap.** *(25 Oct 2026)* A new `setup` Playwright
      project (`e2e/setup/fixtures.setup.ts`, `dependencies: ['setup']`) runs before both browser
      projects. It writes the admin, the donor and `goal-scholarship` straight to the development
      database (`e2e/helpers/fixtures.ts`, also available as `npm run db:fixtures`) and stores
      one session per identity in `e2e/.auth/` (git-ignored). Specs reuse those sessions, so a
      run makes at most two sign-ins instead of ten and no longer trips Better Auth's five per
      minute limiter; a stored session is reused while it is still valid. `admin.spec.ts` now
      posts the password the registration API requires and confirms the address with
      `e2e/helpers/accounts.ts`, because approval is refused while it is unconfirmed.
- [x] **B2. `about.spec.ts` accordion test was flaky.** *(25 Oct 2026)* The click now retries
      until the trigger reports `aria-expanded="true"` (`expect(...).toPass()`), so it waits for
      Base UI hydration instead of sleeping, and the test stays a real click.
- [x] **B3. The dev server did not reliably bind port 3000.** *(25 Oct 2026)* `playwright.config.ts`
      pins `PORT` to 3000 (unless the shell sets a real one), so the `webServer` it starts
      inherits it and `npx playwright test` works without a `PORT=` prefix. The desktop host's
      `PORT=0` no longer matters.
- [x] **B4. Content Security Policy blocked live payments.** *(25 Oct 2026)* `form-action 'self'`
      blocked the POST that checkout submits to eSewa or Khalti — a real payment would have
      failed in the browser. The policy now also allows the configured gateway origins
      (`ESEWA_GATEWAY_URL`, `KHALTI_BASE_URL`, plus the sandbox endpoints), computed in
      `next.config.ts`. Keep it in mind whenever a payment provider is added (C7).
- [x] **B5. Checkout offered the sign-in form to a signed-in donor.** *(25 Oct 2026)* "Continue"
      was enabled as soon as the page hydrated, before the restored session had loaded, so the
      step handler saw no session. It now also waits for `auth.status !== 'loading'`.

## C. Product gaps the Association will ask for

- [ ] **C1. CSV import of the written register.** Upload → preview → validate → confirm, with
      a dry run and an audit entry. Blocked on receiving the Association's register format;
      the column spec is the last open item in `ROADMAP.md` § Phase 11.
- [ ] **C2. Photo upload.** The control on `/register` step 2 is a disabled stub
      (`src/features/register/register-form.tsx`). Needs object storage, image validation,
      size limits, consent wording and a delete path. The `photo_url` column already exists.
- [ ] **C3. Donor list on `/donate/transparency`.** Needs a public, privacy-aware API that
      honours the `anonymous` flag and never exposes an email.
- [x] **C4. Export button on `/admin/donations`.** *(25 Oct 2026)* `GET
      /api/v1/admin/donations/export` writes the ledger as a CSV (reference, amount in rupees,
      method, status, goal title, recorded time), newest first, optionally narrowed with
      `?status=`. It is admin-only, rate limited like every admin read, capped by
      `EXPORT_MAX_ROWS` (default 5000) and written to the audit log. `src/lib/format/csv.ts`
      quotes values correctly and defuses spreadsheet formulas; unit tests cover both.
- [ ] **C5. Automated digest and post-detail pages.** `/community` has a feed but no
      per-post page and no scheduled digest email.
- [ ] **C6. Alumni approval and rejection emails.** The hooks exist in
      `/api/v1/admin/alumni/[id]/approve` and `/reject`; the copy needs the Association's
      sign-off before it is sent to real alumni.
- [ ] **C7. ConnectIPS and Fonepay adapters.** Only eSewa and Khalti exist. Implement
      `PaymentGateway` in `src/server/payments/types.ts` and register it in
      `src/server/payments/index.ts`; the checkout only offers configured gateways. Also add the
      new origin to the `form-action` list (see B4).

## D. Polish, accessibility and performance

- [x] **D1. Sitemap and robots.** *(25 Oct 2026)* `src/app/sitemap.ts` lists the 17 public pages
      (static on purpose, so `next build` needs no database) and `src/app/robots.ts` disallows
      `/admin`, `/api/`, `/account`, `/sign-in` and the checkout funnel.
- [x] **D2. Structured data.** *(25 Oct 2026)* `Organization` in the root layout, `Event` on
      `/events/[slug]`, and a `BreadcrumbList` from every page header, all built in
      `src/lib/seo/json-ld.ts`. The serialiser escapes `<`, so a database value can never close
      the script tag.
- [x] **D3. Automated axe checks.** *(25 Oct 2026)* `e2e/a11y.spec.ts` scans all 18 public pages
      with `@axe-core/playwright` against WCAG 2.1 A and AA and fails on any violation. It found
      one real problem — inactive tab labels at 60% opacity — now fixed in
      `src/components/ui/tabs.tsx`. The scan runs on the desktop project only.
- [ ] **D4. Full keyboard walkthrough of every page**, then a screen-reader pass
      (NVDA/VoiceOver) on the forms, dialogs and admin tables. The automated scan does not
      cover focus order or announcements.
- [ ] **D5. Lighthouse mobile:** Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.
- [ ] **D6. Image optimisation and font subsetting.** The three Google fonts load at full
      weight.
- [ ] **D7. Bundle analysis; remove unused code.**
- [ ] **D8. Cross-browser:** Chrome, Safari, Firefox, Edge, iOS Safari, Android Chrome.
- [ ] **D9. Throttled 4G and low-end device test.**
- [ ] **D10. Copy review and placeholder audit.** Search `src/content` for draft wording and
      the `🔒` open questions in `ROADMAP.md`.

## E. Security and operations

- [ ] **E1. Admin MFA.** Better Auth supports TOTP; today a stolen password is enough.
- [ ] **E2. Breached-password lookup** on sign-up and password change.
- [ ] **E3. Shared rate limiting** if the app ever runs more than one instance. The current
      limiter is one in-process map and is documented as such in
      `src/server/http/rate-limit.ts`.
- [ ] **E4. Automated backups and monitoring** on the production database. The runbook
      covers the commands; nothing runs them on a schedule and nothing alerts.
- [ ] **E5. Dependency audit.** The 4 moderate findings come from `drizzle-kit`'s dev-only
      esbuild chain. Re-check when a fix ships; never use `npm audit fix --force` (it would
      install `drizzle-kit@0.18.1`, a breaking downgrade).
- [ ] **E6. Replace `vite-tsconfig-paths`** with Vite's native `resolve.tsconfigPaths` when
      the Vitest version in use supports it.

## F. Decisions only the owner can make

- [ ] **F1. Q2/Q3 — logo and brand colours.** Everything uses the provisional tokens in
      `src/content` and the Tailwind theme.
- [ ] **F2. Q4 — dates.** Gregorian is implemented; confirm there is no Nepali-year (BS)
      requirement.
- [ ] **F3. Q7 — directory photos.** Optional-photo-with-consent is implemented; confirm the
      wording.
- [ ] **F4. Q8 — who owns the helpdesk copy and FAQ answers.**
- [ ] **F5. Q9 — social links.** Facebook only today.
- [ ] **F6. Q10 — donation compliance wording** (receipts, tax exemption) on `/donate`.

## G. Housekeeping

- [x] **G1. Commit the working tree.** *(25 Oct 2026)* Split into reviewable commits: backend and
      migrations, admin dashboard, documents, then the fixes in this file.
- [x] **G2. Update the two stale roadmap items.** *(25 Oct 2026)* The events manager and the
      approval queue were already built; `ROADMAP.md` now shows them ticked together with the
      items this batch closed.
- [x] **G3. Decide the seed story.** *(25 Oct 2026)* Fixtures live in the browser suite, not in
      an application seed: `e2e/helpers/fixtures.ts` (also `npm run db:fixtures`) writes the two
      accounts and the scholarship goal, and the `setup` project runs it before every suite.
      Production stays empty and still starts with `npm run db:admin`. `docs/HOWTO.md` § 14
      describes it.

---

## Suggested order

1. A1 and A2 with the Association: both need real credentials from them, and nothing else can
   start taking money or sending mail before them.
2. A3 and A4: real content and legal sign-off, entered through `/admin/content`.
3. C1 and C2 — the two gaps the Association will notice first, both needing a decision from them.
4. D4 and D5 — the manual accessibility pass and the Lighthouse floor.
5. Everything else, in the order above.
