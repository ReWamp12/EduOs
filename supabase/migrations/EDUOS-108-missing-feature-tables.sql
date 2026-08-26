-- ============================================================================
-- Migration: EDUOS-108-missing-feature-tables.sql
-- Description: Creates 6 missing feature tables (consent_forms, consent_responses,
--              ptm_bookings, support_tickets, parent_feedback, curriculum_topics)
--              with robust RLS policies reusing EDUOS-108 shared helpers,
--              and attaches tenant auto-fill triggers.
-- ============================================================================

-- 1. Attach tenant auto-fill trigger to existing HR tables
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['job_openings', 'applicants', 'employee_records'])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_tenant_id ON %I;', tbl);
        EXECUTE format('
            CREATE TRIGGER set_tenant_id
            BEFORE INSERT ON %I
            FOR EACH ROW
            EXECUTE FUNCTION public.set_tenant_id_from_session();
        ', tbl);
    END LOOP;
END $$;

-- 2. Create consent_forms
CREATE TABLE IF NOT EXISTS public.consent_forms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
    title text NOT NULL,
    description text,
    category text DEFAULT 'general',
    target_type text DEFAULT 'all',
    target_batch_id uuid REFERENCES public.batches(id) ON DELETE SET NULL,
    author_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    author_role text,
    event_date date,
    deadline date,
    instructions text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Create consent_responses
CREATE TABLE IF NOT EXISTS public.consent_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
    form_id uuid NOT NULL REFERENCES public.consent_forms(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    signed_by_name text,
    parent_relation text,
    signed_at timestamptz,
    decline_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT consent_responses_form_student_key UNIQUE(form_id, student_id)
);

-- 4. Create ptm_bookings
CREATE TABLE IF NOT EXISTS public.ptm_bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
    teacher_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject text,
    slot text NOT NULL,
    mode text DEFAULT 'in_person',
    status text NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled
    requested_by text DEFAULT 'guardian',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. Create support_tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
    raised_by uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    category text NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    status text NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
    reply text,
    resolved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. Create parent_feedback
CREATE TABLE IF NOT EXISTS public.parent_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
    submitted_by uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    category text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    rating integer,
    status text NOT NULL DEFAULT 'submitted', -- submitted, reviewed, addressed
    admin_response text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 7. Create curriculum_topics
CREATE TABLE IF NOT EXISTS public.curriculum_topics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
    batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    unit_name text NOT NULL,
    topic_name text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    completed_at timestamptz,
    sequence_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 8. Attach tenant auto-fill triggers to all 6 new tables
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'consent_forms', 'consent_responses', 'ptm_bookings',
        'support_tickets', 'parent_feedback', 'curriculum_topics'
    ])
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP TRIGGER IF EXISTS set_tenant_id ON public.%I;', tbl);
        EXECUTE format('
            CREATE TRIGGER set_tenant_id
            BEFORE INSERT ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.set_tenant_id_from_session();
        ', tbl);
    END LOOP;
END $$;

-- 9. RLS Policies: consent_forms
DROP POLICY IF EXISTS "consent_forms_select" ON public.consent_forms;
CREATE POLICY "consent_forms_select" ON public.consent_forms
    FOR SELECT USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "consent_forms_write" ON public.consent_forms;
CREATE POLICY "consent_forms_write" ON public.consent_forms
    FOR ALL USING (
        (tenant_id = public.current_tenant_id())
        AND (public.is_admin_staff() OR public.is_school_staff())
    )
    WITH CHECK (
        (tenant_id = public.current_tenant_id())
        AND (public.is_admin_staff() OR public.is_school_staff())
    );

-- 10. RLS Policies: consent_responses
DROP POLICY IF EXISTS "consent_responses_select" ON public.consent_responses;
CREATE POLICY "consent_responses_select" ON public.consent_responses
    FOR SELECT USING (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR public.is_school_staff()
            OR public.is_guardian_of(student_id)
            OR public.can_view_student(student_id)
        )
    );

DROP POLICY IF EXISTS "consent_responses_insert" ON public.consent_responses;
CREATE POLICY "consent_responses_insert" ON public.consent_responses
    FOR INSERT WITH CHECK (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR public.is_school_staff()
            OR public.is_guardian_of(student_id)
            OR public.current_student_id() = student_id
        )
    );

DROP POLICY IF EXISTS "consent_responses_update" ON public.consent_responses;
CREATE POLICY "consent_responses_update" ON public.consent_responses
    FOR UPDATE USING (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR public.is_school_staff()
            OR public.is_guardian_of(student_id)
            OR public.current_student_id() = student_id
        )
    )
    WITH CHECK (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR public.is_school_staff()
            OR public.is_guardian_of(student_id)
            OR public.current_student_id() = student_id
        )
    );

DROP POLICY IF EXISTS "consent_responses_delete" ON public.consent_responses;
CREATE POLICY "consent_responses_delete" ON public.consent_responses
    FOR DELETE USING (
        (tenant_id = public.current_tenant_id())
        AND public.is_admin_staff()
    );

-- 11. RLS Policies: ptm_bookings
DROP POLICY IF EXISTS "ptm_bookings_select" ON public.ptm_bookings;
CREATE POLICY "ptm_bookings_select" ON public.ptm_bookings
    FOR SELECT USING (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR public.is_school_staff()
            OR public.is_guardian_of(student_id)
            OR teacher_id = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "ptm_bookings_insert" ON public.ptm_bookings;
CREATE POLICY "ptm_bookings_insert" ON public.ptm_bookings
    FOR INSERT WITH CHECK (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR public.is_school_staff()
            OR public.is_guardian_of(student_id)
        )
    );

DROP POLICY IF EXISTS "ptm_bookings_update" ON public.ptm_bookings;
CREATE POLICY "ptm_bookings_update" ON public.ptm_bookings
    FOR UPDATE USING (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR public.is_school_staff()
            OR public.is_guardian_of(student_id)
            OR teacher_id = public.current_profile_id()
        )
    )
    WITH CHECK (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR public.is_school_staff()
            OR public.is_guardian_of(student_id)
            OR teacher_id = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "ptm_bookings_delete" ON public.ptm_bookings;
CREATE POLICY "ptm_bookings_delete" ON public.ptm_bookings
    FOR DELETE USING (
        (tenant_id = public.current_tenant_id())
        AND (public.is_admin_staff() OR public.is_guardian_of(student_id))
    );

-- 12. RLS Policies: support_tickets
DROP POLICY IF EXISTS "support_tickets_select" ON public.support_tickets;
CREATE POLICY "support_tickets_select" ON public.support_tickets
    FOR SELECT USING (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR public.is_school_staff()
            OR raised_by = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "support_tickets_insert" ON public.support_tickets;
CREATE POLICY "support_tickets_insert" ON public.support_tickets
    FOR INSERT WITH CHECK (
        (tenant_id = public.current_tenant_id())
        AND (raised_by = public.current_profile_id())
    );

DROP POLICY IF EXISTS "support_tickets_update" ON public.support_tickets;
CREATE POLICY "support_tickets_update" ON public.support_tickets
    FOR UPDATE USING (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR public.is_school_staff()
            OR raised_by = public.current_profile_id()
        )
    )
    WITH CHECK (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR public.is_school_staff()
            OR raised_by = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "support_tickets_delete" ON public.support_tickets;
CREATE POLICY "support_tickets_delete" ON public.support_tickets
    FOR DELETE USING (
        (tenant_id = public.current_tenant_id())
        AND public.is_admin_staff()
    );

-- 13. RLS Policies: parent_feedback
DROP POLICY IF EXISTS "parent_feedback_select" ON public.parent_feedback;
CREATE POLICY "parent_feedback_select" ON public.parent_feedback
    FOR SELECT USING (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR submitted_by = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "parent_feedback_insert" ON public.parent_feedback;
CREATE POLICY "parent_feedback_insert" ON public.parent_feedback
    FOR INSERT WITH CHECK (
        (tenant_id = public.current_tenant_id())
        AND (submitted_by = public.current_profile_id())
    );

DROP POLICY IF EXISTS "parent_feedback_update" ON public.parent_feedback;
CREATE POLICY "parent_feedback_update" ON public.parent_feedback
    FOR UPDATE USING (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR submitted_by = public.current_profile_id()
        )
    )
    WITH CHECK (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR submitted_by = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "parent_feedback_delete" ON public.parent_feedback;
CREATE POLICY "parent_feedback_delete" ON public.parent_feedback
    FOR DELETE USING (
        (tenant_id = public.current_tenant_id())
        AND public.is_admin_staff()
    );

-- 14. RLS Policies: curriculum_topics
DROP POLICY IF EXISTS "curriculum_topics_select" ON public.curriculum_topics;
CREATE POLICY "curriculum_topics_select" ON public.curriculum_topics
    FOR SELECT USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "curriculum_topics_write" ON public.curriculum_topics;
CREATE POLICY "curriculum_topics_write" ON public.curriculum_topics
    FOR ALL USING (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR public.teacher_teaches_batch(batch_id)
        )
    )
    WITH CHECK (
        (tenant_id = public.current_tenant_id())
        AND (
            public.is_admin_staff()
            OR public.teacher_teaches_batch(batch_id)
        )
    );
