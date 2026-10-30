import { expect, test } from '@playwright/test';

import { MEMBER_STATE, SIGNED_OUT } from './helpers/storage';

/** The key the form uses for a message written before signing in. */
const DRAFT_KEY = 'bpkihs.support.draft';

/**
 * The helpdesk is open to everyone while it is being written. A visitor is asked for an
 * account only when they press Send, and the message is kept for the trip through sign-in.
 * The page also carries a separate no-account contact form for institutional enquiries, so
 * every locator here is scoped to the helpdesk region.
 */
test.describe('support, signed out', () => {
  test.use({ storageState: SIGNED_OUT });

  function helpdesk(page: import('@playwright/test').Page) {
    return page.getByRole('main').getByRole('region', { name: 'Send a message' });
  }

  function contactForm(page: import('@playwright/test').Page) {
    return page
      .getByRole('main')
      .getByRole('region', { name: 'General and institutional enquiries' });
  }

  test('lets a visitor write a message without signing in first', async ({ page }) => {
    await page.goto('/support');

    await expect(helpdesk(page).getByLabel('Full name')).toBeVisible();
    await expect(helpdesk(page).getByLabel('Email address')).toBeVisible();
    await expect(helpdesk(page).getByLabel('Subject')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sign in to send a message' })).toHaveCount(0);
  });

  test('shows a separate no-account form for institutions', async ({ page }) => {
    await page.goto('/support');

    const form = contactForm(page);
    await expect(form).toBeVisible();
    await expect(form.getByLabel('Organisation (optional)')).toBeVisible();
    await expect(form.getByRole('button', { name: 'Send enquiry' })).toBeVisible();
    // The general form never asks for an account.
    await expect(form.getByText('Sign in', { exact: true })).toHaveCount(0);
  });

  test('asks for sign-in only once a complete message is submitted', async ({ page }) => {
    await page.goto('/support');

    const form = helpdesk(page);
    await form.getByLabel('Full name').fill('Guest Visitor');
    await form.getByLabel('Email address').fill('guest@example.com');
    await form.getByLabel('Subject').fill('A question for the office');
    await form.getByLabel('Message').fill('This message was written by a signed-out visitor.');
    await form.getByRole('button', { name: 'Send message' }).click();

    const dialog = page.getByRole('dialog', { name: 'Sign in to send your message' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Sign in', exact: true })).toHaveAttribute(
      'href',
      '/sign-in?next=%2Fsupport',
    );
    await expect(dialog.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register',
    );
    // Nothing was sent without an account.
    await expect(
      page.getByRole('heading', { name: 'Thank you. Your message has been received.' }),
    ).toHaveCount(0);

    // Dismissing the dialog keeps what was written.
    await dialog.getByRole('button', { name: 'Keep editing' }).click();
    await expect(dialog).toBeHidden();
    await expect(form.getByLabel('Subject')).toHaveValue('A question for the office');
    await expect(form.getByLabel('Message')).toHaveValue(
      'This message was written by a signed-out visitor.',
    );
  });

  test('shows field errors instead of the sign-in prompt when fields are missing', async ({
    page,
  }) => {
    await page.goto('/support');
    await helpdesk(page).getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText('Enter your name.')).toBeVisible();
    await expect(page.getByText('Enter your email address.')).toBeVisible();
    await expect(page.getByText('Enter a short subject.')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('support, member', () => {
  test.use({ storageState: MEMBER_STATE });

  function helpdesk(page: import('@playwright/test').Page) {
    return page.getByRole('main').getByRole('region', { name: 'Send a message' });
  }

  test('shows the form addressed to the member account', async ({ page }) => {
    await page.goto('/support');

    const form = helpdesk(page);
    await expect(form.getByLabel('Subject')).toBeVisible();
    await expect(form.getByLabel('Message')).toBeVisible();
    // Identity comes from the account instead of two more fields to fill in.
    await expect(page.getByText('Sending as')).toBeVisible();
    await expect(form.getByLabel('Full name')).toHaveCount(0);
  });

  test('a message goes through and comes back with a reference', async ({ page }) => {
    const stamp = Date.now();
    await page.goto('/support');

    const form = helpdesk(page);
    await form.getByLabel('Topic').selectOption('general');
    await form.getByLabel('Subject').fill(`E2E support ${stamp}`);
    await form.getByLabel('Message').fill('This message exists so the helpdesk form is exercised.');
    await form.getByRole('button', { name: 'Send message' }).click();

    await expect(
      page.getByRole('heading', { name: 'Thank you. Your message has been received.' }),
    ).toBeVisible();
    await expect(page.getByText(/Ticket reference:/)).toBeVisible();
  });

  test('a message written before signing in comes back filled', async ({ page }) => {
    await page.addInitScript((key: string) => {
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          topic: 'general',
          name: 'E2E Member',
          email: 'member@bpkihs.local',
          subject: 'A message kept across sign-in',
          message: 'This message survived the trip through the sign-in page.',
        }),
      );
    }, DRAFT_KEY);

    await page.goto('/support');

    const form = helpdesk(page);
    await expect(page.getByText(/Your message was kept/)).toBeVisible();
    await expect(form.getByLabel('Subject')).toHaveValue('A message kept across sign-in');
    await expect(form.getByLabel('Message')).toHaveValue(
      'This message survived the trip through the sign-in page.',
    );
  });
});
