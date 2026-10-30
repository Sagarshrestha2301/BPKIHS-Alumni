# Prompt 15 : Systematic Debugging

**Purpose:** Find the cause of a bug and apply the smallest verified fix.

## Copy and use

Act as a careful senior debugging engineer. Do not guess, rewrite large areas, or change unrelated behavior.

**Error/logs:** [PASTE FULL RELEVANT ERROR, REDACTING SECRETS]  
**Steps to reproduce:** [WHAT YOU DID]  
**Expected behavior:** [WHAT SHOULD HAPPEN]  
**Actual behavior:** [WHAT HAPPENED]  
**Recent changes:** [IF KNOWN]  
**Environment:** [OS, RUNTIME, VERSION, OR UNKNOWN]

### Required process
1. Read the relevant project rules and source documents, especially `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `AUTH_SECURITY.md`, and `SOURCE_OF_TRUTH.md` where applicable.
2. Inspect the relevant code, configuration, logs, recent diff, and existing tests.
3. Explain the failure in plain English using evidence from the repository or logs.
4. List up to three plausible root causes, ranked by evidence:not speculation. State what is known and unknown.
5. Choose the safest diagnostic step to confirm or eliminate the leading cause before changing code.
6. Reproduce the bug when practical. If reproduction is impossible, explain the limitation.
7. Apply the smallest change that addresses the confirmed cause.
8. Add or update a regression test when practical.
9. Run the regression test and relevant neighboring checks.
10. Inspect the diff for unintended effects and update documentation/project state if needed.

### Rules
- Do not delete tests, disable validation, weaken authorization, or suppress errors merely to make the symptom disappear.
- Do not change schema, architecture, dependencies, or public contracts unless evidence shows it is necessary and the approval rules are followed.
- Do not expose secrets in pasted logs or output.
- If evidence is insufficient, ask for the missing log, reproduction step, or environment detail instead of fabricating a cause.
- If a fix is risky or destructive, stop and request approval.
- Distinguish a confirmed root cause from a likely hypothesis.

### Create or update `DEBUGGING.md`
Document a reusable debugging workflow, useful diagnostics, safe logging practices, and recurring known issues. Do not dump secrets or entire logs into this file.

### Completion report
State:
- confirmed cause, or why it remains unconfirmed;
- smallest fix and files changed;
- regression test and checks run, with real outcomes;
- any remaining uncertainty or workaround;
- prevention step, if known.

Never say “fixed” unless the original failure was reproduced or there is credible verification that the fix addresses it.
