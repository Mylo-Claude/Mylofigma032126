/**
 * @file contexts/SessionContext.tsx
 * @role Session management and auth lifecycle
 * @owns Login/logout state, localStorage persistence for mylo_session,
 *       bootstrapping RoleContext.setRole on login, logout, and page restore.
 * @does-not-own Role definitions (types/index.ts), document/folder state
 *               (DocumentContext), template state (TemplateContext),
 *               routing decisions (router.tsx).
 *
 * Auth model: mock login — name + role picker, no passwords, no backend.
 * Session persists across page refreshes via localStorage. Absence of a
 * stored session requires re-login.
 *
 * Provider order constraint: SessionProvider must be mounted inside RoleProvider
 * so it can call setRole to sync the persisted role back into React state on
 * initial mount and on every login/logout.
 *
 * @see types/index.ts — Session, Role types
 * @see RoleContext.tsx — provides setRole consumed here
 * @see router.tsx — reads session to enforce protected route guards
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Session, Role } from '../types';
import { useRole } from './RoleContext';

const STORAGE_KEY = 'mylo_session';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface SessionContextType {
  /** Active session, or null if not logged in. */
  session: Session | null;
  /** Log in: persists session to localStorage and syncs role to RoleContext. */
  login: (name: string, role: Role) => void;
  /** Log out: clears session from localStorage and resets role to contributor. */
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SessionProvider({ children }: { children: ReactNode }) {
  const { setRole } = useRole();

  /**
   * Initialize synchronously from localStorage.
   * localStorage reads are synchronous — no async loading state is needed.
   * If the stored value is corrupt, fall back to null (force re-login).
   */
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as Session) : null;
    } catch {
      return null;
    }
  });

  /**
   * Sync role into RoleContext whenever session changes.
   * Covers three cases:
   *   1. Page restore — initial render with session from localStorage
   *   2. Login — new session set
   *   3. Logout — session cleared, role reset to contributor default
   */
  useEffect(() => {
    setRole(session ? session.role : 'contributor');
  }, [session, setRole]);

  const login = (name: string, role: Role): void => {
    const newSession: Session = { name, role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
  };

  const logout = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  };

  return (
    <SessionContext.Provider value={{ session, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useSession — access session state and auth actions.
 * Must be called within a SessionProvider subtree.
 */
export function useSession(): SessionContextType {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
