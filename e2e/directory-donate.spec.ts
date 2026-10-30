import { expect, test } from '@playwright/test';

import { MEMBER_STATE } from './helpers/storage';

// Below 640 px the mobile bottom bar already has a Donate button, so the link is hidden there.
const SM_MIN_WIDTH = 640;

// The results area only renders for a signed-in member.
test.describe('directory donate link', () => {
  test.use({ storageState: MEMBER_STATE });

  test('a Donate link sits beside the result count on wider screens', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < SM_MIN_WIDTH, 'phones use the bottom bar');
    await page.goto('/directory');
    const link = page.getByRole('main').getByRole('link', { name: 'Support the Association' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/donate');
  });

  test('phones show no second Donate button in the results area', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= SM_MIN_WIDTH, 'wider screens show the link');
    await page.goto('/directory');
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Support the Association' }),
    ).toBeHidden();
  });
});
