import type { ApiClient } from '../contract';
import { createNotImplementedClient } from '../not-implemented';

/**
 * Real backend adapter. A stub for now: it has the same shape as the mock adapter, which
 * proves the swap needs no component changes. Implemented once a backend exists (Phase 11
 * documents what it must do).
 */
export const httpAdapter: ApiClient = createNotImplementedClient('HTTP adapter');
