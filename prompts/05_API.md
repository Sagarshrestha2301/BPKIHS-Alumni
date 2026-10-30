# Prompt 05 : API and Interface Contracts

**Purpose:** Define stable, testable interfaces for frontend, backend, and external consumers.

## Copy and use

Act as a senior API designer. Read `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md` if applicable, and `SOURCE_OF_TRUTH.md`. Inspect existing routes, schemas, clients, and tests before documenting an existing API.

Create or update `API.md`. If the application has no API, document the relevant interface boundary or mark this stage not applicable with a reason.

### For each endpoint or operation, include
- Method and path, or the relevant interface signature.
- Purpose and linked PRD requirement.
- Authentication and required permission/role.
- Path, query, and header parameters.
- Request schema and realistic fictional example.
- Success response schema and example.
- Expected error cases and status codes.
- Validation and authorization behavior.
- Pagination, filtering, sorting, and rate limits where relevant.
- Idempotency and retry behavior for operations that may be repeated.
- Versioning and backward-compatibility policy.
- Logging/privacy notes for sensitive fields.

Also define a consistent error response shape and naming conventions.

### Rules
- Follow the project's actual framework and conventions.
- Every operation must map to an approved feature or be clearly labeled as infrastructure.
- Do not expose internal database structures or secrets by default.
- Do not rely on frontend-only authorization.
- Do not invent endpoints that are not required.
- For existing APIs, identify breaking changes and preserve compatibility unless explicitly approved.
- If an API contract conflicts with database or product requirements, describe the conflict instead of hiding it.

### Completion check
Check that success and error cases are covered, permissions are explicit, and each operation has testable behavior. Save as `API.md`.
