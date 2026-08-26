-- ============================================================================
-- EDUOS-108 : Role-scoped RLS + the shared permission helper layer
-- ----------------------------------------------------------------------------
-- EDUOS-104 enabled RLS on every tenant table but gave each one a single
--     FOR ALL USING (tenant_id = current_tenant_id())
-- policy. Tenant isolation is only half the job: within a tenant that grants
-- every authenticated user full CRUD on every row. Verified against the live
-- database before this migration, a signed-in student could:
--
--   * UPDATE user_profiles SET role='super_admin' on their own row
--   * UPDATE exam_results SET marks_obtained=99 on their own results
--   * UPDATE attendances SET status='present' over their own absences
--   * SELECT every employee_records row (pay grade, police verification)
--
-- This migration replaces the blanket FOR ALL policies with per-command
-- policies expressed through named helper functions, so authorisation lives in
-- one place instead of being restated inline in 30-odd policy bodies.
--
-- Two of these helpers -- teacher_teaches_batch() and teacher_is_class_mentor()
-- -- are the functions EDUOS-108's brief expected to already exist. They did
-- not: the equivalent logic was inlined inside mark_attendance() and nowhere
-- else. They are extracted here so policies and RPCs share one definition.
--
-- The finance tables (fee_invoices, journal_entries, chart_of_accounts) already
-- carry correct role scoping from EDUOS-129/130 and are deliberately untouched;
-- this migration follows the same shape they established.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Identity & role helpers
-- ---------------------------------------------------------------------------

/** The caller's role from their active profile, or NULL when signed out. */
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT role FROM public.user_profiles
     WHERE auth_user_id = auth.uid() AND status = 'active'
     LIMIT 1;
$$;

/** True when the caller holds any of the supplied roles. */
CREATE OR REPLACE FUNCTION public.has_role(VARIADIC p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.current_user_role() = ANY (p_roles);
$$;

/** Leadership: may administer any record in the tenant. */
CREATE OR REPLACE FUNCTION public.is_admin_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.has_role('principal', 'super_admin');
$$;

/** Any employed role. Distinct from is_staff_viewer() (EDUOS-127), which is
    scoped to submission-document access and is left as-is. */
CREATE OR REPLACE FUNCTION public.is_school_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.has_role('teacher', 'principal', 'super_admin',
                           'hr_manager', 'finance_officer', 'accountant');
$$;

/** Staff permitted to operate the HR / statutory registers. */
CREATE OR REPLACE FUNCTION public.is_hr_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.has_role('hr_manager', 'principal', 'super_admin');
$$;

/** The students row belonging to the caller, when the caller is a student. */
CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT s.id FROM public.students s
     WHERE s.user_id = public.current_profile_id()
     LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- 2. Teaching-relationship helpers
--    (the two the brief assumed existed, plus the read predicate built on them)
-- ---------------------------------------------------------------------------

/** True when the caller is the named class mentor of the batch. */
CREATE OR REPLACE FUNCTION public.teacher_is_class_mentor(p_batch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.batches b
         WHERE b.id = p_batch_id
           AND b.mentor_teacher_id = public.current_profile_id()
    );
$$;

/** True when the caller mentors the batch or holds any timetable slot for it. */
CREATE OR REPLACE FUNCTION public.teacher_teaches_batch(p_batch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.teacher_is_class_mentor(p_batch_id)
        OR EXISTS (
            SELECT 1 FROM public.timetables t
             WHERE t.batch_id = p_batch_id
               AND t.teacher_id = public.current_profile_id()
        );
$$;

/** True when the caller is a guardian of the student (email linkage, EDUOS-129). */
CREATE OR REPLACE FUNCTION public.is_guardian_of(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.students s
         WHERE s.id = p_student_id
           AND lower(s.parent_email) = public.current_profile_email()
    );
$$;

/**
 * The canonical "may this caller see this student's record" predicate.
 * Leadership and HR see the whole school; a teacher sees the batches they
 * actually teach; students see themselves; guardians see their children.
 */
CREATE OR REPLACE FUNCTION public.can_view_student(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.is_admin_staff()
        OR public.has_role('hr_manager', 'finance_officer', 'accountant')
        OR p_student_id = public.current_student_id()
        OR public.is_guardian_of(p_student_id)
        OR EXISTS (
            SELECT 1 FROM public.students s
             WHERE s.id = p_student_id
               AND public.teacher_teaches_batch(s.batch_id)
        );
$$;

/** May this caller enter or amend academic records for this student? */
CREATE OR REPLACE FUNCTION public.can_edit_student_academics(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.is_admin_staff()
        OR EXISTS (
            SELECT 1 FROM public.students s
             WHERE s.id = p_student_id
               AND public.teacher_teaches_batch(s.batch_id)
        );
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role()                TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT[])                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_staff()                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_school_staff()                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_hr_staff()                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_student_id()               TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_is_class_mentor(UUID)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_teaches_batch(UUID)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_guardian_of(UUID)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_student(UUID)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_student_academics(UUID)   TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. user_profiles — the privilege-escalation surface
--    RLS cannot restrict individual columns, so the role/status/tenant fields
--    are protected by a trigger while the policies handle row visibility.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_user_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF public.is_admin_staff() THEN
        RETURN NEW;
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Only a principal or super admin may change a user role.'
            USING ERRCODE = '42501';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Only a principal or super admin may change account status.'
            USING ERRCODE = '42501';
    END IF;
    IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
       OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
        RAISE EXCEPTION 'Tenant and auth linkage are not user-editable.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_user_profile_privileges ON public.user_profiles;
CREATE TRIGGER guard_user_profile_privileges
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.guard_user_profile_privileges();

DROP POLICY IF EXISTS tenant_isolation_on_user_profiles ON public.user_profiles;
DROP POLICY IF EXISTS own_profile_readable              ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_read                ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_self_update         ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_admin_write         ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_admin_delete        ON public.user_profiles;

-- Directory reads stay tenant-wide: names and avatars are joined into
-- timetables, notices and gradebooks throughout the product.
CREATE POLICY user_profiles_read ON public.user_profiles
    FOR SELECT USING (tenant_id = public.current_tenant_id());

CREATE POLICY user_profiles_self_update ON public.user_profiles
    FOR UPDATE
    USING (tenant_id = public.current_tenant_id()
           AND (auth_user_id = auth.uid() OR public.is_admin_staff()))
    WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY user_profiles_admin_write ON public.user_profiles
    FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_admin_staff());

CREATE POLICY user_profiles_admin_delete ON public.user_profiles
    FOR DELETE USING (tenant_id = public.current_tenant_id() AND public.is_admin_staff());

-- ---------------------------------------------------------------------------
-- 4. students — roster is administered by leadership, read by the people
--    with a legitimate relationship to the child.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_isolation_on_students ON public.students;
DROP POLICY IF EXISTS students_read                ON public.students;
DROP POLICY IF EXISTS students_admin_write         ON public.students;

CREATE POLICY students_read ON public.students
    FOR SELECT USING (tenant_id = public.current_tenant_id() AND public.can_view_student(id));

CREATE POLICY students_admin_write ON public.students
    FOR ALL
    USING      (tenant_id = public.current_tenant_id() AND public.is_admin_staff())
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_admin_staff());

-- ---------------------------------------------------------------------------
-- 5. attendances — the statutory register. Only the teaching staff who hold
--    the batch may write it; nobody may amend their own attendance.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_isolation_on_attendances ON public.attendances;
DROP POLICY IF EXISTS attendances_read                ON public.attendances;
DROP POLICY IF EXISTS attendances_teacher_write       ON public.attendances;
DROP POLICY IF EXISTS attendances_admin_delete        ON public.attendances;

CREATE POLICY attendances_read ON public.attendances
    FOR SELECT USING (tenant_id = public.current_tenant_id() AND public.can_view_student(student_id));

CREATE POLICY attendances_teacher_write ON public.attendances
    FOR INSERT
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.can_edit_student_academics(student_id));

CREATE POLICY attendances_teacher_update ON public.attendances
    FOR UPDATE
    USING      (tenant_id = public.current_tenant_id() AND public.can_edit_student_academics(student_id))
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.can_edit_student_academics(student_id));

CREATE POLICY attendances_admin_delete ON public.attendances
    FOR DELETE USING (tenant_id = public.current_tenant_id() AND public.is_admin_staff());

-- ---------------------------------------------------------------------------
-- 6. exams & exam_results — marks are entered by the teaching staff.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_isolation_on_exams ON public.exams;
DROP POLICY IF EXISTS exams_read                ON public.exams;
DROP POLICY IF EXISTS exams_staff_write         ON public.exams;

CREATE POLICY exams_read ON public.exams
    FOR SELECT USING (tenant_id = public.current_tenant_id());

CREATE POLICY exams_staff_write ON public.exams
    FOR ALL
    USING      (tenant_id = public.current_tenant_id()
                AND (public.is_admin_staff() OR public.teacher_teaches_batch(batch_id)))
    WITH CHECK (tenant_id = public.current_tenant_id()
                AND (public.is_admin_staff() OR public.teacher_teaches_batch(batch_id)));

DROP POLICY IF EXISTS tenant_isolation_on_exam_results ON public.exam_results;
DROP POLICY IF EXISTS exam_results_read                ON public.exam_results;
DROP POLICY IF EXISTS exam_results_staff_write         ON public.exam_results;

CREATE POLICY exam_results_read ON public.exam_results
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.exams e
                    WHERE e.id = exam_results.exam_id
                      AND e.tenant_id = public.current_tenant_id())
           AND public.can_view_student(student_id));

CREATE POLICY exam_results_staff_write ON public.exam_results
    FOR ALL
    USING      (public.can_edit_student_academics(student_id))
    WITH CHECK (public.can_edit_student_academics(student_id));

-- ---------------------------------------------------------------------------
-- 7. assignments & submissions
--    A student may create and revise their own submission but may not award
--    themselves marks; that column split is enforced by trigger.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_isolation_on_assignments ON public.assignments;
DROP POLICY IF EXISTS assignments_read                ON public.assignments;
DROP POLICY IF EXISTS assignments_teacher_write       ON public.assignments;

CREATE POLICY assignments_read ON public.assignments
    FOR SELECT USING (tenant_id = public.current_tenant_id());

CREATE POLICY assignments_teacher_write ON public.assignments
    FOR ALL
    USING      (tenant_id = public.current_tenant_id()
                AND (public.is_admin_staff() OR public.teacher_teaches_batch(batch_id)))
    WITH CHECK (tenant_id = public.current_tenant_id()
                AND (public.is_admin_staff() OR public.teacher_teaches_batch(batch_id)));

CREATE OR REPLACE FUNCTION public.guard_submission_grading()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF public.can_edit_student_academics(NEW.student_id) THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.marks_obtained IS NOT NULL OR NEW.feedback IS NOT NULL
           OR COALESCE(NEW.status, '') = 'graded' THEN
            RAISE EXCEPTION 'A submission cannot be created pre-graded.'
                USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.marks_obtained IS DISTINCT FROM OLD.marks_obtained
       OR NEW.feedback IS DISTINCT FROM OLD.feedback
       OR NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Only the teaching staff for this batch may grade a submission.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_submission_grading ON public.assignment_submissions;
CREATE TRIGGER guard_submission_grading
    BEFORE INSERT OR UPDATE ON public.assignment_submissions
    FOR EACH ROW EXECUTE FUNCTION public.guard_submission_grading();

DROP POLICY IF EXISTS tenant_isolation_on_assignment_submissions ON public.assignment_submissions;
DROP POLICY IF EXISTS submissions_read       ON public.assignment_submissions;
DROP POLICY IF EXISTS submissions_write      ON public.assignment_submissions;
DROP POLICY IF EXISTS submissions_delete     ON public.assignment_submissions;

CREATE POLICY submissions_read ON public.assignment_submissions
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.assignments a
                    WHERE a.id = assignment_submissions.assignment_id
                      AND a.tenant_id = public.current_tenant_id())
           AND public.can_view_student(student_id));

CREATE POLICY submissions_write ON public.assignment_submissions
    FOR INSERT
    WITH CHECK (student_id = public.current_student_id()
                OR public.can_edit_student_academics(student_id));

CREATE POLICY submissions_update ON public.assignment_submissions
    FOR UPDATE
    USING      (student_id = public.current_student_id() OR public.can_edit_student_academics(student_id))
    WITH CHECK (student_id = public.current_student_id() OR public.can_edit_student_academics(student_id));

CREATE POLICY submissions_delete ON public.assignment_submissions
    FOR DELETE USING (public.can_edit_student_academics(student_id));

-- ---------------------------------------------------------------------------
-- 8. leave_requests — staff apply for themselves, leadership decides.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_isolation_on_leave_requests ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_read                ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_self_apply          ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_admin_decide        ON public.leave_requests;

CREATE POLICY leave_requests_read ON public.leave_requests
    FOR SELECT
    USING (tenant_id = public.current_tenant_id()
           AND (public.is_admin_staff() OR public.is_hr_staff()
                OR employee_id = public.current_profile_id()));

CREATE POLICY leave_requests_self_apply ON public.leave_requests
    FOR INSERT
    WITH CHECK (tenant_id = public.current_tenant_id()
                AND public.is_school_staff()
                AND employee_id = public.current_profile_id());

CREATE POLICY leave_requests_admin_decide ON public.leave_requests
    FOR UPDATE
    USING      (tenant_id = public.current_tenant_id() AND public.is_admin_staff())
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_admin_staff());

CREATE POLICY leave_requests_admin_delete ON public.leave_requests
    FOR DELETE USING (tenant_id = public.current_tenant_id() AND public.is_admin_staff());

-- ---------------------------------------------------------------------------
-- 9. notices — everyone reads their tenant's board; staff broadcast.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_isolation_on_notices ON public.notices;
DROP POLICY IF EXISTS notices_read                ON public.notices;
DROP POLICY IF EXISTS notices_staff_write         ON public.notices;

CREATE POLICY notices_read ON public.notices
    FOR SELECT USING (tenant_id = public.current_tenant_id());

CREATE POLICY notices_staff_write ON public.notices
    FOR ALL
    USING      (tenant_id = public.current_tenant_id()
                AND public.has_role('teacher', 'principal', 'super_admin', 'hr_manager'))
    WITH CHECK (tenant_id = public.current_tenant_id()
                AND public.has_role('teacher', 'principal', 'super_admin', 'hr_manager'));

-- ---------------------------------------------------------------------------
-- 10. Academic reference data — readable tenant-wide, administered by leadership.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_isolation_on_batches   ON public.batches;
DROP POLICY IF EXISTS batches_read                  ON public.batches;
DROP POLICY IF EXISTS batches_admin_write           ON public.batches;
CREATE POLICY batches_read ON public.batches
    FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY batches_admin_write ON public.batches
    FOR ALL
    USING      (tenant_id = public.current_tenant_id() AND public.is_admin_staff())
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_admin_staff());

DROP POLICY IF EXISTS tenant_isolation_on_subjects ON public.subjects;
DROP POLICY IF EXISTS subjects_read                ON public.subjects;
DROP POLICY IF EXISTS subjects_admin_write         ON public.subjects;
CREATE POLICY subjects_read ON public.subjects
    FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY subjects_admin_write ON public.subjects
    FOR ALL
    USING      (tenant_id = public.current_tenant_id() AND public.is_admin_staff())
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_admin_staff());

DROP POLICY IF EXISTS tenant_isolation_on_teachers ON public.teachers;
DROP POLICY IF EXISTS teachers_read                ON public.teachers;
DROP POLICY IF EXISTS teachers_admin_write         ON public.teachers;
CREATE POLICY teachers_read ON public.teachers
    FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY teachers_admin_write ON public.teachers
    FOR ALL
    USING      (tenant_id = public.current_tenant_id() AND (public.is_admin_staff() OR public.is_hr_staff()))
    WITH CHECK (tenant_id = public.current_tenant_id() AND (public.is_admin_staff() OR public.is_hr_staff()));

DROP POLICY IF EXISTS tenant_isolation_on_timetables ON public.timetables;
DROP POLICY IF EXISTS timetables_read                ON public.timetables;
DROP POLICY IF EXISTS timetables_admin_write         ON public.timetables;
CREATE POLICY timetables_read ON public.timetables
    FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY timetables_admin_write ON public.timetables
    FOR ALL
    USING      (tenant_id = public.current_tenant_id() AND public.is_admin_staff())
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_admin_staff());

DROP POLICY IF EXISTS tenant_isolation_on_lms_courses ON public.lms_courses;
DROP POLICY IF EXISTS lms_courses_read                ON public.lms_courses;
DROP POLICY IF EXISTS lms_courses_staff_write         ON public.lms_courses;
CREATE POLICY lms_courses_read ON public.lms_courses
    FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY lms_courses_staff_write ON public.lms_courses
    FOR ALL
    USING      (tenant_id = public.current_tenant_id() AND public.has_role('teacher','principal','super_admin'))
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_role('teacher','principal','super_admin'));

DROP POLICY IF EXISTS tenant_isolation_on_lms_lessons ON public.lms_lessons;
DROP POLICY IF EXISTS lms_lessons_read                ON public.lms_lessons;
DROP POLICY IF EXISTS lms_lessons_staff_write         ON public.lms_lessons;
CREATE POLICY lms_lessons_read ON public.lms_lessons
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.lms_courses c
                    WHERE c.id = lms_lessons.course_id AND c.tenant_id = public.current_tenant_id()));
CREATE POLICY lms_lessons_staff_write ON public.lms_lessons
    FOR ALL
    USING      (public.has_role('teacher','principal','super_admin'))
    WITH CHECK (public.has_role('teacher','principal','super_admin'));

DROP POLICY IF EXISTS tenant_isolation_on_attendance_config ON public.tenant_attendance_config;
DROP POLICY IF EXISTS attendance_config_read                ON public.tenant_attendance_config;
DROP POLICY IF EXISTS attendance_config_admin_write         ON public.tenant_attendance_config;
CREATE POLICY attendance_config_read ON public.tenant_attendance_config
    FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY attendance_config_admin_write ON public.tenant_attendance_config
    FOR ALL
    USING      (tenant_id = public.current_tenant_id() AND public.is_admin_staff())
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_admin_staff());

-- ---------------------------------------------------------------------------
-- 11. Attendance audit trail — staff-readable, written only by mark_attendance().
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_isolation_on_change_log ON public.attendance_change_log;
DROP POLICY IF EXISTS attendance_change_log_read     ON public.attendance_change_log;
CREATE POLICY attendance_change_log_read ON public.attendance_change_log
    FOR SELECT
    USING (public.is_school_staff()
           AND attendance_id IN (SELECT a.id FROM public.attendances a
                                  WHERE a.tenant_id = public.current_tenant_id()));

DROP POLICY IF EXISTS tenant_isolation_on_notifications ON public.attendance_notifications;
DROP POLICY IF EXISTS attendance_notifications_read     ON public.attendance_notifications;
CREATE POLICY attendance_notifications_read ON public.attendance_notifications
    FOR SELECT
    USING (attendance_id IN (SELECT a.id FROM public.attendances a
                              WHERE a.tenant_id = public.current_tenant_id()
                                AND public.can_view_student(a.student_id)));

-- ---------------------------------------------------------------------------
-- 12. HR & statutory registers — HR staff only. These carry pay scales,
--     police-verification status and disciplinary entries; EDUOS-104/107 left
--     them readable by every student in the tenant.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_isolation_on_employee_records ON public.employee_records;
DROP POLICY IF EXISTS employee_records_hr_only             ON public.employee_records;
CREATE POLICY employee_records_hr_only ON public.employee_records
    FOR ALL
    USING      (tenant_id = public.current_tenant_id() AND public.is_hr_staff())
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_hr_staff());

DROP POLICY IF EXISTS tenant_isolation_on_employee_service_records ON public.employee_service_records;
DROP POLICY IF EXISTS employee_service_records_hr_only             ON public.employee_service_records;
CREATE POLICY employee_service_records_hr_only ON public.employee_service_records
    FOR ALL
    USING      (public.is_hr_staff() AND EXISTS (SELECT 1 FROM public.employee_records er
                    WHERE er.id = employee_service_records.employee_id
                      AND er.tenant_id = public.current_tenant_id()))
    WITH CHECK (public.is_hr_staff() AND EXISTS (SELECT 1 FROM public.employee_records er
                    WHERE er.id = employee_service_records.employee_id
                      AND er.tenant_id = public.current_tenant_id()));

DROP POLICY IF EXISTS tenant_isolation_on_training_records ON public.training_records;
DROP POLICY IF EXISTS training_records_hr_only             ON public.training_records;
CREATE POLICY training_records_hr_only ON public.training_records
    FOR ALL
    USING      (public.is_hr_staff() AND EXISTS (SELECT 1 FROM public.employee_records er
                    WHERE er.id = training_records.employee_id
                      AND er.tenant_id = public.current_tenant_id()))
    WITH CHECK (public.is_hr_staff() AND EXISTS (SELECT 1 FROM public.employee_records er
                    WHERE er.id = training_records.employee_id
                      AND er.tenant_id = public.current_tenant_id()));

-- ---------------------------------------------------------------------------
-- 13. Recruitment — HR staff administer; the public careers board keeps its
--     anonymous read of published postings and anonymous application insert.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_isolation_on_job_openings      ON public.job_openings;
DROP POLICY IF EXISTS public_read_published_job_openings    ON public.job_openings;
DROP POLICY IF EXISTS job_openings_hr_write                 ON public.job_openings;
DROP POLICY IF EXISTS job_openings_public_read              ON public.job_openings;

CREATE POLICY job_openings_public_read ON public.job_openings
    FOR SELECT USING (status = 'published' OR (tenant_id = public.current_tenant_id() AND public.is_hr_staff()));

CREATE POLICY job_openings_hr_write ON public.job_openings
    FOR ALL
    USING      (tenant_id = public.current_tenant_id() AND public.is_hr_staff())
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_hr_staff());

DROP POLICY IF EXISTS tenant_isolation_on_applicants ON public.applicants;
DROP POLICY IF EXISTS public_submit_applicant        ON public.applicants;
DROP POLICY IF EXISTS applicants_hr_manage           ON public.applicants;
DROP POLICY IF EXISTS applicants_public_apply        ON public.applicants;

-- Anonymous candidates may apply; only HR may read or progress the pipeline.
CREATE POLICY applicants_public_apply ON public.applicants
    FOR INSERT WITH CHECK (true);

CREATE POLICY applicants_hr_read ON public.applicants
    FOR SELECT USING (tenant_id = public.current_tenant_id() AND public.is_hr_staff());

CREATE POLICY applicants_hr_update ON public.applicants
    FOR UPDATE
    USING      (tenant_id = public.current_tenant_id() AND public.is_hr_staff())
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_hr_staff());

CREATE POLICY applicants_hr_delete ON public.applicants
    FOR DELETE USING (tenant_id = public.current_tenant_id() AND public.is_hr_staff());

DROP POLICY IF EXISTS tenant_isolation_on_interview_scorecards ON public.interview_scorecards;
DROP POLICY IF EXISTS interview_scorecards_hr_only             ON public.interview_scorecards;
CREATE POLICY interview_scorecards_hr_only ON public.interview_scorecards
    FOR ALL
    USING      (public.is_hr_staff() AND EXISTS (SELECT 1 FROM public.applicants ap
                    WHERE ap.id = interview_scorecards.applicant_id
                      AND ap.tenant_id = public.current_tenant_id()))
    WITH CHECK (public.is_hr_staff() AND EXISTS (SELECT 1 FROM public.applicants ap
                    WHERE ap.id = interview_scorecards.applicant_id
                      AND ap.tenant_id = public.current_tenant_id()));

-- ---------------------------------------------------------------------------
-- 14. Finance reference & payroll — align with the EDUOS-129/130 pattern that
--     already guards fee_invoices, journal_entries and chart_of_accounts.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS fee_structures_isolation ON public.fee_structures;
DROP POLICY IF EXISTS fee_structures_scoped    ON public.fee_structures;
CREATE POLICY fee_structures_scoped ON public.fee_structures
    FOR ALL
    USING      (tenant_id = public.current_tenant_id()
                AND (public.is_finance_staff() OR public.has_role('accountant','finance_officer','parent','student')))
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_finance_staff());

DROP POLICY IF EXISTS fee_concessions_isolation ON public.fee_concessions;
DROP POLICY IF EXISTS fee_concessions_scoped    ON public.fee_concessions;
CREATE POLICY fee_concessions_scoped ON public.fee_concessions
    FOR ALL
    USING      (tenant_id = public.current_tenant_id()
                AND (public.is_finance_staff() OR public.has_role('accountant','finance_officer')))
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_finance_staff());

DROP POLICY IF EXISTS payroll_runs_isolation ON public.payroll_runs;
DROP POLICY IF EXISTS payroll_runs_scoped    ON public.payroll_runs;
CREATE POLICY payroll_runs_scoped ON public.payroll_runs
    FOR ALL
    USING      (tenant_id = public.current_tenant_id()
                AND (public.is_finance_staff() OR public.has_role('finance_officer','accountant')))
    WITH CHECK (tenant_id = public.current_tenant_id()
                AND (public.is_finance_staff() OR public.has_role('finance_officer')));

DROP POLICY IF EXISTS payroll_items_isolation ON public.payroll_items;
DROP POLICY IF EXISTS payroll_items_scoped    ON public.payroll_items;
CREATE POLICY payroll_items_scoped ON public.payroll_items
    FOR ALL
    USING      (tenant_id = public.current_tenant_id()
                AND (public.is_finance_staff() OR public.has_role('finance_officer','accountant')))
    WITH CHECK (tenant_id = public.current_tenant_id()
                AND (public.is_finance_staff() OR public.has_role('finance_officer')));

-- ---------------------------------------------------------------------------
-- 15. Tenant & branch configuration — super admin writes, tenant reads.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_isolation_on_branches ON public.branches;
DROP POLICY IF EXISTS branches_read                ON public.branches;
DROP POLICY IF EXISTS branches_admin_write         ON public.branches;
CREATE POLICY branches_read ON public.branches
    FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY branches_admin_write ON public.branches
    FOR ALL
    USING      (tenant_id = public.current_tenant_id() AND public.is_admin_staff())
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_admin_staff());

DROP POLICY IF EXISTS self_tenant_readable ON public.tenants;
DROP POLICY IF EXISTS tenants_read         ON public.tenants;
DROP POLICY IF EXISTS tenants_admin_write  ON public.tenants;
CREATE POLICY tenants_read ON public.tenants
    FOR SELECT USING (id = public.current_tenant_id());
CREATE POLICY tenants_admin_write ON public.tenants
    FOR UPDATE
    USING      (id = public.current_tenant_id() AND public.has_role('super_admin','principal'))
    WITH CHECK (id = public.current_tenant_id() AND public.has_role('super_admin','principal'));
