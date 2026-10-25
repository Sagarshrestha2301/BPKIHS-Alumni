import { existsSync } from 'node:fs';

import { expect, request as playwrightRequest, test } from '@playwright/test';

import { seedFixtures } from '../helpers/fixtures';
import { ADMIN, ADMIN_STATE, DONOR, DONOR_STATE } from '../helpers/storage';

/** True when the stored jar still holds a live session for this account. */
async function storedSessionWorks(baseURL: string, path: string, email: string): Promise<boolean> {
  if (!existsSync(path)) return false;

  const context = await playwrightRequest.newContext({ baseURL, storageState: path });
  try {
    const response = await context.get('/api/auth/get-session');
    if (!response.ok()) return false;
    const body = (await response.json()) as { user?: { email?: string } } | null;
    return body?.user?.email === email;
  } catch {
    return false;
  } finally {
    await context.dispose();
  }
}

/**
 * Prepares everything the browser projects depend on, once per run:
 *
 * 1. the admin, the donor and the scholarship goal, written directly to the database;
 * 2. one signed-in session per identity, stored as a Playwright storage state.
 *
 * A stored session is reused while it is still valid, so back-to-back runs do not sign in
 * again — that matters because Better Auth allows five sign-ins per minute per IP and the
 * suite used to trip it. When a session has to be made, it is one request per account.
 */
test('creates the fixture accounts and stores their sessions', async ({ baseURL }) => {
  test.setTimeout(120_000);
  await seedFixtures();

  for (const [account, path] of [
    [ADMIN, ADMIN_STATE],
    [DONOR, DONOR_STATE],
  ] as const) {
    if (await storedSessionWorks(baseURL as string, path, account.email)) continue;

    const context = await playwrightRequest.newContext({ baseURL });
    try {
      const response = await context.post('/api/auth/sign-in/email', {
        headers: { Origin: baseURL as string },
        data: { email: account.email, password: account.password },
      });
      expect(
        response.status(),
        `sign in as ${account.email} (run \`npm run db:fixtures\` reset if this is a 401)`,
      ).toBe(200);
      await context.storageState({ path });
    } finally {
      await context.dispose();
    }
  }
});
