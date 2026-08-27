-- ============================================================================
-- EduOS Schema: Daily & Period Attendance Engine with Audit Trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_attendance_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
    morning_cutoff_time TIME DEFAULT '09:00:00' NOT NULL,
    notify_parents_on_absent BOOLEAN DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    period_number INT,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half_day', 'excused')),
    marked_by UUID NOT NULL REFERENCES public.user_profiles(id),
    updated_by UUID REFERENCES public.user_profiles(id),
    remarks TEXT,
    source TEXT DEFAULT 'manual_teacher' CHECK (source IN ('manual_teacher', 'biometric_rfid', 'qr_scanner', 'admin_override')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL,
    CONSTRAINT uq_attendance_entry UNIQUE NULLS NOT DISTINCT (tenant_id, student_id, date, period_number)
);

CREATE TABLE IF NOT EXISTS public.attendance_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    attendance_id UUID NOT NULL REFERENCES public.attendances(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.user_profiles(id),
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.attendance_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    attendance_id UUID NOT NULL REFERENCES public.attendances(id) ON DELETE CASCADE,
    channel TEXT DEFAULT 'sms' CHECK (channel IN ('sms', 'whatsapp', 'email', 'push')),
    recipient_phone TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
