---
title: BPKIHS Alumni Association — API Specification
status: Draft
owner: Project Lead
version: 0.3
last_updated: 2026-09-30
tags: [bpkihs, api]
---
# API Specification

> [!note]
> Only routes marked **Implemented** exist today. Planned routes are not an API
> contract until their requirements and response schemas are approved.

## Auth

**Implemented — Better Auth managed.** The catch-all handler at
`/api/auth/[...all]` delegates these routes to Better Auth. Clients should use
the configured Better Auth client rather than construct requests manually.

```text
POST /api/auth/sign-up/email
POST /api/auth/email-otp/verify-email
POST /api/auth/sign-in/email
POST /api/auth/sign-out
POST /api/auth/email-otp/request-password-reset
POST /api/auth/email-otp/reset-password
GET  /api/auth/get-session
```

Authentication responses and errors use Better Auth's provider contract. The
application error envelope below applies to application-owned routes.

Authentication requests are rate-limited using shared database storage.

## Alumni

**Implemented:**

```text
GET   /api/alumni/me
PATCH /api/alumni/me
```

`GET /api/alumni` and `GET /api/alumni/:id` are planned. They remain blocked
by the directory-access and profile-visibility decisions.

## Verification

**Implemented:**

```text
POST /api/verification
GET  /api/verification/me
```

`POST /api/verification` requires an authenticated user with a verified email,
programme, and batch. It creates one pending claim and an audit event. Claim
snapshots are immutable after submission. `GET /api/verification/me` returns
only the caller's current claim status and timestamps; reviewer notes and
decision reasons are not exposed.

**Planned — no routes exist:**

```text
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

Application-owned APIs return this envelope for validation and domain errors.
`fields` is included for payload validation when field-specific details are
available.

Authenticated profile and verification responses send `Cache-Control: private,
no-store` and never include stack traces or internal error details.

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
