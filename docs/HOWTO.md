# How to run and operate the site

This is the practical guide for whoever runs the BPKIHS Alumni Association website: setting it
up locally, signing in, entering content, moderating the community, sending the newsletter,
handling donations, and keeping the production server healthy.

The deeper architecture notes are in [`BACKEND.md`](./BACKEND.md); security decisions are in
[`SECURITY.md`](./SECURITY.md); the release checklist is in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## 1. What you are running

One Next.js application with one Postgres database. There is no separate backend service, no
mock mode, and no payment simulator.

- Public pages read through Server Components and the services in `src/server/services`.
- The browser calls the JSON API under `/api/v1` for writes.
- `/admin` is a separate dashboard for Association administrators.
- Payments go to eSewa or Khalti; email goes to Resend in production.

You need Node.js 20.9+ (22 LTS recommended), npm, git, and Postgres 16. Docker is optional and is
the quickest way to get Postgres locally.

---

## 2. First local setup

### 2.1 Install and configure

Windows PowerShell:

```powershell
cd bpkihs-alumni
npm install
Copy-Item .env.example .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Bash or macOS/Linux:

```bash
cd bpkihs-alumni
npm install
cp .env.example .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Paste the generated value into `BETTER_AUTH_SECRET` in `.env.local`. The other values you must
decide now:

| Variable               | Local value                                        |
| ---------------------- | -------------------------------------------------- |
| `APP_URL`              | `http://localhost:3000`                            |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (same origin)              |
| `PAYMENT_MODE`         | `sandbox`                                          |
| `EMAIL_TRANSPORT`      | `console` (prints email to the terminal)           |
| `EMAIL_FROM`           | any address for local use                          |

`NEXT_PUBLIC_SITE_URL` is baked in at build time. `APP_URL` is read at runtime, so payment
callbacks and auth redirects follow it without a rebuild.

### 2.2 Start the database

```bash
npm run db:up        # Postgres 16 on port 5433
npm run db:migrate   # apply drizzle/ migrations
```

On Windows, Docker Desktop must be running. If you use your own Postgres, set `DATABASE_URL` and
skip `db:up`.

### 2.3 Create the first administrator

There is no default account. Use an email you control and a password of at least 12 characters:

```bash
ADMIN_EMAIL="you@example.org" ADMIN_PASSWORD="a-long-unique-password" ADMIN_NAME="Your Name" npm run db:admin
```

PowerShell:

```powershell
$env:ADMIN_EMAIL="you@example.org"; $env:ADMIN_PASSWORD="a-long-unique-password"; $env:ADMIN_NAME="Your Name"; npm run db:admin
```

The command is safe to rerun. If the account exists, it promotes it to `admin` and resets the
password; that is also the recovery path if an administrator forgets the password.

### 2.4 Start the site

```bash
npm run dev
```

Open <http://localhost:3000>. Sign in at <http://localhost:3000/admin/sign-in>.

Next serves the port in `PORT`, and this machine exports `PORT=0` in some shells, which makes
`next dev` pick any free port. Use `PORT=3000 npm run dev` if the printed address is not 3000.
The browser suite pins the port itself, so `npx playwright test` needs no prefix.

The database is empty by design. Public pages show empty states until you add content through
`/admin/content`.

---

## 3. The admin dashboard

| Screen        | Path               | What you do there                                            |
| ------------- | ------------------ | ------------------------------------------------------------ |
| Overview      | `/admin`           | Queue counts and headline numbers                            |
| Registrations | `/admin/alumni`    | Approve or reject alumni registrations; search and filter     |
| Posts         | `/admin/posts`     | Publish or reject community submissions                      |
| Reports       | `/admin/reports`   | Review or dismiss reports on published posts                 |
| Support       | `/admin/tickets`   | Read helpdesk messages, change ticket status                 |
| Donations     | `/admin/donations` | Donation ledger with amount, method, goal and status         |
| Content       | `/admin/content`   | Events, giving goals, board, FAQ and welcome message          |
| Newsletter    | `/admin/newsletter`| Subscribers, test messages and campaigns                     |
| Audit log     | `/admin/audit`     | Recent administrator actions                                 |

An admin session expires after **30 idle minutes** (`ADMIN_REAUTH_AFTER_MINUTES`). Active work
extends it; the absolute session lifetime is 24 hours.

### 3.1 Approving registrations

A registration arrives as `pending` and is not visible in the directory. Open
`/admin/alumni`, check the details, then **Approve** or **Reject**. Rejection requires a short
reason and is stored in the audit log. Approved profiles become public according to the privacy
settings the alumnus chose.

**Approve only works once the member has confirmed their email address.** A self-registration
whose address is still unconfirmed is refused with "This member has not confirmed their email
address yet", and nothing is published. That is deliberate: it stops a typo or an invented
address from putting a profile in the directory. The member can confirm at `/account` after
signing in (see section 7 for the whole flow).

The Association can also import the written register later; that is not built yet, so enter
records through the registration flow or SQL/Drizzle Studio. If someone registers with the
address of an imported record, their registration claims that record instead of creating a
second profile.

### 3.2 Moderating posts and reports

Community submissions are `pending` until published. Open `/admin/posts`, read the full post,
then **Publish** or **Reject** with a reason. A published post appears in the community feed.

Readers can report a published post. Reports appear under `/admin/reports`; mark one reviewed or
dismiss it. Reports do not remove a post automatically — unpublish or remove the post separately
if needed.

### 3.3 Support tickets

`/admin/tickets` lists helpdesk messages. Each has a reference like `BPK-2026-A1B2C3`. Change the
status to **In progress** or **Closed** as you handle it. The sender receives an acknowledgement
email with the reference.

### 3.4 Content editor

`/admin/content` has five tabs.

**Events.** Add the slug (lower-case words joined by hyphens), title, summary, description, start
and optional end, venue, city, mode, capacity, image URL, status (upcoming or past), an optional
linked giving goal, and an optional gallery.

- Times are entered and shown in **Nepal time (Asia/Kathmandu)**. The site converts them to
  absolute instants internally.
- Capacity is optional. When it is reached, new RSVPs go to the waitlist automatically.
- Gallery is a JSON array. Leave it empty for none:

```json
[
  { "type": "photo", "url": "https://example.org/photo.jpg", "alt": "Alumni at the reunion" },
  { "type": "video", "url": "https://example.org/video.mp4", "alt": "Highlights" }
]
```

Gallery URLs must start with `https://`. Image URLs may be HTTPS or a site-relative path.

**Giving goals.** Title, description, target in NPR, deadline, image, active flag, sort order and
an optional "already raised" amount for offline gifts. New donations add to the raised total
automatically. Goals with recorded donations cannot be deleted; mark them inactive instead.

**Board.** Name, role, term, batch, photo, biography, vision statement, current/former flag and
sort order. Current members appear on the home page and the board page; former members appear in
the past-terms tab.

**FAQ.** Category, question, answer and sort order. Categories become the filter buttons on the
FAQ page.

**Welcome.** The president's or Association's welcome message: author, role, text, optional video
URL and photo URL. Saving replaces the single welcome message.

Every save and delete is written to the audit log. Deletions ask for confirmation and cannot be
undone; export a backup before a large content change.

### 3.5 Newsletter

`/admin/newsletter` shows the subscriber list and recent campaigns.

1. Write the subject and a plain-text message.
2. Put **your own address** in "Send a test to" and press **Send to all subscribers**; with a
   test address filled in, only that address receives the message and no campaign is recorded.
3. Check the message in your inbox, then clear the test address and send again.
4. Confirm the browser prompt. The server sends in batches (50 by default) to every subscribed
   address and records sent/failed counts.

Limits: `NEWSLETTER_BATCH_SIZE` (1–100) and `NEWSLETTER_MAX_RECIPIENTS` (default 2,000). A send
over the cap is refused; split the list or raise the cap deliberately. The message footer links
to `/community/newsletter`, where a reader can unsubscribe.

Sending is synchronous: the browser waits while batches go out. For a few hundred subscribers
this is seconds; keep the tab open and do not start a second send.

### 3.6 Donations

`/admin/donations` is the ledger. A donation is `pending` until the gateway confirms it, then
`succeeded`; a cancelled or failed gateway return records `failed`. A succeeded donation adds to
its goal's total and sends a receipt when the donor has an account with an email address.

Use this ledger for reconciliation against the eSewa/Khalti dashboard. The `payment_events`
table keeps every accepted callback if you need the raw payload.

**Download CSV** turns the ledger into a spreadsheet: reference, amount in rupees, method, status,
goal title and the time it was recorded, newest first. Add `?status=succeeded` (or `pending`,
`failed`) to the URL to export one status only. The export is capped at `EXPORT_MAX_ROWS` rows
(default 5000) and every export is written to the audit log, because a file of donor amounts has
left the building.

---

## 4. Calling the API directly

Most people use the site, but the JSON API is stable and documented in
[`BACKEND.md`](./BACKEND.md). All responses are JSON with `Cache-Control: no-store`.

Public reads need nothing:

```bash
curl -s http://localhost:3000/api/v1/goals
curl -s "http://localhost:3000/api/v1/events?status=upcoming&page=1"
```

Public writes need a JSON body and the CSRF token from the `bpkihs_csrf` cookie:

```bash
curl -s -c cookies.txt http://localhost:3000/ -o /dev/null
CSRF=$(awk '$6=="bpkihs_csrf" { print $7 }' cookies.txt)
curl -s -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -H "x-csrf-token: $CSRF" \
  -d '{"email":"reader@example.org","interests":["news"]}' \
  http://localhost:3000/api/v1/newsletter
```

Admin calls need a signed-in admin session. Sign in with curl after loading the page once:

```bash
curl -s -c cookies.txt http://localhost:3000/admin/sign-in -o /dev/null
CSRF=$(awk '$6=="bpkihs_csrf" { print $7 }' cookies.txt)
curl -s -b cookies.txt -c cookies.txt \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email":"you@example.org","password":"your-password"}' \
  http://localhost:3000/api/auth/sign-in/email
CSRF=$(awk '$6=="bpkihs_csrf" { print $7 }' cookies.txt)
curl -s -b cookies.txt -H "x-csrf-token: $CSRF" http://localhost:3000/api/v1/admin/content
```

Mutations must send both the `Origin` and `x-csrf-token` headers once a session cookie exists.
Requests without a session cookie are public writes and are limited by IP.

---

## 5. Payments

For the full operator guide — the payment flow, reconciling money, refunds and payment
troubleshooting — see [`DB-AND-PAYMENTS.md`](./DB-AND-PAYMENTS.md).

### Sandbox

Set `PAYMENT_MODE=sandbox` and use the sandbox credentials from the gateway.

eSewa sandbox merchant: `EPAYTEST`, secret `8gBm/:&EnhH.1/q`. Donate on `/donate/checkout` and
sign in with sandbox customer `9806800001` (or `...0002`–`...0005`), password `Nepal@123`, token
`123456`.

### Going live

1. Obtain production merchant credentials in the Association's name from eSewa and/or Khalti.
2. Set `PAYMENT_MODE=live`, the live keys, `ESEWA_GATEWAY_URL` and `KHALTI_BASE_URL`.
3. Register these return URLs with each gateway:
   - `https://your-domain/api/v1/payments/esewa/callback`
   - `https://your-domain/api/v1/payments/khalti/callback`
4. Make one small real donation. Confirm it appears in `/admin/donations`, moves the goal total,
   and sends a receipt.
5. Refund or void the test gift with the gateway and confirm the ledger still matches.

The server never marks a donation paid from a browser redirect alone. eSewa's signed payload is
re-signed and compared in constant time; Khalti is looked up server-side with the secret key.

---

## 6. Email

- Locally, `EMAIL_TRANSPORT=console` prints every message to the terminal.
- In production, set `EMAIL_TRANSPORT=resend`, `RESEND_API_KEY` and `EMAIL_FROM`.

Verify the sending domain in Resend (SPF, DKIM and DMARC) before launch. Until the domain is
verified, Resend rejects messages to anyone except the account owner. A failed receipt or
notification is logged and never undoes a donation, RSVP or ticket.

Messages currently sent:

| Trigger                        | Recipient  |
| ------------------------------ | ---------- |
| Registration verification code | registrant |
| Confirmed donation             | donor      |
| Event RSVP confirmed/waitlisted| attendee   |
| Helpdesk ticket created        | sender     |
| Newsletter subscription        | subscriber |

Newsletter campaigns are sent from `/admin/newsletter`, not by an external service.

---

## 7. Registration, sign-in and email verification

Registering creates two things at once: the directory profile the Association reviews, and the
account that owns it. The account is why `/sign-in` and `/account` exist.

### 7.1 What the member does

1. **`/register`** — three steps: about you, career, then account and privacy. The last step asks
   for an email address, a password of at least 12 characters, and the privacy choices.
2. **Submit** — the account and a `pending` profile are written in one transaction, and a
   six-digit code is emailed to that address.
3. **Confirm** — the form asks for the code. Confirming marks the address verified, signs the
   member in and finishes the registration.
4. **`/account`** — the member sees the review state, confirms a late address or signs out. The
   page is not indexed by search engines.
5. **Review** — the profile waits in `/admin/alumni` until the Association approves it.

`/sign-in` is linked from the header, the footer and the register page. There is no self-service
password reset yet: for now the office resets a forgotten password with the developer, directly
in the database.

### 7.2 Codes and limits

| Setting                        | Default    | Environment variable             |
| ------------------------------ | ---------- | -------------------------------- |
| Digits per code                | 6          | `OTP_LENGTH`                     |
| Lifetime                       | 15 minutes | `OTP_EXPIRES_MINUTES`            |
| Wrong guesses before it is dead| 5          | `OTP_MAX_ATTEMPTS`               |
| Resend countdown in the browser| 60 seconds | `OTP_RESEND_COOLDOWN_SECONDS`    |
| New codes per address          | 3 per minute | `AUTH_OTP_MAX`, `AUTH_OTP_WINDOW_SECONDS` |

Codes are stored hashed in the `verification` table. The clear code exists only in the email, so
nobody — including an administrator reading the database — can look it up. Typing the code wrong
too many times burns it; the member asks for a new one.

The resend endpoint answers the same way whether or not the address exists, so it cannot be used
to discover who has registered.

### 7.3 Testing it locally

With `EMAIL_TRANSPORT=console` (the default outside production), the code is printed where
`npm run dev` is running, inside an `email (development)` block:

```text
── email (development) ─────────────────────────────
To:      asha@example.com
Subject: Your BPKIHS alumni verification code

Use this code to confirm your email address ...

123456
────────────────────────────────────────────────────
```

Register with any address you can type, read the code from that block, and continue. Nothing is
sent to a real inbox, and production refuses to use the console transport
(`EMAIL_TRANSPORT=resend` is required there).

If someone registers and never confirms, the account exists but the profile stays pending and
cannot be approved. Deleting such an account is a database task: `alumni` first (or clear
`user_id`), then `user`, which removes its `account` and `session` rows by cascade.

---

## 8. Production on a VPS

This is the recommended deployment: one Node process behind nginx, one Postgres database.

### 8.1 Server layout

```text
/var/www/bpkihs-alumni     application
/etc/bpkihs-alumni.env     secrets, readable only by the service user
```

Create a dedicated Unix user (`bpkihs`) that owns the application directory, and a Postgres user
that owns only the site database.

### 8.2 Environment

Set at least:

```dotenv
NODE_ENV=production
APP_URL=https://alumni.your-domain.org
NEXT_PUBLIC_SITE_URL=https://alumni.your-domain.org
DATABASE_URL=postgres://bpkihs:...@127.0.0.1:5432/bpkihs
BETTER_AUTH_SECRET=<32+ random characters>
PAYMENT_MODE=live
ESEWA_PRODUCT_CODE=...
ESEWA_SECRET_KEY=...
ESEWA_GATEWAY_URL=https://epay.esewa.com.np/api/epay/main/v2/form
KHALTI_SECRET_KEY=...
KHALTI_BASE_URL=https://khalti.com/api/v2
EMAIL_TRANSPORT=resend
RESEND_API_KEY=re_...
EMAIL_FROM="BPKIHS Alumni Association <no-reply@your-domain.org>"
CONTACT_EMAIL=office@your-domain.org
TRUST_PROXY=true
```

Run the release check before starting:

```bash
npm run check:env
```

The same checks run when the server starts; an incomplete production configuration makes it
refuse to serve requests.

### 8.3 Build, migrate, start

```bash
npm ci
npm run build
npm run db:migrate:prod
npm start
```

`db:migrate:prod` is idempotent and records applied migrations. Run it before every new version
starts. Create the first admin once with `npm run db:admin`.

### 8.4 nginx

`TRUST_PROXY=true` is only safe when the proxy overwrites the client headers. Use:

```nginx
server {
  listen 443 ssl http2;
  server_name alumni.your-domain.org;

  ssl_certificate     /etc/letsencrypt/live/alumni.your-domain.org/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/alumni.your-domain.org/privkey.pem;

  client_max_body_size 256k;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade           $http_upgrade;
    proxy_set_header Connection        "upgrade";
    proxy_read_timeout 120s;
  }
}

server {
  listen 80;
  server_name alumni.your-domain.org;
  return 301 https://$host$request_uri;
}
```

Keep port 3000 closed to the internet. The application sends HSTS, CSP and the other security
headers itself; see [`SECURITY.md`](./SECURITY.md).

### 8.5 systemd

```ini
[Unit]
Description=BPKIHS Alumni website
After=network.target postgresql.service

[Service]
Type=simple
User=bpkihs
WorkingDirectory=/var/www/bpkihs-alumni
EnvironmentFile=/etc/bpkihs-alumni.env
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now bpkihs-alumni
sudo systemctl status bpkihs-alumni
```

Health check:

```bash
curl -fsS https://alumni.your-domain.org/api/health
```

It returns `200 {"status":"ok","database":"up"}` only when the process and a database query both
work, and `503` otherwise. Point uptime monitoring at it.

### 8.6 Releasing an update

```bash
git pull
npm ci
npm run build
npm run db:migrate:prod
sudo systemctl restart bpkihs-alumni
curl -fsS https://alumni.your-domain.org/api/health
```

Keep the previous release directory until the new one is verified; roll back by starting the old
directory. Database migrations are forward-only — take a backup before a release that changes the
schema.

---

## 9. Backups and recovery

Take a nightly compressed backup and copy it off the server:

```bash
pg_dump "$DATABASE_URL" --format=custom --file="/var/backups/bpkihs-$(date +%F).dump"
```

Test a restore into a throwaway database at least once:

```bash
createdb bpkihs_restore_test
pg_restore --dbname=bpkihs_restore_test /var/backups/bpkihs-2026-10-24.dump
```

Restoring over the live database is destructive. Stop the app, take a fresh backup of the current
state, then restore.

The database contains personal data (alumni contact details, donor emails, tickets). Treat
backups as confidential and encrypt them at rest.

---

## 10. Routine operations

| Task                          | How                                                              |
| ----------------------------- | ---------------------------------------------------------------- |
| Check the site                | `curl -fsS https://your-domain/api/health`                       |
| Review pending work           | `/admin` queue counts                                            |
| Publish content               | `/admin/content`                                                 |
| Send the newsletter           | `/admin/newsletter`, test first                                  |
| Check money                   | `/admin/donations` against the gateway dashboard                 |
| Review admin actions          | `/admin/audit`                                                   |
| Update dependencies           | `npm outdated`, update, `npm audit`, run `npm run ci`            |
| Rotate the auth secret        | Set a new `BETTER_AUTH_SECRET` and restart; all sessions end      |
| Recover an admin password     | Rerun `npm run db:admin` with the same email                     |
| Revoke one admin              | Change their `user.role` to `donor` in the database              |

Rotating `BETTER_AUTH_SECRET` signs everyone out, including donors. Tell the Association before
doing it.

---

## 11. Troubleshooting

| Symptom                                              | Cause and fix                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| Server exits: "Refusing to start with an incomplete production configuration" | Run `npm run check:env`; set the listed variables. |
| Sign-in says "Invalid origin"                        | `APP_URL` does not match the address in the browser. Set it to the exact public origin and restart. |
| Admin action returns 403 "security token"            | The CSRF cookie is missing or stale. Reload the page; do not block the cookie. |
| 403 "That request came from another site"             | `Origin` does not match `APP_URL` / `NEXT_PUBLIC_SITE_URL`. Fix the origin, not the code. |
| 429 "Too many attempts"                              | Rate limiter. Wait for the `Retry-After` seconds. Raise the limit only if the traffic is legitimate. |
| Everyone is rate-limited together                     | `TRUST_PROXY` is false behind a proxy, or nginx does not set `X-Real-IP`. Fix the proxy headers. |
| No emails                                            | Check `EMAIL_TRANSPORT`, `RESEND_API_KEY`, the verified domain, and the server log. A failed email never rolls back a record. |
| Payment returns "failed"                              | Check the gateway keys and the registered return URL, then the server log. Donations stay in the ledger as `failed`. |
| Build fails with `ECONNREFUSED 5433`                  | Postgres is not running. `npm run db:up`, then rebuild.                         |
| e2e setup fails with `sign in as … expected 200, received 429` | Better Auth allows five sign-ins per minute per IP. Wait a minute and rerun; the setup reuses its stored sessions, so this only happens after repeated runs. |
| e2e cannot find `admin@bpkihs.local`                 | The fixtures are missing. `npm run db:fixtures`, or let the `setup` project create them; it runs before every suite. |
| Images from a new host are blocked                     | Add the host to `IMAGE_HOSTS` and rebuild.                                     |
| Newsletter says "More than … subscribers"              | Raise `NEWSLETTER_MAX_RECIPIENTS` deliberately, or split the list.            |
| Device clock or dates look wrong                      | Set `NEXT_PUBLIC_SITE_TIME_ZONE` / `NEXT_PUBLIC_SITE_UTC_OFFSET` and rebuild.  |

Useful logs:

```bash
sudo journalctl -u bpkihs-alumni -n 200 --no-pager
sudo journalctl -u bpkihs-alumni -f
```

API errors include a `requestId` in the body and the `x-request-id` header. Search the log for
that id when a user reports a failure.

---

## 12. Where things live

```text
src/app/            pages and API routes
  api/v1/           public JSON API
  api/v1/admin/     admin API (content, newsletter, moderation)
  admin/            dashboard screens
src/content/        all user-facing copy (including admin copy)
src/server/
  config.ts         every limit, timeout, origin and operational default
  env.ts            production configuration checks
  services/         business logic and database queries
  http/             error envelope, CSRF, rate limiting, admin guard
  payments/         eSewa and Khalti adapters
  email/            Resend and console transports
src/proxy.ts        CSRF cookie and request security headers
docs/               this guide, backend, security, deployment, design
drizzle/            SQL migrations; never edit an applied migration
```

Every operational value can be overridden with an environment variable and every user-facing
string lives in `src/content`. If you are about to hardcode a phone number, a limit or a URL in a
component, put it in one of those two places instead.

---

## 13. Command reference

| Command                   | What it does                                      |
| ------------------------- | ------------------------------------------------- |
| `npm run dev`             | Development server                                |
| `npm run build`           | Production build                                  |
| `npm start`               | Run the production build                          |
| `npm run lint`            | ESLint                                            |
| `npm run typecheck`       | TypeScript check                                  |
| `npm run format`          | Prettier                                          |
| `npm run test`            | Unit tests                                        |
| `npm run test:e2e`        | Browser tests (needs Postgres)                    |
| `npm run db:up`           | Start Postgres in Docker                          |
| `npm run db:down`         | Stop the containers                               |
| `npm run db:generate`     | Generate a migration after a schema change        |
| `npm run db:migrate`      | Apply migrations (development)                    |
| `npm run db:migrate:prod` | Apply migrations with the runtime driver          |
| `npm run db:admin`        | Create or promote an administrator                |
| `npm run db:fixtures`     | Create the e2e accounts and goal in a dev database |
| `npm run db:studio`       | Browse the database                               |
| `npm run check:env`       | Validate production configuration                 |
| `npm run ci`              | Format check, typecheck, lint, tests and build    |

---

## 14. Tests and the fixture data

Two suites, both run from the project root. Postgres must be up for either.

```bash
npm run test        # Vitest: units, components, pure helpers (317 tests)
npm run test:e2e    # Playwright: desktop and mobile browsers against a real server
```

### 14.1 How the browser suite gets its data

The application seeds nothing, so the suite brings its own fixtures. A Playwright `setup`
project (`e2e/setup/fixtures.setup.ts`) runs before the desktop and mobile projects and:

1. writes two accounts and one goal straight to the development database
   (`e2e/helpers/fixtures.ts`):

   | What | Value |
   | ---- | ----- |
   | Administrator | `admin@bpkihs.local` / `E2eTestAdmin!99` |
   | Donor | `donor@example.com` / `Donor12345!` |
   | Goal | `goal-scholarship`, open for donations |

2. signs each account in **once** through `/api/auth/sign-in/email` and saves the session to
   `e2e/.auth/admin.json` and `e2e/.auth/donor.json` (git-ignored).

Specs reuse those sessions with `test.use({ storageState: … })`, which keeps a run to two
sign-ins instead of ten and stays under Better Auth's limit of five per minute per IP. A stored
session is reused while it still works, so back-to-back runs do not sign in again.

These credentials are development values. They are not used by the application, they never reach
production, and the production administrator is still created with `npm run db:admin`.

To put the same rows in place by hand, or to repair a database the suite complains about:

```bash
npm run db:fixtures
```

Specs that need a *new* member still register through the API and confirm the address with
`e2e/helpers/accounts.ts`, because approval is refused while an address is unconfirmed.

### 14.2 What the suite covers

| Spec | Covers |
| ---- | ------ |
| `home`, `about`, `navigation`, `no-overflow`, `not-found`, `skip-link` | Public pages, layout, landmarks, keyboard entry |
| `directory`, `events`, `community`, `donate`, `support` | The flows a donor or alumnus walks through |
| `admin` | Sign-in gate, approving a registration, publishing a post, moving a ticket, the CSV export |
| `donate-checkout` | The sign-in gate, a signed-in gift to the eSewa gateway, the thank-you states |
| `a11y` | axe WCAG 2.1 A/AA scan of all 18 public pages (desktop only) |

The accessibility scan catches mechanical problems — contrast, names, heading order, landmarks.
It does not replace a keyboard and screen-reader pass, which is still open in `TRACKER.md` D4.

### 14.3 When a test fails

- `ECONNREFUSED 5433` — Postgres is not running: `npm run db:up`.
- `sign in as … expected 200, received 429` — the sign-in limiter; wait a minute. Deleting
  `e2e/.auth/` forces a fresh session on the next run.
- A page answering on a port other than 3000 — stop the stray `next dev` first. The config pins
  the port, so the suite and the server cannot disagree.
- `test-results/` keeps a screenshot, trace and page snapshot for every failure.
