---
title: BPKIHS Alumni Association — Privacy Requirements
status: Draft
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, privacy]
---
# Privacy Requirements
> [!warning] Legal review
> This is a technical/product privacy specification, not final legal advice or the final Privacy Policy.

## 1. Data Minimization
Collect only data needed for:
- account/identity,
- alumni verification,
- directory,
- events,
- donations,
- communication,
- support,
- security/audit.

## 2. Data Categories
### Account
Email, authentication relation, status, timestamps.

### Alumni
Name, programme, batch, graduation/admission years, professional data, location, further study, photo, biography.

### Verification
Claims, evidence if approved, decision, reviewer, notes.

### Financial
Donation amount/currency, campaign, provider/reference, status, receipt information, permitted donor identity.

### Support
Tickets, messages, assignment, status.

## 3. Visibility Model
Conceptually:
```text
Private
Alumni-only
Public
```
Final directory access model: TBD.

## 4. Public Data
Potential fields:
- name
- programme
- batch
- graduation year
- specialisation
- current position
- location

Exact fields: TBD.

## 5. Sensitive Data
Phone, private email, verification evidence, internal admin notes, and sensitive financial/admin information should not be public by default.

## 6. Directory Access
Open:
- Public Internet
- Authenticated users
- Verified alumni only

## 7. Account Deletion
Define treatment of:
- profile
- posts
- comments
- RSVP
- support
- donations
- receipts
- audit logs

Do not assume all records can be deleted together.

## 8. Communication Preferences
Newsletter subscription must be explicit and unsubscribe must work.

Essential security/account messages may remain necessary.

## 9. Retention
Retention periods for verification evidence, finance, receipts, support, and audit logs are TBD and require policy/finance review.

## 10. Technical Privacy Rules
- explicit response DTOs/schemas,
- least-privilege queries,
- server-side enforcement,
- private object storage for sensitive uploads,
- no unnecessary personal data in logs.
