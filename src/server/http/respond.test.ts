import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ApiError } from '@/lib/api/errors';
import { REQUEST_ID_HEADER } from '@/lib/constants/security';

import { config } from '../config';
import { assertSameOrigin, fail, pageParam, pageSizeParam, parseBody } from './respond';

function jsonRequest(body: string, contentType = 'application/json'): Request {
  return new Request('https://alumni.example.org/api/v1/test', {
    method: 'POST',
    headers: { 'content-type': contentType },
    body,
  });
}

const schema = z.object({ name: z.string().trim().min(1) });

describe('parseBody', () => {
  it('parses a valid JSON body', async () => {
    await expect(parseBody(jsonRequest('{"name":"Sita"}'), schema)).resolves.toEqual({
      name: 'Sita',
    });
  });

  it('rejects a non-JSON content type', async () => {
    await expect(
      parseBody(jsonRequest('{"name":"Sita"}', 'text/plain'), schema),
    ).rejects.toMatchObject({ status: 415 });
  });

  it('rejects malformed JSON', async () => {
    await expect(parseBody(jsonRequest('{"name":'), schema)).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('rejects a body larger than the configured limit', async () => {
    const oversized = JSON.stringify({ name: 'x'.repeat(config.http.maxBodyBytes) });
    await expect(parseBody(jsonRequest(oversized), schema)).rejects.toMatchObject({ status: 413 });
  });

  it('maps Zod field errors to the envelope', async () => {
    await expect(parseBody(jsonRequest('{"name":""}'), schema)).rejects.toMatchObject({
      code: 'validation',
    });
  });
});

describe('fail', () => {
  it('adds Retry-After for rate limits and a request id', async () => {
    const response = fail(
      new ApiError('rate_limited', 'Slow down.', { retryAfterSeconds: 12 }),
      'request-1',
    );
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('12');
    expect(response.headers.get(REQUEST_ID_HEADER)).toBe('request-1');
    const body = (await response.json()) as { error: { code: string }; requestId: string };
    expect(body.error.code).toBe('rate_limited');
    expect(body.requestId).toBe('request-1');
  });

  it('never exposes an unknown error message', async () => {
    const response = fail(new Error('database password is hunter2'), 'request-2');
    const text = await response.text();
    expect(response.status).toBe(500);
    expect(text).not.toContain('hunter2');
    expect(text).toContain('Something went wrong');
  });
});

describe('assertSameOrigin', () => {
  function request(origin?: string): Request {
    return new Request('https://alumni.example.org/api/v1/posts', {
      method: 'POST',
      headers: origin ? { origin } : {},
    });
  }

  it('allows our own origin', () => {
    expect(() => assertSameOrigin(request('http://localhost:3000'))).not.toThrow();
  });

  it('allows requests without an Origin header', () => {
    expect(() => assertSameOrigin(request())).not.toThrow();
  });

  it('rejects another origin', () => {
    expect(() => assertSameOrigin(request('https://evil.example'))).toThrow(/another site/i);
  });

  it('rejects a malformed origin instead of crashing', () => {
    expect(() => assertSameOrigin(request('not a url'))).toThrow(/another site/i);
  });
});

describe('pagination parameters', () => {
  it('clamps and rejects nonsense', () => {
    expect(pageParam('2')).toBe(2);
    expect(pageParam('0')).toBeUndefined();
    expect(pageParam('abc')).toBeUndefined();
    expect(pageSizeParam('5000')).toBe(config.pagination.maxPageSize);
    expect(pageSizeParam('-1')).toBeUndefined();
  });
});
