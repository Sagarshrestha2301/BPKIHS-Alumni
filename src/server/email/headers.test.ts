import { describe, expect, it } from 'vitest';

import { sanitizeHeaderValue } from './index';

describe('sanitizeHeaderValue', () => {
  it('flattens a newline so a value cannot add headers of its own', () => {
    expect(sanitizeHeaderValue('Gift in memory of Asha\r\nBcc: attacker@evil.example')).toBe(
      'Gift in memory of Asha Bcc: attacker@evil.example',
    );
  });

  it('removes control characters and collapses the whitespace they leave behind', () => {
    expect(sanitizeHeaderValue('A\u0000\u0001  B\tC')).toBe('A B C');
  });

  it('keeps an ordinary subject unchanged', () => {
    expect(sanitizeHeaderValue('BPKIHS alumni digest: October 2026')).toBe(
      'BPKIHS alumni digest: October 2026',
    );
  });

  it('caps a header at the requested length', () => {
    expect(sanitizeHeaderValue('x'.repeat(2000), 320)).toHaveLength(320);
  });

  it('returns an empty string for whitespace-only input', () => {
    expect(sanitizeHeaderValue('   \r\n  ')).toBe('');
  });
});
