import { connection } from 'next/server';
import { NextResponse } from 'next/server';

import { sql } from '@/server/db/client';

type ServiceStatus = { status: 'up' | 'down' | 'skipped'; detail?: string };

async function checkDatabase(): Promise<ServiceStatus> {
  try {
    await sql`select 1`;
    return { status: 'up' };
  } catch (error) {
    console.error('[health] database check failed', error);
    return { status: 'down', detail: String(error) };
  }
}

async function checkFunctions(): Promise<ServiceStatus> {
  const url = process.env.NEON_FUNCTION_HELLO_BASE_URL;
  if (!url) return { status: 'skipped', detail: 'NEON_FUNCTION_HELLO_BASE_URL not set' };
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!text.includes('Hello from Neon Functions')) throw new Error('unexpected body');
    return { status: 'up' };
  } catch (error) {
    console.error('[health] functions check failed', error);
    return { status: 'down', detail: String(error) };
  }
}

async function checkAuth(): Promise<ServiceStatus> {
  const url = process.env.NEON_AUTH_JWKS_URL;
  if (!url) return { status: 'skipped', detail: 'NEON_AUTH_JWKS_URL not set' };
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { keys?: unknown[] };
    if (!Array.isArray(json.keys) || json.keys.length === 0) throw new Error('no keys');
    return { status: 'up' };
  } catch (error) {
    console.error('[health] auth check failed', error);
    return { status: 'down', detail: String(error) };
  }
}

async function checkRealtime(): Promise<ServiceStatus> {
  const url = process.env.NEON_REALTIME_URL;
  const secret = process.env.NEON_REALTIME_SECRET;
  if (!url || !secret) return { status: 'skipped', detail: 'NEON_REALTIME env not set' };
  // Basic reachability: convert wss:// to https:// probe on the host root is unreliable;
  // validate configuration shape only here.
  if (!/^wss?:\/\//.test(url)) return { status: 'down', detail: 'invalid NEON_REALTIME_URL' };
  return { status: 'up', detail: 'configured' };
}

export async function GET() {
  await connection();
  const [database, functions, auth, realtime] = await Promise.all([
    checkDatabase(),
    checkFunctions(),
    checkAuth(),
    checkRealtime(),
  ]);

  const allUp = [database, functions, auth, realtime].every(
    (s) => s.status === 'up' || s.status === 'skipped',
  );

  return NextResponse.json(
    {
      status: allUp ? 'ok' : 'degraded',
      services: { database, functions, auth, realtime },
    },
    { status: allUp ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
