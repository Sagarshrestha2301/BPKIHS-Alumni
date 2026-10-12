import './globals.css';

import type { Metadata } from 'next';
import { Inter, Noto_Sans_Devanagari, Source_Serif_4 } from 'next/font/google';

import { BottomBar } from '@/components/layout/bottom-bar';
import { SiteHeader } from '@/components/layout/site-header';

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
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
        <SiteHeader />
        <div id="main-content" className="flex-1 pb-14 lg:pb-0">
          {children}
        </div>
        <BottomBar />
      </body>
    </html>
  );
}
