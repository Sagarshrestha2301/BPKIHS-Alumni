---

title: BPKIHS Alumni Association — Open Decisions
status: Active
owner: Project Lead
version: 0.4
last_updated: 2026-09-30
tags: [bpkihs, decisions, requirements, planning]
-------------------------------------------------

# Open Decisions

> [!warning] Purpose
> This document is the authoritative register of unresolved product, business, policy, data, privacy, and operational decisions that may affect implementation.
>
> **Do not convert an OPEN or BOARD DECISION REQUIRED item into application behavior without an explicit decision.**

## 1. Decision Status

Use these statuses consistently:

| Status                      | Meaning                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| **OPEN**                    | A decision is unresolved and implementation must not assume an answer.                       |
| **BOARD DECISION REQUIRED** | The Association/Board must explicitly approve the policy or business rule.                   |
| **PROPOSED**                | An implementation recommendation exists, but it is not an approved business decision.        |
| **RESOLVED**                | A decision has been explicitly accepted and may be treated as an implementation requirement. |
| **OUT OF SCOPE**            | Explicitly excluded from the current release/scope.                                          |

### Authority rule

`15 - Decision Log.md` records accepted technical decisions and their rationale.

This document records unresolved decisions.

When a proposed technical choice conflicts with an unresolved product or policy decision, the unresolved product/policy decision takes precedence.

---

# 2. Current Implementation Boundary

The current backend foundation intentionally implements only the domain that is sufficiently defined:

```text
User
  ↓
AlumniProfile
  ↓
Programme
  ↓
Batch
  ↓
AlumniVerification
  ↓
VerificationAuditEvent
```

Currently implemented:

* account registration/authentication,
* email verification,
* alumni profile creation/update,
* programme and batch selection,
* verification claim submission,
* verification status retrieval,
* verification audit events,
* authenticated-user ownership boundaries.

The following are intentionally **not yet implemented** because their business rules remain unresolved:

* staff verification review,
* evidence upload,
* request-information workflow,
* rejection/resubmission workflow,
* appeals,
* suspension rules,
* public alumni directory,
* community features,
* fundraising/payment processing,
* event registration,
* newsletter automation,
* staff role/permission administration.

---

# 3. Established Technical Decisions

These decisions are already established elsewhere and should not be reopened through this document unless the Association changes the requirements.

| Area                        | Established direction                                            | Status       |
| --------------------------- | ---------------------------------------------------------------- | ------------ |
| Application architecture    | Next.js App Router modular monolith                              | **RESOLVED** |
| Language                    | TypeScript                                                       | **RESOLVED** |
| Database                    | PostgreSQL                                                       | **RESOLVED** |
| ORM                         | Prisma                                                           | **RESOLVED** |
| Authentication              | Better Auth                                                      | **RESOLVED** |
| Session approach            | Database-backed sessions                                         | **RESOLVED** |
| Validation                  | Zod                                                              | **RESOLVED** |
| Styling                     | Tailwind CSS                                                     | **RESOLVED** |
| Object storage              | S3-compatible storage                                            | **RESOLVED** |
| Testing                     | Vitest + Playwright                                              | **RESOLVED** |
| Source control/CI direction | GitHub + GitHub Actions                                          | **RESOLVED** |
| Backend architecture        | No separate Express backend; use Next.js server/API capabilities | **RESOLVED** |
| Email                       | Resend integration                                               | **RESOLVED** |
| Database access             | Server-side Prisma access                                        | **RESOLVED** |

These technical choices are separate from unresolved business decisions such as verification authority, privacy, payment provider, or final MVP scope.

---

# 4. Blocking Product and Business Decisions

## DEC-OD-001 — Payment Provider

**Status:** BOARD DECISION REQUIRED

### Question

Which payment provider(s) will the Association officially use for online donations?

Candidates currently discussed include:

* eSewa
* Khalti
* another provider
* multiple providers

### Must determine

* merchant-account ownership,
* legal/account holder,
* settlement account,
* supported currencies,
* supported payment methods,
* webhook/callback requirements,
* refund process,
* reconciliation responsibility,
* transaction verification responsibility.

### Why it matters

The payment provider affects the payment API, callback flow, transaction model, testing strategy, deployment configuration, and financial operations.

**Do not implement a production payment integration until selected.**

---

## DEC-OD-002 — Alumni Verification Evidence Policy

**Status:** BOARD DECISION REQUIRED

### Question

What evidence model should be used to establish alumni identity?

Possible models:

1. Association-record matching
2. BPKIHS-record matching
3. User-uploaded evidence
4. Hybrid model
5. Another Association-approved process

### Must determine

* acceptable evidence,
* when evidence is required,
* who can access evidence,
* reviewer authority,
* retention period,
* deletion rules,
* privacy requirements,
* file-size/type restrictions if uploads are used,
* whether evidence is visible to the applicant,
* whether evidence can be reused for re-verification.

### Current implementation

Evidence upload is intentionally **not implemented**.

---

## DEC-OD-003 — Final MVP Scope

**Status:** BOARD DECISION REQUIRED

### Question

Which capabilities belong in the first production release?

Potential areas:

* authentication,
* alumni profile,
* verification,
* alumni directory,
* events,
* community,
* fundraising,
* newsletter,
* support/contact,
* public institutional website.

### Must determine

For every major capability:

```text
MVP
Phase 2
Future
Out of Scope
```

### Current engineering boundary

Authentication, profile, and initial verification claim functionality are being developed as the foundation.

Community, fundraising, events, newsletter, and other broader platform features must not be assumed to be MVP solely because they appear in the broader product vision.

---

## DEC-OD-004 — Production Hosting

**Status:** BOARD DECISION REQUIRED

### Question

Where will the production platform be hosted?

A proposed technical direction has been discussed around:

* Vercel
* managed PostgreSQL
* S3-compatible object storage

However, hosting remains subject to confirmation.

### Must determine

* hosting provider,
* database provider,
* object-storage provider,
* production region,
* backup requirements,
* disaster recovery expectations,
* operational ownership,
* expected budget.

---

## DEC-OD-005 — Existing Alumni Data Source

**Status:** BOARD DECISION REQUIRED

### Question

Does the Association have an authoritative alumni/member dataset that may be used for verification?

### Must determine

* source,
* owner,
* authorization to use,
* fields available,
* data quality,
* freshness,
* historical coverage,
* duplicate handling,
* normalization requirements,
* import/update process,
* privacy restrictions.

### Current assumption

No existing source is assumed to be available.

The system therefore supports a user claim and verification queue without pretending that historical records exist.

---

## DEC-OD-006 — Alumni Directory Access Model

**Status:** BOARD DECISION REQUIRED

### Question

Who may discover and view alumni profiles?

Possible audiences:

* public visitors,
* authenticated users,
* email-verified users,
* verified alumni only,
* selected Association staff.

### Important distinction

These are separate decisions:

```text
Directory listing
Search
Filtering
Individual profile viewing
Direct profile URLs
Search-engine indexing
```

They must not automatically inherit the same permission.

### Current implementation

No public alumni directory API is implemented.

---

## DEC-OD-007 — Registered vs Verified Capabilities

**Status:** BOARD DECISION REQUIRED

### Question

What can a user do before alumni verification?

At minimum, distinguish:

```text
Guest
Registered
Email-verified
Verification pending
Verification under review
Verified alumni
Rejected claimant
Suspended user
Staff/admin
```

### Must determine

Which capabilities require:

* an account,
* verified email,
* a submitted alumni claim,
* verified alumni status,
* a staff role.

Examples requiring explicit policy:

* profile editing,
* directory access,
* event RSVP,
* community posting,
* commenting,
* donations,
* messaging,
* alumni-only content.

### Important modeling rule

Do not treat:

```text
emailVerified = true
```

as equivalent to:

```text
alumni verified
```

The core verification rule remains:

> **Email verified ≠ Alumni verified**

---

# 5. Verification Decisions

## DEC-OD-008 — Eligible Alumni Definition

**Status:** BOARD DECISION REQUIRED

### Current working rule

Graduates of BPKIHS programmes are the core alumni identity.

### Must determine

Whether the Association also recognizes:

* former students who did not graduate,
* faculty/teachers,
* staff,
* honorary members,
* affiliated professionals,
* other categories.

### Implementation impact

This affects registration wording, verification eligibility, directory membership, and profile state.

---

## DEC-OD-009 — Verification Record Matching

**Status:** BOARD DECISION REQUIRED

### Question

If historical records are available, how should a claim be matched?

### Must determine

* accepted identifiers,
* programme matching,
* batch matching,
* admission-year matching,
* graduation-year matching,
* name matching,
* confidence thresholds,
* duplicate handling,
* manual-review rules.

### Current implementation

The system records the claimant's selected:

```text
programme
batch
admission year
graduation year
```

It does not yet perform automated historical-record matching.

---

## DEC-OD-010 — Verification Reviewer Authority

**Status:** BOARD DECISION REQUIRED

### Question

Which staff role(s) may review and approve alumni verification?

### Must determine

* reviewer role,
* approver role,
* whether one person may both review and approve,
* whether multiple approvals are required,
* whether Super Admin can override decisions,
* who can view evidence,
* who can reject,
* who can request information,
* who can suspend verification.

### Current implementation

No staff review endpoint exists.

Do not infer reviewer authority from the existence of future `Admin`, `Super Admin`, or other role names.

---

## DEC-OD-011 — Verification Status Lifecycle

**Status:** BOARD DECISION REQUIRED

### Proposed statuses

```text
NOT_STARTED
PENDING
UNDER_REVIEW
VERIFIED
REJECTED
SUSPENDED
```

These are **proposed workflow states**, not approved business policy.

### Must determine

* valid transitions,
* terminal states,
* whether `REJECTED` is terminal,
* whether `SUSPENDED` is temporary,
* whether a rejected claim creates a new claim on resubmission,
* whether a verified alumnus can return to pending/review.

### Current implementation

The database can represent these states, but the application does not implement staff transitions.

---

## DEC-OD-012 — Request Information Workflow

**Status:** BOARD DECISION REQUIRED

### Question

What does "Request Information" mean operationally?

### Must determine

* information requested,
* who sends the request,
* how the applicant responds,
* whether new evidence is allowed,
* status used while waiting,
* response deadline,
* expiration behavior,
* whether the case returns to review automatically.

The current status list does not independently define this workflow.

---

## DEC-OD-013 — Rejection and Resubmission

**Status:** BOARD DECISION REQUIRED

### Questions

* Can a rejected applicant submit again?
* Is there a waiting period?
* Is the original claim retained?
* Must the applicant provide additional evidence?
* Is the rejection reason shown to the applicant?
* Who may reopen a rejected case?

This decision determines whether verification history contains multiple claims per alumni profile.

---

## DEC-OD-014 — Appeals

**Status:** BOARD DECISION REQUIRED

### Questions

* Is an appeal allowed?
* Who receives appeals?
* What is the appeal deadline?
* Who reviews an appeal?
* Can the original reviewer decide the appeal?
* What audit information is required?
* What is the final escalation path?

No appeal workflow should be implemented until this is approved.

---

## DEC-OD-015 — Re-verification

**Status:** BOARD DECISION REQUIRED

### Question

What triggers re-verification?

Possible triggers requiring policy decisions:

* profile changes,
* correction of programme/batch,
* suspected duplicate account,
* administrative review,
* new Association data,
* reported identity issue,
* prolonged inactivity,
* other Association-defined events.

### Must also determine

What happens to verified-alumni access while re-verification is pending.

---

## DEC-OD-016 — Suspension

**Status:** BOARD DECISION REQUIRED

### Question

What does `SUSPENDED` mean?

The Association must distinguish between:

```text
Account suspension
Verification suspension
Directory suspension
Community suspension
```

### Must determine

* grounds,
* authority,
* duration,
* notice,
* appeal/review,
* affected capabilities,
* whether login remains possible,
* whether profile remains visible,
* whether verification is revoked or merely paused.

Do not use the verification `SUSPENDED` state as an implicit account-suspension mechanism.

---

# 6. Privacy Decisions

## DEC-OD-017 — Profile Visibility Model

**Status:** BOARD DECISION REQUIRED

### Question

Which profile fields are visible to which audience?

At minimum consider:

```text
Name
Programme
Batch
Admission year
Graduation year
Specialization
Current position
Organization
City
Country
Further study
Further-study institution
Biography
Profile photo
```

### Audience dimensions

Potentially:

```text
Public
Authenticated users
Verified alumni
Association staff
Profile owner
```

### Important

Visibility should be decided **per field**, not merely by setting one global profile visibility flag.

The current database has `profileVisibility`, but this should not be treated as the final privacy policy.

---

## DEC-OD-018 — Contact Information Visibility

**Status:** BOARD DECISION REQUIRED

### Questions

* Is email visible?
* Is phone number collected?
* Is phone searchable?
* Can users contact each other through the platform instead?
* Can staff access contact information?
* Can contact information appear in the directory?

No contact information should be exposed merely because an account is verified.

---

## DEC-OD-019 — Search Engine Indexing

**Status:** BOARD DECISION REQUIRED

### Question

Can public alumni profiles be indexed by search engines?

This is separate from whether a profile can be viewed by a public visitor.

Possible policy:

```text
Public profile view ≠ Search-engine indexing
```

The final decision must be reflected in route behavior and metadata/robots configuration.

---

## DEC-OD-020 — Account Deletion and Data Retention

**Status:** BOARD DECISION REQUIRED

### Question

What happens when a user requests account deletion?

Must determine treatment of:

* User account,
* AlumniProfile,
* verification claims,
* verification audit events,
* posts,
* event registrations,
* donations,
* payment transactions,
* receipts,
* support messages,
* media assets,
* newsletter subscriptions.

### Principle

Financial and audit records must not be blindly cascade-deleted.

Retention must be defined according to applicable legal, financial, operational, and Association requirements.

---

## DEC-OD-021 — Verification Evidence Retention

**Status:** BOARD DECISION REQUIRED

This becomes mandatory if evidence upload is approved.

### Must determine

* retention period,
* deletion trigger,
* who can access evidence,
* whether evidence is encrypted at rest,
* whether downloads are allowed,
* audit requirements,
* treatment after account deletion,
* treatment after verification rejection.

---

# 7. Finance Decisions

## DEC-OD-022 — Receipt Wording and Numbering

**Status:** BOARD DECISION REQUIRED

### Must determine

* receipt wording,
* official Association details,
* receipt numbering,
* issuing authority,
* correction/reissue procedure,
* whether tax-related language is permitted.

No tax-deductibility claim should be implemented without appropriate Association/legal/finance confirmation.

---

## DEC-OD-023 — Tax-Deductibility Claims

**Status:** BOARD DECISION REQUIRED

### Question

Can the platform describe donations as tax-deductible?

Any such claim requires confirmation from the Association and appropriate legal/financial authority.

---

## DEC-OD-024 — Refund and Reconciliation

**Status:** BOARD DECISION REQUIRED

### Must determine

* who may issue refunds,
* refund eligibility,
* partial refunds,
* failed payments,
* duplicate payments,
* chargebacks,
* reconciliation responsibility,
* reconciliation frequency,
* correction procedures.

---

## DEC-OD-025 — International Donations and Multi-Currency

**Status:** PROPOSED

Current planning treats international donations and multi-currency support as a future/Phase-2 concern.

This remains subject to the final MVP and payment-provider decision.

Do not treat it as a confirmed permanent exclusion.

---

# 8. Community Decisions

## DEC-OD-026 — Community Moderation Model

**Status:** BOARD DECISION REQUIRED

### Must determine

* who can post,
* prohibited content,
* reporting process,
* moderation authority,
* pre-moderation vs post-publication moderation,
* removal process,
* appeals,
* moderation audit requirements.

---

## DEC-OD-027 — Comments

**Status:** BOARD DECISION REQUIRED

Determine whether comments are:

```text
MVP
Phase 2
Future
Out of Scope
```

---

## DEC-OD-028 — Reactions

**Status:** BOARD DECISION REQUIRED

Determine whether posts support:

* likes,
* reactions,
* another interaction model,
* no reactions.

---

## DEC-OD-029 — Sharing

**Status:** BOARD DECISION REQUIRED

Determine whether alumni posts can be shared:

* internally,
* publicly,
* through direct links,
* to external social platforms.

Privacy implications must be considered alongside the directory/profile policy.

---

# 9. Identity and Data Decisions

## DEC-OD-030 — Programme Taxonomy

**Status:** BOARD DECISION REQUIRED

### Current technical principle

Programme names must be stored as configurable database data rather than hard-coded into application logic.

### Must determine

* authoritative programme list,
* programme names,
* codes,
* category/level,
* active/inactive states,
* historical programme names,
* programme mergers/renaming.

---

## DEC-OD-031 — Roll / Registration Number

**Status:** BOARD DECISION REQUIRED

### Question

Should alumni records contain a roll number, registration number, student ID, or another institutional identifier?

### Must determine

* whether collected,
* whether required,
* who may view it,
* whether searchable,
* whether used for automated verification,
* retention/privacy requirements.

Do not add it to the production schema merely because it may be useful for matching.

---

## DEC-OD-032 — Alumni Population Estimate

**Status:** BOARD DECISION REQUIRED

### Questions

* How many alumni should the platform initially support?
* What is the expected Year-1 registration volume?
* What historical records are available?
* What growth should infrastructure planning assume?

This affects capacity planning but should not be used to invent fake alumni data.

---

# 10. Events Decisions

## DEC-OD-033 — Event Visibility

**Status:** BOARD DECISION REQUIRED

Determine whether events are:

* public,
* authenticated-user only,
* verified-alumni only,
* staff-only.

---

## DEC-OD-034 — Event RSVP Eligibility

**Status:** BOARD DECISION REQUIRED

Determine who may RSVP:

* any visitor,
* registered user,
* email-verified user,
* verified alumni,
* invited users only.

This must be defined separately from event visibility.

---

## DEC-OD-035 — Event Capacity and Registration Rules

**Status:** BOARD DECISION REQUIRED

If capacity is used, determine:

* capacity enforcement,
* waitlist,
* cancellation,
* duplicate RSVP behavior,
* registration opening/closing rules,
* attendance tracking.

---

## DEC-OD-036 — Paid Events

**Status:** BOARD DECISION REQUIRED

Determine whether events may require payment.

If yes, event payments must align with the Association's approved payment and finance model.

---

# 11. Newsletter Decisions

## DEC-OD-037 — Newsletter Subscription

**Status:** BOARD DECISION REQUIRED

Determine whether registration automatically subscribes a user or whether explicit opt-in is required.

---

## DEC-OD-038 — Newsletter Operations

**Status:** BOARD DECISION REQUIRED

Determine:

* sending frequency,
* sender identity,
* content approval,
* unsubscribe behavior,
* staff authority,
* subscriber data retention.

---

# 12. Content and Association Operations

## DEC-OD-039 — Domain

**Status:** BOARD DECISION REQUIRED

Determine the official production domain.

Do not hard-code a final public domain into application/business logic before confirmation.

---

## DEC-OD-040 — Brand Assets

**Status:** BOARD DECISION REQUIRED

Provide approved:

* Association logo,
* BPKIHS logo usage rules,
* colors,
* typography,
* imagery,
* official naming,
* brand guidelines.

---

## DEC-OD-041 — Board and Leadership Content

**Status:** BOARD DECISION REQUIRED

Determine:

* current Board members,
* roles,
* terms,
* biographies,
* photographs,
* past Board records,
* publication approval process.

---

# 13. Additional Authorization Decisions

## DEC-OD-042 — Staff Role Model

**Status:** BOARD DECISION REQUIRED

The platform may eventually require roles such as:

```text
Admin
Super Admin
Verification Reviewer
Moderator
Finance Manager
Content Manager
Technical Operator
```

These names must not automatically become permissions.

### Must determine

For each role:

* capabilities,
* read/write scope,
* sensitive-data access,
* approval authority,
* whether role assignment is restricted,
* whether separation of duties is required.

---

## DEC-OD-043 — Role and Permission Administration

**Status:** BOARD DECISION REQUIRED

Determine:

* who can assign roles,
* who can revoke roles,
* whether Super Admin is the only role-management authority,
* whether role changes require audit,
* whether multiple administrators are required for sensitive changes.

---

## DEC-OD-044 — Audit Access

**Status:** BOARD DECISION REQUIRED

Determine who can view:

* authentication/security events,
* verification audit events,
* moderation actions,
* financial audit information,
* role changes,
* account changes.

Audit access itself must be authorized and auditable.

---

# 14. Decisions That Must Not Be Assumed

The following are explicitly **not currently approved** merely because they exist in the schema or documentation:

```text
Verification status transitions
Reviewer authority
Evidence requirements
Evidence storage
Rejection behavior
Resubmission
Appeals
Suspension behavior
Re-verification
Public directory access
Per-field profile visibility
Search-engine indexing
Account deletion behavior
Data retention periods
Payment provider
Finance permissions
Community moderation authority
Event RSVP eligibility
Final MVP scope
Final alumni eligibility
Historical alumni data availability
```

---

# 15. Current Backend Implementation Rules

Until the above decisions are resolved, engineering should follow these rules.

### Rule 1 — Do not invent policy

If a behavior depends on a Board decision, keep the implementation boundary narrow rather than choosing a policy silently.

### Rule 2 — Enforce security independently of policy

Even when a product decision is unresolved:

* authenticate protected requests,
* authorize using server-side identity,
* validate input,
* scope database access to the authenticated user,
* avoid exposing unnecessary fields,
* never trust client-supplied authorization state.

### Rule 3 — Preserve historical verification information

A verification claim must retain the information that was actually submitted rather than depending entirely on the user's mutable current profile.

Current implementation therefore records:

```text
claimedProgrammeId
claimedBatchId
claimedAdmissionYear
claimedGraduationYear
```

### Rule 4 — Do not expose future admin actions

The database may contain proposed workflow states, but that does not authorize an API to let users or administrators transition those states.

### Rule 5 — Do not build speculative Phase-2 tables

Community, fundraising, events, newsletter, support, and other future entities should be introduced when their requirements are sufficiently defined.

---

# 16. Decision Priority

For planning purposes:

## Blocking the next verification/admin implementation

```text
DEC-OD-002  Evidence policy
DEC-OD-005  Existing alumni data
DEC-OD-006  Directory access
DEC-OD-007  Registered vs verified capabilities
DEC-OD-008  Alumni eligibility
DEC-OD-009  Record matching
DEC-OD-010  Reviewer authority
DEC-OD-011  Verification lifecycle
DEC-OD-012  Request information
DEC-OD-013  Rejection/resubmission
DEC-OD-014  Appeals
DEC-OD-015  Re-verification
DEC-OD-016  Suspension
DEC-OD-017  Profile visibility
DEC-OD-020  Account deletion/retention
```

## Blocking payment implementation

```text
DEC-OD-001  Payment provider
DEC-OD-022  Receipt rules
DEC-OD-023  Tax claims
DEC-OD-024  Refund/reconciliation
```

## Blocking community implementation

```text
DEC-OD-026  Moderation
DEC-OD-027  Comments
DEC-OD-028  Reactions
DEC-OD-029  Sharing
```

## Blocking events implementation

```text
DEC-OD-034  RSVP eligibility
DEC-OD-035  Registration rules
DEC-OD-036  Paid events
```

---

# 17. Current Decision Summary

As of **2026-09-30**:

### Resolved technical foundation

```text
Next.js + TypeScript
PostgreSQL
Prisma
Better Auth
Zod
Resend
S3-compatible storage
Vitest
Playwright
GitHub Actions
```

### Implemented foundation

```text
Authentication
Email verification
Alumni profile
Programme
Batch
Verification claim
Verification status retrieval
Verification audit event
```

### Awaiting Association/Board decisions

```text
Who qualifies as alumni
How alumni are verified
What evidence is acceptable
Who may approve verification
Verification state transitions
Rejection/resubmission
Appeals
Suspension
Re-verification
Directory access
Profile privacy
Data retention/deletion
Staff permissions
Payment provider
Finance rules
Community rules
Event rules
Final MVP scope
```

### Engineering principle

> **Build what is decided. Isolate what is uncertain. Never turn an unresolved business assumption into permanent application behavior.**
