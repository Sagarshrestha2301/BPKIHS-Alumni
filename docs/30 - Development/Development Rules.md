---
title: BPKIHS Alumni Association — Development Rules
status: Active
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, development]
---
# Development Rules

## Priorities
```text
Correctness → Clarity → Maintainability → Security → Testability → Performance
```

## Requirement First
Do not implement behavior that has not been justified by a confirmed requirement or explicit proposal.

## Keep It Simple
Avoid unnecessary abstractions, dependencies, distributed infrastructure, and premature optimization.

## Server Trust Boundary
Never trust browser values, hidden fields, UI role checks, upload filenames, client payment state, or client-side calculations.

## Validation
Validate external data server-side using Zod/domain rules.

## Authorization
Every protected operation checks authentication, permission, and resource ownership/scope.

## Database
Use constraints, foreign keys, meaningful names, transactions when required, and explicit state transitions.

## Financial Logic
Money operations must be server-controlled, auditable, idempotent where relevant, and tested.

## Git
- small meaningful commits,
- clear branch names,
- PR checks,
- review before merge.

## Environment
Use `.env.example`; never commit secrets.

## Tests
Test business rules, security boundaries, critical workflows, and important failures.

## AI-Assisted Coding
Generated code must be reviewed line-by-line enough to understand ownership, behavior, security implications, and failure modes. Do not merge code only because it compiles.

## Documentation
Update relevant docs and [[15 - Decision Log]] when material behavior/architecture changes.
