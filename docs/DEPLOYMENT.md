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
| `APP_URL`              | `https://your-domain` : payment and auth redirects           |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain` : canonical links, baked at build time |
| `PAYMENT_MODE`         | `live` for real donations (use `sandbox` for staging)        |
| `ESEWA_PRODUCT_CODE` / `ESEWA_SECRET_KEY` | Live eSewa merchant credentials         |
| `ESEWA_GATEWAY_URL`    | Required in live mode (the production ePay form URL)          |
| `KHALTI_SECRET_KEY`    | Live Khalti secret key                                       |
| `KHALTI_BASE_URL`      | Required in live mode (Khalti production API)                |
| `EMAIL_TRANSPORT`      | `resend`                                                     |
| `RESEND_API_KEY`       | Resend API key                                               |
| `EMAIL_FROM`           | `BPKIHS Alumni Association <no-reply@your-domain>`           |
| `CONTACT_EMAIL`        | Public office address shown on `/support`                    |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile site key for the public forms; baked in at build time |
| `TURNSTILE_SECRET_KEY` | Turnstile secret key, verified server-side for every public form |
| `CONTACT_PHONE`, `CONTACT_ADDRESS`, `CONTACT_HOURS` | Optional public details        |
| `TRUST_PROXY`          | `true` behind nginx/Caddy so rate limits see the client IP   |
| `APP_NAME`             | Optional display name used in email copy                     |
| `NEWSLETTER_MAX_RECIPIENTS` | Hard cap for one campaign (default 2,000)               |
| `PHOTO_UPLOAD_DIR`     | Writable persistent directory for profile photos, e.g. `/var/lib/bpkihs-alumni/photos`. Required in practice on any host whose filesystem is ephemeral. |

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

1. Obtain production merchant credentials from eSewa, Khalti and/or NCHL (ConnectIPS) in the
   Association's name.
2. Set the live keys and the live gateway URLs. Leave `PAYMENT_MODE=live`. For ConnectIPS set the
   six merchant values plus the PEM signing key described in `HANDOVER.md` §2.
3. Confirm the return URLs registered with each gateway:
   - `https://your-domain/api/v1/payments/esewa/callback`
   - `https://your-domain/api/v1/payments/khalti/callback`
   - `https://your-domain/api/v1/payments/connectips/callback` as both the success and failure URL
4. Make one small real donation and confirm it appears in `/admin/donations`, moves the goal
   total, and emails a receipt.
5. Refund or void that test donation with the gateway, and confirm the ledger still matches.

The application never trusts a browser redirect alone: eSewa's payload is re-signed and compared
in constant time, Khalti is looked up server-side with the secret key, and ConnectIPS is validated
server-side with a signed token. Every callback is kept in `payment_events` for reconciliation.

If the gateway credentials are missing, production startup fails instead of offering a broken
checkout.

ConnectIPS is built but has not been run against NCHL's UAT host yet; complete the sandbox
onboarding before enabling it in production. Fonepay has no adapter yet (`TRACKER.md` C7b) : do
not add its return URL to this checklist.

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

Sign in at `/admin/content` to add it. The content editor covers events, goals, the funds
breakdown, the board, FAQ and the welcome message; every save is audited. `/admin/newsletter`
sends campaigns to subscribers in batches, `npm run newsletter:digest` sends the monthly digest
from cron (see §9), and `/admin/audit` shows recent admin activity.

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
configuration is in [`HOWTO.md`](./HOWTO.md#8-production-on-a-vps).

**Profile-photo storage.** Photos are written to `PHOTO_UPLOAD_DIR` on the app server and are
served only through `/api/v1/alumni/[id]/photo`. Use a persistent host directory outside the
release folder (the VPS instructions create `/var/lib/bpkihs-alumni/photos`), make it writable by
the service user, and include it in backups. A platform with an ephemeral filesystem, such as a
stateless Vercel deployment, will lose photos on redeploy; either choose the VPS, attach a
persistent volume, or implement an object-storage driver first. nginx must allow the upload body:
`client_max_body_size 6m` (the application caps a photo at 5 MB).

## 9. Backups and operations

- `scripts/backup-db.sh` writes a gzipped SQL dump, keeps 14 days and encrypts with AES-256 when
  `BACKUP_ENCRYPTION_KEY` is set. Install it in the host's crontab; the exact entries and restore
  commands are in [`HOWTO.md`](./HOWTO.md#9-backups-and-recovery). Test a restore before launch.
  A backup left on the same disk is not a backup; copy it off the host.
- `scripts/healthcheck.sh` probes `/api/health` and, when `ALERT_WEBHOOK_URL` is set, posts a
  Slack-compatible message. Point an uptime monitor at the same endpoint and alert on 5xx.
- `npm run newsletter:digest` sends the monthly digest (preview with `-- --dry-run`). Install it
  in the host's crontab, e.g. `5 7 1 * *  cd /srv/bpkihs-alumni && npm run newsletter:digest >>
  /var/log/bpkihs-newsletter.log 2>&1`. A run repeats safely: a campaign with this month's
  subject that already sent is skipped.
- Keep at least two administrators; `db:admin` is the recovery path if one is lost. Every
  administrator should enrol TOTP at `/admin/security` before real data lands. A lost device is
  recovered with a backup code, or with `ADMIN_RESET_2FA=true npm run db:admin` on the host.
- Ship application logs to the platform's log drain and alert on 5xx responses and
  `/api/health` returning 503.
- Rate limiting is in-process. It is correct for a single instance; before scaling to several
  instances, move the limiter to Redis (see `src/server/http/rate-limit.ts`).
- Sessions last 24 hours absolutely with a rolling refresh; admin actions expire after 30 idle
  minutes. Changing `BETTER_AUTH_SECRET` signs everyone out and invalidates existing TOTP
  enrolments, because the secrets are encrypted with it.
- The CSP allows inline scripts because pages are prerendered. See
  [`SECURITY.md`](./SECURITY.md#6-browser-and-transport-protections) before changing the policy.
- Encrypted nightly database backups; the database holds alumni, donor and helpdesk personal
  data. Back up `PHOTO_UPLOAD_DIR` too: the photo files are not in the SQL dump.

## 10. Launch checklist

- [ ] Domain and HTTPS configured; `APP_URL` and `NEXT_PUBLIC_SITE_URL` match.
- [ ] `npm run check:env` passes with the production environment.
- [ ] `npm run db:migrate:prod` applied.
- [ ] First admin created; a second admin added with `db:admin`.
- [ ] Two-factor enabled on every administrator at `/admin/security`; backup codes stored offline.
- [ ] Real content entered: goals, funds, board, events, FAQ, welcome message.
- [ ] `/support` shows the real office email, phone and address.
- [ ] Privacy, terms and accessibility pages reviewed by the Association.
- [ ] Resend domain verified; test receipt received.
- [ ] One live donation completed, visible in the ledger and emailed.
- [ ] Newsletter double opt-in exercised: subscribe with a real address, open the emailed link, press Confirm, see it move from "Awaiting confirmation" to "Subscribed", then receive a test campaign and unsubscribe.
- [ ] `/api/health` returns 200 and is monitored.
- [ ] Security checklist in [`SECURITY.md`](./SECURITY.md#8-server-hardening-checklist) completed.
- [ ] Backup cron installed (`scripts/backup-db.sh`), photo-directory backup added, and a restore tested.
- [ ] Newsletter digest cron installed (`npm run newsletter:digest`, previewed first with `-- --dry-run`).
- [ ] `PHOTO_UPLOAD_DIR` is on persistent storage, writable by the service user, and nginx allows a 6 MB upload.
- [ ] Health monitoring alerts (`scripts/healthcheck.sh` or an external uptime monitor).
- [ ] `npm run build` and the browser suite pass against a production build.
- [ ] **Search engine ownership:** Google Search Console and Bing Webmaster Tools verified
      (DNS TXT record, or the meta tag via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` /
      `NEXT_PUBLIC_BING_SITE_VERIFICATION` in `.env.local`), then `sitemap.xml` submitted in
      both.
- [ ] **Share preview checked:** paste the site URL into the [Facebook Sharing Debugger]
      (https://developers.facebook.com/tools/debug/) and the [Slack link tester]
      (https://app.slack.com/client) : both must show `public/og-image.jpg` (1200 × 630), not
      a fallback. Cached scrapes need *Scrape Again*.
- [ ] **Brand assets current:** `public/og-image.jpg`, `public/icons/*`,
      `public/apple-touch-icon.png` and `src/app/favicon.ico` are all generated from the current
      logo and hero photograph. Re-run `npx tsx scripts/generate-brand-assets.ts` after either
      source file changes.
- [ ] **Lighthouse re-run on the deployed origin:** SEO ≥ 98, Accessibility ≥ 95, Best Practices
      ≥ 95 on `/`, `/directory` and `/events`. `docs/TRACKER.md` D5 holds the earlier numbers.
- [ ] **robots.txt and sitemap checked live:** `GET /robots.txt` and `GET /sitemap.xml` on the
      production host : both must be 200 and reference the production origin only.

### SEO notes

- Every public page ships a title, a description, a canonical and an Open Graph/Twitter card;
  the defaults live in `src/app/layout.tsx`, per-page overrides in each `page.tsx`.
- `public/` contains no generated assets by hand: `scripts/generate-brand-assets.ts` writes them
  from `bp-koirala_logo.png` and `hero-bpkihs-campus.jpg`.
- `/admin`, `/account`, `/sign-in` and the checkout pages are `noindex` **and** disallowed in
  `robots.txt`. A URL that must never be indexed needs both : keep them in step if you add one.
- **Known, accepted: an unknown dynamic id answers 200, not 404.** An unknown `/directory/[id]`,
  `/community/[id]` or `/events/[slug]` renders the not-found page with a **200** status. Those
  routes stream, and Next.js cannot change the status once streaming has begun
  (nextjs.org/docs/app/api-reference/file-conventions/loading). Next attaches `noindex` itself,
  so Google keeps them out of the index; the alternative is an existence check in `proxy.ts`,
  which would need a database query on every profile, post and event request and does not merit
  that cost for a URL that is already `noindex`.

## 11. Rollback

The app is stateless; redeploy the previous build to roll back code. Migrations are additive in
this project so far, but check `drizzle/` before rolling back across a migration. Restore the
database only as a last resort, and pause payments first if the ledger is in doubt.
