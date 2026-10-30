import 'server-only';

import type { ApiClient } from '@/lib/api/contract';
import type { Viewer } from '@/lib/api/privacy';

import { ANONYMOUS_VIEWER } from '../auth/session';
import { createServerAdapter, serverAdapter } from './server-adapter';

/**
 * Server Components use this instead of the browser client. It keeps database code out of
 * the client bundle and skips the HTTP hop.
 *
 * Pass the request's viewer when the result depends on it (the directory does). The default
 * stays anonymous so a caller that forgets cannot accidentally expose alumni-only fields.
 */
export function getServerApiClient(viewer: Viewer = ANONYMOUS_VIEWER): ApiClient {
  return viewer.isAlumnus ? createServerAdapter(viewer) : serverAdapter;
}
