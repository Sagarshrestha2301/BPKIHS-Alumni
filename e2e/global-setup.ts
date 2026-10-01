import "dotenv/config";

import { Pool } from "pg";

import { validateE2eDatabaseEnvironment } from "../src/lib/e2e-database-guard";

export default async function globalSetup() {
  const databaseUrl = process.env.E2E_DATABASE_URL ?? "";
  const directDatabaseUrl = process.env.E2E_DIRECT_DATABASE_URL ?? "";

  validateE2eDatabaseEnvironment({
    databaseUrl,
    directDatabaseUrl,
    runtimeDatabaseUrl: process.env.DATABASE_URL,
  });

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await pool.query(`
      TRUNCATE TABLE
        "VerificationAuditEvent",
        "AlumniVerification",
        "AlumniProfile",
        "RateLimit",
        "Verification",
        "Account",
        "Session",
        "User"
      RESTART IDENTITY CASCADE
    `);
  } finally {
    await pool.end();
  }
}