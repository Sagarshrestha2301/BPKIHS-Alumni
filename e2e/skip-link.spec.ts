import { expect, test } from '@playwright/test';

test.describe('skip link', () => {
  test('first Tab focuses it and makes it visible', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const link = page.getByRole('link', { name: 'Skip to main content' });
    await expect(link).toBeFocused();
    const box = await link.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(100);
  });

  test('Enter moves focus to the main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);
    await expect(page.locator('#main-content')).toBeFocused();
  });
});
