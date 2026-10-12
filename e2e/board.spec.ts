import { expect, test } from '@playwright/test';

test.describe('board page', () => {
  test('shows the page title and a breadcrumb back to About', async ({ page }) => {
    await page.goto('/about/board');
    await expect(page.getByRole('heading', { level: 1, name: 'Our board' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About', exact: true }).first()).toBeVisible();
  });

  test('opens and closes a member dialog', async ({ page }) => {
    await page.goto('/about/board');
    const firstMember = page.getByRole('tabpanel').getByRole('button').first();
    await expect(firstMember).toBeVisible();
    await firstMember.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('switches to the previous boards, grouped by term', async ({ page }) => {
    await page.goto('/about/board');
    await page.getByRole('tab', { name: 'Previous boards' }).click();
    await expect(
      page.getByRole('tabpanel').getByRole('heading', { level: 3 }).first(),
    ).toBeVisible();
  });
});
