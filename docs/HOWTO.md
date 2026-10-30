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
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | optional; use Cloudflare's always-pass test key `1x00000000000000000000AA` to see the widget |
| `TURNSTILE_SECRET_KEY` | optional locally; `1x0000000000000000000000000000000AA` passes every token |

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

There is no default account. Use an email you control and a password of at least 8 characters:

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

`npm run dev` always binds port 3000 (`next dev -p 3000`), even though this machine exports
`PORT=0` in some shells, so the printed address matches `APP_URL` : which is also the origin
Better Auth validates on every request. If 3000 is already taken, stop the other server rather
than moving ports. The browser suite pins the same port, so `npx playwright test` needs no prefix.

Before Next starts, the script checks that port and that the database in `DATABASE_URL` answers.
A busy port stops the start; an unreachable database is only a warning (`npm run db:up` fixes
it), so the site can come up while Postgres is still booting. Start `npm run db:up` first if you
want the first page to load real data.

The database is empty by design. Public pages show empty states until you add content through
`/admin/content`.

---

## 3. The admin dashboard

| Screen        | Path               | What you do there                                            |
| ------------- | ------------------ | ------------------------------------------------------------ |
| Overview      | `/admin`           | Queue counts and headline numbers                            |
| Registrations | `/admin/alumni`    | Approve or reject alumni registrations; search and filter     |
| Posts         | `/admin/posts`     | Publish or reject community submissions; write staff news and announcements |
| Reports       | `/admin/reports`   | Review or dismiss reports on published posts                 |
| Support       | `/admin/tickets`   | Read helpdesk messages and contact-form enquiries, change ticket status |
| Donations     | `/admin/donations` | Donation ledger with amount, method, goal, tribute and status |
| Payments      | `/admin/payments`  | Which gateways are configured and offered, and the last ConnectIPS acceptance run |
| Content       | `/admin/content`   | Events, giving goals, funds breakdown, board, FAQ and welcome message |
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

The Association can also import the written register (section 3.7). If someone registers with the
address of an imported record, their registration claims that record instead of creating a
second profile.

### 3.2 Moderating posts and reports

Community submissions are `pending` until published. Open `/admin/posts`, read the full post,
then **Publish** or **Reject** with a reason. A published post appears in the community feed.

Readers can report a published post. Reports appear under `/admin/reports`; mark one reviewed or
dismiss it. Reports do not remove a post automatically : unpublish or remove the post separately
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
URL and photo URL. Saving replaces the single welcome message. It hides itself on the home page
while the text is empty.

**Funds breakdown.** The categories the transparency page shows under “How the funds are
allocated”: category, share of the funds (%), an optional period label and sort order. Shares
must add up to at most 100%; a gap is shown as an unallocated line until it is filled. Enter all
the rows and end on 100% before launch, otherwise `/donate/transparency` shows the remainder as
unallocated.

Every save and delete is written to the audit log. Deletions ask for confirmation and cannot be
undone; export a backup before a large content change.

### 3.5 Newsletter

`/admin/newsletter` shows the subscriber list and recent campaigns. Subscribing is double
opt-in: a visitor's address is stored as **Awaiting confirmation** and receives one email with a
link to `/community/newsletter/confirm`; it is only mailed a campaign or digest after that
button is pressed. The status filter at the top of the list shows these pending rows.

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

**Monthly digest.** `npm run newsletter:digest` builds a digest from the three newest posts, the
next three events and the active giving goals, and sends it to every subscribed address with each
person's own unsubscribe link. Preview it with `npm run newsletter:digest -- --dry-run`. Install
it from cron on the first of the month, for example:

```
5 7 1 * *  cd /srv/bpkihs-alumni && npm run newsletter:digest >> /var/log/bpkihs-newsletter.log 2>&1
```

A run that finds this month's subject already sent is skipped, so a repeated entry cannot mail
the list twice. The result also appears in `/admin/newsletter` as an ordinary campaign.

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

### 3.7 Importing the written register

Open **Registrations → Import the written register** (`/admin/alumni/import`). The importer does
not require the Association's column layout: any header names are matched to the known fields.

1. Export the register as CSV and upload it. The limit is 1 MB or 1,000 rows per file; split a
   larger register into several files.
2. Check the guesses. Required: full name, email, programme, batch year and country. Optional:
   phone, city, current position, organisation, further studies and note. Change any select that
   is wrong.
3. **Preview rows** validates every row on the server and shows `ready`, `already on file`
   (duplicate) and `needs attention` (invalid). Nothing is written yet.
4. Choose who can see the rows: **Hold them for review** (the default) or **Publish them in the
   directory now**. Hold means the profiles are created as pending registrations : invisible in
   the directory until an administrator approves them or the person registers and claims the
   record. Publish is only right when the Association already has consent for everyone in the
   file.
5. **Import N profiles** writes only the ready rows.

Programmes accept the canonical enum plus common spellings: `B.Sc. Nursing`, `MD`, `MS`,
`M.Ch`, `Ph.D`, `MDS`, and so on. Batch years before 1990 or after next year are rejected.

What the import does:

- with **Hold**, each row becomes a pending `csv_import` profile with no account and
  email/phone hidden; it appears in the registration queue, is never listed publicly, and can be
  claimed by registering with that address. With **Publish**, the same rows are approved and
  listed immediately;
- an email that already has a profile, that appears earlier in the same file, or that belongs to
  a donor account without an alumni profile, is skipped and reported : nothing is overwritten;
- importing expires the cached directory, so new profiles appear as soon as they are approved;
- the audit log records one `import` entry with the filename, the counts and whether the rows
  were published.

The import is additive. To fix a typo in an imported row, ask the member to edit it after
claiming, or correct it directly in the database; a second upload of the same address is skipped
by design.

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

For the full operator guide : the payment flow, reconciling money, refunds and payment
troubleshooting : see [`DB-AND-PAYMENTS.md`](./DB-AND-PAYMENTS.md).

### Sandbox

Set `PAYMENT_MODE=sandbox` and use the sandbox credentials from the gateway.

eSewa sandbox merchant: `EPAYTEST`, secret `8gBm/:&EnhH.1/q`. Donate on `/donate/checkout` and
sign in with sandbox customer `9806800001` (or `...0002`–`...0005`), password `Nepal@123`, token
`123456`.

ConnectIPS has no public sandbox: once NCHL supplies the UAT merchant id, app id, password, base
URL and signing certificate, set the variables from `HANDOVER.md` §2 and the gateway appears at
checkout. Convert `CREDITOR.pfx` to PEM first (command in §2); the adapter is already built.
Check the credentials with the repeatable UAT script before a browser payment:

```bash
npm run connectips:accept                # signs, posts to NCHL, calls validation
npm run connectips:accept -- --dry-run   # signs locally; no network request
```

A pass proves NCHL accepted the merchant values and the signing token. It cannot enter the OTP,
so one sandbox donation in the browser is still required.

### Going live

1. Obtain production merchant credentials in the Association's name from eSewa, Khalti and/or
   NCHL (ConnectIPS).
2. Set `PAYMENT_MODE=live`, the live keys, `ESEWA_GATEWAY_URL` and `KHALTI_BASE_URL`; for
   ConnectIPS also the base URL and merchant values from `HANDOVER.md` §2.
3. Register these return URLs with each gateway:
   - `https://your-domain/api/v1/payments/esewa/callback`
   - `https://your-domain/api/v1/payments/khalti/callback`
   - ConnectIPS: the same `/api/v1/payments/connectips/callback` URL for both success and failure,
     registered with NCHL integration support
4. Make one small real donation. Confirm it appears in `/admin/donations`, moves the goal total,
   and sends a receipt.
5. Refund or void the test gift with the gateway and confirm the ledger still matches.

The server never marks a donation paid from a browser redirect alone. eSewa's signed payload is
re-signed and compared in constant time; Khalti is looked up server-side with the secret key;
ConnectIPS is validated server-side with a signed token and its returned amount is compared with
the stored donation.

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
| Password reset link            | account owner |

Newsletter campaigns are sent from `/admin/newsletter`, not by an external service.

---

## 7. Registration, sign-in and email verification

Registering creates two things at once: the directory profile the Association reviews, and the
account that owns it. The account is why `/sign-in` and `/account` exist.

### 7.1 What the member does

1. **`/register`** : three steps: about you, career, then account and privacy. The last step asks
   for an email address, a password of at least 8 characters, and the privacy choices.
2. **Submit** : the account and a `pending` profile are written in one transaction, and a
   six-digit code is emailed to that address.
3. **Confirm** : the form asks for the code. Confirming marks the address verified, signs the
   member in and finishes the registration. If they chose a photo in step 2, it is uploaded now,
   with the session the verification just created.
4. **`/account`** : the member sees the review state and their profile, edits it at
   `/account/profile` (contact details, work, photo, up to eight areas of expertise and who may
   see each item), changes their password, confirms a late address or signs out. The page is not
   indexed by search engines.
5. **Review** : the profile waits in `/admin/alumni` until the Association approves it. Editing
   an approved profile publishes the change at once; editing a rejected one puts it back in the
   queue for review.

`/sign-in` is linked from the header, the footer and the register page, and lands the member on
`/account`. A member who has forgotten their password uses **Forgotten your password?** there.
That goes to `/forgot-password`, which always answers the same way (so it cannot be used to
discover who has an account) and emails a single-use link to `/reset-password`. Changing a
password from `/account`, or completing a reset, signs every other device out.

### 7.2 Codes and limits

| Setting                        | Default    | Environment variable             |
| ------------------------------ | ---------- | -------------------------------- |
| Digits per code                | 6          | `OTP_LENGTH`                     |
| Lifetime                       | 15 minutes | `OTP_EXPIRES_MINUTES`            |
| Wrong guesses before it is dead| 5          | `OTP_MAX_ATTEMPTS`               |
| Resend countdown in the browser| 60 seconds | `OTP_RESEND_COOLDOWN_SECONDS`    |
| New codes per address          | 3 per minute | `AUTH_OTP_MAX`, `AUTH_OTP_WINDOW_SECONDS` |

Codes are stored hashed in the `verification` table. The clear code exists only in the email, so
nobody : including an administrator reading the database : can look it up. Typing the code wrong
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

### 7.4 The member's own account

`/account` is the member's home. It shows the email address and whether it is confirmed, the
review status (pending, approved or rejected), the reason when a profile was rejected, and the
profile fields the directory will show.

`/account/profile` edits only what a member may change:

| Editable                                   | Not editable here                                  |
| ------------------------------------------ | -------------------------------------------------- |
| Name, phone, city, country                 | Email address (contact the office)                  |
| Current position, organisation             | Programme and batch year (from the registration)    |
| Further studies, profile note              | Approval status (the Association decides)           |
| Up to eight areas of expertise             |                                                     |
| Profile photo and its publication consent  |                                                     |
| Who may see email, phone and the profile   |                                                     |

Expertise is a list of short tags. The editor offers suggestions and accepts your own; entries
are trimmed, de-duplicated and capped at 40 characters. They appear on the directory card and
the profile page, and the directory search includes them.

Privacy is enforced on the server, not by hiding markup: a field the member marks `hidden` or
`alumni_only` is removed before a public response leaves the service.

### 7.5 Profile photos

A photo is optional. The member chooses a JPEG, PNG or WebP file up to **5 MB** on `/register`
(step 2) or at `/account/profile`, ticks the separate photo-consent box, and uploads. The server
does not trust the file extension or the declared type:

1. `sharp` decodes the bytes and accepts only a real JPEG, PNG or WebP.
2. Images smaller than 200 × 200 or larger than 6,000 × 6,000 are refused. The decoded-pixel
   count is bounded too, so a small file cannot expand into gigabytes of memory.
3. The image is rotated upright, cropped to a square and re-encoded as a 512 × 512 WebP. EXIF and
   GPS metadata are not copied, so a phone photo does not reveal where it was taken.
4. The file is written to `PHOTO_UPLOAD_DIR` (default `.uploads/photos` in development) with a
   random name. It is **not** placed under `public/` and cannot be fetched by path.
5. `alumni.photo_url` stores an internal key and `alumni.photo_consent` records the agreement.
   The public URL is `/api/v1/alumni/[id]/photo?v=…`, which checks the profile's approval status
   and visibility on every request. A pending photo is visible only to its owner and admins.

**Removing a photo** at `/account/profile` deletes the file and clears the consent flag. A
replaced photo's old file is deleted after the database points at the new one. To withdraw the
photo without deleting it, remove it : there is no separate “hide” switch, so a retained file
can never be served after consent is withdrawn.

**Production storage.** Set `PHOTO_UPLOAD_DIR` to an absolute directory outside the release
folder, for example `/var/lib/bpkihs-alumni/photos`, owned by the service user with mode `750`.
This is the storage the documented VPS deployment uses. A platform with an ephemeral filesystem
(Vercel, a stateless container) would lose the files on redeploy, so use a host with a persistent
disk, or add an object-storage driver before choosing one.

### 7.6 What each role may do

| Role | Account | Alumni directory | `/admin` |
| ---- | ------- | ---------------- | -------- |
| Visitor | Signed out; can register, give, RSVP and post | Public profiles and public contact fields | No |
| Normal user (`donor`) | Sign-in, receipts, own pending registration | Public profiles only | No |
| Alumnus (`alumni`) | Everything above plus the full profile editor | Public and alumni-only profiles and contact fields | No |
| Administrator (`admin`) | Staff account, plus an alumni profile if one is attached | Same as an alumnus | Yes |

Registration creates a **normal user**. When the Association approves the profile, the account
is promoted to `alumni` in the same transaction; a rejection demotes it again. That is why a
pending registrant cannot read members-only directory details yet. `hidden` is hidden from every
role in the public directory; staff read those records through `/admin`.

An administrator is made only with `npm run db:admin`, never by the public site. The admin link
appears on `/account` for that role.

### 7.7 Administrator two-factor authentication

**In production, TOTP is mandatory for administrators.** Until the account has enrolled, every
admin page redirects to `/admin/security`, every `/api/v1/admin/*` route answers `403`, and the
admin shell shows no queues or counts. The security page itself stays reachable so the
administrator can finish enrolment. Development and the browser suite are exempt, so a seeded
local admin still works without an authenticator app.

1. Sign in and open **Security** in the admin navigation (`/admin/security`).
2. Choose **Set up two-factor**, confirm the password, and add the account to an authenticator
   app (1Password, Authy, Google Authenticator) by entering the setup key shown.
3. Save the backup codes somewhere off the machine. They are shown once and each works once.
4. Enter the six-digit code from the app. Two-factor is now on.

The next sign-in asks for the password and then a code. **Use a backup code instead** is on the
same screen for a lost or replaced phone.

Recovery paths, in order:

- A signed-in administrator can open `/admin/security` and turn two-factor off with the password.
  In production that immediately confines the account to the security page until it is turned
  back on, so use it only when replacing the device.
- A locked-out administrator signs in with a backup code, then re-enrols from the same page.
- With no device and no backup code, rerun the admin bootstrap with `ADMIN_RESET_2FA=true`. This
  is the break-glass path: it needs shell access to the host and resets the password at the same
  time, so it is not a support workflow.

  ```bash
  ADMIN_EMAIL="president@your-domain" \
  ADMIN_PASSWORD="a-long-unique-password" \
  ADMIN_NAME="Association President" \
  ADMIN_RESET_2FA=true \
  npm run db:admin
  ```

  That resets the password, removes only that account's authenticator and turns two-factor
  off; it does not touch anybody else. Enrol again immediately afterwards.

The secret is encrypted with `BETTER_AUTH_SECRET` before it is stored, and backup codes are
hashed. Rotating the auth secret therefore invalidates existing authenticators as well as
sessions; every administrator must enrol again.

---

## 8. Production on a VPS

This is the recommended deployment: one Node process behind nginx, one Postgres database.

### 8.1 Server layout

```text
/var/www/bpkihs-alumni        application
/etc/bpkihs-alumni.env        secrets, readable only by the service user
/var/lib/bpkihs-alumni/photos uploaded profile photos; outside the release folder
```

Create a dedicated Unix user (`bpkihs`) that owns the application directory, and a Postgres user
that owns only the site database. Create the photo directory once and give it to that user:

```bash
sudo install -d -m 750 -o bpkihs -g bpkihs /var/lib/bpkihs-alumni/photos
```

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
PHOTO_UPLOAD_DIR=/var/lib/bpkihs-alumni/photos
```

ConnectIPS is built: set its variables from [`HANDOVER.md`](../HANDOVER.md) §2 once NCHL supplies
the merchant pack, and `check:env` will then require the complete set. Fonepay has no adapter yet,
so those variables are not read.

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

  # A profile photo is at most 5 MB plus multipart overhead. The application
  # enforces the real limit; nginx must not reject a valid upload first.
  client_max_body_size 6m;

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
directory. Database migrations are forward-only : take a backup before a release that changes the
schema.

---

## 9. Backups and recovery

`scripts/backup-db.sh` writes a gzipped plain-SQL dump, deletes files older than two weeks, and
can encrypt the result. Run it as the application user with the production environment loaded:

```bash
cd /var/www/bpkihs-alumni
set -a && . /etc/bpkihs-alumni.env && set +a
./scripts/backup-db.sh
```

| Variable                 | Meaning                                                   |
| ------------------------ | --------------------------------------------------------- |
| `DATABASE_URL`           | Required; the production connection string                |
| `BACKUP_DIR`             | Output directory, default `./backups`                     |
| `BACKUP_KEEP_DAYS`       | Retention in days, default `14`                           |
| `BACKUP_ENCRYPTION_KEY`  | When set, encrypt with AES-256 (openssl, PBKDF2)          |
| `PG_DUMP_BIN`            | `pg_dump` binary when it is not on `PATH`                 |

Add it to the application user's crontab so it runs without anyone remembering:

```cron
17 2 * * * cd /var/www/bpkihs-alumni && set -a && . /etc/bpkihs-alumni.env && set +a && ./scripts/backup-db.sh >> /var/log/bpkihs-backup.log 2>&1
```

Then copy the files off the host : a backup on the same disk does not survive a lost server. Keep
the encryption key somewhere other than the backup storage.

**Photo files are not in the database dump.** Back up `PHOTO_UPLOAD_DIR` on the same schedule:

```bash
tar -czf /var/backups/bpkihs/photos-$(date -u +%Y%m%dT%H%M%SZ).tar.gz \
  -C /var/lib/bpkihs-alumni photos
```

A database restore that points at missing files shows initials instead of broken images, but the
member's uploaded photo is gone. Keep the photo archive with the database backups and test
restoring both together.

Test a database restore into a throwaway database at least once, using the filename from the log:

```bash
createdb bpkihs_restore_test

# Unencrypted:
gunzip -c /var/backups/bpkihs/bpkihs-20261024T021700Z.sql.gz | psql -d bpkihs_restore_test

# Encrypted:
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -in /var/backups/bpkihs/bpkihs-20261024T021700Z.sql.gz.enc \
  -pass env:BACKUP_ENCRYPTION_KEY | gunzip -c | psql -d bpkihs_restore_test

dropdb bpkihs_restore_test
```

Restoring over the live database is destructive. Stop the app, take a fresh backup of the current
state, then restore.

The database contains personal data (alumni contact details, donor emails, tickets). Treat
backups as confidential and encrypt them at rest. The script sets `umask 077` and creates the
directory owner-only, but the storage you copy the files to is your responsibility.

### 9.1 Monitoring

`GET /api/health` returns 200 only when the process and a database query both work, and 503
otherwise. Point the hosting platform's health check and an uptime monitor at it.

`scripts/healthcheck.sh` wraps the same probe for a cron job or a host that cannot run an
external monitor. It exits non-zero on failure and, when `ALERT_WEBHOOK_URL` is set, posts a
Slack-compatible message (requires `jq`):

```cron
* * * * * cd /var/www/bpkihs-alumni && ./scripts/healthcheck.sh >> /var/log/bpkihs-health.log 2>&1
```

```bash
HEALTHCHECK_URL=https://your-domain/api/health \
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/... \
./scripts/healthcheck.sh
```

Alert on 5xx responses and on a failing health check; the application logs the request id for
every API failure, so a user report can be traced to one log entry.

---

## 10. Routine operations

| Task                          | How                                                              |
| ----------------------------- | ---------------------------------------------------------------- |
| Check the site                | `curl -fsS https://your-domain/api/health`                       |
| Check it automatically        | `scripts/healthcheck.sh` from cron, or an uptime monitor on `/api/health` |
| Review pending work           | `/admin` queue counts                                            |
| Publish content               | `/admin/content`                                                 |
| Send the newsletter           | `/admin/newsletter`, test first                                  |
| Check money                   | `/admin/donations` against the gateway dashboard                 |
| Review admin actions          | `/admin/audit`                                                   |
| Update dependencies           | `npm outdated`, update, `npm audit`, run `npm run ci`            |
| Rotate the auth secret        | Set a new `BETTER_AUTH_SECRET` and restart; all sessions end      |
| Recover an admin password     | Rerun `npm run db:admin` with the same email                     |
| Recover a lost authenticator  | Rerun `db:admin` with `ADMIN_RESET_2FA=true`, then enrol again    |
| Review admin second factors   | `/admin/security`, one row per administrator                     |
| Revoke one admin              | Change their `user.role` to `donor` in the database              |
| Back up the database          | `scripts/backup-db.sh` nightly, then copy the file off-host      |
| Back up the photos            | Tar `PHOTO_UPLOAD_DIR` on the same schedule, then copy it off-host |
| Remove a member's photo       | They use **Remove photo** at `/account/profile`; it deletes the file |

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
| Photo upload returns 413                               | nginx's `client_max_body_size` is too small; set `6m` (the app caps the file at 5 MB). |
| Photo upload returns "could not upload"               | Check `PHOTO_UPLOAD_DIR` exists, is writable by the service user, and has free disk space; then the server log. |
| Photos disappear after a redeploy                      | `PHOTO_UPLOAD_DIR` is inside an ephemeral release directory. Move it to persistent storage and migrate the files. |
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
  storage/          profile-photo validation, re-encoding and disk storage
  http/             error envelope, CSRF, rate limiting, multipart reader, admin guard
  payments/         eSewa, Khalti and ConnectIPS adapters (Fonepay pending)
  email/            Resend and console transports
src/proxy.ts        CSRF cookie and request security headers
docs/               this guide, backend, security, deployment, design
drizzle/            SQL migrations; never edit an applied migration
.uploads/           local profile photos (git-ignored; production uses PHOTO_UPLOAD_DIR)
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
| `npm run db:backup`       | Compressed (optionally encrypted) database backup |
| `npm run db:fixtures`     | Create the e2e accounts and goal in a dev database |
| `npm run db:studio`       | Browse the database                               |
| `npm run check:env`       | Validate production configuration                 |
| `npm run connectips:accept` | Check ConnectIPS credentials and signing against NCHL UAT |
| `npm run check:health`    | Probe `/api/health`, alert a webhook on failure   |
| `npm run ci`              | Format check, typecheck, lint, tests and build    |

---

## 14. Tests and the fixture data

Two suites, both run from the project root. Postgres must be up for either.

```bash
npm run test        # Vitest: units, components, pure helpers (387 tests)
npm run test:e2e    # Playwright: desktop and mobile browsers against a real server
```

### 14.1 How the browser suite gets its data

The application seeds nothing, so the suite brings its own fixtures. A Playwright `setup`
project (`e2e/setup/fixtures.setup.ts`) runs before the browser projects and:

1. writes the accounts and the content the pages render straight to the development database
   (`e2e/helpers/fixtures.ts`):

   | What | Value |
   | ---- | ----- |
   | Administrator | `admin@bpkihs.local` / `E2eTestAdmin!99` |
   | Donor | `donor@example.com` / `Donor12345!` |
   | Member | `member@bpkihs.local` / `MemberPass!2026`, an approved profile with expertise; any photo is cleared on each seed |
   | Restricted member | an approved profile set to `alumni_only`, with no account |
   | Giving goals | `goal-scholarship` plus a library and a hostel goal, all open |
   | Events | three upcoming events on the Dharan campus |
   | Posts | three published community posts |
   | Donations | one named gift and one anonymous gift, both confirmed |
   | Board and welcome | two current members, one past member, the welcome message |

   A database created a minute ago with `npm run db:migrate` is therefore enough to run the
   whole suite; nothing has to be entered by hand first. Every row has a fixed id and is
   upserted, so rerunning the fixtures updates it instead of adding duplicates.

2. signs each account in **once** through `/api/auth/sign-in/email` and saves the session to
   `e2e/.auth/admin.json`, `e2e/.auth/donor.json` and `e2e/.auth/member.json` (git-ignored).

Specs reuse those sessions with `test.use({ storageState: … })`, which keeps a run to three
sign-ins instead of a dozen and stays under Better Auth's limit of five per minute per IP. A
stored session is reused while it still works, so back-to-back runs do not sign in again.

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
| `community` | A feed card opens its post page; an unknown post shows the 404 screen and the API answers 404 |
| `admin` | Sign-in gate, approving a registration, publishing a post, moving a ticket, the CSV export |
| `account` | The member profile and its edits, expertise, the password form, the signed-out gates and the forgot-password answer |
| `photo` | A real PNG is uploaded, served through the privacy-checked route and deleted; a fake image is refused (desktop only) |
| `roles` | The alumni-only directory rule for a signed-out visitor, a donor, an alumnus and an administrator, plus the role shown on `/account` |
| `donate-checkout` | The sign-in gate, a signed-in gift to the eSewa gateway, the thank-you states |
| `a11y` | axe WCAG 2.1 A/AA scan of all 19 public pages (desktop only) |
| `keyboard` | Twelve Tab stops per page must draw a focus ring, and nothing hidden may stay focusable (desktop only) |
| `throttle` | The home page on 4x CPU and slow 4G, with LCP under 3 s (desktop only) |
| `cross-browser` | The home shell, community feed and transparency page on Firefox and WebKit |

The accessibility scan catches mechanical problems : contrast, names, heading order, landmarks.
It does not replace a keyboard and screen-reader pass, which is still open in `TRACKER.md` D4.

Firefox and WebKit are separate download once:

```bash
npx playwright install firefox webkit
npx playwright test --project=firefox --project=webkit
```

A normal `npx playwright test` runs Chromium only for the long specs, because the config limits
the Firefox and WebKit projects to `e2e/cross-browser.spec.ts`.

### 14.3 When a test fails

- `ECONNREFUSED 5433` or `Postgres is not reachable at localhost:5433` : Postgres is not
  running: `npm run db:up`. `npm run dev` prints this before the first page load, and
  `/api/health` reports it in one request.
- `sign in as … expected 200, received 429` : the sign-in limiter; wait a minute. Deleting
  `e2e/.auth/` forces a fresh session on the next run.
- `Port 3000 is already in use` : a stray `next dev` still holds the port. `npm run dev`
  checks the port first and prints the command to find and stop that process; it will not fall
  back to another port.
- `Executable doesn't exist … firefox` : the extra engines are not installed:
  `npx playwright install firefox webkit`.
- `test-results/` keeps a screenshot, trace and page snapshot for every failure.
- A timeout on its own is often the dev server, not the page: the config allows 45 seconds per
  test and 10 seconds per expectation because eight workers can arrive while Turbopack is still
  compiling a route.

---

## 15. Bundle and performance checks

### 15.1 What the browser downloads

```bash
npm run build      # first, the analyser reads the production output
npm run analyze    # Next's Turbopack analyser, served at http://localhost:4000
```

The analyser is interactive: it shows a treemap per route and the module a byte belongs to. A
production build of this app ships **348.1 kB of JavaScript gzipped across 34 client chunks**
and contains no server-only package : `drizzle-orm`, `postgres`, `better-auth` and the Resend
client stay on the server, which is worth re-checking whenever a new import lands in a client
component. Two weights dominate: React and the router (framework), then `zod`, which the forms
use to validate before submitting.

Fonts are self-hosted through `next/font`. Inter and Source Serif are preloaded because they
draw the first screen; Noto Sans Devanagari is **not** preloaded because no page contains
Nepali text yet, so it no longer costs every visitor a download it never uses.

### 15.2 Lighthouse

Measure the production build, not the dev server: dev output is unminified and never scores.

```bash
npm run build
APP_URL=http://localhost:3100 \
NEXT_PUBLIC_SITE_URL=http://localhost:3100 \
EMAIL_FROM="BPKIHS Alumni Association <no-reply@alumni.example.com>" \
CONTACT_EMAIL="office@alumni.example.com" \
PORT=3100 npm run start

npx lighthouse@12 http://localhost:3100/ --output=json --output-path=lh-home.json \
  --only-categories=performance,accessibility,seo,best-practices \
  --chrome-flags="--headless=new --no-sandbox"
```

`EMAIL_FROM` and `CONTACT_EMAIL` are overridden only because production validation rejects
`.local` addresses; nothing is sent by a build or a Lighthouse run.

Scores on 25 October 2026, mobile preset (throttled, 4× CPU):

| Page          | Performance | Accessibility | Best practices | SEO | LCP   |
| ------------- | ----------- | ------------- | -------------- | --- | ----- |
| `/`           | 90          | 100           | 100            | 100 | 3.6 s |
| `/directory`  | 93          | 99            | 100            | 100 | 3.3 s |
| `/donate`     | 93          | 100           | 100            | 100 | 3.2 s |
| `/events`     | 91          | 98            | 100            | 100 | 3.4 s |
| `/register`   | 93          | 100           | 96             | 100 | 3.3 s |

All five pages meet the target (performance ≥ 90, accessibility ≥ 95, SEO ≥ 95), and cumulative
layout shift is 0–0.05. The remaining headroom is Largest Contentful Paint, which is text on
every page: it is set by how quickly the first screen's CSS and JavaScript arrive on a slow
connection. Serving from a host near Nepal, enabling Brotli at nginx and keeping the JS budget
flat will move it more than any code change.
### 15.3 Slow phone and slow network

The Lighthouse pass is a snapshot; this check keeps the first screen from regressing:

```bash
npx playwright test e2e/throttle.spec.ts --project=desktop
```

It loads `/` once to warm the dev server, then uses the Chrome DevTools Protocol to apply 4×
CPU throttling and a slow-4G profile (150 ms latency, 1.6 Mbit down), reloads, and reads Largest
Contentful Paint. LCP is only delivered to a `PerformanceObserver`, so the test registers a
buffered observer; `getEntriesByType('largest-contentful-paint')` returns nothing. It fails if
LCP is missing or above 3 s. On a warm dev server it measures about 0.9 s : the production
figures in 15.2 are the ones to quote to anyone outside the project.
