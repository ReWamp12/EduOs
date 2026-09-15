-- ============================================================================
-- EduOS Phase 2 · Task 4 (Tests & Exams engine)
-- Extends the Phase 1 exams table with online-assessment metadata, and adds
-- the three tables the online engine needs: questions, attempts, responses.
-- Additive and idempotent.
-- ============================================================================
--
-- What Phase 1 already had:
--   * exams(id, tenant, batch, subject, created_by, name, exam_type,
--           max_marks, passing_marks, exam_date, status, timestamps)
--   * exam_results(id, exam, student, marks_obtained, grade, remarks,
--                  timestamps) — the manual marks entry table
--
-- What Phase 2 §5 adds:
--   * exams: start_time, duration_minutes, instructions, mode, chapter/topic,
--     richer status lifecycle
--   * exam_questions: the questions on an online exam
--   * exam_attempts: per-student attempt record (a student may have >1
--     attempt if the exam allows)
--   * exam_attempt_responses: per-question answer + auto-eval result
--
-- Offline exams keep working exactly as before — they just don't have any
-- questions/attempts rows.

ALTER TABLE public.exams
    ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.syllabus_chapters(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.syllabus_topics(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS start_time TIME,
    ADD COLUMN IF NOT EXISTS duration_minutes INT,
    ADD COLUMN IF NOT EXISTS instructions TEXT,
    ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'offline'
        CHECK (mode IN ('online', 'offline')),
    ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 1;

-- Widen the exam status enum to match spec §5.7:
--   draft → scheduled → live → completed → result_pending → result_published → archived
-- Old CHECK allowed only scheduled/ongoing/completed/results_published, so
-- we drop it and re-add. Guarded so re-runs don't fail.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'exams_status_check'
    ) THEN
        ALTER TABLE public.exams DROP CONSTRAINT exams_status_check;
    END IF;
    -- Migrate legacy values to the new vocabulary.
    UPDATE public.exams SET status = 'live'              WHERE status = 'ongoing';
    UPDATE public.exams SET status = 'result_published'  WHERE status = 'results_published';
    ALTER TABLE public.exams
        ADD CONSTRAINT exams_status_check CHECK (status IN (
            'draft', 'scheduled', 'live', 'completed',
            'result_pending', 'result_published', 'archived'
        ));
END $$;

-- ── Questions ────────────────────────────────────────────────────────────────
-- Per spec §5.4/§5.5. `options` is JSONB for MCQ choices (array of
-- {id, text, is_correct}); correct_answer is the reference answer for
-- short/descriptive/true-false. Kept flexible so a later question type can
-- extend without another migration.
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL DEFAULT 1,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL
        CHECK (question_type IN ('mcq', 'true_false', 'short_answer', 'descriptive')),
    options JSONB,                  -- for mcq/true_false; null otherwise
    correct_answer TEXT,            -- for auto-evaluable types; null for descriptive
    marks NUMERIC(6,2) NOT NULL DEFAULT 1.00,
    negative_marks NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    explanation TEXT,
    chapter_id UUID REFERENCES public.syllabus_chapters(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.syllabus_topics(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (exam_id, sequence_order)
);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam
    ON public.exam_questions(exam_id, sequence_order)
 WHERE is_deleted = false;

-- ── Attempts ─────────────────────────────────────────────────────────────────
-- One row per student per attempt. `attempt_number` starts at 1 and
-- increments if the exam allows retakes. Cache the score here for cheap
-- listing (no join per row); a fresher aggregate comes from
-- exam_attempt_responses when needed.
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    auto_submitted BOOLEAN NOT NULL DEFAULT false,     -- true when timer expired (§5.9)
    status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'submitted', 'evaluated', 'published')),
    obtained_marks NUMERIC(6,2),                       -- cached; null while in_progress
    max_marks NUMERIC(6,2),                            -- snapshot of exam max at attempt time
    percentage NUMERIC(6,2),
    evaluated_at TIMESTAMPTZ,
    evaluated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    faculty_remark TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, student_id, attempt_number)
);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student
    ON public.exam_attempts(student_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam
    ON public.exam_attempts(exam_id, status);

-- ── Attempt responses (one row per question per attempt) ────────────────────
-- `is_correct` populated only when auto-eval ran (mcq/true_false); left NULL
-- for descriptive until a teacher grades it.
CREATE TABLE IF NOT EXISTS public.exam_attempt_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
    response_text TEXT,             -- selected option id (mcq) / free text / t-f
    is_correct BOOLEAN,
    marks_awarded NUMERIC(6,2),
    faculty_feedback TEXT,
    graded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_exam_attempt_responses_attempt
    ON public.exam_attempt_responses(attempt_id);

-- ── Notifications (§4.13, §10) ──────────────────────────────────────────────
-- Generic in-app notifications — not scoped to attendance the way
-- attendance_notifications was. Every academic event (assignment published,
-- exam scheduled, result published) writes a row here; the UI reads by
-- user_id. Kept intentionally generic — one table, event_type discriminator.
CREATE TABLE IF NOT EXISTS public.academic_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,        -- 'assignment_published' | 'assignment_due_soon' | ...
    title TEXT NOT NULL,
    body TEXT,
    -- Optional context so the client can deep-link without another fetch.
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    submission_id UUID REFERENCES public.assignment_submissions(id) ON DELETE SET NULL,
    attempt_id UUID REFERENCES public.exam_attempts(id) ON DELETE SET NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_academic_notifications_user
    ON public.academic_notifications(user_id, read_at, created_at DESC);

-- RLS on every new table. Same tenant-isolation pattern as the rest of the
-- schema; authorization within a tenant (e.g. student sees only their own
-- attempts) is enforced application-side + by additional row-level checks
-- worth adding in a follow-up policy pass. Right now this at minimum stops
-- cross-tenant reads.
ALTER TABLE public.exam_questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempt_responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_notifications   ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='exam_questions'
          AND policyname='tenant_isolation_on_exam_questions') THEN
        CREATE POLICY tenant_isolation_on_exam_questions
            ON public.exam_questions USING (tenant_id = public.current_tenant_id());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='exam_attempts'
          AND policyname='tenant_isolation_on_exam_attempts') THEN
        CREATE POLICY tenant_isolation_on_exam_attempts
            ON public.exam_attempts USING (tenant_id = public.current_tenant_id());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='exam_attempt_responses'
          AND policyname='tenant_isolation_on_exam_attempt_responses') THEN
        CREATE POLICY tenant_isolation_on_exam_attempt_responses
            ON public.exam_attempt_responses
            USING (tenant_id = public.current_tenant_id());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='academic_notifications'
          AND policyname='tenant_isolation_on_academic_notifications') THEN
        CREATE POLICY tenant_isolation_on_academic_notifications
            ON public.academic_notifications
            USING (tenant_id = public.current_tenant_id());
    END IF;
END $$;
