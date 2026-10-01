-- ============================================================================
-- EduOS · Daily School Diary (Gap 1)
-- One row per (batch, subject, day): what was taught + what is due tomorrow.
-- Lightweight counterpart to the graded `assignments` module.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daily_class_diaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    diary_date DATE NOT NULL DEFAULT CURRENT_DATE,
    classwork_text TEXT NOT NULL,
    homework_text TEXT,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_diary_batch_subject_date UNIQUE (tenant_id, batch_id, subject_id, diary_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_diary_batch_date
    ON public.daily_class_diaries(tenant_id, batch_id, diary_date DESC);

ALTER TABLE public.daily_class_diaries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='daily_class_diaries'
          AND policyname='tenant_isolation_on_daily_class_diaries') THEN
        CREATE POLICY tenant_isolation_on_daily_class_diaries
            ON public.daily_class_diaries
            USING (tenant_id = public.current_tenant_id());
    END IF;
END $$;
