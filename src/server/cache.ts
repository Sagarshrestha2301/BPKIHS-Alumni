import 'server-only';

import { revalidateTag } from 'next/cache';

import { DIRECTORY_CACHE_TAG } from '@/lib/constants/cache';

/**
 * A new, changed or removed profile must not wait for the `'use cache'` lifetime. `expire: 0`
 * makes the next read rebuild instead of serving the previous directory page. Route handlers
 * (not Server Actions) call this, so `updateTag` is not available.
 */
export function revalidateDirectory(): void {
  revalidateTag(DIRECTORY_CACHE_TAG, { expire: 0 });
}
