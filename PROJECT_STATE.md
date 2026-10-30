# Project State

> Keep this file short, factual, and current. Never store secrets here.

## Project goal

Lifelong alumni platform for B.P. Koirala Institute of Health Sciences (BPKIHS), Dharan, Nepal: directory, registrations, giving, events, community, support and admin moderation dashboard.

## Current milestone

Release : All 11 phases complete. Awaiting production launch (live credentials, verified email domain, real content, legal sign-off).

## Current task

Production launch preparation, the ConnectIPS sandbox acceptance run and Fonepay merchant onboarding. Manual accessibility pass and real-device testing remain.

## Completed

- [x] Project setup (Next.js 16, TypeScript strict, Tailwind v4, shadcn/ui) : Evidence: `package.json`, `tsconfig.json`
- [x] Design system and layout shell : Evidence: `src/components/ui/`, `src/styles/tokens.css`
- [x] Data layer (API client, contract, privacy rules) : Evidence: `src/lib/api/`
- [x] Home and About/Governance pages : Evidence: `src/app/`, `src/features/home/`, `src/features/governance/`
- [x] Directory and Registration : Evidence: `src/app/directory/`, `src/app/register/`, `src/features/directory/`
- [x] Donate flow (goals, checkout, eSewa/Khalti) : Evidence: `src/app/donate/`, `src/server/payments/`
- [x] ConnectIPS adapter (signed form, server-side validation, short reference) : Evidence: `src/server/payments/connectips.ts`, `drizzle/0008_complete_hex.sql`
- [x] Events and Community : Evidence: `src/app/events/`, `src/app/community/`
- [x] Support and Legal pages : Evidence: `src/app/support/`, `src/app/legal/`
- [x] Admin dashboard : Evidence: `src/app/admin/`, `src/server/api/routes/admin/`
- [x] Backend API and database : Evidence: `src/server/`, `drizzle/`
- [x] Member self-service account : Evidence: `src/app/account/`
- [x] Photo upload with consent : Evidence: `src/server/photos/`, e2e tests
- [x] CSV register import : Evidence: `src/app/admin/alumni/import/`
- [x] Newsletter double opt-in and monthly digest : Evidence: `scripts/send-newsletter-digest.ts`
- [x] Admin two-factor authentication : Evidence: `src/app/admin/security/`
- [x] Automated accessibility scans (axe) : Evidence: `e2e/a11y.spec.ts`
- [x] Lighthouse pass (90–93 perf, 98–100 a11y, 100 SEO) : Evidence: `docs/HOWTO.md` §15
- [x] Cross-browser smoke (Chromium, Firefox, WebKit) : Evidence: `e2e/cross-browser.spec.ts`

## Next steps

1. Obtain live eSewa/Khalti merchant credentials, NCHL's ConnectIPS UAT pack and Fonepay's current integration document from the Association
2. Verify sending domain in Resend (SPF, DKIM, DMARC)
3. Enter real content through `/admin/content`
4. Legal and privacy sign-off
5. Manual screen-reader pass (NVDA/VoiceOver)
6. Real-device testing (iOS Safari, Android Chrome, Edge)
7. Install cron entries for backups, health checks, newsletter digest

## Decisions and assumptions

- NPR-only donations (no USD toggle) : Reason: Decision D30, Nepal-focused donor base : Status: approved
- Light mode only : Reason: Decision A1, simplifies maintenance : Status: approved
- No mock mode or payment simulator : Reason: Production safety, one real data path : Status: approved
- Server Components by default : Reason: Performance, reduces client JS : Status: approved
- ConnectIPS/Fonepay agreed 29 Oct 2026 : Reason: the Association wants the other Nepali gateways : Status: ConnectIPS adapter built 29 Oct 2026, awaiting NCHL UAT credentials; Fonepay blocked on its current document (TRACKER C7a/C7b)

## Blockers and known failures

- Live merchant credentials needed for real payments : Impact: Cannot accept real donations : Next: Association to obtain eSewa/Khalti production keys
- ConnectIPS/Fonepay merchant packs needed : Impact: ConnectIPS cannot be run against UAT and Fonepay cannot be built : Next: Association to provide the NCHL merchant pack, Fonepay's current integration document, sandbox credentials and return-URL registration
- Verified email domain needed : Impact: Emails won't reach recipients in production : Next: Association to verify domain in Resend
- Real content needed : Impact: Pages show empty states : Next: Association to enter through `/admin/content`
- 4 moderate npm audit findings from drizzle-kit dev dependency : Impact: Low (dev-only) : Next: Monitor for fix

## Verification status

- Tests: 428 unit tests pass across 73 files (2 stale profile-view assertions updated and 4 TOTP-rule tests added on 30 Oct). Checkout e2e: 5/5 pass (`donate-checkout.spec.ts`)
- Build/type check/lint: Passed : `next build`, `tsc --noEmit` and ESLint green. `format:check` is clean for app/e2e code; it still flags 15 pre-existing `prompts/*.md` instruction documents
- Payments: ConnectIPS protocol is covered by unit tests; **no NCHL UAT transaction has been run** (merchant pack outstanding)
- Manual checks: Partial : Lighthouse pass complete, screen-reader and real-device passes pending
- Security/data migration checks: Passed : re-audited 30 Oct 2026 (`docs/SECURITY-AUDIT.md` §9); CSP, rate limiting, audit logging and CSRF verified; ConnectIPS signing-key paths are gitignored; production now enforces TOTP for administrators with a documented CLI break-glass (`docs/SECURITY-AUDIT.md` §9.7)

## Relevant files

- `docs/TRACKER.md` : Authoritative list of open work
- `docs/HOWTO.md` : Setup, admin tasks, troubleshooting
- `docs/BACKEND.md` : API, data model, auth, payments
- `docs/DEPLOYMENT.md` : Production runbook
- `HANDOVER.md` : Logins, secrets, go-live order
- `REPOSITORY_RULES.md` : Coding conventions for AI agents

## Not applicable documents or features

- `prompts/12_MCP.md` : Reason: No MCP servers configured for this project
- Multi-instance rate limiting : Reason: Single-instance deployment assumed

## Handoff notes

Read `MASTER_INSTRUCTIONS.md`, `SOURCE_OF_TRUTH.md`, `REPOSITORY_RULES.md`, and this file before continuing. The application is feature-complete for launch. Remaining work is operational (credentials, content, manual testing). Follow `HANDOVER.md` for go-live order.

## Last updated

2026-10-30
