---
title: BPKIHS Alumni Association — Database Design
status: Draft
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, database, postgresql, prisma]
---
# Database Design
> [!warning] This is a domain draft. Final schema depends on privacy, verification, payment, and permissions decisions.

## Core Entities
```text
User
AlumniProfile
Programme
Batch
Verification
RateLimit
Role
Permission
RolePermission
UserRole

Post
PostTag
PostReport
ModerationAction

Event
EventRSVP
MediaAsset

FundraisingGoal
Donation
PaymentTransaction
Receipt
FundAllocation

NewsletterSubscription
SupportTicket
SupportMessage

BoardMember
BoardTerm
Page
FAQ
Notification
AuditLog
```

## User
Potential fields:
- id
- email
- account status
- email_verified_at
- authentication relation
- created_at
- updated_at

## RateLimit

Better Auth stores shared request-throttle state in this operational table.

```text
id (primary key)
key (unique)
count
last_request (epoch milliseconds)
```

This is not user activity history and must not be used as an audit log.

## AlumniProfile
Potential fields:
- id
- user_id
- first_name
- last_name
- programme_id
- batch_id
- admission_year
- graduation_year
- specialisation
- current_position
- organization
- city
- country
- further_study
- further_study_institution
- biography/personal_note
- profile_photo_asset_id
- verification_status
- profile_visibility
- timestamps

## Programme
```text
id
name
code
category/level
status
created_at
updated_at
```
The taxonomy must be configurable; do not hard-code a few programme names.

## Batch
```text
id
programme_id
label
admission_year
graduation_year
status
```
Current working assumption: batch year = admission year. Graduation year is separate.

## Verification
```text
id
alumni_profile_id
status
submitted_at
reviewed_at
reviewed_by
decision_reason
review_notes
```
Evidence fields depend on [[10 - Alumni Verification]].

## Community
```text
Post
  id
  author_id
  body
  status
  tag_id
  created_at
  updated_at

PostReport
  id
  post_id
  reporter_id
  reason
  status
  reviewed_by
  reviewed_at
```
Community is Phase 2 proposed.

## Events
```text
Event
  id
  title
  description
  location
  starts_at
  ends_at
  capacity
  registration_open_at
  registration_close_at
  status
  cover_media_id

EventRSVP
  event_id
  user_id
  status
  created_at
  updated_at
```
Constraint: `UNIQUE(event_id, user_id)` for active RSVP model as designed.

## Fundraising
```text
FundraisingGoal
  id
  title
  description
  target_amount
  currency
  status
  starts_at
  ends_at
```

## Donations
```text
Donation
  id
  donor_user_id nullable
  fundraising_goal_id
  amount
  currency
  status
  donor_name
  anonymous
  tribute_type
  tribute_text
  created_at
  updated_at
```

## PaymentTransaction
```text
id
donation_id
provider
provider_transaction_id
provider_reference
amount
currency
status
provider_metadata
verified_at
created_at
updated_at
```
Provider reference/transaction identifiers should be unique where appropriate.

## Receipt
```text
id
donation_id
receipt_number
issued_at
document_asset_id
```
Receipt wording/numbering rules are pending Finance confirmation.

## FundAllocation
Potential fields:
```text
id
fundraising_goal_id
title
description
amount
currency
supporting_document_asset_id
recorded_by
recorded_at
status
```

## MediaAsset
```text
id
object_key
original_name
media_type
size_bytes
owner_user_id
created_at
```
Store file bytes in object storage, not PostgreSQL.

## Support
```text
SupportTicket
  id
  requester_id
  category
  subject
  status
  assigned_to
  created_at
  updated_at

SupportMessage
  id
  ticket_id
  author_id
  body
  created_at
```

## AuditLog
```text
id
actor_user_id
action
entity_type
entity_id
metadata
created_at
```
Avoid putting secrets or unnecessary personal data in metadata.

## Likely Indexes
- User.email
- AlumniProfile.programme_id
- AlumniProfile.batch_id
- AlumniProfile.country
- AlumniProfile.specialisation
- AlumniProfile.verification_status
- Post.status / created_at
- Event.starts_at
- Donation.fundraising_goal_id / status / created_at
- PaymentTransaction.provider_transaction_id
- AuditLog.actor_user_id / created_at

## Deletion
Do not blindly cascade-delete financial or audit records. Account deletion behavior must follow [[09 - Privacy Requirements]].

## Open Schema Questions
- exact profile fields
- evidence model
- directory visibility model
- final roles
- community timing
- finance allocation model
