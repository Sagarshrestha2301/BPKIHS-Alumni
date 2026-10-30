import type { MetadataRoute } from 'next';

import { site } from '@/content/site';
import { SITE_URL } from '@/lib/constants/site';

/**
 * The installable web-app manifest, so "Add to Home Screen" gets the seal, the name and the
 * brand colour instead of a bookmark with the favicon. `themeColor` in `layout.tsx` matches
 * `theme_color` here.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: 'BPKIHS Alumni',
    description: site.tagline,
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0b2a4a',
    lang: 'en',
    icons: [
      { src: `${SITE_URL}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${SITE_URL}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
      {
        src: `${SITE_URL}/icons/maskable-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
