-- EDUOS-102 — Authentication
-- Spec: part1 §5 (Auth), part1 §8 (Security)
--
-- Run this AFTER supabase/schema.sql, in the Supabase SQL editor.
--
-- Scope note: this migration wires identity only. It deliberately does NOT
-- touch RLS policies or the `postgres`-owner bypass — those are EDUOS-103 and
-- EDUOS-104. Until those land, authentication proves *who* a caller is but does
-- not yet constrain *what* they can reach.

-- ---------------------------------------------------------------------------
-- 1. Role vocabulary fix
-- ---------------------------------------------------------------------------
-- The CHECK constraint shipped with schema.sql allows:
--     student, teacher, principal, super_admin, parent, finance
-- but frontend/src/lib/types.ts declares UserRole as:
--     student, teacher, principal, parent, super_admin, hr_manager
--
-- `hr_manager` was missing from the database, so the HR dashboard added in
-- EDUOS-101 has a UI and an API but no user row that could legally hold the
-- role — every insert would have failed the CHECK. Widen it to the union of
-- both sets so the existing screens can actually have owners.
--
-- This single-role column is an interim shape. EDUOS-105 replaces it with the
-- roles/permissions/user_roles tables from part1 §7.3, where a user may hold
-- several roles at once; the session layer already returns `roles[]` so that
-- change will not ripple into the frontend.
ALTER TABLE public.user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles
    ADD CONSTRAINT user_profiles_role_check CHECK (role IN (
        'student',
        'parent',
        'teacher',
        'principal',
        'hr_manager',
        'finance',
        'super_admin'
    ));

-- ---------------------------------------------------------------------------
-- 2. Identity + MFA columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS mfa_enrolled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_login_at   TIMESTAMPTZ;

-- auth_user_id is the join key to Supabase Auth and is read on every request.
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id
    ON public.user_profiles (auth_user_id);

-- Email is how an invited profile is matched to its auth user (see §3).
-- Case-insensitive, because Supabase lowercases addresses but hand-seeded rows
-- frequently do not.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_tenant_email
    ON public.user_profiles (tenant_id, lower(email));

-- ---------------------------------------------------------------------------
-- 3. Link auth.users -> user_profiles on signup
-- ---------------------------------------------------------------------------
-- Invite-first, NOT self-serve. An administrator creates the user_profiles row
-- (tenant_id, branch_id, role) ahead of time; this trigger only attaches the
-- auth user to a row that already exists.
--
-- The alternative — letting signup carry its own tenant_id in user metadata —
-- would let any stranger with the public anon key create an account inside any
-- tenant by posting a tenant UUID. Tenant membership must be granted, never
-- self-declared.
--
-- A signup with no matching profile links to nothing. That user authenticates
-- successfully and then resolves to no session, which the app renders as
-- "no access" rather than as a broken login.
CREATE OR REPLACE FUNCTION public.link_auth_user_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.user_profiles
       SET auth_user_id = NEW.id,
           updated_at   = NOW()
     WHERE lower(email) = lower(NEW.email)
       AND auth_user_id IS NULL;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.link_auth_user_to_profile();

-- ---------------------------------------------------------------------------
-- 4. Session resolution helper
-- ---------------------------------------------------------------------------
-- Returns the calling user's profile. Used by the app to build its session and,
-- from EDUOS-103 onward, by RLS policies so that tenant scoping is expressed in
-- exactly one place instead of being copy-pasted into every policy.
CREATE OR REPLACE FUNCTION public.current_profile()
RETURNS public.user_profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
      FROM public.user_profiles
     WHERE auth_user_id = auth.uid()
       AND status = 'active'
     LIMIT 1;
$$;

-- Convenience wrapper; EDUOS-103 policies will read this.
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT tenant_id
      FROM public.user_profiles
     WHERE auth_user_id = auth.uid()
       AND status = 'active'
     LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- 5. Let a signed-in user read their own profile
-- ---------------------------------------------------------------------------
-- Bootstrapping problem: the app cannot know its tenant until it has read its
-- own profile row, so that one read has to be permitted by identity rather than
-- by tenant. Scoped strictly to auth_user_id = auth.uid(), so it exposes the
-- caller's own row and nothing else.
--
-- Drop old recursive schema policy on user_profiles
DROP POLICY IF EXISTS tenant_isolation_on_user_profiles ON public.user_profiles;

CREATE POLICY tenant_isolation_on_user_profiles ON public.user_profiles
    FOR ALL
    USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS own_profile_readable ON public.user_profiles;

CREATE POLICY own_profile_readable ON public.user_profiles
    FOR SELECT
    USING (auth_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. Login timestamp
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_login()
RETURNS VOID
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.user_profiles
       SET last_login_at = NOW()
     WHERE auth_user_id = auth.uid();
$$;
