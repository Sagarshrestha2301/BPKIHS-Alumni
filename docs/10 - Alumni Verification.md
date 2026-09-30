---
title: BPKIHS Alumni Association — Alumni Verification
status: Draft
owner: Project Lead
version: 0.3
last_updated: 2026-09-30
tags: [bpkihs, verification]
---
# Alumni Verification

> [!warning] Blocking business decision
> The Association must define evidence and approval rules before final verification schema/UI.

## Purpose
Confirm that a registered person is an eligible BPKIHS graduate.

## Core Rule
```text
Email verified ≠ Alumni verified
```

## Eligibility
Current working rule: graduates of BPKIHS programmes are the core alumni identity.

## Potential Sources
- Association alumni/member records
- BPKIHS records where authorized
- submitted programme/batch information
- additional evidence if policy requires it

## Existing Data Flow
```text
Historical records
 ↓
Inspect
 ↓
Normalize
 ↓
Deduplicate
 ↓
Map programme/batch
 ↓
Match claim
 ↓
High-confidence match / manual review
```

## No Existing Data Flow
```text
User claim
 ↓
Verification queue
 ↓
Admin review
 ↓
Approve / Reject / Request information
```

## Proposed Statuses
```text
NOT_STARTED
PENDING
UNDER_REVIEW
VERIFIED
REJECTED
SUSPENDED
```

## Evidence Policy — TBD
Possible approaches:
1. Record matching
2. User-uploaded evidence
3. Hybrid

Need to define:
- acceptable evidence,
- who reviews,
- reviewer authority,
- retention,
- privacy,
- retry/resubmit,
- appeal,
- suspension.

## Evidence Security
If files are required:
- private object storage,
- authorized access only,
- upload validation,
- size limits,
- retention policy,
- appropriate audit trail.

## Initial Implementation Boundary

The initial migration and API establish a claim record, immutable programme/batch
snapshot, status history, and the alumnus' own submission/status endpoints.

- A registered user must have a verified email, programme, and batch before
  submitting a claim.
- Evidence upload and staff review actions are intentionally not implemented.
- The database can store the proposed workflow states, but this does **not**
  approve reviewer authority, evidence, resubmission, appeal, or suspension rules.

## Admin Queue
Show:
- applicant,
- programme,
- batch,
- claimed graduation year,
- submitted date,
- status,
- reviewer,
- evidence state where applicable.

## Actions
```text
Approve
Reject
Request Information
Suspend
```

## Audit
Record reviewer, timestamp, old/new state, decision reason.

## Questions
- Can rejected users resubmit?
- Is appeal allowed?
- What triggers re-verification?
- Who can suspend?
