# Deployment

The site is a single Next.js 16 application with a Postgres 16 database. It needs a Node runtime
(not a static host) because of Route Handlers, Better Auth sessions and payment callbacks.

## 1. What you need

- A domain, with HTTPS.
- A Postgres 16 database (Neon, Supabase, RDS, or a managed Postgres from the host).
- A Node host that can run `next start` (Vercel, Render, Railway, Fly.io, or a VPS).
- An eSewa and/or Khalti merchant account, and a Resend account with a verified sending domain.
- The Association's real office email, phone and address for `/support`.

## 2. Environment

Set these in the hosting platform's secret store. Never commit them.

| Variable               | Value                                                        |
| ---------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`         | `postgres://...` (use the pooled URL if the provider offers one) |
| `BETTER_AUTH_SECRET`   | 32+ random characters, unique to production                  |
| `APP_URL`              | `https://your-domain` — payment and auth redirects           |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain` — canonical links, baked at build time |
| `PAYMENT_MODE`         | `live` for real donations (use `sandbox` for staging)        |
| `ESEWA_PRODUCT_CODE` / `ESEWA_SECRET_KEY` | Live eSewa merchant credentials         |
| `ESEWA_GATEWAY_URL`    | Required in live mode (the production ePay form URL)          |
| `KHALTI_SECRET_KEY`    | Live Khalti secret key                                       |
| `KHALTI_BASE_URL`      | Required in live mode (Khalti production API)                |
| `EMAIL_TRANSPORT`      | `resend`                                                     |
| `RESEND_API_KEY`       | Resend API key                                               |
| `EMAIL_FROM`           | `BPKIHS Alumni Association <no-reply@your-domain>`           |
| `CONTACT_EMAIL`        | Public office address shown on `/support`                    |
| `CONTACT_PHONE`, `CONTACT_ADDRESS`, `CONTACT_HOURS` | Optional public details        |
| `TRUST_PROXY`          | `true` behind nginx/Caddy so rate limits see the client IP   |
| `APP_NAME`             | Optional display name used in email copy                     |
| `NEWSLETTER_MAX_RECIPIENTS` | Hard cap for one campaign (default 2,000)               |

Full VPS instructions, including nginx and systemd, are in [`HOWTO.md`](./HOWTO.md#7-production-on-a-vps).

`APP_URL` and `NEXT_PUBLIC_SITE_URL` must be the same origin. `APP_URL` is read at runtime;
`NEXT_PUBLIC_SITE_URL` is inlined at build time, so rebuild after changing it.

Run the check before a deploy:

```bash
npm run check:env
```

It fails on a missing database URL, a short auth secret, a non-HTTPS origin, a missing payment
mode, no gateway, the console email transport, an unverified `.local` sender, or a missing
contact email. The same checks run when the production server starts; if they fail, the server
refuses to serve requests until the configuration is fixed.

## 3. Database

Create an empty database, then apply the committed migrations:

```bash
npm install                 # includes the tooling used by the migration command
npm run db:migrate:prod
```

Run this as a release step before the new version starts. It is idempotent, so a retried deploy
is safe. The script runs through `tsx`, which is a dev dependency: run it in a build/release
environment installed with `npm ci` (not `--omit=dev`), or keep `tsx` and `dotenv` in a
runtime-only image. The same applies to `db:admin`.
Production starts with an empty database. Use `npm run db:admin` and enter real content through
`/admin/content`; there is no seed command and no demo dataset.

Create the first administrator (no default account exists):

```bash
ADMIN_EMAIL="president@your-domain" \
ADMIN_PASSWORD="a-long-unique-password" \
ADMIN_NAME="Association President" \
npm run db:admin
```

The command promotes an existing account and resets its password if the email already exists.
Use it for recovery too.

## 4. Build and start

```bash
npm ci
npm run build
npm start
```

`next start` listens on `PORT` when the platform sets it. The build prerenders public pages that
use `use cache`, so the build environment must be able to reach the database and must have the
runtime variables available. If your host builds without database access, run the build in CI
with a reachable database, or mark those pages dynamic before choosing such a host.

The health endpoint is `GET /api/health`. It returns `200` only when the process and a database
query both succeed, and `503` otherwise. Point the platform's health check and uptime monitor at
it.

## 5. Payments go-live

1. Obtain production merchant credentials from eSewa and/or Khalti in the Association's name.
2. Set the live keys and the live gateway URLs. Leave `PAYMENT_MODE=live`.
3. Confirm the return URLs registered with each gateway:
   - `https://your-domain/api/v1/payments/esewa/callback`
   - `https://your-domain/api/v1/payments/khalti/callback`
4. Make one small real donation and confirm it appears in `/admin/donations`, moves the goal
   total, and emails a receipt.
5. Refund or void that test donation with the gateway, and confirm the ledger still matches.

The application never trusts a browser redirect alone: eSewa's payload is re-signed and compared
in constant time, and Khalti is looked up server-side with the secret key. Every callback is kept
in `payment_events` for reconciliation.

If the gateway credentials are missing, production startup fails instead of offering a broken
checkout.

## 6. Email

Verify the sending domain in Resend (SPF, DKIM, and DMARC where the Association's DNS allows it)
and set `EMAIL_FROM` to an address on that domain. A new Resend account can only deliver to its
owner until the domain is verified.

Receipts are sent after the gateway confirms a donation. A failed email is logged and does not
undo the donation. Check the Resend dashboard during the first week.

## 7. Content

The database starts empty. The public site shows empty states (the welcome section hides itself)
until the Association adds:

- giving goals and the funds breakdown (the general fund is a goal row);
- current and previous board members;
- upcoming and past events;
- FAQ entries;
- the welcome message.

Sign in at `/admin/content` to add it. The content editor covers events, goals, the board, FAQ
and the welcome message; every save is audited. `/admin/newsletter` sends campaigns to subscribers
in batches, and `/admin/audit` shows recent admin activity.

Public pages are prerendered with `use cache` and revalidate on an hours/days schedule. Build
against the production database after the content is in place, or wait for revalidation/rebuild
after entering it, so the first visitors do not see the build-time empty state. There is no demo
dataset to avoid.

## 8. Platform notes

**Vercel:** set the variables for Production and Preview separately. Run
`npm run db:migrate:prod` and `npm run db:admin` from a machine with the production
`DATABASE_URL`, or as a one-off job; do not expose them in the build.

**Render / Railway / Fly.io:** use a release command or a pre-deploy job for
`npm run db:migrate:prod`, keep at least one instance during the migration, and point the health
check at `/api/health`.

**VPS:** run the app under systemd or a process manager, terminate TLS with Nginx or Caddy, and
proxy to the app port. Keep `NODE_ENV=production`, set `TRUST_PROXY=true` and make the proxy
overwrite `X-Real-IP` / `X-Forwarded-For`. Restrict database access to the app host. The complete
configuration is in [`HOWTO.md`](./HOWTO.md#7-production-on-a-vps).

## 9. Backups and operations

- Enable daily automated backups on the database and test a restore before launch.
- Keep at least two administrators; `db:admin` is the recovery path if one is lost.
- Ship application logs to the platform's log drain and alert on 5xx responses and
  `/api/health` returning 503.
- Rate limiting is in-process. It is correct for a single instance; before scaling to several
  instances, move the limiter to Redis (see `src/server/http/rate-limit.ts`).
- Sessions last 24 hours absolutely with a rolling refresh; admin actions expire after 30 idle
  minutes. Changing `BETTER_AUTH_SECRET` signs everyone out.
- The CSP allows inline scripts because pages are prerendered. See
  [`SECURITY.md`](./SECURITY.md#6-browser-and-transport-protections) before changing the policy.
- Encrypted nightly database backups; the database holds alumni, donor and helpdesk personal
  data.

## 10. Launch checklist

- [ ] Domain and HTTPS configured; `APP_URL` and `NEXT_PUBLIC_SITE_URL` match.
- [ ] `npm run check:env` passes with the production environment.
- [ ] `npm run db:migrate:prod` applied.
- [ ] First admin created; a second admin added with `db:admin`.
- [ ] Real content entered: goals, funds, board, events, FAQ, welcome message.
- [ ] `/support` shows the real office email, phone and address.
- [ ] Privacy, terms and accessibility pages reviewed by the Association.
- [ ] Resend domain verified; test receipt received.
- [ ] One live donation completed, visible in the ledger and emailed.
- [ ] A newsletter test message received, then a real campaign sent to a small list.
- [ ] `/api/health` returns 200 and is monitored.
- [ ] Security checklist in [`SECURITY.md`](./SECURITY.md#8-server-hardening-checklist) completed.
- [ ] Database backups enabled and a restore tested.
- [ ] `npm run build` and the browser suite pass against a production build.

## 11. Rollback

The app is stateless; redeploy the previous build to roll back code. Migrations are additive in
this project so far, but check `drizzle/` before rolling back across a migration. Restore the
database only as a last resort, and pause payments first if the ledger is in doubt.
