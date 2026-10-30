import { unstable_rethrow } from 'next/navigation';
import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';

import { ApiError, isApiError } from '@/lib/api/errors';
import { REQUEST_ID_HEADER } from '@/lib/constants/security';

import { AuthError } from '../auth/errors';
import { config } from '../config';
import { appUrl } from './app-url';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

export function ok<T>(data: T, status = 200) {
  return json(data, status);
}

function logFailure(error: unknown, requestId: string): void {
  if (error instanceof ZodError || error instanceof AuthError || isApiError(error)) return;
  console.error(`[api] unhandled error request=${requestId}`, error);
}

export function fail(error: unknown, requestId: string = crypto.randomUUID()) {
  if (error instanceof ZodError) {
    return json(
      {
        error: {
          code: 'validation',
          message: 'Check the highlighted fields.',
          fieldErrors: fieldErrorsFrom(error),
        },
        requestId,
      },
      422,
      { [REQUEST_ID_HEADER]: requestId },
    );
  }

  if (error instanceof AuthError) {
    const code = error.code === 'forbidden' ? 'forbidden' : 'unauthorized';
    return json(
      { error: { code, message: error.message }, requestId },
      error.code === 'forbidden' ? 403 : 401,
      { [REQUEST_ID_HEADER]: requestId },
    );
  }

  if (isApiError(error)) {
    const headers: Record<string, string> = { [REQUEST_ID_HEADER]: requestId };
    if (error.retryAfterSeconds) headers['Retry-After'] = String(error.retryAfterSeconds);
    return json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
        },
        requestId,
      },
      error.status || 500,
      headers,
    );
  }

  logFailure(error, requestId);
  return json(
    { error: { code: 'server', message: 'Something went wrong. Please try again.' }, requestId },
    500,
    { [REQUEST_ID_HEADER]: requestId },
  );
}

function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    fields[key] ??= issue.message;
  }
  return fields;
}

/**
 * Reads a JSON body with two hard limits: the declared content type and the actual byte
 * size. `request.json()` alone would happily buffer an arbitrarily large body.
 *
 * `maxBytes` exists for the one admin route that accepts a CSV file; every other caller
 * keeps the global limit. A larger limit on a public route would be a denial-of-service
 * surface, so it is always paired with the admin guard.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
  options: { maxBytes?: number } = {},
): Promise<T> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new ApiError('validation', 'Send the body as application/json.', { status: 415 });
  }

  const maxBytes = options.maxBytes ?? config.http.maxBodyBytes;
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new ApiError('validation', 'That request is too large.', { status: 413 });
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new ApiError('validation', 'That request is too large.', { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ApiError('validation', 'The body is not valid JSON.');
  }

  try {
    return schema.parse(parsed);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError('validation', 'Check the highlighted fields.', {
        fieldErrors: fieldErrorsFrom(error),
      });
    }
    throw error;
  }
}

/** Parses a page number from the query string and clamps it to a sane range. */
export function pageParam(value: string | null): number | undefined {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return undefined;
  return Math.min(number, 10_000);
}

/** Parses a page size and clamps it to the configured maximum. */
export function pageSizeParam(value: string | null): number | undefined {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return undefined;
  return Math.min(number, config.pagination.maxPageSize);
}

function allowedOrigins(): Set<string> {
  const origins = new Set<string>();
  for (const value of [appUrl(), process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_SITE_URL]) {
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // A malformed optional value is ignored here; productionEnvProblems reports it.
    }
  }
  return origins;
}

/**
 * Cookie-authenticated mutations must come from our own origin. Requests without an Origin
 * header (server-to-server, curl) pass; the CSRF token check covers browser sessions.
 */
export function assertSameOrigin(request: Request): void {
  const header = request.headers.get('origin');
  if (!header) return;

  let origin: string;
  try {
    origin = new URL(header).origin;
  } catch {
    throw new ApiError('forbidden', 'That request came from another site.');
  }

  if (!allowedOrigins().has(origin)) {
    throw new ApiError('forbidden', 'That request came from another site.');
  }
}

/**
 * Wraps a handler so every thrown error becomes the same JSON envelope with a request id.
 *
 * Next's own control-flow errors (dynamic rendering bailout, redirects) must pass through:
 * swallowing them would turn a prerender probe into a 500 response.
 */
export async function handle(action: () => Promise<Response>): Promise<Response> {
  const requestId = crypto.randomUUID();
  try {
    return await action();
  } catch (error) {
    unstable_rethrow(error);
    logFailure(error, requestId);
    return fail(error, requestId);
  }
}
