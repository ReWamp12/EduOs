-- ============================================================================
-- EDUOS-129 : Row-level scoping for fee data + guardian linkage
-- ----------------------------------------------------------------------------
-- EDUOS-123 isolated fee_invoices by TENANT only, so any authenticated user in
-- the school — including a parent or a student — could read every other
-- student's fee ledger. This narrows visibility to:
--
--   finance staff (principal / super_admin / hr_manager) → whole tenant
--   student                                              → their own invoices
--   parent / guardian                                    → their children only
--
-- It also hardens the two SECURITY DEFINER money functions, which bypass RLS
-- by design and therefore must authorise their caller explicitly.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Session identity helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT id FROM public.user_profiles
     WHERE auth_user_id = auth.uid() AND status = 'active'
     LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_profile_email()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT lower(email) FROM public.user_profiles
     WHERE auth_user_id = auth.uid() AND status = 'active'
     LIMIT 1;
$$;

/** Staff permitted to operate the fee ledger for the whole school. */
CREATE OR REPLACE FUNCTION public.is_finance_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
         WHERE auth_user_id = auth.uid()
           AND status = 'active'
           AND role IN ('principal', 'super_admin', 'hr_manager')
    );
$$;

/** True when the caller is the student, their guardian, or finance staff. */
CREATE OR REPLACE FUNCTION public.can_view_student_fees(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.is_finance_staff()
        OR EXISTS (
            SELECT 1 FROM public.students s
             WHERE s.id = p_student_id
               AND (
                    s.user_id = public.current_profile_id()             -- the student
                 OR lower(s.parent_email) = public.current_profile_email() -- their guardian
               )
        );
$$;

GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_finance_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_student_fees(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Narrow the fee_invoices policy
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS fee_invoices_isolation ON public.fee_invoices;
DROP POLICY IF EXISTS fee_invoices_scoped ON public.fee_invoices;

CREATE POLICY fee_invoices_scoped ON public.fee_invoices
    FOR ALL
    USING (
        tenant_id = public.current_tenant_id()
        AND public.can_view_student_fees(student_id)
    )
    -- Direct writes stay with finance staff; parents pay through the
    -- collect_fee_payment() function, which authorises them separately.
    WITH CHECK (
        tenant_id = public.current_tenant_id()
        AND public.is_finance_staff()
    );

-- ---------------------------------------------------------------------------
-- 3. Authorise the SECURITY DEFINER money functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.collect_fee_payment(
    p_invoice_id UUID,
    p_method TEXT,
    p_transaction_ref TEXT DEFAULT NULL
)
RETURNS public.fee_invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inv public.fee_invoices;
BEGIN
    -- Serialize concurrent collection attempts on the same invoice.
    SELECT * INTO v_inv
    FROM public.fee_invoices
    WHERE id = p_invoice_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice % not found', p_invoice_id USING ERRCODE = 'P0002';
    END IF;

    -- This function bypasses RLS, so the caller must be authorised here:
    -- same tenant, and either finance staff or the student/guardian billed.
    IF v_inv.tenant_id <> public.current_tenant_id()
       OR NOT public.can_view_student_fees(v_inv.student_id) THEN
        RAISE EXCEPTION 'Not authorised to settle invoice %', v_inv.invoice_number
            USING ERRCODE = '42501';
    END IF;

    IF v_inv.status = 'paid' THEN
        RAISE EXCEPTION 'Invoice % is already paid (receipt %)', v_inv.invoice_number, v_inv.receipt_number
            USING ERRCODE = 'P0001';
    END IF;

    IF v_inv.status = 'cancelled' THEN
        RAISE EXCEPTION 'Invoice % is cancelled and cannot accept payment', v_inv.invoice_number
            USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.fee_invoices
    SET status          = 'paid',
        paid_amount     = amount,
        payment_method  = p_method,
        transaction_ref = COALESCE(p_transaction_ref, 'TXN-' || upper(substr(md5(random()::text), 1, 10))),
        receipt_number  = 'REC-' || to_char(now(), 'YY') || '-' || upper(substr(md5(random()::text), 1, 6)),
        paid_at         = now(),
        updated_at      = now()
    WHERE id = p_invoice_id
    RETURNING * INTO v_inv;

    RETURN v_inv;
END;
$$;

GRANT EXECUTE ON FUNCTION public.collect_fee_payment(UUID, TEXT, TEXT) TO authenticated;

-- Issuing a term bills the whole school roll — finance staff only.
CREATE OR REPLACE FUNCTION public.issue_term_invoices(
    p_batch_name  TEXT,
    p_term_code   TEXT,
    p_title       TEXT,
    p_due_date    DATE,
    p_line_items  JSONB
)
RETURNS TABLE (issued INTEGER, skipped INTEGER, total_amount NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant   UUID;
    v_amount   NUMERIC(10,2);
    v_code     TEXT;
    v_eligible INTEGER;
    v_issued   INTEGER;
BEGIN
    IF NOT public.is_finance_staff() THEN
        RAISE EXCEPTION 'Only finance staff may issue term invoices' USING ERRCODE = '42501';
    END IF;

    v_tenant := public.current_tenant_id();
    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'No tenant context for the current session' USING ERRCODE = 'P0001';
    END IF;

    IF p_line_items IS NULL OR jsonb_array_length(p_line_items) = 0 THEN
        RAISE EXCEPTION 'At least one fee head is required' USING ERRCODE = 'P0001';
    END IF;

    v_code := upper(regexp_replace(coalesce(p_term_code, ''), '[^A-Za-z0-9]', '', 'g'));
    IF v_code = '' THEN
        RAISE EXCEPTION 'A term code is required (e.g. T4)' USING ERRCODE = 'P0001';
    END IF;

    SELECT COALESCE(SUM((item->>'amount')::NUMERIC), 0)
      INTO v_amount
      FROM jsonb_array_elements(p_line_items) AS item;

    IF v_amount <= 0 THEN
        RAISE EXCEPTION 'Fee head amounts must total more than zero' USING ERRCODE = 'P0001';
    END IF;

    WITH roll AS (
        SELECT s.id AS student_id,
               s.tenant_id,
               trim(coalesce(up.first_name, '') || ' ' || coalesce(up.last_name, '')) AS student_name,
               s.roll_number,
               b.name AS batch_name,
               right(s.admission_number, 3) AS short
        FROM public.students s
        JOIN public.user_profiles up ON up.id = s.user_id
        JOIN public.batches b ON b.id = s.batch_id
        WHERE s.tenant_id = v_tenant
          AND b.name = p_batch_name
    ),
    ins AS (
        INSERT INTO public.fee_invoices
            (tenant_id, student_id, student_name, roll_number, batch_name,
             invoice_number, title, amount, due_date, status, paid_amount, line_items)
        SELECT r.tenant_id, r.student_id, r.student_name, r.roll_number, r.batch_name,
               'INV-26-' || r.short || '-' || v_code,
               p_title, v_amount, p_due_date,
               CASE WHEN p_due_date < CURRENT_DATE THEN 'overdue' ELSE 'pending' END,
               0, p_line_items
        FROM roll r
        ON CONFLICT (invoice_number) DO NOTHING
        RETURNING 1
    )
    SELECT (SELECT count(*) FROM roll)::INTEGER, (SELECT count(*) FROM ins)::INTEGER
      INTO v_eligible, v_issued;

    IF v_eligible = 0 THEN
        RAISE EXCEPTION 'No students found on the roll for %', p_batch_name USING ERRCODE = 'P0002';
    END IF;

    RETURN QUERY SELECT v_issued, (v_eligible - v_issued), v_amount;
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_term_invoices(TEXT, TEXT, TEXT, DATE, JSONB) TO authenticated;
