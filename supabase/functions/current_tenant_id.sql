-- ============================================================================
-- EduOS Function: current_tenant_id()
-- Returns the active tenant UUID from session or auth.uid() profile lookup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN (
        SELECT tenant_id 
        FROM public.user_profiles 
        WHERE auth_user_id = auth.uid() 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
