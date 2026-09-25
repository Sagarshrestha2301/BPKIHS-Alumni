---
title: BPKIHS Alumni Association — API Specification
status: Draft
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, api]
---
# API Specification

> [!note]
> Route shapes are a starting contract. Final payload schemas should be written alongside implementation and requirements.

## Auth
```text
POST /api/auth/register
POST /api/auth/verify-email
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/session
```

## Alumni
```text
GET   /api/alumni
GET   /api/alumni/:id
GET   /api/alumni/me
PATCH /api/alumni/me
```

## Verification
```text
POST /api/verification
GET  /api/verification/me
GET  /api/admin/verification
GET  /api/admin/verification/:id
POST /api/admin/verification/:id/approve
POST /api/admin/verification/:id/reject
POST /api/admin/verification/:id/request-info
```

## Events
```text
GET    /api/events
GET    /api/events/:id
POST   /api/events/:id/rsvp
DELETE /api/events/:id/rsvp
```

## Donations
```text
POST /api/donations
GET  /api/donations/:id
GET  /api/me/donations
```

## Payments
```text
POST /api/payments/:provider/initiate
GET  /api/payments/:provider/status/:reference
POST /api/webhooks/:provider
```

## Community — Phase 2
```text
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
PATCH  /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/report
POST   /api/posts/:id/comments
POST   /api/posts/:id/reactions
```

## Support
```text
POST /api/support/tickets
GET  /api/support/tickets
GET  /api/support/tickets/:id
POST /api/support/tickets/:id/messages
```

## Admin Support
```text
GET   /api/admin/support
PATCH /api/admin/support/:id
```

## Content
```text
GET /api/pages/:slug
GET /api/faq
```

## Error Contract
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid.",
    "fields": {}
  }
}
```
Never expose stack traces, SQL errors, secrets, or implementation details.

## API Rules
- validation before domain operation,
- authentication before protected operation,
- authorization before mutation/read of restricted resources,
- explicit response schemas,
- transactions where multiple writes must be atomic,
- idempotency for payment callbacks.
