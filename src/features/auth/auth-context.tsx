'use client';

/**
 * Sign-in for the donation gate only (decision D3). The rest of the public site never
 * asks anyone to log in. The session lives in memory: a reload signs you out, on purpose.
 * Sign-in and sign-up go through ApiClient, so a real backend replaces the mock with no
 * change here.
 */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getApiClient } from '@/lib/api/client';
import type { ApiClient } from '@/lib/api/contract';
import { ApiError, isApiError } from '@/lib/api/errors';
import type { LoginInput, SignupInput } from '@/lib/api/schemas';
import type { Session } from '@/lib/api/types';

export type AuthStatus = 'signed_out' | 'loading' | 'signed_in';

export interface AuthState {
  session: Session | null;
  status: AuthStatus;
  /** The last failed attempt. Cleared by the next attempt or by clearError(). */
  error: ApiError | null;
  /** Resolves with the session, or null if it failed (see `error`). */
  signIn: (input: LoginInput) => Promise<Session | null>;
  signUp: (input: SignupInput) => Promise<Session | null>;
  signOut: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;
  return new ApiError('server', 'Something went wrong. Please try again.');
}

interface AuthProviderProps {
  children: ReactNode;
  /** Defaults to the app's client. Tests pass their own. */
  client?: ApiClient;
}

export function AuthProvider({ children, client }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('signed_out');
  const [error, setError] = useState<ApiError | null>(null);
  const busy = useRef(false);

  const attempt = useCallback(
    async (call: (api: ApiClient) => Promise<Session>): Promise<Session | null> => {
      if (busy.current) return null;
      busy.current = true;
      setError(null);
      setStatus('loading');
      try {
        const next = await call(client ?? getApiClient());
        setSession(next);
        setStatus('signed_in');
        return next;
      } catch (caught) {
        setError(toApiError(caught));
        setStatus('signed_out');
        return null;
      } finally {
        busy.current = false;
      }
    },
    [client],
  );

  const signIn = useCallback((input: LoginInput) => attempt((api) => api.login(input)), [attempt]);
  const signUp = useCallback(
    (input: SignupInput) => attempt((api) => api.signup(input)),
    [attempt],
  );

  const signOut = useCallback(() => {
    setSession(null);
    setStatus('signed_out');
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthState>(
    () => ({ session, status, error, signIn, signUp, signOut, clearError }),
    [session, status, error, signIn, signUp, signOut, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
