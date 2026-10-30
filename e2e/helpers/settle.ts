import type { Page } from '@playwright/test';

/**
 * Waits for a public page to be quiet enough to scan or tab through.
 *
 * Ordinary pages settle on network idle. A page that mounts the Cloudflare Turnstile widget
 * never does : the widget keeps working in the background : so waiting for `networkidle` there
 * times out the test instead of the page. Such a page is settled once the widget has rendered,
 * which is signalled by the hidden response field it owns and fills in with the visitor's token.
 *
 * The quiet period is bounded rather than the default, so a page that really is stuck still
 * fails promptly with Playwright's own timeout.
 */
export async function settle(page: Page, quietMs = 8_000): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout: quietMs });
  } catch {
    await page
      .locator('input[name="cf-turnstile-response"]')
      .first()
      .waitFor({ state: 'attached', timeout: quietMs });
  }
}
