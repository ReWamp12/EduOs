-- ============================================================================
-- EDUOS-125 : ACID Fee Collection RPC + Deterministic Term-Fee Seed
-- ----------------------------------------------------------------------------
-- 1. collect_fee_payment(): atomic (row-locked, single-transaction) fee
--    collection — validates state, stamps receipt/txn, marks paid. Every
--    Postgres function body runs inside one transaction, so a partial
--    update can never be observed (ACID).
-- 2. Seeds one fee structure + 3 term invoices per enrolled student for
--    AY 2026-27, derived entirely from live `students` rows (no fixtures).
--    Idempotent: unique invoice_number + ON CONFLICT DO NOTHING.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Atomic fee collection
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

-- RLS still governs the caller: fee_invoices has FORCE ROW LEVEL SECURITY,
-- and current_tenant_id() resolves from the calling request's JWT, so a
-- session can only ever collect invoices inside its own tenant.
GRANT EXECUTE ON FUNCTION public.collect_fee_payment(UUID, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Fee structure blueprint (Class 10, AY 2026-27)
-- ---------------------------------------------------------------------------
INSERT INTO public.fee_structures (tenant_id, class_name, academic_year, name, fee_heads, total_annual_amount, installment_scheme)
SELECT t.id,
       'Class 10 - A',
       '2026-2027',
       'Class 10 CBSE Composite Fee Schedule',
       '[{"name":"Tuition Fee","category":"academic","amount":12500,"frequency":"term"},
         {"name":"Science Lab & Computer Fee","category":"facility","amount":1500,"frequency":"term"},
         {"name":"Examination Fee","category":"academic","amount":1200,"frequency":"term"},
         {"name":"Library & Resources","category":"facility","amount":800,"frequency":"term"},
         {"name":"Sports & Activity Fee","category":"cocurricular","amount":1000,"frequency":"term"}]'::jsonb,
       51000,
       'quarterly'
FROM public.tenants t
WHERE t.name = 'Modern Public School'
  AND NOT EXISTS (
      SELECT 1 FROM public.fee_structures fs
      WHERE fs.tenant_id = t.id AND fs.class_name = 'Class 10 - A' AND fs.academic_year = '2026-2027'
  );

-- ---------------------------------------------------------------------------
-- 3. Term invoices for every enrolled student (deterministic mid-session
--    ledger: T1 paid · T2 overdue for every 3rd roll · T3 pending except
--    every 5th roll prepaid). Derived from live rows, never from fixtures.
-- ---------------------------------------------------------------------------
WITH roll AS (
    SELECT s.id AS student_id,
           s.tenant_id,
           trim(coalesce(up.first_name, '') || ' ' || coalesce(up.last_name, '')) AS student_name,
           s.roll_number,
           b.name AS batch_name,
           right(s.admission_number, 3) AS short,
           NULLIF(regexp_replace(s.roll_number, '\D', '', 'g'), '')::int AS roll_int
    FROM public.students s
    JOIN public.user_profiles up ON up.id = s.user_id
    JOIN public.batches b ON b.id = s.batch_id
),
line_items AS (
    SELECT '[{"head":"Tuition Fee","amount":12500},
             {"head":"Science Lab & Computer Fee","amount":1500},
             {"head":"Examination Fee","amount":1200},
             {"head":"Library & Resources","amount":800},
             {"head":"Sports & Activity Fee","amount":1000}]'::jsonb AS items
),
terms AS (
    SELECT 1 AS n, DATE '2026-04-15' AS due UNION ALL
    SELECT 2, DATE '2026-07-15' UNION ALL
    SELECT 3, DATE '2026-10-15'
)
INSERT INTO public.fee_invoices
    (tenant_id, student_id, student_name, roll_number, batch_name, invoice_number,
     title, amount, due_date, status, paid_amount, payment_method, transaction_ref,
     receipt_number, paid_at, line_items)
SELECT r.tenant_id,
       r.student_id,
       r.student_name,
       r.roll_number,
       r.batch_name,
       'INV-26-' || r.short || '-T' || t.n,
       'Term ' || t.n || ' Composite Fee · AY 2026-27',
       17000,
       t.due,
       CASE
           WHEN t.n = 1 THEN 'paid'
           WHEN t.n = 2 AND r.roll_int % 3 = 0 THEN 'overdue'
           WHEN t.n = 2 THEN 'paid'
           WHEN t.n = 3 AND r.roll_int % 5 = 0 THEN 'paid'
           ELSE 'pending'
       END,
       CASE
           WHEN t.n = 1 OR (t.n = 2 AND r.roll_int % 3 <> 0) OR (t.n = 3 AND r.roll_int % 5 = 0)
           THEN 17000 ELSE 0
       END,
       CASE
           WHEN t.n = 1 OR (t.n = 2 AND r.roll_int % 3 <> 0) OR (t.n = 3 AND r.roll_int % 5 = 0)
           THEN (CASE WHEN r.roll_int % 2 = 0 THEN 'UPI' ELSE 'Card' END)
       END,
       CASE
           WHEN t.n = 1 OR (t.n = 2 AND r.roll_int % 3 <> 0) OR (t.n = 3 AND r.roll_int % 5 = 0)
           THEN 'TXN-' || r.short || t.n || r.roll_int
       END,
       CASE
           WHEN t.n = 1 OR (t.n = 2 AND r.roll_int % 3 <> 0) OR (t.n = 3 AND r.roll_int % 5 = 0)
           THEN 'REC-26-' || r.short || t.n
       END,
       CASE
           WHEN t.n = 1 THEN TIMESTAMPTZ '2026-04-10 10:30:00+05:30'
           WHEN t.n = 2 AND r.roll_int % 3 <> 0 THEN TIMESTAMPTZ '2026-07-08 11:00:00+05:30'
           WHEN t.n = 3 AND r.roll_int % 5 = 0 THEN TIMESTAMPTZ '2026-08-20 09:45:00+05:30'
       END,
       li.items
FROM roll r
CROSS JOIN terms t
CROSS JOIN line_items li
WHERE r.roll_int IS NOT NULL
ON CONFLICT (invoice_number) DO NOTHING;
