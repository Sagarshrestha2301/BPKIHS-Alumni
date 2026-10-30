/**
 * Values shared by the browser widget and the server that verifies it.
 *
 * The token is not a secret: it is a short-lived proof that Cloudflare's widget ran in the
 * browser. It travels in a request header so the JSON contracts stay unchanged.
 */
export const BOT_TOKEN_HEADER = 'x-bot-token';

/** Loads the widget with explicit rendering; nothing is evaluated until a form mounts it. */
export const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Server-side verification endpoint. */
export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
