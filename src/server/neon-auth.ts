import 'server-only';

export function neonAuthConfig() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  if (!baseUrl || !jwksUrl) return null;
  return { baseUrl, jwksUrl };
}
