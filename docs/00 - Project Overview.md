---
title: BPKIHS Alumni Association — Project Overview
status: Planning
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, alumni, project, overview]
---
# BPKIHS Alumni Association — Project Overview
> [!info] Purpose
> Master project note for the **BPKIHS Alumni Association Official Website & Alumni Connect Platform**. It records the current product understanding, confirmed/proposed decisions, risks, and documentation map. Unresolved items stay **TBD** rather than being guessed.

## 1. Project Identity
- **Project:** BPKIHS Alumni Association Official Website & Alumni Connect Platform
- **Primary organization:** BPKIHS Alumni Association
- **Institution:** B.P. Koirala Institute of Health Sciences (BPKIHS)
- **Stage:** Pre-development / requirements finalization
- **Builder:** Solo developer for current planning stage
- **Capacity:** ~10–15 hours/week

## 2. Vision
Create one official digital home where BPKIHS graduates can maintain a verified alumni identity, discover and reconnect with alumni, participate in events/community, and contribute to Association initiatives.

The Association also needs a controlled administrative system for verification, content, events, fundraising, support, moderation, and platform operations.

## 3. Core Product Principle
```text
Alumni Identity
      ↓
Connection
      ↓
Community
      ↓
Participation
      ↓
Contribution
```
Every feature should provide meaningful value to alumni or the Association.

## 4. Main Domains
```text
Public Website
Authentication
Alumni Profiles
Directory
Verification
Events
Fundraising
Donations
Community (Phase 2 proposed)
Newsletter (Phase 2 proposed)
Support
Administration
Audit
```

## 5. Non-Goals for Initial Release
- General social network
- Private messaging application
- Full accounting/ERP
- Student management system
- Hospital information system
- Job portal
- Learning management system
- Replacement for BPKIHS institutional systems

## 6. Users
- Public Visitor
- Registered Alumni
- Verified Alumni
- Moderator
- Content Manager
- Finance Manager
- Admin
- Super Admin
- Technical Operator

See [[02 - User Roles & Permissions]].

## 7. Final/Proposed Technology Direction
```text
Next.js 16.x / App Router
TypeScript
Node.js 22 LTS
PostgreSQL
Prisma 7.x
Better Auth / database-backed sessions
Zod
Tailwind CSS
S3-compatible object storage
Transactional email provider (Resend proposed)
Nepal payment gateway (TBD)
Vitest
Playwright
GitHub Actions
Vercel + managed PostgreSQL (proposed)
```

## 8. Current Status
| Area | Status |
|---|---|
| Vision | Established |
| Core scope | Established |
| Requirements | Being finalized |
| Roles | Proposed / pending Board confirmation |
| Verification evidence | TBD |
| Existing alumni database | TBD |
| Nepal payment provider | TBD |
| International donations | Phase 2 proposed |
| Hosting | Proposed: Vercel + managed Postgres |
| UX/UI | Not started |
| Production | Not started |

## 9. Highest-Priority Open Decisions
See [[16 - Open Decisions]].

1. Nepal payment provider
2. Verification evidence policy
3. MVP scope cut
4. Hosting confirmation
5. Existing alumni data
6. Directory access model
7. Registered vs verified permissions

## 10. Project Principle
> **Understand → Specify → Design → Model → Implement → Test → Secure → Deploy → Monitor → Maintain**
