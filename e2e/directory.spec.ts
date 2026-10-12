import { expect, test } from '@playwright/test';

test.describe('directory', () => {
  test('shows the title, a result count and person cards', async ({ page }) => {
    await page.goto('/directory');
    await expect(page.getByRole('heading', { level: 1, name: 'Alumni directory' })).toBeVisible();
    await expect(page.getByText(/Showing 1\S\d+ of \d+ alumni/)).toBeVisible();
    await expect(
      page.getByRole('list', { name: 'Alumni results' }).getByRole('listitem').first(),
    ).toBeVisible();
  });

  test('searching puts the text in the URL and keeps it in the box', async ({ page }) => {
    await page.goto('/directory');
    const search = page.getByRole('main').getByRole('search');
    await search.getByLabel('Search alumni').fill('MBBS');
    await search.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/q=MBBS/);
    await expect(page.getByRole('searchbox', { name: 'Search alumni' })).toHaveValue('MBBS');
    await expect(page.getByRole('list', { name: 'Alumni results' })).toBeVisible();
  });

  test('a search with no matches shows the empty state', async ({ page }) => {
    await page.goto('/directory?q=zzzzqqqq');
    await expect(page.getByText('No alumni found')).toBeVisible();
    await page.getByRole('link', { name: 'Clear search' }).click();
    await expect(page).toHaveURL(/\/directory$/);
  });

  test('page links change the page', async ({ page }) => {
    await page.goto('/directory');
    await page.getByRole('link', { name: 'Page 2' }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/Showing 13\S\d+ of \d+ alumni/)).toBeVisible();
  });
});
