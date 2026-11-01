import { afterEach, describe, expect, it, vi } from 'vitest';

import { getApiClient, resetApiClient } from './client';
import { API_METHOD_NAMES } from './contract';
import { httpAdapter } from './http';

afterEach(() => {
  resetApiClient();
});

describe('getApiClient', () => {
  it('always returns the real HTTP adapter', () => {
    expect(getApiClient()).toBe(httpAdapter);
  });

  it('caches the adapter and can be reset', () => {
    const first = getApiClient();
    resetApiClient();
    expect(getApiClient()).toBe(first);
  });
});

describe('adapter shape', () => {
  it('lists 35 methods', () => {
    // 35 since 30 Oct 2026: the no-account contact submission left with the duplicate
    // enquiry form on /support; the helpdesk covers it.
    expect(API_METHOD_NAMES).toHaveLength(35);
    expect(new Set(API_METHOD_NAMES).size).toBe(35);
  });

  it('has exactly the contract methods', () => {
    expect(Object.keys(httpAdapter).sort()).toEqual([...API_METHOD_NAMES].sort());
  });

  it('reports a network error when the API cannot be reached', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await expect(httpAdapter.getSiteStats()).rejects.toMatchObject({ code: 'network' });
    fetch.mockRestore();
  });

  it('points a two-factor account at the administrator sign-in form', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ twoFactorRedirect: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(
      httpAdapter.login({ email: 'admin@example.com', password: 'a-long-password' }),
    ).rejects.toMatchObject({
      code: 'unauthorized',
      message: expect.stringContaining('administrator page'),
    });
    fetch.mockRestore();
  });

  it('turns a rejected one-time code into a message a member can act on', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'OTP_EXPIRED', message: 'OTP expired' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(
      httpAdapter.verifyRegistration({ email: 'asha@example.com', otp: '123456' }),
    ).rejects.toMatchObject({ code: 'validation', message: expect.stringContaining('expired') });
    fetch.mockRestore();
  });
});
