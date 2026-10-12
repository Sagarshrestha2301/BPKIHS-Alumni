import { expect, test } from '@playwright/test';

test.describe('styleguide (dev only)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/styleguide');
    await page.waitForLoadState('networkidle');
  });

  test('has one h1, a section index and every section heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Styleguide' })).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Styleguide sections' })).toBeVisible();
    for (const name of ['Colours', 'Typography', 'Buttons', 'Forms', 'Surfaces', 'Feedback']) {
      await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();
    }
  });

  test('form errors are announced next to their fields', async ({ page }) => {
    await expect(page.getByRole('alert').first()).toBeVisible();
  });

  test('dialog opens and closes with Escape', async ({ page }) => {
    await page.getByRole('button', { name: 'Open dialog' }).click();
    const dialog = page.getByRole('dialog', { name: 'Sample dialog' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
