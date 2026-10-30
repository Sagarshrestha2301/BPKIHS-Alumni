import { expect, test } from '@playwright/test';

/**
 * The smoke pass every engine runs. The rest of the suite is Chromium-only on purpose: it is
 * long, and layout is already covered there. These three pages prove the shared shell, the
 * client feed and the newest public section all render and link outside Chromium.
 */
test.describe('cross-browser smoke', () => {
  test('the home page renders its heading and main navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  });

  test('the community feed renders posts and their links', async ({ page }) => {
    await page.goto('/community');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Community');
    await expect(page.getByRole('link', { name: 'Read the full post' }).first()).toBeVisible();
  });

  test('the transparency page renders its table and the recent gifts', async ({ page }) => {
    await page.goto('/donate/transparency');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent gifts' })).toBeVisible();
  });
});
