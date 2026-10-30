import { expect, test } from '@playwright/test';

import { createTestAdmin, deleteTestAccount } from './helpers/accounts';
import { SIGNED_OUT } from './helpers/storage';
import { totp } from './helpers/totp';

/**
 * Administrator two-factor, end to end.
 *
 * The test uses its own throwaway administrator: completing enrolment replaces the account's
 * session, and the shared fixture admin's stored session is used by the rest of the suite. The
 * account is deleted afterwards, which also removes its authenticator.
 */

const ACCOUNT = {
  email: 'e2e.mfa.admin@bpkihs.local',
  password: 'MfaAdmin!2026',
  name: 'E2E MFA Admin',
};

test.use({ storageState: SIGNED_OUT });

test('enrols, challenges the next sign-in and turns off again', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One desktop pass covers the handshake.');

  await createTestAdmin(ACCOUNT);

  try {
    await page.goto('/admin/sign-in');
    const signIn = page.getByRole('main');
    await signIn.getByLabel('Email address').fill(ACCOUNT.email);
    await signIn.getByLabel('Password').fill(ACCOUNT.password);
    await signIn.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto('/admin/security');
    const security = page.getByRole('main');
    await security.getByLabel('Password').fill(ACCOUNT.password);
    await security.getByRole('button', { name: 'Set up two-factor' }).click();

    await expect(
      page.getByRole('heading', { name: 'Add this account to your authenticator app' }),
    ).toBeVisible();
    const secret = (await page.locator('dl code').first().innerText()).trim();
    expect(secret.length).toBeGreaterThan(15);
    await expect(page.locator('ul[aria-label="Backup codes"] li')).not.toHaveCount(0);

    await page.getByLabel('Six-digit code').fill(totp(secret));
    await page.getByRole('button', { name: 'Turn on two-factor' }).click();
    await expect(page.getByText('Two-factor is on.', { exact: false })).toBeVisible();
    await expect(page.getByText('Enabled').first()).toBeVisible();

    // A fresh browser with no session: the password alone must not open the dashboard.
    await page.context().clearCookies();
    await page.goto('/admin/sign-in');
    const challenge = page.getByRole('main');
    await challenge.getByLabel('Email address').fill(ACCOUNT.email);
    await challenge.getByLabel('Password').fill(ACCOUNT.password);
    await challenge.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Two-factor code' })).toBeVisible();
    await page.getByLabel('Authentication code').fill(totp(secret));
    await page.getByRole('button', { name: 'Verify and sign in' }).click();
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto('/admin/security');
    const securityAgain = page.getByRole('main');
    await securityAgain.getByLabel('Password').fill(ACCOUNT.password);
    await securityAgain.getByRole('button', { name: 'Turn off two-factor' }).click();
    await expect(page.getByText('Not enabled').first()).toBeVisible();
  } finally {
    await deleteTestAccount(ACCOUNT.email);
  }
});
