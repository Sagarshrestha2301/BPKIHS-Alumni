import { defineConfig, devices } from '@playwright/test';

/**
 * The suite drives one fixed origin.
 *
 * A shell that exports `PORT=0` (the desktop host does) lets `next dev` take whatever port is
 * free, which silently breaks the `webServer` wait and every documented `localhost:3000`
 * link. The port is pinned here and inherited by the server this config starts.
 */
const PORT = process.env.PORT && process.env.PORT !== '0' ? process.env.PORT : '3000';
process.env.PORT = PORT;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
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
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } },
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
