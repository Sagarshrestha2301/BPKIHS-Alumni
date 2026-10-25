/**
 * The single place the rest of the app gets its data from in the browser:
 *   const api = getApiClient();  const goals = await api.listGoals();
 *
 * There is one adapter: the real API under `/api/v1`. Server Components do not use this
 * file; they call the services directly through `getServerApiClient()`.
 */
import type { ApiClient } from './contract';
import { httpAdapter } from './http';

export type { ApiClient } from './contract';

let cached: ApiClient | undefined;

export function getApiClient(): ApiClient {
  cached ??= httpAdapter;
  return cached;
}

/** For tests that need a clean reference. */
export function resetApiClient(): void {
  cached = undefined;
}
