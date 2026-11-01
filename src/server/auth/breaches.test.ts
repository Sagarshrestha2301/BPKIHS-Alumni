import { createHash } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  bucketCache,
  passwordIsBreached,
  pwnedOccurrences,
  resetOutboundBudgetForTests,
} from './breaches';
import { breachedPasswordResponse, guardPasswordPost } from './password-set-guard';

/**
 * Fixtures are derived from the real SHA-1 of the fixture password, so the parsed range bucket
 * always contains the suffix the lookup will ask for.
 */
function sha1Prefix(password: string): string {
  return createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase().slice(0, 5);
}

function sha1Suffix(password: string): string {
  return createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase().slice(5);
}

function rangeBody(entries: Array<[suffix: string, count: number]>): string {
  return entries.map(([suffix, count]) => `${suffix}:${count}`).join('\n');
}

type FetchMock = ReturnType<typeof vi.fn>;

function stubFetch(implementation: (input: string) => Promise<Response>): FetchMock {
  const mock = vi.fn(implementation) as unknown as FetchMock;
  vi.stubGlobal('fetch', mock);
  return mock;
}

/** A fetch that answers the range API as the real service would for `password`'s bucket. */
function stubRangeFor(password: string, count: number): FetchMock {
  return stubFetch(
    async () => new Response(rangeBody([[sha1Suffix(password), count]]), { status: 200 }),
  );
}

function post(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('breach lookup (tracker E2)', () => {
  beforeEach(() => {
    bucketCache.clear();
    resetOutboundBudgetForTests();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('counts zero when the password is not in the prefix bucket', async () => {
    stubRangeFor('uncommon word today', 0);
    expect(await pwnedOccurrences('uncommon word today')).toBe(0);
  });

  it('returns the exact occurrence count when it is', async () => {
    stubRangeFor('chosen-weak-password', 17);
    expect(await pwnedOccurrences('chosen-weak-password')).toBe(17);
  });

  it('fails open on a network error: the answer is null and never "breached"', async () => {
    stubFetch(async () => {
      throw new TypeError('network down');
    });
    expect(await pwnedOccurrences('anything here')).toBeNull();
    expect(await passwordIsBreached('anything here')).toBe(false);
  });

  it('fails open on an error status', async () => {
    stubFetch(async () => new Response('', { status: 503 }));
    expect(await pwnedOccurrences('anything here')).toBeNull();
  });

  it('sends only the five-character hash prefix in the URL', async () => {
    const fetchMock = stubRangeFor('oil rust forest', 0);
    await pwnedOccurrences('oil rust forest');
    const url = String(fetchMock.mock.calls[0]?.[0] ?? '');
    expect(url).toContain('/range/');
    const prefix = url.split('/range/')[1];
    expect(prefix ?? '').toMatch(/^[0-9A-F]{5}$/);
  });

  it('reuses one fetch for two passwords in the same bucket', async () => {
    const fetchMock = stubRangeFor('insert a worn carpet', 4);
    expect(await pwnedOccurrences('insert a worn carpet')).toBe(4);
    expect(await pwnedOccurrences('insert a worn carpet')).toBe(4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('is breached at the threshold and not one below it', async () => {
    // One mock that answers each prefix bucket correctly, because two stubGlobal calls would
    // leave only the second one in place.
    stubFetch(async (input) => {
      const prefix = String(input).split('/range/')[1];
      const password = prefix === sha1Prefix('weak one') ? 'weak one' : 'strong one';
      const count = password === 'weak one' ? 1 : 0;
      return new Response(rangeBody([[sha1Suffix(password), count]]), { status: 200 });
    });
    expect(await passwordIsBreached('weak one')).toBe(true);
    expect(await passwordIsBreached('strong one')).toBe(false);
  });

  it('fails open once the outbound budget for the hour is spent', async () => {
    // Uniqueness per call defeats the bucket cache, so every call is a real fetch attempt.
    let calls = 0;
    stubFetch(async (input) => {
      calls += 1;
      const suffix = (String(input).split('/range/')[1] ?? '') + 'B'.repeat(35);
      void calls;
      return new Response(rangeBody([[suffix, 0]]), { status: 200 });
    });
    let exhausted = false;
    for (let index = 0; index < 1000; index += 1) {
      if ((await pwnedOccurrences(`unique password number ${index}`)) === null) {
        exhausted = true;
        break;
      }
    }
    expect(exhausted).toBe(true);
    expect(calls).toBeLessThanOrEqual(65);
  });
});

describe('password-set guard', () => {
  beforeEach(() => {
    bucketCache.clear();
    resetOutboundBudgetForTests();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('refuses signup with a breached password', async () => {
    stubRangeFor('password', 999);
    const refusal = await guardPasswordPost(
      post('/api/auth/sign-up/email', { email: 'a@b.c', password: 'password' }),
    );
    expect(refusal?.status).toBe(400);
    const text = refusal ? await refusal.text() : '';
    expect(text).toContain('PASSWORD_BREACHED');
  });

  it('marks the change and reset endpoints in the same words', async () => {
    stubRangeFor('password', 999);
    for (const path of ['/api/auth/change-password', '/api/auth/reset-password']) {
      const refusal = await guardPasswordPost(post(path, { newPassword: 'password' }));
      expect(refusal?.status).toBe(400);
    }
  });

  it('reads the body without consuming it (the clone stays for the provider)', async () => {
    stubRangeFor('password', 0);
    const request = post('/api/auth/sign-up/email', { email: 'a@b.c', password: 'password' });
    const before = await request.clone().text();
    await guardPasswordPost(request);
    expect(await request.text()).toBe(before);
  });

  it('lets a clean password through', async () => {
    stubRangeFor('this is one long clean', 0);
    const refusal = await guardPasswordPost(
      post('/api/auth/sign-up/email', { email: 'a@b.c', password: 'this is one long clean' }),
    );
    expect(refusal).toBeUndefined();
  });

  it('skips the lookup for a password outside the length bounds', async () => {
    const fetchMock = stubFetch(async () => new Response('', { status: 200 }));
    const refusal = await guardPasswordPost(post('/api/auth/sign-up/email', { password: 'short' }));
    expect(refusal).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never inspects sign-in : no oracle for guessing an account password', async () => {
    const fetchMock = stubFetch(async () => {
      throw new Error('must not be called');
    });
    const refusal = await guardPasswordPost(
      post('/api/auth/sign-in/email', { email: 'a@b.c', password: 'password' }),
    );
    expect(refusal).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignores a malformed body so the provider answers with the normal error', async () => {
    const fetchMock = stubFetch(async () => {
      throw new Error('must not be called');
    });
    const request = new Request('http://localhost/api/auth/sign-up/email', {
      method: 'POST',
      body: 'not json',
    });
    expect(await guardPasswordPost(request)).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('carries the documented refusal shape', () => {
    const refusal = breachedPasswordResponse();
    expect(refusal.status).toBe(400);
  });
});
