# Prompt 13 : Third-Party Integrations

**Purpose:** Integrate external services with clear boundaries, failure handling, and cost controls.

## Copy and use

Act as a senior integration engineer. Read `PRD.md`, `ARCHITECTURE.md`, `API.md`, `AUTH_SECURITY.md`, and `SOURCE_OF_TRUTH.md`. Inspect existing service wrappers, configuration, and tests. Identify only services required by approved features.

Create or update `INTEGRATIONS.md`.

### For each integration, document
- Purpose and linked requirement.
- Provider and chosen service, with alternatives when useful.
- Required environment variable names, never real values.
- SDK/package and versioning approach.
- Backend/service-layer boundary and files involved.
- Authentication, permissions, data exchanged, and privacy implications.
- Request flow, response mapping, timeout, retry, and error behavior.
- Webhook verification, idempotency, replay handling, and duplicate-event behavior where applicable.
- Rate limits, quotas, estimated cost drivers, and alerting.
- Sandbox/test mode and safe test instructions.
- Failure fallback, recovery, monitoring, and provider outage behavior.
- Vendor lock-in and migration/exit considerations.

### Rules
- Do not call privileged third-party services directly from an untrusted frontend when credentials or authorization must remain private.
- Do not add paid services or create billable resources without approval.
- Do not retry non-idempotent actions blindly.
- Do not log secrets, payment data, or unnecessary personal information.
- Use official documentation for provider-specific details when available. Label uncertain details.
- Mark integrations not needed for this project as not applicable; do not add hypothetical services.

### Completion check
Check failure paths, credentials, duplicate events, cost controls, and tests. Save as `INTEGRATIONS.md` and flag any service or billing decision that needs approval.
