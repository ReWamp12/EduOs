-- ============================================================================
-- EduOS Schema: Admissions CRM Leads, Applications, Social & Alumni
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.inquiry_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    assigned_counselor UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    target_class TEXT NOT NULL,
    lead_source TEXT DEFAULT 'walk_in',
    stage TEXT DEFAULT 'inquiry' CHECK (stage IN ('inquiry', 'campus_visit', 'entrance_test', 'admitted', 'closed_lost')),
    score INT DEFAULT 50,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admission_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    application_number TEXT NOT NULL,
    student_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT,
    category TEXT DEFAULT 'general',
    target_class TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'test_passed', 'admitted', 'rejected')),
    merit_score NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL,
    UNIQUE(tenant_id, application_number)
);

CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    caption TEXT NOT NULL,
    platforms JSONB NOT NULL DEFAULT '["instagram"]'::jsonb,
    has_photo_consent_passed BOOLEAN DEFAULT true NOT NULL,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.alumni_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    graduation_year INT NOT NULL,
    degree_stream TEXT NOT NULL,
    current_company TEXT,
    designation TEXT,
    city TEXT,
    linkedin_url TEXT,
    is_mentor_available BOOLEAN DEFAULT false NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.alumni_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    alumni_id UUID REFERENCES public.alumni_profiles(id) ON DELETE SET NULL,
    donor_name TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    campaign_name TEXT DEFAULT 'Annual Campus Development Fund' NOT NULL,
    pan_number TEXT,
    receipt_80g_number TEXT NOT NULL,
    status TEXT DEFAULT 'successful' CHECK (status IN ('pending', 'successful', 'failed')),
    paid_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL,
    UNIQUE(tenant_id, receipt_80g_number)
);
