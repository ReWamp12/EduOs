-- ============================================================================
-- EduOS · Role-scoped RLS for the new tables + tenants lockdown
-- Builds on the helpers already deployed: has_role, is_admin_staff,
-- is_school_staff, current_profile_id, current_student_id, is_guardian_of,
-- can_view_student, teacher_teaches_batch.
-- ============================================================================

-- ── 1. tenants: was `true` for anon + authenticated on INSERT/UPDATE/DELETE ──
DROP POLICY IF EXISTS tenants_insert_policy ON public.tenants;
DROP POLICY IF EXISTS tenants_update_policy ON public.tenants;
DROP POLICY IF EXISTS tenants_delete_policy ON public.tenants;

-- Reads stay open (the login page needs school branding before sign-in).
CREATE POLICY tenants_insert_super_admin ON public.tenants
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role('super_admin'));

CREATE POLICY tenants_update_scoped ON public.tenants
    FOR UPDATE TO authenticated
    USING (public.has_role('super_admin') OR (public.is_admin_staff() AND id = public.current_tenant_id()))
    WITH CHECK (public.has_role('super_admin') OR (public.is_admin_staff() AND id = public.current_tenant_id()));

CREATE POLICY tenants_delete_super_admin ON public.tenants
    FOR DELETE TO authenticated
    USING (public.has_role('super_admin'));

-- ── 2. Helpers ──────────────────────────────────────────────────────────────
-- Staff who run a student's class (admins, or a teacher timetabled for the batch).
CREATE OR REPLACE FUNCTION public.can_manage_student(p_student_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
    SELECT public.is_admin_staff() OR EXISTS (
        SELECT 1 FROM public.students s
         WHERE s.id = p_student_id AND public.teacher_teaches_batch(s.batch_id)
    );
$$;

-- Anyone who legitimately sees a class: admins, its teachers, its students, their guardians.
CREATE OR REPLACE FUNCTION public.can_view_batch(p_batch_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
    SELECT public.is_admin_staff()
        OR public.teacher_teaches_batch(p_batch_id)
        OR EXISTS (
            SELECT 1 FROM public.students s
             WHERE s.batch_id = p_batch_id
               AND (s.id = public.current_student_id() OR public.is_guardian_of(s.id))
        );
$$;

-- ── 3. daily_class_diaries ─────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_on_daily_class_diaries ON public.daily_class_diaries;
DROP POLICY IF EXISTS daily_class_diaries_read ON public.daily_class_diaries;
DROP POLICY IF EXISTS daily_class_diaries_teacher_write ON public.daily_class_diaries;

CREATE POLICY daily_class_diaries_read ON public.daily_class_diaries
    FOR SELECT TO authenticated
    USING (tenant_id = public.current_tenant_id() AND public.can_view_batch(batch_id));

CREATE POLICY daily_class_diaries_teacher_write ON public.daily_class_diaries
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id()
           AND (public.is_admin_staff() OR (public.teacher_teaches_batch(batch_id) AND teacher_id = public.current_profile_id())))
    WITH CHECK (tenant_id = public.current_tenant_id()
           AND (public.is_admin_staff() OR (public.teacher_teaches_batch(batch_id) AND teacher_id = public.current_profile_id())));

-- ── 4. Report card inputs ──────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_on_student_term_assessments ON public.student_term_assessments;
DROP POLICY IF EXISTS student_term_assessments_read ON public.student_term_assessments;
DROP POLICY IF EXISTS student_term_assessments_staff_write ON public.student_term_assessments;

CREATE POLICY student_term_assessments_read ON public.student_term_assessments
    FOR SELECT TO authenticated
    USING (tenant_id = public.current_tenant_id() AND public.can_view_student(student_id));

CREATE POLICY student_term_assessments_staff_write ON public.student_term_assessments
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id() AND public.can_manage_student(student_id))
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.can_manage_student(student_id));

DROP POLICY IF EXISTS tenant_isolation_on_student_coscholastic_grades ON public.student_coscholastic_grades;
DROP POLICY IF EXISTS student_coscholastic_grades_read ON public.student_coscholastic_grades;
DROP POLICY IF EXISTS student_coscholastic_grades_staff_write ON public.student_coscholastic_grades;

CREATE POLICY student_coscholastic_grades_read ON public.student_coscholastic_grades
    FOR SELECT TO authenticated
    USING (tenant_id = public.current_tenant_id() AND public.can_view_student(student_id));

CREATE POLICY student_coscholastic_grades_staff_write ON public.student_coscholastic_grades
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id() AND public.can_manage_student(student_id))
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.can_manage_student(student_id));

-- ── 5. remedial_plans ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_on_remedial_plans ON public.remedial_plans;
DROP POLICY IF EXISTS remedial_plans_read ON public.remedial_plans;
DROP POLICY IF EXISTS remedial_plans_teacher_write ON public.remedial_plans;

CREATE POLICY remedial_plans_read ON public.remedial_plans
    FOR SELECT TO authenticated
    USING (tenant_id = public.current_tenant_id() AND public.can_view_student(student_id));

CREATE POLICY remedial_plans_teacher_write ON public.remedial_plans
    FOR ALL TO authenticated
    USING (tenant_id = public.current_tenant_id() AND public.can_manage_student(student_id)
           AND (public.is_admin_staff() OR teacher_id = public.current_profile_id()))
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.can_manage_student(student_id)
           AND (public.is_admin_staff() OR teacher_id = public.current_profile_id()));

-- ── 6. parent_teacher_queries ──────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_on_parent_teacher_queries ON public.parent_teacher_queries;
DROP POLICY IF EXISTS parent_teacher_queries_read ON public.parent_teacher_queries;
DROP POLICY IF EXISTS parent_teacher_queries_parent_insert ON public.parent_teacher_queries;
DROP POLICY IF EXISTS parent_teacher_queries_teacher_reply ON public.parent_teacher_queries;
DROP POLICY IF EXISTS parent_teacher_queries_admin_delete ON public.parent_teacher_queries;

CREATE POLICY parent_teacher_queries_read ON public.parent_teacher_queries
    FOR SELECT TO authenticated
    USING (tenant_id = public.current_tenant_id()
           AND (parent_user_id = public.current_profile_id()
                OR teacher_id = public.current_profile_id()
                OR public.is_admin_staff()));

CREATE POLICY parent_teacher_queries_parent_insert ON public.parent_teacher_queries
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = public.current_tenant_id()
                AND parent_user_id = public.current_profile_id()
                AND public.is_guardian_of(student_id));

CREATE POLICY parent_teacher_queries_teacher_reply ON public.parent_teacher_queries
    FOR UPDATE TO authenticated
    USING (tenant_id = public.current_tenant_id() AND teacher_id = public.current_profile_id())
    WITH CHECK (tenant_id = public.current_tenant_id() AND teacher_id = public.current_profile_id());

CREATE POLICY parent_teacher_queries_admin_delete ON public.parent_teacher_queries
    FOR DELETE TO authenticated
    USING (tenant_id = public.current_tenant_id() AND public.is_admin_staff());

-- A teacher may only answer: the parent's message and routing are immutable.
CREATE OR REPLACE FUNCTION public.guard_query_update() RETURNS trigger
LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND (
           NEW.message IS DISTINCT FROM OLD.message
        OR NEW.category IS DISTINCT FROM OLD.category
        OR NEW.student_id IS DISTINCT FROM OLD.student_id
        OR NEW.parent_user_id IS DISTINCT FROM OLD.parent_user_id
        OR NEW.teacher_id IS DISTINCT FROM OLD.teacher_id
        OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
    ) THEN
        RAISE EXCEPTION 'Only the reply of a parent query can be changed';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_query_update ON public.parent_teacher_queries;
CREATE TRIGGER trg_guard_query_update
    BEFORE UPDATE ON public.parent_teacher_queries
    FOR EACH ROW EXECUTE FUNCTION public.guard_query_update();

-- ── 7. notice_reads ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_on_notice_reads ON public.notice_reads;
DROP POLICY IF EXISTS notice_reads_read ON public.notice_reads;
DROP POLICY IF EXISTS notice_reads_self_insert ON public.notice_reads;

CREATE POLICY notice_reads_read ON public.notice_reads
    FOR SELECT TO authenticated
    USING (tenant_id = public.current_tenant_id()
           AND (user_id = public.current_profile_id() OR public.is_school_staff()));

CREATE POLICY notice_reads_self_insert ON public.notice_reads
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = public.current_tenant_id() AND user_id = public.current_profile_id());
