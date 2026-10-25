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
| Money                         | eSewa/Khalti + `donations`             | Fraud, double credit, false receipts            |
| Admin access                  | `user.role`, admin session             | Can publish, approve, delete and email everyone |
| Helpdesk and community content| `support_tickets`, `feed_posts`        | Personal messages, abuse, defamation            |
| Newsletter list              | `newsletter_subscribers`               | Bulk email and consent                          |
| Secrets                       | environment only                       | Database, gateway, email, session signing       |

### Actors and entry points

- **Anonymous visitor**: public pages, registration, RSVP, newsletter, community post, report,
  helpdesk, donation checkout.
- **Donor account**: signs in only to give and receive a receipt.
- **Administrator**: full dashboard, content API, newsletter sending.
- **Attacker**: untrusted browser, cross-site request, stolen session cookie, payment callback
  forgery, spam bot, malicious file/URL in content.
- **Third parties**: eSewa, Khalti, Resend, the reverse proxy, the database host.

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
- Passwords: minimum **12 characters** (`PASSWORD_MIN_LENGTH`), maximum 128, hashed by Better
  Auth. The previous 8-character floor was raised because there is no MFA yet.
- Session cookie: `HttpOnly`, `SameSite=Lax`, `Secure` when `APP_URL` is HTTPS, path `/`.
- Absolute session lifetime: **24 hours** (`SESSION_MAX_AGE_HOURS`). Rolling refresh every
  **15 minutes** (`SESSION_UPDATE_AGE_MINUTES`).
- Admin idle timeout: **30 minutes** (`ADMIN_REAUTH_AFTER_MINUTES`). The dashboard checks the
  session's last refresh and redirects to sign-in; the API returns 401.
- Sign-in is limited to 5 attempts per minute per client and sign-up to 5 per hour, in addition
  to the route limiter. Better Auth applies a global 100 requests/minute guard.
- `trustedOrigins` contains exactly the configured origin. A wrong `APP_URL` produces an explicit
  "Invalid origin" rather than accepting the request.
- Sign-out invalidates the session through Better Auth. Rotating `BETTER_AUTH_SECRET` invalidates
  every session at once.
- Account deletion and impersonation are disabled.

**Residual:** no TOTP/WebAuthn MFA and no breached-password lookup (HIBP). Both are appropriate
next steps for an admin account that can email the whole list.

---

## 3. Authorisation

- Public reads are anonymous. Public writes are rate-limited and origin-checked.
- `requireSession()` requires any signed-in account; `requireAdmin()` requires `role = "admin"`
  and a fresh session.
- Every admin page calls `requireAdminPage()` **in the page**, not only in the layout, because
  Next streams a page while the layout resolves. The layout check alone would leak page HTML.
- Every admin API route calls `requireAdminRead()` or `requireAdminMutation()`; there is no route
  that checks the role by hand.
- Admin mutations go through one guard: origin → CSRF → rate limit → role. A new route cannot
  quietly skip a control.
- Admin records are global Association content, so there is no per-row ownership. Donations and
  tickets are readable only by admins. Public profile fields follow the alumnus's privacy choice
  in `src/lib/api/privacy.ts`.
- Anonymous viewers never receive `alumni_only` fields.

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
- Uploads are not implemented; content references URLs only.
- Email bodies are plain text; user text is never used as HTML.

**Residual:** the CSP allows inline scripts (see section 6), so DOM XSS would not be blocked by
the policy alone. React escaping and URL validation are the primary defences.

---

## 6. Browser and transport protections

Set in `src/proxy.ts` (request-dependent) and `next.config.ts` (all responses):

- `Content-Security-Policy`: `default-src 'self'`; scripts and styles limited to the site with
  inline allowed; images `self/data/blob/https`; frames and objects disabled; `base-uri` self;
  `frame-ancestors 'none'`; `upgrade-insecure-requests` in production.
- `form-action` is `'self'` plus the payment gateway origins only (`ESEWA_GATEWAY_URL`,
  `KHALTI_BASE_URL` and the sandbox endpoints, all HTTPS). Checkout submits a real form to the
  provider, so a strict `'self'` blocks every live payment — this was a launch-blocking bug, found
  and fixed on 25 Oct 2026. A new gateway must add its origin in `next.config.ts` (see
  `TRACKER.md` C7).
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

- Per-IP fixed-window limits: registration 5/min, donation 10/min, RSVP 5/min, community post
  3/min, report 5/min, newsletter 5/min, support 5/min; admin reads 240/min and mutations 60/min.
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
4. **Database.** A dedicated Postgres role for the app with only the needed privileges; listen on
   loopback or a private network; TLS if the database is remote. No public port 5432.
5. **Firewall.** Allow 22 (restricted), 80 and 443 only. Keep the host patched.
6. **Least privilege.** Run the app as an unprivileged user; the systemd unit uses
   `NoNewPrivileges` and `PrivateTmp`.
7. **Backups.** Encrypted nightly dumps copied off the host; test restore. Backups contain
   personal data.
8. **Monitoring.** Probe `/api/health`; alert on 5xx, certificate expiry, disk and database
   connections.
9. **Email domain.** SPF, DKIM and DMARC on the sending domain; a verified Resend domain before
   the first campaign.
10. **Log retention.** Keep application logs long enough to investigate abuse (30–90 days) and
    restrict access. Do not log secrets, full cookies or payment payloads.

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
  server-side with the secret key.
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
  to the runtime. Recheck when drizzle-kit updates.
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
environment checks.

Before a release, also verify by hand:

1. `/admin` while signed out redirects and does not include data.
2. An admin mutation without `x-csrf-token` returns 403.
3. A mutation with `Origin: https://evil.example` returns 403.
4. A donor cannot call any `/api/v1/admin/*` route (403).
5. A stale admin session (or one older than the idle window) redirects to sign-in.
6. `/api/health` returns 503 when the database is stopped.

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
