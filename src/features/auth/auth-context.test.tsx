import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { createMockAdapter } from '@/lib/api/mock';

import { AuthProvider, useAuth } from './auth-context';

function setup() {
  const client = createMockAdapter();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider client={client}>{children}</AuthProvider>
  );
  return renderHook(() => useAuth(), { wrapper });
}

describe('useAuth', () => {
  it('starts signed out', () => {
    const { result } = setup();
    expect(result.current.status).toBe('signed_out');
    expect(result.current.session).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('signs in the demo account', async () => {
    const { result } = setup();
    let session: Awaited<ReturnType<typeof result.current.signIn>> = null;
    await act(async () => {
      session = await result.current.signIn({ email: 'demo@example.com' });
    });
    expect(session).toMatchObject({ userId: 'user-demo' });
    expect(result.current.status).toBe('signed_in');
    expect(result.current.session?.email).toBe('demo@example.com');
  });

  it('keeps the ApiError when sign-in fails, and clears it on request', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signIn({ email: 'stranger@example.com' });
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
      await result.current.signUp({ fullName: 'Someone', email: 'demo@example.com' });
    });
    expect(result.current.error?.fieldErrors?.email).toMatch(/already exists/);
    expect(result.current.status).toBe('signed_out');
  });

  it('signs up a new account and signs it in', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signUp({ fullName: 'New Donor', email: 'new@example.com' });
    });
    expect(result.current.status).toBe('signed_in');
    expect(result.current.session?.name).toBe('New Donor');
  });

  it('clears an earlier error when the next attempt succeeds', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signIn({ email: 'stranger@example.com' });
    });
    expect(result.current.error).not.toBeNull();
    await act(async () => {
      await result.current.signIn({ email: 'demo@example.com' });
    });
    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('signed_in');
  });

  it('signs out', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signIn({ email: 'demo@example.com' });
    });
    act(() => result.current.signOut());
    expect(result.current.status).toBe('signed_out');
    expect(result.current.session).toBeNull();
  });

  it('ignores a second attempt while one is in flight', async () => {
    const { result } = setup();
    let results: unknown[] = [];
    await act(async () => {
      results = await Promise.all([
        result.current.signUp({ fullName: 'Twice', email: 'twice@example.com' }),
        result.current.signUp({ fullName: 'Twice', email: 'twice@example.com' }),
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
