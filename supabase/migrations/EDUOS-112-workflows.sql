-- ============================================================================
-- EDUOS-112 : Generic Approval & Workflow Engine
-- ----------------------------------------------------------------------------
-- Reusable state-machine schema supporting multi-stage approval chains for:
--   - Staff leave requests
--   - Student admissions & merit lists
--   - Fee concessions & scholarships
--   - Procurement purchase orders
--   - Social media & public announcements
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workflow_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL for system-wide defaults
    module TEXT NOT NULL,           -- hr, finance, admissions, facilities, communications
    workflow_code TEXT NOT NULL,    -- staff_leave, student_admission, fee_concession, po_approval
    name TEXT NOT NULL,
    steps_config JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of step definitions (role, SLA, auto-escalation)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT workflow_definitions_code_tenant_unique UNIQUE (tenant_id, workflow_code)
);

CREATE TABLE IF NOT EXISTS public.workflow_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    workflow_code TEXT NOT NULL,
    entity_type TEXT NOT NULL,      -- leave_request, admission_application, purchase_order
    entity_id TEXT NOT NULL,
    current_step INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'escalated', 'cancelled')),
    requester_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    assigned_approver_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    assigned_role TEXT,
    history_log JSONB DEFAULT '[]'::jsonb, -- Array of actions { actor_id, role, action, remarks, timestamp }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable & Force RLS
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_definitions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.workflow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_requests FORCE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS workflow_definitions_read ON public.workflow_definitions;
CREATE POLICY workflow_definitions_read ON public.workflow_definitions
    FOR SELECT
    USING (tenant_id IS NULL OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS workflow_requests_isolation ON public.workflow_requests;
CREATE POLICY workflow_requests_isolation ON public.workflow_requests
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- Seed Default Workflow Definitions
INSERT INTO public.workflow_definitions (workflow_code, module, name, steps_config)
VALUES
    ('staff_leave', 'hr', 'Staff Leave Standard Approval Chain', '[
        {"step": 1, "role": "principal", "name": "Principal Approval", "sla_hours": 24}
    ]'::jsonb),
    ('fee_concession', 'finance', 'Student Fee Concession Approval', '[
        {"step": 1, "role": "finance_officer", "name": "Financial Verification", "sla_hours": 48},
        {"step": 2, "role": "principal", "name": "Principal Sanction", "sla_hours": 24}
    ]'::jsonb),
    ('procurement_po', 'facilities', 'Campus Procurement PO Approval', '[
        {"step": 1, "role": "facilities_manager", "name": "Stock Verification", "sla_hours": 24},
        {"step": 2, "role": "finance_officer", "name": "Budget Allocation", "sla_hours": 48},
        {"step": 3, "role": "trustee", "name": "Trustee Board Sign-off", "sla_hours": 72}
    ]'::jsonb)
ON CONFLICT (tenant_id, workflow_code) DO NOTHING;
