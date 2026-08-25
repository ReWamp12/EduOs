-- ============================================================================
-- EDUOS-107 : HR table RLS completion
-- ----------------------------------------------------------------------------
-- employee_records and job_openings had RLS ENABLED but NO policy. With RLS on
-- and no policy, Postgres denies every row to non-superusers, so the HR portal
-- (which reads through the Supabase anon key + user JWT) saw an empty Staff
-- Service Books register and an empty Careers board — even though rows existed.
--
-- This adds the same tenant-isolation policy the sibling HR tables already use
-- (employee_service_records, training_records, applicants):
--     tenant_id = current_tenant_id()
-- current_tenant_id() resolves the caller's tenant from their active
-- user_profiles row, so a signed-in HR manager sees exactly their school's
-- staff and postings and nothing from other tenants.
--
-- Idempotent: safe to re-run.
-- ============================================================================

ALTER TABLE public.employee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_openings     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_on_employee_records ON public.employee_records;
CREATE POLICY tenant_isolation_on_employee_records ON public.employee_records
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_on_job_openings ON public.job_openings;
CREATE POLICY tenant_isolation_on_job_openings ON public.job_openings
  FOR ALL
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());
