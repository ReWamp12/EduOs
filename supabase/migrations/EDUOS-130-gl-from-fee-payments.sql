-- ============================================================================
-- EDUOS-130 : General Ledger derived from real fee collections
-- ----------------------------------------------------------------------------
-- The GL was a hardcoded client-side array, so it could never agree with the
-- fee ledger. Now every settled invoice posts its own double-entry journal
-- voucher INSIDE the same transaction as the payment: if the voucher cannot
-- be written the payment rolls back, so "cash collected" in the ledger always
-- equals "fees paid" in the register.
--
--   Dr  1001 Cash in Hand      / 1002 Operating Bank Account   (asset  +)
--   Cr  4001 Student Tuition & Composite Fee Income            (income +)
--
-- Also seeds the chart of accounts, backfills vouchers for invoices settled
-- before this migration, and restricts GL visibility to finance staff.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Chart of accounts
-- ---------------------------------------------------------------------------
INSERT INTO public.chart_of_accounts (tenant_id, account_code, account_name, account_type, description)
SELECT t.id, a.code, a.name, a.atype, a.descr
FROM public.tenants t
CROSS JOIN (VALUES
    ('1001', 'Cash in Hand (Counter Cashier)',            'asset',   'Physical cash collected at the fee counter'),
    ('1002', 'Operating Bank Account (HDFC)',             'asset',   'Digital settlements — UPI, card, net banking, cheque, DD'),
    ('1101', 'Fee Receivable',                            'asset',   'Invoiced but uncollected student fees'),
    ('2001', 'Statutory Dues Payable',                    'liability','PF, ESI, PT and TDS withheld pending remittance'),
    ('3001', 'General Fund / Corpus',                     'equity',  'Accumulated institutional surplus'),
    ('4001', 'Student Tuition & Composite Fee Income',    'income',  'Recognised revenue from student fee collections'),
    ('5001', 'Salaries & Staff Cost',                     'expense', 'Gross staff remuneration')
) AS a(code, name, atype, descr)
ON CONFLICT (tenant_id, account_code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Voucher writer — shared by the live payment path and the backfill
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.post_fee_journal(p_invoice public.fee_invoices)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_cash BOOLEAN := coalesce(p_invoice.payment_method, '') ILIKE '%cash%';
    v_code    TEXT;
    v_name    TEXT;
BEGIN
    IF v_is_cash THEN
        v_code := '1001'; v_name := 'Cash in Hand (Counter Cashier)';
    ELSE
        v_code := '1002'; v_name := 'Operating Bank Account (HDFC)';
    END IF;

    INSERT INTO public.journal_entries
        (tenant_id, entry_number, entry_date, description, reference_module, reference_id,
         total_amount, is_posted, line_items)
    VALUES (
        p_invoice.tenant_id,
        'JV-FEE-' || p_invoice.invoice_number,
        COALESCE(p_invoice.paid_at::date, CURRENT_DATE),
        'Fee receipt ' || COALESCE(p_invoice.receipt_number, p_invoice.invoice_number)
            || ' — ' || p_invoice.student_name || ' (' || p_invoice.title || ')',
        'fee_collection',
        p_invoice.invoice_number,
        p_invoice.paid_amount,
        true,
        jsonb_build_array(
            jsonb_build_object('account_code', v_code, 'account_name', v_name,
                               'debit', p_invoice.paid_amount, 'credit', 0,
                               'note', 'Received from ' || p_invoice.student_name
                                       || ' via ' || COALESCE(p_invoice.payment_method, 'counter')),
            jsonb_build_object('account_code', '4001',
                               'account_name', 'Student Tuition & Composite Fee Income',
                               'debit', 0, 'credit', p_invoice.paid_amount,
                               'note', 'Revenue recognised for ' || p_invoice.invoice_number)
        )
    )
    ON CONFLICT (entry_number) DO NOTHING;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Payment posts its own voucher, atomically
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
    SELECT * INTO v_inv FROM public.fee_invoices WHERE id = p_invoice_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice % not found', p_invoice_id USING ERRCODE = 'P0002';
    END IF;

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

    -- Same transaction: the ledger cannot lag behind the collection.
    PERFORM public.post_fee_journal(v_inv);

    RETURN v_inv;
END;
$$;

GRANT EXECUTE ON FUNCTION public.collect_fee_payment(UUID, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Backfill vouchers for invoices settled before this migration
-- ---------------------------------------------------------------------------
DO $$
DECLARE r public.fee_invoices;
BEGIN
    FOR r IN SELECT * FROM public.fee_invoices WHERE status = 'paid' ORDER BY invoice_number LOOP
        PERFORM public.post_fee_journal(r);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Trial balance straight from the posted vouchers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_trial_balance AS
SELECT je.tenant_id,
       li->>'account_code'                        AS account_code,
       li->>'account_name'                        AS account_name,
       SUM((li->>'debit')::NUMERIC)               AS total_debit,
       SUM((li->>'credit')::NUMERIC)              AS total_credit
FROM public.journal_entries je
CROSS JOIN LATERAL jsonb_array_elements(je.line_items) AS li
WHERE je.is_posted
GROUP BY je.tenant_id, li->>'account_code', li->>'account_name';

-- ---------------------------------------------------------------------------
-- 6. The GL is finance-staff-only (a parent must never read the school books)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS journal_entries_isolation ON public.journal_entries;
DROP POLICY IF EXISTS journal_entries_finance_only ON public.journal_entries;
CREATE POLICY journal_entries_finance_only ON public.journal_entries
    FOR ALL
    USING (tenant_id = public.current_tenant_id() AND public.is_finance_staff())
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_finance_staff());

DROP POLICY IF EXISTS chart_of_accounts_isolation ON public.chart_of_accounts;
DROP POLICY IF EXISTS chart_of_accounts_finance_only ON public.chart_of_accounts;
CREATE POLICY chart_of_accounts_finance_only ON public.chart_of_accounts
    FOR ALL
    USING (tenant_id = public.current_tenant_id() AND public.is_finance_staff())
    WITH CHECK (tenant_id = public.current_tenant_id() AND public.is_finance_staff());
