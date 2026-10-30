import type { Page } from '@playwright/test';

import { BOT_TOKEN_HEADER } from '../../src/lib/constants/bot';
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

/**
 * The bot-check header a post to one of the gated public forms has to present.
 *
 * A straight-to-the-API post is precisely what a script looks like, so the server refuses it
 * without a Turnstile token. Two cases matter:
 *
 * - **No site key configured** (how the suite normally runs): the server skips the check outside
 *   production, so there is nothing to send.
 * - **Cloudflare's published test keys** (the always-pass site key): its widget answers with this
 *   fixed token and the matching test secret accepts it, so a keyed run still passes.
 *
 * Real keys are deliberately not handled: a genuine challenge cannot be solved by a script, and
 * a suite that failed loudly on real keys would be reporting the truth.
 */
export function botHeaders(): Record<string, string> {
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return {};
  return { [BOT_TOKEN_HEADER]: 'XXXX.DUMMY.TOKEN.XXXX' };
}
