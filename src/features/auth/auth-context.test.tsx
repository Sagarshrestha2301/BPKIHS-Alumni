import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/errors';
import type { Session } from '@/lib/api/types';
import { createFakeClient } from '@/test/fake-client';

import { AuthProvider, useAuth } from './auth-context';

interface Account {
  name: string;
  email: string;
  password: string;
  userId: string;
}

/** A tiny in-memory account store, standing in for Better Auth. */
function createAuthClient() {
  const accounts: Account[] = [
    {
      name: 'Asha Rai',
      email: 'asha@example.com',
      password: 'Passw0rd!',
      userId: 'user-asha',
    },
  ];
  let current: Session | null = null;

  const toSession = (account: Account): Session => ({
    userId: account.userId,
    name: account.name,
    email: account.email,
  });

  const client = createFakeClient({
    getSession: async () => current,
    login: async ({ email, password }) => {
      const account = accounts.find((item) => item.email === email);
      if (!account || account.password !== password) {
        throw new ApiError('unauthorized', 'The email or password is incorrect.');
      }
      current = toSession(account);
      return current;
    },
    signup: async ({ fullName, email, password }) => {
      if (accounts.some((item) => item.email === email)) {
        throw new ApiError('validation', 'Check the highlighted fields.', {
          fieldErrors: { email: 'An account with this email already exists.' },
        });
      }
      const account: Account = {
        name: fullName,
        email,
        password,
        userId: `user-${accounts.length + 1}`,
      };
      accounts.push(account);
      current = toSession(account);
      return current;
    },
    logout: async () => {
      current = null;
      return { ok: true };
    },
  });

  return { client, accounts };
}

function setup() {
  const { client } = createAuthClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider client={client}>{children}</AuthProvider>
  );
  return renderHook(() => useAuth(), { wrapper });
}

describe('useAuth', () => {
  it('restores an empty session and starts signed out', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe('signed_out'));
    expect(result.current.session).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('signs in a known account', async () => {
    const { result } = setup();
    let session: Awaited<ReturnType<typeof result.current.signIn>> = null;
    await act(async () => {
      session = await result.current.signIn({
        email: 'asha@example.com',
        password: 'Passw0rd!',
      });
    });
    expect(session).toMatchObject({ userId: 'user-asha' });
    expect(result.current.status).toBe('signed_in');
    expect(result.current.session?.email).toBe('asha@example.com');
  });

  it('keeps the ApiError when sign-in fails, and clears it on request', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signIn({ email: 'stranger@example.com', password: 'Passw0rd!' });
    });
    expect(result.current.status).toBe('signed_out');
    expect(result.current.session).toBeNull();
    expect(result.current.error).toMatchObject({ code: 'unauthorized' });

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('surfaces field errors from a bad sign-up', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signUp({
        fullName: 'Someone',
        email: 'asha@example.com',
        password: 'Passw0rd!',
      });
    });
    expect(result.current.error?.fieldErrors?.email).toMatch(/already exists/);
    expect(result.current.status).toBe('signed_out');
  });

  it('signs up a new account and signs it in', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signUp({
        fullName: 'New Donor',
        email: 'new@example.com',
        password: 'Passw0rd!',
      });
    });
    expect(result.current.status).toBe('signed_in');
    expect(result.current.session?.name).toBe('New Donor');
  });

  it('clears an earlier error when the next attempt succeeds', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signIn({ email: 'stranger@example.com', password: 'Passw0rd!' });
    });
    expect(result.current.error).not.toBeNull();
    await act(async () => {
      await result.current.signIn({ email: 'asha@example.com', password: 'Passw0rd!' });
    });
    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('signed_in');
  });

  it('signs out', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signIn({ email: 'asha@example.com', password: 'Passw0rd!' });
    });
    await act(async () => {
      await result.current.signOut();
    });
    expect(result.current.status).toBe('signed_out');
    expect(result.current.session).toBeNull();
  });

  it('ignores a second attempt while one is in flight', async () => {
    const { result } = setup();
    let results: unknown[] = [];
    await act(async () => {
      results = await Promise.all([
        result.current.signUp({
          fullName: 'Twice',
          email: 'twice@example.com',
          password: 'Passw0rd!',
        }),
        result.current.signUp({
          fullName: 'Twice',
          email: 'twice@example.com',
          password: 'Passw0rd!',
        }),
      ]);
    });
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('signed_in');
  });

  it('throws a clear error when used outside the provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used inside <AuthProvider>');
  });
});
