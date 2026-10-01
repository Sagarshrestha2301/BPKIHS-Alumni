type E2eDatabaseEnvironment = {
  databaseUrl: string | undefined;
  directDatabaseUrl: string | undefined;
  runtimeDatabaseUrl: string | undefined;
};

function getDatabaseName(value: string, variableName: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid PostgreSQL URL.`);
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));

  if (!/(e2e|test)/i.test(databaseName)) {
    throw new Error(
      `${variableName} must target a database whose name contains "e2e" or "test".`,
    );
  }

  return databaseName;
}

export function validateE2eDatabaseEnvironment({
  databaseUrl,
  directDatabaseUrl,
  runtimeDatabaseUrl,
}: E2eDatabaseEnvironment) {
  if (!databaseUrl || !directDatabaseUrl) {
    throw new Error(
      "E2E_DATABASE_URL and E2E_DIRECT_DATABASE_URL must point to a dedicated test database.",
    );
  }

  if (runtimeDatabaseUrl !== undefined && databaseUrl === runtimeDatabaseUrl) {
    throw new Error("E2E_DATABASE_URL must not equal DATABASE_URL.");
  }

  getDatabaseName(databaseUrl, "E2E_DATABASE_URL");
  getDatabaseName(directDatabaseUrl, "E2E_DIRECT_DATABASE_URL");
}