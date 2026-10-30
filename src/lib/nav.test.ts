import { describe, expect, it } from 'vitest';

import { isActivePath, safeReturnPath } from './nav';

describe('isActivePath', () => {
  it('matches exact and nested paths but not look-alike prefixes', () => {
    expect(isActivePath('/events', '/events')).toBe(true);
    expect(isActivePath('/events/annual-meet', '/events')).toBe(true);
    expect(isActivePath('/eventsx', '/events')).toBe(false);
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/about', '/')).toBe(false);
  });
});

describe('safeReturnPath', () => {
  it('keeps a path on this site, with its query', () => {
    expect(safeReturnPath('/directory')).toBe('/directory');
    expect(safeReturnPath('/directory?q=MBBS&page=2')).toBe('/directory?q=MBBS&page=2');
    expect(safeReturnPath('/directory/alumnus-003')).toBe('/directory/alumnus-003');
    expect(safeReturnPath(['/community'])).toBe('/community');
  });

  it('refuses another origin and anything that is not a path', () => {
    expect(safeReturnPath('//evil.example/directory')).toBeNull();
    expect(safeReturnPath('/\\evil.example')).toBeNull();
    expect(safeReturnPath('https://evil.example')).toBeNull();
    expect(safeReturnPath('directory')).toBeNull();
    expect(safeReturnPath('javascript:alert(1)')).toBeNull();
    expect(safeReturnPath('/directory\nSet-Cookie: x=1')).toBeNull();
    expect(safeReturnPath('')).toBeNull();
    expect(safeReturnPath(undefined)).toBeNull();
  });

  it('refuses the pages that would loop or need another account', () => {
    expect(safeReturnPath('/sign-in')).toBeNull();
    expect(safeReturnPath('/sign-in?next=/directory')).toBeNull();
    expect(safeReturnPath('/admin')).toBeNull();
    expect(safeReturnPath('/admin/alumni?status=pending')).toBeNull();
  });
});
