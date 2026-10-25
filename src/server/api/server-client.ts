import 'server-only';

import type { ApiClient } from '@/lib/api/contract';

import { serverAdapter } from './server-adapter';

/**
 * Server Components use this instead of the browser client. It keeps database code out of
 * the client bundle and skips the HTTP hop.
 */
export function getServerApiClient(): ApiClient {
  return serverAdapter;
}
