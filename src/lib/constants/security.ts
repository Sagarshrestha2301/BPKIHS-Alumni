/**
 * Names shared by the edge proxy (which issues the token) and the server (which verifies it).
 * Keep this module free of Node APIs so both runtimes can import it.
 */

/** Double-submit CSRF cookie. Readable by the browser so the client can echo it in a header. */
export const CSRF_COOKIE_NAME = 'bpkihs_csrf';

/** Header the browser must echo for cookie-authenticated mutations. */
export const CSRF_HEADER_NAME = 'x-csrf-token';

/** Request id attached to every API response and server log line. */
export const REQUEST_ID_HEADER = 'x-request-id';

/** Matches both `better-auth.session_token` and the `__Secure-` prefixed production cookie. */
export const SESSION_COOKIE_PATTERN = /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=/;
