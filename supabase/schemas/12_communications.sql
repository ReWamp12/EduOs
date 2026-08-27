-- ============================================================================
-- EduOS Schema: Campus Broadcast Notices & Support Helpdesk
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_roles TEXT[] DEFAULT ARRAY['student', 'teacher', 'parent']::TEXT[],
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    is_published BOOLEAN DEFAULT true NOT NULL,
    published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    ticket_number TEXT NOT NULL,
    raised_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('it_support', 'fee_query', 'transport_change', 'id_card', 'general')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL,
    UNIQUE(tenant_id, ticket_number)
);
