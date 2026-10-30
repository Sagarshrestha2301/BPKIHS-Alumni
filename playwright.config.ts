import { defineConfig, devices } from '@playwright/test';

/**
 * The suite drives one fixed origin. `npm run dev` pins port 3000, so the browser's origin and
 * the app's configured `APP_URL` always agree : Better Auth validates that Origin on every
 * request that carries a session cookie. Pinning it here too keeps the `webServer` wait and
 * the documented `localhost:3000` links honest if the script ever changes.
 */
const PORT = '3000';
process.env.PORT = PORT;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  /**
   * Generous on purpose: eight workers against one dev server sometimes wait while Turbopack
   * compiles a route on its first request, and a five-second default turns that into a flaky
   * failure that has nothing to do with the code under test.
   */
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    /**
     * Runs once before any browser project: creates the fixture accounts and content, then
     * signs in a single time per account and stores the session. Specs reuse those sessions
     * instead of signing in again, which keeps them under Better Auth's sign-in limiter.
     */
    { name: 'setup', testMatch: /fixtures\.setup\.ts/ },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: /cross-browser\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } },
      testIgnore: /cross-browser\.spec\.ts/,
      dependencies: ['setup'],
    },
    /**
     * The two engines the rest of the suite does not run. Only the smoke file, so a full run
     * stays short; `npx playwright test --project=firefox --project=webkit` covers the rest.
     */
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /cross-browser\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /cross-browser\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
