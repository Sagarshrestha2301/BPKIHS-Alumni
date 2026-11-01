import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '@/server/auth';
import { guardPasswordPost } from '@/server/auth/password-set-guard';

/**
 * Wrapper around Better Auth's route handler.
 *
 * The whole point of keeping `toNextJsHandler` inside this file is that the GET side stays
 * untouched, and POST is wrapped by `guardPasswordPost` : three POST bodies (signup,
 * change-password, reset-password) carry a password being chosen and get the breach check
 * before they ever reach the provider (tracker E2).
 */
const handler = toNextJsHandler(auth);

export async function GET(request: Request): Promise<Response> {
  return handler.GET(request);
}

export async function POST(request: Request): Promise<Response> {
  const refusal = await guardPasswordPost(request);
  if (refusal) return refusal;
  return handler.POST(request);
}
