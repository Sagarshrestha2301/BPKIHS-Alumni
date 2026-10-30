'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { getApiClient } from '@/lib/api/client';
import type { Session } from '@/lib/api/types';

export type SessionStatus = 'loading' | 'signed_in' | 'signed_out';

export interface SessionState {
  status: SessionStatus;
  /** The signed-in member, or null while the check is in flight or nobody is signed in. */
  session: Session | null;
}

export interface SessionValue extends SessionState {
  /** Ask again, after signing in or out inside a client island (the header has to follow). */
  refresh: () => void;
}

/**
 * One session lookup per page load, shared by every client component that has to behave
 * differently for a signed-in member: the header, the mobile menu and the community feed.
 *
 * The layout itself stays server-rendered and static : reading cookies there would make every
 * page dynamic : so the header draws its signed-out state first and swaps once the answer
 * arrives. A failed lookup is simply "signed out"; the API still enforces every rule, this
 * only decides what the interface shows.
 */
const LOADING: SessionState = { status: 'loading', session: null };

const SessionContext = createContext<SessionValue>({ ...LOADING, refresh: () => {} });

/** Nothing to subscribe to: the value only flips once, when hydration finishes. */
function subscribe(): () => void {
  return () => {};
}

/**
 * True after hydration, false on the server and in the first client render. The server can
 * only ever have drawn the signed-out state, so a name that arrived mid-hydration would be a
 * text mismatch; withholding the answer until this flips makes every consumer redraw exactly
 * what the server did first and swap afterwards.
 */
function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(LOADING);
  const alive = useRef(true);

  const refresh = useCallback(() => {
    getApiClient()
      .getSession()
      .then((session) => {
        if (!alive.current) return;
        setState({ status: session ? 'signed_in' : 'signed_out', session });
      })
      .catch(() => {
        if (!alive.current) return;
        setState({ status: 'signed_out', session: null });
      });
  }, []);

  useEffect(() => {
    alive.current = true;
    refresh();
    return () => {
      alive.current = false;
    };
  }, [refresh]);

  const value = useMemo<SessionValue>(() => ({ ...state, refresh }), [state, refresh]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  const mounted = useHasMounted();
  return mounted ? value : { ...LOADING, refresh: value.refresh };
}
