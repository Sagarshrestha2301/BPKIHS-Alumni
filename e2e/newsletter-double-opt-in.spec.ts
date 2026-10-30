import '../src/server/db/load-env';

import { expect, test } from '@playwright/test';
import postgres from 'postgres';

import { botHeaders } from './helpers/requests';

/** The origin the suite is driving, taken from the config rather than hard-coded. */
function siteOrigin(): string {
  const base = test.info().project.use.baseURL;
  if (!base) throw new Error('baseURL is not configured in playwright.config.ts');
  return base;
}

interface SubscriberRow {
  status: string;
  token: string;
}

async function readSubscriber(email: string): Promise<SubscriberRow | null> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing. The browser suite needs Postgres.');

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    const [row] = await sql<SubscriberRow[]>`
      select status::text, token from newsletter_subscribers where email = ${email}
    `;
    return row ?? null;
  } finally {
    await sql.end();
  }
}

async function deleteSubscriber(email: string): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing. The browser suite needs Postgres.');

  const sql = postgres(url, { max: 1, prepare: false });
  try {
    await sql`delete from newsletter_subscribers where email = ${email}`;
  } finally {
    await sql.end();
  }
}

/**
 * The newsletter limiter is five requests per minute per IP, shared by both browser projects.
 * This flow is identical on a phone : it is plain HTML with no layout-specific behaviour : so
 * one desktop pass covers it without tripping the limiter for the mobile project.
 */
test.describe('newsletter double opt-in', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only: the limiter is shared by both projects');

  test('holds a new address as pending until its emailed link is confirmed', async ({ page }) => {
    const email = `e2e.newsletter.${Date.now()}@example.com`;

    const first = await page.request.post('/api/v1/newsletter', {
      headers: { Origin: siteOrigin(), ...botHeaders() },
      data: { email, interests: ['news', 'events'] },
    });
    expect(first.status()).toBe(201);
    const created = (await first.json()) as { ok?: boolean; confirmationEmailSent?: unknown };
    expect(created.ok).toBe(true);
    // Whether the provider accepted the message depends on the local email transport, but the
    // answer must always say, so the form never claims an email it did not send.
    expect(typeof created.confirmationEmailSent).toBe('boolean');

    const pending = await readSubscriber(email);
    expect(pending?.status).toBe('pending');
    expect(pending?.token).toBeTruthy();

    // Asking again before confirming keeps the row pending and leaves the existing link
    // valid, so a lost email does not strand the address behind a rotated token.
    const second = await page.request.post('/api/v1/newsletter', {
      headers: { Origin: siteOrigin(), ...botHeaders() },
      data: { email, interests: ['news'] },
    });
    expect(second.status()).toBe(201);
    const stillPending = await readSubscriber(email);
    expect(stillPending?.status).toBe('pending');
    expect(stillPending?.token).toBe(pending?.token);

    // Loading the link is not confirmation: email clients and security scanners fetch links
    // in a message on their own.
    await page.goto(`/community/newsletter/confirm?token=${pending?.token as string}`);
    await expect(page.getByRole('button', { name: 'Confirm subscription' })).toBeVisible();
    expect((await readSubscriber(email))?.status).toBe('pending');

    // The button is the confirmation.
    await page.getByRole('button', { name: 'Confirm subscription' }).click();
    await expect(page).toHaveURL(/\/community\/newsletter\?confirmed=done/);
    await expect(page.getByRole('status')).toContainText('You are on the list');
    expect((await readSubscriber(email))?.status).toBe('subscribed');

    await deleteSubscriber(email);
  });

  test('an unknown confirmation token changes nothing and says so', async ({ page }) => {
    await page.goto('/community/newsletter/confirm?token=e2e-not-a-real-token');
    await page.getByRole('button', { name: 'Confirm subscription' }).click();

    await expect(page).toHaveURL(/\/community\/newsletter\?confirmed=invalid/);
    await expect(page.getByRole('status')).toContainText('not valid');
  });

  test('shows the invalid message when the link carries no token', async ({ page }) => {
    await page.goto('/community/newsletter/confirm');

    await expect(page.getByRole('status')).toContainText('not valid');
    await expect(page.getByRole('button', { name: 'Confirm subscription' })).toHaveCount(0);
  });
});
