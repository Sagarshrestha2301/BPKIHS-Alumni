# Using the database and taking payments

Two subjects every operator ends up needing by hand: the Postgres database behind the site, and
the eSewa / Khalti payment flow. This guide is procedural : the architecture is in
[`BACKEND.md`](./BACKEND.md), daily admin tasks in [`HOWTO.md`](./HOWTO.md), the production
runbook in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## Part 1 : The database

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
npm run db:down -v  # stop and DELETE the data volume : destroys every local row
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
administrator adds content at `/admin/content`, and it has exactly one account : the one
`db:admin` creates.

### 1.4 Commands

| Command                   | What it does                                              |
| ------------------------- | --------------------------------------------------------- |
| `npm run db:up`           | `docker compose up -d db` : start local Postgres          |
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

Rules the script enforces: a valid email, a password of at least 8 characters that is not on a
small list of obvious defaults, and a non-empty name (defaulting to "Association Admin").

Running it again with an existing email **promotes that account to `admin` and resets its
password**. That is the break-glass recovery path. A member can also reset their own password
from `/sign-in` → **Forgotten your password?**, and a signed-in member can change it from
`/account`.

If that administrator has lost their authenticator and their backup codes, add
`ADMIN_RESET_2FA=true` to the command. It removes only that account's `two_factor` row and turns
the feature off, so they can sign in with the new password and enrol again. It does not touch
any other account.

Never reuse a personal password here; this account can read every donor email and edit every
page.

### 1.6 Changing the schema safely

Migrations are forward-only and are applied from `drizzle/`. Never edit a migration file that
has already been applied : generate a new one.

1. Edit `src/server/db/schema.ts` (add the column, table, index or constraint).
2. Start a dev database: `npm run db:up`.
3. `npm run db:generate` : writes `drizzle/NNNN_description.sql` plus a snapshot.
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
| `two_factor`             | Encrypted TOTP secret, hashed backup codes and lockout counters |
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
| `gateway_checks`         | Last acceptance run per payment gateway, shown at `/admin/payments` |

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
- Prefer inserting with explicit ids (`crypto.randomUUID()` in a script) : the tables have no
  auto-increment ids.

### 1.9 Editing content directly

Usually unnecessary: `/admin/content` covers events, goals, board, FAQ and welcome message, and
everything it writes is audit-logged. Editing rows in `drizzle-kit studio` or `psql` bypasses
validation and the audit log, so do it only for repairs : for example removing a test event, or
restoring a goal total after a manual refund:

```sql
update donation_goals set raised_minor = raised_minor - 500000, updated_at = now()
where id = 'goal-...';
```

Resetting a goal total after deleting test donations is the one correction that is always done
by hand.

### 1.10 Backups

`scripts/backup-db.sh` writes a gzipped SQL dump, keeps 14 days and encrypts when
`BACKUP_ENCRYPTION_KEY` is set. Run it by hand or from cron:

```bash
npm run db:backup
# or: BACKUP_DIR=/var/backups/bpkihs ./scripts/backup-db.sh
```

Copy the file off the machine. Restore into a scratch database to prove the backups work (do
this at least once a quarter):

```bash
createdb bpkihs_restore_test
gunzip -c /var/backups/bpkihs/bpkihs-20261024T021700Z.sql.gz | psql -d bpkihs_restore_test

# Encrypted:
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -in /var/backups/bpkihs/bpkihs-20261024T021700Z.sql.gz.enc \
  -pass env:BACKUP_ENCRYPTION_KEY | gunzip -c | psql -d bpkihs_restore_test
```

Restoring **over** the live database: stop the app first, take a fresh backup of the current
state, then restore. The dump contains donor emails, tickets and alumni contact details :
encrypt the backups at rest and keep them off shared storage. The full cron and monitoring
instructions are in [`HOWTO.md`](./HOWTO.md#9-backups-and-recovery).

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

### 1.12 Row-level security : a launch prerequisite, not yet enabled

**RLS is off and must stay off until the steps below are done.** The snapshots in `drizzle/meta/`
record `isRLSEnabled: false` for every table and there are no policies in any migration. Enabling
it today would give false confidence rather than protection:

- `src/server/db/client.ts` opens **one pooled connection** used by public pages, member reads,
  payment callbacks, admin screens and background scripts. PostgreSQL has no way to tell those
  callers apart.
- The local `docker-compose.yml` credentials create the application user as the **database owner**.
  An owner (and any `SUPERUSER` or `BYPASSRLS` role) ignores policies unless they are `FORCED`.
- A caller-settable `SET app.user_id` is attacker-controlled unless it is applied server-side
  inside the same transaction as the query.

The boundary that is actually enforced today is the server-side authorization in
[`SECURITY.md` §3](./SECURITY.md#3-authorisation). Do not describe this deployment as RLS-protected.

**Order of work when you are ready to enable it**

1. **Split the roles.** Keep a migration/owner role for `npm run db:migrate:prod`, and create a
   runtime role the application connects as:

   ```sql
   create role bpkihs_app login password 'choose-a-long-password';
   grant connect on database bpkihs to bpkihs_app;
   grant usage on schema public to bpkihs_app;
   grant select, insert, update, delete on all tables in schema public to bpkihs_app;
   grant usage, select on all sequences in schema public to bpkihs_app;
   alter default privileges in schema public grant select, insert, update, delete on tables to bpkihs_app;
   -- the owner/migrator keeps ownership; the runtime role must have no BYPASSRLS and must not own the tables
   ```

   Verify the flags before anything else:

   ```sql
   select rolname, rolsuper, rolbypassrls from pg_roles where rolname = 'bpkihs_app';
   -- both false
   select relrowsecurity, relforcerowsecurity from pg_class
   where relname in ('donations', 'alumni', 'user') and relnamespace = 'public'::regnamespace;
   ```

2. **Give every query a trusted identity.** Add one server-only transaction wrapper that reads
   the authenticated session (`src/server/auth/session.ts`), then issues `SET LOCAL app.user_id`,
   `SET LOCAL app.role` and runs the query in that same transaction. Route all protected queries
   through it : Better Auth, public mutations, directory reads, payment callbacks, admin services
   and the scripts under `scripts/`. Identity must never be taken from a header, body or query
   string.

3. **Write default-deny policies per table category**, so a missing context fails closed:

   | Category | Examples | Policy shape |
   | --- | --- | --- |
   | Public approved reads | `events`, `board_members`, approved `feed_posts` | `to public using (…approved…) for select` |
   | Own member data | `alumni`, `user`, `session`, `account` | `using (user_id = current_setting('app.user_id'))` |
   | Admin-only | `donations`, `support_tickets`, `admin_audit_log`, `newsletter_subscribers` | `using (current_setting('app.role') = 'admin')` |
   | Provider/webhook | `donations`, `payment_events` | narrow `insert`/`update` for the verified-callback path only |
   | Background jobs | newsletter digest, backup | explicit role for `scripts/`, not an anonymous escape hatch |

   Use `FORCE ROW LEVEL SECURITY` on every table so ownership alone cannot bypass the policies.

4. **Prove it before flipping it on.** Against the **same pool and role the app uses**, assert:
   no context reads nothing; a member cannot read another member's row; a non-admin cannot read
   `donations`; an admin can; a gateway callback can still complete a gift; the digest and backup
   scripts still run; and `rolbypassrls` is false. Keep a rollback migration that drops the
   policies and disables RLS.

Until all four are done, keep `DATABASE_URL` secret, keep Postgres bound to loopback or a private
network, and use a least-privilege role where the host allows it.

---

## Part 2 : Payments

### 2.1 How a donation actually works

`PAYMENT_MODE` must be `sandbox` or `live`. A missing or wrong value is a configuration error;
there is **no simulator and no code path that marks a donation paid without a gateway**.

1. A donor signs in at `/donate/checkout` : donations require an account, so the receipt has an
   inbox (decision D3).
2. The browser posts `POST /api/v1/donations` with the amount in paisa, the currency `NPR`, the
   method (`esewa`, `khalti` or `connectips`), and whether it is anonymous or a tribute.
3. The server validates the amount (NPR 100 to NPR 10,000,000), checks the goal is not already
   fully funded, writes a `pending` donation, and asks the gateway for a redirect.
4. The checkout submits the signed form (eSewa, ConnectIPS) or follows the payment URL (Khalti)
   and leaves the site. ConnectIPS signs an RSA-SHA256 token over its documented field string; its
   `TXNID` field is capped at 20 characters, so the donation's stored `gateway_order_ref` is sent
   instead of the 36-character donation id.
5. The gateway returns the donor to `/api/v1/payments/{gateway}/callback`. The adapter verifies
   the response : eSewa by re-signing the payload with HMAC-SHA256 and comparing in constant
   time, Khalti by a server-side lookup with the secret key, ConnectIPS by a signed validation
   call to its `validatetxn` endpoint that also resolves the donation by `gateway_order_ref`.
6. `completeDonation()` marks the donation `succeeded`, adds the amount to the goal's
   `raised_minor`, stores the reference, keeps the raw payload in `payment_events`, and emails
   the receipt. It is idempotent: a repeated callback cannot double-count, and a `failed`
   callback can never overwrite a `succeeded` one.
7. The donor lands on `/donate/thank-you` with the reference to quote in support requests.

The amount the gateway confirms is compared with the amount we asked for; a mismatch is
rejected and stays unpaid.

### 2.2 Environment variables

eSewa, Khalti and ConnectIPS are optional individually, but at least one must be configured or
production refuses to start. The checkout only offers a gateway whose adapter exists and whose
credentials are complete. ConnectIPS is built (29 Oct 2026); Fonepay is still blocked on its
current integration document. See `HANDOVER.md` §2 and `TRACKER.md` C7a/C7b.

| Variable | Purpose | Local (sandbox) | Production |
| -------- | ------- | --------------- | ---------- |
| `PAYMENT_MODE` | `sandbox` or `live` | `sandbox` | `live` |
| `ESEWA_PRODUCT_CODE` | eSewa merchant code | `EPAYTEST` | your merchant code |
| `ESEWA_SECRET_KEY` | HMAC key for signatures | published sandbox secret | merchant secret |
| `ESEWA_GATEWAY_URL` | Where the signed form posts | optional (defaults to the sandbox) | `https://epay.esewa.com.np/api/epay/main/v2/form` |
| `KHALTI_SECRET_KEY` | Khalti API key | sandbox key from Khalti | live secret key |
| `KHALTI_BASE_URL` | Khalti API origin | optional (defaults to the sandbox) | `https://khalti.com/api/v2` |
| `CONNECTIPS_BASE_URL` | NCHL gateway origin | from NCHL | from NCHL |
| `CONNECTIPS_MERCHANT_ID` | Merchant id | from NCHL | from NCHL |
| `CONNECTIPS_APP_ID` | Application id (≤15 characters) | from NCHL | from NCHL |
| `CONNECTIPS_APP_NAME` | Application name (≤30 characters) | from NCHL | from NCHL |
| `CONNECTIPS_APP_PASSWORD` | Validation API password | from NCHL | from NCHL |
| `CONNECTIPS_PRIVATE_KEY_PATH` | PEM signing key converted from `CREDITOR.pfx` | path | path |
| `CONNECTIPS_PRIVATE_KEY` | same key inline (`\n` escapes accepted) | optional | optional |

Put keys in `.env.local` locally and in the server's environment file (`/etc/bpkihs-alumni.env`)
in production : never in the repository, and never in client-side code. All gateway secrets are
read only on the server; the browser receives a redirect, never a key.

#### Who can obtain each set of credentials

Three of the four gateways need the Association itself to sign something; that is about the
merchant, not about the developer. Knowing which is which avoids waiting on a contract that was
never needed.

| Gateway | Sandbox obtainable by the developer? | What the Association must do for live |
| ------- | ----------------------------------- | ------------------------------------ |
| eSewa | Yes : the published test credentials (`EPAYTEST`, the sandbox secret) need no account at all | Merchant onboarding: PAN/VAT, registration certificate, citizenship copy, photos, tax clearance, a bank account at an eSewa member bank, signed agreement |
| Khalti | Yes : self-serve sandbox merchant at `test-admin.khalti.com/#/join/merchant`; sign in with OTP `987654`, then copy `live_secret_key` from **Keys**. No PAN, VAT or agreement, and no real money | Create the live merchant at `admin.khalti.com` and complete KYC (registration, PAN/VAT, tax clearance, MOA/AOA, shareholder IDs). Until the agreement is signed, live keys are capped at roughly NPR 200 per transaction |
| ConnectIPS | No | Apply **through its bank**, which does the KYC and forwards a creditor-listing request to NCHL; NCHL then issues the merchant id, app id, password and the test `CREDITOR.pfx`. Plan in weeks, not days |
| Fonepay | No | Merchant enrolment via a bank or Fonepay's online form (QR issuance only). API/Dynamic QR credentials are a separate request, and Fonepay's test mode uses real credentials and moves real money |

So the local setup can genuinely exercise two gateways today: eSewa always, and Khalti once a
sandbox key is in `.env.local`. ConnectIPS and Fonepay stay hidden until NCHL and Fonepay issue
their credentials; the `npm run connectips:accept` script is ready for that day. A sandbox key is
never promoted to production : sandbox and live keys come from different dashboards.

### 2.3 Running a payment in the sandbox

Use the eSewa sandbox; it exercises the full signed round trip. ConnectIPS has no public sandbox:
complete its UAT setup from `HANDOVER.md` §2 first, then run `npm run connectips:accept` to check
the credentials and signing token against NCHL (it posts a real UAT form and calls validation; add
`--dry-run` to sign offline). Once that passes, donate as usual and complete the payment in the
browser : the script cannot enter the OTP or confirm the callback.

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
   business account; ConnectIPS through the Association's bank and NCHL). Personal accounts must
   not be used.
2. Register the return URLs with each gateway:
   - `https://your-domain.org/api/v1/payments/esewa/callback`
   - `https://your-domain.org/api/v1/payments/khalti/callback`
   - ConnectIPS: the same `https://your-domain.org/api/v1/payments/connectips/callback` as both
     the success and failure URL, registered with NCHL integration support
3. Set `PAYMENT_MODE=live`, the live keys, `ESEWA_GATEWAY_URL`, `KHALTI_BASE_URL`, and the
   ConnectIPS base URL and merchant credentials if that gateway is enabled.
4. `npm run check:env`, then deploy and restart.
5. Make one small real donation from a real wallet. Confirm it appears in `/admin/donations`,
   moves the goal total, and sends a receipt.
6. Reconcile that gift against the gateway's own dashboard, then refund it and confirm the
   ledger still matches the gateway.

Do not mark the site "live" before step 5 succeeds end to end.

Fonepay is not part of this go-live list yet. Complete its onboarding separately (`HANDOVER.md`
§2) and add its return URL only once C7b lands. ConnectIPS can be enabled now, but run its own
small sandbox donation once NCHL supplies the UAT merchant pack : no real ConnectIPS payment has
been made yet.

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

If `raised_minor` disagrees with the sum of succeeded gifts : usually because a test gift was
deleted or a refund happened at the gateway : correct the goal total by hand
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
| No receipt email | Email is configured separately : see §6 of [`HOWTO.md`](./HOWTO.md). A failed email never changes a donation's status. |
| Works in sandbox, fails live | Live mode needs `ESEWA_GATEWAY_URL` / `KHALTI_BASE_URL` and live keys; the return URLs must be registered with the gateway for the exact production origin. |
| Callback never arrives | The gateway cannot reach your origin. Check the registered return URL and that `APP_URL` is the public https origin. |
| "That goal is already fully funded" | Expected: fully funded goals refuse new gifts until the target or the active flag changes. |

Every API error carries a `requestId` (also in the `x-request-id` header). Search the server log
for that id to see the full failure, and look at `payment_events.payload` for the raw gateway
response.

---

## Part 3 : Quick reference

| Task | Command or page |
| ---- | --------------- |
| Start the database | `npm run db:up` |
| Apply migrations (local) | `npm run db:migrate` |
| Apply migrations (production) | `npm run db:migrate:prod` |
| Create or reset an admin | `npm run db:admin` |
| Recover a lost authenticator | `ADMIN_RESET_2FA=true npm run db:admin` |
| Browse the data | `npm run db:studio` or `docker exec -it bpkihs-postgres psql -U bpkihs -d bpkihs` |
| Validate production config | `npm run check:env` |
| Check the running app | `npm run check:health` |
| Sandbox test payment | `/donate/checkout`, eSewa, customer `9806800001` |
| Review money | `/admin/donations` |
| Raw callback payloads | `payment_events` table |
| Back up | `npm run db:backup` |

## Part 3 : Deep database operations (per-situation SQL and Drizzle examples)

### 3.1 Inserting a new donor profile (self-registration)

When a new member registers through `/account`, the application creates a row in the `alumni` table. The `status` starts as `pending` and the admin decides whether to approve it.

**Drizzle migration (via `db:generate`):**
- A new column `referred_by` on `alumni` references another alumnus
- A new index on `referral_code` for lookups

**SQL to create a pending registration:**
```sql
-- Insert a new self-registration with pending status
insert into alumni (
  id,                          -- crypto.randomUUID() in application code
  full_name,
  email,
  batch_year,
  programme,
  status,
  created_at
) values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Dr. Sabina Karki',
  'sabina.karki@bpkihs.edu.np',
  2023,
  'MD Community Medicine',
  'pending',       -- will be reviewed by admin
  now()
);

-- Look up a registrant by referral code (if you add that column later)
select id, full_name, email, status, created_at from alumni
where referral_code = 'REF-2026-ABC123';
```

### 3.2 Promoting a registrant to approved alumnus

An administrator promotes a pending registrant. This also writes to the audit log.

```sql
-- Promote a registrant and record the decision
begin;

-- Update the alumni status and record approval timestamp
update alumni
set status = 'approved',
    approved_at = now(),
    updated_at = now()
where id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Log the administrative action
insert into admin_audit_log (
  id, actor_id, action, entity, entity_id, detail
) values (
  gen_random_uuid(),
  'admin-user-id',        -- the admin's user id
  'promote_alumnus',
  'alumni',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  jsonb_build_object('previous_status', 'pending', 'approved_by', 'admin-user-id')
);

commit;
```

### 3.3 Rejecting a registrant

Rejection also goes to the audit log; the account stays in the system but stays `rejected`.

```sql
-- Reject a pending registration
update alumni
set status = 'rejected',
    updated_at = now()
where id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Log the rejection
insert into admin_audit_log (
  id, actor_id, action, entity, entity_id, detail
) values (
  gen_random_uuid(),
  'admin-user-id',
  'reject_alumnus',
  'alumni',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  jsonb_build_object('previous_status', 'pending', 'reason', 'incomplete profile')
);
```

### 3.4 Recording a donation

Every successful donation creates a row in `donations` and at least one callback in `payment_events`. The amount is always stored in **paisa** (integer), never rupees.

```sql
-- Insert a new donation after a successful callback
insert into donations (
  id,
  amount_minor,      -- e.g. 500000 = NPR 5,000.00
  currency,
  method,            -- 'esewa', 'khalti', 'connectips', etc.
  status,
  gateway_ref,       -- the gateway's reference (TXNID, pidx, txnid, etc.)
  gateway_order_ref, -- short reference the gateway sends back (≤20 chars for ConnectIPS)
  goal_id,
  created_at,
  updated_at
) values (
  'd1e2f3a4-b5c6-7890-abcd-ef1234567890',
  500000,            -- NPR 5,000.00 in paisa
  'NPR',
  'esewa',
  'succeeded',
  'TXNID123456789',  -- gateway's reference id
  'ACCEPT-xyz123',   -- short ref we store (ConnectIPS caps at 20 chars)
  'goal-001',
  now(),
  now()
);

-- Record the gateway callback payload for reconciliation
insert into payment_events (
  id,
  donation_id,
  event_type,
  external_id,       -- gateway's own transaction id
  payload,           -- raw JSON from the gateway
  created_at
) values (
  gen_random_uuid(),
  'd1e2f3a4-b5c6-7890-abcd-ef1234567890',
  'callback',
  'GATEWAY-TXN-987654',
  '{\"status\":\"SUCCESS\",\"txnid\":\"TXNID123456789\",\"amount\":500000,\"currency\":\"NPR\"}::jsonb',
  now()
);
```

### 3.5 Updating a goal's raised total

When a donation succeeds, the goal's `raised_minor` must grow by the donation amount. Always use an atomic SQL update.

```sql
-- Add a donation to a goal's running total
update donation_goals
set raised_minor = raised_minor + 500000,   -- + NPR 5,000
    updated_at = now()
where id = 'goal-001'
  and raised_minor < target_minor;          -- don't exceed the target (unless actively unpaused)
```

### 3.6 Correcting a goal total after a test donation

If a test donation was created and then deleted, or a refund happened at the gateway, correct the goal total by subtraction:

```sql
-- Remove a test donation (NPR 5,000) from the goal total
update donation_goals
set raised_minor = raised_minor - 500000,
    updated_at = now()
where id = 'goal-001'
  and raised_minor >= 500000;   -- guard against going negative
```

### 3.7 Querying donations by gateway and date

For weekly reconciliation between the ledger and the gateway dashboard:

```sql
-- Total taken, by gateway and day (last 30 days)
select gateway,
       date_trunc('day', created_at) as day,
       sum(amount_minor) as total_minor,
       count(*) as gift_count
from donations
where status = 'succeeded'
  and created_at >= current_date - interval '30 days'
group by gateway, day
order by day desc;
```

### 3.8 Finding donations with missing callback payloads

```sql
-- Donations that succeeded but never had a callback recorded
select d.id,
       d.amount_minor,
       d.gateway,
       d.created_at
from donations d
left join payment_events p on p.donation_id = d.id
where d.status = 'succeeded'
  and p.id is null
order by d.created_at desc
limit 20;
```

### 3.9 Comparing goal totals versus collected gifts

```sql
-- Goal totals versus what was actually collected
select g.id,
       g.title,
       g.target_minor,
       g.raised_minor,
       coalesce(sum(d.amount_minor), 0) as collected_minor,
       g.active
from donation_goals g
left join donations d on d.goal_id = g.id and d.status = 'succeeded'
group by g.id, g.title, g.target_minor, g.raised_minor, g.active
order by g.sort_order;
```

If `raised_minor` disagrees with the sum of succeeded gifts, the usual reasons are:
- A test gift was created and deleted (correct by hand, §3.6)
- A refund happened at the gateway (refund in the gateway dashboard, then adjust the ledger)
- A donation was marked `succeeded` manually (never do this; only a verified callback sets it)

### 3.10 Auditing administrator actions (full example)

The `admin_audit_log` records every significant administrative change. A complete audit trail for a single administrator session might look like:

```sql
-- Show the last 50 administrative actions, newest first
select created_at,
       action,
       entity,
       entity_id,
       detail::text  -- the jsonb detail column, rendered as text
from admin_audit_log
order by created_at desc
limit 50;
```

Typical `detail` values:
- `{"previous_status":"pending","approved_by":"admin-123"}` — promotion
- `{"previous_status":"approved","reason":"incomplete profile"}` — rejection
- `{"goal_id":"goal-001","old_total":1200000,"new_total":1700000}` — goal total correction
- `{"donation_id":"d-123","old_status":"pending","new_status":"succeeded"}` — donation completion

### 3.11 Row-level security (RLS) — enabling it when ready

The steps to enable RLS (refer to §1.12 of the original guide):

1. **Split the roles**: create a migration/owner role and a runtime application role
```sql
-- Migration/owner role (used by npm run db:migrate:prod)
create role bpkihs_owner login password 'owner-secret';
grant all on database bpkihs to bpkihs_owner;
grant usage on schema public to bpkihs_owner;

-- Runtime application role (used by the app server)
create role bpkihs_app login password 'app-secret';
grant connect on database bpkihs to bpkihs_app;
grant usage on schema public to bpkihs_app;
grant select, insert, update, delete on all tables in schema public to bpkihs_app;
grant usage, select on all sequences in schema public to bpkihs_app;
alter default privileges in schema public grant select, insert, update, delete on tables to bpkihs_app;
-- bpkihs_app must NOT have BYPASSRLS
```

2. **Add server-set identity context** to ever
