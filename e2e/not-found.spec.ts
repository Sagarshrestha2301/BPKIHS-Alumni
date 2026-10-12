import { expect, test } from '@playwright/test';

const missing = '/this-page-does-not-exist';

test.describe('404 page', () => {
  test('returns 404 with a heading and helpful links', async ({ page }) => {
    const response = await page.goto(missing);
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { level: 1, name: 'We could not find that page' }),
    ).toBeVisible();
    const main = page.getByRole('main');
    await expect(main.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Alumni directory', exact: true })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Events', exact: true })).toBeVisible();
  });

  test('search sends the query to the directory', async ({ page }) => {
    await page.goto(missing);
    await page.getByLabel('Search the alumni directory').fill('cardiology');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/directory\?q=cardiology$/);
  });

  test('Home link returns to the home page', async ({ page }) => {
    await page.goto(missing);
    await page.getByRole('main').getByRole('link', { name: 'Home', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
