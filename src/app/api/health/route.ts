import { NextResponse } from 'next/server';

import { sql } from '@/server/db/client';

/**
 * Readiness probe: the process is up and the database answers. It deliberately returns no
 * version, configuration or connection details.
 */
export async function GET() {
  try {
    await sql`select 1`;
    return NextResponse.json(
      { status: 'ok', database: 'up' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[health] database check failed', error);
    return NextResponse.json(
      { status: 'unavailable', database: 'down' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
