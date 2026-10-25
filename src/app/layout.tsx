import './globals.css';

import type { Metadata } from 'next';
import { Inter, Noto_Sans_Devanagari, Source_Serif_4 } from 'next/font/google';
import { Suspense } from 'react';

import { BottomBar } from '@/components/layout/bottom-bar';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { JsonLd } from '@/components/shared/json-ld';
import { site } from '@/content/site';
import { DEVELOPMENT_ORIGIN } from '@/lib/constants/site';
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

const notoDevanagari = Noto_Sans_Devanagari({
  variable: '--font-noto-devanagari',
  subsets: ['devanagari'],
  weight: ['400', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? DEVELOPMENT_ORIGIN),
  title: {
    default: 'BPKIHS Alumni Association',
    template: '%s | BPKIHS Alumni Association',
  },
  description:
    'The lifelong network of B.P. Koirala Institute of Health Sciences alumni. Find fellow alumni, give back and join events.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <JsonLd value={organizationJsonLd({ name: site.name, logoUrl: site.logo.src })} />
        <a
          href="#main-content"
          className="focus:text-primary-900 focus:outline-primary-700 sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:shadow-md focus:outline-2"
        >
          Skip to main content
        </a>
        <Suspense
          fallback={
            <div className="h-16 border-b border-neutral-300 bg-white lg:h-24" aria-hidden="true" />
          }
        >
          <SiteHeader />
        </Suspense>
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SiteFooter />
        <Suspense fallback={null}>
          <BottomBar />
        </Suspense>
      </body>
    </html>
  );
}
