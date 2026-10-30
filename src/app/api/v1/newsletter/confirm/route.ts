import { NextResponse } from 'next/server';

import { ApiError } from '@/lib/api/errors';
import { appUrl } from '@/server/http/app-url';
import { limit } from '@/server/http/rate-limit';
import { assertSameOrigin, handle } from '@/server/http/respond';
import { confirmNewsletterSubscription } from '@/server/services/community';

/**
 * POST /api/v1/newsletter/confirm
 *
 * The confirmation page submits a hidden token here; the link in the email opens that page.
 * Confirming on GET would be dangerous, because email clients and security scanners fetch
 * links automatically: a scanner would silently subscribe an address its owner never opened.
 * A POST happens only after a person presses the button.
 *
 * The token is the authorisation, so no session or bot token is involved; the rate limiter
 * still bounds guessing. The answer is a redirect, not JSON, because this is a plain HTML
 * form: a member may have JavaScript off and confirmation must still work.
 */
function landing(confirmed: boolean): NextResponse {
  const url = new URL('/community/newsletter', appUrl());
  url.searchParams.set('confirmed', confirmed ? 'done' : 'invalid');
  return NextResponse.redirect(url, {
    status: 303,
    // A redirect around a personal subscription change must never sit in a shared cache.
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    limit(request, 'newsletter');

    // The only field is a 36-character token, so anything larger is not a real submission.
    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > 4_096) {
      throw new ApiError('validation', 'That request is too large.', { status: 413 });
    }

    const form = await request.formData().catch(() => null);
    const token = form?.get('token');
    if (typeof token !== 'string') return landing(false);

    const trimmed = token.trim();
    if (!trimmed || trimmed.length > 200) return landing(false);

    return landing(await confirmNewsletterSubscription(trimmed));
  });
}
