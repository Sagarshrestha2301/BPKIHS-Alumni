---
title: BPKIHS Alumni Association — Payment Flow
status: Draft
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, payment, fundraising]
---
# Payment Flow

> [!warning] Blocking
> Select the Nepal payment provider before provider-specific implementation.

## MVP
- Nepal donations
- NPR
- one Association-approved Nepal provider

## Phase 2 Proposed
- international donations
- additional currencies
- additional providers

## Candidate Nepal Providers
```text
eSewa
Khalti
Fonepay
```
Final: TBD.

## Preconditions
Confirm:
- Association bank account,
- merchant ownership,
- onboarding,
- fees,
- settlement,
- sandbox,
- production credentials,
- refunds,
- reconciliation.

## Lifecycle
```text
Choose campaign + amount
 ↓
Server validation
 ↓
Donation = PENDING
 ↓
Create payment transaction
 ↓
Initialize provider
 ↓
User pays
 ↓
Callback/webhook
 ↓
Provider verification
 ↓
Amount/currency/reference validation
 ↓
Idempotency check
 ↓
Donation = SUCCESS
 ↓
Receipt/email jobs
```

## Rules
1. Browser payment success is never authoritative.
2. Duplicate provider callbacks cannot double-count.
3. Amount and currency must be verified from trusted transaction data.
4. Campaign totals come from trusted successful records.

## States
```text
PENDING
PROCESSING
SUCCESS
FAILED
CANCELLED
REFUNDED
```

## Reconciliation
Application donation ↔ provider transaction ↔ bank settlement.

Potential status:
```text
UNMATCHED
MATCHED
DISCREPANCY
RESOLVED
```

## Receipt
Successful donation → receipt number → receipt document if required → acknowledgment email.

Legal/tax wording: TBD — Finance.
Fiscal year: Nepali fiscal year proposed.

## Failure Cases
Test cancelled, timeout, missing callback, duplicate callback, bad reference, mismatch, verification failure, refund, receipt failure, email failure.
