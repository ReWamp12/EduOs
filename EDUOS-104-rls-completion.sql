-- EDUOS-104 — RLS Completion
-- Closes the 17-table gap called out in the EDUOS-102 test plan.
--
-- Run AFTER schema.sql and EDUOS-102-auth.sql. Independent of EDUOS-103 —
-- this closes the direct-Supabase-client leak regardless of whether the
-- backend still bypasses RLS. Full protection still needs EDUOS-103, since
-- the NestJS backend connecting as `postgres` bypasses RLS entirely no
-- matter what policies exist here.
--
-- Two categories, handled differently:
--   A) Tables with RLS already enabled but no policy (9) — just add policies.
--   B) Tables with RLS never enabled (8) — enable it, then add policies.
-- Both reuse public.current_tenant_id() from EDUOS-102-auth.sql rather than
-- repeating the recursive-subquery pattern from schema.sql's original 6
-- policies, so tenant scoping stays defined in one place.

-- ---------------------------------------------------------------------------
-- A) RLS enabled, no policy yet — direct tenant_id column
-- ---------------------------------------------------------------------------

CREATE POLICY tenant_isolation_on_teachers ON public.teachers
    USING (tenant_id = public.current_tenant_id());

CREATE POLICY tenant_isolation_on_exams ON public.exams
    USING (tenant_id = public.current_tenant_id());

CREATE POLICY tenant_isolation_on_notices ON public.notices
    USING (tenant_id = public.current_tenant_id());

CREATE POLICY tenant_isolation_on_leave_requests ON public.leave_requests
    USING (tenant_id = public.current_tenant_id());

CREATE POLICY tenant_isolation_on_applicants ON public.applicants
    USING (tenant_id = public.current_tenant_id());

-- ---------------------------------------------------------------------------
-- A) RLS enabled, no policy yet — no direct tenant_id, join to parent
-- ---------------------------------------------------------------------------

CREATE POLICY tenant_isolation_on_exam_results ON public.exam_results
    USING (
        EXISTS (
            SELECT 1 FROM public.exams e
            WHERE e.id = exam_results.exam_id
              AND e.tenant_id = public.current_tenant_id()
        )
    );

CREATE POLICY tenant_isolation_on_employee_service_records ON public.employee_service_records
    USING (
        EXISTS (
            SELECT 1 FROM public.employee_records er
            WHERE er.id = employee_service_records.employee_id
              AND er.tenant_id = public.current_tenant_id()
        )
    );

CREATE POLICY tenant_isolation_on_training_records ON public.training_records
    USING (
        EXISTS (
            SELECT 1 FROM public.employee_records er
            WHERE er.id = training_records.employee_id
              AND er.tenant_id = public.current_tenant_id()
        )
    );

-- ---------------------------------------------------------------------------
-- A) tenants itself — special case, no tenant_id column (id IS the tenant)
-- ---------------------------------------------------------------------------
-- Read-only self-scope for now: a signed-in user can see their own tenant
-- row, nothing else. No INSERT/UPDATE policy is added here deliberately —
-- tenant creation/editing stays a backend/service-role operation until the
-- super_admin cross-tenant question (flagged separately) is resolved. Don't
-- add a permissive write policy here without deciding that first.
CREATE POLICY self_tenant_readable ON public.tenants
    FOR SELECT
    USING (id = public.current_tenant_id());

-- ---------------------------------------------------------------------------
-- B) RLS never enabled — direct tenant_id column
-- ---------------------------------------------------------------------------

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_on_branches ON public.branches
    USING (tenant_id = public.current_tenant_id());

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_on_subjects ON public.subjects
    USING (tenant_id = public.current_tenant_id());

ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_on_timetables ON public.timetables
    USING (tenant_id = public.current_tenant_id());

ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_on_lms_courses ON public.lms_courses
    USING (tenant_id = public.current_tenant_id());

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_on_assignments ON public.assignments
    USING (tenant_id = public.current_tenant_id());

-- ---------------------------------------------------------------------------
-- B) RLS never enabled — no direct tenant_id, join to parent
-- ---------------------------------------------------------------------------

ALTER TABLE public.lms_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_on_lms_lessons ON public.lms_lessons
    USING (
        EXISTS (
            SELECT 1 FROM public.lms_courses c
            WHERE c.id = lms_lessons.course_id
              AND c.tenant_id = public.current_tenant_id()
        )
    );

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_on_assignment_submissions ON public.assignment_submissions
    USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = assignment_submissions.assignment_id
              AND a.tenant_id = public.current_tenant_id()
        )
    );

ALTER TABLE public.interview_scorecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_on_interview_scorecards ON public.interview_scorecards
    USING (
        EXISTS (
            SELECT 1 FROM public.applicants ap
            WHERE ap.id = interview_scorecards.applicant_id
              AND ap.tenant_id = public.current_tenant_id()
        )
    );

-- ---------------------------------------------------------------------------
-- Known follow-up, NOT fixed here — flagging so it isn't lost
-- ---------------------------------------------------------------------------
-- job_openings already has a tenant_isolation policy from schema.sql. That's
-- correct for admin/HR views but wrong for the public /careers page: once
-- EDUOS-103 stops the backend from bypassing RLS, an anonymous visitor has
-- no current_tenant_id() and the careers board will silently return nothing.
-- This needs an additional permissive policy, e.g.:
--
--   CREATE POLICY public_read_published_job_openings ON public.job_openings
--       FOR SELECT
--       USING (status = 'published');
--
-- Deliberately not added in this migration — confirm with whoever owns the
-- careers page whether "published" should really be visible tenant-wide to
-- anonymous users (it should be, that's the point of a careers board), and
-- whether that changes once custom-domain white-labeling matters (a visitor
-- on tenant A's careers page probably shouldn't see tenant B's postings even
-- though both are "published" — that needs the policy to also check some
-- notion of "which tenant's site is this request for," which today's
-- request context doesn't carry). Small in SQL, needs a real decision.
