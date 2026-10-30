# Prompt Mapping : BPKIHS Alumni Website

This document maps the 15 AI instruction prompts to existing project documentation, identifying what's already covered, what needs creation, and what's not applicable.

## Mapping Table

| Prompt                  | Existing Document                                  | Status             | Action Needed                                                                                |
| ----------------------- | -------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------- |
| **01_PRD.md**           | `docs/ROADMAP.md` (partial), `docs/CONTEXT.md`     | Partially covered  | Could create formal PRD if needed for new features; current docs capture scope and decisions |
| **02_DESIGN.md**        | `docs/DESIGN.md`                                   | **Covered**        | Use existing `docs/DESIGN.md` as the design system reference                                 |
| **03_ARCHITECTURE.md**  | `docs/BACKEND.md`, `README.md`                     | Partially covered  | Architecture documented across multiple files; no single `ARCHITECTURE.md` needed            |
| **04_DATABASE.md**      | `docs/DB-AND-PAYMENTS.md`, `drizzle/` migrations   | **Covered**        | Use existing `docs/DB-AND-PAYMENTS.md`                                                       |
| **05_API.md**           | `docs/BACKEND.md` (API section), `HANDOVER.md` §4  | **Covered**        | API surface documented in `docs/BACKEND.md` and `HANDOVER.md`                                |
| **06_AGENTS.md**        | `REPOSITORY_RULES.md`                              | **Replaced**       | Use `REPOSITORY_RULES.md` instead; `AGENTS.md` is Next.js-managed                            |
| **07_README.md**        | `README.md`                                        | **Covered**        | Comprehensive README exists                                                                  |
| **08_PLAN.md**          | `docs/ROADMAP.md`, `docs/TRACKER.md`               | **Covered**        | ROADMAP has phased plan; TRACKER has open work                                               |
| **09_SETUP.md**         | `docs/HOWTO.md`, `README.md`                       | **Covered**        | Setup instructions in README and HOWTO                                                       |
| **10_FEATURES.md**      | Not present                                        | Gap                | Could create for new features; current approach uses `docs/TRACKER.md` items                 |
| **11_AUTH_SECURITY.md** | `docs/SECURITY.md`                                 | **Covered**        | Comprehensive security documentation exists                                                  |
| **12_MCP.md**           | N/A                                                | **Not applicable** | No MCP servers configured for this project                                                   |
| **13_INTEGRATIONS.md**  | `docs/BACKEND.md` (payments, email), `HANDOVER.md` | Partially covered  | Integrations (eSewa, Khalti, Resend) documented in backend docs                              |
| **14_TESTING.md**       | Not present                                        | Gap                | Testing strategy documented informally; could formalize                                      |
| **15_DEBUGGING.md**     | `docs/HOWTO.md` §9                                 | Partially covered  | Troubleshooting section exists in HOWTO                                                      |

## Summary

### Fully Covered (use existing docs)

- `02_DESIGN.md` → `docs/DESIGN.md`
- `04_DATABASE.md` → `docs/DB-AND-PAYMENTS.md`
- `05_API.md` → `docs/BACKEND.md`, `HANDOVER.md`
- `06_AGENTS.md` → `REPOSITORY_RULES.md` (created)
- `07_README.md` → `README.md`
- `08_PLAN.md` → `docs/ROADMAP.md`, `docs/TRACKER.md`
- `09_SETUP.md` → `docs/HOWTO.md`, `README.md`
- `11_AUTH_SECURITY.md` → `docs/SECURITY.md`

### Partially Covered (existing docs may need expansion for new features)

- `01_PRD.md` : Scope in ROADMAP/CONTEXT; formal PRD useful for major new features
- `03_ARCHITECTURE.md` : Architecture in BACKEND/README; single doc optional
- `10_FEATURES.md` : Feature work tracked in TRACKER; formal FEATURES.md optional
- `13_INTEGRATIONS.md` : Integrations in BACKEND docs; could consolidate
- `14_TESTING.md` : Testing approach informal; could formalize
- `15_DEBUGGING.md` : Troubleshooting in HOWTO §9; could expand

### Not Applicable

- `12_MCP.md` : No MCP servers in this project

## Recommendations

1. **Use existing documentation** for the covered areas : no need to duplicate.
2. **Create `TESTING.md`** if formal test strategy documentation becomes necessary.
3. **Create `FEATURES.md`** per feature when implementing new major features, following prompt 10's structure.
4. **Keep prompts as templates** for future work; don't create empty files just to fill the list.
5. **Mark prompts "Not applicable"** where they don't fit this project (e.g., MCP).

## How to Use Prompts

When starting a new task:

1. Read `MASTER_INSTRUCTIONS.md`, `SOURCE_OF_TRUTH.md`, `REPOSITORY_RULES.md`, and `PROJECT_STATE.md`
2. Identify which prompt(s) are relevant to the task type
3. Check this mapping to find existing documentation or identify gaps
4. Use the prompt as a guide, not a mandate : adapt to project needs

---

Last updated: 2026-10-29
