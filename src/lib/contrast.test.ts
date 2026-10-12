import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { contrastRatio } from './contrast';

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

const colours = loadColours();

function ratio(fg: string, bg: string): number {
  const a = colours[fg];
  const b = colours[bg];
  if (!a || !b) throw new Error(`Missing colour token: ${!a ? fg : bg}`);
  return contrastRatio(a, b);
}

const textPairs: [string, string, number][] = [
  ['white', 'primary-700', 4.5],
  ['white', 'primary-900', 4.5],
  ['white', 'accent-600', 4.5],
  ['white', 'accent-700', 4.5],
  ['white', 'success-600', 4.5],
  ['neutral-900', 'white', 4.5],
  ['neutral-600', 'white', 4.5],
  ['neutral-600', 'neutral-100', 4.5],
  ['primary-700', 'white', 4.5],
  ['primary-700', 'primary-100', 4.5],
  ['primary-900', 'white', 4.5],
  ['primary-900', 'primary-100', 4.5],
  ['primary-100', 'primary-900', 4.5],
  ['success-600', 'white', 4.5],
  ['warning-600', 'white', 4.5],
  ['danger-600', 'white', 4.5],
];

describe('contrast helper', () => {
  it('gives 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });
});

describe('colour contrast (WCAG AA text, 4.5:1)', () => {
  it.each(textPairs)('%s on %s meets %s:1', (fg, bg, min) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});

const uiPairs: [string, string, number][] = [
  ['neutral-500', 'white', 3], // form control borders
  ['primary-700', 'white', 3], // focus ring
  ['accent-500', 'white', 3], // large graphics only
  ['accent-600', 'accent-100', 3], // large text only, not body copy
];

describe('UI components and large text (3:1)', () => {
  it.each(uiPairs)('%s on %s meets %s:1', (fg, bg, min) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});
