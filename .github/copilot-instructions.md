# BPKIHS Alumni Association — Copilot Instructions

## Project Context

This is the BPKIHS Alumni Association official website and alumni platform.

Before implementing a feature:
1. Inspect the relevant documentation under `docs/`.
2. Identify the relevant requirement IDs.
3. Check `docs/16 - Open Decisions.md`.
4. Do not invent unresolved business rules.
5. If a requirement is marked TBD, do not silently convert it into an implementation decision.

## Architecture

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma
- Better Auth
- Zod
- Tailwind CSS
- S3-compatible object storage
- Transactional email provider
- Nepal payment provider, pending final selection
- Vitest
- Playwright

Use a modular monolith.

Do not introduce a separate Express backend unless the architecture documentation is explicitly changed.

## Engineering Priorities

Correctness > Clarity > Maintainability > Security > Testability > Performance

Prefer simple, explicit solutions over clever abstractions.

## Security

Never trust client input.

Always:
- validate server-side,
- authorize server-side,
- check resource ownership,
- protect private data,
- protect file uploads,
- rate-limit sensitive endpoints,
- never trust client payment success,
- never expose secrets.

## Database

Use PostgreSQL and Prisma.

Prefer:
- foreign keys,
- unique constraints,
- transactions,
- appropriate indexes,
- explicit status values.

Do not create domain migrations based on assumptions.

## Payments

Payment status must be based on provider verification.

Implement idempotency for callbacks/webhooks.

Never use client-side payment state as the source of truth.

## Code Quality

Do not produce generic AI boilerplate.

Do not introduce abstractions without a concrete reason.

Do not rewrite unrelated code.

Use project-specific names.

Add meaningful tests for important business rules and security boundaries.

## Documentation

Relevant documentation:
- `docs/00 - Project Overview.md`
- `docs/01 - Product Requirements.md`
- `docs/02 - User Roles & Permissions.md`
- `docs/03 - User Stories.md`
- `docs/04 - Sitemap.md`
- `docs/05 - System Architecture.md`
- `docs/06 - Database Design.md`
- `docs/07 - API Specification.md`
- `docs/08 - Security Requirements.md`
- `docs/09 - Privacy Requirements.md`
- `docs/10 - Alumni Verification.md`
- `docs/11 - Payment Flow.md`
- `docs/16 - Open Decisions.md`

Use requirement IDs such as:
- FR-*
- NFR-*
- SEC-*
- PRV-*
- ACC-*
- PERF-*
- OPS-*
- BR-*

Update documentation when a material project decision changes.