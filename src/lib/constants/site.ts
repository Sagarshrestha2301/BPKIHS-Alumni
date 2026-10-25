/**
 * Public site constants. These are inlined at build time, so they can be read by client
 * components. Operational server settings live in `src/server/config.ts`.
 */

/**
 * Origin used when no site URL is configured (local development and tests). Production
 * configuration is rejected at startup if `APP_URL` and `NEXT_PUBLIC_SITE_URL` are missing.
 */
export const DEVELOPMENT_ORIGIN = 'http://localhost:3000';

/**
 * Absolute public origin, with no trailing slash, for canonical URLs, the sitemap and
 * structured data. Built from `NEXT_PUBLIC_SITE_URL` so the browser bundle and the server
 * agree; production validation rejects a missing or mismatched value.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEVELOPMENT_ORIGIN).replace(
  /\/+$/,
  '',
);

/** IANA time zone used for every displayed and entered date. */
export const SITE_TIME_ZONE = process.env.NEXT_PUBLIC_SITE_TIME_ZONE?.trim() || 'Asia/Kathmandu';

/**
 * Fixed UTC offset for the site time zone, used to turn `datetime-local` values into
 * instants. Nepal has no daylight saving, so a fixed offset is correct and simpler than a
 * time-zone library.
 */
export const SITE_UTC_OFFSET = process.env.NEXT_PUBLIC_SITE_UTC_OFFSET?.trim() || '+05:45';
