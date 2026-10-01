-- ============================================================================
-- EduOS · Closed-loop remedial plans (Gap 5)
-- A teacher raises a plan for a struggling student; parent/student see it;
-- it is resolved after a re-assessment and tracked by the principal.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.remedial_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    topic TEXT NOT NULL,
    resource_note TEXT,
    doubt_session_date DATE,
    trigger_score_pct NUMERIC(5,2),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    resolved_score_pct NUMERIC(5,2),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remedial_plans_student ON public.remedial_plans(tenant_id, student_id, status);
CREATE INDEX IF NOT EXISTS idx_remedial_plans_batch ON public.remedial_plans(tenant_id, batch_id, status);

ALTER TABLE public.remedial_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='remedial_plans'
          AND policyname='tenant_isolation_on_remedial_plans') THEN
        CREATE POLICY tenant_isolation_on_remedial_plans
            ON public.remedial_plans
            USING (tenant_id = public.current_tenant_id());
    END IF;
END $$;
