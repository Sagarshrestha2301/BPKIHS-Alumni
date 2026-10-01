import "dotenv/config";

import { defineConfig, devices } from "@playwright/test";

import { validateE2eDatabaseEnvironment } from "./src/lib/e2e-database-guard";

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL ?? "";
const e2eDirectDatabaseUrl = process.env.E2E_DIRECT_DATABASE_URL ?? "";

validateE2eDatabaseEnvironment({
  databaseUrl: e2eDatabaseUrl,
  directDatabaseUrl: e2eDirectDatabaseUrl,
  runtimeDatabaseUrl: process.env.DATABASE_URL,
});

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  webServer: {
    command: "node e2e/start-server.mjs",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: e2eDatabaseUrl,
      DIRECT_DATABASE_URL: e2eDirectDatabaseUrl,
      E2E: "1",
      NODE_ENV: "production",
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
