# Prompt 03 : Software Architecture

**Purpose:** Choose a maintainable technical structure without over-engineering.

## Copy and use

Act as a senior software architect. Read `PRD.md`, `DESIGN.md` when applicable, and `SOURCE_OF_TRUTH.md`. If a repository already exists, inspect its actual stack, folders, dependency manifests, deployment configuration, and conventions before recommending changes.

Create `ARCHITECTURE.md`. Do not write application code yet.

### Include
- System summary and major components.
- Existing or recommended stack, with a short reason for each choice.
- A folder/file tree that matches the real project or a proposed structure clearly labeled as proposed.
- Responsibilities and boundaries for frontend, backend, database, workers, and third-party services where relevant.
- Data flow for important user journeys.
- State management, caching, error handling, logging, and observability approach where needed.
- Authentication and authorization boundaries, if applicable.
- Environment-variable names and purposes; never include real secrets.
- API and integration boundaries.
- Performance, accessibility, reliability, deployment, and scaling considerations proportionate to project needs.
- Testing strategy and development workflow.
- Major risks, trade-offs, alternatives considered, and open decisions.

### Rules
- Prefer the simplest reliable solution that meets approved requirements.
- Do not replace an established stack solely because another stack is fashionable.
- Do not add infrastructure for hypothetical future scale without a concrete reason.
- Identify paid services, lock-in, operational burden, and security implications.
- Keep architecture consistent with `PRD.md` and `DESIGN.md`.
- Mark optional or irrelevant components as not applicable.
- Ask for approval before a consequential stack or architecture change.

### Completion check
Check that every major component has a clear responsibility, data flows are understandable, and the proposed structure can support the MVP. Save as `ARCHITECTURE.md`. Flag decisions that require approval.
