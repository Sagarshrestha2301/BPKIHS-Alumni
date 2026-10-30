import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/constants/site';

/**
 * Crawlers may read the public site and nothing else.
 *
 * `/admin` is the moderation dashboard, `/account` is signed-in, `/api` is JSON, and the
 * checkout and thank-you pages are the middle and end of one funnel : none of them belong in
 * a search index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/account',
          '/sign-in',
          '/donate/checkout',
          '/donate/thank-you',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
