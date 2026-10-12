import { expect, test } from '@playwright/test';

test('home page loads with the site title and heading', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/BPKIHS Alumni Association/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'BPKIHS Alumni Association' }),
  ).toBeVisible();
});

test('page does not scroll sideways', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('stats band is on the page', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 2, name: 'Our community in numbers' }),
  ).toHaveCount(1);
});
