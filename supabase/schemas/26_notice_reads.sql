-- ============================================================================
-- EduOS · Notice read receipts (Gap 8)
-- One row per (notice, user) the first time the user opens the circular.
-- Staff compare the row count against the audience size for delivery tracking.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notice_reads (
    notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (notice_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notice_reads_tenant ON public.notice_reads(tenant_id, notice_id);

ALTER TABLE public.notice_reads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='notice_reads'
          AND policyname='tenant_isolation_on_notice_reads') THEN
        CREATE POLICY tenant_isolation_on_notice_reads
            ON public.notice_reads
            USING (tenant_id = public.current_tenant_id());
    END IF;
END $$;
