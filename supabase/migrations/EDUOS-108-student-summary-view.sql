-- ============================================================================
-- EDUOS-108 : real attendance % and batch rank
-- ----------------------------------------------------------------------------
-- dataService fabricated these two figures even on the live-database path:
--
--   getStudentOverview()  ->  attendancePct: 94.2,  rankInBatch: 4
--   getStudents()         ->  attendancePct: 90 + ((idx % 10) * 0.8),
--                             rankInBatch:   idx + 1
--
-- Both were rendered next to genuine name/roll/batch data pulled from Supabase,
-- so a parent reading "94.2% attendance" on their child's dashboard was reading
-- a literal. The second is worse than a constant: it derives a plausible-looking
-- percentage from the array index, so it changes when the sort order changes.
--
-- This view computes both from the rows that already exist. It is a view rather
-- than per-row queries because rank is inherently a whole-batch calculation --
-- ranking one student means reading the batch anyway.
--
-- security_invoker = true is LOAD-BEARING and was the bug in the first cut of
-- this migration. A Postgres view does NOT evaluate as the caller by default --
-- it runs with the view owner's RLS context (owner is the postgres role, which
-- bypasses RLS), so the "default" the original comment claimed actually exposed
-- every student's attendance and rank to any authenticated caller. Verified:
-- signed in as one student, `SELECT * FROM v_student_academic_summary` returned
-- all 30 rows. With security_invoker the EDUOS-108 policies on students /
-- attendances / exam_results apply as the caller, and a student sees exactly
-- their own row. (Requires PG 15+, confirmed 17.6.)
--
-- Idempotent: safe to re-run.
-- ============================================================================

DROP VIEW IF EXISTS public.v_student_academic_summary;

CREATE VIEW public.v_student_academic_summary
    WITH (security_invoker = true)
AS
WITH attendance_rollup AS (
    SELECT
        a.student_id,
        COUNT(*)                                            AS periods_recorded,
        COUNT(*) FILTER (WHERE a.status = 'present')        AS periods_present,
        COUNT(*) FILTER (WHERE a.is_excused_medical)        AS periods_excused
    FROM public.attendances a
    GROUP BY a.student_id
),
exam_rollup AS (
    SELECT
        er.student_id,
        AVG(
            CASE WHEN COALESCE(e.total_marks, 0) > 0
                 THEN (er.marks_obtained / e.total_marks::NUMERIC) * 100
            END
        )                                                   AS avg_pct,
        COUNT(*)                                            AS results_count
    FROM public.exam_results er
    JOIN public.exams e ON e.id = er.exam_id
    GROUP BY er.student_id
)
SELECT
    s.id                                                    AS student_id,
    s.batch_id,
    -- Attendance excludes medically-excused periods from the denominator, the
    -- same rule get_attendance_defaulters() applies, so the two never disagree.
    CASE
        WHEN COALESCE(ar.periods_recorded, 0) - COALESCE(ar.periods_excused, 0) > 0
        THEN ROUND(
                 100.0 * ar.periods_present
                       / (ar.periods_recorded - ar.periods_excused)::NUMERIC,
                 1)
        ELSE NULL                                           -- no register yet
    END                                                     AS attendance_pct,
    COALESCE(ar.periods_recorded, 0)                        AS periods_recorded,
    ROUND(ex.avg_pct, 2)                                    AS average_pct,
    ex.results_count,
    -- NULL rank when the student has sat no exam: an unranked student is not
    -- rank 1, and the previous code's `idx + 1` said otherwise.
    --
    -- NULLS LAST is load-bearing. Postgres sorts NULLs first under DESC, so
    -- without it the 20 students who have sat no exam occupy ranks 1-20 and
    -- the actual top scorer comes out ranked 21 of 30.
    CASE
        WHEN ex.avg_pct IS NULL THEN NULL
        ELSE RANK() OVER (PARTITION BY s.batch_id ORDER BY ex.avg_pct DESC NULLS LAST)
    END                                                     AS rank_in_batch
FROM public.students s
LEFT JOIN attendance_rollup ar ON ar.student_id = s.id
LEFT JOIN exam_rollup      ex ON ex.student_id = s.id;

GRANT SELECT ON public.v_student_academic_summary TO authenticated;
