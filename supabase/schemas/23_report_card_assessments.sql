-- ============================================================================
-- EduOS · CBSE CCE Report Card inputs (Gap 3)
-- Raw per-subject internal-assessment components + term exam marks, and the
-- co-scholastic grades. Totals/grades are computed in the app
-- (lib/cbseGrading.ts), never stored, so a rule change cannot desync them.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_term_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    term TEXT NOT NULL CHECK (term IN ('term1', 'term2')),
    periodic_tests NUMERIC(4,1)[] NOT NULL DEFAULT '{}',          -- each out of 20
    portfolio NUMERIC(3,1) NOT NULL DEFAULT 0 CHECK (portfolio BETWEEN 0 AND 5),
    subject_enrichment NUMERIC(3,1) NOT NULL DEFAULT 0 CHECK (subject_enrichment BETWEEN 0 AND 5),
    term_exam_marks NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (term_exam_marks BETWEEN 0 AND 80),
    updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_term_assessment UNIQUE (student_id, subject_id, academic_year, term)
);

CREATE TABLE IF NOT EXISTS public.student_coscholastic_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    term TEXT NOT NULL CHECK (term IN ('term1', 'term2')),
    work_education TEXT CHECK (work_education IN ('A', 'B', 'C')),
    art_education TEXT CHECK (art_education IN ('A', 'B', 'C')),
    health_physical_education TEXT CHECK (health_physical_education IN ('A', 'B', 'C')),
    discipline TEXT CHECK (discipline IN ('A', 'B', 'C')),
    teacher_remarks TEXT,
    updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_coscholastic UNIQUE (student_id, academic_year, term)
);

CREATE INDEX IF NOT EXISTS idx_term_assessments_student
    ON public.student_term_assessments(tenant_id, student_id, academic_year, term);

ALTER TABLE public.student_term_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_coscholastic_grades ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='student_term_assessments'
          AND policyname='tenant_isolation_on_student_term_assessments') THEN
        CREATE POLICY tenant_isolation_on_student_term_assessments
            ON public.student_term_assessments
            USING (tenant_id = public.current_tenant_id());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='student_coscholastic_grades'
          AND policyname='tenant_isolation_on_student_coscholastic_grades') THEN
        CREATE POLICY tenant_isolation_on_student_coscholastic_grades
            ON public.student_coscholastic_grades
            USING (tenant_id = public.current_tenant_id());
    END IF;
END $$;
