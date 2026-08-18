-- EduOS Database Schema for Supabase with Row-Level Security (RLS)
-- Bottom-Up Architecture: Student -> Teacher -> Principal -> Super Admin

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tenants Table (Multi-tenancy)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    custom_domain TEXT UNIQUE,
    institution_type TEXT NOT NULL DEFAULT 'coaching', -- coaching, school, college, university
    primary_color TEXT DEFAULT '#4F46E5',
    secondary_color TEXT DEFAULT '#06B6D4',
    accent_color TEXT DEFAULT '#F59E0B',
    logo_url TEXT,
    tagline TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Branches / Campuses
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    city TEXT,
    is_main BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Profiles (Extending Supabase Auth)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- linked to supabase auth.users
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    phone TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'principal', 'super_admin', 'parent', 'finance')),
    avatar_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Batches / Classes
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Class 11 - JEE Advanced Alpha"
    code TEXT,
    target_exam TEXT, -- JEE, NEET, CBSE, Foundation
    academic_year TEXT DEFAULT '2026-2027',
    room_number TEXT,
    mentor_teacher_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    capacity INT DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Students Profile Details
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    roll_number TEXT NOT NULL,
    admission_number TEXT UNIQUE,
    dob DATE,
    gender TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    blood_group TEXT,
    qr_code_id TEXT UNIQUE DEFAULT uuid_generate_v4()::text,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Teachers Profile Details
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_code TEXT NOT NULL,
    designation TEXT DEFAULT 'Senior Faculty',
    specialization TEXT, -- Physics, Organic Chemistry, Calculus
    qualification TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    icon_name TEXT DEFAULT 'book-open',
    color TEXT DEFAULT '#3B82F6'
);

-- 9. Timetable
CREATE TABLE IF NOT EXISTS public.timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday
    period_number INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number TEXT
);

-- 10. Attendance Records
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_number INT, -- Null for full-day attendance
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by UUID REFERENCES public.user_profiles(id),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. LMS Courses & Lessons
CREATE TABLE IF NOT EXISTS public.lms_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.user_profiles(id),
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lms_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    chapter TEXT,
    content_type TEXT CHECK (content_type IN ('video', 'pdf', 'notes', 'quiz')),
    content_url TEXT,
    duration_minutes INT DEFAULT 45,
    order_index INT DEFAULT 1
);

-- 12. Assignments & Submissions
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    max_marks INT DEFAULT 50,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    submission_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    marks_obtained INT,
    feedback TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late'))
);

-- 13. Exams & Results
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- e.g. "JEE Mock Test 04 - Full Physics"
    exam_type TEXT DEFAULT 'mock_test',
    total_marks INT NOT NULL DEFAULT 100,
    duration_minutes INT DEFAULT 180,
    exam_date DATE NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5,2) NOT NULL,
    percentile NUMERIC(5,2),
    rank_in_batch INT,
    weak_topics TEXT[], -- AI performance insight
    mistake_summary TEXT, -- e.g. "3 calculation errors in Optics"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Notices / Broadcasts
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'academic', -- academic, event, emergency, exam
    target_role TEXT DEFAULT 'all', -- all, student, teacher, parent
    priority TEXT DEFAULT 'normal', -- normal, urgent, emergency
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Staff Leave Requests (For Principal Approval)
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL, -- Sick Leave, Casual Leave, Emergency
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    actioned_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-Level Security (RLS) Policies
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Helper policy template: Tenant isolation
CREATE POLICY tenant_isolation_on_user_profiles ON public.user_profiles
    USING (tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_on_batches ON public.batches
    USING (tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_on_students ON public.students
    USING (tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY tenant_isolation_on_attendances ON public.attendances
    USING (tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE auth_user_id = auth.uid()));
