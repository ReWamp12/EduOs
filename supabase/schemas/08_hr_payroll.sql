-- ============================================================================
-- EduOS Schema: HR, Faculty Master, Service Records, Recruitment & Payroll
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_code TEXT NOT NULL,
    designation TEXT DEFAULT 'Senior Faculty',
    specialization TEXT,
    qualification TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    police_verification_status TEXT DEFAULT 'verified' CHECK (police_verification_status IN ('verified', 'pending', 'missing')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.employee_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_code TEXT NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    employment_type TEXT DEFAULT 'permanent' CHECK (employment_type IN ('permanent', 'contract', 'probation', 'part_time')),
    basic_salary NUMERIC(10,2) NOT NULL DEFAULT 50000.00,
    pan_number TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'resigned', 'terminated')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL,
    UNIQUE(tenant_id, employee_code)
);

CREATE TABLE IF NOT EXISTS public.employee_service_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employee_records(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('joining', 'promotion', 'annual_increment', 'transfer', 'award', 'disciplinary')),
    event_date DATE NOT NULL,
    remarks TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employee_records(id) ON DELETE CASCADE,
    training_title TEXT NOT NULL,
    conducting_body TEXT NOT NULL DEFAULT 'CBSE COE',
    hours_completed NUMERIC(5,1) NOT NULL DEFAULT 5.0,
    completion_date DATE NOT NULL,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employee_records(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('casual', 'earned', 'medical', 'maternity', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count NUMERIC(4,1) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.job_openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    vacancies INT DEFAULT 1 NOT NULL,
    qualification_required TEXT,
    min_experience_years INT DEFAULT 2,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'interviewing', 'closed', 'on_hold')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    experience_years INT DEFAULT 0,
    resume_url TEXT,
    stage TEXT DEFAULT 'applied' CHECK (stage IN ('applied', 'screening', 'interview', 'offered', 'hired', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.interview_scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES public.user_profiles(id),
    subject_score INT CHECK (subject_score BETWEEN 1 AND 10),
    pedagogy_score INT CHECK (pedagogy_score BETWEEN 1 AND 10),
    recommendation TEXT CHECK (recommendation IN ('strong_hire', 'hire', 'hold', 'reject')),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    month_year TEXT NOT NULL,
    total_gross NUMERIC(12,2) NOT NULL,
    total_deductions NUMERIC(12,2) NOT NULL,
    total_net_payout NUMERIC(12,2) NOT NULL,
    status TEXT DEFAULT 'approved' CHECK (status IN ('draft', 'approved', 'disbursed')),
    disbursed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(tenant_id, month_year)
);

CREATE TABLE IF NOT EXISTS public.payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employee_records(id) ON DELETE CASCADE,
    basic NUMERIC(10,2) NOT NULL,
    hra NUMERIC(10,2) NOT NULL,
    special_allowance NUMERIC(10,2) DEFAULT 0.00,
    pf_deduction NUMERIC(10,2) NOT NULL,
    tds_tax NUMERIC(10,2) DEFAULT 0.00,
    net_salary NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'paid' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
