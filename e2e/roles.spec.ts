import { expect, test } from '@playwright/test';

import {
  ADMIN_STATE,
  DONOR_STATE,
  MEMBER_STATE,
  RESTRICTED_EMAIL,
  RESTRICTED_ID,
  RESTRICTED_NAME,
  SIGNED_OUT,
} from './helpers/storage';

/**
 * The role matrix, exercised against one approved profile whose visibility is `alumni_only`:
 *
 * - signed out the public directory works, but this record answers 404 from the API and the
 *   not-found screen from the page, and none of it appears in the list;
 * - a normal (donor) account gets the same public view;
 * - an alumnus and an administrator open it and see the alumni-only email address;
 * - the directory list follows the same rule, including the cached data helpers.
 */

const PROFILE_URL = `/directory/${RESTRICTED_ID}`;
const API_URL = `/api/v1/alumni/${RESTRICTED_ID}`;
const SEARCH_URL = '/directory?q=E2E%20Restricted';

test.describe('signed-out visitor', () => {
  test.use({ storageState: SIGNED_OUT });

  test('cannot read an alumni-only profile', async ({ page }) => {
    expect((await page.request.get(API_URL)).status()).toBe(404);
    await page.goto(PROFILE_URL);
    await expect(page.getByRole('heading', { name: 'We could not find that page' })).toBeVisible();
    await expect(page.getByText(RESTRICTED_EMAIL)).toHaveCount(0);
  });

  test('can browse public profiles without signing in', async ({ page }) => {
    expect((await page.request.get('/api/v1/alumni?pageSize=1')).status()).toBe(200);
    await page.goto('/directory/alumnus-003');
    await expect(page.getByRole('heading', { level: 1, name: 'Chandra Gurung' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Sign in to search the directory' }),
    ).toHaveCount(0);
    await expect(page.getByText(RESTRICTED_EMAIL)).toHaveCount(0);
  });

  test('the directory list hides members-only profiles', async ({ page }) => {
    await page.goto(SEARCH_URL);
    await expect(page.getByText('No alumni found')).toBeVisible();
    await expect(page.getByText(RESTRICTED_NAME)).toHaveCount(0);
    await expect(page.getByText('You are browsing public profiles.')).toBeVisible();
    await expect(page.getByText('Sign in to see members-only contact details.')).toBeVisible();
  });
});

test.describe('normal user', () => {
  test.use({ storageState: DONOR_STATE });

  test('cannot read an alumni-only profile', async ({ page }) => {
    expect((await page.request.get(API_URL)).status()).toBe(404);
    await page.goto(PROFILE_URL);
    await expect(page.getByRole('heading', { name: 'We could not find that page' })).toBeVisible();
    await expect(page.getByText(RESTRICTED_EMAIL)).toHaveCount(0);
  });

  test('the directory list omits it', async ({ page }) => {
    await page.goto(SEARCH_URL);
    await expect(page.getByText('No alumni found')).toBeVisible();
  });

  test('the account page names the normal-user role', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByText('Standard account')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open the admin dashboard' })).toHaveCount(0);
  });
});

test.describe('alumni', () => {
  test.use({ storageState: MEMBER_STATE });

  test('can read the profile and its alumni-only email', async ({ page }) => {
    expect((await page.request.get(API_URL)).status()).toBe(200);

    const response = await page.goto(PROFILE_URL);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: RESTRICTED_NAME })).toBeVisible();
    await expect(page.getByText(RESTRICTED_EMAIL)).toBeVisible();
  });

  test('the directory list includes it', async ({ page }) => {
    await page.goto(SEARCH_URL);
    await expect(page.getByRole('link', { name: RESTRICTED_NAME, exact: true })).toBeVisible();
  });

  test('the account page names the alumni role', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByText('Alumni member')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open the admin dashboard' })).toHaveCount(0);
  });
});

test.describe('administrator', () => {
  test.use({ storageState: ADMIN_STATE });

  test('can read an alumni-only profile too', async ({ page }) => {
    expect((await page.request.get(API_URL)).status()).toBe(200);

    const response = await page.goto(PROFILE_URL);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: RESTRICTED_NAME })).toBeVisible();
  });

  test('the account page names the admin role and links the dashboard', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByText('Administrator')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open the admin dashboard' })).toHaveAttribute(
      'href',
      '/admin',
    );
  });
});
