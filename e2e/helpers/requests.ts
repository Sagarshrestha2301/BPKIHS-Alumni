import type { Page } from '@playwright/test';

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../../src/lib/constants/security';

/** The token from the readable cookie, or undefined when there is none (or it expired). */
async function csrfToken(page: Page): Promise<string | undefined> {
  const cookies = await page.context().cookies();
  return cookies.find((cookie) => cookie.name === CSRF_COOKIE_NAME)?.value;
}

/**
 * Headers a cookie-authenticated mutation needs.
 *
 * Once a request carries a session cookie the server requires the double-submit token: the
 * value of the readable `bpkihs_csrf` cookie echoed in `x-csrf-token`. The browser client does
 * this for itself; a test posting straight to the API has to do it explicitly.
 *
 * A stored session outlives the twelve-hour CSRF cookie, and the browser drops the expired one,
 * so the token is fetched again from any document response before giving up.
 */
export async function mutationHeaders(page: Page, origin: string): Promise<Record<string, string>> {
  let token = await csrfToken(page);
  if (!token) {
    await page.goto('/');
    token = await csrfToken(page);
  }

  return {
    Origin: origin,
    ...(token ? { [CSRF_HEADER_NAME]: token } : {}),
  };
}
