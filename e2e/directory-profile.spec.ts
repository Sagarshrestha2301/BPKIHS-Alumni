import { expect, test } from '@playwright/test';

import { MEMBER_STATE } from './helpers/storage';

// The signed-in view; public profiles and the signed-out rules live in `roles.spec.ts`.
test.describe('directory profile', () => {
  test.use({ storageState: MEMBER_STATE });

  test('a person card opens the profile and the back link returns', async ({ page }) => {
    await page.goto('/directory');
    const firstCard = page.getByRole('list', { name: 'Alumni results' }).getByRole('link').first();
    const name = (await firstCard.textContent())?.trim() ?? '';
    await firstCard.click();
    await expect(page).toHaveURL(/\/directory\/alumnus-/);
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await page.getByRole('main').getByRole('link', { name: 'Back to directory' }).click();
    await expect(page).toHaveURL(/\/directory$/);
  });

  test('a known profile shows its details', async ({ page }) => {
    // alumnus-003 has a public profile: alumni-only records stay hidden from a normal account.
    await page.goto('/directory/alumnus-003');
    await expect(page.getByRole('heading', { level: 1, name: 'Chandra Gurung' })).toBeVisible();
    await expect(page.getByRole('main').getByText('MBBS, batch 2015').first()).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Donate' })).toBeVisible();
  });

  test('an unknown profile shows the 404 page', async ({ page }) => {
    await page.goto('/directory/does-not-exist');
    await expect(page.getByText('We could not find that page')).toBeVisible();
  });
});
