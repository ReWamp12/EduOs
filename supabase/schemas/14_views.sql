-- ============================================================================
-- EduOS Views: Aggregations & Analytics
-- ============================================================================

CREATE OR REPLACE VIEW public.v_student_academic_summary AS
SELECT 
    s.id AS student_id,
    s.tenant_id,
    s.first_name,
    s.last_name,
    s.roll_number,
    b.name AS batch_name,
    COALESCE(AVG(er.marks_obtained), 0)::NUMERIC(5,2) AS average_marks,
    COUNT(DISTINCT a.id) AS total_attendance_marked,
    COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) AS days_present
FROM public.students s
JOIN public.batches b ON s.batch_id = b.id
LEFT JOIN public.exam_results er ON s.id = er.student_id
LEFT JOIN public.attendances a ON s.id = a.student_id
GROUP BY s.id, s.tenant_id, s.first_name, s.last_name, s.roll_number, b.name;

CREATE OR REPLACE VIEW public.v_trial_balance AS
SELECT
    coa.tenant_id,
    coa.account_code,
    coa.account_name,
    coa.account_type,
    coa.current_balance
FROM public.chart_of_accounts coa
ORDER BY coa.account_code;
