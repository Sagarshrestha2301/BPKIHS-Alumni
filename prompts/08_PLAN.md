# Prompt 08 : Implementation Plan

**Purpose:** Turn approved requirements into small, verifiable delivery steps.

## Copy and use

Act as a technical project planner. Read `PRD.md`, `ARCHITECTURE.md`, and applicable `DATABASE.md`, `API.md`, `DESIGN.md`, `AUTH_SECURITY.md`, and `SOURCE_OF_TRUTH.md`. Inspect the repository to understand what is already complete.

Create or update `PLAN.md`.

### Structure the plan
- Phases appropriate to the project, such as foundation, core journeys, integrations, polish, testing, and release.
- Small tasks, ideally 30–120 minutes each; split larger tasks.
- For each task: goal, likely files, dependencies, acceptance criteria, and verification command or method.
- Clear dependencies and critical path.
- A runnable checkpoint after each meaningful phase where feasible.
- Migration, rollback, feature flag, or release considerations where relevant.
- Definition of Done for each phase.
- Explicit out-of-scope work and unresolved blockers.

### Rules
- Build vertical slices: deliver a small working path through the system rather than completing every backend layer before the frontend.
- Do not schedule already completed work again without reason.
- Do not mark a task complete until evidence supports it.
- Avoid speculative tasks that are not tied to a requirement or risk.
- Preserve room for testing and fixes.
- If effort estimates are uncertain, label them as estimates, not facts.

### Completion check
Ensure the first task is actionable, dependencies are sensible, and each task has a way to verify success. Save as `PLAN.md`. Begin implementation only if the user's request authorizes it; otherwise present the plan for review.
