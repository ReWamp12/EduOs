-- Seed Data for CBSE Class 9 & Class 10 (Modern Public School)

-- 1. Insert Default Tenant
INSERT INTO public.tenants (id, name, subdomain, institution_type, primary_color, secondary_color, accent_color, tagline)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Modern Public School (CBSE Affiliated)',
    'mps',
    'school',
    '#2563EB',
    '#0D9488',
    '#F59E0B',
    'Excellence in CBSE Academics, Values & Innovation (Affiliation No. 1030492)'
) ON CONFLICT (subdomain) DO NOTHING;

-- 2. Insert Main Branch
INSERT INTO public.branches (id, tenant_id, name, code, city, is_main)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Main Campus (Senior Wing)',
    'MPS-DEL-01',
    'New Delhi',
    true
) ON CONFLICT DO NOTHING;

-- 3. Insert CBSE Class Batches
INSERT INTO public.batches (id, tenant_id, branch_id, name, code, target_exam, academic_year, room_number, capacity)
VALUES
    ('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Class 10-A — CBSE Board Champions (Kalam Section)', 'CBSE-10A', 'CBSE 10th Board Exam 2026', '2026-2027', 'Room 101', 40),
    ('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Class 10-B — CBSE Achievers (Aryabhata Section)', 'CBSE-10B', 'CBSE 10th Board Exam 2026', '2026-2027', 'Room 102', 40),
    ('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Class 9-A — CBSE Foundation (Ramanujan Section)', 'CBSE-9A', 'CBSE Class 9 Annual Exam', '2026-2027', 'Room 201', 40),
    ('c0000000-0000-0000-0000-000000000099', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Class 9-B — CBSE Scholars (Bose Section)', 'CBSE-9B', 'CBSE Class 9 Annual Exam', '2026-2027', 'Room 202', 40)
ON CONFLICT DO NOTHING;

-- 4. Insert CBSE Subjects
INSERT INTO public.subjects (id, tenant_id, name, code, icon_name, color)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Mathematics (Code 041)', 'MATH-041', 'calculator', '#2563EB'),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Science (Physics, Chem, Bio - Code 086)', 'SCI-086', 'atom', '#0D9488'),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Social Science (Hist, Civics, Geo, Eco - Code 087)', 'SST-087', 'globe', '#EA580C'),
    ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'English Language & Literature (Code 184)', 'ENG-184', 'book-open', '#7C3AED'),
    ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Hindi Course A (Code 002)', 'HIN-002', 'languages', '#DC2626'),
    ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Information Technology / AI (Code 402)', 'IT-402', 'cpu', '#059669')
ON CONFLICT DO NOTHING;
