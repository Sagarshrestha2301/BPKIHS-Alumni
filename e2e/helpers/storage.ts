/**
 * The identities and ids the browser suite signs in with.
 *
 * They exist only in a development database. The `setup` project creates them before any
 * browser test runs (see `e2e/helpers/fixtures.ts`) and stores a session for each so no spec
 * has to sign in again.
 */
export const ADMIN = {
  email: 'admin@bpkihs.local',
  password: 'E2eTestAdmin!99',
  name: 'E2E Admin',
} as const;

/** The donor the checkout flow pays as. Created with `role = 'donor'`. */
export const DONOR = {
  email: 'donor@example.com',
  password: 'Donor12345!',
  name: 'Sample Donor',
} as const;

/** The goal `donate-checkout.spec.ts` links to. Fixed so the spec can hard-code the URL. */
export const SCHOLARSHIP_GOAL_ID = 'goal-scholarship';

/** Sessions written by the setup project, one per identity. */
export const ADMIN_STATE = 'e2e/.auth/admin.json';
export const DONOR_STATE = 'e2e/.auth/donor.json';

/** An empty jar, for the specs that must behave like a signed-out visitor. */
export const SIGNED_OUT = { cookies: [], origins: [] };
