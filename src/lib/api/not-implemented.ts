import { API_METHOD_NAMES, type ApiClient } from './contract';
import { ApiError } from './errors';

/** An ApiClient whose every method rejects with `not_implemented`. Used for stubs. */
export function createNotImplementedClient(label: string): ApiClient {
  const entries = API_METHOD_NAMES.map((name) => [
    name,
    async () => {
      throw new ApiError('not_implemented', `${label}: ${name} is not implemented yet.`);
    },
  ]);
  return Object.fromEntries(entries) as unknown as ApiClient;
}
