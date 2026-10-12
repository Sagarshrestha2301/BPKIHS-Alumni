/**
 * The single place the rest of the app gets its data from:
 *   const api = getApiClient();  const goals = await api.listGoals();
 * NEXT_PUBLIC_API_MODE chooses the adapter: "mock" (default) or "http".
 */
import type { ApiClient } from './contract';
import { httpAdapter } from './http';
import { mockAdapter } from './mock';

export type { ApiClient } from './contract';

export type ApiMode = 'mock' | 'http';

/** Missing or empty means mock. A typo throws, so it cannot silently run on sample data. */
export function resolveApiMode(value: string | undefined): ApiMode {
  const mode = value?.trim().toLowerCase();
  if (!mode) return 'mock';
  if (mode === 'mock' || mode === 'http') return mode;
  throw new Error(`Invalid NEXT_PUBLIC_API_MODE "${value}". Use "mock" or "http".`);
}

export function createApiClient(mode: ApiMode): ApiClient {
  return mode === 'http' ? httpAdapter : mockAdapter;
}

let cached: ApiClient | undefined;

export function getApiClient(): ApiClient {
  cached ??= createApiClient(resolveApiMode(process.env.NEXT_PUBLIC_API_MODE));
  return cached;
}

/** For tests that change the environment. */
export function resetApiClient(): void {
  cached = undefined;
}
