import { expect, test } from '@playwright/test';

import { MEMBER_STATE } from './helpers/storage';

const DESKTOP_MIN_WIDTH = 1024;

// The directory is members-only, so these run as an approved alumnus.
test.describe('directory filters', () => {
  test.use({ storageState: MEMBER_STATE });

  test('desktop: apply a filter from the sidebar, see its chip, remove it', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < DESKTOP_MIN_WIDTH, 'sidebar is desktop only');
    await page.goto('/directory');
    const sidebar = page.getByRole('complementary', { name: 'Directory filters' });
    await sidebar.getByLabel('Programme').selectOption('BMIT');
    await sidebar.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page).toHaveURL(/programme=BMIT/);
    await expect(page.getByRole('link', { name: 'Remove filter: BMIT' })).toBeVisible();
    await page.getByRole('link', { name: 'Remove filter: BMIT' }).click();
    await expect(page).not.toHaveURL(/programme=/);
  });

  test('mobile: open the Filters sheet, apply, and see the count', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= DESKTOP_MIN_WIDTH, 'sheet is mobile only');
    await page.goto('/directory');
    await page.getByRole('button', { name: /^Filters/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Programme').selectOption('BMIT');
    await dialog.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page).toHaveURL(/programme=BMIT/);
    await expect(page.getByRole('button', { name: 'Filters (1)' })).toBeVisible();
  });

  test('searching keeps the filters that are already set', async ({ page }) => {
    await page.goto('/directory?programme=BMIT');
    const search = page.getByRole('main').getByRole('search');
    await search.getByLabel('Search alumni').fill('a');
    await search.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/programme=BMIT/);
    await expect(page).toHaveURL(/q=a/);
  });

  test('Clear all keeps the search text and drops the filters', async ({ page }) => {
    await page.goto('/directory?q=a&programme=BMIT&further=1');
    await page.getByRole('link', { name: 'Clear all' }).click();
    await expect(page).toHaveURL(/q=a/);
    await expect(page).not.toHaveURL(/programme=/);
    await expect(page).not.toHaveURL(/further=/);
  });

  test('a filtered URL narrows the list', async ({ page }) => {
    await page.goto('/directory?programme=BMIT');
    await expect(page.getByText(/Showing 1\S\d+ of \d+ alumni/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Remove filter: BMIT' })).toBeVisible();
  });
});
