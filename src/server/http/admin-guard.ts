import type { AuthSession } from '../auth/session';
import { requireAdmin } from '../auth/session';
import { assertCsrf } from './csrf';
import { limit } from './rate-limit';
import { assertSameOrigin } from './respond';

/**
 * Every admin mutation goes through the same sequence: origin, CSRF, rate limit, role.
 * Keeping it in one place means a new route cannot silently skip a control.
 */
export async function requireAdminMutation(request: Request): Promise<AuthSession> {
  assertSameOrigin(request);
  assertCsrf(request);
  limit(request, 'admin');
  return requireAdmin();
}

export async function requireAdminRead(request: Request): Promise<AuthSession> {
  limit(request, 'adminRead');
  return requireAdmin();
}
