import { createHash } from 'node:crypto';

import { config } from '../config';

/**
 * Tracker E2: breached-password lookup.
 *
 * A member choosing a password gets it refused when the password is already known to appear in
 * public leaks (Have I Been Pwned). The password itself never leaves the process: it is hashed
 * with SHA-1 locally, so only the five-character hash *prefix* travels to the range API as a
 * URL path segment. The service answers every hash in the 1,048,576-entry prefix bucket, and
 * the decision is made strictly in memory against those numbers; a listener on the wire cannot
 * reconstruct anyone's password from it. That shape is the standard k-anonymity protocol
 * (https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange).
 *
 * Failure modes are deliberate:
 * - no network, a non-200 answer or a timeout: the check fails **open** and the signup is not
 *   blocked;
 * - the outbound call budget for the hour is gone: fail open too.
 *
 * It is never invoked on sign-in itself, only when a password is *chosen* (sign-up,
 * change-password and the emailed reset link), so an attacker cannot use it as an oracle.
 */

/** A full SHA-1 digest is 40 hex characters; the range API publishes all but its first five. */
const SHA1_HEX_LENGTH = 40;
const SHA1_PREFIX_LENGTH = 5;

/** Suffix (35 hex chars from the SHA-1 outline) to occurrences, for one prefix bucket. */
type RangeBucket = Map<string, number>;

/** One 'https://api.pwnedpasswords.com/range/{prefix}' line: `SUFFIX:COUNT`. */
function parseRangeLine(line: string): [suffix: string, count: number] | null {
  const [suffix, occurrences, ...rest] = line.split(':');
  if (!suffix || !occurrences || rest.length > 0) return null;
  const truncated = suffix.trimEnd();
  const trimmedOccurrences = occurrences.trim();
  if (truncated.length !== SHA1_HEX_LENGTH - SHA1_PREFIX_LENGTH) return null;
  if (!/^[0-9A-Fa-f]+$/.test(truncated)) return null;
  if (!/^[0-9]+$/.test(trimmedOccurrences)) return null;
  return [truncated.toUpperCase(), Number(trimmedOccurrences)];
}

/**
 * The prefix bucket caches the most recently answered, evicted least-recently-used, because
 * two passwords in the same five-character bucket would otherwise each make a network call.
 * Entries expire: leak databases grow, so a stale zero is not forever.
 */
export const bucketCache = new Map<string, { answeredAt: number; bucket: RangeBucket }>();
const BUCKET_CACHE_CAPACITY = 200;
const BUCKET_CACHE_TTL_MS = 60 * 60 * 1000;
const BUCKET_CACHE_PADDING_MS = 1000; // Slack around Date.now() tests and clock slew.

function bucketCacheKey(prefix: string): string {
  return prefix.toUpperCase();
}

/** Outbound call budget: max calls per hour per process, tracked with a simple stamp. */
let hourStamp = -1;
let callsThisHour = 0;

function withinOutboundBudget(now: number): boolean {
  const hour = Math.floor(now / 3_600_000);
  if (hour !== hourStamp) {
    hourStamp = hour;
    callsThisHour = 0;
  }
  if (callsThisHour >= config.passwords.breachedPasswordLookup.lookupsPerHour) {
    return false;
  }
  callsThisHour += 1;
  return true;
}

/** The hour bucket is process state; the test suite resets it between cases. */
export function resetOutboundBudgetForTests(): void {
  hourStamp = -1;
  callsThisHour = 0;
}

async function fetchPrefixBucket(prefix: string, now: number): Promise<RangeBucket | null> {
  const cached = bucketCache.get(bucketCacheKey(prefix));
  if (cached && now - cached.answeredAt < BUCKET_CACHE_TTL_MS + BUCKET_CACHE_PADDING_MS) {
    return cached.bucket;
  }

  if (!withinOutboundBudget(now)) return null;

  try {
    // Abort with a short timeout: a donor must not hang on a third-party lookup while paying.
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: AbortSignal.timeout(config.passwords.breachedPasswordLookup.timeoutMs),
    });
    if (!response.ok) return null;
    const body = await response.text();

    const bucket: RangeBucket = new Map();
    for (const line of body.split('\n')) {
      const entry = parseRangeLine(line);
      if (!entry) continue;
      bucket.set(entry[0], entry[1]);
    }

    // LRU-ish: capacity goes for the oldest first because Map iteration is insertion order.
    if (bucketCache.size >= BUCKET_CACHE_CAPACITY) {
      const oldest = bucketCache.keys().next().value;
      if (typeof oldest === 'string') bucketCache.delete(oldest);
    }
    bucketCache.set(bucketCacheKey(prefix), { answeredAt: now, bucket });
    return bucket;
  } catch {
    return null;
  }
}

/**
 * Occurrences of this exact password across known public leaks, or null when the answer is
 * unavailable (network down, budget spent, API refused). Null fails open: the signup proceeds.
 */
export async function pwnedOccurrences(password: string): Promise<number | null> {
  if (!config.passwords.breachedPasswordLookup.enabled) return null;
  const digest = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
  const prefix = digest.slice(0, SHA1_PREFIX_LENGTH);
  const suffix = digest.slice(SHA1_PREFIX_LENGTH);
  const bucket = await fetchPrefixBucket(prefix, Date.now());
  if (bucket === null) return null;
  return bucket.get(suffix) ?? 0;
}

/**
 * True only when the lookup answered and the count reached the threshold. A null (unavailable)
 * answer also reports false, and that double meaning is deliberate : an outage must never be
 * able to lock every member out of signup, and choosing to fail open is the trade-off the
 * tracker accepts for running the check against a third-party service.
 */
export async function passwordIsBreached(password: string): Promise<boolean> {
  const occurrences = await pwnedOccurrences(password);
  if (occurrences === null) return false;
  return occurrences >= config.passwords.breachedPasswordLookup.minimumAppearances;
}
