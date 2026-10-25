import { describe, expect, it } from 'vitest';

import { assertCsrf, createCsrfToken } from './csrf';

const SESSION = '__Secure-better-auth.session_token=session-value';

function request(cookie: string, token?: string): Request {
  return new Request('https://alumni.example.org/api/v1/posts', {
    method: 'POST',
    headers: {
      cookie,
      ...(token ? { 'x-csrf-token': token } : {}),
    },
  });
}

describe('assertCsrf', () => {
  it('creates unpredictable, distinct tokens', () => {
    const first = createCsrfToken();
    const second = createCsrfToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThan(30);
  });

  it('lets requests without a session cookie through', () => {
    expect(() => assertCsrf(request('bpkihs_csrf=abc'))).not.toThrow();
  });

  it('accepts a matching cookie and header', () => {
    expect(() => assertCsrf(request(`bpkihs_csrf=abc.def; ${SESSION}`, 'abc.def'))).not.toThrow();
  });

  it('rejects a missing header for a signed-in request', () => {
    expect(() => assertCsrf(request(`bpkihs_csrf=abc.def; ${SESSION}`))).toThrow(/security token/i);
  });

  it('rejects a mismatched header', () => {
    expect(() => assertCsrf(request(`bpkihs_csrf=abc.def; ${SESSION}`, 'abc.xyz'))).toThrow(
      /security token/i,
    );
  });

  it('rejects the token when the cookie is missing', () => {
    expect(() => assertCsrf(request(SESSION, 'abc.def'))).toThrow(/security token/i);
  });

  it('does not treat an unrelated cookie as a session', () => {
    expect(() => assertCsrf(request('other=1; bpkihs_csrf=abc.def'))).not.toThrow();
  });
});
