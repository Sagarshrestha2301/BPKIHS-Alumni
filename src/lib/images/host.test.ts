import { describe, expect, it } from 'vitest';

import { isPublicImageHost } from './host';

describe('isPublicImageHost', () => {
  it('accepts a normal public hostname', () => {
    expect(isPublicImageHost('bpkihs.edu')).toBe(true);
    expect(isPublicImageHost('images.example.org')).toBe(true);
  });

  it('refuses loopback, private suffixes and IP literals', () => {
    expect(isPublicImageHost('localhost')).toBe(false);
    expect(isPublicImageHost('cdn.localhost')).toBe(false);
    expect(isPublicImageHost('metadata.google.internal')).toBe(false);
    expect(isPublicImageHost('printer.local')).toBe(false);
    expect(isPublicImageHost('169.254.169.254')).toBe(false);
    expect(isPublicImageHost('10.0.0.5')).toBe(false);
  });

  it('refuses wildcards, schemes, ports and IPv6 literals', () => {
    expect(isPublicImageHost('*.example.com')).toBe(false);
    expect(isPublicImageHost('https://example.com')).toBe(false);
    expect(isPublicImageHost('example.com:8080')).toBe(false);
    expect(isPublicImageHost('[::1]')).toBe(false);
  });
});
