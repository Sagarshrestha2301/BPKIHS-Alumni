# BPKIHS Alumni Association

Official website and alumni connection platform for the BPKIHS Alumni Association.

## Local setup

Use Node 22 as specified in `.nvmrc`, PostgreSQL, and a Resend account for real
email delivery.

1. Create a local PostgreSQL role and database named `bpkihs_app` and
   `bpkihs_alumni`, or choose your own names.
2. Copy `.env.example` to `.env` and replace every placeholder. For local
   PostgreSQL, `DATABASE_URL` and `DIRECT_DATABASE_URL` can be the same URL.
3. Install dependencies and generate the Prisma client.

   ```bash
   npm install
   npm run db:generate
   npm run db:migrate
   ```

4. Start the application with `npm run dev`.

Never use the `change-me` password from `.env.example`, commit `.env`, or use a
production email or payment secret locally.

## Current foundation

- Prisma 7 uses `prisma.config.ts`; database URLs do not belong in the schema.
- Better Auth provides email/password sessions with email OTP verification and
  password reset at `/api/auth/[...all]`.
- Sign-up, email verification, sign-in, and password-reset screens are ready
  at `/sign-up`, `/verify-email`, `/sign-in`, and `/forgot-password`.
- Alumni profile and verification-claim endpoints are available at
  `/api/alumni/me`, `/api/verification`, and `/api/verification/me`.
- Staff review and evidence uploads remain blocked by Association policy.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

For Playwright, create a dedicated PostgreSQL database and set both
`E2E_DATABASE_URL` and `E2E_DIRECT_DATABASE_URL` before running
`npm run test:e2e`. E2E mode writes authentication codes only to the local
`test-results/e2e-otp.json` file and never enables that path in production.

GitHub Actions runs these checks for pull requests and pushes to `main`.
