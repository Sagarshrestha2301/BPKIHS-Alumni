---
title: BPKIHS Alumni Association — Sitemap
status: Draft
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, sitemap]
---
# Sitemap

## Public
```text
/
├── about
├── leadership
├── previous-boards
├── alumni
├── events
├── fundraising
├── community            # Phase 2 proposed
├── faq
├── contact
├── privacy
├── terms
└── accessibility
```

## Authentication
```text
/auth
├── login
├── register
├── verify-email
├── forgot-password
└── reset-password
```

## Alumni
```text
/dashboard
├── profile
├── directory
├── events
├── donations
├── community           # Phase 2 proposed
└── settings
    ├── privacy
    ├── account
    └── notifications
```

## Admin
```text
/admin
├── dashboard
├── alumni
├── verification
├── posts
├── reports
├── events
├── campaigns
├── donations
├── expenditures
├── newsletter
├── support
├── pages
├── team
├── media
├── users
├── roles
├── audit
└── settings
```

## Route Rules
- Public pages expose only approved public information.
- Dashboard requires authentication.
- Verified-only features explicitly check verification status.
- Admin routes require permission.
- API authorization is independent of frontend visibility.
