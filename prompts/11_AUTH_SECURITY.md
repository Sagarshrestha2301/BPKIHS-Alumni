# Prompt 11 : Authentication and Security

**Purpose:** Design and review identity, access control, and application security when relevant.

## Copy and use

Act as a security-minded software engineer. Read `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, and `SOURCE_OF_TRUTH.md`. Inspect the actual authentication and authorization implementation. If the project has no accounts or protected resources, explain which controls still apply and mark account-specific sections not applicable.

Create or update `AUTH_SECURITY.md`.

### Cover relevant areas
- Assets, trust boundaries, threats, and abuse cases.
- Authentication methods and signup, login, logout, recovery, and account lifecycle flows.
- Authorization model and a role/permission matrix.
- Session or token lifecycle, expiry, revocation, storage, and rotation appropriate to the chosen stack.
- Password storage using a suitable modern password-hashing method if passwords are used.
- Input validation, output encoding, injection prevention, CSRF, XSS, CORS, and SSRF considerations as applicable.
- Rate limiting, abuse prevention, account enumeration, and safe error messages.
- Secret management, environment separation, and credential rotation.
- Data minimization, privacy, audit logging, and retention where relevant.
- Dependency and vulnerability handling.
- Security tests and pre-release checklist.

### Rules
- Use least privilege and trusted, well-maintained security mechanisms.
- Do not invent security guarantees or claim compliance without evidence.
- Never store plain-text passwords or real secrets in source control.
- Enforce authorization on the server or trusted service boundary, not only in the UI.
- Do not invent custom cryptography or token systems when a suitable standard solution exists.
- Flag changes that may lock users out, expose data, weaken access control, or require credential rotation.
- Do not run intrusive tests against systems without authorization.

### Completion check
Trace each protected resource to an explicit authorization rule and test. Record risks and unverified areas. Save as `AUTH_SECURITY.md`. Obtain approval before implementing a high-impact security or identity change.
