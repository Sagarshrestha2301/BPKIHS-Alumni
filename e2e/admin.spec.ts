import { expect, type Page, test } from '@playwright/test';

import { confirmEmail, readUserRole } from './helpers/accounts';
import { botHeaders, mutationHeaders } from './helpers/requests';
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
    headers: { ...(await mutationHeaders(page, siteOrigin())), ...botHeaders() },
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
  const record = (await created.json()) as { id: string };

  // A new registration is a normal account until approval; it must not read alumni-only data.
  expect(await readUserRole(email)).toBe('donor');

  // Approval is refused until the owner confirms the address; the suite cannot read the
  // emailed code, so the fixture confirms it directly.
  await confirmEmail(email);
  return record;
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
    // Exact, so the field is not confused with the show-password button beside it.
    await expect(main.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
    await expect(main.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled();
    // The form itself is exercised once per run by the setup project, which signs in as
    // `ADMIN` through the same endpoint and stores the session every other spec reuses.
    // Signing in again here would spend the sign-in rate limit for no extra coverage.
  });
});

test.describe('admin dashboard', () => {
  test.use({ storageState: ADMIN_STATE });

  test('runs in its own shell, without the public banner or footer', async ({ page }, testInfo) => {
    await page.goto('/admin');

    // The public chrome stays out of the dashboard.
    await expect(page.getByRole('contentinfo')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Main', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Register' })).toHaveCount(0);

    // The sidebar is permanent on desktop; on a phone the same grouped menu opens from the
    // header. Either way the dashboard owns a navigation landmark called "Admin".
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
    }
    const adminNav = page.getByRole('navigation', { name: 'Admin', exact: true });
    await expect(adminNav).toBeVisible();
    await expect(adminNav.getByRole('link', { name: /Registrations/ })).toBeVisible();
    await expect(adminNav.getByRole('link', { name: 'Donations' })).toBeVisible();
    await expect(adminNav.getByRole('link', { name: 'Security' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
  });

  test('the overview links into every queue and section', async ({ page }) => {
    await page.goto('/admin');

    // KPIs, queue tiles and quick actions are all links into the app.
    await expect(page.getByRole('link', { name: /Approved alumni/ })).toHaveAttribute(
      'href',
      '/admin/alumni?status=approved',
    );
    await expect(page.getByRole('link', { name: 'Import alumni', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'See all' }).first()).toBeVisible();
    // The giving chart and its screen-reader table are both present.
    await expect(page.getByRole('table', { name: 'Confirmed payments by month' })).toBeAttached();
    await expect(page.getByRole('table', { name: 'Profiles added by month' })).toBeAttached();
  });

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

    // Approval is the role transition: a registration starts as a normal user and only
    // becomes an alumnus once the Association publishes it.
    expect(await readUserRole(email)).toBe('alumni');
  });

  test('rejecting an approved profile demotes the account again', async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e.demote.${stamp}@example.com`;
    const { id } = await createRegistration(page, email, `E2E Demote ${stamp}`);
    const headers = await mutationHeaders(page, siteOrigin());

    const approved = await page.request.post(`/api/v1/admin/alumni/${id}/approve`, { headers });
    expect(approved.status()).toBe(200);
    expect(await readUserRole(email)).toBe('alumni');

    const rejected = await page.request.post(`/api/v1/admin/alumni/${id}/reject`, {
      headers,
      data: { reason: 'E2E role check' },
    });
    expect(rejected.status()).toBe(200);
    expect(await readUserRole(email)).toBe('donor');
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

    // The control shows the pick immediately, so wait for the save itself before reloading;
    // a reload aborts an in-flight request.
    const patched = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url().includes('/api/v1/admin/tickets/'),
    );
    await status.selectOption('in_progress');
    expect((await patched).status()).toBe(200);
    await expect(status).toHaveValue('in_progress');

    await page.reload();
    await expect(
      page.getByRole('row', { name: new RegExp(subject) }).getByLabel('Change status'),
    ).toHaveValue('in_progress');
  });

  test('offers two-factor enrolment', async ({ page }) => {
    await page.goto('/admin/security');
    await expect(page.getByRole('heading', { name: 'Security' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Two-factor authentication' })).toBeVisible();
    await expect(page.getByText('Not enabled').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Set up two-factor' })).toBeVisible();
  });

  test('shows which payment gateways are configured and the last check', async ({ page }) => {
    await page.goto('/admin/payments');
    await expect(page.getByRole('heading', { level: 1, name: 'Payments' })).toBeVisible();

    const table = page.getByRole('table', {
      name: 'Payment gateway configuration and last acceptance check',
    });
    await expect(table).toBeVisible();
    for (const name of ['eSewa', 'Khalti', 'ConnectIPS', 'Fonepay']) {
      await expect(table.getByRole('rowheader', { name, exact: true })).toBeVisible();
    }

    // Fonepay is on the agreed list but has no adapter, so it can never be offered.
    await expect(table.getByRole('row', { name: /Fonepay/ })).toContainText('Not built');

    // The seeded run is reported with its status and the mode it ran in.
    const connectips = table.getByRole('row', { name: /ConnectIPS/ });
    await expect(connectips).toContainText('Passed');
    await expect(connectips).toContainText('sandbox');
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
