# What is left

The single list of open work, in the order it should be done. `ROADMAP.md` records how the
project was built; this file tracks what remains. Tick an item here, then tick it in the phase
it belongs to.

Status of the checks this list was written from (26 Oct 2026, working tree):

| Check                  | Result                                                             |
| ---------------------- | ------------------------------------------------------------------ |
| `npm run ci`           | Format, types, lint, 387 unit tests and build all pass             |
| `npm run test:e2e`     | 267 passed, 0 failed, 70 skipped : green |
| `npm audit --omit=dev` | 4 moderate, all from `drizzle-kit`'s dev-only esbuild chain        |

The 70 skips are deliberate: the 19 accessibility scans and the 38 keyboard checks (two per page)
on the desktop project only, the layout specs are desktop-only by design, the two-factor
handshake runs once on desktop (it replaces the session), and the Firefox and WebKit projects
only match the cross-browser smoke file.

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

- [x] **B1. The e2e suite had no fixture bootstrap.** *(25 Oct 2026, extended)* A new `setup` Playwright
      project (`e2e/setup/fixtures.setup.ts`, `dependencies: ['setup']`) runs before both browser
      projects. It writes the admin, the donor and `goal-scholarship` straight to the development
      database (`e2e/helpers/fixtures.ts`, also available as `npm run db:fixtures`) and stores
      one session per identity in `e2e/.auth/` (git-ignored). Specs reuse those sessions, so a
      run makes at most three sign-ins instead of a dozen and no longer trips Better Auth's five
      per minute limiter; a stored session is reused while it is still valid. `admin.spec.ts` now
      posts the password the registration API requires and confirms the address with
      `e2e/helpers/accounts.ts`, because approval is refused while it is unconfirmed.
      The fixtures also create the content the pages render : three giving goals, three
      upcoming events, three published posts, board members and the welcome message : because
      the application ships an empty database and the home-page specs expect a populated one.
      Verified against a database created from migrations alone: the seed produces exactly
      those rows.
- [x] **B2. `about.spec.ts` accordion test was flaky.** *(25 Oct 2026)* The click now retries
      until the trigger reports `aria-expanded="true"` (`expect(...).toPass()`), so it waits for
      Base UI hydration instead of sleeping, and the test stays a real click.
- [x] **B3. The dev server did not reliably bind port 3000.** *(25 Oct 2026)* `playwright.config.ts`
      pins `PORT` to 3000 (unless the shell sets a real one), so the `webServer` it starts
      inherits it and `npx playwright test` works without a `PORT=` prefix. The desktop host's
      `PORT=0` no longer matters. *(29 Oct 2026)* `npm run dev` now passes `next dev -p 3000` as
      well, so the port the browser sees is the origin `APP_URL` and Better Auth expect.
- [x] **B4. Content Security Policy blocked live payments.** *(25 Oct 2026)* `form-action 'self'`
      blocked the POST that checkout submits to eSewa or Khalti : a real payment would have
      failed in the browser. The policy now also allows the configured gateway origins
      (`ESEWA_GATEWAY_URL`, `KHALTI_BASE_URL`, plus the sandbox endpoints), computed in
      `next.config.ts`. Keep it in mind whenever a payment provider is added (C7b).
- [x] **B5. Checkout offered the sign-in form to a signed-in donor.** *(25 Oct 2026)* "Continue"
      was enabled as soon as the page hydrated, before the restored session had loaded, so the
      step handler saw no session. It now also waits for `auth.status !== 'loading'`.

## C. Product gaps the Association will ask for

- [x] **C1. CSV import of the written register.** *(25 Oct 2026, extended 26 Oct 2026)*
      `/admin/alumni/import` accepts
      any column names through a mapping screen, validates every row server-side, previews
      ready/duplicate/invalid rows and imports only the ready ones as `csv_import` profiles with
      no account and hidden contact details. It now **asks whether the rows may be published**
      and holds them as pending registrations unless the answer is yes : a register row has not
      agreed to publication, so the default keeps them out of the directory until an admin
      approves them or the person claims the record. Duplicate addresses : earlier in the file,
      already a profile, or a donor account without a profile : are skipped. The route is
      admin-only, CSRF-checked, rate-limited, capped at 1 MB / 1,000 rows, audit-logged (recording
      the publish choice) and expires the directory cache so newly approved profiles appear
      immediately. Covered by `e2e/alumni-import.spec.ts` and `src/lib/api/alumni-import.test.ts`.
- [x] **C2. Photo upload.** *(25 Oct 2026)* `/register` step 2 and `/account/profile` accept a
      JPEG, PNG or WebP up to 5 MB with a separate consent checkbox. The server decodes with
      `sharp`, enforces 200–6,000 px, applies orientation, strips EXIF/GPS and stores a 512 × 512
      WebP on the app server's persistent disk (`PHOTO_UPLOAD_DIR`). Files are served only through
      `/api/v1/alumni/[id]/photo`, which checks approval and profile visibility; the owner and
      admins may preview pending work. `alumni.photo_url` keeps a private key and
      `alumni.photo_consent` records agreement. Replacing or removing a photo deletes the old
      file; removal also withdraws consent. Covered by `e2e/photo.spec.ts`, the registration
      component test, the photo helper units and the bounded multipart reader tests. The
      remaining operational work is choosing and backing up the production directory; see
      `HOWTO.md` § 7.5.
- [x] **C3. Donor list on `/donate/transparency`.** *(25 Oct 2026)* `GET
      /api/v1/donations/donors` returns confirmed gifts newest first : display name, goal title
      and date only. The query never selects an email or a user id, and an anonymous gift is
      mapped without a name inside the service, so the address cannot reach the page even by
      mistake. The page caches the list for minutes, shows an empty state, and the fixtures now
      carry one named and one anonymous gift so both states are exercised.
- [x] **C4. Export button on `/admin/donations`.** *(25 Oct 2026)* `GET
      /api/v1/admin/donations/export` writes the ledger as a CSV (reference, amount in rupees,
      method, status, goal title, recorded time), newest first, optionally narrowed with
      `?status=`. It is admin-only, rate limited like every admin read, capped by
      `EXPORT_MAX_ROWS` (default 5000) and written to the audit log. `src/lib/format/csv.ts`
      quotes values correctly and defuses spreadsheet formulas; unit tests cover both.
- [x] **C5. Post-detail pages.** *(25 Oct 2026)* `GET /api/v1/feed/[id]` serves one approved
      post and answers 404 for anything else; `/community/[id]` renders it with its own metadata
      and an article body, and every feed card links to it. The not-found case is a value inside
      the cached getter, because Next's cache boundary rethrows failures as plain `Error`s and
      the class check would be lost. Covered by `e2e/community.spec.ts`.
- [x] **C8. Scheduled newsletter digest.** *(26 Oct 2026)* `npm run newsletter:digest` builds a
      digest from the three newest posts, the next three events and the active goals and sends it
      to every subscribed address with per-recipient unsubscribe links, recording a
      `newsletter_campaigns` row like any hand-written campaign. A run whose subject for this
      month already sent is skipped, so a repeated cron entry cannot mail the list twice, and
      `-- --dry-run` prints the message and recipient count without sending. The cron entry
      itself is the remaining half : see `DEPLOYMENT.md` §9.
- [x] **C9. Newsletter double opt-in.** *(27 Oct 2026)* `POST /api/v1/newsletter` now holds an
      address as `pending` and emails a confirmation link; only `POST /api/v1/newsletter/confirm`
      with that row's token moves it to `subscribed`. The link opens
      `/community/newsletter/confirm`, a no-JS page with a button, so an email client or scanner
      that fetches the URL cannot subscribe anyone. Campaigns and the digest select subscribed
      rows only; a repeat submission within 15 minutes sends no second email; the admin list
      shows "Awaiting confirmation" and can filter it. If the provider refuses the confirmation
      message the API answers `confirmationEmailSent: false` and the form says so, with
      `confirmation_sent_at` left null so a retry sends immediately. Covered by
      `e2e/newsletter-double-opt-in.spec.ts` and the footer form's unit tests.
- [x] **C6. Alumni approval and rejection emails.** *(25 Oct 2026)* Approval now emails the
      member that the profile is published and links to `/account`; rejection points them at
      the account page, where the reason is shown and the profile can be corrected and
      resubmitted. Only `self_registered` profiles with an account are emailed : a
      `csv_import` row has no consent and is never contacted. Sending is best-effort
      (`sendEmailSafely`), so a provider failure cannot undo an approval. Copy lives in
      `src/content/email.ts`; the Association should still read it before launch.
- [x] **C9. Member self-service account.** *(25 Oct 2026)* `/account` now shows the signed-in
      member their profile, review status (including the reason when rejected) and email
      confirmation state. `/account/profile` edits name, contact details, work, further studies,
      the note, up to eight expertise tags and each privacy setting; the API schema omits email,
      programme, batch year and status, so a crafted request cannot change them. Saving a
      rejected profile puts it back in the review queue. `/account` also changes the password
      (revoking other sessions), and `/forgot-password` → `/reset-password` covers a forgotten
      one with a single-use emailed token. Expertise appears on directory cards and profiles and
      is included in search. `export const instant = false` on the session-reading routes keeps
      Cache Components from flagging them as blocking; the account routes are covered by
      `e2e/account.spec.ts` and the schema by `src/lib/api/account-schemas.test.ts`.
- [x] **C10. Role-based access.** *(25 Oct 2026)* Three roles : normal user (`donor`), `alumni`
      and `admin` : now decide what the directory returns. Registration creates a normal user;
      approval promotes the account to `alumni` in the same transaction, rejection demotes it
      and deletes its sessions, and an administrator is never demoted. `getViewer()` resolves the role from the session,
      and the alumni-only directory pages, filters and API are viewer-aware with the viewer in
      the cache key. `/account` names the role and links an administrator to the dashboard.
      Covered by `e2e/roles.spec.ts`; the approval transition is asserted in `e2e/admin.spec.ts`.
- [x] **C7a. ConnectIPS adapter.** *(29 Oct 2026)* A real `PaymentGateway` against the official
      NCHL docs (<https://doc.connectips.com>): a signed RSA-SHA256 form POST to
      `/connectipswebgw/loginpage` (`TXNAMT` in paisa, `TXNDATE` `DD-MM-YYYY`, `TXNID` and
      `REFERENCEID` set to a stored 20-character reference), then a server-side `validatetxn`
      call with Basic auth and a separately signed token. The donation UUID is longer than
      `TXNID`, so `donations.gateway_order_ref` is written before the redirect and resolved on
      return; the amount in the validation token comes from that stored donation, never from the
      browser. Checkout offers ConnectIPS only when all six settings and a PEM signing key are
      present. Covered by `src/server/payments/connectips.test.ts` and `index.test.ts`; CSP
      `form-action`, env validation and `.env.example` updated. **Acceptance run attempted 29 Oct
      2026: blocked, not passed.** None of the `CONNECTIPS_*` variables are present in
      `.env.local`, no `CREDITOR.pfx`/PEM key or merchant pack exists in the workspace, and no
      request was sent to NCHL. The protocol tests pass, and `npm run connectips:accept` now
      repeats the signed initiation and validation calls against UAT (`--dry-run` signs only);
      it cannot enter the OTP, so one sandbox donation remains the only open step once the pack
      arrives (`HANDOVER.md` §2).
- [ ] **C7b. Fonepay adapter.** *(Agreed 29 Oct 2026; blocked on Fonepay's current document.)*
      Do not implement from the 2020 Web Integration mirror (conflicting sandbox paths and
      callback signatures); obtain Fonepay's current integration document, then verify every
      return with its status API before completion. Variables are reserved in `.env.example` and
      `HANDOVER.md` §2. **Acceptance:** one sandbox donation, amount match, idempotent completion,
      configured-only checkout, gateway origin in `form-action`, env validation and docs.
- [x] **C11. The directory was members-only.** *(26 Oct 2026)* Signed-out visitors now browse
      `/directory` and public profiles: the page reads the viewer without a session, the API
      returns 404 rather than 401 for a hidden record, and a quiet banner points guests at the
      sign-in and join links. `alumni_only` records and fields stay hidden until a member or
      admin asks. Directory is back in the main navigation (mobile menu and bottom bar unchanged).
      Covered by `e2e/roles.spec.ts` and `e2e/sign-in-return.spec.ts`.
- [x] **C12. The funds breakdown had no authoring path.** *(26 Oct 2026)* A **Funds breakdown**
      tab under `/admin/content` creates, edits and deletes allocation categories (category,
      share %, period, sort order) through `/api/v1/admin/content/funds`. Shares are refused
      past 100%, a partial plan shows the remainder as an unallocated line, and
      `/donate/transparency` shows an empty state instead of an empty donut.
- [x] **C13. No way for non-members to write in.** *(26 Oct 2026)* `POST /api/v1/contact` and a
      separate no-account form on `/support` (name, email, organisation, subject, message) reach
      the same ticket queue as the helpdesk, so the office answers in one place. Same-origin and
      the `support` rate limit (5/min) apply; no session is needed.
- [x] **C14. Staff posts and member photos.** *(26 Oct 2026)* `/admin/posts` gained a composer
      that publishes news, notices, events and announcements straight to the feed (POST/PATCH/DELETE
      beside the untouched moderation queue), and the member "Share an update" form takes an
      optional https or site-relative photo URL shown on the post page. Both are covered by the
      schema unit tests.
- [x] **C15. The tribute notification was promised but never sent.** *(26 Oct 2026)* A confirmed
      gift now emails the named person the tribute details (best-effort, never revealing the
      amount or an anonymous donor), and `/admin/donations` shows the tribute, its type and who
      was notified.
- [x] **C16. The welcome message had been removed.** *(26 Oct 2026)* The home page section, the
      `/api/v1/site/welcome` route, the admin editor with its video/photo URL fields and the
      fixtures are restored; the section still hides itself while the text is empty.

## D. Polish, accessibility and performance

- [x] **D1. Sitemap and robots.** *(25 Oct 2026)* `src/app/sitemap.ts` lists the 17 public pages
      (static on purpose, so `next build` needs no database) and `src/app/robots.ts` disallows
      `/admin`, `/api/`, `/account`, `/sign-in` and the checkout funnel.
- [x] **D2. Structured data.** *(25 Oct 2026)* `Organization` in the root layout, `Event` on
      `/events/[slug]`, and a `BreadcrumbList` from every page header, all built in
      `src/lib/seo/json-ld.ts`. The serialiser escapes `<`, so a database value can never close
      the script tag.
- [x] **D3. Automated axe checks.** *(25 Oct 2026)* `e2e/a11y.spec.ts` scans all 19 public pages
      with `@axe-core/playwright` against WCAG 2.1 A and AA and fails on any violation. It found
      one real problem : inactive tab labels at 60% opacity : now fixed in
      `src/components/ui/tabs.tsx`. The scan runs on the desktop project only.
- [x] **D4 (automatic half). Keyboard and focus checks.** *(25 Oct 2026)*
      `e2e/keyboard.spec.ts` Tabs through the first twelve stops of all 19 public pages and
      fails if any stop draws no focus ring, and separately fails if a focusable element sits
      inside `aria-hidden` or `inert`. It found nothing : the `focusRing` convention is
      applied everywhere : so this is now a regression guard.
- [ ] **D4 (manual half). Screen-reader pass** (NVDA/VoiceOver) on the forms, dialogs and admin
      tables, and a judgement call on whether the focus order is sensible. No automated check
      can hear the result.
- [x] **D5. Lighthouse mobile.** *(25 Oct 2026)* Measured against the production build:
      performance 90–93, accessibility 98–100, best practices 96–100, SEO 100 on `/`,
      `/directory`, `/donate`, `/events` and `/register`; CLS 0–0.05. Every target is met.
      Largest Contentful Paint is 3.2–3.6 s and is the remaining headroom : hosting near Nepal
      and Brotli at nginx move it more than code. Method and numbers: `docs/HOWTO.md` § 15.
- [x] **D6. Image optimisation and font subsetting.** *(25 Oct 2026)* Noto Sans Devanagari is
      no longer preloaded: no page contains Nepali text, so it downloaded a font nobody
      rendered. Event gallery images now declare `sizes`, so the browser picks the smallest
      file. Inter and Source Serif stay preloaded because they draw the first screen.
- [x] **D7. Bundle analysis; remove unused code.** *(25 Oct 2026)* `npm run analyze` runs
      Next's Turbopack analyser (the webpack-based `@next/bundle-analyzer` produces nothing on
      this setup and was removed). The build ships 347.9 kB of gzipped client JavaScript and
      no server-only package: `drizzle-orm`, `postgres`, `better-auth` and Resend stay on the
      server. Removed the unused `sonner` dependency, its `Toaster` component and
      `src/lib/api/record-schemas.ts`.
- [x] **D8 (automatic half). Cross-browser smoke.** *(25 Oct 2026)* `e2e/cross-browser.spec.ts`
      runs on the Firefox and WebKit engines in the Playwright config (`npx playwright install
      firefox webkit`, then `npx playwright test --project=firefox --project=webkit`). It checks
      the home shell, the community feed and the transparency page. Chromium is covered by the
      whole suite; WebKit is Safari's engine and the Pixel 7 project covers Android Chrome
      layout.
- [ ] **D8 (manual half).** A pass on a real iPhone (Safari) and a real Android phone, plus
      Edge on Windows. Emulation cannot catch a platform input or font bug.
- [x] **D9. Throttled 4G and low-end device test.** *(25 Oct 2026)* `e2e/throttle.spec.ts` drives
      the home page through the Chrome DevTools Protocol with 4x CPU throttling and a slow-4G
      network profile, then asserts Largest Contentful Paint is reported and stays under 3 s
      (measured about 0.9 s on a warm dev server). It is a regression guard for the first
      screen; the production numbers stay the Lighthouse pass in D5.
- [x] **D10. Copy review and placeholder audit.** *(25 Oct 2026)* Every user-facing string was
      read: there is no lorem ipsum, no "coming soon" and no reference to a removed feature.
      What remains is deliberate : the `draftNote` notices on `/about` and `/legal`, which say
      the wording awaits approval, and the input `placeholder` hints. The copy itself still
      needs the Association's sign-off (A3, A4).

## E. Security and operations

- [x] **E1. Admin MFA.** *(25 Oct 2026)* `/admin/security` enrols an authenticator app over
      Better Auth's two-factor plugin. Sign-in returns a challenge instead of a session until
      the six-digit code or a single-use backup code arrives; secrets are encrypted with
      `BETTER_AUTH_SECRET` and backup codes are hashed. The migration adds `two_factor` and
      `user.two_factor_enabled`. A lost device is recovered with a backup code, or with
      `ADMIN_RESET_2FA=true npm run db:admin` on the host. Enrolment is optional per account,
      so existing sessions and tests are unaffected until an admin turns it on.
- [ ] **E2. Breached-password lookup** on sign-up and password change.
- [ ] **E3. Shared rate limiting** if the app ever runs more than one instance. The current
      limiter is one in-process map and is documented as such in
      `src/server/http/rate-limit.ts`.
- [~] **E4. Automated backups and monitoring.** *(25 Oct 2026, tooling)*
      `scripts/backup-db.sh` writes a gzipped dump with 14-day retention, optional AES-256
      encryption and owner-only permissions; `scripts/healthcheck.sh` probes `/api/health` and
      can post to `ALERT_WEBHOOK_URL`. Both are available as `npm run db:backup` and
      `npm run check:health`. The remaining half is installation: add the cron entries on the
      production host, copy backups off-box and point an uptime monitor at the endpoint. That
      needs the host, so it stays open until launch.
- [ ] **E5. Dependency audit.** The 4 moderate findings come from `drizzle-kit`'s dev-only
      esbuild chain. Re-check when a fix ships; never use `npm audit fix --force` (it would
      install `drizzle-kit@0.18.1`, a breaking downgrade).
- [x] **E6. Dropped `vite-tsconfig-paths`.** *(25 Oct 2026)* Vite 8 reads
      `compilerOptions.paths` itself, so `vitest.config.mts` sets `resolve.tsconfigPaths: true`
      and the plugin dependency is gone. All 317 unit tests pass on the built-in resolver.

## F. Decisions only the owner can make

- [ ] **F1. Q2/Q3 : logo and brand colours.** Everything uses the provisional tokens in
      `src/content` and the Tailwind theme.
- [ ] **F2. Q4 : dates.** Gregorian is implemented; confirm there is no Nepali-year (BS)
      requirement.
- [ ] **F3. Q7 : directory photos.** Optional-photo-with-consent is implemented; confirm the
      wording.
- [ ] **F4. Q8 : who owns the helpdesk copy and FAQ answers.**
- [ ] **F5. Q9 : social links.** Facebook only today.
- [ ] **F6. Q10 : donation compliance wording** (receipts, tax exemption) on `/donate`.

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
3. D4 and D8 manual passes : real screen reader, keyboard walkthrough and devices.
4. Everything else, in the order above: install the backup, health-check and digest cron entries
   on the host, and put persistent photo storage on the chosen host.
