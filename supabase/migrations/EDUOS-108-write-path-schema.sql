-- ============================================================================
-- EDUOS-108 : schema prerequisites for the real write paths
-- ----------------------------------------------------------------------------
-- Several screens were "wired" only in the sense that they mutated a local
-- store. Turning them into genuine writes needs two natural keys that the
-- schema never had, plus the columns the gradebook and assignment flows
-- actually carry.
--
-- Without a unique key on (exam_id, student_id) an upsert cannot exist, and
-- re-running a marks entry silently doubles the row count. That has already
-- happened on this database: 20 of the 40 exam_results rows are duplicates
-- created 42 seconds apart by a seed script run twice. Verified byte-identical
-- across marks_obtained, percentile, rank_in_batch and mistake_summary before
-- deduplicating, so collapsing them loses nothing:
--
--   SELECT count(*) FROM (
--     SELECT exam_id, student_id FROM exam_results
--      GROUP BY 1,2
--     HAVING count(*) > 1
--        AND (count(DISTINCT marks_obtained) > 1
--          OR count(DISTINCT coalesce(percentile,-1)) > 1
--          OR count(DISTINCT coalesce(rank_in_batch,-1)) > 1
--          OR count(DISTINCT coalesce(mistake_summary,'')) > 1)) x;
--   -- 0
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. exam_results — collapse the seed duplicates, keeping the earliest row.
-- ---------------------------------------------------------------------------
DELETE FROM public.exam_results er
 WHERE er.id NOT IN (
     SELECT DISTINCT ON (exam_id, student_id) id
       FROM public.exam_results
      ORDER BY exam_id, student_id, created_at ASC, id ASC
 );

ALTER TABLE public.exam_results
    DROP CONSTRAINT IF EXISTS exam_results_exam_student_unique;
ALTER TABLE public.exam_results
    ADD CONSTRAINT exam_results_exam_student_unique UNIQUE (exam_id, student_id);

-- Marks entry records who signed the sheet and when, so the Principal's
-- sign-off queue has something to verify against.
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS graded_by  UUID REFERENCES public.user_profiles(id);
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS graded_at  TIMESTAMPTZ;
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS feedback   TEXT;

-- ---------------------------------------------------------------------------
-- 2. assignment_submissions — one submission per student per assignment.
--    (Verified: no existing duplicates.)
-- ---------------------------------------------------------------------------
ALTER TABLE public.assignment_submissions
    DROP CONSTRAINT IF EXISTS assignment_submissions_assignment_student_unique;
ALTER TABLE public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_student_unique UNIQUE (assignment_id, student_id);

ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS student_notes TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS file_name     TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS graded_by     UUID REFERENCES public.user_profiles(id);
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS graded_at     TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 3. exams — the teacher scheduler carries a subject and an author that the
--    table had nowhere to put, so both were being dropped on the floor.
-- ---------------------------------------------------------------------------
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id);
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.user_profiles(id);

-- ---------------------------------------------------------------------------
-- 4. leave_requests — the approval screen writes a decision note and a
--    reviewer; only `actioned_by` existed.
-- ---------------------------------------------------------------------------
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS reviewed_at     TIMESTAMPTZ;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS review_comment  TEXT;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS designation     TEXT;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS days_count      INTEGER;

-- ---------------------------------------------------------------------------
-- 5. notices — the composer targets a set of audiences, not the single
--    target_role string the table models. Kept additive so existing rows and
--    the reader query stay valid.
-- ---------------------------------------------------------------------------
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS audience TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.notices
   SET audience = CASE
         WHEN target_role IS NULL OR target_role = 'all' THEN ARRAY['student','parent','teacher']
         ELSE ARRAY[target_role]
       END
 WHERE audience = '{}';

-- ---------------------------------------------------------------------------
-- 6. Auto-fill tenant_id on insert.
--
--    Every tenant table is NOT NULL on tenant_id with no default, and the
--    EDUOS-108 write policies enforce `tenant_id = current_tenant_id()` in
--    their WITH CHECK. That left the browser having to thread the caller's
--    tenant id into every insert just to satisfy a value the database already
--    knows -- and an insert that forgot it failed the RLS check with a
--    confusing "violates row-level security" rather than a NOT NULL error.
--
--    This trigger stamps tenant_id from current_tenant_id() whenever the
--    insert leaves it NULL. It cannot be used to escape a tenant: the WITH
--    CHECK still runs afterwards, so an explicit foreign tenant_id is still
--    rejected. It only removes the requirement to restate the caller's own
--    tenant on the client.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_tenant_id_from_session()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NEW.tenant_id IS NULL THEN
        NEW.tenant_id := public.current_tenant_id();
    END IF;
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['exams', 'notices', 'leave_requests', 'assignments']
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_tenant_id ON public.%I', t);
        EXECUTE format(
            'CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.%I '
            'FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session()', t);
    END LOOP;
END;
$$;
