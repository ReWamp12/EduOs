-- ============================================================================
-- EduOS Procedure: collect_fee_payment()
-- ACID collection of fee payment, invoice balance update, and receipt generation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.collect_fee_payment(
    p_invoice_id UUID,
    p_amount NUMERIC,
    p_payment_mode TEXT,
    p_payment_ref TEXT,
    p_collected_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
    v_inv RECORD;
    v_tenant_id UUID;
    v_new_paid NUMERIC;
    v_receipt TEXT;
BEGIN
    -- 1. Lock invoice row for update
    SELECT * INTO v_inv FROM public.fee_invoices WHERE id = p_invoice_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found: %', p_invoice_id;
    END IF;

    v_tenant_id := v_inv.tenant_id;
    v_new_paid := v_inv.paid_amount + p_amount;
    v_receipt := 'REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::text, 1, 6);

    -- 2. Update fee invoice status
    UPDATE public.fee_invoices
    SET 
        paid_amount = v_new_paid,
        status = CASE WHEN v_new_paid >= total_amount THEN 'paid' ELSE 'partially_paid' END,
        payment_mode = p_payment_mode,
        payment_reference = p_payment_ref,
        receipt_number = v_receipt,
        paid_at = NOW(),
        updated_at = NOW()
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object(
        'success', true,
        'invoice_id', p_invoice_id,
        'paid_amount', v_new_paid,
        'receipt_number', v_receipt
    );
END;
$$;
