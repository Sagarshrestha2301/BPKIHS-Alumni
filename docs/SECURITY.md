# Security

This document describes the security model, the controls in the application, the residual risks,
and what the operator must do on the server. The target is **OWASP ASVS 4.0.3 Level 2**.

Security is a property of the deployment as well as the code. Section 8 is mandatory for a
production installation.

---

## 1. What is worth protecting

| Asset                         | Where it lives                         | Why it matters                                  |
| ----------------------------- | -------------------------------------- | ----------------------------------------------- |
| Alumni personal data          | `alumni`, directory pages              | Names, email, phone, city, employer, notes      |
| Donor data and gift history   | `user`, `donations`, `payment_events`  | Identity, amounts, gateway references           |
| Money                         | eSewa/Khalti/ConnectIPS + `donations`  | Fraud, double credit, false receipts            |
| Admin access                  | `user.role`, admin session             | Can publish, approve, delete and email everyone |
| Helpdesk and community content| `support_tickets`, `feed_posts`        | Personal messages, abuse, defamation            |
| Newsletter list              | `newsletter_subscribers`               | Bulk email and consent                          |
| Profile photos               | `PHOTO_UPLOAD_DIR`                     | A face, sometimes with location metadata        |
| Secrets                       | environment only                       | Database, gateway, email, session signing       |

### Actors and entry points

- **Anonymous visitor**: public pages, registration, RSVP, newsletter, community post, report,
  helpdesk, donation checkout.
- **Donor account** (a normal user): signs in to give and receive a receipt, and can follow a
  pending alumni registration.
- **Alumnus**: signs in to maintain a profile and read alumni-only directory details.
- **Administrator**: full dashboard, content API, newsletter sending.
- **Attacker**: untrusted browser, cross-site request, stolen session cookie, payment callback
  forgery, spam bot, malicious file/URL in content.
- **Third parties**: eSewa, Khalti, ConnectIPS (NCHL), Resend, the reverse proxy, the database
  host.

Trust boundaries: browser → proxy → Next.js → Postgres, and the gateway/provider → callback/API.
Everything from the browser is untrusted, including headers, cookies, form fields and the
`Origin` header; the proxy is trusted only when it overwrites the client-address headers.

---

## 2. Authentication and sessions

- Better Auth email/password accounts, used for the donation gate, the admin dashboard and
  self-registration. Browsing the site needs no account.
- Email ownership is proved with an emailed one-time code (Better Auth email-OTP): six digits,
  stored hashed, 15-minute lifetime, five wrong guesses, 3 sends per address per minute. The
  verify call is the only place a code is accepted, and it signs the member in.
- A self-registration cannot be approved until its address is confirmed, so a typo cannot publish
  someone else's record. The resend endpoint replies identically for known and unknown addresses.
- Passwords: minimum **8 characters** (`PASSWORD_MIN_LENGTH`), maximum 128, hashed by Better
  Auth. The floor is the familiar one, so it is not a strength guarantee: two-factor is mandatory
  for administrators in production and a breached-password check is still an open item.
- Two-factor: TOTP through Better Auth's two-factor plugin, managed at `/admin/security`. It is
  **required for administrators in production**: `requireAdmin()` returns 403 and
  `requireAdminPage()` redirects to the security page until the account has enrolled. That page
  and Better Auth's own two-factor endpoints stay reachable so enrolment can complete; the admin
  shell shows no queues, counts or navigation in the meantime. Development and the test suite are
  exempt, so seeded administrators keep working locally. For other accounts TOTP is optional.
  Once enabled, `/api/auth/sign-in/email` returns a short-lived challenge instead of a session;
  only `/two-factor/verify-totp` or a single-use backup code completes it. Secrets are encrypted
  with `BETTER_AUTH_SECRET`, backup codes are hashed, and wrong codes are rate-limited and lock
  the account briefly.
- A lost authenticator is recovered with a backup code, or, if those are gone too, with
  `ADMIN_RESET_2FA=true npm run db:admin` on the host. That path needs shell access and resets
  the password at the same time, so it is a break-glass action, not a support workflow.
- Session cookie: `HttpOnly`, `SameSite=Lax`, `Secure` when `APP_URL` is HTTPS, path `/`.
- Absolute session lifetime: **24 hours** (`SESSION_MAX_AGE_HOURS`). Rolling refresh every
  **15 minutes** (`SESSION_UPDATE_AGE_MINUTES`).
- Admin idle timeout: **30 minutes** (`ADMIN_REAUTH_AFTER_MINUTES`). The dashboard checks the
  session's last refresh and redirects to sign-in; the API returns 401.
- Sign-in is limited to 5 attempts per minute per client and sign-up to 5 per hour, in addition
  to the route limiter. Better Auth applies a global 100 requests/minute guard.
- `trustedOrigins` contains exactly the configured origin in production. A wrong `APP_URL`
  produces an explicit "Invalid origin" rather than accepting the request. Development also
  trusts loopback on any port, so a dev server on a different port (a preview tool, or
  `next dev -p`) still signs in and out; `npm run dev` itself pins 3000.
- Sign-out invalidates the session through Better Auth. Rotating `BETTER_AUTH_SECRET` invalidates
  every session at once.
- Account deletion and impersonation are disabled.

**Residual:** no WebAuthn/passkeys and no breached-password lookup (HIBP). TOTP is available but
optional, so an administrator who has not enrolled is still protected by the password and the
idle timeout alone. Make enrolment part of onboarding.

---

## 3. Authorisation

- **PostgreSQL row-level security is not enabled.** The application uses a single pooled database
  identity for Better Auth, public writes, member reads, payment callbacks and admin operations.
  PostgreSQL cannot distinguish those visitors from that connection alone. A policy that trusts
  a caller-settable session variable would be spoofable unless every query runs inside a
  transaction that sets it with a trusted server identity; broad policies for the shared role
  would add no protection. The current boundary is the server-side role, ownership and visibility
  checks described below : not database RLS. Do not treat this deployment as RLS-protected.
- To introduce enforceable RLS, use a non-owner runtime role with no `BYPASSRLS`, separate
  migration/owner credentials, and transaction-scoped server-set identity context (`SET LOCAL`)
  for every protected query. Adapt Better Auth, public mutations, member reads, payment callbacks,
  admin screens and background scripts to that context; default-deny policies must fail closed
  when it is absent. Integration tests must prove cross-user denial through the production pool
  before enabling policies. Until that work is complete, keep `DATABASE_URL` secret, restrict
  database network access, and retain the application authorization checks below.
- Public reads are anonymous. Public writes are rate-limited and origin-checked.
- Three roles are stored on `user.role` and read from the session on every request. Nothing is
  trusted from the browser: the role is never sent in a body, query or header.

  | Role               | Directory                    | Own profile              | `/admin` |
  | ------------------ | ---------------------------- | ------------------------ | -------- |
  | Visitor            | Public profiles only         | No                       | No       |
  | `donor`            | Public profiles only         | Own pending registration | No       |
  | `alumni`           | Public and `alumni_only`     | Yes                      | No       |
  | `admin`            | Public and `alumni_only`     | When it owns one         | Yes      |

  A self-registration starts as `donor`, not `alumni`. `approveAlumnus()` promotes the owner to
  `alumni` in the same transaction that publishes the profile, and `rejectAlumnus()` demotes an
  alumnus back to `donor`; the demotion also deletes that member's live sessions, so the briefly
  cached role in the session cookie cannot keep the alumni view. An administrator is never
  demoted by a profile decision. `hidden` stays hidden to every role in the public directory;
  staff read those records in `/admin`.
- `requireSession()` requires any signed-in account; `requireAdmin()` requires `role = "admin"`,
  a fresh session, and, in production, an enrolled authenticator. The pure rule lives in
  `src/lib/auth/two-factor.ts` so the API guard, the page guard and the tests cannot drift. The
  guards read the live `user.two_factor_enabled` column rather than the session cookie's cached
  user, so enrolling or removing TOTP takes effect on the next request.
- Better Auth's admin plugin also exposes `/api/auth/admin/*` (set-role, ban, create-user). This
  application never calls those endpoints : role changes go through `approveAlumnus()`,
  `rejectAlumnus()` and the CLI : so `src/proxy.ts` answers `404` for that prefix in production.
  That closes a route around the TOTP gate for an unenrolled administrator without disabling the
  plugin's role field.
- Directory reads resolve the viewer with `getViewer()` (`src/server/auth/session.ts`) and hand
  it to the services. `Viewer` carries only `isAlumnus`, so a cache entry can be shared by every
  alumnus and cannot contain one person's identity. The cached directory getters include the
  viewer in their cache key; the public and alumni entries never mix.
- Profile updates are ownership-guarded: `PATCH /api/v1/account/profile` selects the record by
  `session.user.id`, and its Zod schema cannot carry email, programme, batch year or status.
- Every admin page calls `requireAdminPage()` **in the page**, not only in the layout, because
  Next streams a page while the layout resolves. The layout check alone would leak page HTML.
- Every admin API route calls `requireAdminRead()` or `requireAdminMutation()`; there is no route
  that checks the role by hand.
- Admin mutations go through one guard: origin → CSRF → rate limit → role. A new route cannot
  quietly skip a control.
- Admin records are global Association content, so there is no per-row ownership. Donations and
  tickets are readable only by admins. Public profile fields follow the alumnus's privacy choice
  in `src/lib/api/privacy.ts`.
- No viewer receives a field that their role or the member's privacy setting does not allow.
- The newsletter is double opt-in: `POST /api/v1/newsletter` stores the address as `pending`
  and emails a confirmation link, and the row becomes `subscribed` only when that link's page is
  submitted with the token. Campaigns and the digest select `subscribed` rows only, so an address
  nobody confirmed is never mailed. The link lands on a page with a button rather than
  confirming on GET, because email clients and scanners fetch links on their own. A provider
  that refuses the confirmation message is reported to the visitor rather than hidden; the row
  stays `pending` and `confirmation_sent_at` stays null, so retrying sends again. That flag
  describes the send attempt, never whether an address is on the list.
- Newsletter preferences are an authorisation boundary of their own: an address is public
  knowledge, so `PATCH /api/v1/newsletter` changes a subscription only when the request carries
  the subscriber's token. Without it the API emails a one-click confirmation link and changes
  nothing, and the answer is the same for known and unknown addresses. Every campaign email's
  `Unsubscribe:` line points at `GET /api/v1/newsletter/unsubscribe?token=…`, which needs no
  session because the token is the proof.

---

## 4. Cross-site request forgery and origins

Two independent controls protect cookie-authenticated writes:

1. **Origin check.** Mutations with an `Origin` header must match `APP_URL`,
   `BETTER_AUTH_URL` or `NEXT_PUBLIC_SITE_URL`.
2. **Double-submit token.** The proxy issues a random `bpkihs_csrf` cookie
   (`SameSite=Lax`, readable by our JavaScript). For requests that carry a session cookie, the
   mutation must echo the same value in `x-csrf-token`; comparison is length-safe. A cross-site
   attacker can send the cookie but cannot read it to fill the header.

The browser client and the admin client both read the cookie and send the header. Public writes
without a session have no ambient authority to abuse; they are still origin-checked and
rate-limited. Gateway callbacks are exempt because they are authenticated by signature or a
server-side lookup, not by a cookie.

---

## 5. Input, output and injection

- Every write parses a Zod schema at the route boundary. The same schema drives the form.
- Bodies must be `application/json`; malformed JSON is 422, and a body over
  `MAX_REQUEST_BYTES` (128 KiB default) is 413. Content type and byte size are checked before
  parsing.
- Query parameters are clamped (`page`, `pageSize`); unknown values are ignored rather than
  passed through.
- SQL is always parameterised through Drizzle. No string-built SQL exists outside fixed
  expressions (`count(*)`, `sum(...)`).
- React escapes all rendered text. There is no `dangerouslySetInnerHTML` or `innerHTML` in the
  codebase.
- URLs in content must be `https://` or a site-relative path. A protocol-relative `//host` value
  is rejected, which blocks an easy open-redirect/image injection path.
- Profile photos are the only upload. The route requires a session, same-origin, a CSRF token
  and a 6/min limit; it reads the multipart body through a bounded stream. The declared MIME type
  is not trusted: `sharp` decodes the bytes, accepts only real JPEG/PNG/WebP, caps decoded pixels
  and dimensions, applies orientation and re-encodes to WebP. That removes EXIF/GPS metadata and
  destroys polyglot or archive payloads. Stored files have UUID names and are never under
  `public/`.
- Photo access is re-checked from the database on every request: approved plus the profile's
  visibility for the viewer, or the owner/an administrator for a pending preview. The public URL
  is `/api/v1/alumni/[id]/photo`; a storage key never leaves the server.
- Photo consent is explicit (`alumni.photo_consent`) and separate from the registration consent.
  Removing the photo deletes the file and clears the flag; a retained file cannot be served after
  consent is withdrawn. Uploading a photo does not change profile visibility.
- Email bodies are plain text; user text is never used as HTML.

**Residual:** the CSP allows inline scripts (see section 6), so DOM XSS would not be blocked by
the policy alone. React escaping and URL validation are the primary defences. Photos are stored
on the app server's disk in the documented single-instance deployment; object storage would be
needed for multiple instances, and the disk must be private (mode `750`, owned by the service
user) and backed up.

---

## 6. Browser and transport protections

Set in `src/proxy.ts` (request-dependent) and `next.config.ts` (all responses):

- `Content-Security-Policy`: `default-src 'self'`; scripts and styles limited to the site with
  inline allowed; images `self/data/blob/https`; objects disabled; `base-uri` self;
  `frame-ancestors 'none'`; `upgrade-insecure-requests` in production. `frame-src`, `script-src`
  and `connect-src` name exactly one external origin, `https://challenges.cloudflare.com`, for
  the Turnstile widget (section 7).
- `form-action` is `'self'` plus the payment gateway origins only (`ESEWA_GATEWAY_URL`,
  `KHALTI_BASE_URL`, `CONNECTIPS_BASE_URL` and the sandbox endpoints, all HTTPS). Checkout submits a real form to the
  provider, so a strict `'self'` blocks every live payment : this was a launch-blocking bug, found
  and fixed on 25 Oct 2026. A new gateway must add its origin in `next.config.ts` (see
  `TRACKER.md` C7b).
- Structured data is serialised with `<` escaped (`src/lib/seo/json-ld.ts`). Event titles and
  breadcrumb labels come from the database, and an unescaped `</script>` would end the tag.
- `Strict-Transport-Security` (production HTTPS, 180 days, includeSubDomains).
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` denying camera/mic/geolocation/payment/USB,
  `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`.
- `X-Powered-By` is disabled.
- Cookies are `Secure` on HTTPS and `SameSite=Lax`; no cookie is `SameSite=None`.

**Trade-off:** a nonce-based CSP is not possible while pages are statically prerendered or use
Partial Prerendering. Next only attaches a nonce during dynamic rendering; a nonce policy would
block the prerendered scripts. The site therefore allows inline scripts. If the Association later
requires strict CSP, disable PPR/static generation and move to nonce-based dynamic rendering, at
a measurable performance cost. This is recorded as a deliberate decision, not an oversight.

---

## 7. Abuse prevention and availability

- **Human verification.** Registration, event RSVP, the public contact form and the newsletter
  (subscribe and preference changes) require a Cloudflare Turnstile token. The browser renders
  the widget only where a form needs it; the server asks
  `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `TURNSTILE_SECRET_KEY` and
  refuses the request when the answer is not `success`. The token is read *after* schema
  validation, so a field error never consumes it, and the widget is reset after a failed
  submission because a token is single-use. A missing secret is a no-op in development (which
  keeps the browser suite runnable with no Cloudflare account) and a **refusal in production**;
  `env.ts` also refuses to boot without it. The CSP is widened only for
  `https://challenges.cloudflare.com` (script, connect and frame).
- Per-IP fixed-window limits: registration 5/min, donation 10/min, RSVP 5/min, community post
  3/min, report 5/min, newsletter 5/min, support 5/min, photo 6/min; admin reads 240/min and
  mutations 60/min.
- The limiter returns `429` with `Retry-After`.
- Memory is bounded (20,000 buckets, expired entries swept); a client cannot grow it without
  limit.
- The client address comes from `X-Real-IP`, then the last `X-Forwarded-For` entry, and only when
  `TRUST_PROXY` is true. **Set `TRUST_PROXY=false` if the app is directly exposed**, otherwise a
  client can choose its own bucket.
- Request bodies are bounded; Next/nginx timeouts bound slow requests (`proxy_read_timeout` in the
  HOWTO).
- Newsletter sending has a hard recipient cap and batch size so one request cannot run forever.
- Payment and email calls have timeouts.

**Residual:** the limiter is per process. One Node process is the documented deployment. If the
site ever runs more than one instance, replace `src/server/http/rate-limit.ts` with a shared store
(Redis) before scaling out. A distributed denial-of-service still requires a network/edge control
(provider scrubbing, fail2ban, or a CDN).

---

## 8. Server hardening checklist

1. **TLS everywhere.** Terminate at nginx with a valid certificate; redirect port 80 to 443. Do
   not expose Node port 3000.
2. **Proxy headers.** nginx must set `X-Real-IP $remote_addr`, overwrite
   `X-Forwarded-For`, and pass `X-Forwarded-Proto`. Set `TRUST_PROXY=true` only then.
3. **Secrets.** Environment file owned by the service user (`chmod 600`), never in git, never in
   the client bundle, never in logs. Generate `BETTER_AUTH_SECRET` with 32+ random bytes.
4. **Database.** Use a non-superuser runtime role with only the privileges the app needs; keep
   schema ownership/migrations on a separate operator role. Listen on loopback or a private
   network, use TLS for remote connections, and never expose port 5432 publicly. This least-
   privilege setup is not itself RLS: see section 3 for the additional request-context work RLS
   requires.
5. **Firewall.** Allow 22 (restricted), 80 and 443 only. Keep the host patched.
6. **Least privilege.** Run the app as an unprivileged user; the systemd unit uses
   `NoNewPrivileges` and `PrivateTmp`.
7. **Backups.** Encrypted nightly dumps copied off the host; test restore. Back up the photo
   directory too. Backups contain personal data and portraits.
8. **Photo directory.** `PHOTO_UPLOAD_DIR` must be outside the web root and the release folder,
   owned by the service user with mode `750`, and included in disk monitoring. The app serves it
   only through the checked route; do not expose it from nginx.
9. **Monitoring.** Probe `/api/health`; alert on 5xx, certificate expiry, disk and database
   connections. Photo storage growth is part of disk monitoring.
10. **Email domain.** SPF, DKIM and DMARC on the sending domain; a verified Resend domain before
    the first campaign.
11. **Log retention.** Keep application logs long enough to investigate abuse (30–90 days) and
    restrict access. Do not log secrets, full cookies or payment payloads.
12. **Two-factor.** Enforced for administrators in production. Enrol at `/admin/security` before
    the dashboard holds real registrations; the dashboard stays locked until it is on. Store the
    backup codes offline and record who holds which account. Break-glass is
    `ADMIN_RESET_2FA=true npm run db:admin` on the host (it resets the password too).
13. **Bot protection.** Create a Turnstile widget for the production hostname, set
    `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (build time) and `TURNSTILE_SECRET_KEY` (runtime), then
    rebuild. A production start refuses without both. Cloudflare's always-pass **test** keys are
    for local work only; never ship them.
14. **Backups in practice.** The scripts are in `scripts/`; install the cron entries and an
    external health monitor. A script that nobody schedules is not a backup.

---

## 9. Audit, logging and errors

- `admin_audit_log` records admin creates, updates, deletes, approvals, rejections, report
  resolutions, ticket status changes and newsletter sends, with actor, entity, entity id, an
  optional detail object and a timestamp. `/admin/audit` shows the newest 200.
- Every API error gets a request id, returned in the body and `x-request-id`, and logged with that
  id. Unknown errors are logged server-side and answered with a generic message; provider and
  database details never reach the browser.
- Payment callbacks are logged on failure and every accepted callback is stored in
  `payment_events`.
- Email delivery failures are logged without leaking the provider response to the caller.

Audit rows are not automatically deleted. Decide a retention period with the Association's legal
adviser and archive or prune older rows in a scheduled job.

---

## 10. Payments

- No simulator. `PAYMENT_MODE` must be `sandbox` or `live`; production startup requires a
  configured gateway and an HTTPS gateway URL.
- A donation is `pending` until verification. eSewa's signed callback is re-signed with the
  merchant secret and compared in constant time, including the product code. Khalti is looked up
  server-side with the secret key. ConnectIPS is resolved by its stored short reference and
  validated with a signed token over our own amount; a browser redirect alone never completes it.
- The amount reported by the gateway must equal the stored amount.
- Completion is idempotent: a repeated callback collides on `(gateway, external_id)` and does not
  double-credit the goal; a failure cannot overwrite a success.
- A browser redirect alone never marks a donation paid.
- Gateway secrets and payloads are never rendered in the UI; only the admin ledger exposes the
  donation record.

---

## 11. Dependency and code integrity

- Run `npm audit --omit=dev` before a release; the runtime tree is checked in CI.
- `next` is pinned to a patched release. Do not use `npm audit fix --force` blindly; inspect
  breaking upgrades.
- Dev-only advisories in `drizzle-kit`/`esbuild` are accepted because those tools never ship
  to the runtime. `npm audit --omit=dev` can still list them while `drizzle-kit` is in the local
  tree; a production install is made with `npm ci --omit=dev`. Recheck when drizzle-kit updates.
- `sharp` decodes untrusted uploads, so it is a runtime package to keep patched. It is on
  0.35.5, the release that fixes the libvips/libheif/librsvg advisories.
- All runtime packages are conventional npm dependencies. There are no postinstall scripts in
  application code, no remote code loading, and no third-party scripts on public pages.
- `npm run ci` (format, typecheck, lint, tests, production build) is the release gate.

---

## 12. Security tests

Run the focused suite:

```bash
npx vitest run src/server/http src/lib/api/admin-schemas.test.ts
npm run test
npm run typecheck
npm run lint
npm audit --omit=dev
```

The tests cover CSRF acceptance/rejection, rate limits and `Retry-After`, body size and content
type rejection, origin rejection, error redaction, request ids, admin content validation and
environment checks. `e2e/mfa.spec.ts` enrols a throwaway administrator with the authenticator
code generated in the test, proves that the password alone does not open the dashboard, signs in
with a code and turns two-factor off again.

Before a release, also verify by hand:

1. `/admin` while signed out redirects and does not include data.
2. An admin mutation without `x-csrf-token` returns 403.
3. A mutation with `Origin: https://evil.example` returns 403.
4. A donor cannot call any `/api/v1/admin/*` route (403).
5. A stale admin session (or one older than the idle window) redirects to sign-in.
6. `/api/health` returns 503 when the database is stopped.
7. `/admin/security` is reachable only as an admin; enrolling a test account asks for a code at
   the next sign-in, and a backup code works once. In a production build, an administrator
   without TOTP is confined to that page and `/api/v1/admin/*` returns 403.
8. `ADMIN_RESET_2FA=true npm run db:admin` clears only the named account's authenticator.

Unit coverage for the controls added by the 26 October review lives beside the code:
`src/server/email/headers.test.ts` (header sanitisation), `src/lib/images/host.test.ts`
(the `next/image` allowlist) and `src/server/bot/turnstile.test.ts` (the bot gate, including the
production refusal). That review, its evidence and its residual risks are in
`docs/SECURITY-AUDIT.md`.

To exercise the widget locally, start the app with Cloudflare's always-pass test keys in
`.env.local` (`NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`,
`TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`). With no keys the widget renders
nothing and the server skips the check outside production, which is how the browser suite runs.

---

## 13. Incident response

If you suspect a compromise:

1. **Contain.** Rotate `BETTER_AUTH_SECRET` (ends every session), gateway keys and
   `RESEND_API_KEY`. Restrict network access if the host is suspect.
2. **Preserve evidence.** Copy `journalctl` output, the reverse-proxy log and a database snapshot
   before changing more. Do not delete audit rows.
3. **Investigate.** Use `admin_audit_log`, `payment_events`, Better Auth's `session` and
   `account` tables, and request ids from the logs.
4. **Recover.** Restore a verified backup if data was altered; reset admin passwords with
   `npm run db:admin`; confirm gateway settlements against `donations`.
5. **Notify.** Follow the Association's legal and donor-notification obligations. Do not email
   the full list about an incident without legal review.

Report a vulnerability privately to the Association's technical contact; do not open a public
issue with exploit details.
