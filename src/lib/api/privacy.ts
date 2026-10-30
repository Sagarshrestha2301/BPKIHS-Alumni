/**
 * Who may see what. Every path that returns an alumnus goes through here.
 * Hidden details are removed from the object, never set to undefined or blanked,
 * so they cannot leak through serialisation.
 */
import type { Alumnus, Visibility } from './types';

/**
 * Whether this viewer is a signed-in alumnus. Anonymous visitors and donors are outsiders;
 * alumni and administrators may see `alumni_only` details. Administrators are included
 * because the dashboard already shows them every record.
 */
export interface Viewer {
  isAlumnus: boolean;
}

export const DEFAULT_VIEWER: Viewer = { isAlumnus: false };

/** Maps a Better Auth role to directory visibility. Unknown or absent roles stay outsiders. */
export function viewerForRole(role: string | null | undefined): Viewer {
  return { isAlumnus: role === 'alumni' || role === 'admin' };
}

export function canSee(visibility: Visibility, viewer: Viewer): boolean {
  if (visibility === 'public') return true;
  if (visibility === 'alumni_only') return viewer.isAlumnus;
  return false;
}

/** Only approved alumni whose profile is visible to this viewer may be listed or opened. */
export function isListable(person: Alumnus, viewer: Viewer = DEFAULT_VIEWER): boolean {
  return person.status === 'approved' && canSee(person.privacy.profile, viewer);
}

/** A copy with email and phone removed unless their own visibility allows them. */
export function toPublicView(person: Alumnus, viewer: Viewer = DEFAULT_VIEWER): Alumnus {
  const { email, phone, ...rest } = structuredClone(person);
  return {
    ...rest,
    ...(email !== undefined && canSee(person.privacy.email, viewer) ? { email } : {}),
    ...(phone !== undefined && canSee(person.privacy.phone, viewer) ? { phone } : {}),
  };
}
