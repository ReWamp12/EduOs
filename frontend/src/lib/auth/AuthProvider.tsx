'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { EduosSession } from './session';
import { fetchSession, onAuthChange, signOut as supabaseSignOut } from './client';
import { resolveDemoSession } from './demo';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  session: EduosSession | null;
  status: AuthStatus;
  isDemo: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  /**
   * Sandbox-only role swap, backing the existing sidebar switcher while there
   * is no database to authenticate against. A no-op once Supabase is
   * configured — a real session's roles come from `user_profiles` and are not
   * client-settable. EDUOS-107 removes the switcher from the authenticated UI
   * entirely; this keeps the demo usable until then.
   */
  setDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const router = useRouter();

  const [session, setSession] = useState<EduosSession | null>(() =>
    configured ? null : resolveDemoSession(false, 'student'),
  );
  const [status, setStatus] = useState<AuthStatus>(() =>
    configured ? 'loading' : 'authenticated',
  );

  const load = useCallback(async () => {
    if (!configured) return;

    const next = await fetchSession();
    setSession(next);
    setStatus(next ? 'authenticated' : 'unauthenticated');
  }, [configured]);

  useEffect(() => {
    if (!configured) return;

    void load();
    // Sign-out in another tab, or a refresh-token failure, must drop this tab's
    // session too — otherwise the UI keeps rendering a dashboard whose queries
    // have already started failing.
    return onAuthChange(() => {
      void load();
    });
  }, [configured, load]);

  const handleSignOut = useCallback(async () => {
    if (!configured) return;

    await supabaseSignOut();
    setSession(null);
    setStatus('unauthenticated');
    router.replace('/login');
  }, [configured, router]);

  const setDemoRole = useCallback(
    (role: UserRole) => {
      if (configured) return;
      setSession(resolveDemoSession(false, role));
    },
    [configured],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      isDemo: !configured,
      signOut: handleSignOut,
      refresh: load,
      setDemoRole,
    }),
    [session, status, configured, handleSignOut, load, setDemoRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

/** Convenience accessor for screens that require a session to render at all. */
export function useSession(): EduosSession | null {
  return useAuth().session;
}
