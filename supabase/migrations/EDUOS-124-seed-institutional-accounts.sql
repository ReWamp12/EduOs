-- ============================================================================
-- EDUOS-124 : Institutional Stakeholder Profiles & Canonical Roles Seeding
-- ----------------------------------------------------------------------------
-- 1. Updates user_profiles role check constraint for full canonical matrix.
-- 2. Seeds standard Modern Public School tenant & branch.
-- 3. Upserts official institutional user profiles.
-- 4. Links profiles to canonical RBAC roles in public.user_roles.
-- ============================================================================

-- 1. Update user_profiles role check constraint
ALTER TABLE public.user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles
    ADD CONSTRAINT user_profiles_role_check CHECK (role IN (
        'student',
        'parent',
        'teacher',
        'principal',
        'vice_principal',
        'hod',
        'mentor',
        'lab_assistant',
        'alumni',
        'hr_manager',
        'finance_officer',
        'accountant',
        'admissions_officer',
        'librarian',
        'transport_manager',
        'hostel_warden',
        'facilities_manager',
        'compliance_officer',
        'trustee',
        'super_admin',
        'finance' -- Legacy alias
    ));

-- 2. Ensure Default Tenant & Branch Exist
INSERT INTO public.tenants (id, name, subdomain, institution_type, primary_color, secondary_color, accent_color, tagline)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Modern Public School',
    'mps',
    'school',
    '#2563EB',
    '#0D9488',
    '#F59E0B',
    'Excellence in Holistic Education & Board Mastery'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    subdomain = EXCLUDED.subdomain;

INSERT INTO public.branches (id, tenant_id, name, code, is_main_branch, address)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Main Campus',
    'BR-MAIN',
    true,
    'Knowledge Park III, Institutional Area, Greater Noida, UP'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Upsert Official Institutional User Profiles
INSERT INTO public.user_profiles (
    id, tenant_id, branch_id, email, first_name, last_name, role, status
)
VALUES
    -- Student
    (
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'aarav.sharma@mps.eduos.in',
        'Aarav',
        'Sharma',
        'student',
        'active'
    ),
    -- Teacher
    (
        '10000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'amit.verma@mps.eduos.in',
        'Prof. Amit',
        'Verma',
        'teacher',
        'active'
    ),
    -- Principal
    (
        '10000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'principal@mps.eduos.in',
        'Dr. Meenakshi',
        'Sundaram',
        'principal',
        'active'
    ),
    -- Finance Officer (CFO)
    (
        '10000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'finance@mps.eduos.in',
        'Rajesh',
        'Nair',
        'finance_officer',
        'active'
    ),
    -- Accountant / Cashier
    (
        '10000000-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'accounts@mps.eduos.in',
        'Suresh',
        'Gupta',
        'accountant',
        'active'
    ),
    -- HR Manager
    (
        '10000000-0000-0000-0000-000000000006',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'hr@mps.eduos.in',
        'Priya',
        'Nambiar',
        'hr_manager',
        'active'
    ),
    -- Parent
    (
        '10000000-0000-0000-0000-000000000007',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'rajesh.sharma@parents.mps.eduos.in',
        'Rajesh',
        'Sharma',
        'parent',
        'active'
    ),
    -- Super Admin
    (
        '10000000-0000-0000-0000-000000000008',
        '00000000-0000-0000-0000-000000000001',
        NULL,
        'admin@eduos.io',
        'System',
        'Administrator',
        'super_admin',
        'active'
    )
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- 4. Map user profiles to RBAC public.user_roles
INSERT INTO public.user_roles (user_id, role_id, tenant_id, branch_id)
SELECT
    up.id,
    r.id,
    up.tenant_id,
    up.branch_id
FROM public.user_profiles up
JOIN public.roles r ON r.code = up.role
WHERE up.tenant_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;
