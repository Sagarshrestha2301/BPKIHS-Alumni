import { expect, type Page, test } from '@playwright/test';

import { confirmEmail } from './helpers/accounts';
import { mutationHeaders } from './helpers/requests';
import { ADMIN_STATE, SIGNED_OUT } from './helpers/storage';

/** The origin the suite is driving, taken from the config rather than hard-coded. */
function siteOrigin(): string {
  const base = test.info().project.use.baseURL;
  if (!base) throw new Error('baseURL is not configured in playwright.config.ts');
  return base;
}

/** The password every fixture registration is created with. Never promoted to an admin. */
const REGISTRATION_PASSWORD = 'SampleMember!2026';

async function createRegistration(page: Page, email: string, fullName: string) {
  const created = await page.request.post('/api/v1/registrations', {
    headers: await mutationHeaders(page, siteOrigin()),
    data: {
      fullName,
      email,
      programme: 'MBBS',
      batchYear: 2015,
      city: 'Dharan',
      country: 'Nepal',
      privacy: { email: 'public', phone: 'public', profile: 'public' },
      consent: true,
      password: REGISTRATION_PASSWORD,
      confirmPassword: REGISTRATION_PASSWORD,
    },
  });
  expect(created.status()).toBe(201);

  // Approval is refused until the owner confirms the address; the suite cannot read the
  // emailed code, so the fixture confirms it directly.
  await confirmEmail(email);
}

test.describe('admin gate, signed out', () => {
  test.use({ storageState: SIGNED_OUT });

  test('sends a signed-out visitor to the sign-in page', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Admin sign-in' })).toBeVisible();
  });

  test('shows the admin sign-in form', async ({ page }) => {
    await page.goto('/admin/sign-in');
    const main = page.getByRole('main');
    await expect(main.getByLabel('Email address')).toBeVisible();
    await expect(main.getByLabel('Password')).toHaveAttribute('type', 'password');
    await expect(main.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled();
    // The form itself is exercised once per run by the setup project, which signs in as
    // `ADMIN` through the same endpoint and stores the session every other spec reuses.
    // Signing in again here would spend the sign-in rate limit for no extra coverage.
  });
});

test.describe('admin dashboard', () => {
  test.use({ storageState: ADMIN_STATE });

  test('approves a new registration', async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e.admin.${stamp}@example.com`;
    await createRegistration(page, email, `E2E Admin Person ${stamp}`);

    await page.goto('/admin/alumni?status=pending');

    const row = page.getByRole('row', { name: new RegExp(`E2E Admin Person ${stamp}`) });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Approve' }).click();
    await expect(row).toBeHidden();

    await page.goto(`/admin/alumni?status=approved&q=${encodeURIComponent(email)}`);
    await expect(
      page.getByRole('row', { name: new RegExp(`E2E Admin Person ${stamp}`) }),
    ).toContainText('Approved');
  });

  test('publishes a community post', async ({ page }) => {
    const stamp = Date.now();
    const title = `E2E story ${stamp}`;
    // `page.request` shares the browser's cookie jar, so the CSRF token and session match.
    const created = await page.request.post('/api/v1/posts', {
      headers: await mutationHeaders(page, siteOrigin()),
      data: {
        type: 'story',
        title,
        body: 'A short story submitted by the browser test so the moderation queue has something to publish.',
        authorName: 'E2E Author',
        authorEmail: `e2e.author.${stamp}@example.com`,
      },
    });
    expect(created.status()).toBe(201);

    await page.goto('/admin/posts');

    const card = page.getByRole('listitem').filter({ hasText: title });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Publish' }).click();
    await expect(card).toBeHidden();

    const feed = await page.request.get('/api/v1/feed?pageSize=100');
    expect(await feed.text()).toContain(title);
  });

  test('moves a support ticket to in progress', async ({ page }) => {
    const stamp = Date.now();
    const subject = `E2E ticket ${stamp}`;
    const created = await page.request.post('/api/v1/support', {
      headers: await mutationHeaders(page, siteOrigin()),
      data: {
        topic: 'general',
        name: 'E2E Ticket',
        email: `e2e.ticket.${stamp}@example.com`,
        subject,
        message: 'This ticket exists so the admin status control has something to move.',
      },
    });
    expect(created.status()).toBe(201);

    await page.goto('/admin/tickets');

    const row = page.getByRole('row', { name: new RegExp(subject) });
    const status = row.getByLabel('Change status');
    await expect(status).toHaveValue('open');
    await status.selectOption('in_progress');
    await expect(status).toHaveValue('in_progress');

    await page.reload();
    await expect(
      page.getByRole('row', { name: new RegExp(subject) }).getByLabel('Change status'),
    ).toHaveValue('in_progress');
  });

  test('exports the donation ledger as CSV', async ({ page }) => {
    await page.goto('/admin/donations');
    const download = page.getByRole('link', { name: 'Download CSV' });
    await expect(download).toHaveAttribute('href', '/api/v1/admin/donations/export');

    const response = await page.request.get('/api/v1/admin/donations/export');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/csv');
    expect(response.headers()['content-disposition']).toContain('attachment');
    expect(await response.text()).toContain('reference,amount_npr,method,status,goal,recorded');
  });
});
