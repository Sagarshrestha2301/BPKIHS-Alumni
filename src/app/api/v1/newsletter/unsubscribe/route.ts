import { NextResponse } from 'next/server';

import { appUrl } from '@/server/http/app-url';
import { handle } from '@/server/http/respond';
import { unsubscribeByToken } from '@/server/services/community';

/**
 * GET /api/v1/newsletter/unsubscribe?token=…
 *
 * The one-click link from a newsletter email. The token is the authorisation: it is a random
 * value stored beside the subscriber, so a link works without a session and cannot be guessed.
 * The answer is the same for a valid, used or invented token, which keeps the endpoint from
 * confirming who is on the list.
 */
function landing(confirmed: boolean): NextResponse {
  const url = new URL('/community/newsletter', appUrl());
  url.searchParams.set('unsubscribed', confirmed ? 'done' : 'unknown');
  return NextResponse.redirect(url, {
    status: 303,
    // A redirect around a personal preference change must never sit in a shared cache.
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request) {
  return handle(async () => {
    const token = new URL(request.url).searchParams.get('token')?.trim();
    if (!token) return landing(false);
    return landing(await unsubscribeByToken(token));
  });
}
