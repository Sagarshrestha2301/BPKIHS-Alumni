import { describe, expect, it } from 'vitest';

import { isActivePath } from './nav';

describe('isActivePath', () => {
  it('matches exact and nested paths but not look-alike prefixes', () => {
    expect(isActivePath('/events', '/events')).toBe(true);
    expect(isActivePath('/events/annual-meet', '/events')).toBe(true);
    expect(isActivePath('/eventsx', '/events')).toBe(false);
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/about', '/')).toBe(false);
  });
});
