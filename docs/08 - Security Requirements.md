---
title: BPKIHS Alumni Association — Security Requirements
status: Draft
owner: Project Lead
version: 0.2
last_updated: 2026-09-25
tags: [bpkihs, security]
---
# Security Requirements

## 1. Priorities
1. Account security
2. Private alumni data
3. Admin authority
4. Financial transactions
5. File uploads
6. Auditability
7. Availability

## 2. Authentication
- secure password hashing,
- database-backed sessions,
- HttpOnly cookies,
- Secure cookies in production,
- appropriate SameSite configuration,
- expiring reset tokens,
- expiring/single-use OTP,
- rate limits.

## 3. Authorization
```text
Authentication
 ↓
Permission
 ↓
Resource ownership/scope
 ↓
Action
```
Frontend role checks never replace server authorization.

## 4. Validation
Validate body, query, route parameters, uploads, and webhooks server-side.

## 5. XSS
Treat all user-generated content as untrusted. Do not render arbitrary HTML. If rich text is introduced, use strict sanitization.

## 6. SQL Injection
Use Prisma parameterized queries. Review and parameterize any raw SQL.

## 7. CSRF
Review protections according to the final auth/request architecture; protect state-changing cross-origin flows.

## 8. File Uploads
- extension/type validation,
- actual format validation where practical,
- size limits,
- dimension limits,
- safe generated storage keys,
- no executable content,
- private storage for sensitive evidence.

## 9. Rate Limiting
Protect login, registration, OTP, password reset, contact, support, post creation, donation initiation, and other abuse-prone endpoints.
Use shared/persistent state suitable for serverless deployment.

## 10. Payment Security
```text
Webhook
 ↓
Verify provider authenticity where supported
 ↓
Validate payload
 ↓
Check transaction
 ↓
Check amount/currency
 ↓
Idempotency
 ↓
Update state
```

## 11. Secrets
Never commit, print, or return secrets. Rotate compromised secrets.

## 12. Security Headers
Evaluate CSP, HSTS, X-Content-Type-Options, Referrer-Policy, and frame/embedding restrictions.

## 13. Admin
Least privilege. Keep privileged accounts limited. MFA for privileged users is proposed for evaluation.

## 14. Logging
Do not log passwords, OTPs, tokens, payment secrets, or unnecessary personal data.

## 15. Incident Process
```text
Detect → Contain → Investigate → Revoke/rotate → Recover → Assess → Document → Prevent recurrence
```

## 16. Security Testing
- broken access control,
- IDOR,
- privilege escalation,
- XSS,
- upload abuse,
- rate-limit abuse,
- password reset abuse,
- webhook manipulation,
- payment tampering,
- private-data exposure.
