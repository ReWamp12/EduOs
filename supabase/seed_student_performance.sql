-- ============================================================================
-- EduOS Seed: Student Academic Performance, Assessments, Assignments & Remarks
-- Connected to Tenant: Greenfield International Academy (Class 10 - Section A)
-- Strictly adhering to EduOS_Current_System_Updates.md (EDUOS-113)
-- ============================================================================

BEGIN;

-- 1. ASSESSMENTS / TESTS
INSERT INTO public.exams (id, tenant_id, batch_id, subject_id, created_by, title, exam_type, total_marks, duration_minutes, exam_date, is_published)
VALUES
  -- Mathematics Assessments
  ('e1000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Real Numbers — Chapter 1 Test', 'unit_test', 100, 60, '2026-07-30', true),
  ('e1000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Polynomials — Chapter 2 Test', 'unit_test', 100, 60, '2026-08-14', true),
  ('e1000000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Linear Equations — Chapter 3 Test', 'unit_test', 100, 60, '2026-08-30', true),
  ('e1000000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Mid-Term Algebra Diagnostic', 'term_exam', 100, 90, '2026-09-08', true),
  -- Physics Assessments
  ('e1000000-0000-0000-0000-000000000005', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000003', 'Light & Reflection Lab Quiz', 'quiz', 50, 45, '2026-08-10', true),
  ('e1000000-0000-0000-0000-000000000006', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000003', 'Electricity Fundamentals Test', 'unit_test', 100, 60, '2026-09-05', true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  total_marks = EXCLUDED.total_marks,
  exam_date = EXCLUDED.exam_date,
  is_published = EXCLUDED.is_published;

-- 2. ASSESSMENT RESULTS (Establishing progression trend: 62% -> 68% -> 74% -> 82%, Improving)
INSERT INTO public.exam_results (id, exam_id, student_id, graded_by, marks_obtained, feedback)
VALUES
  -- Test 1 (Real Numbers)
  ('ea000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 62.00, 'Understood basic concepts; calculation mistakes in irrational proofs.'),
  ('ea000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 76.00, 'Good effort on lemma steps.'),
  ('ea000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 45.00, 'Needs academic attention on fundamental arithmetic.'),
  ('ea000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002', 95.00, 'Outstanding work.'),
  ('ea000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 88.00, 'Very solid work.'),

  -- Test 2 (Polynomials)
  ('ea000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000002', 'a7000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 68.00, 'Clear improvement in quadratic zeros calculation.'),
  ('ea000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000002', 'a7000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 78.00, 'Steady progression.'),
  ('ea000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000002', 'a7000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 48.00, 'Struggling with coefficient formulas.'),
  ('ea000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000002', 'a7000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002', 92.00, 'Consistently high grasp.'),
  ('ea000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000002', 'a7000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 86.00, 'Strong algebra reasoning.'),

  -- Test 3 (Linear Equations)
  ('ea000000-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000003', 'a7000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 74.00, 'Good grasp of graphical & elimination methods.'),
  ('ea000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000003', 'a7000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 80.00, 'Very disciplined work.'),
  ('ea000000-0000-0000-0000-000000000013', 'e1000000-0000-0000-0000-000000000003', 'a7000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 51.00, 'Marginal pass, attendance impact visible.'),
  ('ea000000-0000-0000-0000-000000000014', 'e1000000-0000-0000-0000-000000000003', 'a7000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002', 96.00, 'Flawless graphical plotting.'),

  -- Test 4 (Mid-Term Diagnostic)
  ('ea000000-0000-0000-0000-000000000015', 'e1000000-0000-0000-0000-000000000004', 'a7000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 82.00, 'Strong upward trend from 62 to 82. Excellent effort!'),
  ('ea000000-0000-0000-0000-000000000016', 'e1000000-0000-0000-0000-000000000004', 'a7000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 84.00, 'Consistent top-quartile performance.'),
  ('ea000000-0000-0000-0000-000000000017', 'e1000000-0000-0000-0000-000000000004', 'a7000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 54.00, 'Needs remedial sessions.'),
  ('ea000000-0000-0000-0000-000000000018', 'e1000000-0000-0000-0000-000000000004', 'a7000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002', 94.00, 'Exemplary problem-solving speed.'),

  -- Physics Test Results
  ('ea000000-0000-0000-0000-000000000019', 'e1000000-0000-0000-0000-000000000005', 'a7000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000003', 42.00, 'Good ray diagram precision (42/50).'),
  ('ea000000-0000-0000-0000-000000000020', 'e1000000-0000-0000-0000-000000000006', 'a7000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000003', 79.00, 'Clear understanding of Ohm''s law circuit problems.')
ON CONFLICT (exam_id, student_id) DO UPDATE SET
  marks_obtained = EXCLUDED.marks_obtained,
  feedback = EXCLUDED.feedback;

-- 3. ASSIGNMENTS
INSERT INTO public.assignments (id, tenant_id, batch_id, subject_id, teacher_id, title, description, due_date, max_marks)
VALUES
  ('ac000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'NCERT Ex 1.2 — Real Numbers HCF/LCM', 'Solve all questions from Exercise 1.2 on homework notebook.', '2026-07-25 18:00:00+05:30', 50),
  ('ac000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Polynomials Graph Worksheet', 'Plot roots of given 5 quadratic polynomials on graph paper.', '2026-08-08 18:00:00+05:30', 50),
  ('ac000000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Linear Equations Word Problem Set', '10 speed and upstream/downstream problems.', '2026-08-25 18:00:00+05:30', 50),
  ('ac000000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000003', 'Ray Diagram Practice Sheet', 'Draw convex and concave mirror ray diagrams for 6 positions.', '2026-08-05 18:00:00+05:30', 50),
  ('ac000000-0000-0000-0000-000000000005', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000003', 'Ohm''s Law Numerical Circuit Problems', 'Equivalent resistance of series & parallel combination circuits.', '2026-09-02 18:00:00+05:30', 50)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  due_date = EXCLUDED.due_date;

-- 4. ASSIGNMENT SUBMISSIONS (Temporarily disable grading guard trigger during system seed)
ALTER TABLE public.assignment_submissions DISABLE TRIGGER guard_submission_grading;

INSERT INTO public.assignment_submissions (id, assignment_id, student_id, status, marks_obtained, feedback, submitted_at, graded_by, graded_at)
VALUES
  -- Rohan Mehta: 5 submitted/graded out of 5 (100% completion)
  ('ab000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000003', 'graded', 46, 'Well written proof steps.', '2026-07-24 15:30:00+05:30', 'a2000000-0000-0000-0000-000000000002', '2026-07-26 11:00:00+05:30'),
  ('ab000000-0000-0000-0000-000000000002', 'ac000000-0000-0000-0000-000000000002', 'a7000000-0000-0000-0000-000000000003', 'graded', 45, 'Neat axis scaling.', '2026-08-07 16:00:00+05:30', 'a2000000-0000-0000-0000-000000000002', '2026-08-09 12:00:00+05:30'),
  ('ab000000-0000-0000-0000-000000000003', 'ac000000-0000-0000-0000-000000000003', 'a7000000-0000-0000-0000-000000000003', 'submitted', NULL, NULL, '2026-08-24 17:15:00+05:30', NULL, NULL),
  ('ab000000-0000-0000-0000-000000000004', 'ac000000-0000-0000-0000-000000000004', 'a7000000-0000-0000-0000-000000000003', 'graded', 48, 'Clear arrows and labels.', '2026-08-04 14:20:00+05:30', 'a2000000-0000-0000-0000-000000000003', '2026-08-06 14:00:00+05:30'),
  ('ab000000-0000-0000-0000-000000000005', 'ac000000-0000-0000-0000-000000000005', 'a7000000-0000-0000-0000-000000000003', 'submitted', NULL, NULL, '2026-09-01 18:00:00+05:30', NULL, NULL),

  -- Diya Verma: submitted only 2 out of 5 (40% completion - triggers Incomplete Work indicator < 60%)
  ('ab000000-0000-0000-0000-000000000006', 'ac000000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000004', 'graded', 30, 'Incomplete working.', '2026-07-26 10:00:00+05:30', 'a2000000-0000-0000-0000-000000000002', '2026-07-27 10:00:00+05:30'),
  ('ab000000-0000-0000-0000-000000000007', 'ac000000-0000-0000-0000-000000000004', 'a7000000-0000-0000-0000-000000000004', 'graded', 25, 'Half diagrams missing.', '2026-08-06 11:30:00+05:30', 'a2000000-0000-0000-0000-000000000003', '2026-08-08 16:00:00+05:30')
ON CONFLICT (assignment_id, student_id) DO UPDATE SET
  status = EXCLUDED.status,
  marks_obtained = EXCLUDED.marks_obtained,
  feedback = EXCLUDED.feedback;

ALTER TABLE public.assignment_submissions ENABLE TRIGGER guard_submission_grading;

-- 5. ATTENDANCE LOGS
DO $$
DECLARE
  v_date DATE;
  v_student_id UUID;
  v_students UUID[] := ARRAY[
    'a7000000-0000-0000-0000-000000000001'::UUID, -- Aarav
    'a7000000-0000-0000-0000-000000000002'::UUID, -- Ananya
    'a7000000-0000-0000-0000-000000000003'::UUID, -- Rohan
    'a7000000-0000-0000-0000-000000000004'::UUID, -- Diya
    'a7000000-0000-0000-0000-000000000005'::UUID, -- Kabir
    'a7000000-0000-0000-0000-000000000006'::UUID, -- Ishita
    'a7000000-0000-0000-0000-000000000007'::UUID, -- Aditya
    'a7000000-0000-0000-0000-000000000008'::UUID  -- Sanya
  ];
  v_day_count INT := 0;
  v_status TEXT;
BEGIN
  FOR v_date IN 
    SELECT generate_series('2026-08-01'::DATE, '2026-09-10'::DATE, '1 day'::INTERVAL)::DATE
  LOOP
    IF EXTRACT(DOW FROM v_date) NOT IN (0, 6) THEN
      v_day_count := v_day_count + 1;
      FOREACH v_student_id IN ARRAY v_students
      LOOP
        IF v_student_id = 'a7000000-0000-0000-0000-000000000004' THEN
          IF (v_day_count % 3 = 0) THEN
            v_status := 'absent';
          ELSE
            v_status := 'present';
          END IF;
        ELSIF v_student_id = 'a7000000-0000-0000-0000-000000000003' THEN
          IF (v_day_count = 5 OR v_day_count = 18) THEN
            v_status := 'absent';
          ELSE
            v_status := 'present';
          END IF;
        ELSIF v_student_id = 'a7000000-0000-0000-0000-000000000001' THEN
          IF (v_day_count = 4 OR v_day_count = 14 OR v_day_count = 22) THEN
            v_status := 'absent';
          ELSE
            v_status := 'present';
          END IF;
        ELSE
          IF (v_day_count = 10) THEN
            v_status := 'absent';
          ELSE
            v_status := 'present';
          END IF;
        END IF;

        INSERT INTO public.attendances (
          tenant_id, student_id, batch_id, date, period_number, status, marked_by, remarks
        ) VALUES (
          '247afd96-506e-494c-a603-510b44316919',
          v_student_id,
          'a5000000-0000-0000-0000-000000000001',
          v_date,
          1,
          v_status,
          'a2000000-0000-0000-0000-000000000002',
          CASE WHEN v_status = 'absent' THEN 'Parent notified' ELSE NULL END
        )
        ON CONFLICT (student_id, batch_id, date, period_number) DO UPDATE SET
          status = EXCLUDED.status;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- 6. FACULTY REMARKS
INSERT INTO public.faculty_remarks (id, tenant_id, student_id, faculty_id, subject_id, batch_id, remark_text, category)
VALUES
  ('fa000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'a7000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Good improvement in Mathematics. Well prepared for board-style algebraic proofs.', 'academic'),
  ('fa000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'a7000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000003', 'a6000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000001', 'Demonstrates disciplined lab conduct and clear ray diagrams in optics.', 'academic'),
  ('fa000000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'a7000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Attendance needs improvement. Please attend remedial sessions for quadratic equations.', 'attendance'),
  ('fa000000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'a7000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Needs more practice in Algebra word problems to improve timed exam speed.', 'academic')
ON CONFLICT (id) DO UPDATE SET
  remark_text = EXCLUDED.remark_text,
  category = EXCLUDED.category;

COMMIT;
