# Batch 1 Review

## 1. Executive Summary

The Foundation documents establish the product direction and several technical choices, but they do not yet establish the policy needed to implement the alumni state model, authorization, verification, directory privacy, or payments. No confirmed decision directly conflicts with another confirmed decision. The material conflicts where a proposed or TBD policy is expressed as an available capability or route elsewhere.

The primary Batch 2 blockers are DEC-OD-002 (verification evidence), DEC-OD-005 (existing alumni data), DEC-OD-006 (directory access), DEC-OD-007 (registered versus verified capabilities), the final administrative authority model, and the payment/finance decisions DEC-OD-001 and DEC-OD-008 through DEC-OD-010. DEC-OD-003 (final MVP scope) is also required to resolve the community/newsletter and donation boundary.

### User-state assessment

| Required state | Assessment | Evidence / gap |
|---|---|---|
| Unauthenticated visitor | Clearly separated as **Guest**. | `02 - User Roles & Permissions.md`, §2; `04 - Sitemap.md`, Route Rules. |
| Registered user | Partially separated, but the role name “Registered Alumni” is used before alumni status is verified. | `02 - User Roles & Permissions.md`, §§1 and 3. It is unclear whether this state requires email verification and whether it includes rejected/pending claimants. |
| Email-verified user | Not separated as an authorization state. | `01 - Product Requirements.md`, §2, FR-AUTH-002 verifies email ownership, and `06 - Database Design.md`, User, has a potential `email_verified_at`; neither assigns capabilities or transitions to this state. |
| Unverified alumni | Not clearly defined. | `01 - Product Requirements.md`, §3, FR-ALU-004/005 distinguishes verification, while `10 - Alumni Verification.md`, Proposed Statuses, supplies only proposed workflow statuses. The relationship between registered, email-verified, not-started, pending, under-review, rejected, and unverified is unspecified. |
| Verified alumni | Clearly distinct in principle, but its final capability set is open. | `01 - Product Requirements.md`, §3, FR-ALU-004/005; `02 - User Roles & Permissions.md`, §4 and §11; DEC-OD-007. |
| Suspended user | Not separated from suspended verification. | `10 - Alumni Verification.md`, Proposed Statuses/Actions, lists `SUSPENDED`; `06 - Database Design.md`, User, separately has potential account status. There is no rule stating whether suspension blocks login, profile changes, directory visibility, RSVP, or only verification. |

Before implementation, document these as independent dimensions where appropriate: authentication/email status, alumni-verification workflow status, account status, and staff role/permission. This is a recommendation for a clear model, not a decision about allowed transitions or access.

## 2. Confirmed Decisions

- Requirement vocabulary is accepted: **Confirmed**, **Proposed**, **TBD**, and **Out of Scope** (`15 - Decision Log.md`, DEC-016).
- The accepted technical foundation is a modular monolith using Next.js App Router with TypeScript, managed PostgreSQL, Prisma, Better Auth with database-backed sessions, Zod, Tailwind CSS, S3-compatible storage, Vitest/Playwright, and GitHub Actions (`15 - Decision Log.md`, DEC-001 through DEC-010).
- Registration, email ownership verification by constrained OTP, password creation/storage, email/password login, and password reset are confirmed requirements (`01 - Product Requirements.md`, §2, FR-AUTH-001 through FR-AUTH-005).

The documents also state a separate alumni-verification principle, server-side security/authorization controls, and trusted-payment/idempotency rules (`01 - Product Requirements.md`, §§3, 5, 7, and 13; `10 - Alumni Verification.md`, Core Rule). They do not carry an explicit **Confirmed** or **Accepted** status in the reviewed material, so this report treats them as requirements requiring status/traceability clarification, rather than silently classifying them as Board-confirmed decisions.

The following are deliberately not treated as confirmed: final MVP contents, exact alumni eligibility, the verification workflow/statuses, the directory audience, the registered-versus-verified permission boundary, hosting, and any payment provider or finance policy.

## 3. Proposed Decisions

- Vercel plus managed PostgreSQL is proposed hosting, pending confirmation (`15 - Decision Log.md`, DEC-011).
- International donations and multi-currency are proposed for Phase 2, rather than confirmed out of scope (`15 - Decision Log.md`, DEC-012; `01 - Product Requirements.md`, §7, FR-FUND-010).
- “Batch year” meaning admission year, with graduation year separate, is proposed (`15 - Decision Log.md`, DEC-013; `06 - Database Design.md`, Batch).
- Graduates of BPKIHS programmes as the core alumni identity is proposed, not confirmed (`15 - Decision Log.md`, DEC-014; `10 - Alumni Verification.md`, Eligibility).
- Community feed and newsletter automation are proposed for Phase 2 (`15 - Decision Log.md`, DEC-015; `01 - Product Requirements.md`, §§8–9).
- Database-backed server-managed sessions are labelled a proposed technical decision in FR-AUTH-006, although Better Auth with database-backed sessions is accepted in DEC-005 (`01 - Product Requirements.md`, §2; `15 - Decision Log.md`, DEC-005). The decision log should remain the authority.
- The verification statuses and the Nepal fiscal year are proposed (`10 - Alumni Verification.md`, Proposed Statuses; `11 - Payment Flow.md`, Receipt). They must not be implemented as settled policy.

## 4. Open Decisions

The documented open-decision register contains the following unresolved groups:

- **Blocking product/implementation decisions:** payment provider (DEC-OD-001), evidence policy (DEC-OD-002), final MVP cut (DEC-OD-003), hosting (DEC-OD-004), existing alumni data source (DEC-OD-005), public directory model (DEC-OD-006), and registered-versus-verified capabilities (DEC-OD-007).
- **Finance:** receipt wording, tax-deductibility claims, and refund/reconciliation process (DEC-OD-008 through DEC-OD-010).
- **Community:** moderation, whether comments are MVP or Phase 2, reactions, and sharing (DEC-OD-011 through DEC-OD-014).
- **Identity/data inputs:** programme taxonomy, roll/registration-number use, alumni population, and Year-1 registration estimate (DEC-OD-015 through DEC-OD-018).
- **Content/infrastructure:** domain, brand assets, and Board content (DEC-OD-019 through DEC-OD-021).

The following material decisions are exposed by the review but are not separately recorded in `16 - Open Decisions.md`: the precise account-suspension effect; the relationship among email verification, an alumni claim, and verification workflow statuses; reviewer authority and separation of duties; re-verification triggers; request-information/resubmission/appeal rules; per-field profile visibility; retention/deletion treatment; and the definition of an eligible RSVP user. They should be added to the register rather than assumed.

## 5. Contradictions Found

| ID | Document | Issue | Why It Matters | Required Decision |
|---|---|---|---|---|
| CON-001 | `02 - User Roles & Permissions.md`, §2 Guest and §11 Proposed Permission Matrix; `01 - Product Requirements.md`, §4 Directory; `09 - Privacy Requirements.md`, §§3 and 6 Directory Access | Guest is stated to be able to view eligible public profiles, while public-directory access is TBD and Guest directory search is TBD. The documents do not say whether profile viewing, directory listing, search, and direct profile URLs are the same permission. | A public route or API could expose personal data before the Board selects the directory audience and fields. | Decide the directory audience and separately state access for listing, search/filter, and individual profiles; then align Guest permissions. |
| CON-002 | `01 - Product Requirements.md`, §2, FR-AUTH-001; `10 - Alumni Verification.md`, Eligibility; `15 - Decision Log.md`, DEC-014 | FR-AUTH-001 marks registration by eligible BPKIHS graduates as confirmed, while the definition “graduates of BPKIHS programmes are the core alumni identity” remains proposed/current working rule. | Registration screening, applicant wording, verification rules, and data model cannot rely on an eligibility definition that has not been approved. | Confirm the eligible population or change FR-AUTH-001 to retain its TBD boundary explicitly. |
| CON-003 | `01 - Product Requirements.md`, §8, FR-COM-002/003; `15 - Decision Log.md`, DEC-015; `16 - Open Decisions.md`, DEC-OD-012 through DEC-OD-014; `04 - Sitemap.md`, Public/Alumni/Admin | Comments and reactions are described as Phase 2 proposed, but the Board decision of comments MVP versus Phase 2 and the reaction/sharing definitions are still open. The sitemap also exposes community and admin posts/reports routes without consistently marking their release phase. | MVP estimates and administration routes could include a community workflow that is neither approved nor defined. | Record the final MVP decision for community, then define the included interaction types and remove/defer unapproved routes. |
| CON-004 | `01 - Product Requirements.md`, §3, FR-ALU-003; `06 - Database Design.md`, AlumniProfile; `09 - Privacy Requirements.md`, §§3–4 | FR-ALU-003 requires explicit visibility controls for supported profile fields. The draft model shows one `profile_visibility` field, while privacy defines three conceptual levels and leaves public fields TBD. A single profile-level setting would not, by itself, express per-field controls. | The draft cannot be finalized without knowing whether controls are per profile, per field, or both. | Decide the privacy granularity and field/audience matrix before approving the final schema. |
| CON-005 | `01 - Product Requirements.md`, §5, FR-VER-003; `02 - User Roles & Permissions.md`, §§5, 8–9 and §11; `10 - Alumni Verification.md`, Evidence Policy and Questions | FR-VER-003 gives “administrators” approval/rejection/request-information actions, the matrix gives Admin and Super Admin approval but leaves Moderator TBD, and verification still says reviewer authority is TBD. | The same operation can receive materially different access rules depending on which document is used. It also prevents a defensible audit/separation-of-duties design. | Name the review roles, actions, scopes, escalation/appeal authority, and suspension authority. |

## 6. Authorization Gaps

| ID | User Type | Action | Current State | Decision Required |
|---|---|---|---|---|
| AUTH-001 | Guest | Browse directory/list/search or open a public alumni profile | Public profile viewing is listed as allowed; directory search and public directory audience are TBD. (`02 - User Roles & Permissions.md`, §11; `09 - Privacy Requirements.md`, §6.) | Define audience and distinguish list, search/filter, and profile detail permissions. |
| AUTH-002 | Registered/email-verified/unverified claimant | Use directory | Registered directory access is TBD; no row exists for email-verified users as a separate state. (`02 - User Roles & Permissions.md`, §3 and §11.) | State the minimum user state for each directory action. |
| AUTH-003 | Verified alumni | Use directory and appear in it | Verified users may search and are “eligible for directory visibility under privacy rules,” but the audience/opt-in/public field rules remain open. (`02 - User Roles & Permissions.md`, §4 and §11; `01 - Product Requirements.md`, §4.) | Decide whether verification, user consent, and field visibility are each required to appear/search. |
| AUTH-004 | Registered versus verified | RSVP | “Eligible users” may RSVP, but pre-verification RSVP is TBD. (`01 - Product Requirements.md`, §6, FR-EVT-003; `02 - User Roles & Permissions.md`, §3.) | Define whether email-verified, pending, rejected, verified, suspended, and staff users may RSVP; define cancellation/change access if included. |
| AUTH-005 | Registered versus verified | Create posts, comment, react, report | Create-post access differs between TBD and proposed; comments/reactions have no permission matrix entries and community scope is not final. (`01 - Product Requirements.md`, §8; `02 - User Roles & Permissions.md`, §11; `16 - Open Decisions.md`, DEC-OD-011 through DEC-OD-014.) | Finalize MVP scope and authorize each community action by user state and content visibility. |
| AUTH-006 | Profile owner, Admin, Super Admin, staff | Edit profile | Own-profile editing is broad, but administrative edits only require “explicit permission”; protected identity fields and effects on verification are not defined. (`01 - Product Requirements.md`, §3, FR-ALU-001/002; `02 - User Roles & Permissions.md`, §11.) | Define edit scope by field and actor, including whether identity changes create a re-verification case. |
| AUTH-007 | Applicant and reviewer | Submit, supplement, approve, reject, request information, suspend verification | Submission is assigned to Registered; reviewers/authorities are incomplete and status transitions are proposed. (`02 - User Roles & Permissions.md`, §11; `10 - Alumni Verification.md`, Actions and Questions.) | Approve the workflow and role/action matrix, including evidence access and decision/reason visibility. |
| AUTH-008 | Moderator, Admin, Super Admin | Moderate posts/reports | Moderator can moderate, but moderation model, permissible actions, and appeal/escalation are open. (`02 - User Roles & Permissions.md`, §5 and §11; `16 - Open Decisions.md`, DEC-OD-011.) | Define moderation lifecycle and which roles can hide, restore, remove, or resolve content/reports. |
| AUTH-009 | Content Manager, Admin, Super Admin | Manage pages, Board content, events, media | Content Manager is assigned broad management; Admin is “assigned by the Association”; no content ownership/publish/approval boundary is defined. (`02 - User Roles & Permissions.md`, §§6, 8–9 and §11; `01 - Product Requirements.md`, §12.) | Define CRUD, publish/unpublish, approval, and audit permissions per content type. |
| AUTH-010 | Finance Manager, Admin, Super Admin, donor | View/manage donations, receipts, allocations | The matrix states “Own” for users and broad finance access, but it does not define anonymous/guest donor access, receipt reissue, allocation approval, or separation of duties. (`02 - User Roles & Permissions.md`, §§7–9 and §11; `01 - Product Requirements.md`, §7 and §12.) | Define financial-record read/write scopes and finance approval/reconciliation/refund authority. |
| AUTH-011 | Admin, Super Admin, Technical Operator | Manage users, roles, settings, audit | The sitemap exposes users, roles, audit, and settings; Admin’s authority is generic, role management is TBD for Admin, and Technical Operator boundaries are only partly stated. (`04 - Sitemap.md`, Admin; `02 - User Roles & Permissions.md`, §§8–10 and §11.) | Publish a permission catalogue for user lifecycle, roles, settings, audit access, and technical operations. |
| AUTH-012 | Suspended user | Log in or use any protected feature | Suspension appears in a proposed verification status, while user account status is only a potential field. No capabilities are stated. (`10 - Alumni Verification.md`, Proposed Statuses/Actions; `06 - Database Design.md`, User.) | Decide whether suspension is account-level, verification-only, temporary/permanent, and its effect on all protected actions. |

## 7. Verification Gaps

| ID | Question | Affected Documents | Blocking? |
|---|---|---|---|
| VER-001 | Which evidence model is approved: records only, user-uploaded evidence, hybrid, or another policy? Which evidence types are acceptable and when are they required? | `10 - Alumni Verification.md`, Potential Sources/Evidence Policy; `01 - Product Requirements.md`, §5, FR-VER-001; `16 - Open Decisions.md`, DEC-OD-002 | **Yes** — final evidence storage, collection, privacy, and reviewer workflow. |
| VER-002 | Is there an existing alumni data source, who authorizes its use, what fields/quality/freshness does it have, and can it be normalized/imported? | `10 - Alumni Verification.md`, Existing Data Flow; `16 - Open Decisions.md`, DEC-OD-005; `06 - Database Design.md`, Programme/Batch/Verification | **Yes** — matching design and data model depend on it. |
| VER-003 | What identifiers and confidence rules match a claim to records, and which cases require manual review? | `10 - Alumni Verification.md`, Existing Data Flow; `06 - Database Design.md`, Batch; `16 - Open Decisions.md`, DEC-OD-015/016 | **Yes** — prevents false matches and determines required fields/indexes/review UI. |
| VER-004 | Which role(s) may review and approve, what checks are required, and what decision reason/audit information is mandatory? | `10 - Alumni Verification.md`, Evidence Policy/Admin Queue/Audit; `01 - Product Requirements.md`, §5, FR-VER-003; `02 - User Roles & Permissions.md`, §11 | **Yes** — authorization, audit, and separation of duties. |
| VER-005 | What constitutes rejection; is a reason shown to the applicant; can a rejected claimant resubmit or appeal? | `10 - Alumni Verification.md`, Actions/Questions; `01 - Product Requirements.md`, §5 | **Yes** — terminal/non-terminal status transitions and applicant experience. |
| VER-006 | What does “Request Information” ask for, who can respond, what status represents it, and may the case expire or return to review? | `10 - Alumni Verification.md`, Actions/Questions and Proposed Statuses; `01 - Product Requirements.md`, §5, FR-VER-003 | **Yes** — the listed statuses do not explicitly model this state or repeated submission cycle. |
| VER-007 | Which profile changes or time/events trigger re-verification, and what happens to prior verified access while it is pending? | `10 - Alumni Verification.md`, Questions; `01 - Product Requirements.md`, §3, FR-ALU-002/005 | **Yes** — profile editing and verification status cannot be authorized consistently without it. |
| VER-008 | Who may suspend, on what grounds, for how long, with what notice/review, and whether this suspends alumni status, account access, or both? | `10 - Alumni Verification.md`, Actions/Questions; `06 - Database Design.md`, User/Verification | **Yes** — user-state, authorization, and audit implementation. |

## 8. Privacy Gaps

| ID | Question | Affected Documents | Blocking? |
|---|---|---|---|
| PRV-001 | Is the alumni directory public Internet, authenticated-only, or verified-alumni-only; does that answer differ for list/search/detail routes? | `09 - Privacy Requirements.md`, §§3 and 6; `01 - Product Requirements.md`, §4; `02 - User Roles & Permissions.md`, §11; `16 - Open Decisions.md`, DEC-OD-006 | **Yes** — directory/API authorization and exposure. |
| PRV-002 | Which exact profile fields may be public, who can select each visibility, and what is the default visibility? | `09 - Privacy Requirements.md`, §§3–5; `01 - Product Requirements.md`, §3, FR-ALU-001/003; `06 - Database Design.md`, AlumniProfile | **Yes** — response contracts, storage representation, profile UI, and directory search fields. |
| PRV-003 | What does “Alumni-only” mean: any authenticated claimant, only verified alumni, staff, or another defined audience? | `09 - Privacy Requirements.md`, §3; `02 - User Roles & Permissions.md`, §§3–4 | **Yes** — a visibility level cannot be enforced without a stable audience definition. |
| PRV-004 | Which fields are permanently private versus user-controlled, including contact data, verification state, admin notes, financial data, and support data? | `09 - Privacy Requirements.md`, §§2, 4–5; `01 - Product Requirements.md`, §3, FR-ALU-003 | **Yes** — least-privilege queries and DTOs require a field/audience matrix. |
| PRV-005 | What happens on account-deletion request for profile, community records, RSVP, support, donations, receipts, and audit logs; who approves and what retention/legal basis applies? | `09 - Privacy Requirements.md`, §7 and §9; `06 - Database Design.md`, Deletion | **Yes** — deletion/retention schema, operations, and policy cannot be finalized. |
| PRV-006 | Who may view verification evidence, claims, reviewer notes, and decision reasons; how long are they retained and can an applicant access them? | `09 - Privacy Requirements.md`, §§2, 5 and 9; `10 - Alumni Verification.md`, Evidence Policy/Evidence Security; `06 - Database Design.md`, Verification | **Yes** — sensitive file access, authorization, audit, and retention. |

## 9. Scope Changes From Original Proposal

`00 - Project Overview.md` is a product-direction document, not a versioned original MVP baseline. Therefore “added” below means newly explicit in the current requirements, not necessarily approved as a net-new feature. No feature is explicitly recorded as removed.

| Feature | Original Proposal | Current Documentation | Status |
|---|---|---|---|
| Public institutional website, profiles, directory, verification, events, fundraising/donations, support, administration, audit | Listed as main domains (`00 - Project Overview.md`, §4). | All remain in the MVP candidate (`01 - Product Requirements.md`, §14). | Retained; final MVP cut still open (DEC-OD-003). |
| Nepal donations | A Nepal payment gateway is TBD; no geography-specific MVP boundary is established (`00 - Project Overview.md`, §§7–8). | Nepal donations/NPR/one approved provider are specified as MVP (`01 - Product Requirements.md`, §7, FR-FUND-009; `11 - Payment Flow.md`, MVP). | Added clarification/narrowing; provider and finance policy open. |
| International donations and multi-currency | International donations are Phase 2 proposed (`00 - Project Overview.md`, §8). | Phase 2 proposed, not MVP unless the Board changes scope (`01 - Product Requirements.md`, §7, FR-FUND-010; `11 - Payment Flow.md`, Phase 2 Proposed). | Moved/deferred to Phase 2 **proposed**, not confirmed out of scope. |
| Community feed, posts, comments, reactions, moderation | Community is Phase 2 proposed (`00 - Project Overview.md`, §4). | Community remains Phase 2 proposed, while comments MVP/Phase 2, reactions, sharing, and moderation are open (`01 - Product Requirements.md`, §8; `16 - Open Decisions.md`, DEC-OD-011 through DEC-OD-014). | Deferred proposal with unresolved boundary. |
| Newsletter | Newsletter is Phase 2 proposed (`00 - Project Overview.md`, §4). | Subscription/unsubscribe are specified; automation is Phase 2 proposed, while admin newsletter route exists (`01 - Product Requirements.md`, §9; `04 - Sitemap.md`, Admin). | Partly specified; MVP inclusion and admin route timing ambiguous. |
| RSVP | Events are a main domain (`00 - Project Overview.md`, §4). | RSVP is an explicit MVP candidate requirement, but its eligible user state is TBD (`01 - Product Requirements.md`, §6 and §14; `02 - User Roles & Permissions.md`, §3). | Added detail; authorization unresolved. |
| Privacy, Terms, accessibility | Privacy is a product principle/NFR but not a separately enumerated main domain (`00 - Project Overview.md`, §§3–4). | Public routes and MVP candidate explicitly include privacy/terms/accessibility (`01 - Product Requirements.md`, §§13–14; `04 - Sitemap.md`, Public). | Newly explicit; privacy policy decisions remain open. |
| Receipt, basic financial transparency, fund allocations/expenditures | Fundraising/donations are main domains (`00 - Project Overview.md`, §4). | Receipt/transparency are MVP candidate items; allocation/expenditure records appear in roles, sitemap, and database draft (`01 - Product Requirements.md`, §7 and §14; `02 - User Roles & Permissions.md`, §7; `04 - Sitemap.md`, Admin; `06 - Database Design.md`, FundAllocation). | Expanded detail; exact financial scope and governance ambiguous. |
| Tribute donations | Not stated in the overview. | Supported only “if approved” (`01 - Product Requirements.md`, §7, FR-FUND-007); database draft includes tribute fields (`06 - Database Design.md`, Donation). | Conditionally added; not approved MVP scope. |

## 10. Payment Dependencies

- **Nepal gateway:** The Association and Finance must select one provider from eSewa, Khalti, and Fonepay and confirm it is the approved MVP provider (DEC-OD-001; `11 - Payment Flow.md`, Candidate Nepal Providers). Provider-specific work must wait.
- **Merchant account:** Confirm the Association bank account, merchant-account owner, onboarding completion, fees, sandbox access, production credentials, and who controls them (`11 - Payment Flow.md`, Preconditions). These are organizational decisions/inputs, not implementation details.
- **Settlement:** Confirm settlement destination, timing, fees, reconciliation owner, and how provider transaction records are matched to bank settlement. The required application/provider/bank reconciliation is stated, but the process is open (DEC-OD-010; `11 - Payment Flow.md`, Reconciliation).
- **Refunds:** Finance must approve refund authority, process, record treatment, reconciliation, and receipt correction/communication. Refund/reconciliation is open (DEC-OD-010; `11 - Payment Flow.md`, Preconditions/States/Failure Cases).
- **Receipt wording:** Finance/Legal must approve legal/tax wording and whether any tax-deductibility statement can be made (DEC-OD-008/009; `11 - Payment Flow.md`, Receipt). Receipt numbering/document requirements also need Finance confirmation (`06 - Database Design.md`, Receipt).
- **Accounting year:** Nepali fiscal year is only proposed. Finance must confirm the accounting/reporting-year rule and any reporting cutover before financial reporting/receipt policy is finalized (`11 - Payment Flow.md`, Receipt).
- **International payments:** They are Phase 2 proposed, not confirmed out of scope. The Board must confirm that exclusion for MVP; any Phase 2 decision will later require provider, currency, merchant, settlement, refund, and receipt decisions (`15 - Decision Log.md`, DEC-012; `01 - Product Requirements.md`, §7, FR-FUND-010).

## 11. Requirement Quality Issues

The following replacements are requirement-writing patterns. Bracketed terms are decisions to be supplied by the Association; they are not recommendations for the value to choose.

| ID | Current wording / location | Quality issue | Testable rewrite pattern (without deciding policy) |
|---|---|---|---|
| RQ-001 | “Manage platform operations assigned by the Association” (`02 - User Roles & Permissions.md`, §8) | “Manage” and the assigned scope are undefined. | “A user with `[permission]` may `[create/read/update/disable]` `[named resource]` within `[scope]`; the system records `[audit fields]` and denies all other users.” |
| RQ-002 | “Manage approved content” / “Manage events” (`01 - Product Requirements.md`, §12, FR-ADM-002/003) | Content types, lifecycle, publication authority, and actions are missing. | “For each `[page/FAQ/Board/event/media]`, `[role]` may perform `[actions]`; `[role]` may publish/unpublish only when `[approval condition]`; each change is audited.” |
| RQ-003 | “Authorized finance staff manage/review donations and related financial records” (`01 - Product Requirements.md`, §12, FR-ADM-004) | “Related” records and review authority are undefined. | “`[role]` may view/update `[donation, transaction, receipt, allocation]` fields; only `[role]` may perform `[reconciliation/refund/receipt correction]`; the system records `[required audit data]`.” |
| RQ-004 | “Manage content reports/moderation” and “manage support” (`01 - Product Requirements.md`, §12, FR-ADM-005/006) | No lifecycle, action set, visibility, or escalation criteria. | “`[role]` may move a `[report/ticket]` from `[state]` to `[state]`, apply `[defined action]`, notify `[audience]`, and record `[reason/audit fields]`.” |
| RQ-005 | “Supported profile fields have explicit visibility controls” (`01 - Product Requirements.md`, §3, FR-ALU-003) | “Supported fields,” audiences, defaults, and control granularity are TBD. | “For each `[profile field]`, the system enforces `[private/alumni-only/public]` visibility for `[defined audience]`, defaults to `[policy value]`, and lets `[actor]` change it subject to `[policy]`.” |
| RQ-006 | “Search by permitted fields” / “profiles eligible under the approved directory-access rule” (`01 - Product Requirements.md`, §4, FR-DIR-002 and BR-DIR-001) | Permitted fields and audience rule are circular/TBD. | “When requester state is `[state]`, search/filter is available for `[field list]`; results include only profiles meeting `[visibility/verification/consent]` conditions.” |
| RQ-007 | “Eligible users can RSVP” (`01 - Product Requirements.md`, §6, FR-EVT-003) | “Eligible” is not defined, and RSVP lifecycle is absent. | “A user in `[allowed state]` may create/cancel/update one RSVP for an event while `[registration conditions]` hold; the system returns `[outcome]` and enforces `[duplicate/capacity rule]`.” |
| RQ-008 | “Secure” donations/payment and “secure and limit uploads” (`03 - User Stories.md`, US-PAY-002; `01 - Product Requirements.md`, §13, NFR-SEC-005/007) | Security is an outcome word without complete acceptance criteria. | “The system accepts `[specified file/payment input]` only after `[server-side validations]`, stores/transmits it under `[approved controls]`, limits `[named threshold]`, and records/rejects `[failure conditions]`.” |
| RQ-009 | “Rate-limit sensitive endpoints” (`01 - Product Requirements.md`, §13, NFR-SEC-006) | Sensitive endpoints, limit keys, response, and approved thresholds are unspecified. | “For `[endpoint/action]`, the system permits at most `[approved threshold]` per `[identity/window]`, returns `[specified outcome]`, and records `[operational event]`.” |
| RQ-010 | “Basic financial transparency” (`01 - Product Requirements.md`, §14; §7, FR-FUND-008) | Audience, metrics, approval source, cadence, and exclusions are absent. | “The `[audience]` can view `[approved metrics/period/currency]` sourced from `[record status]`, updated `[cadence]`, excluding `[approved data]`.” |
| RQ-011 | “Audit important administrative/financial actions” (`01 - Product Requirements.md`, §13, NFR-SEC-008; §12, FR-ADM-007) | “Important” does not identify the event set, fields, readers, or retention. | “For each action in `[audit event catalogue]`, record `[actor, time, resource, old/new values or reason]`; `[role]` may view entries for `[scope]`; retain them under `[approved policy]`.” |
| RQ-012 | “Target WCAG 2.2 AA where practical” and “backups, monitoring, error tracking, and recovery procedures” (`01 - Product Requirements.md`, §13, NFR-ACC-001 and NFR-REL-001) | “Where practical” and operational outcomes have no measurable exception or service target. | “The `[defined surfaces]` meet `[named accessibility/operational criterion]`; exceptions require `[approval/record]`. Backups/recovery/monitoring meet `[approved RPO/RTO/coverage/alert ownership]`.” |

## 12. Traceability Issues

- `15 - Decision Log.md`, DEC-017 accepts the prefixes `FR`, `NFR`, `SEC`, `PRV`, `ACC`, `PERF`, `OPS`, and `BR`. The product document has strong `FR-*` and `BR-*` coverage, but it uses composite `NFR-SEC-*`, `NFR-PRV-*`, and `NFR-ACC-*` identifiers instead of the separately named `SEC-*`, `PRV-*`, and `ACC-*` families. Choose one convention and state it in DEC-017 or the requirements template.
- No `PERF-*` or `OPS-*` requirements are present in the reviewed requirements. Performance, monitoring, backup, recovery, deployment ownership, and operational thresholds are represented only by broad NFR prose (`01 - Product Requirements.md`, §13).
- Privacy requirements are prose sections without `PRV-*` identifiers (`09 - Privacy Requirements.md`, §§1–10). The same applies to verification workflow requirements (`10 - Alumni Verification.md`), payment policy/flow (`11 - Payment Flow.md`), role/permission definitions (`02 - User Roles & Permissions.md`), sitemap route rules (`04 - Sitemap.md`), and the database draft (`06 - Database Design.md`). Assign IDs to normative requirements and reference them from these supporting documents.
- Security requirements in the reviewed set do not have standalone `SEC-*` identifiers; the NFR labels are not consistently traceable to acceptance tests or threat/control evidence (`01 - Product Requirements.md`, §13).
- User stories use useful `US-*` IDs but do not yet map to requirement IDs, preconditions, acceptance criteria, edge cases, or tests; this is acknowledged in `03 - User Stories.md`, Acceptance Criteria Pattern. Add a many-to-many story-to-requirement mapping before implementation.
- The permission matrix has capability names but no stable permission IDs and no references to FR/BR IDs (`02 - User Roles & Permissions.md`, §11). This prevents an audit of route/API checks against policy.
- Open decisions have `DEC-OD-*` IDs and decisions use `DEC-*`, which is useful. However, several review-exposed decisions listed in §4 have no `DEC-OD-*` entry, so their resolution cannot be reliably tracked.
- The MVP candidate is an unnumbered list (`01 - Product Requirements.md`, §14). Each inclusion/deferment should link to the relevant FR/BR and its decision status after DEC-OD-003 is resolved.
- Most FR/BR/NFR entries outside FR-AUTH-001 through FR-AUTH-005 do not carry an individual Confirmed/Proposed/TBD/Out of Scope label. Under DEC-016, that missing status makes it unsafe to use the requirement ID alone as evidence that a business decision is confirmed.

## 13. Decisions Required Before Batch 2

### Before final database design

- Finalize the account/authentication, alumni-verification, and suspension state definitions and relationships.
- Decide the profile field inventory, privacy granularity, directory audience, public/alumni-only/private field matrix, and deletion/retention policy.
- Decide evidence model, historic-data availability, matching identifiers/rules, reviewer workflow, request-information/rejection/resubmission/appeal/re-verification/suspension rules.
- Finalize staff roles, permission IDs, resource scopes, and financial/verification separation of duties.
- Confirm programme taxonomy and whether roll/registration number is permitted/needed.
- Confirm payment provider/merchant and finance policies before treating payment, receipt, settlement, allocation, or refund fields as final.

### Before authentication implementation

- Confirm the exact eligible-registration definition, when a person becomes email-verified, whether authentication is allowed before alumni verification, and account-suspension/login behavior.
- Confirm which profile, directory, RSVP, community, and donation actions each user state may perform (DEC-OD-006/007 plus the state gaps in §1).

### Before authorization implementation

- Resolve directory/profile audiences and field visibility.
- Resolve registered-versus-verified capabilities, RSVP eligibility, and final community scope.
- Resolve the administrative role/permission catalogue, verification/review authority, moderation authority, finance authority, role administration, and Technical Operator boundaries.
- Resolve account versus verification suspension and its feature effects.

### Before verification implementation

- Resolve DEC-OD-002 and DEC-OD-005, plus matching, reviewer authority, all decision transitions, evidence retention/visibility, re-verification, and suspension policy described in §7.

### Before payment implementation

- Resolve DEC-OD-001 and merchant onboarding/control.
- Resolve settlement/reconciliation and refund ownership/process (DEC-OD-010).
- Resolve receipt legal/tax wording and tax-deductibility claim (DEC-OD-008/009), receipt policy, and accounting year.
- Confirm the Board’s MVP decision on international payments rather than treating its proposed Phase 2 status as final.

## 14. Safe to Proceed

- Maintain the accepted technical direction and the documented OTP/password-reset/payment-integrity principles without selecting unresolved policy values.
- Normalize requirements documentation: adopt one ID convention, map existing user stories to requirements, add stable permission IDs, and register the newly identified decisions. This is documentation work only and does not settle the decisions.
- Prepare decision packets, acceptance-criteria templates, state-transition worksheets, a field/audience privacy matrix template, and a verification-workflow worksheet with all policy values explicitly marked TBD.
- Perform read-only discovery/planning for historical alumni-data availability and payment-merchant onboarding, once the Association authorizes the relevant information owners; do not ingest, normalize, or match personal data until policy and authorization are confirmed.
- Continue public-content inventory and information-architecture planning for clearly public pages, while leaving domain, brand assets, Board content, public profile data, and final MVP routes subject to their recorded decisions.
- Define test strategy and audit-event templates for already confirmed technical controls, while leaving thresholds, event catalogue, retention, and role visibility as TBD until approved.
