-- ============================================================================
-- EDUOS-104 : Database RLS Completion & Table Hardening
-- ----------------------------------------------------------------------------
-- Closes the 17-table RLS gap.
-- Enforces ROW LEVEL SECURITY and FORCE ROW LEVEL SECURITY across all
-- tenant-scoped tables with unified current_tenant_id() scoping.
-- ============================================================================

-- 1. Helper function if not already present
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
     LIMIT 1;
$$;

-- 2. Enable & Force RLS on all tenant-scoped tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches FORCE ROW LEVEL SECURITY;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students FORCE ROW LEVEL SECURITY;

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers FORCE ROW LEVEL SECURITY;

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects FORCE ROW LEVEL SECURITY;

ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables FORCE ROW LEVEL SECURITY;

ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances FORCE ROW LEVEL SECURITY;

ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_courses FORCE ROW LEVEL SECURITY;

ALTER TABLE public.lms_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lessons FORCE ROW LEVEL SECURITY;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams FORCE ROW LEVEL SECURITY;

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results FORCE ROW LEVEL SECURITY;

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices FORCE ROW LEVEL SECURITY;

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_openings FORCE ROW LEVEL SECURITY;

ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants FORCE ROW LEVEL SECURITY;

ALTER TABLE public.interview_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_scorecards FORCE ROW LEVEL SECURITY;

ALTER TABLE public.employee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_records FORCE ROW LEVEL SECURITY;

ALTER TABLE public.employee_service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_service_records FORCE ROW LEVEL SECURITY;

ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records FORCE ROW LEVEL SECURITY;

-- 3. Tenant Isolation Policies (Direct tenant_id column)
DROP POLICY IF EXISTS self_tenant_readable ON public.tenants;
CREATE POLICY self_tenant_readable ON public.tenants
    FOR SELECT
    USING (id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_branches ON public.branches;
CREATE POLICY tenant_isolation_on_branches ON public.branches
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_user_profiles ON public.user_profiles;
CREATE POLICY tenant_isolation_on_user_profiles ON public.user_profiles
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_batches ON public.batches;
CREATE POLICY tenant_isolation_on_batches ON public.batches
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_students ON public.students;
CREATE POLICY tenant_isolation_on_students ON public.students
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_teachers ON public.teachers;
CREATE POLICY tenant_isolation_on_teachers ON public.teachers
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_subjects ON public.subjects;
CREATE POLICY tenant_isolation_on_subjects ON public.subjects
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_timetables ON public.timetables;
CREATE POLICY tenant_isolation_on_timetables ON public.timetables
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_attendances ON public.attendances;
CREATE POLICY tenant_isolation_on_attendances ON public.attendances
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_lms_courses ON public.lms_courses;
CREATE POLICY tenant_isolation_on_lms_courses ON public.lms_courses
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_assignments ON public.assignments;
CREATE POLICY tenant_isolation_on_assignments ON public.assignments
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_exams ON public.exams;
CREATE POLICY tenant_isolation_on_exams ON public.exams
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_notices ON public.notices;
CREATE POLICY tenant_isolation_on_notices ON public.notices
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_leave_requests ON public.leave_requests;
CREATE POLICY tenant_isolation_on_leave_requests ON public.leave_requests
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_job_openings ON public.job_openings;
CREATE POLICY tenant_isolation_on_job_openings ON public.job_openings
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- Public read access for published job openings on careers portal
DROP POLICY IF EXISTS public_read_published_job_openings ON public.job_openings;
CREATE POLICY public_read_published_job_openings ON public.job_openings
    FOR SELECT
    USING (status = 'published');

DROP POLICY IF EXISTS tenant_isolation_on_applicants ON public.applicants;
CREATE POLICY tenant_isolation_on_applicants ON public.applicants
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- Public application submission on careers portal
DROP POLICY IF EXISTS public_submit_applicant ON public.applicants;
CREATE POLICY public_submit_applicant ON public.applicants
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS tenant_isolation_on_employee_records ON public.employee_records;
CREATE POLICY tenant_isolation_on_employee_records ON public.employee_records
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- 4. Parent-Join Tenant Isolation Policies (No direct tenant_id)
DROP POLICY IF EXISTS tenant_isolation_on_lms_lessons ON public.lms_lessons;
CREATE POLICY tenant_isolation_on_lms_lessons ON public.lms_lessons
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.lms_courses c
            WHERE c.id = lms_lessons.course_id
              AND c.tenant_id = public.current_tenant_id()
        )
    );

DROP POLICY IF EXISTS tenant_isolation_on_assignment_submissions ON public.assignment_submissions;
CREATE POLICY tenant_isolation_on_assignment_submissions ON public.assignment_submissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = assignment_submissions.assignment_id
              AND a.tenant_id = public.current_tenant_id()
        )
    );

DROP POLICY IF EXISTS tenant_isolation_on_exam_results ON public.exam_results;
CREATE POLICY tenant_isolation_on_exam_results ON public.exam_results
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.exams e
            WHERE e.id = exam_results.exam_id
              AND e.tenant_id = public.current_tenant_id()
        )
    );

DROP POLICY IF EXISTS tenant_isolation_on_interview_scorecards ON public.interview_scorecards;
CREATE POLICY tenant_isolation_on_interview_scorecards ON public.interview_scorecards
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.applicants ap
            WHERE ap.id = interview_scorecards.applicant_id
              AND ap.tenant_id = public.current_tenant_id()
        )
    );

DROP POLICY IF EXISTS tenant_isolation_on_employee_service_records ON public.employee_service_records;
CREATE POLICY tenant_isolation_on_employee_service_records ON public.employee_service_records
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.employee_records er
            WHERE er.id = employee_service_records.employee_id
              AND er.tenant_id = public.current_tenant_id()
        )
    );

DROP POLICY IF EXISTS tenant_isolation_on_training_records ON public.training_records;
CREATE POLICY tenant_isolation_on_training_records ON public.training_records
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.employee_records er
            WHERE er.id = training_records.employee_id
              AND er.tenant_id = public.current_tenant_id()
        )
    );
