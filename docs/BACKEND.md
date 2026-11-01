# Backend

Everything the public site and the admin dashboard read or write lives here. There is one data
path: the real API in `src/app/api/v1`. The browser uses `src/lib/api/http`; Server Components
call the same services directly through `src/server/api` and skip the network hop. Both
implement the contract in `src/lib/api/contract.ts`, so a route that drifts fails the build.

The deployment runbook is in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## 1. Stack and why

| Concern    | Choice                                        | Why                                                                 |
| ---------- | --------------------------------------------- | ------------------------------------------------------------------- |
| Runtime    | Next.js 16 Route Handlers                     | One deployable, same Zod schemas as the forms, no second service    |
| Database   | Postgres 16 + Drizzle ORM                     | Relational data (alumni, goals, donations), typed queries, migrations |
| Auth       | Better Auth (email + password, role plugin)   | Donation receipts, member accounts and the admin dashboard            |
| Validation | Zod, at the edge of every write               | One schema per payload, shared with the client                       |
| Email      | `sendEmail()` with console / Resend transports | Console locally; Resend with a verified domain in production          |
| Payments   | eSewa ePay v2, Khalti ePayment v2 and ConnectIPS adapters (Fonepay pending) | The gateways that matter in Nepal; no simulator and no fake "paid" state |
| Rate limits| In-process fixed window                       | Enough for a single Node process; swap for Redis when scaled out     |

Server-only code lives in `src/server` and never reaches the browser bundle:

```
src/server/
  api/        adapter + client used by Server Components
  auth/       Better Auth instance, session guards
  db/         connection, schema, migrations, admin bootstrap, load-env
  email/      one send function for all messages
  http/       response envelope, error mapping, rate limiting
  payments/   gateway adapters, callback completion
  services/   one module per domain: alumni, community, content, donations,
              events, governance, support, audit
```

Routes are thin: parse, guard, call a service, return. Anything that needs a database query or
a business rule is in a service, which is what the tests and future callers reuse.

---

## 2. Running it

```bash
npm install
cp .env.example .env.local          # then set BETTER_AUTH_SECRET and PAYMENT_MODE
npm run db:up                       # Postgres 16 on port 5433 (Docker)
npm run db:migrate                  # apply drizzle/ migrations
ADMIN_EMAIL=you@example.org ADMIN_PASSWORD='a-long-unique-password' npm run db:admin
npm run dev
```

A fresh database is empty by design. Production starts empty and the Association enters real content.
There is no development-only seed dataset imported into the application.

`APP_URL` is the public origin used for payment returns and redirects. It is read at runtime,
unlike `NEXT_PUBLIC_*` values, which are baked in at build time : so a deploy can move hosts
without a rebuild.

Database commands:

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run db:up`     | Start Postgres (`docker compose up -d db`)        |
| `npm run db:down`   | Stop the containers                               |
| `npm run db:generate` | Generate a migration from a schema change       |
| `npm run db:migrate`  | Apply migrations (drizzle-kit, development)     |
| `npm run db:migrate:prod` | Apply migrations with the runtime driver    |
| `npm run db:admin`    | Create or promote the first administrator       |
| `npm run db:studio`   | Open Drizzle Studio                             |

`db:admin` is idempotent: an existing account is promoted to `admin` and its password is reset
to the supplied one. It never deletes other rows, which also makes it the recovery path.

---

## 3. The API

Base path `/api/v1`. Every response is JSON with `Cache-Control: no-store`; the body is either
the resource or `{ "error": { ... } }`.

Auth is a Better Auth cookie session. `public` routes need nothing, `session` routes need a
signed-in user, `admin` routes need `role = "admin"` **and** a same-origin `Origin` header.

### Content and directory

| Method | Path                     | Access  | Notes                                             |
| ------ | ------------------------ | ------- | ------------------------------------------------- |
| GET    | `/site/stats`            | public  | Homepage counters                                 |
| GET    | `/site/welcome`          | public  | Association message block                         |
| GET    | `/alumni`                | public  | Search, filters, sort, pagination; `alumni_only` records for alumni and admins |
| GET    | `/alumni/filters`        | public  | Countries, cities, batches visible to the viewer  |
| GET    | `/alumni/[id]`           | public  | Profile; `alumni_only` fields follow the viewer   |
| GET    | `/alumni/[id]/photo`     | viewer  | Uploaded photo as WebP; approved + visibility checked on every request |
| GET    | `/board`                 | public  | Board members, optionally current only            |
| GET    | `/faq`                   | public  | FAQ entries                                       |

### Giving

| Method | Path                       | Access  | Notes                                          |
| ------ | -------------------------- | ------- | ---------------------------------------------- |
| GET    | `/goals`                   | public  | Active giving goals with live progress          |
| GET    | `/goals/[id]`              | public  | One goal                                        |
| GET    | `/funds`                   | public  | Funds breakdown, derived from goal totals       |
| GET    | `/donations/donors`        | public  | Confirmed gifts, newest first, for transparency |
| POST   | `/donations`               | session | Creates a donation; 10 per minute per IP        |
| GET    | `/payments/[gateway]/callback` | public | Gateway return URL; verifies, completes, redirects to the thank-you page |

`/donations/donors` reads four columns only: display name, anonymity flag, goal title and time.
It never selects an email or a user id, and a gift marked anonymous leaves the service without a
name, so the page cannot show one. No per-person amount is published.

### Events

| Method | Path                     | Access | Notes                                     |
| ------ | ------------------------ | ------ | ----------------------------------------- |
| GET    | `/events`                | public | Upcoming/past, search, pagination         |
| GET    | `/events/[slug]`         | public | Detail, capacity and remaining seats      |
| POST   | `/events/[slug]/rsvp`    | public | 5 per minute per IP                       |

### Community and support

| Method | Path                     | Access | Notes                                          |
| ------ | ------------------------ | ------ | ---------------------------------------------- |
| GET    | `/feed`                  | public | Published posts, category filter, pagination   |
| GET    | `/feed/[id]`             | public | One approved post; 404 when missing or unapproved |
| POST   | `/posts`                 | public | Submitted as `pending` for moderation          |
| POST   | `/posts/[id]/report`     | public | Report a post                                  |
| POST   | `/newsletter`            | public | Subscribe; the address is held `pending` for double opt-in; answers `confirmationEmailSent` |
| POST   | `/newsletter/confirm`    | public | Confirm from the emailed link; `pending` → `subscribed` |
| PATCH  | `/newsletter`            | public | Update interests or unsubscribe                |
| POST   | `/registrations`         | public | Registration: account + `pending` profile, emails a code |
| POST   | `/registrations/resend`  | public | New email code for an unconfirmed account      |
| POST   | `/support`               | public | Helpdesk ticket (members, after sign-in)      |

### Account

| Method | Path               | Access  | Notes                                                        |
| ------ | ------------------ | ------- | ------------------------------------------------------------ |
| PATCH  | `/account/profile` | session | Update own name, contact details, work, expertise and privacy |
| POST   | `/account/photo`   | session | Multipart `photo` + `consent`; validates, re-encodes and stores |
| DELETE | `/account/photo`   | session | Delete the file, clear the URL and withdraw photo consent     |

Password changes and the reset flow are Better Auth's own endpoints under
`/api/auth/[...all]`: `POST /change-password` (requires the current password and revokes other
sessions), `POST /request-password-reset` (always answers the same way) and `POST
/reset-password` (single-use token from the email). `GET /account` and `/account/profile` are
Server Components that read the session and redirect a signed-out visitor to `/sign-in`.

#### Profile photos

`POST /account/photo` accepts `multipart/form-data` with one `photo` file and a `consent` field
(`"true"`). It is same-origin, CSRF-checked, rate-limited (6/min) and reads the body through a
bounded stream, so a caller cannot make it buffer an unlimited file. The service finds the
profile from the session, never from a supplied id.

The file must be a real JPEG, PNG or WebP at most 5 MB and between 200 and 6,000 pixels on each
side. `sharp` decodes it with a pixel cap, applies camera orientation, crops a 512 × 512 square
and writes WebP at quality 82. It writes no EXIF/GPS metadata. The file goes to
`PHOTO_UPLOAD_DIR` with a UUID name; `alumni.photo_url` stores `photo:<uuid>.webp`, and
`alumni.photo_consent` records the agreement. The API maps that key to
`/api/v1/alumni/[id]/photo?v=<uuid>`, never to a filesystem path.

The photo route returns 404 unless the profile is approved and visible to the viewer; the owner
and an administrator may preview a pending or rejected photo. Responses are `private` cached for
five minutes (no-store for owner/admin previews), so hiding a profile or deleting a photo takes
effect promptly. `DELETE /account/photo` clears both columns and removes the file. Replacing a
photo deletes the previous file after the database points at the new one.

### Admin

All admin routes require an `admin` session.

| Method | Path                          | Notes                                    |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | `/admin/overview`             | Counts and the queue that needs attention |
| GET    | `/admin/alumni`               | Registrations, filter by status          |
| POST   | `/admin/alumni/import`        | Preview (`dryRun`) or import a register CSV |
| POST   | `/admin/alumni/[id]/approve`  | Approve; the record becomes public       |
| POST   | `/admin/alumni/[id]/reject`   | Reject with a reason                     |
| GET/POST | `/admin/posts`        | Moderation queue; `POST` creates a staff post, already published |
| PATCH/DELETE | `/admin/posts/[id]` | Edit or delete a published post            |
| POST   | `/admin/posts/[id]/approve`   | Publish a post                           |
| POST   | `/admin/posts/[id]/reject`    | Reject with a reason                     |
| GET    | `/admin/reports`              | Open reports                             |
| POST   | `/admin/reports/[id]/resolve` | Close a report                           |
| GET    | `/admin/donations`            | Donation ledger, paginated               |
| GET    | `/admin/donations/export`     | Ledger as a CSV file; `?status=` narrows it |
| GET    | `/admin/tickets`              | Helpdesk tickets                         |
| PATCH  | `/admin/tickets/[id]`         | Change ticket status                     |
| GET    | `/admin/content`              | Events, goals, funds breakdown, board, FAQ and welcome in one read |
| GET/POST | `/admin/content/events`     | List or create events                    |
| PATCH/DELETE | `/admin/content/events/[id]` | Update or delete an event          |
| GET/POST | `/admin/content/goals`      | List or create giving goals              |
| PATCH/DELETE | `/admin/content/goals/[id]` | Update or delete a goal                |
| GET/POST | `/admin/content/board`      | List or create board members             |
| PATCH/DELETE | `/admin/content/board/[id]` | Update or delete a board member        |
| GET/POST | `/admin/content/faq`        | List or create FAQ entries               |
| PATCH/DELETE | `/admin/content/faq/[id]`   | Update or delete an FAQ entry           |
| GET/POST | `/admin/content/funds`      | List or add fund-allocation categories; shares may not pass 100% |
| PATCH/DELETE | `/admin/content/funds/[id]` | Update or delete a fund category       |
| GET/PUT | `/admin/content/welcome`     | Read or replace the welcome message      |
| GET    | `/admin/newsletter`           | Subscribers and recent campaigns         |
| POST   | `/admin/newsletter`           | Send a campaign (or one test message)    |
| GET    | `/admin/audit`                | Recent admin audit entries               |

Admin mutations also pass the shared guard: same-origin check, CSRF token, rate limit and role.
`GET` admin routes only require a fresh admin session.

The register import takes `{ csv, mapping, dryRun, publish, filename? }`. `dryRun: true` returns
`{ totalRows, readyRows, duplicateRows, invalidRows, rows }` and writes nothing; `dryRun: false`
inserts every ready row as a `csv_import` profile with no `userId`, email and phone hidden and
`placeholder = true`. `publish` decides whether the rows become `approved` (visible in the directory immediately)
or `pending` (held for review until an administrator approves them or the person
registers and claims the record); it defaults to **false**, because a written register row has
not agreed to publication. A repeated address : earlier in the file, already a profile, or
a donor account without a profile : is reported and skipped. Programmes accept the enum plus
common register spellings (`B.Sc. Nursing`, `MD`, `M.Ch`). The body is capped at twice
`IMPORT_MAX_BYTES` (JSON escaping), the CSV itself at 1 MB / 1,000 rows, and the write records
the filename and counts in the audit log. The route expires the `directory` cache tag so the new
profiles are visible immediately.

The CSV export answers `text/csv` with a `Content-Disposition: attachment` filename, so it works
as a plain link. It returns the newest `EXPORT_MAX_ROWS` rows (default 5000) with the goal title
joined in, amounts as rupees with two decimals, and it writes a `donations.export` entry to the
audit log. `src/lib/format/csv.ts` quotes values that need it and prefixes anything a spreadsheet
would run as a formula, so a donor name cannot smuggle a formula into the Association's
spreadsheet.

`GET /api/auth/[...all]` is Better Auth's own handler (sign-in, sign-out, session).

### Admin dashboard

The screens live under `/admin`. The layout redirects a signed-out visitor, and every page calls
`requireAdminPage()` before it reads anything: Next streams a page while the layout resolves, so
the per-page check is what prevents data leaking ahead of the redirect. A non-admin session gets
a clear "no access" panel.

| Screen        | Path                 | What it does                                      |
| ------------- | -------------------- | ------------------------------------------------- |
| Overview      | `/admin`             | Queue counts, approved alumni, subscribers, totals |
| Registrations | `/admin/alumni`      | Filter by status, search, approve or reject        |
| Posts         | `/admin/posts`       | Publish or reject pending community posts          |
| Reports       | `/admin/reports`     | Mark a report reviewed or dismiss it               |
| Support       | `/admin/tickets`     | Filter and change ticket status                    |
| Donations     | `/admin/donations`   | Paginated ledger with goal titles and amounts      |
| Payments      | `/admin/payments`    | Gateway configuration, checkout visibility and last acceptance |
| Content       | `/admin/content`     | Events, giving goals, board, FAQ and welcome editor |
| Newsletter    | `/admin/newsletter`  | Subscribers, test sends and campaign history        |
| Audit log     | `/admin/audit`       | Newest 200 administrator actions                    |

Reads are Server Components calling the services directly; mutations are small client widgets
that call the admin routes above (same-origin cookie, audit log) and then `router.refresh()`.
Every action reports its own error inline, and a button is disabled while its request is in
flight.

### Conventions

- **Errors.** Every throw becomes one envelope:
  `{ error: { code, message, fieldErrors? } }`. Codes: `validation` (422), `unauthorized`
  (401), `forbidden` (403), `not_found` (404), `conflict` (409), `rate_limited` (429),
  `unavailable` (503), `server` (500). The client turns these into `ApiError` instances, so the
  UI handles mock and real failures identically.
- **Validation.** `parseBody(request, schema)` runs the same Zod schema the form uses and
  returns field errors keyed by path.
- **Pagination.** `{ items, total, page, pageSize }`, `pageSize` capped at 100.
- **Privacy.** The viewer is resolved from the session role (`getViewer()`): `alumni` and
  `admin` receive `alumni_only` profiles and fields, a signed-out visitor and a `donor` do not.
  The rule lives in one place, `src/lib/api/privacy.ts`, and a test asserts profiles stay
  trimmed (decision D29).
- **CSRF.** A mutation carrying a session cookie must echo the `bpkihs_csrf` cookie in
  `x-csrf-token`; the proxy issues the cookie. `assertSameOrigin()` checks the `Origin` header.
- **Limits.** Bodies are JSON only, capped at `MAX_REQUEST_BYTES`; `pageSize` is capped at 100.
- **Audit.** Admin creates, updates, deletes, approvals, rejections, report resolutions, ticket
  changes and newsletter sends write to `admin_audit_log` with the actor and entity.

---

## 4. Data model

For everyday database work : migrations, queries, backups : see
[`DB-AND-PAYMENTS.md`](./DB-AND-PAYMENTS.md).

`src/server/db/schema.ts`, grouped the same way as the services:

- **People**: `user`, `session`, `account`, `verification`, `two_factor` (Better Auth), `alumni`.
- **Giving**: `donation_goals`, `donations`, `payment_events`, `funds_breakdown`.
- **Programmes**: `events`, `event_rsvps`.
- **Community**: `feed_posts`, `post_reports`, `newsletter_subscribers`, `newsletter_campaigns`.
- **Governance and support**: `board_members`, `faq_items`, `support_tickets`, `welcome_message`,
  `admin_audit_log`.

The homepage counters and the funds chart are derived from real rows (alumni, goals, donations)
rather than stored, so they cannot drift.

Money is stored in minor units (`*_minor`, integer) with a currency code, matching the UI rule.
`updated_at` is set explicitly on every write; `created_at` defaults in the database.

---

## 5. Auth

Better Auth owns five tables (`user`, `session`, `account`, `verification`, `two_factor`) and
three roles: `donor` (default), `alumni` and `admin`.

- Accounts exist for the donation gate (so a receipt has an inbox), the admin dashboard (which
  needs a role) and self-registration (so a member can confirm their address and follow the
  review). Browsing the site never needs an account.
- Registering creates the account **and** a `pending` directory record in one transaction. The
  account owns the record through `alumni.userId`. Approval is refused while the account's email
  is unconfirmed, so a profile cannot be published for an address nobody proved they read.
- The account starts as `donor`. `approveAlumnus()` promotes it to `alumni` in the same
  transaction that publishes the profile; `rejectAlumnus()` demotes an alumnus back to `donor`,
  but never an administrator. A pending registration therefore has normal-user access and
  cannot read `alumni_only` records before the Association has approved it.
- Directory reads resolve the viewer from the session (`getViewer()`). `alumni` and `admin` see
  `alumni_only` profiles and contact fields; `donor` accounts and signed-out visitors see only
  the public directory. The cached getters take the viewer as an argument, so the two views
  have separate cache entries.
- Email confirmation uses Better Auth's email-OTP plugin: six digits by default, hashed in the
  `verification` table, 15-minute lifetime, five wrong guesses, and a per-address send limit.
  The verify call signs the member in (`autoSignInAfterVerification`).
- An imported register row (CSV, no account) is **claimed** when someone registers with that
  address, instead of creating a second profile for the same person.
- A signed-in member administers their own record at `/account/profile` through `PATCH
  /api/v1/account/profile`. The Zod schema omits email, programme, batch year and status, and
  the service writes only the fields in that schema, so a crafted request cannot promote or
  republish itself. Editing a rejected profile returns it to `pending` for a fresh review;
  editing an approved one goes live immediately.
- Members list up to eight expertise tags (`alumni.expertise`, `text[]`). The directory search,
  card and profile page include them; the API normalises and de-duplicates them before write.
- `getSession()` reads the cookie through `headers()`; `requireSession()` and `requireAdmin()`
  throw `AuthError`, which `fail()` maps to 401 and 403.
- Administrators may enrol TOTP at `/admin/security`. Once enabled, a password sign-in returns
  a two-factor challenge rather than a session; `/api/auth/two-factor/verify-totp` or a backup
  code completes it. Secrets are encrypted with `BETTER_AUTH_SECRET` and backup codes are
  hashed. `ADMIN_RESET_2FA=true npm run db:admin` is the break-glass recovery.
- Approving or rejecting a self-registered profile emails its owner. A CSV-imported record has
  no account and is never emailed, because the Association has no consent from that person.
  Delivery uses `sendEmailSafely()`, so a provider failure never changes the decision.
- Sessions live 24 hours absolutely, refresh on activity and expire after 30 idle minutes for
  admins. Passwords are at least 8 characters.
- A password being **chosen** (sign-up, change-password, the reset link) is checked against the
  Have I Been Pwned range API before Better Auth sees it: `src/app/api/auth/[...all]/route.ts`
  calls `guardPasswordPost()`, which hashes locally and sends only a five-character hash prefix.
  One published appearance rejects with `PASSWORD_BREACHED`; a lookup failure, the hourly
  outbound budget or a timeout all fail open, and sign-in is never checked (tracker E2).
- Cookie-authenticated writes pass `assertSameOrigin(request)` and a double-submit CSRF check, so
  a cross-site form post can neither spend a donor's session nor act as an admin. Better Auth
  also rate-limits sign-in and sign-up.

---

## 6. Payments

Step-by-step usage, reconciliation and troubleshooting are in
[`DB-AND-PAYMENTS.md`](./DB-AND-PAYMENTS.md).

`PAYMENT_MODE` must be set to `sandbox` or `live`; there is no simulator and no code path that
marks a donation paid without the gateway. In both modes the donation starts as `pending` and
the browser is sent to the chosen gateway: eSewa, Khalti, or ConnectIPS when it is configured.

Flow:

1. `POST /api/v1/donations` validates the amount and goal, writes a `pending` donation, and asks
   the gateway for a redirect (`url`, `method`, `fields`). The checkout posts that form and leaves
   the site.
2. The gateway returns the donor to `/api/v1/payments/[gateway]/callback`.
3. The adapter verifies the response: eSewa re-signs the callback payload with HMAC-SHA256 and
   compares in constant time; Khalti looks the transaction up server-side with its secret key;
   ConnectIPS calls its validation endpoint with Basic auth and a signed token, resolving the
   donation by `gateway_order_ref` because its return carries only a 20-character `TXNID`.
   A callback that fails verification never marks a donation paid.
4. `completeDonation()` marks the donation `succeeded`, adds to the goal total, and emails the
   receipt. It is idempotent: a repeat callback for an already-paid donation does not double
   count, and a `failed` callback cannot overwrite a `succeeded` one.
5. The donor lands on `/donate/thank-you` with the reference.

Every callback payload is kept in `payment_events` for reconciliation.

**Keys** (put them in `.env.local` or the platform's secret store, never in the repo):

- eSewa: `ESEWA_PRODUCT_CODE`, `ESEWA_SECRET_KEY`; `ESEWA_GATEWAY_URL` is required in live mode.
- Khalti: `KHALTI_SECRET_KEY`; `KHALTI_BASE_URL` is required in live mode.
- ConnectIPS: `CONNECTIPS_BASE_URL`, `CONNECTIPS_MERCHANT_ID`, `CONNECTIPS_APP_ID`,
  `CONNECTIPS_APP_NAME`, `CONNECTIPS_APP_PASSWORD`, plus the signing key as
  `CONNECTIPS_PRIVATE_KEY` or `CONNECTIPS_PRIVATE_KEY_PATH` (a PEM file converted from NCHL's
  `CREDITOR.pfx`). A partial configuration is a production startup error.

At least one gateway must be configured or production startup fails. The checkout offers only a
gateway whose adapter exists and whose credentials are complete: eSewa, Khalti and ConnectIPS.
Fonepay has no adapter yet (C7b) and is never offered.

### Testing eSewa in the sandbox

The sandbox merchant is configured and its signed form is accepted by
`rc-epay.esewa.com.np`. To run a payment by hand:

1. Set `PAYMENT_MODE=sandbox` in `.env.local` and restart the dev server.
2. Donate on `/donate/checkout`, choose eSewa, confirm. The browser lands on the eSewa ePay login.
3. Sign in with a sandbox customer: `9806800001` (or `...0002`–`...0005`), password `Nepal@123`,
then token `123456`.
4. eSewa returns to `/api/v1/payments/esewa/callback`, which verifies the signature, marks the
donation paid and sends the receipt.

Sandbox credentials: merchant `EPAYTEST`, secret `8gBm/:&EnhH.1/q`. Production merchant keys come
from eSewa after the Association's merchant account is approved.

### ConnectIPS (built 29 October 2026)

The adapter is `src/server/payments/connectips.ts`. It stays hidden until every setting below is
present, so a half-configured gateway never appears at checkout.

1. `buildConnectipsForm()` signs an RSA-SHA256 token over
   `MERCHANTID,APPID,APPNAME,TXNID,TXNDATE,TXNCRNCY,TXNAMT,REFERENCEID,REMARKS,PARTICULARS,TOKEN`
   and posts it to `{CONNECTIPS_BASE_URL}/connectipswebgw/loginpage`. Both `TXNID` and
   `REFERENCEID` carry the donation's `gateway_order_ref` : 20 uppercase hex characters stored
   when the donation is written : because `TXNID` is capped at 20 and the donation id is longer.
2. connectIPS returns the donor to the registered success or failure URL with only `?TXNID=`.
   `verify()` finds the donation by `gateway_order_ref` and calls
   `{CONNECTIPS_BASE_URL}/connectipswebws/api/creditor/validatetxn` with Basic auth
   (`APPID:APP_PASSWORD`) and a token over `MERCHANTID,APPID,REFERENCEID,TXNAMT`. Only
   `status: "SUCCESS"` counts as paid, and the returned `txnAmt` must match the stored amount
   (the same check every gateway goes through in `completeDonation()`).
3. NCHL issues `CREDITOR.pfx`. Node cannot read PKCS#12, so convert it once:
   `openssl pkcs12 -in CREDITOR.pfx -nocerts -nodes -out connectips.key` and set
   `CONNECTIPS_PRIVATE_KEY_PATH` (or paste the PEM into `CONNECTIPS_PRIVATE_KEY`).
4. The official docs publish only `{base_url}`; NCHL supplies the UAT and production hosts.
   `npm run connectips:accept` signs a form, posts it to the login page and calls
   `validatetxn`, so a credential or signing problem is visible before a donor tries to pay.
   Add `-- --dry-run` to sign without sending anything. It cannot complete the OTP, so one
   browser sandbox donation is still required. Nothing has been run against NCHL UAT yet : the
   merchant pack is still outstanding.

### Fonepay (agreed 29 October 2026, not built)

No current official API manual is public; the only technical reference is a 2020 mirror with
conflicting sandbox paths and callback-signature rules. Do not implement from it. Obtain Fonepay's
current integration document, reserve the variables listed in `HANDOVER.md` §2, then verify every
return with its status API.

Credentials and onboarding are in `HANDOVER.md` §2; acceptance criteria are in `TRACKER.md` C7b.

---

## 7. Email

`sendEmail()` in `src/server/email` is the single send path.

- `EMAIL_TRANSPORT=console` (local default) prints the message to the terminal. In production
  this transport refuses to send, and startup fails unless `EMAIL_TRANSPORT=resend`.
- `EMAIL_TRANSPORT=resend` posts to Resend using `RESEND_API_KEY` and `EMAIL_FROM`.
- Delivery never blocks the action. Every service calls `sendEmailSafely()`, which logs a rejected
  message and still records the donation, RSVP or ticket.

**Before launch the Association must verify a sending domain in Resend.** Until then the
`onboarding@resend.dev` sender only delivers to the Resend account owner, and other recipients
are rejected. Verify the alumni domain (or `bpkihs.edu`), add its DNS records, and set
`EMAIL_FROM` to an address on it. Receipts to real donors work only after that step.

Messages currently sent:

| Trigger                        | Recipient        |
| ------------------------------ | ---------------- |
| Confirmed donation             | donor            |
| Event RSVP confirmed / waitlisted | attendee      |
| Helpdesk ticket created        | sender           |
| General contact enquiry        | sender           |
| Confirmed tribute gift         | the person named in the tribute |
| Newsletter confirmation        | the pending address (double opt-in) |
| Newsletter campaign            | every subscribed address |
| Monthly digest                 | every subscribed address |
| Alumni profile approved        | the member (self-registrations only) |
| Alumni profile rejected        | the member (self-registrations only) |

Subscription is **double opt-in**. `POST /newsletter` writes the row as `pending` and emails a
confirmation link; nothing is mailed to the address until its owner opens the link and presses
the button on `/community/newsletter/confirm`. That page posts to `POST /newsletter/confirm`, so
a link a scanner fetches changes nothing, and the token is the only thing that promotes the row.
Only `subscribed` rows receive campaigns or the digest, and the admin list shows `pending` as
"Awaiting confirmation". Repeating the form while a confirmation is fresh (15 minutes) sends no
second email, so the public endpoint cannot be used to flood an inbox.

A subscribe answers `{ ok: true, confirmationEmailSent }`. When the provider refuses the
message the flag is `false`, the form tells the visitor instead of pointing them at an inbox
nothing will arrive in, and `confirmation_sent_at` stays null : so pressing the button again
sends another attempt immediately rather than waiting out the window. An address that is
already confirmed needs no email and answers `true`, which keeps the public response from
revealing who is on the list.

Campaigns use Resend's batch endpoint (`sendEmailBatch`) in chunks of `NEWSLETTER_BATCH_SIZE`, with
`NEWSLETTER_MAX_RECIPIENTS` as a hard cap. Each message links to the newsletter preferences page so
the reader can unsubscribe. Delivery is recorded on `newsletter_campaigns`.

The monthly digest is built and sent by `npm run newsletter:digest`
(`scripts/send-newsletter-digest.ts`): the three newest posts, the next three events and the
active giving goals, with each subscriber's own unsubscribe link. It records a
`newsletter_campaigns` row like any other campaign and skips a run when this month's subject has
already sent, so a repeated cron entry cannot mail the list twice. `--dry-run` prints the message
and the recipient count without sending. The cron entry itself is an install step : see
`DEPLOYMENT.md` §9.

The approval and rejection copy lives in `src/content/email.ts`. It deliberately does not quote
the internal rejection reason: the email points the member at `/account`, where the reason is
shown in context and the profile can be corrected and resubmitted. The Association should still
review the wording before the first real send.

---

## 8. What is still open

Deliberately out of scope for this pass, in rough order of value:

1. **Live merchant accounts and a verified email domain.** Sandbox credentials are only for
   testing; real donations need production keys from eSewa/Khalti, and real receipts need a
   verified Resend domain.
2. **Object storage for photos.** Profile photos use the documented VPS disk. A multi-instance
   or ephemeral-filesystem deployment needs an object-storage driver before it is suitable.
3. **ConnectIPS credentials and Fonepay.** The ConnectIPS adapter is built but not yet run against
   NCHL UAT, because the merchant pack is outstanding; Fonepay awaits its current integration
   document (`TRACKER.md` C7a/C7b).
4. **Installed digest schedule.** `npm run newsletter:digest` sends the monthly digest on demand
   (`--dry-run` previews it); the cron entry still has to be added to the host.
5. **Shared rate limiting** if the site runs more than one instance.
6. **Breached-password lookup (HIBP).** Not wired; it adds a network call to sign-up and reset.
   TOTP is available for administrators.
7. **Installed backup and alert schedules.** `scripts/backup-db.sh` and
   `scripts/healthcheck.sh` exist; the host cron entries and the external monitor still have to
   be installed at launch. See `DEPLOYMENT.md` §9.

---

## 9. Checks

```bash
npm run typecheck && npm run lint && npm run test && npm run build
npm run test:e2e          # needs Postgres up
```

Unit tests cover the schemas, privacy trimming, payment signature verification, gateway
configuration and the write paths. Browser tests cover sign-in, registration, RSVP, community
submission, the public pages, the admin flows (approving a registration, publishing a post,
changing a ticket status) and the checkout redirect to the gateway.

`npm run ci` runs format, typecheck, lint, unit tests and a production build.
