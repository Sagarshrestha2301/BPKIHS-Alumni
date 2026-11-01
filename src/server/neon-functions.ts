import 'server-only';

export function neonFunctionUrl(name: string): string | null {
  const envName = `NEON_FUNCTION_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_BASE_URL`;
  return process.env[envName] ?? null;
}
