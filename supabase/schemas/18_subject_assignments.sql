-- ============================================================================
-- EduOS Schema: Subject <-> Teacher Assignments
-- First-class faculty assignment (spec §1.13, admin workflow §4)
-- ============================================================================

-- Historically the app inferred "who teaches this subject" from public.timetables
-- (any timetable row with (subject_id, teacher_id) implied assignment). That
-- coupled scheduling with staffing: a subject with no timetable slot yet had
-- no faculty, and reassigning meant editing every period. This table separates
-- the two so admins can assign a subject to a teacher up front, and the
-- timetable can be drawn afterwards.
--
-- Per spec §1.13 the batch link stays on syllabus_chapters — a subject is
-- tenant-scoped, its syllabus is per batch, and its faculty pairing sits on
-- this row. `is_primary` marks the lead teacher when several are assigned
-- (e.g. a lead + a lab assistant), so downstream views like FacultyGradebook
-- can pick "the" teacher without guessing.

CREATE TABLE IF NOT EXISTS public.subject_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    version INT NOT NULL DEFAULT 1,
    -- A teacher can be assigned to the same subject twice only if the batch
    -- differs. NULL batch means "across all batches" — for tenants that don't
    -- split assignment by batch.
    CONSTRAINT unique_subject_teacher_per_batch UNIQUE (subject_id, teacher_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_subject_teachers_subject
    ON public.subject_teachers(subject_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_subject_teachers_teacher
    ON public.subject_teachers(teacher_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_subject_teachers_tenant
    ON public.subject_teachers(tenant_id) WHERE is_deleted = false;

-- Only one primary teacher per (subject, batch). Enforced as a partial unique
-- index (a filtered UNIQUE isn't a constraint, so put it here). NULL batch
-- collapses to a single primary across the tenant, which is the intended
-- shape for tenants that don't split by batch.
CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_teacher_per_subject_batch
    ON public.subject_teachers(subject_id, COALESCE(batch_id, '00000000-0000-0000-0000-000000000000'::uuid))
    WHERE is_primary = true AND is_deleted = false;

-- Multi-tenancy — same pattern as every other table in this schema.
ALTER TABLE public.subject_teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_on_subject_teachers ON public.subject_teachers
    USING (tenant_id = public.current_tenant_id());
