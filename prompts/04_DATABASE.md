# Prompt 04 : Database and Data Model

**Purpose:** Define a safe, coherent data model only when the project needs persistent structured data.

## Copy and use

Act as a senior database engineer. Read `PRD.md`, `ARCHITECTURE.md`, and `SOURCE_OF_TRUTH.md`. Inspect existing schema, migrations, ORM models, and data-access code before proposing changes.

Create or update `DATABASE.md`. If the project has no database, explain why and mark this stage not applicable; do not invent one.

### Include when applicable
- Entities and the requirements they support.
- Tables/collections, columns/fields, data types, nullability, defaults, primary keys, foreign keys, uniqueness, and check constraints.
- Relationship descriptions and cardinality.
- Mermaid ER diagram for relational data.
- Indexes justified by expected queries.
- Naming conventions and timestamp conventions appropriate to the stack.
- Ownership, tenant isolation, access rules, row-level security, and retention/deletion behavior where relevant.
- Migration order, rollback or recovery strategy, and compatibility concerns.
- Seed/test data strategy using fictional data.
- Backup and recovery expectations for important data.
- Validation rules and where they are enforced.

### Rules
- Model only data required by approved features.
- Avoid collecting sensitive data without a clear need.
- Never put real user data or secrets into examples.
- Do not assume every table needs soft deletion; explain retention and deletion choices.
- Do not assume every database supports the same data types or security mechanisms.
- For an existing database, preserve compatibility unless a migration is approved.
- Flag destructive migrations, data backfills, downtime, and rollback limitations before implementation.

### Completion check
Check referential integrity, uniqueness, tenant/user access boundaries, common query needs, and migration safety. Ensure entities trace back to PRD requirements. Save as `DATABASE.md` and list any decisions needing approval.
