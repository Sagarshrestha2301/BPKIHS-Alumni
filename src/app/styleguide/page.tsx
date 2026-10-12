import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { StyleguideContent } from './styleguide-content';

export const metadata: Metadata = {
  title: 'Styleguide (dev only)',
  robots: { index: false, follow: false },
};

/** Reads the brand colours from tokens.css, so the page never drifts from the real tokens. */
function loadColours(): Record<string, string> {
  const css = readFileSync(join(process.cwd(), 'src', 'styles', 'tokens.css'), 'utf8');
  const colours: Record<string, string> = {};
  for (const match of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)) {
    const name = match[1];
    const hex = match[2];
    if (name && hex) colours[name] = hex;
  }
  colours['white'] ??= '#ffffff';
  return colours;
}

export default function StyleguidePage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <StyleguideContent colours={loadColours()} />;
}
