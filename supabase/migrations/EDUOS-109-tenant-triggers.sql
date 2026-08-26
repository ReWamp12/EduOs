-- EDUOS-109: Ensure all persistent domain tables have tenant auto-fill triggers

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_attendances_set_tenant') THEN
    CREATE TRIGGER trg_attendances_set_tenant BEFORE INSERT ON public.attendances
    FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fee_structures_set_tenant') THEN
    CREATE TRIGGER trg_fee_structures_set_tenant BEFORE INSERT ON public.fee_structures
    FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fee_invoices_set_tenant') THEN
    CREATE TRIGGER trg_fee_invoices_set_tenant BEFORE INSERT ON public.fee_invoices
    FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_lms_courses_set_tenant') THEN
    CREATE TRIGGER trg_lms_courses_set_tenant BEFORE INSERT ON public.lms_courses
    FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_leave_requests_set_tenant') THEN
    CREATE TRIGGER trg_leave_requests_set_tenant BEFORE INSERT ON public.leave_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_session();
  END IF;
END
$$;
