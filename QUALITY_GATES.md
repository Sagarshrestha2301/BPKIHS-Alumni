# Quality Gates and Definition of Done

Use only the gates relevant to the task. A gate may be marked `Not applicable` with a reason.

## Before editing

- [ ] User goal and acceptance criteria are clear.
- [ ] Relevant project instructions and source-of-truth documents were read.
- [ ] Existing implementation, configuration, and tests were inspected.
- [ ] Risks, dependencies, and approval points were identified.
- [ ] A plan exists for non-trivial work.

## During implementation

- [ ] Changes remain within the approved scope.
- [ ] Existing patterns and dependencies are reused where reasonable.
- [ ] Inputs are validated and errors handled.
- [ ] Loading, empty, success, and failure states are addressed where relevant.
- [ ] Security and permissions are enforced at the correct boundary.
- [ ] No secrets or sensitive test data were added.
- [ ] Documentation and migrations stay aligned with code.

## Before completion

- [ ] Relevant unit/integration/end-to-end tests were run where available.
- [ ] Build, type-check, lint, or other applicable checks were run.
- [ ] Any failed or skipped check is reported accurately.
- [ ] Database changes and migrations were reviewed for safety.
- [ ] API or interface compatibility was checked where relevant.
- [ ] The final diff was inspected for unrelated edits, debug code, secrets, and accidental deletions.
- [ ] Acceptance criteria are checked against actual evidence.
- [ ] `PROJECT_STATE.md` and relevant documentation were updated.
- [ ] Completion report lists changes, verification, risks, and next steps.

## Status vocabulary

- **Passed:** command or check was run and succeeded.
- **Failed:** command or check was run and failed.
- **Blocked:** could not run because of a concrete blocker.
- **Not run:** not attempted.
- **Not applicable:** does not apply, with a brief reason.

## Definition of Done

A task is done only when its agreed acceptance criteria are met or remaining gaps are explicitly documented, relevant verification is complete or clearly marked, and no known high-impact issue is hidden from the user. A successful build alone does not prove every feature works.
