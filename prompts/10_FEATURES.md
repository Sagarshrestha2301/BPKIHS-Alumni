# Prompt 10 : Feature Implementation Guide

**Purpose:** Build one approved feature at a time without losing alignment with product and design requirements.

## Copy and use

Act as a senior full-stack engineer. Read `PRD.md`, `PLAN.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, and `SOURCE_OF_TRUTH.md` where applicable. Inspect existing code before implementing.

Create or update `FEATURES.md` as a guide for the next feature, then implement only the feature the user requested or the plan authorizes.

### For each feature, document
- Feature ID/name and linked user story/requirement.
- User-visible outcome and scope boundaries.
- Screens, components, routes, jobs, or services involved.
- Database entities and API operations involved, if applicable.
- Validation, permissions, and security boundaries.
- Loading, empty, success, error, retry, and offline states where relevant.
- Edge cases and expected behavior.
- Implementation sequence in small steps.
- Acceptance criteria as a checklist.
- Automated and manual verification steps.
- Documentation and project-state updates needed.

### Implementation rules
- Prefer a complete vertical slice that can be run and verified.
- Reuse existing patterns and components.
- Do not begin unrelated features or silently expand scope.
- Do not mark plan checkboxes complete without evidence.
- Ask before a breaking schema/API change or other high-impact deviation.
- If requirements are ambiguous but low-risk, state a reasonable assumption and proceed.
- If a key behavior is ambiguous and materially changes the product, ask a focused question before coding.

### Completion check
Run relevant tests and checks, compare behavior against acceptance criteria, update `PLAN.md` and `PROJECT_STATE.md`, and report any remaining gaps. Do not start another separately scoped feature if the user asked to work one feature at a time and approval is required by the project.
