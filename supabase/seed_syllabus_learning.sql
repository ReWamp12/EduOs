-- ============================================================================
-- EduOS Seed: Real CBSE Class 10 Syllabus, Topics & Learning Materials
-- Connected to Tenant: Greenfield International Academy
-- ============================================================================

BEGIN;

-- 1. MATHEMATICS CHAPTERS (CBSE Class 10)
INSERT INTO public.syllabus_chapters (id, tenant_id, batch_id, subject_id, chapter_number, title, description, unit_name, sequence_order, status)
VALUES
  ('c1000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 1, 'Real Numbers', 'Fundamental Theorem of Arithmetic and proof of irrational numbers', 'Unit I: Number Systems', 1, 'completed'),
  ('c1000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 2, 'Polynomials', 'Zeros of a polynomial and relationship with coefficients', 'Unit II: Algebra', 2, 'completed'),
  ('c1000000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 3, 'Pair of Linear Equations in Two Variables', 'Graphical and algebraic methods of solution', 'Unit II: Algebra', 3, 'completed'),
  ('c1000000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 4, 'Quadratic Equations', 'Standard form, quadratic formula and nature of roots', 'Unit II: Algebra', 4, 'in_progress'),
  ('c1000000-0000-0000-0000-000000000005', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 5, 'Arithmetic Progressions', 'nth term and sum of first n terms of AP', 'Unit II: Algebra', 5, 'not_started'),
  ('c1000000-0000-0000-0000-000000000006', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 6, 'Triangles', 'Similarity criteria and basic proportionality theorem', 'Unit IV: Geometry', 6, 'not_started')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  sequence_order = EXCLUDED.sequence_order;

-- 2. MATHEMATICS TOPICS
INSERT INTO public.syllabus_topics (id, tenant_id, chapter_id, subject_id, batch_id, title, description, sequence_order, status, completion_date, estimated_periods, faculty_notes)
VALUES
  -- Chapter 1: Real Numbers
  ('d1000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'c1000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Euclid''s Division Lemma & Algorithm', 'Division algorithm statements and applications in HCF calculation', 1, 'completed', '2026-07-15', 4, 'All students clear on prime factorization step.'),
  ('d1000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'c1000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Fundamental Theorem of Arithmetic', 'Unique factorization theorem and applications to LCM and HCF', 2, 'completed', '2026-07-22', 4, 'Assigned NCERT Ex 1.2 problems.'),
  ('d1000000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'c1000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Revisiting Irrational Numbers', 'Contradiction proofs for √2, √3 and √5 irrationality', 3, 'completed', '2026-07-29', 4, 'Board exam question practice covered.'),

  -- Chapter 2: Polynomials
  ('d1000000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'c1000000-0000-0000-0000-000000000002', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Geometric Meaning of Zeros', 'Parabolas and intersection with x-axis', 1, 'completed', '2026-08-04', 4, 'Visualized via Desmos graphing.'),
  ('d1000000-0000-0000-0000-000000000005', '247afd96-506e-494c-a603-510b44316919', 'c1000000-0000-0000-0000-000000000002', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Relationship Between Zeros and Coefficients', 'Sum and product of roots for quadratic and cubic equations', 2, 'completed', '2026-08-11', 5, 'Formula sheet distributed.'),

  -- Chapter 3: Linear Equations
  ('d1000000-0000-0000-0000-000000000006', '247afd96-506e-494c-a603-510b44316919', 'c1000000-0000-0000-0000-000000000003', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Graphical Method of Solution', 'Consistent, inconsistent and dependent pairs of lines', 1, 'completed', '2026-08-20', 5, 'Graph sheets submitted.'),
  ('d1000000-0000-0000-0000-000000000007', '247afd96-506e-494c-a603-510b44316919', 'c1000000-0000-0000-0000-000000000003', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Substitution & Elimination Methods', 'Algebraic techniques for finding intersecting coordinates', 2, 'completed', '2026-08-28', 6, 'Practice test completed.'),

  -- Chapter 4: Quadratic Equations
  ('d1000000-0000-0000-0000-000000000008', '247afd96-506e-494c-a603-510b44316919', 'c1000000-0000-0000-0000-000000000004', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Standard Form & Factorisation Method', 'ax² + bx + c = 0 solving by splitting middle term', 1, 'completed', '2026-09-04', 4, 'Good grasp shown by class.'),
  ('d1000000-0000-0000-0000-000000000009', '247afd96-506e-494c-a603-510b44316919', 'c1000000-0000-0000-0000-000000000004', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Quadratic Formula & Nature of Roots', 'Discriminant D = b² - 4ac and real, distinct, or no real roots', 2, 'in_progress', NULL, 5, 'Currently teaching word problems based on speed/time.'),

  -- Chapter 5: Arithmetic Progressions
  ('d1000000-0000-0000-0000-000000000010', '247afd96-506e-494c-a603-510b44316919', 'c1000000-0000-0000-0000-000000000005', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'General Term of an AP (an = a + (n-1)d)', 'Derivation and solving for term index', 1, 'not_started', NULL, 4, 'Scheduled after Chapter 4 exam.'),
  ('d1000000-0000-0000-0000-000000000011', '247afd96-506e-494c-a603-510b44316919', 'c1000000-0000-0000-0000-000000000005', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'Sum of First n Terms of an AP (Sn)', 'Formulas and practical real-life word problems', 2, 'not_started', NULL, 6, NULL)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  completion_date = EXCLUDED.completion_date,
  faculty_notes = EXCLUDED.faculty_notes;

-- 3. PHYSICS CHAPTERS (CBSE Class 10)
INSERT INTO public.syllabus_chapters (id, tenant_id, batch_id, subject_id, chapter_number, title, description, unit_name, sequence_order, status)
VALUES
  ('c2000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000002', 1, 'Light — Reflection and Refraction', 'Spherical mirrors, ray diagrams, mirror formula, lenses', 'Natural Phenomena', 1, 'completed'),
  ('c2000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000002', 2, 'The Human Eye and the Colourful World', 'Refraction through a prism, dispersion of light, atmospheric refraction', 'Natural Phenomena', 2, 'completed'),
  ('c2000000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000002', 3, 'Electricity', 'Electric current, potential difference, Ohm''s law, resistance, Joule''s law', 'Effects of Current', 3, 'in_progress'),
  ('c2000000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'a5000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000002', 4, 'Magnetic Effects of Electric Current', 'Magnetic field and field lines, Fleming''s left hand rule, electric motor', 'Effects of Current', 4, 'not_started')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status;

-- 4. PHYSICS TOPICS
INSERT INTO public.syllabus_topics (id, tenant_id, chapter_id, subject_id, batch_id, title, description, sequence_order, status, completion_date, estimated_periods, faculty_notes)
VALUES
  ('d2000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'c2000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000001', 'Spherical Mirrors & Ray Diagrams', 'Concave and convex mirrors image formation rules', 1, 'completed', '2026-07-18', 4, 'Optics ray diagram lab completed.'),
  ('d2000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'c2000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000001', 'Mirror Formula & Magnification', 'Sign convention and numerical problem solving', 2, 'completed', '2026-07-25', 4, 'Practiced sign convention thoroughly.'),
  ('d2000000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'c2000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000001', 'Refraction & Snell''s Law', 'Refractive index, glass slab experiment, power of lens', 3, 'completed', '2026-08-02', 5, 'Glass slab lab performed.'),
  ('d2000000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'c2000000-0000-0000-0000-000000000003', 'a6000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000001', 'Electric Current & Potential Difference', 'Charge flow, definitions of Ampere and Volt', 1, 'completed', '2026-08-25', 3, 'Introductory circuit built.'),
  ('d2000000-0000-0000-0000-000000000005', '247afd96-506e-494c-a603-510b44316919', 'c2000000-0000-0000-0000-000000000003', 'a6000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000001', 'Ohm''s Law & Resistance in Series/Parallel', 'V = IR verification and combination circuits', 2, 'in_progress', NULL, 6, 'Series vs parallel breadboard lab ongoing.')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status;

-- 5. REAL LEARNING MATERIALS (PDFs, Notes, Videos, Links)
INSERT INTO public.learning_materials (id, tenant_id, subject_id, batch_id, chapter_id, topic_id, title, material_type, file_url, file_size, author_name)
VALUES
  ('e1000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Euclid''s Division Lemma — Class Handout & Practice Problems', 'pdf', 'https://ncert.nic.in/textbook/pdf/jemh101.pdf', '2.4 MB', 'Amit Verma'),
  ('e1000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'Fundamental Theorem of Arithmetic — NCERT Solutions & Quick Notes', 'notes', 'https://ncert.nic.in/exemplar-problems.php?ln=en', '1.1 MB', 'Amit Verma'),
  ('e1000000-0000-0000-0000-000000000003', '247afd96-506e-494c-a603-510b44316919', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000005', 'Polynomials Zeros & Coefficients — Formula Summary Sheet', 'pdf', 'https://ncert.nic.in/textbook/pdf/jemh102.pdf', '1.8 MB', 'Amit Verma'),
  ('e1000000-0000-0000-0000-000000000004', '247afd96-506e-494c-a603-510b44316919', 'a6000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000009', 'Quadratic Formula Video Lecture & Step-by-Step Proof', 'video', 'https://www.youtube.com/watch?v=VOXYMRcWb68', '18 mins', 'Amit Verma'),
  ('e2000000-0000-0000-0000-000000000001', '247afd96-506e-494c-a603-510b44316919', 'a6000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'Light Optics — NCERT Ray Diagrams & Practical Lab Manual', 'pdf', 'https://ncert.nic.in/textbook/pdf/jesc110.pdf', '3.8 MB', 'Sunita Rao'),
  ('e2000000-0000-0000-0000-000000000002', '247afd96-506e-494c-a603-510b44316919', 'a6000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000003', 'd2000000-0000-0000-0000-000000000005', 'Ohm''s Law Simulation & Interactive Circuit Lab', 'link', 'https://phet.colorado.edu/en/simulations/ohms-law', 'Interactive', 'Sunita Rao')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  file_url = EXCLUDED.file_url,
  material_type = EXCLUDED.material_type;

COMMIT;
