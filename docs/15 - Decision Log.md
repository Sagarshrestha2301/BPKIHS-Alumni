---
title: BPKIHS Alumni Association — Decision Log
status: Active
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, decisions]
---
# Decision Log

> Decisions already made or accepted as working technical decisions belong here. Unresolved questions belong in [[16 - Open Decisions]].

## DEC-001 — Modular Monolith
**Status:** Accepted

Use one Next.js application with logically separated domains.

**Reason:** Solo/small team; avoids duplicate deployments, CORS, duplicated auth/env configuration, and unnecessary operational complexity.

## DEC-002 — Next.js App Router
**Status:** Accepted
Use Next.js App Router with TypeScript.

## DEC-003 — PostgreSQL
**Status:** Accepted
Use managed PostgreSQL.

## DEC-004 — Prisma
**Status:** Accepted
Use Prisma ORM and migrations.

## DEC-005 — Better Auth
**Status:** Accepted
Use Better Auth with database-backed sessions.

**Reason:** Fits the required email/password, email verification, password reset, and revocable session model.

## DEC-006 — Zod
**Status:** Accepted
Use Zod for validation.

## DEC-007 — Tailwind CSS
**Status:** Accepted
Use Tailwind CSS.

## DEC-008 — S3-Compatible Storage
**Status:** Accepted
Store uploaded files outside app-server local storage.

## DEC-009 — Vitest + Playwright
**Status:** Accepted
Use Vitest for unit/integration tests and Playwright for targeted E2E.

## DEC-010 — GitHub Actions
**Status:** Accepted
Run automated checks before merge.

## DEC-011 — Vercel
**Status:** Proposed
Vercel + managed PostgreSQL is the proposed hosting setup; confirmation pending.

## DEC-012 — International Donations Phase 2
**Status:** Proposed
International donations and multi-currency are excluded from MVP pending Board approval.

## DEC-013 — Batch Year
**Status:** Proposed
A cohort such as “MBBS 2008 batch” currently means admission year; graduation year is separate.

## DEC-014 — Core Alumni Eligibility
**Status:** Proposed
Graduates of BPKIHS programmes are the core alumni identity.

## DEC-015 — Community/Newsletter Phase 2
**Status:** Proposed
Community feed and newsletter automation are proposed for Phase 2.

## DEC-016 — Requirement Vocabulary
**Status:** Accepted
Use Confirmed / Proposed / TBD / Out of Scope.

## DEC-017 — Requirement IDs
**Status:** Accepted
Use FR / NFR / SEC / PRV / ACC / PERF / OPS / BR prefixes.

## DEC-018 — Obsidian
**Status:** Accepted
Use YAML frontmatter, wikilinks, callouts, and structured markdown.

## Accepted Risks — 2026-10-01

The following npm audit findings are accepted for the current release because
the vulnerable packages are not present in `.next/server` output or production
`.nft.json` traces. Runtime database access uses PostgreSQL only through
`@prisma/adapter-pg`; the application does not use MySQL, and no application
path passes cyclic object graphs to `deepmerge-ts`.

- **GHSA-ggr8-5vv4-36mx** (`deepmerge-ts`, inherited by `@prisma/config` and
	`prisma`): the recursive-object stack exhaustion is unreachable because the
	vulnerable package is CLI/config tooling only and the application does not
	accept or construct cyclic merge inputs.
- **GHSA-3f6p-5ww8-9rcr** (`mysql2`): the cleartext authentication downgrade
	requires a MySQL connection to a rogue or MITM server; this application uses
	PostgreSQL only.
- **GHSA-rgwj-5xj2-c3m3** (`mysql2`): the compressed-protocol decompression
	bomb requires `compress: true` and a malicious or compromised MySQL endpoint;
	this application uses neither MySQL nor MySQL compression.

Revisit this acceptance when either of these conditions occurs:

1. A Prisma 7 release newer than 7.10.0 is published and can be evaluated for
	 patched transitive dependencies.
2. Any audited package becomes reachable from the deployed runtime.

Re-check with:

```text
npm audit --omit=dev
npm ls deepmerge-ts mysql2
```
