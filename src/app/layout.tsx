import './globals.css';

import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Devanagari, Source_Serif_4 } from 'next/font/google';
import { Suspense } from 'react';

import { BottomBar } from '@/components/layout/bottom-bar';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { JsonLd } from '@/components/shared/json-ld';
import { hero } from '@/content/home';
import { site } from '@/content/site';
import { SessionProvider } from '@/features/auth/session-provider';
import { DEVELOPMENT_ORIGIN, NAVY } from '@/lib/constants/site';
import { organizationJsonLd } from '@/lib/seo/json-ld';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
  display: 'swap',
});

/**
 * Devanagari is only used by `:lang(ne)` text, and no page contains any yet, so it is not
 * preloaded: preloading made every visitor download a font they never render. It still loads
 * the moment a Nepali word appears.
 */
const notoDevanagari = Noto_Sans_Devanagari({
  variable: '--font-noto-devanagari',
  subsets: ['devanagari'],
  weight: ['400', '600'],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? DEVELOPMENT_ORIGIN),
  title: {
    default: 'BPKIHS Alumni Association',
    template: '%s | BPKIHS Alumni Association',
  },
  description: site.tagline,
  applicationName: site.name,
  manifest: '/manifest.webmanifest',
  /** `favicon.ico` is picked up from `src/app/` automatically, so only the apple icon is listed. */
  icons: { apple: '/apple-touch-icon.png' },
  /**
   * Defaults for every page: a shared link gets the site name, the campus photograph and a
   * large image card without each page having to repeat them. A page that sets its own
   * `openGraph` (the home page, a post) overrides these fields wholesale.
   */
  openGraph: {
    siteName: site.name,
    locale: 'en_NP',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: `${site.name}: ${hero.title}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.jpg'],
  },
  /**
   * Search-console ownership tokens. They are empty in development, in which case the field is
   * omitted rather than emitted blank; set them in `.env.local` once Search Console and Bing
   * Webmaster Tools have issued one (see `docs/DEPLOYMENT.md`).
   */
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim()
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION.trim() }
      : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim()
      ? { other: { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION.trim() } }
      : {}),
  },
};

/** Same navy as `theme_color` in the manifest, so the browser chrome matches the site. */
export const viewport: Viewport = {
  themeColor: NAVY,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    /*
     * `suppressHydrationWarning` covers browser extensions that add attributes to these two
     * elements before React hydrates : Grammarly's `data-gr-ext-installed` on <body>, and
     * emulator-style extensions that stamp `<html>`. React cannot patch attributes it does not
     * own, so the mismatch is reported once and never repaired. It is scoped to this element
     * and its attributes only: real mismatches inside the tree still surface.
     */
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sourceSerif.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <SessionProvider>
          <JsonLd value={organizationJsonLd({ name: site.name, logoUrl: site.logo.src })} />
          <a
            href="#main-content"
            className="focus:text-primary-900 focus:outline-primary-700 sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:shadow-md focus:outline-2"
          >
            Skip to main content
          </a>
          <Suspense
            fallback={
              <div
                className="h-16 border-b border-neutral-300 bg-white lg:h-24"
                aria-hidden="true"
              />
            }
          >
            <SiteHeader />
          </Suspense>
          <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          {/* The footer hides itself on /admin, so it reads the path like the header does. */}
          <Suspense fallback={null}>
            <SiteFooter />
          </Suspense>
          <Suspense fallback={null}>
            <BottomBar />
          </Suspense>
        </SessionProvider>
      </body>
    </html>
  );
}
