import type { NextConfig } from 'next';

import { isPublicImageHost } from './src/lib/images/host';
import { config } from './src/server/config';

/**
 * Remote image hosts are configuration, not code. List them comma-separated in
 * `IMAGE_HOSTS`; only HTTPS hosts are accepted. The defaults are the Association's own site.
 */
function imageHosts(): string[] {
  const configured = (process.env.IMAGE_HOSTS ?? 'bpkihs.edu')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    // The optimiser fetches these from the server, so an internal name here would be an
    // SSRF gadget. `isPublicImageHost` refuses loopback, IP literals and private suffixes.
    .filter(isPublicImageHost);

  return configured.length > 0 ? configured : ['bpkihs.edu'];
}

/**
 * Origins the browser is allowed to submit a payment form to.
 *
 * Checkout builds a real form and submits it to the gateway, and `form-action` without these
 * would block every live payment. Only the configured gateway origins are added, and the
 * sandbox endpoints are included so a sandbox checkout works too.
 */
function paymentOrigins(): string[] {
  const configured = [
    process.env.ESEWA_GATEWAY_URL,
    process.env.KHALTI_BASE_URL,
    process.env.CONNECTIPS_BASE_URL,
    config.payments.esewaSandboxUrl,
    config.payments.khaltiSandboxBaseUrl,
  ];

  const origins = new Set<string>();
  for (const value of configured) {
    if (!value) continue;
    try {
      const origin = new URL(value).origin;
      if (origin.startsWith('https://')) origins.add(origin);
    } catch {
      // A malformed value is reported by `npm run check:env`, not here.
    }
  }
  return [...origins];
}

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  /** `sharp` carries a native binary; it must stay outside the server bundle. */
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: imageHosts().map((hostname) => ({
      protocol: 'https' as const,
      hostname,
      pathname: '/**',
    })),
  },
  async headers() {
    const development = process.env.NODE_ENV !== 'production';
    // Nonces require dynamic rendering; this site is prerendered with Partial Prerendering.
    // Inline scripts are therefore allowed, while every other source is restricted.
    // Cloudflare Turnstile needs its script, its iframe and its verification call. Only that
    // exact origin is added; every other frame and object stays blocked.
    const botOrigins = 'https://challenges.cloudflare.com';
    const contentSecurityPolicy = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${botOrigins}${development ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${botOrigins}${development ? ' ws: http://localhost:*' : ''}`,
      "media-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      `form-action 'self' ${paymentOrigins().join(' ')}`,
      "frame-ancestors 'none'",
      `frame-src ${botOrigins}`,
      "manifest-src 'self'",
      ...(development ? [] : ['upgrade-insecure-requests']),
    ].join('; ');

    const headers = [
      { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
      },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
    ];

    if (isProduction) {
      // Same value the edge proxy uses, so a response never carries two different policies.
      headers.push({
        key: 'Strict-Transport-Security',
        value: `max-age=${config.http.hstsMaxAgeSeconds}; includeSubDomains`,
      });
    }

    return [{ source: '/:path*', headers }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
