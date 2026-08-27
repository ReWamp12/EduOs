-- ============================================================================
-- EduOS Schema: Chart of Accounts, Fees & Double-Entry Ledger
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    current_balance NUMERIC(14,2) DEFAULT 0.00 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(tenant_id, account_code)
);

CREATE TABLE IF NOT EXISTS public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    total_amount NUMERIC(10,2) NOT NULL,
    payment_schedule TEXT DEFAULT 'quarterly' CHECK (payment_schedule IN ('annual', 'quarterly', 'monthly', 'custom')),
    breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.fee_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    term_name TEXT NOT NULL,
    due_date DATE NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    paid_amount NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
    balance_amount NUMERIC(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status TEXT DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'partially_paid', 'overdue', 'cancelled')),
    payment_mode TEXT CHECK (payment_mode IN ('upi', 'net_banking', 'cheque', 'cash', 'card', 'scholarship')),
    payment_reference TEXT,
    paid_at TIMESTAMPTZ,
    receipt_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL,
    UNIQUE(tenant_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS public.fee_concessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    concession_type TEXT NOT NULL CHECK (concession_type IN ('rte_ews', 'merit_scholarship', 'sibling_discount', 'staff_ward', 'hardship')),
    discount_percentage NUMERIC(5,2) DEFAULT 0.00,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'active', 'revoked')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    entry_number TEXT NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    debit_account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    credit_account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    narration TEXT NOT NULL,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(tenant_id, entry_number)
);
