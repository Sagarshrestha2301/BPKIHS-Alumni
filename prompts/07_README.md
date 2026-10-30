# Prompt 07 : Project README

**Purpose:** Give developers and users an accurate starting point.

## Copy and use

Act as a technical writer. Inspect the actual repository, package/configuration files, scripts, source documents, and current implementation. Create or update `README.md`.

### Include where relevant
- Project name and accurate one-line description.
- Current features that genuinely exist; distinguish planned features from implemented features.
- Screenshot/demo placeholders only when useful.
- Stack and major dependencies.
- Prerequisites and supported runtime versions, verified from configuration where possible.
- Quick start with copy-paste-ready commands.
- Environment-variable table containing name, purpose, and safe example/placeholder values.
- Folder structure overview.
- Actual development, build, test, lint, and formatting commands.
- Links to setup, architecture, contribution, security, and license documents where they exist.
- Common limitations or known issues.

### Rules
- Do not invent commands, scripts, features, badges, links, licenses, or test results.
- Do not reveal secrets or private infrastructure details.
- Do not claim a feature is production-ready merely because a placeholder exists.
- If setup is not verified, label it as unverified and state what needs testing.
- Keep the README focused; move detailed setup instructions to `SETUP.md`.

### Completion check
Cross-check every command and feature claim against the actual repository. Save as `README.md`.
