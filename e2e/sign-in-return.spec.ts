import { expect, test } from '@playwright/test';

import { MEMBER_STATE, SIGNED_OUT } from './helpers/storage';

/**
 * A gated page offers to come back to itself after signing in. The gate builds
 * `/sign-in?next=…`, the sign-in page validates that value (`safeReturnPath`) and sends the
 * member back to it : never to another origin, and never to `/sign-in` or `/admin`.
 */
test.describe('the gate offers a return path, signed out', () => {
  test.use({ storageState: SIGNED_OUT });

  test('the directory keeps the search the visitor was looking at', async ({ page }) => {
    await page.goto('/directory?q=MBBS');

    const main = page.getByRole('main');
    await expect(main.getByRole('link', { name: 'Sign in', exact: true })).toHaveAttribute(
      'href',
      '/sign-in?next=%2Fdirectory%3Fq%3DMBBS',
    );
  });

  test('a public profile opens without any gate', async ({ page }) => {
    await page.goto('/directory/alumnus-003');

    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Chandra Gurung' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Sign in', exact: true })).toHaveCount(0);
  });

  test('community returns to its own page', async ({ page }) => {
    await page.goto('/community');
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Sign in', exact: true }),
    ).toHaveAttribute('href', '/sign-in?next=%2Fcommunity');
  });

  test('support asks only when a message is sent, so there is no gate to return from', async ({
    page,
  }) => {
    await page.goto('/support');

    const helpdesk = page.getByRole('main').getByRole('region', { name: 'Send a message' });
    await expect(helpdesk.getByLabel('Full name')).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Sign in', exact: true }),
    ).toHaveCount(0);
  });

  test('another origin in next is ignored', async ({ page }) => {
    await page.goto('/sign-in?next=//evil.example/directory');

    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/sign-in');
  });
});

test.describe('a signed-in member is sent straight on', () => {
  test.use({ storageState: MEMBER_STATE });

  test('to the page that asked for the sign-in', async ({ page }) => {
    await page.goto('/sign-in?next=%2Fdirectory%3Fq%3DMBBS');

    await expect(page).toHaveURL(/\/directory\?q=MBBS$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Alumni directory' })).toBeVisible();
  });

  test('but not to the admin dashboard, and not in a loop', async ({ page }) => {
    await page.goto('/sign-in?next=%2Fadmin');
    await expect(page).toHaveURL(/\/account$/);

    await page.goto('/sign-in?next=%2Fsign-in');
    await expect(page).toHaveURL(/\/account$/);
  });
});
