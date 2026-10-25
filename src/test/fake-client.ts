import { API_METHOD_NAMES, type ApiClient } from '@/lib/api/contract';

/**
 * A deliberately dumb test double. Every method rejects until a test overrides it, so a
 * component that starts calling a new API method fails loudly instead of hitting the network.
 * This lives under `src/test` and is never imported by application code.
 */
export function createFakeClient(overrides: Partial<ApiClient> = {}): ApiClient {
  const base: Record<string, unknown> = {};
  for (const name of API_METHOD_NAMES) {
    base[name] = () => Promise.reject(new Error(`Fake ApiClient has no ${name} implementation.`));
  }
  return { ...(base as unknown as ApiClient), ...overrides };
}
