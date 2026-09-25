---
title: BPKIHS Alumni Association — Product Requirements
status: Planning
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, requirements, srs]
---
# Product Requirements
> [!note] Requirement vocabulary
> **Confirmed** = established in current project material. **Proposed** = recommended but awaiting Association approval. **TBD** = requires a real decision.

## 1. Scope
The platform is an official alumni website and operating platform covering institutional content, alumni identity, verification, directory, events, fundraising, donations, support, administration, and a later community/newsletter layer.

## 2. Authentication
### FR-AUTH-001 — Registration
Eligible BPKIHS graduates can create an account. **Confirmed.**

### FR-AUTH-002 — Email OTP
Email ownership is verified with a one-time password. OTP expires, is single-use, has attempt limits, resend throttling, and is not logged. **Confirmed.**

### FR-AUTH-003 — Password
User creates a password after initial email verification. Passwords are securely hashed and never stored in plaintext. **Confirmed.**

### FR-AUTH-004 — Login
Users can log in with email and password. **Confirmed.**

### FR-AUTH-005 — Password reset
Forgotten passwords can be reset through an expiring single-use recovery mechanism. **Confirmed.**

### FR-AUTH-006 — Session management
Authenticated users use secure server-managed sessions. **Proposed/technical decision.**

## 3. Alumni
### FR-ALU-001 — Profile
A registered graduate can create and maintain an alumni profile.

Potential data:
- full name
- profile photo
- programme
- batch
- admission year
- graduation year
- further study/degree/institution/fellowship
- specialisation
- current position
- organization
- city/country
- biography/personal note

Exact fields: **TBD**.

### FR-ALU-002 — Ownership
Alumni can modify their own profiles; admins need explicit permission for administrative edits.

### FR-ALU-003 — Privacy
Supported profile fields have explicit visibility controls.

### FR-ALU-004 — Verification distinction
Registration/email verification does not automatically make an alumnus verified.

### FR-ALU-005 — Verified status
The system maintains a distinct alumni verification state.

## 4. Directory
### FR-DIR-001
Provide an alumni directory.

### FR-DIR-002
Search by permitted fields such as name, specialisation, and location/country.

### FR-DIR-003
Filter by programme, batch/year, specialisation, location, and country.

### FR-DIR-004
Use pagination for directory results.

### FR-DIR-005
Apply privacy and verification rules before returning profiles.

### BR-DIR-001
Only profiles eligible under the approved directory-access rule may appear publicly.

**Directory access model: TBD.**

## 5. Verification
### FR-VER-001
An alumnus must undergo Association verification before receiving verified status.

Potential verification inputs:
- Association records
- BPKIHS/registrar records if authorized
- submitted programme/batch information
- additional evidence if required

### FR-VER-002
The system supports a review queue.

### FR-VER-003
Administrators can approve, reject, or request more information according to policy.

### BR-VER-001
Email verification is not proof of alumni status.

Verification evidence policy: **TBD**. See [[10 - Alumni Verification]].

## 6. Events
### FR-EVT-001
Display upcoming and past events.

### FR-EVT-002
Events can have title, description, date/time, location, media, and registration information.

### FR-EVT-003
Eligible users can RSVP.

### BR-EVT-001
A user cannot have duplicate active RSVP records for one event.

## 7. Fundraising & Donations
### FR-FUND-001
Association can publish fundraising goals/campaigns.

### FR-FUND-002
Platform supports online donations.

### FR-FUND-003
Every monetary value includes currency.

### FR-FUND-004
Donation records retain amount, currency, campaign, provider/reference, status, permitted donor data, and timestamps.

### FR-FUND-005
Successful donation status is based on trusted provider verification, never client-side state.

### BR-FUND-001
Payment processing is idempotent; a transaction cannot be counted twice.

### FR-FUND-006
Successful donations trigger an approved acknowledgment/receipt workflow.

### FR-FUND-007
Tribute donations are supported if approved: batch, mentor, alumnus, or other.

### FR-FUND-008
Public fundraising pages show approved transparency summaries.

### FR-FUND-009
Nepal donations are MVP.

### FR-FUND-010
International donations are Phase 2 proposed; not MVP unless Board changes scope.

## 8. Community — Phase 2 Proposed
### FR-COM-001
Eligible authenticated users can create posts.

### FR-COM-002
Comments are Phase 2 proposed.

### FR-COM-003
Like/reactions are Phase 2 proposed.

### FR-COM-004
Sharing needs definition before implementation.

### FR-COM-005
Users can report inappropriate content.

### FR-COM-006
Authorized staff can moderate reported/reviewable content.

## 9. Newsletter — Phase 2 Proposed
### FR-NEWS-001
Users manage newsletter subscription state.

### FR-NEWS-002
Unsubscribe must be respected for non-essential newsletter messages.

### FR-NEWS-003
Automated digest is Phase 2 proposed.

## 10. Support
### FR-SUP-001
Provide general contact.
### FR-SUP-002
Support account, verification, and donation/receipt issues.
### FR-SUP-003
Authorized staff manage support requests.
### FR-SUP-004
FAQ is available.

## 11. Governance
### FR-GOV-001
Current Association leadership information.
### FR-GOV-002
Previous boards by term/year.
### FR-GOV-003
Relationship between Association and BPKIHS.

## 12. Administration
### FR-ADM-001
Manage alumni verification.
### FR-ADM-002
Manage approved content.
### FR-ADM-003
Manage events.
### FR-ADM-004
Authorized finance staff manage/review donations and related financial records.
### FR-ADM-005
Manage content reports/moderation.
### FR-ADM-006
Manage support.
### FR-ADM-007
Record important administrative actions.

## 13. Non-Functional Requirements
### NFR-SEC-001
Validate external input server-side.
### NFR-SEC-002
Enforce authorization server-side.
### NFR-SEC-003
Protect credentials.
### NFR-SEC-004
Keep production secrets out of source control.
### NFR-SEC-005
Secure and limit uploads.
### NFR-SEC-006
Rate-limit sensitive endpoints.
### NFR-SEC-007
Secure and verify payment workflows.
### NFR-SEC-008
Audit important administrative/financial actions.

### NFR-PRV-001
Use data minimization.
### NFR-ACC-001
Target WCAG 2.2 AA where practical.
### NFR-RESP-001
Support mobile, tablet, desktop.
### NFR-REL-001
Provide backups, monitoring, error tracking, and recovery procedures.
### NFR-MNT-001
Favor clear modules, strong typing, tests, and documentation.

## 14. MVP Candidate
- Public website
- Authentication/OTP/login/reset
- Alumni profile
- Privacy
- Verification
- Directory/search/filter
- Admin operations
- Events/RSVP
- Nepal donations
- Receipts
- Basic financial transparency
- Support/contact
- Privacy/Terms/accessibility
- Audit logs
- Production backups/monitoring

Community/newsletter/international payments are Phase 2 proposed.

## 15. Acceptance Principle
A feature is complete when appropriate UI, backend, database behavior, validation, authorization, security, error handling, tests, and documentation exist.
