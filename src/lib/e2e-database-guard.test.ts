import { describe, expect, it } from "vitest";

import { validateE2eDatabaseEnvironment } from "@/lib/e2e-database-guard";

const e2eUrl = "postgresql://user:password@localhost:5432/alumni_e2e";
const directE2eUrl = "postgresql://user:password@localhost:5432/alumni_e2e";

describe("validateE2eDatabaseEnvironment", () => {
  it("accepts separate e2e database URLs", () => {
    expect(() =>
      validateE2eDatabaseEnvironment({
        databaseUrl: e2eUrl,
        directDatabaseUrl: directE2eUrl,
        runtimeDatabaseUrl:
          "postgresql://user:password@localhost:5432/alumni_alternate",
      }),
    ).not.toThrow();
  });

  it("rejects the runtime database URL", () => {
    expect(() =>
      validateE2eDatabaseEnvironment({
        databaseUrl: e2eUrl,
        directDatabaseUrl: directE2eUrl,
        runtimeDatabaseUrl: e2eUrl,
      }),
    ).toThrow("E2E_DATABASE_URL must not equal DATABASE_URL.");
  });

  it("rejects database names without e2e or test", () => {
    expect(() =>
      validateE2eDatabaseEnvironment({
        databaseUrl: "postgresql://user:password@localhost:5432/alumni",
        directDatabaseUrl: "postgresql://user:password@localhost:5432/alumni",
        runtimeDatabaseUrl: "postgresql://user:password@localhost:5432/other",
      }),
    ).toThrow('must target a database whose name contains "e2e" or "test"');
  });
});