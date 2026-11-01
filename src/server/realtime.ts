import 'server-only';

/**
 * Neon Realtime configuration derived from the env vars provisioned by `neon deploy`.
 * Realtime is consumed on the client via `@neon/realtime`; this module centralises the
 * server-side secret and URL so a sealed query can be minted consistently.
 */
export function realtimeConfig() {
  const url = process.env.NEON_REALTIME_URL;
  const secret = process.env.NEON_REALTIME_SECRET;
  if (!url || !secret) return null;
  return { url, secret };
}

export function isRealtimeConfigured(): boolean {
  return Boolean(process.env.NEON_REALTIME_URL && process.env.NEON_REALTIME_SECRET);
}
