import { type NextRequest, NextResponse } from 'next/server';

import { CSRF_COOKIE_NAME } from '@/lib/constants/security';

import { config as appConfig } from './server/config';
import { csrfCookieOptions } from './server/http/csrf';

/**
 * Runs before every document and API request.
 *
 * - Issues the double-submit CSRF token the browser must echo on mutations.
 * - Adds the security headers that depend on the request (HSTS when the proxy reports
 *   HTTPS). CSP and the remaining headers are set in `next.config.ts`, where they apply to
 *   static assets too.
 *
 * A nonce-based CSP is deliberately not used: this site is statically prerendered (and uses
 * Partial Prerendering), and Next.js can only attach a nonce while rendering dynamically.
 * A nonce policy would block the prerendered scripts. The CSP in `next.config.ts` therefore
 * allows inline scripts, which is the documented trade-off for a cached site; see
 * docs/SECURITY.md.
 */

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const forwardedProtocol = request.headers.get('x-forwarded-proto');
  const secure =
    request.nextUrl.protocol === 'https:' || forwardedProtocol?.split(',')[0]?.trim() === 'https';

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  );
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  if (secure && process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      `max-age=${appConfig.http.hstsMaxAgeSeconds}; includeSubDomains`,
    );
  }

  if (!request.cookies.get(CSRF_COOKIE_NAME)?.value) {
    response.cookies.set(CSRF_COOKIE_NAME, randomToken(), csrfCookieOptions(secure));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff|woff2|ttf)$).*)',
  ],
};
