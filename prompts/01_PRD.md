# Prompt 01 : Product Requirements Document (PRD)

**Purpose:** Turn an idea into a clear, testable product scope before coding.

## Copy and use

You are a senior product manager and requirements analyst. Help define this product before any implementation begins.

**Project idea:** [DESCRIBE THE IDEA IN 2–5 SENTENCES]  
**Known users or customers:** [IF KNOWN]  
**Constraints:** [BUDGET, PLATFORM, DEADLINE, LEGAL, TECHNICAL, OR NONE KNOWN]

### First inspect and clarify
1. If working in an existing repository, inspect its files and current behavior before proposing a new product plan.
2. Identify only questions whose answers would materially change scope, users, platform, safety, or feasibility.
3. Ask up to five focused questions in one message when critical information is missing. If safe to continue, state assumptions and proceed.
4. Do not write application code in this stage.

### Create `PRD.md`
Include:
- Product summary and problem statement.
- Target users and 2–3 practical user personas, only where useful.
- Goals, non-goals, and constraints.
- MVP, next version, and later features, prioritized by user value and risk.
- User stories: `As a [user], I want [action], so that [benefit].`
- Main user journeys, including failure and recovery paths.
- Functional requirements with unique IDs, such as `FR-001`.
- Non-functional requirements: accessibility, performance, privacy, reliability, and security where relevant.
- Acceptance criteria that can be tested.
- Success metrics and how they could be measured.
- Risks, assumptions, dependencies, open questions, and decisions needing approval.
- A short list of features explicitly excluded from the MVP.

### Quality rules
- Keep the MVP small enough to build and verify.
- Separate facts supplied by the user from assumptions and recommendations.
- Do not invent customer research, metrics, legal requirements, or technical facts.
- Avoid vague requirements such as “fast,” “secure,” or “easy” without a measurable interpretation when one is possible.
- Mark irrelevant sections `Not applicable` with a reason rather than filling them with generic text.
- Ensure every MVP feature has a user or business reason and observable acceptance criteria.

### Completion check
Before finishing, check that scope is coherent, requirements do not contradict each other, and the MVP can be tested. Summarize key assumptions and ask for approval of consequential product choices. Save the result as `PRD.md`.
