import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/constants/site';

/**
 * The public pages, most important first.
 *
 * It is a static list on purpose: a sitemap built from the database would need a live
 * connection during `next build`, and the build must stay reproducible without one. Event and
 * profile URLs can be appended later from the deployed database if the Association wants them
 * indexed; the directory already exposes them through normal links.
 *
 * Signed-in pages (`/account`, `/admin`) and one-off funnel pages (`/donate/checkout`,
 * `/donate/thank-you`) are deliberately absent.
 */
const PAGES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/directory', changeFrequency: 'daily', priority: 0.9 },
  { path: '/donate', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/events', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/community', changeFrequency: 'daily', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about/board', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/about/how-we-work', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/register', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/support/faq', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/community/newsletter', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/donate/transparency', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/donate/tribute', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/legal/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/legal/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/legal/accessibility', changeFrequency: 'yearly', priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
