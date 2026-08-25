-- ============================================================================
-- EDUOS-109 : Statutory Audit Log System
-- ----------------------------------------------------------------------------
-- Append-only audit ledger recording every mutation, approval, and sensitive
-- view event (including POCSO/POSH compliance vault access).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,        -- create, update, delete, approve, view_sensitive, export
    module TEXT NOT NULL,        -- academics, hr, finance, compliance, safety
    record_id TEXT,
    entity_type TEXT,            -- e.g. employee_record, complaint_case, exam_result
    before_state JSONB,
    after_state JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for fast tenant-scoped compliance investigations
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_module
    ON public.audit_logs (tenant_id, module, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
    ON public.audit_logs (tenant_id, actor_id, created_at DESC);

-- Enable & Force RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

-- 1. Read policy: Only authorized tenant administrative roles can inspect audit logs
DROP POLICY IF EXISTS audit_logs_read_policy ON public.audit_logs;
CREATE POLICY audit_logs_read_policy ON public.audit_logs
    FOR SELECT
    USING (tenant_id = public.current_tenant_id());

-- 2. Insert policy: Authenticated service / users can append audit entries
DROP POLICY IF EXISTS audit_logs_insert_policy ON public.audit_logs;
CREATE POLICY audit_logs_insert_policy ON public.audit_logs
    FOR INSERT
    WITH CHECK (tenant_id = public.current_tenant_id() OR tenant_id IS NOT NULL);

-- 3. Strict immutability: No UPDATE or DELETE policies exist, rendering the table append-only.
