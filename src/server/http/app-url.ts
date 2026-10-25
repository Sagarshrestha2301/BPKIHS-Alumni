/**
 * The public origin of the site, used for gateway return URLs and redirects.
 *
 * `NEXT_PUBLIC_*` variables are inlined at build time, which would make a server-side
 * redirect point at whatever host was configured during `next build`. `APP_URL` is read at
 * runtime, so a deploy can move hosts without a rebuild. The other variables are fallbacks
 * for local development, where all of them are the same.
 *
 * A missing value in production is rejected at startup by `assertRuntimeEnv()`.
 */
import { config } from '../config';

export function appUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    config.developmentOrigin
  ).replace(/\/+$/, '');
}

/** True when the configured origin is HTTPS, used for cookie and HSTS decisions. */
export function usesHttps(): boolean {
  return appUrl().startsWith('https://');
}
