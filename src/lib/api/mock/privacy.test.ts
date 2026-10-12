import { describe, expect, it } from 'vitest';

import type { Alumnus } from '../types';
import { canSee, isListable, toPublicView } from './privacy';

const alumnus: Alumnus = {
  id: 'a1',
  fullName: 'Asha Rai',
  programme: 'MBBS',
  batchYear: 2012,
  country: 'Nepal',
  email: 'asha.rai@example.com',
  phone: '+977 9800000001',
  privacy: { email: 'alumni_only', phone: 'hidden', profile: 'public' },
  status: 'approved',
  source: 'self_registered',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const alumniViewer = { isAlumnus: true };
const outsider = { isAlumnus: false };

describe('canSee', () => {
  it('shows public to everyone, alumni_only to alumni, hidden to nobody', () => {
    expect(canSee('public', outsider)).toBe(true);
    expect(canSee('alumni_only', alumniViewer)).toBe(true);
    expect(canSee('alumni_only', outsider)).toBe(false);
    expect(canSee('hidden', alumniViewer)).toBe(false);
  });
});

describe('isListable', () => {
  it('lists only approved people with a visible profile', () => {
    expect(isListable(alumnus, alumniViewer)).toBe(true);
    expect(isListable({ ...alumnus, status: 'pending' }, alumniViewer)).toBe(false);
    expect(isListable({ ...alumnus, status: 'rejected' }, alumniViewer)).toBe(false);
    expect(
      isListable({ ...alumnus, privacy: { ...alumnus.privacy, profile: 'hidden' } }, alumniViewer),
    ).toBe(false);
  });

  it('hides alumni_only profiles from outsiders', () => {
    const restricted = {
      ...alumnus,
      privacy: { ...alumnus.privacy, profile: 'alumni_only' as const },
    };
    expect(isListable(restricted, alumniViewer)).toBe(true);
    expect(isListable(restricted, outsider)).toBe(false);
  });
});

describe('toPublicView', () => {
  it('removes hidden fields entirely, so they cannot leak through JSON', () => {
    const view = toPublicView(alumnus, alumniViewer);
    expect('phone' in view).toBe(false);
    expect(JSON.stringify(view)).not.toContain('9800000001');
    expect(view.email).toBe('asha.rai@example.com');
  });

  it('removes alumni_only fields for outsiders', () => {
    const view = toPublicView(alumnus, outsider);
    expect('email' in view).toBe(false);
    expect(JSON.stringify(view)).not.toContain('example.com');
  });

  it('returns a copy and leaves the original alone', () => {
    const view = toPublicView(alumnus, alumniViewer);
    view.fullName = 'Changed';
    expect(alumnus.fullName).toBe('Asha Rai');
  });
});
