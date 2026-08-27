-- ============================================================================
-- EduOS Schema: Statutory Certificates, SMC Minutes, UDISE & Grievance Cases
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compliance_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('fire_safety', 'building_safety', 'board_affiliation', 'state_recognition', 'water_sanitation', 'transport_fitness', 'other')),
    title TEXT NOT NULL,
    issuing_authority TEXT NOT NULL,
    document_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'expiring_soon', 'expired')),
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.smc_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    meeting_date DATE NOT NULL,
    meeting_type TEXT NOT NULL DEFAULT 'Ordinary Quarterly Meeting',
    agenda TEXT NOT NULL,
    resolutions TEXT NOT NULL,
    attendees_count INT DEFAULT 12,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.udise_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    udise_code TEXT NOT NULL,
    total_students INT NOT NULL,
    total_teachers INT NOT NULL,
    total_classrooms INT NOT NULL,
    submission_status TEXT DEFAULT 'submitted_to_ministry' CHECK (submission_status IN ('draft', 'verified_by_principal', 'submitted_to_ministry')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.complaint_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    case_number TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('pocso_child_safety', 'anti_bullying', 'staff_grievance', 'parent_dispute', 'general')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    reported_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'under_investigation' CHECK (status IN ('under_investigation', 'resolved', 'escalated_to_committee', 'dismissed')),
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL,
    UNIQUE(tenant_id, case_number)
);
