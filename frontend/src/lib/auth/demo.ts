import { UserRole } from '@/lib/types';
import { mockProfiles } from '@/lib/mockData';
import { EduosSession, rolesRequireMfa } from './session';

/**
 * EDUOS-102 — sandbox session for the no-Supabase demo mode.
 *
 * The README documents a "Mock Fallback Sandbox": with no Supabase keys the app
 * runs entirely on local fixtures so a new contributor can `npm run dev` and see
 * the product. Gating that behind a login nobody can complete would delete the
 * feature, so demo mode keeps working.
 *
 * The containment that makes this safe rather than a backdoor:
 *
 *   1. It is reachable ONLY when `isSupabaseConfigured()` is false — that is,
 *      when the placeholder URL and key are still in place and there is no real
 *      database to reach. A configured deployment can never enter this path.
 *   2. Callers must pass `isSupabaseConfigured()` explicitly, so no code can
 *      mint a demo session without having checked.
 *   3. `isDemo: true` rides on the session itself, and the UI renders a
 *      permanent banner from it. Demo mode is never silent.
 *
 * It is deliberately NOT an "auth disabled" flag. When Supabase is configured
 * there is exactly one way to obtain a session: sign in.
 */
export function resolveDemoSession(
  supabaseConfigured: boolean,
  role: UserRole = 'student',
): EduosSession | null {
  if (supabaseConfigured) return null;

  const profile = mockProfiles[role] ?? mockProfiles.student;
  const roles = [role];

  return {
    userId: profile.id,
    authUserId: `demo-auth-${role}`,
    tenantId: profile.tenantId,
    branchId: profile.branchId ?? null,
    roles,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    avatarUrl: profile.avatarUrl ?? null,
    requiresMfa: rolesRequireMfa(roles),
    // Demo sessions never claim MFA. A privileged demo role therefore shows the
    // same "2FA required" affordance a real one would, so the gap stays visible
    // rather than being papered over in the environment used for screenshots.
    mfaEnrolled: false,
    isDemo: true,
  };
}
