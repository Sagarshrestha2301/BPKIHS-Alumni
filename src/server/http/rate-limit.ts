import { ApiError } from '@/lib/api/errors';

import { config, type RateLimitBucket } from '../config';

interface Bucket {
  count: number;
  resetsAt: number;
}

/**
 * Per-process fixed-window limiter for public and admin forms.
 *
 * The site runs as one Node process on a VPS (see docs/HOWTO.md), so an in-process map is
 * sufficient. It is bounded on purpose: an attacker cannot grow memory without limit, and
 * expired buckets are swept before the map gets large. If the app ever runs on more than one
 * instance, replace this module with a shared store; every route already goes through `limit`.
 */
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 20_000;

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetsAt <= now) buckets.delete(key);
  }
  if (buckets.size <= MAX_BUCKETS) return;

  // Still too large: drop the buckets that reset soonest. They are the oldest windows.
  const oldest = [...buckets.entries()].sort((a, b) => a[1].resetsAt - b[1].resetsAt);
  for (const [key] of oldest.slice(0, buckets.size - MAX_BUCKETS)) buckets.delete(key);
}

/**
 * Client address for the limiter. Only trusted proxy headers are read, and the last
 * `X-Forwarded-For` entry is used because that is the value our own proxy appended.
 * A client that is directly exposed cannot choose its bucket by inventing a header when
 * `TRUST_PROXY` is false.
 */
function clientKey(request: Request): string {
  if (!config.http.trustProxy) return 'direct';

  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return real;

  const forwarded = request.headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return forwarded?.at(-1) ?? 'unknown';
}

export function limit(request: Request, bucket: RateLimitBucket): void {
  const rule = config.rateLimits[bucket];
  const now = Date.now();
  const key = `${bucket}:${clientKey(request)}`;
  const current = buckets.get(key);

  if (!current || current.resetsAt <= now) {
    if (buckets.size > MAX_BUCKETS) sweep(now);
    buckets.set(key, { count: 1, resetsAt: now + rule.windowMs });
    return;
  }

  current.count += 1;
  if (current.count > rule.max) {
    throw new ApiError('rate_limited', 'Too many attempts. Please wait a moment and try again.', {
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetsAt - now) / 1000)),
    });
  }
}

/** Test helper; never called by application code. */
export function resetRateLimits(): void {
  buckets.clear();
}
