'use client';

import { ApiError, type ApiErrorCode } from '@/lib/api/errors';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/constants/security';

interface ErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    fieldErrors?: Record<string, string>;
  };
}

const CODES: readonly ApiErrorCode[] = [
  'validation',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'rate_limited',
  'unavailable',
  'network',
  'server',
  'not_implemented',
];

function toCode(value: string | undefined): ApiErrorCode {
  return CODES.includes(value as ApiErrorCode) ? (value as ApiErrorCode) : 'server';
}

/**
 * The admin screens are the only place where the browser calls an endpoint directly
 * instead of going through the typed ApiClient: the admin routes return shapes that the
 * public contract deliberately does not contain. The envelope and error handling are the
 * same, so a failed action reads the same as a failed public form.
 */
function csrfToken(): string | undefined {
  for (const part of document.cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === CSRF_COOKIE_NAME) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export async function adminRequest<T>(
  path: string,
  options: { method: 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown },
): Promise<T> {
  const token = csrfToken();
  const response = await fetch(path, {
    method: options.method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { [CSRF_HEADER_NAME]: token } : {}),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });

  const payload = (await response.json().catch(() => null)) as (T & ErrorEnvelope) | null;
  if (!response.ok) {
    throw new ApiError(
      toCode(payload?.error?.code),
      payload?.error?.message ?? 'That action did not go through.',
      payload?.error?.fieldErrors ? { fieldErrors: payload.error.fieldErrors } : {},
    );
  }
  return payload as T;
}
