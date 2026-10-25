import { expect, test } from '@playwright/test';

import { DONOR_STATE, SIGNED_OUT } from './helpers/storage';

/** Keep the browser offline: fulfil the gateway page instead of reaching eSewa. */
async function stubGateway(page: import('@playwright/test').Page) {
  await page.route('https://rc-epay.esewa.com.np/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>eSewa sandbox</title><p>eSewa sandbox</p>',
    });
  });
}

test.describe('donation checkout, signed out', () => {
  test.use({ storageState: SIGNED_OUT });

  test('asks for a sign-in before taking payment', async ({ page }) => {
    await page.goto('/donate/checkout?goal=goal-scholarship&amount=2500');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'Complete your gift' })).toBeVisible();
    await main.getByRole('button', { name: 'Continue' }).click();
    await expect(main.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
  });
});

test.describe('donation checkout, signed in as a donor', () => {
  test.use({ storageState: DONOR_STATE });

  test('sends the donor to the eSewa gateway', async ({ page }) => {
    await stubGateway(page);

    await page.goto('/donate/checkout?goal=goal-scholarship&amount=2500');

    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'Complete your gift' })).toBeVisible();

    await main.getByRole('button', { name: 'Continue' }).click();

    await expect(main.getByRole('heading', { name: 'Payment method' })).toBeVisible();
    const esewa = main.getByRole('radio', { name: /eSewa/ });
    await esewa.check();
    await expect(esewa).toBeChecked();
    await expect(main.getByText(/redirected to the provider/i)).toBeVisible();

    const gatewayRequest = page.waitForRequest('https://rc-epay.esewa.com.np/**');
    await main.getByRole('button', { name: 'Complete gift' }).click();
    const request = await gatewayRequest;

    expect(request.method()).toBe('POST');
    const body = request.postData() ?? '';
    expect(body).toContain('total_amount=2500.00');
    expect(body).toContain('product_code=');
    expect(body).toContain('signature=');
    expect(body).toContain('transaction_uuid=');
  });
});

test.describe('thank-you page', () => {
  test('shows a confirmed gift', async ({ page }) => {
    await page.goto(
      '/donate/thank-you?id=123e4567-e89b-12d3-a456-426614174000&status=succeeded&amount=250000&goal=Scholarships&method=eSewa',
    );

    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', { level: 2, name: 'Thank you for your gift' }),
    ).toBeVisible();
    await expect(main).toContainText('NPR 2,500');
    await expect(main).toContainText('eSewa');
    await expect(main).toContainText('123e4567-e89b-12d3-a456-426614174000');
  });

  test('reports a failed payment instead of a receipt', async ({ page }) => {
    await page.goto('/donate/thank-you?status=failed');
    await expect(page.getByRole('heading', { name: 'Your gift was not completed' })).toBeVisible();
  });
});
