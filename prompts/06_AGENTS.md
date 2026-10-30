# Prompt 06 : Repository Agent Rules

**Purpose:** Create short, reliable rules that coding agents can follow in this repository.

## Copy and use

Act as a senior developer-experience engineer. Read the approved project documents and inspect the real repository. Create or update `AGENTS.md` in the project root.

### Include
- Project summary in no more than five lines.
- Important source-of-truth files and when each applies.
- The required inspect → plan → implement → verify → document → report workflow.
- Rules for preserving existing code, following conventions, and keeping changes focused.
- Dependency, stack, schema, API, and architecture change rules.
- Security rules: no hardcoded secrets, server-side authorization, safe handling of untrusted content.
- Testing and evidence rules.
- Approval points for destructive, production, costly, external, security-sensitive, or breaking actions.
- Documentation and `PROJECT_STATE.md` update rules.
- Completion report format.

### Rules
- Keep the file concise, direct, and actionable:ideally under 100 lines.
- Do not duplicate every project document; link to detailed rules instead.
- Do not include secrets or machine-specific assumptions.
- Do not use tool-specific commands unless the repository truly requires them. If needed, label them clearly.
- Ensure instructions do not contradict `MASTER_INSTRUCTIONS.md` or `SOURCE_OF_TRUTH.md`.
- If the environment does not automatically read `AGENTS.md`, tell the user which recognized instruction file or configuration must contain these rules.

### Completion check
Verify every instruction is understandable, enforceable, and consistent with the project. Save as `AGENTS.md`.
