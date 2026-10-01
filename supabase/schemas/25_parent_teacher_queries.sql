-- ============================================================================
-- EduOS · Parent–Teacher Query Desk (Gap 6)
-- Auditable, categorised parent → teacher messages with a single teacher reply.
-- Open queries older than 48h are escalated to the principal (computed on read).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parent_teacher_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    parent_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('academic', 'attendance', 'health', 'general')),
    message TEXT NOT NULL,
    reply TEXT,
    replied_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pt_queries_teacher ON public.parent_teacher_queries(tenant_id, teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_pt_queries_parent ON public.parent_teacher_queries(tenant_id, parent_user_id, created_at DESC);

ALTER TABLE public.parent_teacher_queries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='parent_teacher_queries'
          AND policyname='tenant_isolation_on_parent_teacher_queries') THEN
        CREATE POLICY tenant_isolation_on_parent_teacher_queries
            ON public.parent_teacher_queries
            USING (tenant_id = public.current_tenant_id());
    END IF;
END $$;
