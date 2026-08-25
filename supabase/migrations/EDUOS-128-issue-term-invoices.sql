-- ============================================================================
-- EDUOS-128 : Issue a new term's fee invoices for a whole class (ACID)
-- ----------------------------------------------------------------------------
-- Lets the Finance office open an additional installment (e.g. "Term 4") with
-- its own fee heads and due date. The whole class is billed inside ONE
-- transaction: either every student on the roll gets the invoice or none do,
-- so a half-billed class can never be observed.
--
-- Idempotent: invoice_number is UNIQUE and conflicts are skipped, so re-running
-- for a class that was already billed adds only students who joined since.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.issue_term_invoices(
    p_batch_name  TEXT,      -- e.g. 'Class 10 - A'
    p_term_code   TEXT,      -- short code used in the invoice number, e.g. 'T4'
    p_title       TEXT,      -- e.g. 'Term 4 Composite Fee · AY 2026-27'
    p_due_date    DATE,
    p_line_items  JSONB      -- [{"head":"Tuition Fee","amount":12500}, ...]
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
    v_tenant := public.current_tenant_id();
    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'No tenant context for the current session' USING ERRCODE = 'P0001';
    END IF;

    IF p_line_items IS NULL OR jsonb_array_length(p_line_items) = 0 THEN
        RAISE EXCEPTION 'At least one fee head is required' USING ERRCODE = 'P0001';
    END IF;

    -- Normalise the term code so it is safe inside an invoice number.
    v_code := upper(regexp_replace(coalesce(p_term_code, ''), '[^A-Za-z0-9]', '', 'g'));
    IF v_code = '' THEN
        RAISE EXCEPTION 'A term code is required (e.g. T4)' USING ERRCODE = 'P0001';
    END IF;

    -- Total = sum of the supplied heads.
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
