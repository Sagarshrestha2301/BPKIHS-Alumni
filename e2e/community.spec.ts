import { expect, test } from '@playwright/test';

import { MEMBER_STATE, SIGNED_OUT } from './helpers/storage';

test.describe('community sharing, signed out', () => {
  test.use({ storageState: SIGNED_OUT });

  test('gets the sign-in gate instead of the form', async ({ page }) => {
    await page.goto('/community');

    await expect(page.getByRole('heading', { name: 'Sign in to share an update' })).toBeVisible();
    await expect(page.getByText('Share an update with the network')).toHaveCount(0);
    // Reporting is members-only too, so the control is not offered.
    await expect(page.getByText('Report this post')).toHaveCount(0);

    // The feed itself stays public.
    await expect(page.getByRole('link', { name: 'Read the full post' }).first()).toBeVisible();
  });
});

test.describe('community sharing, member', () => {
  test.use({ storageState: MEMBER_STATE });

  test('gets the form and the report control', async ({ page }) => {
    await page.goto('/community');

    await expect(page.getByText('Share an update with the network')).toBeVisible();
    await expect(page.getByText('Report this post').first()).toBeVisible();
  });
});

test.describe('community posts', () => {
  test('a card opens the full post', async ({ page }) => {
    await page.goto('/community');

    const readMore = page.getByRole('link', { name: 'Read the full post' }).first();
    const href = await readMore.getAttribute('href');
    expect(href).toMatch(/^\/community\/.+/);

    await readMore.click();

    await expect(page).toHaveURL(/\/community\/.+/);
    expect(page.url().endsWith(href ?? '')).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();
    await expect(page.locator('article p').first()).not.toBeEmpty();
    await expect(page.getByRole('link', { name: 'Back to the community feed' })).toBeVisible();
  });

  test('an unknown post is not found', async ({ page, request }) => {
    // The API is the authority: an unapproved or missing id is a real 404.
    const response = await request.get('/api/v1/feed/this-post-does-not-exist');
    expect(response.status()).toBe(404);

    // The page streams, so the status is already sent; assert the 404 screen instead.
    await page.goto('/community/this-post-does-not-exist');
    await expect(page.getByRole('heading', { name: 'We could not find that page' })).toBeVisible();
  });
});
