-- ============================================================================
-- EDUOS-123 : Institutional Finance, Fees, Payroll & General Ledger Schema
-- ----------------------------------------------------------------------------
-- Comprehensive financial accounting architecture:
--   1. public.fee_structures
--   2. public.fee_invoices
--   3. public.fee_concessions
--   4. public.payroll_runs
--   5. public.payroll_items
--   6. public.chart_of_accounts
--   7. public.journal_entries
-- ============================================================================

-- 1. Fee Structures & Heads
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    class_name TEXT NOT NULL,       -- e.g. "Class 10 - Secondary", "Class 11 - JEE"
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    name TEXT NOT NULL,             -- e.g. "Class 10 CBSE Composite Fee Schedule"
    fee_heads JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ name, category, amount, frequency: 'annual'|'term'|'monthly' }]
    total_annual_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    installment_scheme TEXT DEFAULT 'quarterly' CHECK (installment_scheme IN ('annual', 'semi_annual', 'quarterly', 'monthly')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fee Invoices (Billing & Receipts)
CREATE TABLE IF NOT EXISTS public.fee_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    roll_number TEXT,
    batch_name TEXT NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,            -- e.g. "Term 2 Tuition & Laboratory Installment"
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partially_paid', 'cancelled')),
    paid_amount NUMERIC(10,2) DEFAULT 0,
    late_fee NUMERIC(8,2) DEFAULT 0,
    payment_method TEXT,            -- UPI, Net Banking, Card, Cash, Cheque, DD
    transaction_ref TEXT,
    receipt_number TEXT,
    paid_at TIMESTAMPTZ,
    line_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Fee Concessions & RTE 25% Quota Waivers
CREATE TABLE IF NOT EXISTS public.fee_concessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    concession_type TEXT NOT NULL CHECK (concession_type IN ('rte_25_quota', 'merit_scholarship', 'sibling_discount', 'staff_ward', 'hardship_relief')),
    discount_pct NUMERIC(5,2) DEFAULT 0,
    flat_discount_amount NUMERIC(10,2) DEFAULT 0,
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES public.user_profiles(id),
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Staff Monthly Payroll Runs
CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,       -- e.g. "August 2026"
    total_gross_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_statutory_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
    staff_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'disbursed')),
    approved_by UUID REFERENCES public.user_profiles(id),
    disbursed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT payroll_runs_month_tenant_unique UNIQUE (tenant_id, month_year)
);

-- 5. Individual Employee Payroll Items
CREATE TABLE IF NOT EXISTS public.payroll_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employee_records(id) ON DELETE SET NULL,
    employee_name TEXT NOT NULL,
    employee_code TEXT NOT NULL,
    designation TEXT NOT NULL,
    basic_pay NUMERIC(10,2) NOT NULL,
    hra NUMERIC(10,2) NOT NULL DEFAULT 0,
    da NUMERIC(10,2) NOT NULL DEFAULT 0,
    allowances NUMERIC(10,2) NOT NULL DEFAULT 0,
    gross_pay NUMERIC(10,2) NOT NULL,
    pf_deduction NUMERIC(8,2) NOT NULL DEFAULT 0,  -- 12% of Basic + DA
    esi_deduction NUMERIC(8,2) NOT NULL DEFAULT 0, -- 0.75% of Gross
    pt_deduction NUMERIC(8,2) NOT NULL DEFAULT 0,  -- Professional Tax
    tds_deduction NUMERIC(8,2) NOT NULL DEFAULT 0, -- Income Tax TDS
    total_deductions NUMERIC(10,2) NOT NULL,
    net_pay NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'processed' CHECK (status IN ('processed', 'paid', 'on_hold')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Chart of Accounts (Double-Entry Foundation)
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    account_code TEXT NOT NULL,     -- 1000: Assets, 2000: Liabilities, 3000: Equity, 4000: Income, 5000: Expenses
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    current_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chart_of_accounts_code_tenant_unique UNIQUE (tenant_id, account_code)
);

-- 7. Double-Entry General Ledger Journal Entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    entry_number TEXT NOT NULL UNIQUE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    reference_module TEXT,          -- fee_collection, payroll_disbursement, vendor_po, grant_received
    reference_id TEXT,
    total_amount NUMERIC(12,2) NOT NULL,
    is_posted BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.user_profiles(id),
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ account_code, account_name, debit, credit, note }]
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_fee_invoices_tenant_status ON public.fee_invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_date ON public.journal_entries(tenant_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant_month ON public.payroll_runs(tenant_id, month_year);

-- Enable & Force RLS
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures FORCE ROW LEVEL SECURITY;

ALTER TABLE public.fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_invoices FORCE ROW LEVEL SECURITY;

ALTER TABLE public.fee_concessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_concessions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_items FORCE ROW LEVEL SECURITY;

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries FORCE ROW LEVEL SECURITY;

-- RLS Isolation Policies
DROP POLICY IF EXISTS fee_structures_isolation ON public.fee_structures;
CREATE POLICY fee_structures_isolation ON public.fee_structures
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS fee_invoices_isolation ON public.fee_invoices;
CREATE POLICY fee_invoices_isolation ON public.fee_invoices
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS fee_concessions_isolation ON public.fee_concessions;
CREATE POLICY fee_concessions_isolation ON public.fee_concessions
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS payroll_runs_isolation ON public.payroll_runs;
CREATE POLICY payroll_runs_isolation ON public.payroll_runs
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS payroll_items_isolation ON public.payroll_items;
CREATE POLICY payroll_items_isolation ON public.payroll_items
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS chart_of_accounts_isolation ON public.chart_of_accounts;
CREATE POLICY chart_of_accounts_isolation ON public.chart_of_accounts
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS journal_entries_isolation ON public.journal_entries;
CREATE POLICY journal_entries_isolation ON public.journal_entries
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());
