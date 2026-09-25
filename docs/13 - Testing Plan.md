---
title: BPKIHS Alumni Association — Testing Plan
status: Draft
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, testing, qa]
---
# Testing Plan

## 1. Philosophy
Testing begins during feature development and traces back to requirements.

```text
Requirement
 ↓
Implementation
 ↓
Automated/manual test
 ↓
Evidence
```

## 2. Unit Tests — Vitest
Test:
- validation,
- permission logic,
- business rules,
- calculations,
- payment state transitions,
- receipt numbering,
- utility/domain logic.

## 3. Integration Tests
Test:
- database behavior,
- authentication integration,
- verification workflow,
- donation lifecycle,
- RSVP uniqueness,
- moderation,
- storage integration where needed.

## 4. E2E — Playwright
High-priority flows:
1. Registration → OTP/email verification → password → login
2. Donation → payment → callback → verified donation → receipt

Additional E2E coverage should be added for other business-critical flows.

## 5. Security Tests
Cover:
- unauthorized access,
- IDOR/resource ownership,
- privilege escalation,
- XSS,
- uploads,
- rate limiting,
- password reset abuse,
- webhook manipulation,
- payment tampering,
- private-data exposure.

## 6. Privacy Tests
Test all visibility combinations and restricted verification evidence.

## 7. Payment Test Matrix
| Scenario | Expected |
|---|---|
| Success | Donation SUCCESS |
| Failure | Donation FAILED |
| Cancel | Donation CANCELLED |
| Duplicate callback | No double count |
| Invalid reference | Reject/flag |
| Amount mismatch | Reject/flag |
| Currency mismatch | Reject/flag |
| Missing callback | Status/reconciliation path |
| Refund | Donation REFUNDED |
| Email failure | Donation remains SUCCESS |

## 8. Accessibility
Check keyboard navigation, labels, focus, errors, contrast, forms, and responsive behavior.

## 9. Browser / Device
At minimum test Chromium and representative mobile/desktop viewports. Expand according to actual audience data.

## 10. Regression
Important fixes should receive regression tests where practical.

## 11. CI
```text
Install
 ↓
Lint
 ↓
Typecheck
 ↓
Unit
 ↓
Integration
 ↓
Build
```

## 12. Release Gate
No production release if a critical security, payment, data-integrity, or authorization issue is unresolved.
