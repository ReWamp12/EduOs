-- ============================================================================
-- EDUOS-108 : mark_attendance() caller integrity
-- ----------------------------------------------------------------------------
-- mark_attendance() is SECURITY DEFINER, so it runs with the privileges of its
-- owner and RLS never applies to it. Its authorisation therefore has to be
-- self-contained -- and it was not: it resolved the acting teacher from the
-- client-supplied p_caller_id argument and looked the role up from *that* row,
-- never checking it against auth.uid().
--
-- Verified against the live database before this migration, signed in as a
-- student (ayush.kumar):
--
--   honest call  (p_caller_id => NULL)
--     ERROR 42501: Permission denied. Teacher d227296a... does not teach
--                  period 2 for batch 21cf1f85... on day 2.
--
--   spoofed call (p_caller_id => the class mentor's profile UUID)
--     {"success": true, "total": 1, "failed": 0}
--
-- The register is a statutory record, so a student writing it as their mentor
-- is the most serious defect found in EDUOS-108. Compounding it, EXECUTE was
-- granted to anon and PUBLIC, making the same write reachable with no session
-- at all.
--
-- The fix keeps the function signature (the frontend and the NestJS proxy both
-- pass p_caller_id) but demotes that argument from an identity claim to an
-- assertion that must agree with the session:
--
--   * the acting profile is always resolved from auth.uid()
--   * a non-NULL p_caller_id that disagrees is rejected outright
--   * an absent session is rejected, except for a trusted server connection
--     (postgres / service_role), which is the only context entitled to name a
--     caller it has already authenticated itself
--
-- Idempotent: safe to re-run.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_attendance(
    p_batch_id      UUID,
    p_date          DATE,
    p_period_number INT,
    p_records       JSONB,
    p_caller_id     UUID DEFAULT NULL,
    p_caller_role   TEXT DEFAULT NULL,
    p_reason        TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
    DECLARE
      v_tenant_id UUID;
      v_mentor_id UUID;
      v_slot_teacher_id UUID;
      v_dow INT;
      v_rec JSONB;
      v_student_id UUID;
      v_status TEXT;
      v_remarks TEXT;
      v_is_medical BOOLEAN;
      v_existing_id UUID;
      v_existing_status TEXT;
      v_att_id UUID;
      v_total INT := 0;
      v_notified INT := 0;
      v_skipped INT := 0;
      v_failed INT := 0;
      v_resolved_caller_id UUID;
      v_resolved_caller_role TEXT;
      v_student_batch UUID;
      v_is_trusted_server BOOLEAN;
    BEGIN
      -- ---------------------------------------------------------------------
      -- 0. Establish WHO is calling. This block is the security boundary; the
      --    rest of the function trusts v_resolved_caller_id completely.
      --
      --    NOT current_user: inside a SECURITY DEFINER function current_user is
      --    the function's owner, so it reports 'postgres' for every caller
      --    including anon -- which would hand the impersonation path straight
      --    back. session_user is equally useless here (PostgREST logs in as a
      --    single shared 'authenticator' role for anon and signed-in traffic
      --    alike). The JWT role claim is the only value that actually varies
      --    with the caller, so the trusted-server path is keyed to it and
      --    nothing else.
      -- ---------------------------------------------------------------------
      v_is_trusted_server := COALESCE(
          NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
          ''
      ) = 'service_role';

      SELECT id, role, tenant_id
        INTO v_resolved_caller_id, v_resolved_caller_role, v_tenant_id
        FROM public.user_profiles
       WHERE auth_user_id = auth.uid()
         AND status = 'active';

      IF v_resolved_caller_id IS NULL THEN
        -- No end-user session. Only a server connection that has done its own
        -- authentication may name the acting teacher.
        IF NOT v_is_trusted_server OR p_caller_id IS NULL THEN
          RAISE EXCEPTION 'Permission denied. Attendance can only be marked by a signed-in member of staff.'
            USING ERRCODE = '42501';
        END IF;

        SELECT id, role, tenant_id
          INTO v_resolved_caller_id, v_resolved_caller_role, v_tenant_id
          FROM public.user_profiles
         WHERE id = p_caller_id
           AND status = 'active';

        IF v_resolved_caller_id IS NULL THEN
          RAISE EXCEPTION 'Permission denied. Acting profile % is not an active account.', p_caller_id
            USING ERRCODE = '42501';
        END IF;

      ELSIF p_caller_id IS NOT NULL AND p_caller_id <> v_resolved_caller_id THEN
        -- A session is present and the client claimed to be somebody else.
        RAISE EXCEPTION 'Permission denied. Attendance cannot be marked on behalf of another user.'
          USING ERRCODE = '42501';
      END IF;

      -- p_caller_role is likewise advisory only; the authoritative role is the
      -- one just read from the profile row.
      IF v_resolved_caller_role NOT IN ('teacher', 'principal', 'super_admin') THEN
        RAISE EXCEPTION 'Permission denied. Role % may not mark attendance.', COALESCE(v_resolved_caller_role, 'unknown')
          USING ERRCODE = '42501';
      END IF;

      -- 1. Reject future dates
      IF p_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot mark attendance for a future date (%)', p_date
          USING ERRCODE = '22000';
      END IF;

      -- 2. Backdating window check (3 days window)
      IF p_date < (CURRENT_DATE - INTERVAL '3 days') THEN
        IF v_resolved_caller_role NOT IN ('principal', 'super_admin') THEN
          RAISE EXCEPTION 'Backdating beyond 3 days requires Principal approval. Caller role % is unauthorized.', v_resolved_caller_role
            USING ERRCODE = '42501';
        END IF;
        IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
          RAISE EXCEPTION 'A non-empty reason is required for backdated attendance entry.'
            USING ERRCODE = '22000';
        END IF;
      END IF;

      -- 3. Holiday / Sunday check
      v_dow := EXTRACT(DOW FROM p_date);
      IF v_dow = 0 THEN
        RAISE EXCEPTION 'Cannot mark attendance on Sunday / declared holiday (%)', p_date
          USING ERRCODE = '22000';
      END IF;

      -- 4. Batch + timetable permission check
      SELECT tenant_id, mentor_teacher_id INTO v_tenant_id, v_mentor_id
      FROM public.batches WHERE id = p_batch_id;

      IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Batch % not found.', p_batch_id USING ERRCODE = '22000';
      END IF;

      -- Cross-tenant guard: the acting profile must belong to the batch's tenant.
      IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
         WHERE id = v_resolved_caller_id AND tenant_id = v_tenant_id
      ) THEN
        RAISE EXCEPTION 'Permission denied. Batch % belongs to another institution.', p_batch_id
          USING ERRCODE = '42501';
      END IF;

      SELECT teacher_id INTO v_slot_teacher_id
      FROM public.timetables
      WHERE batch_id = p_batch_id
        AND period_number = p_period_number
        AND day_of_week = v_dow;

      IF v_resolved_caller_role NOT IN ('principal', 'super_admin') THEN
        IF v_resolved_caller_id != v_mentor_id AND (v_slot_teacher_id IS NULL OR v_resolved_caller_id != v_slot_teacher_id) THEN
          RAISE EXCEPTION 'Permission denied. Teacher % does not teach period % for batch % on day %.',
            v_resolved_caller_id, p_period_number, p_batch_id, v_dow
            USING ERRCODE = '42501';
        END IF;
      END IF;

      -- 5. Process each student record
      FOR v_rec IN SELECT * FROM jsonb_array_elements(p_records)
      LOOP
        v_student_id := (v_rec->>'student_id')::UUID;
        v_status := LOWER(TRIM(v_rec->>'status'));
        v_remarks := v_rec->>'remarks';
        v_is_medical := COALESCE((v_rec->>'is_excused_medical')::BOOLEAN, (v_status = 'medical' OR v_status = 'excused'));

        SELECT batch_id INTO v_student_batch FROM public.students WHERE id = v_student_id;
        IF v_student_batch IS NULL OR v_student_batch != p_batch_id THEN
          v_failed := v_failed + 1;
          CONTINUE;
        END IF;

        v_total := v_total + 1;

        SELECT id, status INTO v_existing_id, v_existing_status
        FROM public.attendances
        WHERE student_id = v_student_id
          AND batch_id = p_batch_id
          AND date = p_date
          AND period_number = p_period_number;

        IF v_existing_id IS NOT NULL THEN
          IF v_existing_status != v_status THEN
            INSERT INTO public.attendance_change_log (
              attendance_id, previous_status, new_status, changed_by, changed_at, reason
            ) VALUES (
              v_existing_id, v_existing_status, v_status, v_resolved_caller_id, NOW(), p_reason
            );

            UPDATE public.attendances
            SET status = v_status,
                remarks = v_remarks,
                is_excused_medical = v_is_medical,
                updated_at = NOW(),
                updated_by = v_resolved_caller_id
            WHERE id = v_existing_id;

            IF v_status IN ('absent', 'late', 'excused', 'medical') THEN
              IF NOT EXISTS (
                SELECT 1 FROM public.attendance_notifications
                WHERE attendance_id = v_existing_id AND notified_status = v_status
              ) THEN
                INSERT INTO public.attendance_notifications (
                  attendance_id, notified_status, sent_at, delivery_status
                ) VALUES (
                  v_existing_id, v_status, NOW(), 'sent'
                );
                v_notified := v_notified + 1;
              ELSE
                v_skipped := v_skipped + 1;
              END IF;
            END IF;
          ELSE
            v_skipped := v_skipped + 1;
          END IF;
        ELSE
          INSERT INTO public.attendances (
            id, tenant_id, student_id, batch_id, date, period_number,
            status, is_excused_medical, marked_by, remarks, created_at
          ) VALUES (
            gen_random_uuid(), v_tenant_id, v_student_id, p_batch_id, p_date, p_period_number,
            v_status, v_is_medical, v_resolved_caller_id, v_remarks, NOW()
          ) RETURNING id INTO v_att_id;

          INSERT INTO public.attendance_change_log (
            attendance_id, previous_status, new_status, changed_by, changed_at, reason
          ) VALUES (
            v_att_id, NULL, v_status, v_resolved_caller_id, NOW(), p_reason
          );

          IF v_status IN ('absent', 'late', 'excused', 'medical') THEN
            INSERT INTO public.attendance_notifications (
              attendance_id, notified_status, sent_at, delivery_status
            ) VALUES (
              v_att_id, v_status, NOW(), 'sent'
            );
            v_notified := v_notified + 1;
          END IF;
        END IF;
      END LOOP;

      RETURN jsonb_build_object(
        'success', true,
        'total', v_total,
        'notified', v_notified,
        'skipped_unchanged', v_skipped,
        'failed', v_failed,
        'marked_by', v_resolved_caller_id
      );
    END;
$function$;

-- ---------------------------------------------------------------------------
-- get_attendance_defaulters() is also SECURITY DEFINER and previously returned
-- any batch's shortfall list to any caller, signed in or not. Its result shape
-- is consumed by the teacher attendance register and is left untouched; only
-- the authorisation guard is added, reusing the EDUOS-108 helpers so the rule
-- has a single definition.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_attendance_defaulters(
    p_batch_id   UUID,
    p_start_date DATE DEFAULT '2026-06-01'::date,
    p_end_date   DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    student_id UUID,
    roll_number INTEGER,
    admission_number TEXT,
    student_name TEXT,
    total_days INTEGER,
    present_days INTEGER,
    absent_days INTEGER,
    excused_medical_days INTEGER,
    attendance_pct NUMERIC,
    threshold_pct NUMERIC,
    is_defaulter BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
    DECLARE
      v_tenant_id UUID;
      v_threshold NUMERIC;
      v_min_periods INT;
    BEGIN
      IF NOT (public.is_admin_staff() OR public.teacher_teaches_batch(p_batch_id)) THEN
        RAISE EXCEPTION 'Permission denied. You do not hold batch %.', p_batch_id
          USING ERRCODE = '42501';
      END IF;

      SELECT tenant_id INTO v_tenant_id FROM public.batches WHERE id = p_batch_id;

      SELECT shortage_threshold_percent, daily_rollup_min_periods_present
      INTO v_threshold, v_min_periods
      FROM public.tenant_attendance_config
      WHERE tenant_id = v_tenant_id;

      IF v_threshold IS NULL THEN
        v_threshold := 75.00;
        v_min_periods := 1;
      END IF;

      RETURN QUERY
      WITH daily_student_status AS (
        SELECT
          a.student_id,
          a.date,
          COUNT(*) as total_periods_recorded,
          BOOL_OR(COALESCE(a.is_excused_medical, false)) as had_medical,
          COUNT(*) FILTER (WHERE a.status = 'present') as periods_present
        FROM public.attendances a
        WHERE a.batch_id = p_batch_id
          AND a.date BETWEEN p_start_date AND p_end_date
        GROUP BY a.student_id, a.date
      ),
      student_rollups AS (
        SELECT
          d.student_id,
          COUNT(DISTINCT d.date)::INT as total_school_days,
          COUNT(DISTINCT d.date) FILTER (
            WHERE (d.periods_present >= LEAST(v_min_periods, d.total_periods_recorded)) AND NOT d.had_medical
          )::INT as present_count,
          COUNT(DISTINCT d.date) FILTER (
            WHERE (d.periods_present < LEAST(v_min_periods, d.total_periods_recorded)) AND NOT d.had_medical
          )::INT as absent_count,
          COUNT(DISTINCT d.date) FILTER (WHERE d.had_medical)::INT as medical_count
        FROM daily_student_status d
        GROUP BY d.student_id
      )
      SELECT
        s.id::UUID as student_id,
        s.roll_number::INT as roll_number,
        COALESCE(s.admission_number, '')::TEXT as admission_number,
        TRIM(u.first_name || ' ' || COALESCE(u.last_name, ''))::TEXT as student_name,
        COALESCE(r.total_school_days, 0)::INT as total_days,
        COALESCE(r.present_count, 0)::INT as present_days,
        COALESCE(r.absent_count, 0)::INT as absent_days,
        COALESCE(r.medical_count, 0)::INT as excused_medical_days,
        CASE
          WHEN (COALESCE(r.total_school_days, 0) - COALESCE(r.medical_count, 0)) > 0 THEN
            ROUND((COALESCE(r.present_count, 0)::NUMERIC / (r.total_school_days - r.medical_count)::NUMERIC) * 100, 2)::NUMERIC
          ELSE 100.00::NUMERIC
        END as attendance_pct,
        v_threshold::NUMERIC as threshold_pct,
        CASE
          WHEN (COALESCE(r.total_school_days, 0) - COALESCE(r.medical_count, 0)) > 0 THEN
            (ROUND((COALESCE(r.present_count, 0)::NUMERIC / (r.total_school_days - r.medical_count)::NUMERIC) * 100, 2) < v_threshold)::BOOLEAN
          ELSE FALSE::BOOLEAN
        END as is_defaulter
      FROM public.students s
      JOIN public.user_profiles u ON s.user_id = u.id
      LEFT JOIN student_rollups r ON s.id = r.student_id
      WHERE s.batch_id = p_batch_id
      ORDER BY s.roll_number;
    END;
$function$;

-- ---------------------------------------------------------------------------
-- Neither function has any business being reachable without a session.
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.mark_attendance(UUID, DATE, INT, JSONB, UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_attendance_defaulters(UUID, DATE, DATE)               FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.mark_attendance(UUID, DATE, INT, JSONB, UUID, TEXT, TEXT)
    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_attendance_defaulters(UUID, DATE, DATE)
    TO authenticated, service_role;
