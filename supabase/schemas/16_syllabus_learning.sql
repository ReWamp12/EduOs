-- ============================================================================
-- EduOS Schema: Syllabus & Learning (Phase 1)
-- Multi-Tenant Academic Syllabus, Chapters, Topics & Learning Materials
-- ============================================================================

-- 1. SYLLABUS CHAPTERS
CREATE TABLE IF NOT EXISTS public.syllabus_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    unit_name TEXT DEFAULT 'Core Curriculum',
    sequence_order INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    version INT NOT NULL DEFAULT 1
);

-- 2. SYLLABUS TOPICS
CREATE TABLE IF NOT EXISTS public.syllabus_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.syllabus_chapters(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sequence_order INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    completion_date DATE,
    faculty_notes TEXT,
    estimated_periods INT DEFAULT 4,
    target_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    version INT NOT NULL DEFAULT 1
);

-- 3. LEARNING MATERIALS
CREATE TABLE IF NOT EXISTS public.learning_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.syllabus_chapters(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    material_type TEXT NOT NULL CHECK (material_type IN ('pdf', 'video', 'notes', 'link', 'image')),
    file_url TEXT NOT NULL,
    file_size TEXT DEFAULT '1.2 MB',
    author_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    author_name TEXT DEFAULT 'Faculty',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    version INT NOT NULL DEFAULT 1
);

-- 4. STUDENT TOPIC PROGRESS
CREATE TABLE IF NOT EXISTS public.student_topic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_topic UNIQUE (student_id, topic_id)
);

-- 5. INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_syllabus_chapters_batch_subject ON public.syllabus_chapters(batch_id, subject_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_chapter ON public.syllabus_topics(chapter_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_batch_subject ON public.syllabus_topics(batch_id, subject_id, status);
CREATE INDEX IF NOT EXISTS idx_learning_materials_topic ON public.learning_materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_learning_materials_chapter ON public.learning_materials(chapter_id);
CREATE INDEX IF NOT EXISTS idx_student_topic_progress_student ON public.student_topic_progress(student_id);

-- 6. ROW-LEVEL SECURITY POLICIES
ALTER TABLE public.syllabus_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_topic_progress ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated or matching tenant
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_on_syllabus_chapters') THEN
        CREATE POLICY tenant_isolation_on_syllabus_chapters ON public.syllabus_chapters
            FOR ALL USING (tenant_id = public.current_tenant_id() OR public.current_tenant_id() IS NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_on_syllabus_topics') THEN
        CREATE POLICY tenant_isolation_on_syllabus_topics ON public.syllabus_topics
            FOR ALL USING (tenant_id = public.current_tenant_id() OR public.current_tenant_id() IS NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_on_learning_materials') THEN
        CREATE POLICY tenant_isolation_on_learning_materials ON public.learning_materials
            FOR ALL USING (tenant_id = public.current_tenant_id() OR public.current_tenant_id() IS NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_on_student_topic_progress') THEN
        CREATE POLICY tenant_isolation_on_student_topic_progress ON public.student_topic_progress
            FOR ALL USING (tenant_id = public.current_tenant_id() OR public.current_tenant_id() IS NULL);
    END IF;
END $$;
