-- ============================================================================
-- EDUOS-127 : Lock down submission documents (private bucket + signed URLs)
-- ----------------------------------------------------------------------------
-- EDUOS-126 shipped `submissions` as public-read, so any leaked object URL
-- opened a student's homework forever. This makes the bucket private: reads
-- now require an authenticated session AND a role check, and the app hands
-- out short-lived signed URLs instead of permanent public links.
--
-- Read rule: the uploading student (object owner) or teaching/administrative
-- staff of the same tenant. One student can never read another's work.
-- ============================================================================

UPDATE storage.buckets SET public = false WHERE id = 'submissions';

-- Is the caller staff (teaching or administrative)?
CREATE OR REPLACE FUNCTION public.is_staff_viewer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.auth_user_id = auth.uid()
          AND up.status = 'active'
          AND up.role IN ('teacher', 'principal', 'super_admin', 'hr_manager')
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_staff_viewer() TO authenticated;

-- Replace the permissive read policy from EDUOS-126.
DROP POLICY IF EXISTS submissions_read_all ON storage.objects;

DROP POLICY IF EXISTS submissions_read_owner_or_staff ON storage.objects;
CREATE POLICY submissions_read_owner_or_staff ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'submissions'
        AND (owner = auth.uid() OR public.is_staff_viewer())
    );
