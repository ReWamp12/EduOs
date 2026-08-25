-- ============================================================================
-- EDUOS-105 : RBAC Permission Matrix & Canonical Roles
-- ----------------------------------------------------------------------------
-- Creates the normalized relational RBAC data model:
--   1. public.roles
--   2. public.permissions
--   3. public.role_permissions
--   4. public.user_roles
-- Seeds the 20 canonical stakeholder roles and baseline permission records.
-- ============================================================================

-- 1. Tables Definition
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL for system-wide defaults
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_system_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT roles_code_tenant_unique UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module TEXT NOT NULL,       -- academics, attendance, exams, lms, hr, finance, compliance, admissions, transport, hostel, library, system
    sub_feature TEXT NOT NULL,  -- e.g. timetable, gradebook, service_books, fees, pocso_vault
    action TEXT NOT NULL,       -- view, create, edit, delete, approve, export, impersonate
    scope_level TEXT NOT NULL DEFAULT 'tenant', -- self, branch, tenant, system
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT permissions_module_sub_action_unique UNIQUE (module, sub_feature, action, scope_level)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_roles_user_role_tenant_unique UNIQUE (user_id, role_id, tenant_id)
);

-- 2. Enable & Force RLS on RBAC tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS roles_read_policy ON public.roles;
CREATE POLICY roles_read_policy ON public.roles
    FOR SELECT
    USING (tenant_id IS NULL OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS permissions_read_policy ON public.permissions;
CREATE POLICY permissions_read_policy ON public.permissions
    FOR SELECT
    USING (true); -- Standard permissions catalogue is globally readable by authenticated callers

DROP POLICY IF EXISTS role_permissions_read_policy ON public.role_permissions;
CREATE POLICY role_permissions_read_policy ON public.role_permissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.roles r
            WHERE r.id = role_permissions.role_id
              AND (r.tenant_id IS NULL OR r.tenant_id = public.current_tenant_id())
        )
    );

DROP POLICY IF EXISTS user_roles_isolation ON public.user_roles;
CREATE POLICY user_roles_isolation ON public.user_roles
    FOR ALL
    USING (tenant_id = public.current_tenant_id())
    WITH CHECK (tenant_id = public.current_tenant_id());

-- 4. Seed Canonical 20 Stakeholder Roles (System Defaults: tenant_id = NULL)
INSERT INTO public.roles (code, name, description, is_system_default)
VALUES
    ('super_admin', 'Super Admin', 'Platform administrator with system-wide configuration controls', true),
    ('trustee', 'Trustee / Board of Directors', 'Executive board oversight, financial baselines and institutional governance', true),
    ('principal', 'Principal / Head of Institution', 'Operations command, regulatory compliance, approvals and academic supervision', true),
    ('vice_principal', 'Vice Principal', 'Academic operations, timetable scheduling and student disciplinary affairs', true),
    ('hod', 'Head of Department', 'Subject curriculum oversight, lesson plan audits and faculty reviews', true),
    ('teacher', 'Teacher / Faculty', 'Classroom teaching, attendance marking, gradebook evaluation and homework DPPs', true),
    ('mentor', 'Class Mentor / Form Tutor', 'Student pastoral care, batch performance tracking and parent communications', true),
    ('lab_assistant', 'Laboratory Assistant', 'Science and computer lab equipment maintenance, reagent inventory and practicals', true),
    ('student', 'Student', 'Learning classroom access, homework submissions, exam analytics and timetable', true),
    ('parent', 'Parent / Guardian', 'Fee payments, attendance tracking, consent approvals and student progress insights', true),
    ('alumni', 'Alumni Member', 'Institutional mentorship directory, alumni community and donation funds', true),
    ('hr_manager', 'HR Manager', 'Staff recruitment ATS, service book maintenance and police verification gate', true),
    ('finance_officer', 'Finance Officer', 'Fee structuring, vendor invoicing, GL accounts and payroll processing', true),
    ('accountant', 'Accountant / Cashier', 'Fee collection, receipt issuance, petty cash and daily reconciliations', true),
    ('admissions_officer', 'Admissions Officer', 'Inquiry lead CRM, entrance exam scoring, merit lists and enrollment', true),
    ('librarian', 'Librarian', 'Book cataloguing, barcode circulation, reading analytics and stock audits', true),
    ('transport_manager', 'Transport Manager', 'Bus fleet telematics, route planning, driver verification and GPS alerts', true),
    ('hostel_warden', 'Hostel Warden', 'Hostel room allotments, resident gate-pass approvals and mess management', true),
    ('facilities_manager', 'Facilities & Safety Manager', 'Asset inventory, fire NOC logs, preventive maintenance and safety audits', true),
    ('compliance_officer', 'Compliance Officer', 'UDISE+ data reporting, CBSE affiliation registers and POCSO/POSH vaults', true)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- 5. Seed Core Permissions
INSERT INTO public.permissions (module, sub_feature, action, scope_level, description)
VALUES
    ('academics', 'timetable', 'view', 'tenant', 'View institutional weekly timetable'),
    ('academics', 'timetable', 'edit', 'tenant', 'Configure and generate timetables'),
    ('academics', 'attendance', 'view', 'branch', 'View class attendance records'),
    ('academics', 'attendance', 'create', 'branch', 'Mark daily and period attendance'),
    ('academics', 'gradebook', 'edit', 'branch', 'Enter and update gradebook marks'),
    ('academics', 'gradebook', 'approve', 'tenant', 'Approve and publish term report cards'),
    ('hr', 'service_books', 'view', 'tenant', 'View staff statutory service books'),
    ('hr', 'service_books', 'edit', 'tenant', 'Update service book entries and promotions'),
    ('hr', 'police_verification', 'approve', 'tenant', 'Verify and sign off staff police clearances'),
    ('finance', 'fees', 'view', 'self', 'View own fee receipts and pending dues'),
    ('finance', 'fees', 'create', 'tenant', 'Generate fee invoices and structures'),
    ('finance', 'payroll', 'approve', 'tenant', 'Approve monthly staff payroll and disbursements'),
    ('compliance', 'udise', 'export', 'tenant', 'Export national UDISE+ annual data'),
    ('compliance', 'pocso_vault', 'view', 'tenant', 'Restricted access to confidential child safety committee records'),
    ('system', 'tenants', 'impersonate', 'system', 'Support impersonation into a tenant context')
ON CONFLICT (module, sub_feature, action, scope_level) DO NOTHING;
