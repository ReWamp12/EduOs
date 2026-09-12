-- ============================================================================
-- EduOS Schema: Student Performance & Learning Analytics (Phase 2 - EDUOS-113)
-- Multi-Tenant Faculty Remarks, Performance Indexes & Aggregation Hooks
-- ============================================================================

-- 1. FACULTY REMARKS TABLE
CREATE TABLE IF NOT EXISTS public.faculty_remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    remark_text TEXT NOT NULL,
    category TEXT DEFAULT 'academic' CHECK (category IN ('academic', 'attendance', 'behavior', 'general')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    version INT NOT NULL DEFAULT 1
);

-- 2. HIGH PERFORMANCE INDEXES FOR REAL-TIME ANALYTICS
CREATE INDEX IF NOT EXISTS idx_faculty_remarks_student ON public.faculty_remarks(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faculty_remarks_batch ON public.faculty_remarks(batch_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON public.exam_results(student_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON public.exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exams_batch_subject ON public.exams(batch_id, subject_id, exam_date DESC);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON public.assignment_submissions(student_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_batch_subject ON public.assignments(batch_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_attendances_student_batch ON public.attendances(student_id, batch_id, date DESC);

-- 3. ROW LEVEL SECURITY
ALTER TABLE public.faculty_remarks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_on_faculty_remarks') THEN
        CREATE POLICY tenant_isolation_on_faculty_remarks ON public.faculty_remarks
            FOR ALL USING (tenant_id = public.current_tenant_id() OR public.current_tenant_id() IS NULL);
    END IF;
END $$;
