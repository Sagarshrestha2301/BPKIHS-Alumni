---
title: BPKIHS Alumni Association — System Architecture
status: Proposed
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, architecture]
---
# System Architecture
> [!important] Direction
> Modular monolith. No separate Express backend unless a real requirement emerges.

## 1. High-Level
```text
Browser
  ↓
Next.js App Router
  ├─ Public UI
  ├─ Alumni UI
  ├─ Admin UI
  ├─ Route Handlers
  └─ Server-side domain logic
       ├─ PostgreSQL
       ├─ Object Storage
       ├─ Email
       ├─ Payment Gateway
       └─ Background/scheduled work
```

## 2. Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16.x / App Router |
| Language | TypeScript |
| Runtime | Node.js 22 LTS |
| DB | PostgreSQL |
| ORM | Prisma 7.x |
| Auth | Better Auth / DB-backed sessions |
| Validation | Zod |
| UI | Tailwind CSS |
| Storage | S3-compatible |
| Email | Resend proposed |
| Nepal payment | eSewa/Khalti/Fonepay TBD |
| Tests | Vitest + Playwright |
| CI | GitHub Actions |
| Hosting | Vercel proposed |
| DB hosting | Managed Postgres proposed |

## 3. Domain Modules
```text
auth users alumni verification directory events
fundraising donations payments community newsletter
support content media notifications audit admin
```

## 4. Request Flow
```text
Request
 ↓
Route / Server Action
 ↓
Authentication
 ↓
Authorization
 ↓
Validation
 ↓
Domain operation
 ↓
Transaction if required
 ↓
Safe response
```

## 5. Storage
PostgreSQL stores authoritative application state. Object storage contains uploaded files.

## 6. Database Connections
Because Vercel/serverless environments can scale concurrent function instances, use appropriate PostgreSQL pooling for runtime connections and a controlled direct/admin connection for migrations where the provider requires it.

## 7. Background Work
Use durable asynchronous/scheduled work for:
- receipt emails,
- notification emails,
- newsletter batches,
- event reminders,
- retryable jobs.

## 8. Search
Start with PostgreSQL queries/indexes. Add a dedicated search engine only if proven necessary.

## 9. Caching
No broad caching initially. Add only when stale-data rules and invalidation are clear.

## 10. Environments
```text
Local
Preview/Staging
Production
```
Each must isolate database, secrets, payment credentials, and storage as appropriate.

## 11. Architectural Constraints
Avoid premature:
- microservices,
- Kubernetes,
- Kafka,
- Elasticsearch,
- GraphQL,
- event sourcing,
- complex distributed infrastructure.
