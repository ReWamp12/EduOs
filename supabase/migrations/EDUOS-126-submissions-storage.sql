-- ============================================================================
-- EDUOS-126 : Supabase Storage for real assignment submission uploads
-- ----------------------------------------------------------------------------
-- Bucket `submissions` (public-read, 25 MB cap, homework document types) +
-- storage.objects policies: any authenticated user may upload into it, and
-- only the uploader may replace/remove their own file. Public read keeps
-- teacher-side links one-click (school-internal documents; move to signed
-- URLs when submissions become sensitive).
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'submissions',
    'submissions',
    true,
    26214400, -- 25 MB
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS submissions_insert_authenticated ON storage.objects;
CREATE POLICY submissions_insert_authenticated ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'submissions');

DROP POLICY IF EXISTS submissions_read_all ON storage.objects;
CREATE POLICY submissions_read_all ON storage.objects
    FOR SELECT TO authenticated, anon
    USING (bucket_id = 'submissions');

DROP POLICY IF EXISTS submissions_update_own ON storage.objects;
CREATE POLICY submissions_update_own ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'submissions' AND owner = auth.uid())
    WITH CHECK (bucket_id = 'submissions');

DROP POLICY IF EXISTS submissions_delete_own ON storage.objects;
CREATE POLICY submissions_delete_own ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'submissions' AND owner = auth.uid());
