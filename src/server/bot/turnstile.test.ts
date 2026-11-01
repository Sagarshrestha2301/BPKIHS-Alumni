import { afterEach, describe, expect, it, vi } from 'vitest';

import { BOT_TOKEN_HEADER } from '@/lib/constants/bot';

import { assertHuman, botProtectionConfigured } from './turnstile';

function request(token?: string): Request {
  const headers = new Headers();
  if (token) headers.set(BOT_TOKEN_HEADER, token);
  return new Request('http://localhost/api/v1/contact', { method: 'POST', headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('bot protection', () => {
  it('is off when no secret is configured', () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    expect(botProtectionConfigured()).toBe(false);
  });

  it('lets development and the browser suite through without a secret', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    await expect(assertHuman(request())).resolves.toBeUndefined();
  });

  it('skips the check in production when no secret is configured', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    vi.stubEnv('NODE_ENV', 'production');
    await expect(assertHuman(request())).resolves.toBeUndefined();
  });

  it('requires a token once a secret is configured', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    await expect(assertHuman(request())).rejects.toThrow('Complete the human check');
  });

  it('asks Cloudflare about the token and accepts a verified one', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(assertHuman(request('token-value'))).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/turnstile/v0/siteverify');
    const body = String(init.body);
    expect(body).toContain('secret=secret');
    expect(body).toContain('response=token-value');
  });

  it('rejects a token Cloudflare does not verify', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 200 })),
    );
    await expect(assertHuman(request('bad'))).rejects.toThrow('did not pass');
  });

  it('fails closed when Cloudflare cannot be reached', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(assertHuman(request('token'))).rejects.toThrow('unavailable');
    error.mockRestore();
  });
});
