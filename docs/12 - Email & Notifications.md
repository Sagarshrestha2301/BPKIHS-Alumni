---
title: BPKIHS Alumni Association — Email & Notifications
status: Draft
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, email, notifications]
---
# Email & Notifications

## Provider
Resend is proposed for transactional email. SendGrid is an alternative. Final provider: TBD.

## Transactional Messages
- Email verification
- Password reset
- Verification approved
- Verification rejected / more information
- Donation receipt/acknowledgment
- Support update
- Event reminder

## Newsletter
Newsletter automation is Phase 2 proposed.

## Sender Domain
Before production:
- confirm domain ownership,
- configure SPF,
- configure DKIM,
- verify sender identity,
- test deliverability.

## Delivery Principle
Record the underlying business state first, then queue/send the email.

```text
Business event
 ↓
Durable record
 ↓
Email job
 ↓
Provider
```

A provider failure must not undo a successful business transaction.

## Retry
Transient failures should be retryable with bounded retries and recorded attempts.

## Idempotency
Critical transactional email jobs should use durable business-event identifiers to avoid uncontrolled duplicates during retries.

## Preferences
- newsletter subscription/unsubscription required,
- other optional communication preferences may be added later.

Security/account messages are distinct from optional newsletters.

## In-App Notifications
Not required for MVP unless approved. If later added, model should include user, type, payload, read state, and timestamp.
