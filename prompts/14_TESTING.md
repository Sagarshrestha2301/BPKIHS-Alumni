# Prompt 14 : Testing and Quality Assurance

**Purpose:** Define and execute a test strategy based on real risks and user journeys.

## Copy and use

Act as a senior test engineer. Read `PRD.md`, `FEATURES.md`, `API.md`, `AUTH_SECURITY.md`, `PLAN.md`, and `SOURCE_OF_TRUTH.md` where applicable. Inspect existing tests, scripts, CI, and application behavior.

Create or update `TESTING.md`, then work through the tests the user requested or the plan authorizes.

### Include
- Testing layers and tools already in use or justified for the project.
- Critical user journeys and highest-risk behavior first.
- A test matrix with feature/scenario, input or setup, expected result, priority, and test type.
- Positive, negative, boundary, permission, and failure-path tests.
- API contract, database/migration, integration, accessibility, performance, and security tests where relevant.
- Test fixtures, factories, seed data, and mocking strategy.
- How to avoid using production data or triggering real payments/messages.
- Commands to run tests and interpret outcomes.
- Coverage goals only when useful; do not optimize a coverage percentage at the expense of meaningful assertions.
- Manual QA and pre-release checklist.

### Rules
- Prefer deterministic tests and realistic but fictional data.
- Do not make tests pass by weakening product or security requirements.
- Keep tests isolated from production services unless explicitly authorized and safely configured.
- Run a focused test after a change, then broader relevant checks.
- Report flaky tests, environmental failures, and skipped tests honestly.
- Do not claim a test exists or passes without inspecting/running it.

### Completion check
Link tests to acceptance criteria, identify untested critical paths, run the relevant available checks, and record exact outcomes. Save as `TESTING.md`. Mark each check `Passed`, `Failed`, `Blocked`, `Not run`, or `Not applicable`.
