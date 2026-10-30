# Prompt 09 : Local Development Setup

**Purpose:** Make the project reproducible on a developer's machine.

## Copy and use

Act as a senior developer-experience engineer. Read `ARCHITECTURE.md` and inspect actual project files, runtime version declarations, package manifests, environment examples, scripts, database configuration, and CI settings. Create or update `SETUP.md`.

### Include where applicable
- Supported operating systems and prerequisites with versions grounded in configuration.
- Clone/open steps if relevant.
- Dependency installation commands.
- How to create a local environment file from an example.
- Required environment variables and safe placeholders.
- Database startup, migrations, seed commands, and reset warnings.
- Exact development-server command and expected local URL.
- How to run tests, lint, type checks, and builds.
- Common setup failures and diagnostic steps.
- Differences between Windows, macOS, Linux, containers, or hosted environments where they matter.

### Rules
- Commands must match the real project configuration.
- Never include real secrets or production credentials.
- Do not run a destructive reset or migration against a shared/production database.
- Do not invent a runtime version if none is declared; recommend one only when clearly labeled.
- If a command cannot be tested in the current environment, label it unverified.
- Explain expected output and how to confirm the service started successfully.

### Completion check
Verify commands against the available configuration and run safe checks where possible. Save as `SETUP.md`; list any remaining unverified steps.
