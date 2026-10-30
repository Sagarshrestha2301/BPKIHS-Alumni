import { expect, test } from '@playwright/test';

import { MEMBER, MEMBER_STATE, SIGNED_OUT } from './helpers/storage';

test.describe('member account', () => {
  test.use({ storageState: MEMBER_STATE });

  test('shows the approved profile and saves edits with expertise', async ({ page }) => {
    await page.goto('/account');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your account');
    await expect(page.getByText('Approved and listed')).toBeVisible();
    await expect(page.getByText(MEMBER.email)).toBeVisible();

    await page.getByRole('link', { name: 'Edit your profile' }).click();
    await expect(page).toHaveURL(/\/account\/profile$/);

    await page.getByLabel('City').fill('Biratnagar');

    // The desktop and mobile projects share one fixture profile, so the tag may already be
    // there from the other project. Add it only when it is missing.
    const removeCardiology = page.getByRole('button', { name: 'Remove Cardiology' });
    if ((await removeCardiology.count()) === 0) {
      await page.getByLabel('Add your own').fill('Cardiology');
      await page.getByRole('button', { name: 'Add', exact: true }).click();
    }
    await expect(removeCardiology).toBeVisible();

    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Your profile has been updated' }),
    ).toBeVisible();

    await page.goto('/account');
    await expect(page.getByText('Biratnagar')).toBeVisible();
    await expect(page.getByText('Cardiology')).toBeVisible();
  });

  test('the password form rejects two different new passwords', async ({ page }) => {
    await page.goto('/account');

    await page.getByLabel('Current password').fill('not-checked-because-the-form-stops-first');
    await page.getByLabel(/^New password/).fill('SomeLongPassword!2026');
    await page.getByLabel('Repeat the new password').fill('AnotherPassword!2026');
    await page.getByRole('button', { name: 'Change password' }).click();

    await expect(page.getByText('The two passwords do not match.')).toBeVisible();
  });
});

test.describe('signed out', () => {
  test.use({ storageState: SIGNED_OUT });

  test('the account page sends a visitor to sign in', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('the profile editor is not reachable without a session', async ({ page }) => {
    await page.goto('/account/profile');
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('the forgot-password form does not reveal whether an address exists', async ({ page }) => {
    await page.goto('/forgot-password');
    // The footer newsletter form also has an "Email address" field.
    await page
      .getByRole('main')
      .getByLabel(/^Email address/)
      .fill('nobody@example.com');
    await page.getByRole('button', { name: 'Send the link' }).click();

    await expect(page.getByRole('status')).toContainText('If that address has an account');
  });
});
