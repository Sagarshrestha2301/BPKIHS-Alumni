# Handover : BPKIHS Alumni Association website

Everything a new maintainer or the Association office needs: the logins that exist today, the
accounts that must be opened in the Association's own name, where every secret lives, the API,
and the order to go live in. Daily instructions are in [`docs/HOWTO.md`](./docs/HOWTO.md); this
file is the transfer document.

**What this is.** A Next.js 16 (App Router, TypeScript) site with one Postgres 16 database. One
data path: the browser talks to `/api/v1/*`, the server talks to Postgres. There is no mock mode,
no demo dataset and no payment simulator : if the database or a gateway is missing, the site
fails loudly instead of pretending.

> **Do not commit this file after filling in real secrets.** `.env*` is git-ignored; this file is
> not. Keep the filled-in copy off version control.

---

## 1. Logins that work right now

This is your local development database (`docker compose` container `bpkihs-postgres`, port 5433).
None of it is production.

| What                | Where                                                      | Username                   | Password                     |
| ------------------- | ---------------------------------------------------------- | -------------------------- | ---------------------------- |
| **Admin dashboard** | <http://localhost:3000/admin/sign-in>                      | `admin@bpkihs.local`       | `E2eTestAdmin!99`            |
| **Database**        | `postgres://bpkihs:bpkihs_dev@localhost:5433/bpkihs`       | `bpkihs`                   | `bpkihs_dev`                 |
| **Database (psql)** | `docker exec -it bpkihs-postgres psql -U bpkihs -d bpkihs` | `bpkihs`                   | `bpkihs_dev`                 |
| **Drizzle Studio**  | `npm run db:studio`                                        | :                          | uses `DATABASE_URL`          |
| **Member account**  | <http://localhost:3000/sign-in>                            | the address you registered | the password you chose there |

The admin address is `.local`, so it can never be used in production. **Verified working** against
the running dev server (HTTP 200 from `/api/auth/sign-in/email`).

### Two things to clean up in this database

`admin@example.org` is also an admin, created during an earlier test with a password nobody
recorded. Reset or delete it before this database is ever copied anywhere:

```sql
-- pick one
UPDATE "user" SET role = 'alumni' WHERE email = 'admin@example.org';
DELETE FROM "user" WHERE email = 'admin@example.org';
```

`e2e.admin.*@example.com` (six rows) and `sagarshrestha6547@gmail.com` are test registrations from
the registration work. The last one is a real pending registration; approve or reject it in
`/admin/alumni`, or delete it:

```sql
DELETE FROM "user" WHERE email LIKE 'e2e.%' OR email LIKE 'e2e.admin.%';
```

### Resetting an admin password

Members reset their own password from `/sign-in` → **Forgotten your password?**. This command is
the break-glass path for an administrator:

```bash
ADMIN_EMAIL=admin@bpkihs.local \
ADMIN_PASSWORD='a-long-new-password' \
ADMIN_NAME='Association Admin' \
npm run db:admin
```

The script creates the account if it does not exist, or promotes the existing one and replaces its
password. It enforces an 8-character minimum and rejects a short weak-password list.

Production requires TOTP for administrators: an account without it can reach `/admin/security`
and nothing else in the dashboard, and `/api/v1/admin/*` answers 403. If the administrator has
lost both the authenticator and the backup codes, add `ADMIN_RESET_2FA=true`. That is the
documented break-glass path; it removes only that account's authenticator and resets its
password. Enrol again immediately after signing in.

---

## 2. Accounts the Association must own

Nothing here can be registered on the Association's behalf. Each row is an account in **its**
name, with credentials that stay with the office.

| Service                 | Why it is needed                                                      | Where to create it                                     | What you get                                                                                                  |
| ----------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Resend** (email)      | registration codes, donation receipts, RSVP confirmations, newsletter | <https://resend.com>                                   | `RESEND_API_KEY`, plus a verified sending domain                                                              |
| **eSewa merchant**      | eSewa donations, real money                                           | <https://developer.esewa.com.np> → merchant onboarding | `ESEWA_PRODUCT_CODE`, `ESEWA_SECRET_KEY`, live `ESEWA_GATEWAY_URL`                                            |
| **Khalti merchant**     | Khalti donations, real money                                          | <https://docs.khalti.com> → merchant onboarding        | `KHALTI_SECRET_KEY`, live `KHALTI_BASE_URL`                                                                   |
| **ConnectIPS merchant** | ConnectIPS donations, real money                                      | Association's bank → NCHL technical enrollment         | merchant ID, app ID/name, app password, signing certificate, UAT/production base URLs, registered return URLs |
| **Fonepay merchant**    | Fonepay donations, real money                                         | Association's bank or Fonepay                          | merchant code (`PID`), shared secret, status-API credentials, current integration document, base URLs         |
| **Domain registrar**    | the public hostname                                                   | any registrar                                          | the domain, and control of DNS records                                                                        |
| **DNS / email records** | SPF, DKIM, DMARC so mail is delivered                                 | wherever DNS is hosted                                 | the records Resend gives you                                                                                  |
| **Server or host**      | runs the Node process                                                 | Association's choice                                   | a Linux host with Node 20+ and a public IP                                                                    |
| **Postgres 16**         | the data                                                              | the same host, or a managed provider                   | `DATABASE_URL`                                                                                                |
| **Backup storage**      | nightly database dumps                                                | any object storage                                     | a bucket and a retention policy                                                                               |

### Public sandbox credentials (safe to share, take no real money)

These are eSewa's published test values, not secrets, and they are already in `.env.example`:

```
PAYMENT_MODE=sandbox
ESEWA_PRODUCT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_GATEWAY_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
```

Khalti's sandbox key is per-developer-account : copy the one already in your `.env.local`.

### ConnectIPS and Fonepay (agreed 29 October 2026 : not live yet)

Both were agreed as real gateways. **ConnectIPS is built** (29 Oct 2026) and appears at checkout
only once every value below is present; **Fonepay has no adapter yet**. There is still no
simulator, and a half-configured gateway stays hidden rather than failing after the donor chooses
it (`TRACKER.md` C7a/C7b).

**ConnectIPS (NCHL)**

1. Apply through the Association's bank. The bank completes KYC and sends the merchant for NCHL
   technical enrollment. NCHL then issues the merchant ID, app ID/name, app password and signing
   certificate (`CREDITOR.pfx`), and confirms the UAT and production base URLs. The public docs
   use a `{base_url}` placeholder and publish neither host : take both from NCHL.
2. Register the static success and failure URLs with NCHL integration support. Both can be
   `https://<APP_URL>/api/v1/payments/connectips/callback`; localhost is accepted for UAT.
   ConnectIPS appends only `?TXNID=` and the adapter validates the transaction server-side.
3. Put these in `.env.local` or the host secret store: `CONNECTIPS_BASE_URL`,
   `CONNECTIPS_MERCHANT_ID`, `CONNECTIPS_APP_ID`, `CONNECTIPS_APP_NAME`, `CONNECTIPS_APP_PASSWORD`,
   and the signing key. NCHL issues `CREDITOR.pfx`; Node cannot read PKCS#12, so convert it once
   and keep the PEM private:

   ```bash
   openssl pkcs12 -in CREDITOR.pfx -nocerts -nodes -out connectips.key
   chmod 600 connectips.key
   ```

   Then set `CONNECTIPS_PRIVATE_KEY_PATH=./connectips.key`, or paste the PEM into
   `CONNECTIPS_PRIVATE_KEY` (literal `\n` escapes are accepted).

4. Check the credentials before a browser payment:

   ```bash
   npm run connectips:accept            # sign, post the initiation form, call validation
   npm run connectips:accept -- --dry-run   # sign only, nothing leaves the machine
   ```

   It prints PASS/WARN/FAIL per step and exits non-zero on a failure. A pass proves NCHL accepted
   the merchant credentials and the RSA token; it cannot complete the OTP, so run one sandbox
   donation next, confirm the goal total and receipt, then switch to the production host and live
   keys. The adapter and its unit tests are in place; this sandbox run is the remaining acceptance
   step.

Amounts are paisa, `TXNDATE` is `DD-MM-YYYY`, and the initiation token is RSA-SHA256 over the
official comma-separated string (ending `TOKEN=TOKEN`). Validation uses Basic auth with the app
ID and password plus a separately signed token. `TXNID` is at most 20 characters, so the donation
stores a short `gateway_order_ref` and the adapter resolves it on return; the amount in the
validation token comes from that stored donation, never from the URL. The browser return is never
proof of payment.

**Fonepay**

1. Apply through the Association's bank or Fonepay. Ask for the **current** merchant integration
   document as well as the merchant code (`PID`), shared secret, status-API username/password,
   sandbox and production base URLs, and the return-URL registration procedure.
2. Register `https://<APP_URL>/api/v1/payments/fonepay/callback` as the return URL (`RU`).
3. Put the values in `.env.local` or the host secret store: `FONEPAY_BASE_URL`,
   `FONEPAY_MERCHANT_CODE`, `FONEPAY_SECRET_KEY`, and `FONEPAY_API_USERNAME` /
   `FONEPAY_API_PASSWORD` if the status API uses them. Final names are confirmed with the adapter.
4. Run one sandbox donation before going live.

Do not implement from the 2020 "Web Integration 2.0" document that circulates online: its
sandbox paths and callback-signature rules conflict, and no current Fonepay-hosted API manual is
public. The return parameters are untrusted; the adapter must verify the transaction with
Fonepay's status API and compare the amount before completion.

---

## 3. Every environment variable

Two places only: `.env.local` for development (git-ignored, copied from `.env.example`), and the
hosting platform's environment for production. Never both conflicting : the process environment
wins.

### Required in production

| Variable               | What it is                                                           | Development value                                            |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`         | Postgres connection string                                           | `postgres://bpkihs:bpkihs_dev@localhost:5433/bpkihs`         |
| `BETTER_AUTH_SECRET`   | signing key for sessions and codes, ≥32 chars                        | generate, below                                              |
| `APP_URL`              | public origin used for redirects and payment returns, https, no path | `http://localhost:3000`                                      |
| `NEXT_PUBLIC_SITE_URL` | same origin at build time, for canonical links                       | `http://localhost:3000`                                      |
| `PAYMENT_MODE`         | `sandbox` or `live` : nothing else                                   | `sandbox`                                                    |
| `ESEWA_PRODUCT_CODE`   | eSewa merchant product code                                          | `EPAYTEST`                                                   |
| `ESEWA_SECRET_KEY`     | eSewa signature secret                                               | sandbox value above                                          |
| `ESEWA_GATEWAY_URL`    | eSewa form endpoint, required when live                              | sandbox URL above                                            |
| `KHALTI_SECRET_KEY`    | Khalti secret key                                                    | from your Khalti account                                     |
| `KHALTI_BASE_URL`      | Khalti API base, required when live                                  | `https://dev.khalti.com/api/v2`                              |
| `EMAIL_TRANSPORT`      | `console` or `resend`; production must be `resend`                   | `console`                                                    |
| `RESEND_API_KEY`       | Resend API key                                                       | :                                                            |
| `EMAIL_FROM`           | verified sender, e.g. `Alumni <no-reply@domain>`                     | `"BPKIHS Alumni Association <no-reply@bpkihs-alumni.local>"` |
| `CONTACT_EMAIL`        | public office address shown on `/support`                            | :                                                            |
| `PHOTO_UPLOAD_DIR`     | writable persistent directory for profile photos                     | `.uploads/photos` (dev)                                      |

`npm run check:env` refuses a deploy that is missing any of these, and the server throws at start
(`src/server/env.ts`). ConnectIPS variables are read: a partial set fails `check:env`, and a
complete set adds the gateway. The Fonepay variables listed in §2 are still reserved and ignored
until C7b lands. Generate the auth secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### Optional, with safe defaults

| Variable                                                     | Default                     | Meaning                             |
| ------------------------------------------------------------ | --------------------------- | ----------------------------------- |
| `OTP_LENGTH`                                                 | `6`                         | digits in a registration code       |
| `OTP_EXPIRES_MINUTES`                                        | `15`                        | how long a code lives               |
| `OTP_MAX_ATTEMPTS`                                           | `5`                         | wrong guesses before the code dies  |
| `OTP_RESEND_COOLDOWN_SECONDS`                                | `60`                        | wait between sends                  |
| `AUTH_OTP_MAX` / `AUTH_OTP_WINDOW_SECONDS`                   | `3` / `60`                  | code-send rate limit per address    |
| `APP_NAME`                                                   | BPKIHS Alumni Association   | email signatures, auth screens      |
| `SUPPORT_REFERENCE_PREFIX`                                   | `BPK`                       | helpdesk reference prefix           |
| `CONTACT_PHONE`, `CONTACT_ADDRESS`, `CONTACT_HOURS`          | empty                       | shown on `/support`                 |
| `NEXT_PUBLIC_SITE_TIME_ZONE` / `NEXT_PUBLIC_SITE_UTC_OFFSET` | `Asia/Kathmandu` / `+05:45` | date display and entry              |
| `TRUST_PROXY`                                                | `true` in production        | set only behind a proxy you control |
| `SESSION_MAX_AGE_HOURS`                                      | `24`                        | absolute session lifetime           |
| `SESSION_UPDATE_AGE_MINUTES`                                 | `15`                        | sliding refresh window              |
| `ADMIN_REAUTH_AFTER_MINUTES`                                 | `30`                        | admin idle timeout                  |
| `MAX_REQUEST_BYTES`                                          | `131072`                    | largest accepted JSON body          |
| `HSTS_MAX_AGE_SECONDS`                                       | `15552000`                  | HSTS max-age (180 days)             |
| `NEWSLETTER_BATCH_SIZE` / `NEWSLETTER_MAX_RECIPIENTS`        | `50` / `2000`               | send batching and hard cap          |
| `IMAGE_HOSTS`                                                | `bpkihs.edu`                | hosts allowed for `next/image`      |
| `PHOTO_UPLOAD_DIR`                                           | `.uploads/photos`           | persistent profile-photo directory  |
| `PHOTO_MIN_DIMENSION` / `PHOTO_MAX_DIMENSION`                | `200` / `6000`              | accepted source dimensions          |
| `PHOTO_OUTPUT_SIZE` / `PHOTO_QUALITY`                        | `512` / `82`                | stored WebP size and quality        |

### Where the current values are

| Secret               | Current location                                                     |
| -------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`       | `.env.local` (dev)                                                   |
| `BETTER_AUTH_SECRET` | `.env.local` (dev)                                                   |
| `RESEND_API_KEY`     | `.env.local` (dev) : obtainable again only from the Resend dashboard |
| `KHALTI_SECRET_KEY`  | `.env.local` (dev) : from the Khalti dashboard                       |
| Production values    | do not exist yet; set them at deploy time in the host's environment  |

If you are handing this to a person outside the Association, rotate `BETTER_AUTH_SECRET`
and the Resend key first: rotating the auth secret signs every session out and invalidates
outstanding codes, which is the intended behaviour.

---

## 4. The API

Base `/api/v1`, JSON in and JSON out, same-origin. Every mutation is POST/PATCH/DELETE with an
`Origin` check and a double-submit CSRF token; the browser client in `src/lib/api/http/index.ts`
does this for you. Mutations are rate limited per IP.

Errors always look like this, and the response carries `X-Request-Id` (also logged server-side,
which is what to quote when reporting a failure):

```json
{
  "error": { "code": "validation", "message": "Check the highlighted fields.", "fields": {} },
  "requestId": "…"
}
```

Codes: `validation` 422, `unauthorized` 401, `forbidden` 403, `not_found` 404, `conflict` 409,
`rate_limited` 429, `unavailable` 503, `server` 500, `not_implemented` 501.

### Public

| Method     | Path                                                                         | Purpose                                                          |
| ---------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| GET        | `/api/health`                                                                | liveness plus database check : point monitoring here             |
| POST       | `/api/v1/registrations`                                                      | register: creates the account and pending profile, emails a code |
| POST       | `/api/v1/registrations/resend`                                               | resend the code                                                  |
| GET        | `/api/v1/alumni`, `/api/v1/alumni/filters`, `/api/v1/alumni/[id]`            | directory (approved profiles only)                               |
| GET        | `/api/v1/events`, `/api/v1/events/[slug]`                                    | events                                                           |
| POST       | `/api/v1/events/[slug]/rsvp`                                                 | RSVP                                                             |
| GET        | `/api/v1/feed`, `/api/v1/posts`                                              | community feed; `POST /api/v1/posts` submits a story             |
| POST       | `/api/v1/posts/[id]/report`                                                  | report a post                                                    |
| GET        | `/api/v1/goals`, `/api/v1/goals/[id]`, `/api/v1/funds`                       | giving goals                                                     |
| POST       | `/api/v1/donations`                                                          | start a donation, returns the gateway redirect                   |
| GET/POST   | `/api/v1/payments/[gateway]/callback`                                        | eSewa/Khalti return and verification                             |
| POST/PATCH | `/api/v1/newsletter`                                                         | subscribe, confirm, unsubscribe                                  |
| POST       | `/api/v1/support`                                                            | helpdesk ticket (members, after sign-in)                         |
| POST       | `/api/v1/contact`                                                            | general / institutional enquiry, no account needed               |
| GET        | `/api/v1/faq`, `/api/v1/board`, `/api/v1/site/stats`, `/api/v1/site/welcome` | content                                                          |

### Admin (session cookie + `role = 'admin'`, idle timeout applies)

`/api/v1/admin/overview`, `/admin/alumni` (+ `[id]/approve`, `[id]/reject`, `import`),
`/admin/posts` (queue on GET, staff post created already-published on POST, plus `[id]`
PATCH/DELETE and `[id]/approve`, `[id]/reject`), `/admin/reports` (+ resolve), `/admin/tickets`
(+ `[id]`), `/admin/donations`, `/admin/newsletter`, `/admin/audit`, `/admin/content` (+ `board`,
`events`, `faq`, `funds`, `goals`, `welcome` : each with GET/POST and PATCH/DELETE by id).

Everything an admin does is written to the audit log with the actor, target and time.

The ledger can also be downloaded: `GET /api/v1/admin/donations/export` returns a CSV (reference,
amount in NPR, method, status, goal, recorded time), optionally narrowed with `?status=`, capped
at `EXPORT_MAX_ROWS` and recorded in the audit log.

The full data model, payment sequence and auth design are in
[`docs/BACKEND.md`](./docs/BACKEND.md).

---

## 5. Go-live order

1. Create the Postgres database and set `DATABASE_URL`.
2. Set every variable in section 3, with `PAYMENT_MODE=sandbox` and `EMAIL_TRANSPORT=console` first.
3. `npm ci`, then `npm run check:env`. Fix everything it lists.
4. `npm run build`, then `npm run db:migrate:prod`.
5. `ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_NAME=… npm run db:admin` : this is the production admin,
   not the `.local` one.
6. Verify the sending domain in Resend (SPF, DKIM, DMARC), set `EMAIL_FROM`, switch
   `EMAIL_TRANSPORT=resend`, and send one real message to a non-owner address.
7. Put the merchant credentials in, take **one real small donation** with `PAYMENT_MODE=live`,
   confirm it appears in `/admin/donations` and that the receipt arrives, then refund it.
8. Point DNS at the host, issue TLS, and confirm `APP_URL` and `NEXT_PUBLIC_SITE_URL` match it
   exactly.
9. Migrate the written alumni register (choosing whether each file may be published or is held
   for review), enter board members, FAQ, goals, events, the funds breakdown and contact details.
10. Schedule nightly `pg_dump` backups and a photo-directory archive to off-host storage, monitor
    `/api/health`, and keep an eye on the audit log.
11. Install the monthly digest: `5 7 1 * * cd /srv/bpkihs-alumni && npm run newsletter:digest`
    (preview it first with `npm run newsletter:digest -- --dry-run`).

Steps 1–5 are in [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md). Steps 6–10 are the Association's
own work; nothing here can be done without their credentials.

---

## 6. What is not finished

[`docs/TRACKER.md`](./docs/TRACKER.md) is the authoritative list. The four things that block
launch: live merchant credentials, a verified sending domain, real Association content, and legal
and privacy sign-off. The browser suite seeds its own fixtures before it runs, so a fresh
checkout only needs Postgres up.

Not built: the Fonepay adapter (ConnectIPS is built and waits on NCHL's UAT pack; see §2) and
shared rate limiting across more than one server instance (the limiter is in-process, so a single
instance is assumed). Profile photos are now
uploaded and served through the app; they require a persistent `PHOTO_UPLOAD_DIR` and are backed
up separately from the database.

---

## 7. Routine work

| How often     | What                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| As it arrives | approve or reject registrations in `/admin/alumni`, publish or reject posts, answer tickets                                  |
| Weekly        | check `/admin/donations` against the bank statement, resolve reports, look at the audit log                                  |
| Monthly       | read backups (restore one into a scratch database), `npm audit`, `npm outdated`, update dependencies and re-run `npm run ci` |     | Before any change | `npm run ci` must pass: format, types, lint, 387 unit tests, build. `npm run test:e2e` seeds its own fixture accounts and goal, so it needs nothing prepared |

Troubleshooting lives in [`docs/HOWTO.md`](./docs/HOWTO.md) section 9. Two entries worth knowing
before you start: a dev server that logs `ECONNREFUSED` is a stopped database, not a bug
(`npm run db:up`); and a sign-in that answers "Too many requests" is the rate limiter, which
allows five sign-ins per minute per IP.

---

## 8. Document map

| File                                                   | Read it for                                                                   |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [`README.md`](./README.md)                             | overview, requirements, commands                                              |
| [`docs/HOWTO.md`](./docs/HOWTO.md)                     | setup, admin tasks, content, email, registration, deployment, troubleshooting |
| [`docs/DB-AND-PAYMENTS.md`](./docs/DB-AND-PAYMENTS.md) | using the database, taking and reconciling payments                           |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)           | production runbook, checklist, rollback                                       |
| [`docs/SECURITY.md`](./docs/SECURITY.md)               | threat model and controls                                                     |
| [`docs/BACKEND.md`](./docs/BACKEND.md)                 | API, data model, auth, payments                                               |
| [`docs/CONTEXT.md`](./docs/CONTEXT.md)                 | decisions and architecture history                                            |
| [`docs/TRACKER.md`](./docs/TRACKER.md)                 | what is still open                                                            |
| [`docs/DESIGN.md`](./docs/DESIGN.md)                   | design system and page specs                                                  |
