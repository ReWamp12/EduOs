-- ============================================================================
-- EduOS — 2-School Master Setup Data Only (Pure Directory & Structure)
-- Zero Transactional Records: Ready for Live Website Testing
-- School 1: Greenfield International Academy (CBSE)
-- School 2: Heritage Valley World School (ICSE)
-- ============================================================================

BEGIN;

-- 1. TENANTS & BRANDING
INSERT INTO public.tenants (id, name, subdomain, institution_type, primary_color, secondary_color, accent_color, tagline)
VALUES
  ('247afd96-506e-494c-a603-510b44316919', 'Greenfield International Academy', 'greenfield', 'school', '#1E40AF', '#0D9488', '#F59E0B', 'Nurturing Excellence, Inspiring Innovation'),
  ('3b8d9c12-789a-4123-bcde-567890abcdef', 'Heritage Valley World School', 'heritage', 'school', '#7C2D12', '#D97706', '#10B981', 'Tradition of Wisdom, Vision for Tomorrow')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subdomain = EXCLUDED.subdomain,
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color;

-- 2. BRANCHES / CAMPUSES
INSERT INTO public.branches (id, tenant_id, name, code, city, is_main)
VALUES
  ('a1000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'North Campus - Senior Wing', 'MC-01', 'New Delhi', true),
  ('a1000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'City Campus - Junior Wing', 'JC-02', 'New Delhi', false),
  ('b1000000-0000-0000-0000-000000000001', '3b8d9c12-789a-4123-bcde-567890abcdef', 'Main Heritage Estate', 'HE-01', 'Dehradun', true),
  ('b1000000-0000-0000-0000-000000000002', '3b8d9c12-789a-4123-bcde-567890abcdef', 'East Campus Arts Wing', 'EW-02', 'Dehradun', false)
ON CONFLICT (id) DO NOTHING;

-- 3. GLOBAL SUPER ADMIN PROFILE
INSERT INTO public.user_profiles (id, tenant_id, email, first_name, last_name, role, phone, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'superadmin@eduos.app', 'System', 'SuperAdmin', 'super_admin', '+91-9999900000', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. USER PROFILES — SCHOOL 1 (GREENFIELD)
INSERT INTO public.user_profiles (id, tenant_id, branch_id, email, first_name, last_name, role, phone, status)
VALUES
  -- Leadership & Staff
  ('a2000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'principal.sharma@greenfield.edu.in', 'Sunita', 'Sharma', 'principal', '+91-9810011001', 'active'),
  ('a2000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'amit.verma@greenfield.edu.in', 'Amit', 'Verma', 'teacher', '+91-9810011002', 'active'),
  ('a2000000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'sunita.rao@greenfield.edu.in', 'Sunita', 'Rao', 'teacher', '+91-9810011003', 'active'),
  ('a2000000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'rajesh.gupta@greenfield.edu.in', 'Rajesh', 'Gupta', 'teacher', '+91-9810011004', 'active'),
  ('a2000000-0000-0000-0000-000000000005', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'neha.kapoor@greenfield.edu.in', 'Neha', 'Kapoor', 'teacher', '+91-9810011005', 'active'),
  ('a2000000-0000-0000-0000-000000000006', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'priya.singh@greenfield.edu.in', 'Priya', 'Singh', 'teacher', '+91-9810011006', 'active'),
  ('a2000000-0000-0000-0000-000000000007', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'finance@greenfield.edu.in', 'Rohan', 'Deshmukh', 'finance', '+91-9810011007', 'active'),
  ('a2000000-0000-0000-0000-000000000008', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'hr@greenfield.edu.in', 'Meenakshi', 'Iyer', 'hr_manager', '+91-9810011008', 'active'),
  ('a2000000-0000-0000-0000-000000000009', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'transport@greenfield.edu.in', 'Ram', 'Singh', 'transport_manager', '+91-9810011009', 'active'),
  ('a2000000-0000-0000-0000-000000000010', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'librarian@greenfield.edu.in', 'Anand', 'Joshi', 'librarian', '+91-9810011010', 'active'),
  -- Parents of School 1
  ('a3000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'rajesh.sharma@gmail.com', 'Rajesh', 'Sharma', 'parent', '+91-9810111001', 'active'),
  ('a3000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'harish.patel@gmail.com', 'Harish', 'Patel', 'parent', '+91-9810111002', 'active'),
  ('a3000000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'deepak.mehta@gmail.com', 'Deepak', 'Mehta', 'parent', '+91-9810111003', 'active'),
  ('a3000000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'sunita.verma@gmail.com', 'Sunita', 'Verma', 'parent', '+91-9810111004', 'active'),
  ('a3000000-0000-0000-0000-000000000005', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'sourav.sen@gmail.com', 'Sourav', 'Sen', 'parent', '+91-9810111005', 'active'),
  ('a3000000-0000-0000-0000-000000000006', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'suresh.nair@gmail.com', 'Suresh', 'Nair', 'parent', '+91-9810111006', 'active'),
  ('a3000000-0000-0000-0000-000000000007', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'vikram.roy@gmail.com', 'Vikram', 'Roy', 'parent', '+91-9810111007', 'active'),
  ('a3000000-0000-0000-0000-000000000008', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'ritu.malhotra@gmail.com', 'Ritu', 'Malhotra', 'parent', '+91-9810111008', 'active'),
  -- Students of School 1
  ('a7100000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'aarav.sharma@student.greenfield.edu.in', 'Aarav', 'Sharma', 'student', '+91-9810111001', 'active'),
  ('a7100000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'ananya.patel@student.greenfield.edu.in', 'Ananya', 'Patel', 'student', '+91-9810111002', 'active'),
  ('a7100000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'rohan.mehta@student.greenfield.edu.in', 'Rohan', 'Mehta', 'student', '+91-9810111003', 'active'),
  ('a7100000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'diya.verma@student.greenfield.edu.in', 'Diya', 'Verma', 'student', '+91-9810111004', 'active'),
  ('a7100000-0000-0000-0000-000000000005', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'kabir.sen@student.greenfield.edu.in', 'Kabir', 'Sen', 'student', '+91-9810111005', 'active'),
  ('a7100000-0000-0000-0000-000000000006', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'ishita.nair@student.greenfield.edu.in', 'Ishita', 'Nair', 'student', '+91-9810111006', 'active'),
  ('a7100000-0000-0000-0000-000000000007', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'aditya.roy@student.greenfield.edu.in', 'Aditya', 'Roy', 'student', '+91-9810111007', 'active'),
  ('a7100000-0000-0000-0000-000000000008', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'sanya.malhotra@student.greenfield.edu.in', 'Sanya', 'Malhotra', 'student', '+91-9810111008', 'active')
ON CONFLICT (id) DO NOTHING;

-- 5. TEACHERS (SCHOOL 1)
INSERT INTO public.teachers (id, tenant_id, user_id, employee_code, designation, specialization, qualification, joining_date)
VALUES
  ('a4000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'a2000000-0000-0000-0000-000000000002', 'EMP-GIA-002', 'Senior Faculty', 'Physics', 'M.Sc Physics, B.Ed', '2021-06-15'),
  ('a4000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'a2000000-0000-0000-0000-000000000003', 'EMP-GIA-003', 'HOD Mathematics', 'Mathematics', 'M.Sc Mathematics, B.Ed', '2020-04-10'),
  ('a4000000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'a2000000-0000-0000-0000-000000000004', 'EMP-GIA-004', 'Senior Faculty', 'Chemistry', 'M.Sc Chemistry, B.Ed', '2022-07-01'),
  ('a4000000-0000-0000-0000-000000000005', '247afd96-506e-494c-a603-510b44316919', 'a2000000-0000-0000-0000-000000000005', 'EMP-GIA-005', 'Faculty', 'Biology', 'M.Sc Zoology, B.Ed', '2023-01-15'),
  ('a4000000-0000-0000-0000-000000000006', '247afd96-506e-494c-a603-510b44316919', 'a2000000-0000-0000-0000-000000000006', 'EMP-GIA-006', 'Faculty', 'Computer Science', 'MCA, B.Tech', '2021-08-20')
ON CONFLICT (id) DO NOTHING;

-- 6. USER PROFILES — SCHOOL 2 (HERITAGE VALLEY)
INSERT INTO public.user_profiles (id, tenant_id, branch_id, email, first_name, last_name, role, phone, status)
VALUES
  -- Leadership & Staff
  ('b2000000-0000-0000-0000-000000000001', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'principal.menon@heritage.edu.in', 'K. R.', 'Menon', 'principal', '+91-9820011001', 'active'),
  ('b2000000-0000-0000-0000-000000000002', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'arundhati.roy@heritage.edu.in', 'Arundhati', 'Roy', 'teacher', '+91-9820011002', 'active'),
  ('b2000000-0000-0000-0000-000000000003', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'sanjay.singhania@heritage.edu.in', 'Sanjay', 'Singhania', 'teacher', '+91-9820011003', 'active'),
  ('b2000000-0000-0000-0000-000000000004', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'anand.kumar@heritage.edu.in', 'Anand', 'Kumar', 'teacher', '+91-9820011004', 'active'),
  ('b2000000-0000-0000-0000-000000000005', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'meenakshi.s@heritage.edu.in', 'Meenakshi', 'Sundaram', 'teacher', '+91-9820011005', 'active'),
  ('b2000000-0000-0000-0000-000000000006', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'kavita.deshmukh@heritage.edu.in', 'Kavita', 'Deshmukh', 'teacher', '+91-9820011006', 'active'),
  ('b2000000-0000-0000-0000-000000000007', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'finance@heritage.edu.in', 'Vikram', 'Singhania', 'finance', '+91-9820011007', 'active'),
  ('b2000000-0000-0000-0000-000000000008', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'hr@heritage.edu.in', 'Shalini', 'Bose', 'hr_manager', '+91-9820011008', 'active'),
  ('b2000000-0000-0000-0000-000000000009', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'transport@heritage.edu.in', 'Gurpreet', 'Singh', 'transport_manager', '+91-9820011009', 'active'),
  ('b2000000-0000-0000-0000-000000000010', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'librarian@heritage.edu.in', 'Father', 'Thomas', 'librarian', '+91-9820011010', 'active'),
  -- Parents of School 2
  ('b3000000-0000-0000-0000-000000000001', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'gautam.singhania@gmail.com', 'Gautam', 'Singhania', 'parent', '+91-9820111001', 'active'),
  ('b3000000-0000-0000-0000-000000000002', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'anirban.mukherjee@gmail.com', 'Anirban', 'Mukherjee', 'parent', '+91-9820111002', 'active'),
  ('b3000000-0000-0000-0000-000000000003', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'tariq.merchant@gmail.com', 'Tariq', 'Merchant', 'parent', '+91-9820111003', 'active'),
  ('b3000000-0000-0000-0000-000000000004', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'ks.reddy@gmail.com', 'K. S.', 'Reddy', 'parent', '+91-9820111004', 'active'),
  ('b3000000-0000-0000-0000-000000000005', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'anthony.dsouza@gmail.com', 'Anthony', 'D''Souza', 'parent', '+91-9820111005', 'active'),
  ('b3000000-0000-0000-0000-000000000006', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'milind.kulkarni@gmail.com', 'Milind', 'Kulkarni', 'parent', '+91-9820111006', 'active'),
  ('b3000000-0000-0000-0000-000000000007', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'subir.roy@gmail.com', 'Subir', 'Roy', 'parent', '+91-9820111007', 'active'),
  ('b3000000-0000-0000-0000-000000000008', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'rakesh.agarwal@gmail.com', 'Rakesh', 'Agarwal', 'parent', '+91-9820111008', 'active'),
  -- Students of School 2
  ('b7100000-0000-0000-0000-000000000001', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'dev.singhania@student.heritage.edu.in', 'Dev', 'Singhania', 'student', '+91-9820111001', 'active'),
  ('b7100000-0000-0000-0000-000000000002', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'tara.mukherjee@student.heritage.edu.in', 'Tara', 'Mukherjee', 'student', '+91-9820111002', 'active'),
  ('b7100000-0000-0000-0000-000000000003', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'zayaan.merchant@student.heritage.edu.in', 'Zayaan', 'Merchant', 'student', '+91-9820111003', 'active'),
  ('b7100000-0000-0000-0000-000000000004', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'avani.reddy@student.heritage.edu.in', 'Avani', 'Reddy', 'student', '+91-9820111004', 'active'),
  ('b7100000-0000-0000-0000-000000000005', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'neil.dsouza@student.heritage.edu.in', 'Neil', 'D''Souza', 'student', '+91-9820111005', 'active'),
  ('b7100000-0000-0000-0000-000000000006', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'kavya.kulkarni@student.heritage.edu.in', 'Kavya', 'Kulkarni', 'student', '+91-9820111006', 'active'),
  ('b7100000-0000-0000-0000-000000000007', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'samarjit.roy@student.heritage.edu.in', 'Samarjit', 'Roy', 'student', '+91-9820111007', 'active'),
  ('b7100000-0000-0000-0000-000000000008', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'nandini.agarwal@student.heritage.edu.in', 'Nandini', 'Agarwal', 'student', '+91-9820111008', 'active')
ON CONFLICT (id) DO NOTHING;

-- 5. TEACHERS (SCHOOL 2)
INSERT INTO public.teachers (id, tenant_id, user_id, employee_code, designation, specialization, qualification, joining_date)
VALUES
  ('b4000000-0000-0000-0000-000000000001', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b2000000-0000-0000-0000-000000000002', 'EMP-HVW-002', 'HOD Literature', 'English Literature', 'M.A English Literature, B.Ed', '2019-07-01'),
  ('b4000000-0000-0000-0000-000000000002', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b2000000-0000-0000-0000-000000000003', 'EMP-HVW-003', 'Senior Faculty', 'Commercial Studies', 'M.Com, MBA', '2020-09-15'),
  ('b4000000-0000-0000-0000-000000000003', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b2000000-0000-0000-0000-000000000004', 'EMP-HVW-004', 'Faculty', 'Mathematics', 'M.Sc Applied Mathematics', '2018-05-10'),
  ('b4000000-0000-0000-0000-000000000004', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b2000000-0000-0000-0000-000000000005', 'EMP-HVW-005', 'Faculty', 'History & Civics', 'M.A History, B.Ed', '2021-04-01'),
  ('b4000000-0000-0000-0000-000000000005', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b2000000-0000-0000-0000-000000000006', 'EMP-HVW-006', 'Faculty', 'Computer Applications', 'MCA', '2022-08-10')
ON CONFLICT (id) DO NOTHING;

-- 6. BATCHES
INSERT INTO public.batches (id, tenant_id, branch_id, name, code, target_exam, academic_year, mentor_teacher_id, room_number, capacity)
VALUES
  ('a5000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'Class 10 - Section A', '10-A-2026', 'CBSE', '2026-2027', 'a2000000-0000-0000-0000-000000000002', 'Room 204', 40),
  ('a5000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'Class 9 - Section A', '9-A-2026', 'CBSE', '2026-2027', 'a2000000-0000-0000-0000-000000000003', 'Room 102', 40),
  ('a5000000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'Class 11 - Science', '11-SCI-2026', 'CBSE', '2026-2027', 'a2000000-0000-0000-0000-000000000004', 'Lab Room 301', 35),
  ('b5000000-0000-0000-0000-000000000001', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'Grade 10 - ICSE Emerald', '10-EMERALD', 'ICSE', '2026-2027', 'b2000000-0000-0000-0000-000000000002', 'Hall A-1', 30),
  ('b5000000-0000-0000-0000-000000000002', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'Grade 9 - ICSE Sapphire', '9-SAPPHIRE', 'ICSE', '2026-2027', 'b2000000-0000-0000-0000-000000000003', 'Hall B-2', 30),
  ('b5000000-0000-0000-0000-000000000003', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'Grade 11 - Commerce', '11-COMM', 'ICSE', '2026-2027', 'b2000000-0000-0000-0000-000000000004', 'Seminar Room', 25)
ON CONFLICT (id) DO NOTHING;

-- 7. SUBJECTS
INSERT INTO public.subjects (id, tenant_id, name, code, color, icon_name)
VALUES
  ('a6000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'Mathematics', 'MATH-10', '#3B82F6', 'Calculator'),
  ('a6000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'Physics', 'PHY-10', '#6366F1', 'Atom'),
  ('a6000000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'Chemistry', 'CHEM-10', '#EC4899', 'FlaskConical'),
  ('a6000000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'Biology', 'BIO-10', '#10B981', 'Dna'),
  ('a6000000-0000-0000-0000-000000000005', '247afd96-506e-494c-a603-510b44316919', 'Computer Science', 'CS-10', '#F59E0B', 'Code'),
  ('b6000000-0000-0000-0000-000000000001', '3b8d9c12-789a-4123-bcde-567890abcdef', 'English Literature', 'LIT-10', '#9333EA', 'BookOpen'),
  ('b6000000-0000-0000-0000-000000000002', '3b8d9c12-789a-4123-bcde-567890abcdef', 'Commercial Studies', 'COMM-10', '#D97706', 'TrendingUp'),
  ('b6000000-0000-0000-0000-000000000003', '3b8d9c12-789a-4123-bcde-567890abcdef', 'Economics', 'ECON-10', '#2563EB', 'BarChart3'),
  ('b6000000-0000-0000-0000-000000000004', '3b8d9c12-789a-4123-bcde-567890abcdef', 'Mathematics', 'MATH-ICSE', '#059669', 'Calculator'),
  ('b6000000-0000-0000-0000-000000000005', '3b8d9c12-789a-4123-bcde-567890abcdef', 'History & Civics', 'HIST-10', '#DC2626', 'Landmark')
ON CONFLICT (id) DO NOTHING;

-- 8. STUDENTS
INSERT INTO public.students (id, user_id, tenant_id, branch_id, batch_id, roll_number, admission_number, dob, gender, blood_group, parent_name, parent_phone, parent_email, qr_code_id)
VALUES
  ('a7000000-0000-0000-0000-000000000001', 'a7100000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', '1', 'GIA2026001', '2011-03-15', 'male', 'O+', 'Rajesh Sharma', '+91-9810111001', 'rajesh.sharma@gmail.com', 'QR-GIA-001'),
  ('a7000000-0000-0000-0000-000000000002', 'a7100000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', '2', 'GIA2026002', '2011-06-22', 'female', 'B+', 'Dr. Harish Patel', '+91-9810111002', 'harish.patel@gmail.com', 'QR-GIA-002'),
  ('a7000000-0000-0000-0000-000000000003', 'a7100000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', '3', 'GIA2026003', '2011-01-10', 'male', 'A+', 'Deepak Mehta', '+91-9810111003', 'deepak.mehta@gmail.com', 'QR-GIA-003'),
  ('a7000000-0000-0000-0000-000000000004', 'a7100000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', '4', 'GIA2026004', '2011-09-05', 'female', 'AB+', 'Sunita Verma', '+91-9810111004', 'sunita.verma@gmail.com', 'QR-GIA-004'),
  ('a7000000-0000-0000-0000-000000000005', 'a7100000-0000-0000-0000-000000000005', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', '5', 'GIA2026005', '2011-04-18', 'male', 'O+', 'Sourav Sen', '+91-9810111005', 'sourav.sen@gmail.com', 'QR-GIA-005'),
  ('a7000000-0000-0000-0000-000000000006', 'a7100000-0000-0000-0000-000000000006', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', '6', 'GIA2026006', '2011-08-30', 'female', 'B-', 'Suresh Nair', '+91-9810111006', 'suresh.nair@gmail.com', 'QR-GIA-006'),
  ('a7000000-0000-0000-0000-000000000007', 'a7100000-0000-0000-0000-000000000007', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', '7', 'GIA2026007', '2011-05-12', 'male', 'A-', 'Vikram Roy', '+91-9810111007', 'vikram.roy@gmail.com', 'QR-GIA-007'),
  ('a7000000-0000-0000-0000-000000000008', 'a7100000-0000-0000-0000-000000000008', '247afd96-506e-494c-a603-510b44316919', 'a1000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', '8', 'GIA2026008', '2011-11-25', 'female', 'O-', 'Ritu Malhotra', '+91-9810111008', 'ritu.malhotra@gmail.com', 'QR-GIA-008'),
  ('b7000000-0000-0000-0000-000000000001', 'b7100000-0000-0000-0000-000000000001', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', '1', 'HVWS2026001', '2011-02-14', 'male', 'O+', 'Gautam Singhania', '+91-9820111001', 'gautam.singhania@gmail.com', 'QR-HVW-001'),
  ('b7000000-0000-0000-0000-000000000002', 'b7100000-0000-0000-0000-000000000002', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', '2', 'HVWS2026002', '2011-07-19', 'female', 'A+', 'Anirban Mukherjee', '+91-9820111002', 'anirban.mukherjee@gmail.com', 'QR-HVW-002'),
  ('b7000000-0000-0000-0000-000000000003', 'b7100000-0000-0000-0000-000000000003', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', '3', 'HVWS2026003', '2011-05-03', 'male', 'B+', 'Tariq Merchant', '+91-9820111003', 'tariq.merchant@gmail.com', 'QR-HVW-003'),
  ('b7000000-0000-0000-0000-000000000004', 'b7100000-0000-0000-0000-000000000004', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', '4', 'HVWS2026004', '2011-10-12', 'female', 'O-', 'Dr. K. S. Reddy', '+91-9820111004', 'ks.reddy@gmail.com', 'QR-HVW-004'),
  ('b7000000-0000-0000-0000-000000000005', 'b7100000-0000-0000-0000-000000000005', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', '5', 'HVWS2026005', '2011-03-28', 'male', 'AB+', 'Anthony D''Souza', '+91-9820111005', 'anthony.dsouza@gmail.com', 'QR-HVW-005'),
  ('b7000000-0000-0000-0000-000000000006', 'b7100000-0000-0000-0000-000000000006', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', '6', 'HVWS2026006', '2011-08-16', 'female', 'B-', 'Milind Kulkarni', '+91-9820111006', 'milind.kulkarni@gmail.com', 'QR-HVW-006'),
  ('b7000000-0000-0000-0000-000000000007', 'b7100000-0000-0000-0000-000000000007', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', '7', 'HVWS2026007', '2011-12-01', 'male', 'A-', 'Subir Roy', '+91-9820111007', 'subir.roy@gmail.com', 'QR-HVW-007'),
  ('b7000000-0000-0000-0000-000000000008', 'b7100000-0000-0000-0000-000000000008', '3b8d9c12-789a-4123-bcde-567890abcdef', 'b1000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', '8', 'HVWS2026008', '2011-04-09', 'female', 'O+', 'Rakesh Agarwal', '+91-9820111008', 'rakesh.agarwal@gmail.com', 'QR-HVW-008')
ON CONFLICT (id) DO NOTHING;

COMMIT;
