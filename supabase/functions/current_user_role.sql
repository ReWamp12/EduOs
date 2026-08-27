-- ============================================================================
-- EduOS Function: current_user_role()
-- Returns the role of the currently authenticated user
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.user_profiles 
        WHERE auth_user_id = auth.uid() 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
