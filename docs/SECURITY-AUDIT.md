# Security audit : 26 October 2026

**Scope:** the whole application in `C:\dev\bpkihs-alumni` : 60 API route handlers (29 of them
admin), 39 pages, 408 TypeScript files, the Postgres schema and its 5 migrations, the email and
payment integrations, the upload pipeline, the operational scripts, the container file and the
environment template.
**Method:** manual review of every route, service, auth module and schema, plus live probing of
the running application and its database (the local development instance), the existing test
suites, `npm audit`, and a search for secrets and dangerous sinks.
**Target:** OWASP ASVS 4.0.3 Level 2, the target already recorded in `docs/SECURITY.md`.
**Result:** **no critical or high-severity vulnerability was found**, and nothing in this pass
gives an attacker a way into the admin area, another member's records, or the payment ledger.
Ten weaknesses were confirmed and fixed : four medium, six low. They are listed below with the
evidence and the verification that each fix works.

---

## 1. What was checked

| Area | Specifically |
| --- | --- |
| Authentication | Better Auth configuration, sign-up, sign-in, email OTP, password reset, TOTP, session lifetime, cookie flags, role assignment |
| Authorisation | every `/api/v1/admin/*` handler, every admin page, ownership checks on profile and photo, directory visibility by role, newsletter preference changes |
| CSRF and origins | double-submit token, session-cookie detection, origin allowlist, gateway callbacks |
| Input and output | Zod schemas for every write, body size and content type, pagination clamps, SQL construction, CSV import and export, React escaping, JSON-LD serialisation, URL fields |
| Uploads | multipart streaming, declared MIME vs decoded format, `sharp` limits, path handling, access checks on delivery, deletion |
| Payments | eSewa HMAC (timing-safe), Khalti server lookup, amount equality, replay/idempotency, failed-vs-succeeded transitions, callback abuse |
| Email | header construction, recipient handling, logging, provider error redaction |
| Browser and transport | CSP, HSTS, `nosniff`, frame denial, referrer, permissions policy, COOP/CORP, `X-Powered-By`, `next/image` remote hosts |
| Abuse and availability | rate limits and `Retry-After`, limiter memory bounds, proxy-header trust, newsletter and OTP mailbombing |
| Secrets and dependencies | tracked environment files, key patterns, `npm audit --omit=dev`, dev-only advisories |

---

## 2. Findings fixed

### SEC-01 : Medium : Newsletter preferences could be changed for any address (broken access control)

**Where:** `src/server/services/community.ts` (`updateNewsletterPrefs`), `PATCH /api/v1/newsletter`

The endpoint trusted the submitted email address. Anyone could unsubscribe a member : or
subscribe a stranger who never asked : by knowing an address. There was no session, no token and
no confirmation.

**Evidence (before the fix):** from an unrelated client with no cookies, a `PATCH` naming an
address that had just been subscribed returned `200 {"ok":true}` and the row became
`unsubscribed`.

**Fix:** the address alone no longer authorises anything.
- A request carrying the subscriber's token (the value already stored for unsubscribe links)
  applies the change.
- A request without a token changes nothing; if the address is subscribed, it emails that inbox a
  one-click confirmation link, and the answer is identical for known and unknown addresses, so
  the endpoint cannot enumerate subscribers.
- An untokened opt-in is refused; joining goes through the subscribe form, which records
  interests and sends the welcome message.

**Verified:** the same request now returns `200` while the row stays `subscribed`; the token link
returns `303` and flips it to `unsubscribed`; presenting the token to `PATCH` with `optIn: true`
re-subscribes it.

### SEC-02 : Medium : Every unsubscribe link pointed at a route that did not exist

**Where:** newsletter campaign and digest mailers

`unsubscribeUrl()` built `/api/v1/newsletter/unsubscribe?token=…`, but no such route existed, so
every campaign and monthly digest carried a link that answered **404**. A newsletter that cannot
be left is both a compliance problem (consent) and a deliverability problem (spam complaints).

**Fix:** added the route. It reads the token, marks that subscriber `unsubscribed`, and redirects
to `/community/newsletter?unsubscribed=done` with `Cache-Control: no-store`. An unknown, reused or
missing token redirects to `…?unsubscribed=unknown` with the same shape, so the page never reveals
whether a token or address exists. The page renders the matching status banner.

**Verified:** `303` to `?unsubscribed=done` for a real token (database confirmed), `303` to
`?unsubscribed=unknown` for a bogus one, and the banner renders.

### SEC-03 : Medium : Email header injection through user-controlled names and titles

**Where:** `src/server/email/index.ts`

Subjects are built from stored values, including the tribute recipient's name (`A gift in memory
of …`), which a donor types. `z.string().trim()` does not remove `\r\n`, and a newline in a Subject
is header injection: an extra `Bcc:` or `Reply-To:` on a message the Association sends. The
provider usually rejects it, but the boundary we control was not enforcing it.

**Fix:** every header value (`from`, `to`, `subject`, `reply_to`) passes through
`sanitizeHeaderValue()`, which flattens control characters, collapses the whitespace left behind
and caps the length. Plain-text bodies are untouched, so a message may still legitimately contain
line breaks.

**Verified:** five unit tests in `src/server/email/headers.test.ts`, including
`"… Asha\r\nBcc: attacker@evil.example"`.

### SEC-04 : Medium : A successful callback could complete an amount the gateway never reported

**Where:** `src/server/payments/complete.ts`

The amount comparison was skipped when `verification.amountMinor` was `undefined`. A signed or
looked-up callback that omitted the amount would therefore confirm whatever amount the pending
donation recorded, and credit the goal with it.

**Fix:** a `succeeded` verification must now state an amount; a missing amount is refused, and a
mismatch is still refused. eSewa and Khalti both return the amount, so the legitimate path is
unchanged.

**Verified:** payment unit tests pass; the guard is a two-line branch on the existing comparison.

### SEC-05 : Low : The public Khalti callback could drive unbounded outbound requests

**Where:** `src/server/payments/khalti.ts`, `GET|POST /api/v1/payments/[gateway]/callback`

Verifying a Khalti callback means a server-to-server lookup. The route is public and accepted any
`pidx`, so a script could make the app hammer Khalti with arbitrary ids (and hold a worker for the
15-second timeout each time).

**Fix:** the `pidx` must look like a Khalti id (`[A-Za-z0-9_-]{8,64}`) before any request is made.
Malformed callbacks are rejected immediately.

**Residual:** there is deliberately no per-IP rate limit on this route : a 429 to a genuine
gateway callback would lose a real donation. Put a provider-IP allowlist at nginx if that worries
the operator (see §5).

### SEC-06 : Low : Route parameters were URL-decoded twice

**Where:** 20 handlers and pages, for example `src/app/api/v1/alumni/[id]/route.ts`

Next already delivers dynamic segment values percent-decoded. Calling `decodeURIComponent` again
turns a literal `%2F` into `/`, and a stray `%` throws a `URIError` that became a 500. The lookups
are by opaque id, so this was not exploitable, but it was incorrect and a source of avoidable 500s.

**Fix:** removed the second decode from every API handler and the community post page (genuine
decodes of cookie values and parsed URLs were kept).

**Verified:** `/api/v1/alumni/alumnus%2D051` still resolves `200`; a doubly-encoded literal returns
`404` rather than an error; directory, profile, photo and community browser tests pass.

### SEC-07 : Low : Recipient addresses were written to the logs on delivery failure

**Where:** `src/server/email/index.ts` (`sendEmailSafely`)

The failure log included `message.to`. Server logs are often shipped off the host and kept for
weeks, which turns a debugging line into a personal-data store.

**Fix:** the address is masked (`a***@domain`) before logging; the provider's own error text is
already redacted.

### SEC-08 : Low : The `next/image` allowlist could be pointed at internal hosts

**Where:** `next.config.ts`, `IMAGE_HOSTS`

The optimiser fetches allowlisted hosts **from the server**, so `localhost`, `169.254.169.254` or
`something.internal` in `IMAGE_HOSTS` would make the app a request forwarder. The old filter only
checked the characters, not the destination.

**Fix:** a new `isPublicImageHost()` refuses `localhost`, private suffixes (`.localhost`, `.local`,
`.internal`, `.home.arpa`), IPv4 literals, wildcards, ports, schemes and IPv6 literals. Used by
`next.config.ts`; covered by three unit tests.

**Note:** admin-supplied image URLs are still fetched by the **browser**, not the server, wherever
the component renders them with `unoptimized`; this closes the server-side path only, which is the
one that matters for SSRF.

### SEC-09 : Low : The development database was published to the local network

**Where:** `docker-compose.yml`

Postgres was mapped as `5433:5432`, so any machine on the same network could reach the development
database with its well-known credentials.

**Fix:** bound to loopback (`127.0.0.1:5433:5432`).

### SEC-10 : Low : Repeat newsletter subscribes re-sent the welcome email every time

**Where:** `src/server/services/community.ts` (`subscribeNewsletter`)

The public endpoint sent a welcome message on every submission, including for an address that was
already subscribed. That made it a mailbombing tool aimed at a known address.

**Fix:** the welcome message is sent only when the address is new or was previously unsubscribed.

---

## 3. Controls verified as sound

These were tested, not merely read, and need no change:

- **No privilege escalation through Better Auth.** Sign-up with `role: "admin"` is refused
  (`FIELD_NOT_ALLOWED`); `update-user` refuses `role`, `emailVerified` and `email`;
  `/admin/set-role` answers `403` to a donor; `get-session` still reports `role: "donor"` after
  every attempt. A signed-up account is a donor, and only `approveAlumnus()` promotes, inside the
  approval transaction, after the address is verified.
- **Admin API authorisation.** Anonymous `GET /api/v1/admin/overview` → `401`; donor → `403`;
  `GET /api/v1/admin/donations/export` anonymous → `401`. All 29 admin route files call
  `requireAdminRead()` or `requireAdminMutation()`; no handler checks the role by hand.
- **Admin pages.** Every dashboard page calls `requireAdminPage()` itself; the layout adds a second
  check. A donor or anonymous request receives a redirect payload with **no dashboard data or
  personal data** in the HTML (checked by string search).
- **CSRF and origin.** An admin `POST` without `x-csrf-token` → `403`; with
  `Origin: https://evil.example` → `403`. The session-cookie matcher covers both the plain and
  `__Secure-` cookie names.
- **Open redirect.** `/sign-in?next=https://evil.example/phish` and `?next=//evil.example` redirect
  to `/account`; only a same-site path is honoured (`safeReturnPath`).
- **Injection.** Every write parses a Zod schema; every query is parameterised Drizzle. A search
  for `' OR 1=1--` returns `200` with no error and no extra rows; the same text is escaped in the
  JSON response.
- **Output encoding.** The only `dangerouslySetInnerHTML` is the JSON-LD script, and its payload
  escapes every `<`. Post bodies, support messages and profile notes are rendered as text.
- **Request bounds.** `text/plain` → `415`; a 200 KB JSON body → `413`; pagination is clamped in
  `resolvePaging()`; the CSV import is capped at 1,000 rows and 1 MB.
- **Rate limiting.** Eight rapid contact submissions produced `201 201 201 429 429 429 429 429`
  with `Retry-After`; sign-in, sign-up and OTP have provider-level limits on top.
- **Uploads.** Session + origin + CSRF + 6/min before the body is read; the multipart stream is
  cancelled as soon as it crosses the ceiling; `sharp` decodes the bytes, refuses anything that is
  not a real JPEG/PNG/WebP, caps pixels and dimensions, applies orientation, strips metadata and
  re-encodes to WebP; stored names are UUIDs mapped by a strict regex; delivery re-checks approval,
  privacy, ownership and admin status on every request. Browser tests cover a real upload, a fake
  image and deletion.
- **Payments.** eSewa's signature is recomputed with the merchant secret and compared in constant
  time, including the product code; Khalti is verified by a server-side lookup with the secret key;
  the reported amount must match; completion is idempotent on `(gateway, external_id)`; a failed
  callback can never overwrite a success; no simulator exists; production refuses to start without
  a gateway.
- **Sessions.** `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS, 24-hour absolute lifetime, 30-minute
  admin idle window, and demoting a member deletes their live sessions.
- **Browser and transport headers.** CSP with `default-src 'self'`, `object-src 'none'`,
  `base-uri 'self'`, `frame-ancestors 'none'`, `form-action` limited to our origin plus the
  configured gateway origins; HSTS in production; `nosniff`; `DENY`; referrer policy; COOP/CORP;
  `X-Powered-By` disabled.
- **Secrets and dependencies.** No `.env` file is tracked, no key pattern was found in the source,
  and `npm audit --omit=dev` reports only the known **dev-only** `drizzle-kit → esbuild` advisory,
  whose tool never ships to the runtime.
- **Scripts.** The backup uses `umask 077`, writes `600` files, verifies the gzip before rotating
  and never prints the connection string; the health check probes the real readiness endpoint and
  alerts; admin bootstrap reads credentials from the environment, never argv.

---

## 4. What is still open

None of these is a hole an attacker can walk through today; they are hardening items and product
decisions, in the order I would do them.

1. **Bot protection on the public forms : closed 26 October.** Rate limiting was the only defence
   on registration, RSVP, contact and newsletter. Those four writes now require a Cloudflare
   Turnstile token, verified server-side; see §7 below for the design and the residual caveats.
2. **Double opt-in for the newsletter : closed 27 October.** An address now never joins the list
   on a form submission. `POST /api/v1/newsletter` stores it as `pending` and emails a confirmation
   link; the row becomes `subscribed` only when that link's page is submitted with its token
   (`POST /api/v1/newsletter/confirm`). The link opens a page with a button instead of confirming
   on GET, so an email client or scanner that pre-fetches links cannot subscribe anyone, and only
   `subscribed` rows are selected for campaigns and the digest. Confirmation links older than an
   unsubscribe do not revive the row, and a repeat submission within 15 minutes sends no second
   email, which keeps the public form from being used to flood an inbox. If the provider refuses
   the message the API answers `confirmationEmailSent: false` and the form says so instead of
   "check your inbox"; the send timestamp is only recorded on success, so a retry goes out
   immediately.
3. **Provider-IP allowlist for the payment callbacks** at nginx. The route is intentionally
   unthrottled so a real callback is never dropped; restricting it to eSewa/Khalti addresses is the
   right place for that control.
4. **Enrol every administrator in TOTP before launch.** It is available at `/admin/security` and
   tested, but still optional.
5. **Rate-limit storage.** The limiter is a bounded in-process map, correct for the documented
   single Node process. A second instance needs Redis (or an edge limiter) or the effective limit
   doubles.
6. **`TRUST_PROXY`.** It defaults to `true` in production, which is right behind nginx and wrong if
   Node port 3000 is ever exposed. Keep the port closed, or set `TRUST_PROXY=false`.
7. **CSP and the welcome video.** The policy sets `frame-src 'none'`, so a YouTube/Vimeo welcome
   message renders as a link rather than an embedded player. This is a feature bug, not a
   vulnerability; allowing exactly `https://www.youtube-nocookie.com` and `https://player.vimeo.com`
   would enable it. Left unchanged here because loosening the policy is a product decision.
8. **Small privacy items.** The public profile payload still carries the internal `source` and
   `placeholder` flags (harmless metadata), and registration answers differently for an address that
   already has an account (rate-limited, but it is an enumeration oracle). Neither exposes personal
   data.

---

## 5. Verification after the fixes

| Check | Result |
| --- | --- |
| `npm run format:check` | clean |
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm test` | **66 files, 386 tests passed** (8 new) |
| `npm run build` | production build succeeded |
| `npm run test:e2e` | **267 passed, 0 failed, 70 skipped** across desktop, mobile, Firefox and WebKit |
| Live probes | unsubscribe 303 both ways; untokened preference change no longer mutates; CSRF/origin 403; role escalation blocked; 413/415/429 observed; encoded ids still resolve |

**Changed by this pass**

- `src/app/api/v1/newsletter/unsubscribe/route.ts` : new one-click endpoint (SEC-02)
- `src/server/services/community.ts` : token-based preferences, one welcome email (SEC-01, SEC-10)
- `src/lib/api/schemas.ts` : optional `token` on newsletter preferences
- `src/server/newsletter-links.ts` : one builder for the unsubscribe URL
- `src/server/email/index.ts`, `src/server/email/headers.test.ts` : header sanitisation and log
  masking (SEC-03, SEC-07)
- `src/server/payments/complete.ts`, `src/server/payments/khalti.ts` : amount required, `pidx`
  validation (SEC-04, SEC-05)
- `next.config.ts`, `src/lib/images/host.ts`, `src/lib/images/host.test.ts` : image-host allowlist
  (SEC-08)
- `docker-compose.yml` : loopback database (SEC-09)
- 20 route and page files : single URL decode (SEC-06)
- `src/content/email.ts`, `src/content/community.ts`, `src/app/community/newsletter/page.tsx` :
  confirmation flow copy and status banner

---

## 6. How to re-run the audit checks

```bash
npm audit --omit=dev
npm run typecheck && npm run lint && npm test
npm run build
npm run test:e2e

# The manual checks from docs/SECURITY.md §12 still apply, plus:
curl -i "http://localhost:3000/api/v1/newsletter/unsubscribe?token=bad"   # 303 → ?unsubscribed=unknown
curl -i -X PATCH -H 'Content-Type: application/json' -H 'Origin: http://localhost:3000' \
  -d '{"email":"someone@example.com","optIn":false}' \
  http://localhost:3000/api/v1/newsletter                                   # 200, and nothing changed
```

The security model and the server-hardening checklist remain in `docs/SECURITY.md`; this document
records what the deliberate review of 26 October 2026 found and changed.

---

## 8. Database isolation status (28 October 2026)

**RLS is not enabled.** The schema snapshots record `isRLSEnabled: false` for application
 tables, and there are no policies in the SQL migrations. The runtime imports one Postgres pool
from `src/server/db/client.ts` and uses it for public, member, payment and admin services. The
project's local compose credentials also create the application user as the initial database
owner; the live database role's flags were not independently verified because Docker is not
running in this workspace and no production database is accessible here.

Adding `ENABLE ROW LEVEL SECURITY` now would not establish member isolation: a table owner may
bypass policies unless forced, a superuser or `BYPASSRLS` role always bypasses them, and a
caller-controlled `SET app.user_id` is not trustworthy. Forcing policies without transaction-local
identity on every query would break legitimate flows or fail closed unpredictably. The security
boundary currently is the server authorization, ownership and visibility checks in this audit's
section 2 and `docs/SECURITY.md` section 3; those are not database RLS.

**Safe implementation prerequisites:**

1. Create a dedicated non-owner runtime role without `SUPERUSER` or `BYPASSRLS`; retain a separate
   owner/migration role. Do not reuse the local compose owner for app runtime.
2. Establish a server-only transaction wrapper that obtains a verified session identity, uses
   `SET LOCAL` inside that same transaction, and requires all protected queries to use the
   transaction-bound Drizzle client. Never accept identity settings from headers/body/query.
3. Model each table's policies separately (public approved reads, own profile/data, shared admin
   work, system/provider jobs), and deny on absent context. Public and webhook operations need
   deliberately narrow server-owned policies, not a general anonymous escape hatch.
4. Add integration tests against the same pool and role used by the app: no-context denial,
   cross-member denial, own-row access, admin path, provider callback, background job, plus role
   checks proving `BYPASSRLS` is false. Only enable policies after these tests cover all service
   paths and migrations can roll them back safely.

The step-by-step runbook for those four items : the role DDL, the verification queries, the
per-table policy shapes and the pre-enable test list : is in
[`DB-AND-PAYMENTS.md` §1.12](./DB-AND-PAYMENTS.md#112-row-level-security--a-launch-prerequisite-not-yet-enabled).

No RLS migration was added because those runtime prerequisites are not present. Until implemented,
keep the production connection secret and network-restricted, use a least-privilege runtime role,
and continue enforcing authorization in server routes/services. This is an explicit open security
item, not a claim that the system is fully protected.

**Re-verified 28 October 2026.** `drizzle/meta/0007_snapshot.json` still records
`isRLSEnabled: false` with empty `policies` for every table, and a search across `src/` and
`drizzle/` finds no `CREATE POLICY`, `ENABLE ROW LEVEL SECURITY` or `current_setting()` call. The
local database could not be probed for role flags: Docker is not running in this workspace, so
`rolsuper`/`rolbypassrls` for the live runtime role remain unconfirmed. The finding above is
therefore still open and must be closed before launch, not after.

---

## 7. Bot protection on the public forms (second pass, 26 October)

**Problem.** `POST /api/v1/registrations`, `POST /api/v1/events/:slug/rsvp`,
`POST /api/v1/contact` and `POST|PATCH /api/v1/newsletter` accepted unauthenticated JSON from any
client. Per-IP limits (5–10/min) stop a naive loop from one address but nothing stops a distributed
script, a headless browser or a slow trickle that stays under the window : and every accepted
registration sends an email.

**Design.** Cloudflare Turnstile, because it verifies server-side, needs no cookie consent banner,
and does not collect behavioural data the way reCAPTCHA does.

| Layer | Behaviour |
| --- | --- |
| `src/components/shared/bot-check.tsx` | Renders the widget lazily (script + iframe only when a form is on screen), hands the token to the form through `onToken`, and takes a `resetKey` prop to request a fresh one. Catches script-load failure and shows a retry message instead of a dead submit button. |
| Forms | `BotCheck` sits above the submit button and stores the token in state. On failure the form clears it and bumps `resetKey`, because a Turnstile token is single-use. |
| `src/server/bot/turnstile.ts` | Posts `secret` and `response` to `siteverify` with a 5 s timeout (`AbortSignal.timeout`); accepts only `{success: true}`; fails **closed** on timeout, network error or unparseable body. |
| `src/lib/api/contract.ts`, `src/lib/api/http/index.ts` | The four methods take `options?: RequestOptions` and send the token in the `x-bot-token` header, so the form schemas and their tests stay unchanged; the server adapter keeps the same signature. |
| Route handlers | Call `assertHuman(request)` after schema validation and after the rate limiter. A rejected token is `422` (`validation`) and a Cloudflare timeout or outage is `503` (`unavailable`), both with copy from `src/content/bot.ts` so a form can show the message inline. |
| `src/server/env.ts` | `TURNSTILE_SECRET_KEY` is required when `NODE_ENV=production`; `productionEnvProblems` reports it with the other launch blockers. |
| `next.config.ts` | CSP gains exactly `https://challenges.cloudflare.com` for `script-src`, `connect-src` and `frame-src`. Nothing else in the policy changes. |

**Why a missing secret is allowed in development.** The browser suite and a fresh clone have no
Cloudflare account. Outside production a missing secret makes `assertHuman` a no-op, so
`npm run test:e2e` keeps working offline. In production the same absence is a `500` on every public write, and the boot
check refuses to start : so it cannot ship silently unprotected. Cloudflare's published always-pass
test keys exercise the real code path locally without weakening anything.

**What this does not cover.**

- `POST /api/v1/donations` is not gated: the gateway redirect is the real control and Turnstile
  tokens expire in 300 s, which is shorter than a checkout. Abuse there costs a created pending
  order, not an email.
- The login form is covered by the auth library's own limiter, not by Turnstile, so a stolen
  password still works. TOTP at `/admin/security` remains the control for that.
- Turnstile is a network dependency on the write path. If Cloudflare is unreachable the forms fail
  closed by design; the 5 s timeout bounds the wait.

**Verification.** `npm test` : 66 files, 386 tests (8 new: accepted token, rejected token, a
Cloudflare timeout that fails closed, a missing secret allowed in development but refused in
production, and a malformed reply). `npm run test:e2e` : 267 passed, 0 failed, 70 skipped across
desktop, mobile, Firefox and WebKit with no keys set, confirming the development bypass leaves
every form flow untouched.

The keyed path was then proven against a real widget rather than assumed. A copy of the app was
run with Cloudflare's published always-pass test keys (`NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x…AA`,
`TURNSTILE_SECRET_KEY=1x…AA`) and probed:

| Probe | Result |
| --- | --- |
| `POST /api/v1/newsletter` with no `x-bot-token`, correct origin | **422** `validation` : “Complete the human check and try again.” |
| Same request with a token while the secret was unset | 201 : the development bypass |
| `/support` in a real browser | the widget script loaded from `challenges.cloudflare.com` and the hidden `cf-turnstile-response` input was filled |
| The anonymous contact form filled and submitted in that browser | **201** : ticket `cb886ad3-1e00-46b2-8934-846e411c4f7c` created, i.e. the browser token passed `siteverify` |
| `POST /api/v1/newsletter` with `Origin` on another port | **403** : the pre-existing same-origin check, unchanged by this work |

The live `siteverify` endpoint was also called directly with a deliberately invalid token, which
returned `invalid-input-response` : the failure branch `assertHuman` reads.

---

## 9. Security re-audit : 30 October 2026

**Scope:** the current working tree : 61 API route handlers (29 under `/api/v1/admin`), 41 pages
(13 under `/admin`), 432 TypeScript files, 72 unit-test files, the Postgres schema and migrations,
the payment adapters (including the new ConnectIPS integration), the upload pipeline, the
operational scripts, the container file and the environment template.
**Method:** line-by-line review of every auth, guard, input, upload, payment and export path; a
static scan for secrets, dangerous sinks and raw SQL; dependency and unused-package audit; and
live probes against a local production build and dev server.
**Result:** **no critical or high-severity issue was found.** One latent secret-handling gap was
fixed (SEC-11, Low). Dependencies were refreshed within their declared ranges. Every control
below was re-verified from the code and, where the database was available, from a running server.
This is a code and configuration review plus targeted probes, not a penetration test.

### 9.1 The checklist, and what the evidence shows

| Area | Result | Evidence |
| --- | --- | --- |
| API keys hidden | Pass | `.env*` is ignored; only `.env.example` is tracked; no server secret is referenced through `NEXT_PUBLIC_*`; no log statement prints a password, token, cookie or secret. |
| Environment variables | Pass | `productionEnvProblems()` refuses to boot on a missing/weak `BETTER_AUTH_SECRET`, a non-HTTPS `APP_URL`, a half-configured gateway, a missing Turnstile key, a non-Resend transport or a `.local` sender. |
| Admin routes protected | Pass | All 12 dashboard pages call `requireAdminPage()` in the page itself; all 29 admin API routes call `requireAdminRead()`/`requireAdminMutation()`; `/admin/sign-in` is the only unguarded admin page and holds no data. |
| Authentication | Pass | Better Auth email/password (scrypt), 8–128 characters, 24-hour absolute session, 30-minute admin idle window, hashed email OTP, TOTP (now enforced for administrators in production : §9.7), `HttpOnly`/`SameSite=Lax`/`Secure`-on-HTTPS cookies, trusted-origin allowlist. |
| User access | Pass | Profile edits select by `session.user.id`; the photo route re-checks approval, privacy, ownership and admin status; roles and approval columns are never accepted from a body, query or header; a rejected profile edit cannot set `approved`. |
| Form sanitisation | Pass | Every JSON write parses a Zod schema at the route boundary; unknown fields are stripped; pagination is clamped; the CSV import is capped at 1,000 rows / 1 MB. |
| XSS | Pass | React escapes rendered data; the only `dangerouslySetInnerHTML` is JSON-LD, whose serialiser replaces every `<` with `\u003c`; no server actions and no `innerHTML`/`eval`/`new Function`. |
| Rate limiting | Pass | Every public form write and both admin guards call `limit()`; payment callbacks are exempt by design (§9.5). Live contact probe: `422 422 422 422 422 429 Retry-After: 60`; the bucket map is bounded and swept. |
| API endpoints | Pass | Origin → CSRF → rate limit → role for admin writes; same-origin + schema + size for public writes; `no-store` and a request id on every API response; generic 500 text. |
| CORS | Pass | No `Access-Control-Allow-Origin` is emitted by application routes; cross-origin reads stay blocked by the browser. Better Auth validates `Origin` against `trustedOrigins`. |
| Security headers | Pass | Live response carries CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP and CORP; HSTS is added in production; `X-Powered-By` is absent. |
| Debug mode / leakage | Pass | Production boot requires a complete config; unknown errors are logged server-side and answered generically with a request id; `/api/health` returns only `ok`/`up` or `unavailable`/`down`. |
| Dependencies | Pass, with accepted dev-only advisories | Eight in-range updates applied (§9.3); `npm audit --omit=dev` reports only the `drizzle-kit → esbuild` advisory, whose tool never ships. |
| Unused packages | Pass | A source-wide reference scan found no unused runtime or dev dependency; apparent hits were ambient types, Next peer deps and config-only tools (`jsdom`, `prettier`, `husky`, `lint-staged`). |
| Exposed files | Pass | `public/` contains only images; no source map, `.env`, SQL dump, key or backup is under it; `.uploads/` and `secrets/` are outside the web root and ignored. |
| Database | Pass for the current design; RLS still open | Every query is parameterised Drizzle or a fixed expression; the dev container is loopback-only; the runtime/owner role separation and RLS prerequisite remain the documented open item (§8). |
| Password hashing | Pass | Better Auth's `hashPassword` (scrypt) is the only hasher, including the admin bootstrap; password reset and signed-in password change both set `revokeOtherSessions`. |
| Git secrets | Pass | `git ls-files` contains only `.env.example`; a full-history pattern scan found only the local compose password (`bpkihs_dev` on loopback), never a provider key or PEM. |

### 9.2 Finding fixed

#### SEC-11 : Low (latent secret exposure) : The documented signing-key path was not ignored

**Where:** `.gitignore`, against the setup instructions in `.env.example` and `HANDOVER.md`.

**What:** the ConnectIPS runbook tells the operator to convert NCHL's `CREDITOR.pfx` with
`openssl … -out secrets/connectips.key`. The ignore file covered `*.pem` but not `secrets/`,
`*.key`, `*.pfx`, `*.p12` or `*.jks`. After following the documented setup, a single `git add .`
would have staged the private signing key. No key is tracked today (`git ls-files` confirms), so
this is a latent process gap rather than an active exposure.

**Fix:** ignore the `secrets/` directory and the private-key/certificate-bundle extensions.

**Verified:** `git check-ignore -v secrets/connectips.key`, `creditor.pfx` and
`secrets/nchl.p12` all resolve to the new rules.

**Note:** the same section already requires `chmod 600` on the key, and
`CONNECTIPS_PRIVATE_KEY_PATH` is read outside the web root by the server only.

### 9.3 Dependencies refreshed

| Package | Before | After |
| --- | --- | --- |
| `better-auth` | 1.7.12 | 1.7.14 |
| `lucide-react` | 1.55.0 | 1.65.0 |
| `zod` | 4.6.6 | 4.6.7 |
| `vitest` | 5.0.3 | 5.0.5 |
| `@playwright/test` | 1.64.0 | 1.64.1 |
| `dotenv` | 18.0.8 | 18.0.9 |
| `jsdom` | 30.1.2 | 30.1.3 |
| `shadcn` (CLI, dev) | 4.22.1 | 4.23.0 |

Deliberately **not** moved: `react`/`react-dom` are exact-pinned to the Next-compatible 19.3.0;
`eslint` 10, `typescript` 7 and `postgres` 4 are major upgrades that need their own migration
and test pass. `npm audit fix --force` was not used: for both remaining advisories it would
downgrade `drizzle-kit`/`shadcn` to older, breaking releases.

**Remaining advisories (all dev-only):** `drizzle-kit → @esbuild-kit/* → esbuild ≤ 0.24.2`
(moderate; development-server request forwarding) and `shadcn → @shadcn/registry → deepmerge`
(low; prototype pollution in the CLI's merge helper). Neither package is imported by
application code or included in a `npm ci --omit=dev` production install.

### 9.4 Live verification

Run against `next dev` on `http://localhost:3000` with the local Postgres container healthy:

| Probe | Result |
| --- | --- |
| `GET /` headers | CSP, `nosniff`, `DENY`, referrer, permissions, COOP, CORP present; no `X-Powered-By` |
| `GET /admin` signed out | `200` streaming redirect payload containing `NEXT_REDIRECT` and `/admin/sign-in`; **zero** dashboard strings or personal data |
| `GET /api/v1/admin/overview` | `401 {"error":{"code":"unauthorized"}}` with a request id |
| `POST /api/v1/contact` with `Origin: https://evil.example` | `403` : “That request came from another site.” |
| `POST /api/v1/contact` ×7, same origin | `422 422 422 422 422 429 429`, `Retry-After: 60` then `59` |
| `POST` with `Content-Type: text/plain` | `415` |
| `POST` with a 200 KB body | `413` |
| `GET /api/v1/faq` with a foreign `Origin` | no `Access-Control-Allow-*` header |
| `GET /api/health` | `200 {"status":"ok","database":"up"}` |
| CSRF cookie | `Path=/; Max-Age=720; SameSite=lax`, deliberately not `HttpOnly` (the client must echo it) |

**Completed later the same day (see §9.7):** the production probe signed a throwaway
administrator in through Better Auth and observed `better-auth.session_token` as
`HttpOnly; SameSite=Lax; Max-Age=86400; Path=/` over HTTP (no `Secure`, which is correct for a
loopback HTTP origin; `usesHttps()` adds it when `APP_URL` is HTTPS). The earlier attempt had
been blocked by Docker Desktop shutting down between the build and the probe, so sign-up
answered `500` with `ECONNREFUSED` rather than reaching Better Auth; that was an environment
failure, not an auth failure. The CSRF/origin acceptance and rejection paths remain covered by
the unit suite.

The first production build failed during static generation because the database was not running
(`ECONNREFUSED ::1:5433`); after `docker compose up -d db` it completed with exit 0. That is an
environment dependency, not a code failure.

### 9.5 Residual risks (unchanged, with the reason)

1. **TOTP for administrators : closed 30 October 2026.** Production now confines an unenrolled
   administrator to `/admin/security` and answers 403 from `/api/v1/admin/*`; see §9.7. The
   break-glass remains `ADMIN_RESET_2FA=true npm run db:admin` on the host.
2. **Payment callbacks are deliberately unthrottled** (see SEC-05). A `429` to a genuine gateway
   callback would lose a donation. Restrict the callback paths to provider IP ranges at the proxy.
3. **RLS is not enabled** (see §8). The runtime uses one pooled identity; authorisation is enforced
   in the server, not the database.
4. **The CSP allows inline scripts** because the site is prerendered/PPR. React escaping and URL
   validation are the primary XSS defences. A nonce policy needs dynamic rendering.
5. **The rate limiter is per process.** One Node process is the documented deployment; a second
   instance needs a shared store or the effective limit doubles.
6. **`TRUST_PROXY` defaults to true in production.** That is correct behind nginx and unsafe if
   port 3000 is directly exposed. Keep the port closed or set `TRUST_PROXY=false`.
7. **Registration can enumerate an existing account** through a different response. It is
   rate-limited and exposes no personal data, but it is still an oracle.
8. **Next warns that the dynamic photo path traces the whole project.** The path is deliberately
   runtime-configurable (`PHOTO_UPLOAD_DIR`), so tracing is not meaningful. Use a release directory
   that does not contain `.env.local` or `secrets/`, and do not ship the development tree.

### 9.6 Checks run

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass (3 errors from the admin redesign fixed: import order ×2, `setState` in an effect) |
| `npm test` | **73 files, 428 tests passed** (2 stale profile-view assertions updated; 4 new tests for the TOTP rule added in §9.7) |
| `npm run build` | pass with the database running |
| `npm run format:check` | app and e2e files clean; 15 pre-existing `prompts/*.md` files still unformatted (docs only, not application code) |
| `npm audit --omit=dev` | 4 moderate, all in the dev-only `drizzle-kit` chain |
| `npm audit` | 7 (3 low `deepmerge`, 4 moderate `esbuild`), all dev-only |
| Git history secret scan | no live credential, private key or provider token |
| `git check-ignore` | the three signing-key paths are ignored |

**Changed by this pass:** `.gitignore` (SEC-11), `src/app/admin/(dashboard)/page.tsx`,
`src/app/admin/(dashboard)/layout.tsx`, `src/app/admin/(dashboard)/security/page.tsx`,
`src/features/admin/admin-menu.tsx`, `src/features/admin/admin-nav.tsx`,
`src/features/directory/profile-view.test.tsx`, `e2e/admin.spec.ts`, `src/app/donate/page.tsx`
(formatting only), `package-lock.json` (dependency refresh), and `docs/SECURITY-AUDIT.md` /
`PROJECT_STATE.md` (this record).

### 9.7 Administrator TOTP enforced : 30 October 2026

Production now requires an authenticator app for every administrator. This closes the open item
recorded as §9.5(1) of the re-audit above.

| Layer | Behaviour |
| --- | --- |
| Rule | `src/lib/auth/two-factor.ts` : `NODE_ENV=production` **and** `role=admin` **and** `twoFactorEnabled !== true`. Pure, with a unit test so the guards cannot drift. |
| API | `requireAdmin()` throws `403 forbidden` with the enrolment instruction; all 29 `/api/v1/admin/*` routes go through it. |
| Pages | `requireAdminPage()` redirects to `/admin/security`; the security page passes `allowEnrolment: true`, otherwise it would redirect to itself. |
| Shell | The admin layout checks the same rule before reading counts. For an unenrolled production admin it renders only a brand header and the security page, with no navigation, queues or counts. `src/proxy.ts` forwards the pathname in an overwritten `x-pathname` request header so that one route stays reachable. |
| Better Auth admin endpoints | `src/proxy.ts` answers `404` to `/api/auth/admin/*` in production. Those plugin endpoints (set-role, ban, create-user) are not used by the app : roles change through `approveAlumnus()`, `rejectAlumnus()` and the CLI : and would otherwise be a direct route around the dashboard gate. |
| Break-glass | `ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_RESET_2FA=true npm run db:admin` on the host clears that account's authenticator and resets its password; enrol again immediately. This needs shell access, so it is not a support workflow. |
| Development | Exempt. A seeded admin without TOTP keeps working locally and in the browser suite; enforcement is production-only by design. |

**Verified against a production build on a local server:**

- **Unenrolled admin.** `/admin` streamed a redirect to `/admin/security`, the body contained no
dashboard or navigation strings, and `/api/v1/admin/overview` answered `403` with the enrolment
instruction. `/admin/security` still rendered the form.
- **After enrolment.** A live TOTP code generated from the returned secret completed
`/two-factor/verify-totp`; the dashboard and admin API opened **even while the session cookie
still cached `twoFactorEnabled: false`**, because the guards read the live column
(`src/server/auth/two-factor-status.ts`). Without that read, the 5-minute cookie cache would
keep a just-enrolled administrator locked out.
- **After disabling.** From a fresh challenge session, `/two-factor/disable` succeeded; the very
next `/admin` request redirected back to `/admin/security` and the admin API returned `403`.
- **Admin plugin bypass.** `GET /api/auth/admin/list-users` answered `404` in the production
server, so the Better Auth admin endpoints cannot be used while enrolment is pending.
- `npm run typecheck`, `npm run lint` and `npm test` (73 files, 428 tests) pass; `npm run build`
  passes. The throwaway administrator was removed from the development database afterwards.
- The CLI break-glass (`ADMIN_RESET_2FA=true npm run db:admin`) is unchanged; this pass exercised
the API-disable path instead of re-running the reset script.

**Files added/changed for this item:** `src/lib/auth/two-factor.ts` (new, pure rule),
`src/lib/auth/two-factor.test.ts` (new), `src/server/auth/two-factor-status.ts` (new, live
lookup), `src/server/auth/session.ts`, `src/server/auth/admin-page.ts`,
`src/app/admin/(dashboard)/layout.tsx`, `src/app/admin/(dashboard)/security/page.tsx`,
`src/proxy.ts` (pathname header), `src/content/admin.ts`, and the security/HOWTO/HANDOVER docs.
