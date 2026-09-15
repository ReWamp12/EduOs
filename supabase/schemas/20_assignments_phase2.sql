-- ============================================================================
-- EduOS Phase 2 · Task 3 (Assignments & Homework)
-- Extends the Phase 1 assignments + submissions tables with the fields the
-- Phase 2 spec requires. Additive migration; every ADD COLUMN is IF NOT
-- EXISTS so a re-run is a no-op.
-- ============================================================================
--
-- What Phase 1 already had:
--   * assignments(id, tenant, batch, subject, teacher, title, description,
--                 due_date, max_marks, attachment_url, timestamps, soft-delete)
--   * assignment_submissions(id, assignment, student, submission_text,
--                            file_url, submitted_at, status, marks_awarded,
--                            feedback, timestamps)
--
-- What Phase 2 §4.1 adds:
--   * chapter_id / topic_id — optional syllabus link (§4.11)
--   * issue_date — the day the work is 'assigned' (defaults to created_at
--     so historical rows keep working)
--   * instructions — separate from description; description is the task,
--     instructions is the how (spec §4.1 lists them as two fields)
--   * submission_type — 'file' | 'text' | 'both' (§4.4)
--   * allow_resubmission — bool (§4.7, §16); default false
--   * status — spec §4.2 lifecycle: draft → published → open → closed →
--     archived. Adds a status column and defaults existing rows to
--     'published' so old assignments stay visible.
--   * closed_at — when submissions were locked; audit trail

-- ── Prereq: catch up prod-drifted columns ─────────────────────────────────
-- The schema-file view of these tables was ahead of prod. Every column we
-- add here has a sensible default so the ALTERs succeed on tables that
-- already have rows.
--
-- Column names match PROD (not the drifted schema file):
--   assignment_submissions has `submission_url` (not file_url),
--   `marks_obtained` (not marks_awarded), `student_notes` (not
--   submission_text). The Phase 2 additions below use those real names.

ALTER TABLE public.assignments
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.assignment_submissions
    ADD COLUMN IF NOT EXISTS tenant_id  UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill tenant_id on submissions from the parent assignment. Safe because
-- assignment_submissions.assignment_id has NOT NULL + FK, so every existing
-- row has a matching assignments row with a tenant_id.
UPDATE public.assignment_submissions s
   SET tenant_id = a.tenant_id
  FROM public.assignments a
 WHERE s.assignment_id = a.id
   AND s.tenant_id IS NULL;

-- Only after the backfill can we require NOT NULL. Guarded so a re-run
-- doesn't re-run a constraint tighten that already happened.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name='assignment_submissions'
           AND column_name='tenant_id' AND is_nullable='YES'
    ) THEN
        ALTER TABLE public.assignment_submissions
            ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
END $$;

-- ── Phase 2 columns on assignments ────────────────────────────────────────
ALTER TABLE public.assignments
    ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.syllabus_chapters(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.syllabus_topics(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS instructions TEXT,
    ADD COLUMN IF NOT EXISTS submission_type TEXT NOT NULL DEFAULT 'both'
        CHECK (submission_type IN ('file', 'text', 'both')),
    ADD COLUMN IF NOT EXISTS allow_resubmission BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
        CHECK (status IN ('draft', 'published', 'open', 'closed', 'archived')),
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Backfill status: existing rows are 'published' (already visible) unless
-- the due_date is in the past, in which case they're 'closed'. Ideally we'd
-- treat published+not-yet-due as 'open' too, but the app treats
-- published/open the same when reading, so keeping this simple.
UPDATE public.assignments
   SET status = 'closed'
 WHERE status = 'published'
   AND due_date < NOW()
   AND closed_at IS NULL;
UPDATE public.assignments
   SET closed_at = due_date
 WHERE status = 'closed' AND closed_at IS NULL;

-- Assignment attachments — many-per-assignment, replacing the single
-- `attachment_url` column. The column stays (backward-compat with any code
-- still reading it); new writes should insert into this table instead.
CREATE TABLE IF NOT EXISTS public.assignment_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT,
    mime_type TEXT,
    file_size_bytes BIGINT,
    uploaded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assignment_attachments_assignment
    ON public.assignment_attachments(assignment_id);

-- Backfill the single attachment_url into the new table (once). Guarded by
-- NOT EXISTS so a re-run doesn't duplicate.
INSERT INTO public.assignment_attachments (tenant_id, assignment_id, file_url)
SELECT a.tenant_id, a.id, a.attachment_url
  FROM public.assignments a
 WHERE a.attachment_url IS NOT NULL
   AND a.attachment_url <> ''
   AND NOT EXISTS (
       SELECT 1 FROM public.assignment_attachments x
        WHERE x.assignment_id = a.id AND x.file_url = a.attachment_url
   );

-- Submission attachments — multi-file per submission (§4.4).
CREATE TABLE IF NOT EXISTS public.submission_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT,
    mime_type TEXT,
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_submission_attachments_submission
    ON public.submission_attachments(submission_id);

-- Backfill single submission_url (prod's column name) + file_name if it
-- exists on the submission row. The multi-file table uses `file_url` as its
-- column, so we alias here — the target column name is what matters.
INSERT INTO public.submission_attachments (tenant_id, submission_id, file_url, file_name)
SELECT s.tenant_id, s.id, s.submission_url, s.file_name
  FROM public.assignment_submissions s
 WHERE s.submission_url IS NOT NULL AND s.submission_url <> ''
   AND NOT EXISTS (
       SELECT 1 FROM public.submission_attachments x
        WHERE x.submission_id = s.id AND x.file_url = s.submission_url
   );

-- Extend assignment_submissions with per-attempt tracking (§4.7, §16).
-- attempt_number counts up per resubmission on the same (assignment, student);
-- reviewed_at / reviewer_id let us tell "graded" from "reviewed but returned".
ALTER TABLE public.assignment_submissions
    ADD COLUMN IF NOT EXISTS attempt_number INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- The old UNIQUE(assignment_id, student_id) blocks resubmissions. Drop
-- whatever unique constraint exists on that pair (name may vary between
-- environments), then add the new one that includes attempt_number.
DO $$
DECLARE
    old_uniq TEXT;
BEGIN
    SELECT c.conname INTO old_uniq
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
     WHERE t.relname = 'assignment_submissions'
       AND c.contype = 'u'
       AND (
           SELECT array_agg(attname ORDER BY attname)
             FROM pg_attribute
            WHERE attrelid = c.conrelid AND attnum = ANY(c.conkey)
       ) = ARRAY['assignment_id','student_id']::name[]
     LIMIT 1;
    IF old_uniq IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.assignment_submissions DROP CONSTRAINT %I', old_uniq);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'assignment_submissions_assignment_student_attempt_key'
    ) THEN
        ALTER TABLE public.assignment_submissions
            ADD CONSTRAINT assignment_submissions_assignment_student_attempt_key
            UNIQUE (assignment_id, student_id, attempt_number);
    END IF;
END $$;

-- Helper index for the common "list all submissions for a student" query.
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student
    ON public.assignment_submissions(student_id, submitted_at DESC);

-- Enable RLS on the new tables (Phase 1 tables already have it via
-- 15_rls_policies.sql; extending here so nothing lands wide-open).
ALTER TABLE public.assignment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_attachments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='assignment_attachments'
          AND policyname='tenant_isolation_on_assignment_attachments') THEN
        CREATE POLICY tenant_isolation_on_assignment_attachments
            ON public.assignment_attachments
            USING (tenant_id = public.current_tenant_id());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='submission_attachments'
          AND policyname='tenant_isolation_on_submission_attachments') THEN
        CREATE POLICY tenant_isolation_on_submission_attachments
            ON public.submission_attachments
            USING (tenant_id = public.current_tenant_id());
    END IF;
END $$;
