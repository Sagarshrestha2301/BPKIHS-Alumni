# Using the database and taking payments

Two subjects every operator ends up needing by hand: the Postgres database behind the site, and
the eSewa / Khalti payment flow. This guide is procedural — the architecture is in
[`BACKEND.md`](./BACKEND.md), daily admin tasks in [`HOWTO.md`](./HOWTO.md), the production
runbook in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## Part 1 — The database

### 1.1 What it is

One PostgreSQL 16 database. The application talks to it through Drizzle ORM
(`src/server/db/schema.ts`) over the `postgres` driver; there is no second data store and no
cache to invalidate.

Local development starts a container from `docker-compose.yml`:

| Setting         | Value                            |
| --------------- | -------------------------------- |
| Container       | `bpkihs-postgres`                |
| Host and port   | `localhost:5433` (container 5432)|
| User and database | `bpkihs`                       |
| Password        | `bpkihs_dev`                     |
| Volume          | `bpkihs_pgdata`                  |

`DATABASE_URL` in `.env.local` already points at it:

```dotenv
DATABASE_URL=postgres://bpkihs:bpkihs_dev@localhost:5433/bpkihs
```

Both the runtime client (`src/server/db/client.ts`) and `drizzle.config.ts` read **`.env.local`
only**. A `.env` file is ignored, which is why `Copy-Item .env.example .env.local` (or
`cp .env.example .env.local`) is the first setup step.

### 1.2 Start, stop, reset

```bash
npm run db:up       # start Postgres in the background
npm run db:down     # stop the containers (the data volume survives)
npm run db:down -v  # stop and DELETE the data volume — destroys every local row
```

Docker Desktop must be running for `db:up`. To use your own Postgres instead, point
`DATABASE_URL` at it and skip `db:up`; the schema needs no extensions, only a normal database
and a user that can create tables.

Confirm it answers:

```bash
docker exec bpkihs-postgres pg_isready -U bpkihs -d bpkihs
```

### 1.3 First-time setup (empty database)

```bash
npm run db:up          # 1. Postgres
npm run db:migrate     # 2. create the schema from drizzle/
npm run db:admin       # 3. first administrator (see below)
npm run dev            # 4. start the site
```

There is no seed data in production. A fresh database serves empty states until an
administrator adds content at `/admin/content`, and it has exactly one account — the one
`db:admin` creates.

### 1.4 Commands

| Command                   | What it does                                              |
| ------------------------- | --------------------------------------------------------- |
| `npm run db:up`           | `docker compose up -d db` — start local Postgres          |
| `npm run db:down`         | Stop the containers, keep the data                        |
| `npm run db:migrate`      | Apply pending SQL from `drizzle/` with drizzle-kit        |
| `npm run db:migrate:prod` | Apply pending migrations with the runtime driver (no drizzle-kit) |
| `npm run db:generate`     | Diff `schema.ts` against the last snapshot, write a new migration |
| `npm run db:admin`        | Create or promote an administrator                        |
| `npm run db:studio`       | Browse and edit the data in a local web UI                |

### 1.5 Creating an administrator

```bash
ADMIN_EMAIL="you@example.org" ADMIN_PASSWORD="a-long-unique-password" ADMIN_NAME="Your Name" npm run db:admin
```

PowerShell:

```powershell
$env:ADMIN_EMAIL="you@example.org"; $env:ADMIN_PASSWORD="a-long-unique-password"; $env:ADMIN_NAME="Your Name"; npm run db:admin
```

Rules the script enforces: a valid email, a password of at least 12 characters that is not on a
small list of obvious defaults, and a non-empty name (defaulting to "Association Admin").

Running it again with an existing email **promotes that account to `admin` and resets its
password**. That is the documented password-recovery path — no reset email exists, and there is
no way to change a password from the public site, only from `/admin` once signed in.

Never reuse a personal password here; this account can read every donor email and edit every
page.

### 1.6 Changing the schema safely

Migrations are forward-only and are applied from `drizzle/`. Never edit a migration file that
has already been applied — generate a new one.

1. Edit `src/server/db/schema.ts` (add the column, table, index or constraint).
2. Start a dev database: `npm run db:up`.
3. `npm run db:generate` — writes `drizzle/NNNN_description.sql` plus a snapshot.
4. **Read the generated SQL** (`drizzle/*.sql`). It should match what you intended, with no
   destructive `drop` unless you meant one.
5. `npm run db:migrate` locally, then run `npm run test`.
6. Commit the schema file and the new migration together.

Before a release that changes the schema, take a backup (§1.10). A migration that fails halfway
must be fixed forward with a new migration; do not hand-edit the database to "match" the
migrations table.

In production the release step is `npm run db:migrate:prod`, which applies the same files
through the application driver and skips migrations that are already recorded. It is safe to run
on every deploy.

### 1.7 Tables you will meet

| Table                    | Holds                                                        |
| ------------------------ | ------------------------------------------------------------ |
| `user`, `account`, `session`, `verification` | Better Auth accounts, credentials, sessions     |
| `alumni`                 | Directory profiles, including self-registrations awaiting a decision (`pending` / `approved` / `rejected`) |
| `donation_goals`         | Giving goals and `raised_minor` totals                        |
| `donations`              | One row per gift, with `status`, gateway and reference        |
| `payment_events`         | Every accepted gateway callback, raw payload, for reconciliation |
| `funds_breakdown`        | How a goal total is split into categories                     |
| `events`, `event_rsvps`  | Events and RSVPs (including waitlist)                        |
| `feed_posts`, `post_reports` | Community submissions and reader reports                 |
| `newsletter_subscribers`, `newsletter_campaigns` | Mailing list and sent campaigns           |
| `board_members`, `faq_items`, `welcome_message` | Governance and support content            |
| `support_tickets`        | Helpdesk messages with `BPK-YYYY-XXXXXX` references           |
| `admin_audit_log`        | Who approved, published, edited or deleted what               |

Money columns end in `_minor` and are **integer paisa**: NPR 5,000.00 is `500000`. Never insert
rupees into a `_minor` column.

### 1.8 Browsing and querying

Interactive browsing:

```bash
npm run db:studio
```

From a terminal (Docker container):

```bash
docker exec -it bpkihs-postgres psql -U bpkihs -d bpkihs
```

Queries you will actually run:

```sql
-- Registrations submitted on the site, waiting for a decision
select id, full_name, email, batch_year, programme, created_at from alumni
where status = 'pending' and source = 'self_registered' order by created_at limit 20;

-- Directory profiles that are not public yet (including imported ones)
select full_name, email, status, approved_at from alumni
where status <> 'approved' order by created_at desc;

-- Money raised per goal
select title, target_minor, raised_minor, active from donation_goals order by sort_order;

-- Gifts that never came back from the gateway (usually abandoned checkouts)
select id, amount_minor, method, status, created_at from donations
where status = 'pending' order by created_at desc limit 20;

-- One donation and every callback the gateway sent for it
select d.id, d.status, d.gateway_ref, p.event_type, p.created_at
from donations d left join payment_events p on p.donation_id = d.id
where d.id = '<donation id>';

-- Newsletter audience
select status, count(*) from newsletter_subscribers group by status;

-- What an administrator did recently
select created_at, action, entity, entity_id from admin_audit_log
order by created_at desc limit 50;
```

Rules when writing SQL by hand:

- **Do not** set `donations.status = 'succeeded'` by hand. Only a verified gateway callback
  does that, because it also updates the goal total, stores the reference and sends the
  receipt. A hand-edited row will not be in the ledger or the funds chart consistently.
- Every write path sets `updated_at`; set it yourself if you must change a row directly:
  `updated_at = now()`.
- Emails are personal data. Do not paste query results containing them into tickets, chat or
  screenshots.
- Prefer inserting with explicit ids (`crypto.randomUUID()` in a script) — the tables have no
  auto-increment ids.

### 1.9 Editing content directly

Usually unnecessary: `/admin/content` covers events, goals, board, FAQ and welcome message, and
everything it writes is audit-logged. Editing rows in `drizzle-kit studio` or `psql` bypasses
validation and the audit log, so do it only for repairs — for example removing a test event, or
restoring a goal total after a manual refund:

```sql
update donation_goals set raised_minor = raised_minor - 500000, updated_at = now()
where id = 'goal-...';
```

Resetting a goal total after deleting test donations is the one correction that is always done
by hand.

### 1.10 Backups

Nightly, compressed, copied off the machine:

```bash
pg_dump "$DATABASE_URL" --format=custom --file="/var/backups/bpkihs-$(date +%F).dump"
```

Restore into a scratch database to prove the backups work (do this at least once a quarter):

```bash
createdb bpkihs_restore_test
pg_restore --dbname=bpkihs_restore_test /var/backups/bpkihs-2026-10-24.dump
```

Restoring **over** the live database: stop the app first, take a fresh backup of the current
state, then restore. The dump contains donor emails, tickets and alumni contact details —
encrypt the backups at rest and keep them off shared storage.

### 1.11 Database troubleshooting

| Symptom | Fix |
| ------- | --- |
| `ECONNREFUSED ...:5433` | Postgres is not running: `npm run db:up`. Docker Desktop must be open. |
| `DATABASE_URL is missing` | You copied to the wrong file; the app and drizzle-kit read `.env.local` only. |
| `relation "donations" does not exist` | Migrations are not applied: `npm run db:migrate`. |
| `password authentication failed` | Your `DATABASE_URL` password does not match the container (`bpkihs_dev` locally). |
| Migration failed halfway | Read the error, fix the schema, generate a new migration, run again. Check whether the failed statement already ran before retrying. |
| Site works locally but not in production | The production process uses its own environment; run `npm run check:env` and check `DATABASE_URL` on the server. |
| Too many connections | One pool per process, `max: 10` in development and `5` in production. If you run several processes, lower each pool. |

---

## Part 2 — Payments

### 2.1 How a donation actually works

`PAYMENT_MODE` must be `sandbox` or `live`. A missing or wrong value is a configuration error;
there is **no simulator and no code path that marks a donation paid without a gateway**.

1. A donor signs in at `/donate/checkout` — donations require an account, so the receipt has an
   inbox (decision D3).
2. The browser posts `POST /api/v1/donations` with the amount in paisa, the currency `NPR`, the
   method (`esewa` or `khalti`), and whether it is anonymous or a tribute.
3. The server validates the amount (NPR 100 to NPR 10,000,000), checks the goal is not already
   fully funded, writes a `pending` donation, and asks the gateway for a redirect.
4. The checkout submits the signed form (eSewa) or follows the payment URL (Khalti) and leaves
   the site.
5. The gateway returns the donor to `/api/v1/payments/{gateway}/callback`. The adapter verifies
   the response — eSewa by re-signing the payload with HMAC-SHA256 and comparing in constant
   time, Khalti by a server-side lookup with the secret key.
6. `completeDonation()` marks the donation `succeeded`, adds the amount to the goal's
   `raised_minor`, stores the reference, keeps the raw payload in `payment_events`, and emails
   the receipt. It is idempotent: a repeated callback cannot double-count, and a `failed`
   callback can never overwrite a `succeeded` one.
7. The donor lands on `/donate/thank-you` with the reference to quote in support requests.

The amount the gateway confirms is compared with the amount we asked for; a mismatch is
rejected and stays unpaid.

### 2.2 Environment variables

Both gateways are optional individually, but at least one must be configured or production
refuses to start. The checkout only offers the gateways that are configured.

| Variable | Purpose | Local (sandbox) | Production |
| -------- | ------- | --------------- | ---------- |
| `PAYMENT_MODE` | `sandbox` or `live` | `sandbox` | `live` |
| `ESEWA_PRODUCT_CODE` | eSewa merchant code | `EPAYTEST` | your merchant code |
| `ESEWA_SECRET_KEY` | HMAC key for signatures | published sandbox secret | merchant secret |
| `ESEWA_GATEWAY_URL` | Where the signed form posts | optional (defaults to the sandbox) | `https://epay.esewa.com.np/api/epay/main/v2/form` |
| `KHALTI_SECRET_KEY` | Khalti API key | sandbox key from Khalti | live secret key |
| `KHALTI_BASE_URL` | Khalti API origin | optional (defaults to the sandbox) | `https://khalti.com/api/v2` |

Put keys in `.env.local` locally and in the server's environment file (`/etc/bpkihs-alumni.env`)
in production — never in the repository, and never in client-side code. Both keys are read only
on the server.

### 2.3 Running a payment in the sandbox

Use the eSewa sandbox; it exercises the full signed round trip.

1. Set `PAYMENT_MODE=sandbox` and the eSewa sandbox values in `.env.local`, then restart
   `npm run dev`.
2. Sign in or register at `/donate/checkout` (an account is required).
3. Choose an amount and goal, pick eSewa, and confirm. The browser opens the eSewa ePay login.
4. Sign in with a sandbox customer: `9806800001` (also `9806800002`–`9806800005`), password
   `Nepal@123`, token `123456`, then approve the payment.
5. eSewa returns to `/api/v1/payments/esewa/callback`. The browser shows `/donate/thank-you`.

Then verify the database, which is the part a browser will never show you:

```sql
select id, status, amount_minor, gateway, gateway_ref from donations order by created_at desc limit 1;
select event_type, external_id, created_at from payment_events order by created_at desc limit 5;
select title, raised_minor from donation_goals where id = '<goal id>';
```

Expected: the newest donation is `succeeded`, at least one `payment_events` row exists for it,
the goal total grew by the gift, and a receipt email was printed in the terminal
(`EMAIL_TRANSPORT=console`) or delivered in Resend.

Cancel at the gateway instead: the donation is recorded as `failed` and the goal total does not
move.

### 2.4 Testing through the API

The endpoints are ordinary JSON; a payment still needs an authenticated donor and the CSRF
token.

```bash
# 1. Load a page to get the CSRF cookie
curl -s -c cookies.txt http://localhost:3000/ -o /dev/null
CSRF=$(awk '$6=="bpkihs_csrf" { print $7 }' cookies.txt)

# 2. Sign in as the donor
curl -s -b cookies.txt -c cookies.txt \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"email":"donor@example.org","password":"your-password"}' \
  http://localhost:3000/api/auth/sign-in/email > /dev/null
CSRF=$(awk '$6=="bpkihs_csrf" { print $7 }' cookies.txt)

# 3. Create the donation (amount is in paisa: 500000 = NPR 5,000)
curl -s -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" -H "x-csrf-token: $CSRF" \
  -d '{"amountMinor":500000,"currency":"NPR","method":"esewa","anonymous":false,"goalId":"goal-..."}' \
  http://localhost:3000/api/v1/donations
```

The response is `201` with a `donationId` and a `redirect` describing the form the checkout
would post (`url`, `method`, `fields`). Fulfil that redirect to reach the sandbox gateway.

### 2.5 Going live

1. Obtain merchant credentials in the Association's legal name (eSewa merchant account; Khalti
   business account). Personal accounts must not be used.
2. Register the return URLs with each gateway:
   - `https://your-domain.org/api/v1/payments/esewa/callback`
   - `https://your-domain.org/api/v1/payments/khalti/callback`
3. Set `PAYMENT_MODE=live`, the live keys, `ESEWA_GATEWAY_URL` and `KHALTI_BASE_URL`.
4. `npm run check:env`, then deploy and restart.
5. Make one small real donation from a real wallet. Confirm it appears in `/admin/donations`,
   moves the goal total, and sends a receipt.
6. Reconcile that gift against the gateway's own dashboard, then refund it and confirm the
   ledger still matches the gateway.

Do not mark the site "live" before step 5 succeeds end to end.

### 2.6 Reconciling money

The ledger is `/admin/donations`. Compare it with the gateway dashboard weekly:

```sql
-- Total taken, by gateway and day
select gateway, date_trunc('day', created_at) as day,
       sum(amount_minor) as total_minor, count(*)
from donations where status = 'succeeded'
group by gateway, day order by day desc;

-- Donations with no stored callback (needs investigation before any refund)
select d.id, d.status, d.gateway, d.created_at from donations d
left join payment_events p on p.donation_id = d.id
where d.status = 'succeeded' and p.id is null;

-- Goal totals versus what was actually collected
select g.title, g.raised_minor, coalesce(sum(d.amount_minor), 0) as collected_minor
from donation_goals g left join donations d
  on d.goal_id = g.id and d.status = 'succeeded'
group by g.id, g.title, g.raised_minor;
```

If `raised_minor` disagrees with the sum of succeeded gifts — usually because a test gift was
deleted or a refund happened at the gateway — correct the goal total by hand
(§1.9). The application has no refund endpoint: refunds are done in the gateway's own
dashboard, and then the ledger row and goal total are adjusted manually if the Association
decides to return the money.

### 2.7 Payment troubleshooting

| Symptom | Cause and fix |
| ------- | ------------- |
| "Payments are not configured" | `PAYMENT_MODE` is missing or invalid. Set it to `sandbox` or `live`. |
| "eSewa is not configured" | `ESEWA_PRODUCT_CODE` or `ESEWA_SECRET_KEY` missing. |
| "Khalti is not configured" | `KHALTI_SECRET_KEY` missing. |
| "The signature did not match" (eSewa sandbox) | `ESEWA_SECRET_KEY` does not match the sandbox secret, or the payload was altered in transit. |
| "The amount confirmed by the gateway does not match" | The gateway total differs from `donations.amount_minor`. Check rounding on custom amounts; the donation stays unpaid. |
| Gateway returns to `thank-you` with `status=failed` | Verification failed. Read the server log for `[payments] callback failed` and inspect `payment_events`. |
| Donation is `pending` forever | The donor abandoned or closed the gateway. It never completes without a callback; leave it, or mark it failed after a day. |
| No receipt email | Email is configured separately — see §6 of [`HOWTO.md`](./HOWTO.md). A failed email never changes a donation's status. |
| Works in sandbox, fails live | Live mode needs `ESEWA_GATEWAY_URL` / `KHALTI_BASE_URL` and live keys; the return URLs must be registered with the gateway for the exact production origin. |
| Callback never arrives | The gateway cannot reach your origin. Check the registered return URL and that `APP_URL` is the public https origin. |
| "That goal is already fully funded" | Expected: fully funded goals refuse new gifts until the target or the active flag changes. |

Every API error carries a `requestId` (also in the `x-request-id` header). Search the server log
for that id to see the full failure, and look at `payment_events.payload` for the raw gateway
response.

---

## Part 3 — Quick reference

| Task | Command or page |
| ---- | --------------- |
| Start the database | `npm run db:up` |
| Apply migrations (local) | `npm run db:migrate` |
| Apply migrations (production) | `npm run db:migrate:prod` |
| Create or reset an admin | `npm run db:admin` |
| Browse the data | `npm run db:studio` or `docker exec -it bpkihs-postgres psql -U bpkihs -d bpkihs` |
| Validate production config | `npm run check:env` |
| Sandbox test payment | `/donate/checkout`, eSewa, customer `9806800001` |
| Review money | `/admin/donations` |
| Raw callback payloads | `payment_events` table |
| Back up | `pg_dump "$DATABASE_URL" --format=custom` |
