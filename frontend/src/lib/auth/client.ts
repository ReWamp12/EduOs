'use client';

import { createBrowserClient } from '@supabase/ssr';
import { isSupabaseConfigured } from '@/lib/supabase';
import { EduosSession, UserProfileRow, sessionFromProfile } from './session';

const PROFILE_COLUMNS =
  'id, auth_user_id, tenant_id, branch_id, email, first_name, last_name, role, avatar_url, status, mfa_enrolled_at';

/**
 * Browser-side Supabase client (EDUOS-102).
 *
 * `createBrowserClient` from @supabase/ssr rather than the plain
 * `createClient` in lib/supabase.ts: the SSR client persists the session in
 * cookies instead of localStorage, which is what lets `middleware.ts` see the
 * session and gate routes before a page renders. The localStorage client is
 * invisible to the server, so route protection would be client-only — i.e.
 * bypassable by anyone who disables JavaScript.
 */
export const authClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-eduos.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
);

export interface SignInResult {
  ok: boolean;
  /** Set when authentication succeeded but no active profile is linked. */
  noProfile?: boolean;
  error?: string;
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<SignInResult> {
  const { data, error } = await authClient.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data.user) {
    return { ok: false, error: 'Sign-in returned no user.' };
  }

  // Authenticating is not the same as having access. A user can exist in
  // auth.users with no linked user_profiles row — either the invite was never
  // created, or an administrator deactivated the profile. Surface that as its
  // own outcome instead of dropping them into an empty dashboard.
  const session = await fetchSession();
  if (!session) {
    await authClient.auth.signOut();
    return { ok: false, noProfile: true };
  }

  await authClient.rpc('record_login');
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await authClient.auth.signOut();
}

/**
 * Resolve the current session, or null when signed out / unprovisioned.
 *
 * Uses `getUser()`, not `getSession()`. `getSession()` reads the cookie and
 * trusts it; `getUser()` revalidates the token against the auth server, so a
 * forged or stale cookie cannot manufacture a session.
 */
export async function fetchSession(): Promise<EduosSession | null> {
  if (!isSupabaseConfigured()) return null;

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) return null;

  const { data, error } = await authClient
    .from('user_profiles')
    .select(PROFILE_COLUMNS)
    .eq('auth_user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;

  return sessionFromProfile(data as UserProfileRow, user.id);
}

export function onAuthChange(handler: () => void): () => void {
  const {
    data: { subscription },
  } = authClient.auth.onAuthStateChange(() => handler());

  return () => subscription.unsubscribe();
}
