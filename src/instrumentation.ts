/**
 * Next calls `register()` once per server process, before the first request. Refusing to
 * start on an incomplete production configuration is safer than serving a site that cannot
 * take donations or send receipts.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  const { assertRuntimeEnv } = await import('./server/env');
  assertRuntimeEnv();
}
