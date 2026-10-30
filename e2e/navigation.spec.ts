import { expect, test } from '@playwright/test';

import { MEMBER_STATE } from './helpers/storage';

test('page has one banner, one main and one footer landmark', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
});

test.describe('signed-in header', () => {
  test.use({ storageState: MEMBER_STATE });

  test('shows the member name instead of Sign in and drops Register', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');

    if (isMobile) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      const dialog = page.getByRole('dialog', { name: 'Menu' });
      const account = dialog.getByRole('link', { name: 'E2E Member' });
      await expect(account).toBeVisible();
      await expect(account).toHaveAttribute('href', '/account');
      await expect(dialog.getByRole('link', { name: 'Register' })).toHaveCount(0);
      await expect(dialog.getByRole('link', { name: 'Sign in' })).toHaveCount(0);
      return;
    }

    const header = page.getByRole('banner');
    const account = header.getByRole('link', { name: 'E2E Member' });
    await expect(account).toBeVisible();
    await expect(account).toHaveAttribute('href', '/account');
    await expect(header.getByRole('link', { name: 'Sign in', exact: true })).toHaveCount(0);
    await expect(header.getByRole('link', { name: 'Register', exact: true })).toHaveCount(0);
    await expect(header.getByRole('link', { name: 'Donate', exact: true }).last()).toBeVisible();
  });
});

test.describe('desktop header (1440px)', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop layout only');
    await page.goto('/');
  });

  test('shows main navigation, Donate and Register; hides mobile controls', async ({ page }) => {
    const header = page.getByRole('banner');
    const mainNav = page.getByRole('navigation', { name: 'Main', exact: true });
    await expect(mainNav).toBeVisible();
    await expect(mainNav.getByRole('link', { name: 'Directory', exact: true })).toHaveAttribute(
      'href',
      '/directory',
    );
    await expect(header.getByRole('link', { name: 'Donate', exact: true }).last()).toBeVisible();
    await expect(header.getByRole('link', { name: 'Register', exact: true }).last()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
    await expect(page.getByRole('navigation', { name: 'Quick actions' })).toBeHidden();
  });

  test('Donate link goes to /donate', async ({ page }) => {
    await page
      .getByRole('banner')
      .getByRole('link', { name: 'Donate', exact: true })
      .last()
      .click();
    await expect(page).toHaveURL(/\/donate$/);
  });
});

test.describe('mobile layout (360px)', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile layout only');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('shows the bottom action bar and hides the desktop navigation', async ({ page }) => {
    const bar = page.getByRole('navigation', { name: 'Quick actions' });
    await expect(bar).toBeVisible();
    await expect(bar.getByRole('link', { name: 'Donate', exact: true })).toBeVisible();
    await expect(bar.getByRole('link', { name: 'Find alumni', exact: true })).toBeVisible();
    await expect(bar.getByRole('link', { name: 'Events', exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main', exact: true })).toBeHidden();
  });

  test('menu opens and closes with Escape', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('navigation', { name: 'Mobile', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('a menu link navigates and closes the menu', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Menu' });
    await page.getByRole('button', { name: 'Open menu' }).click();
    await dialog.getByRole('link', { name: 'Donate', exact: true }).last().click();
    await expect(page).toHaveURL(/\/donate$/);
    await expect(dialog).toBeHidden();
  });

  test('bottom bar is hidden on the checkout route', async ({ page }) => {
    await page.goto('/donate/checkout');
    await expect(page.getByRole('navigation', { name: 'Quick actions' })).toHaveCount(0);
  });
});
