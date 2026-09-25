---
title: BPKIHS Alumni Association — User Roles & Permissions
status: Proposed
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, authorization, roles]
---
# User Roles & Permissions

> [!important] Board decisions
> The exact access of registered-but-unverified users and the final administrative role structure require approval.

## 1. Roles
```text
Guest
Registered Alumni
Verified Alumni
Moderator
Content Manager
Finance Manager
Admin
Super Admin
Technical Operator
```

## 2. Guest
Can:
- view public pages,
- view eligible public profiles,
- view events,
- view fundraising,
- make permitted donations,
- contact/FAQ.

Cannot access private/admin/alumni-only functionality.

## 3. Registered Alumni
Can:
- authenticate,
- manage own profile,
- submit verification,
- manage privacy.

Community/RSVP/directory access before verification: **TBD**.

## 4. Verified Alumni
Can use the approved verified-alumni features and are eligible for directory visibility under privacy rules.

## 5. Moderator
Can review reports and moderate community content.
Cannot automatically manage finance, roles, or alumni verification unless separately granted.

## 6. Content Manager
Can manage:
- pages,
- FAQ,
- current board,
- previous boards,
- events,
- galleries/media.

## 7. Finance Manager
Can manage/review:
- fundraising campaigns,
- donation records,
- reconciliation,
- receipt information,
- approved expenditure/allocation records.

## 8. Admin
Can manage platform operations assigned by the Association.

## 9. Super Admin
Reserved for highly trusted platform-level administration, especially privileged role/settings management.

## 10. Technical Operator
Technical access does not imply business authority over:
- alumni approval,
- Association finance,
- moderation policy.

## 11. Proposed Permission Matrix
| Capability | Guest | Registered | Verified | Moderator | Content | Finance | Admin | Super Admin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Public website | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Public profiles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit own profile | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Submit verification | — | ✓ | — | — | — | — | — | — |
| Search directory | TBD | TBD | ✓* | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create post | — | TBD | Proposed | — | — | — | ✓ | ✓ |
| Moderate | — | — | — | ✓ | — | — | ✓ | ✓ |
| Manage pages | — | — | — | — | ✓ | — | ✓ | ✓ |
| Manage events | — | — | — | — | ✓ | — | ✓ | ✓ |
| Manage campaigns | — | — | — | — | — | ✓ | ✓ | ✓ |
| View donations | — | Own | Own | — | — | ✓ | ✓ | ✓ |
| Approve alumni | — | — | — | TBD | — | — | ✓ | ✓ |
| Manage roles | — | — | — | — | — | — | TBD | ✓ |
| View audit | — | — | — | — | — | Limited | ✓ | ✓ |

*Subject to final directory access decision.

## 12. Authorization Rule
```text
Request
 ↓
Authenticated?
 ↓
Permission?
 ↓
Resource ownership/scope?
 ↓
Action
```
