import { UserRole } from '@/lib/types';

/**
 * EDUOS-102 — the authenticated session shape (part1 §5, §7).
 *
 * Everything downstream reads identity from here rather than from component
 * state. `roles` is an array from day one even though `user_profiles.role` is
 * currently a single column: part1 §7.1 requires multi-role support ("a Teacher
 * who is also a Parent"), and EDUOS-105 replaces the column with a `user_roles`
 * join table. Returning an array now means that migration touches the mapper in
 * this file and nothing else.
 */
export interface EduosSession {
  /** `user_profiles.id` — the tenant-scoped profile, used as the actor in audit rows. */
  userId: string;
  /** `auth.users.id` — Supabase Auth identity. Distinct from `userId`. */
  authUserId: string;
  tenantId: string;
  branchId: string | null;
  roles: UserRole[];
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  /** True when any held role is privileged enough to require 2FA (part1 §8). */
  requiresMfa: boolean;
  mfaEnrolled: boolean;
  /**
   * True only in the no-Supabase sandbox. Real deployments never see this;
   * see `resolveDemoSession` for why it exists and how it is contained.
   */
  isDemo: boolean;
}

/** Raw `user_profiles` row as returned by Supabase. */
export interface UserProfileRow {
  id: string;
  auth_user_id: string | null;
  tenant_id: string;
  branch_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url: string | null;
  status: string | null;
  mfa_enrolled_at: string | null;
}

/**
 * Roles that must carry 2FA, per part1 §8: "2FA mandatory for Super Admin,
 * Trustee, Principal, Finance, HR roles; optional/configurable for others."
 *
 * Trustee and Finance have no UserRole member yet — they arrive with EDUOS-137
 * and EDUOS-123. They are listed here as strings so that adding the role to the
 * union automatically brings the 2FA requirement with it, instead of silently
 * granting a privileged role an unprotected login.
 */
export const MFA_REQUIRED_ROLES: readonly string[] = [
  'super_admin',
  'trustee',
  'principal',
  'finance',
  'hr_manager',
];

export function rolesRequireMfa(roles: readonly string[]): boolean {
  return roles.some((role) => MFA_REQUIRED_ROLES.includes(role));
}

const KNOWN_ROLES: readonly UserRole[] = [
  'student',
  'parent',
  'teacher',
  'principal',
  'hr_manager',
  'super_admin',
];

function toUserRole(raw: string): UserRole | null {
  return (KNOWN_ROLES as readonly string[]).includes(raw) ? (raw as UserRole) : null;
}

/**
 * Map a profile row to a session.
 *
 * Returns null for a row whose role the frontend does not model — `finance` is
 * valid in the database (EDUOS-102 migration) but has no dashboard until
 * EDUOS-123. Signing such a user into a UI with no screens would strand them on
 * a blank page, so they are treated as "no access" until their module ships.
 */
export function sessionFromProfile(
  profile: UserProfileRow,
  authUserId: string,
): EduosSession | null {
  const role = toUserRole(profile.role);
  if (!role) return null;

  const roles = [role];

  return {
    userId: profile.id,
    authUserId,
    tenantId: profile.tenant_id,
    branchId: profile.branch_id,
    roles,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    avatarUrl: profile.avatar_url,
    requiresMfa: rolesRequireMfa(roles),
    mfaEnrolled: Boolean(profile.mfa_enrolled_at),
    isDemo: false,
  };
}

export function displayName(session: EduosSession): string {
  return `${session.firstName} ${session.lastName}`.trim();
}
