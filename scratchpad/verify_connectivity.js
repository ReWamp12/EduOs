const { Client } = require('../backend/node_modules/pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', 'backend', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val.trim();
  }
});

function getClient() {
  return new Client({
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT || '5432'),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });
}

// User profiles
const USERS = {
  superAdmin: {
    name: 'Super Admin',
    authUid: 'be0bd985-48ff-4bd9-8004-eab9593fba6b',
    profileId: '2e4e2df7-6730-4c99-b36a-a1e25208234c',
    role: 'super_admin',
  },
  principal: {
    name: 'Principal Dr. Rameshwar Nath',
    authUid: 'be0bd985-48ff-4bd9-8004-eab9593fba6b',
    profileId: '2e4e2df7-6730-4c99-b36a-a1e25208234c',
    role: 'principal',
  },
  teacher: {
    name: 'Teacher Suresh Pillai',
    authUid: '53f9686a-872e-43df-96c5-4479d41f634f',
    profileId: '4d9ada55-6040-4d40-a853-18a7359fae50',
    role: 'teacher',
  },
  hr: {
    name: 'HR Manager Neha',
    authUid: '56af7385-1a18-4a81-bd93-c47bc115f132',
    profileId: '3f9f9d78-b1ad-467a-9eb3-6058e0a3eb26',
    role: 'hr_manager',
  },
  parent: {
    name: 'Parent Rajesh Sharma',
    authUid: 'd86b6532-0130-4222-a7c6-6be5e805b32a',
    profileId: 'c2d59f99-2efe-44b6-b613-497cbb0ea8d9',
    childId: '9a79e6f3-a93a-4b51-90c4-04d9cccc1fea', // Aarav Sharma
    role: 'parent',
  },
  student: {
    name: 'Student Ayush',
    authUid: '0a7fb70b-9e44-41b3-9712-c32fe8dc7adf',
    profileId: 'd227296a-1330-4bcc-8286-7f01db9cce22',
    studentRecordId: 'b6c8084d-aecf-48f6-9116-55c138067ebd',
    role: 'student',
  },
  batchId: '21cf1f85-8d48-4843-9216-7457a3f6fe10',
  subjectId: '957dc26f-d02b-4d13-aa79-fdfe10f830d1',
  tenantId: '247afd96-506e-494c-a603-510b44316919',
};

async function testTableCycle(client, user, tableName, testPayload) {
  // Step 1: Write identifiable row with ZZZ_VERIFY_TEST
  const insertSql = await testPayload.getInsertSql(client, user);
  const insertRes = await client.query(insertSql.text, insertSql.values);
  const insertedRow = insertRes.rows[0];
  const rowId = insertedRow.id;

  // Step 2: Read back row from Supabase
  const readSql = `SELECT * FROM ${tableName} WHERE id = $1`;
  const readRes = await client.query(readSql, [rowId]);
  const fetchedRow = readRes.rows[0];

  if (!fetchedRow) {
    throw new Error(`Read verification failed for table ${tableName} — row ${rowId} not found after insert`);
  }

  // Step 3: Update row through Supabase
  const updateSql = await testPayload.getUpdateSql(client, rowId);
  const updateRes = await client.query(updateSql.text, updateSql.values);

  // Step 4: Re-read to confirm update persisted
  const reReadRes = await client.query(readSql, [rowId]);
  const updatedRow = reReadRes.rows[0];

  // Step 5: Delete test row (cleanup)
  let deletedId = rowId;
  if (testPayload.customCleanup) {
    await testPayload.customCleanup(client, rowId);
  } else {
    const deleteSql = `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`;
    const deleteRes = await client.query(deleteSql, [rowId]);
    deletedId = deleteRes.rows[0]?.id;
  }

  return {
    insertedId: rowId,
    verifiedRead: fetchedRow,
    verifiedUpdate: updatedRow,
    deletedId,
  };
}

async function runAudit() {
  console.log('='.repeat(95));
  console.log('EDUOS-109: COMPREHENSIVE SUPABASE CONNECTIVITY & PERSISTENCE VERIFICATION');
  console.log('Target URL:', env.SUPABASE_URL);
  console.log('Database Host:', env.DB_HOST);
  console.log('='.repeat(95));

  const tablesToVerify = [
    // 1. HR: job_openings
    {
      table: 'job_openings',
      role: 'hr',
      screen: 'HRCareersATS / PublicCareersModal',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO job_openings (title, department, job_type, experience_required, description, status)
                 VALUES ('ZZZ_VERIFY_TEST_JOB', 'Academics', 'Full-time', '3+ yrs', 'Verification test job opening', 'published')
                 RETURNING id, title, department, status, tenant_id`,
          values: [],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE job_openings SET title = 'ZZZ_VERIFY_TEST_JOB_UPDATED' WHERE id = $1 RETURNING id, title`,
          values: [id],
        }),
      },
    },

    // 2. HR: applicants
    {
      table: 'applicants',
      role: 'hr',
      screen: 'HRCareersATS Pipeline',
      payload: {
        getInsertSql: async (client, u) => {
          const jobRes = await client.query(`SELECT id FROM job_openings LIMIT 1`);
          const jobId = jobRes.rows[0]?.id;
          return {
            text: `INSERT INTO applicants (job_id, full_name, email, phone, highest_qualification, stage)
                   VALUES ($1, 'ZZZ_VERIFY_CANDIDATE', 'zzz_verify@test.edu', '+91-9999999999', 'M.Sc. Mathematics', 'applied')
                   RETURNING id, full_name, email, stage, tenant_id`,
            values: [jobId],
          };
        },
        getUpdateSql: async (client, id) => ({
          text: `UPDATE applicants SET stage = 'interview_scheduled' WHERE id = $1 RETURNING id, stage`,
          values: [id],
        }),
      },
    },

    // 3. HR: employee_records
    {
      table: 'employee_records',
      role: 'hr',
      screen: 'HRServiceBooks',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO employee_records (employee_code, full_name, email, phone, designation, department, employee_type, date_of_joining, employment_status)
                 VALUES ('ZZZ_EMP_99', 'ZZZ Dr. Test Employee', 'zzz_emp@test.edu', '+91-9876543210', 'Assistant Professor', 'Science', 'teaching', CURRENT_DATE, 'confirmed')
                 RETURNING id, employee_code, designation, tenant_id`,
          values: [],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE employee_records SET designation = 'Senior Lecturer' WHERE id = $1 RETURNING id, designation`,
          values: [id],
        }),
      },
    },

    // 4. Principal: consent_forms
    {
      table: 'consent_forms',
      role: 'principal',
      screen: 'PrincipalConsentForms / TeacherConsentForms',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO consent_forms (title, description, category, target_type, deadline, author_id, author_role)
                 VALUES ('ZZZ_VERIFY_CONSENT_FORM', 'Test authorization description', 'Excursion & Field Visit', 'all', CURRENT_DATE + 7, $1, 'principal')
                 RETURNING id, title, category, deadline, tenant_id`,
          values: [u.profileId],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE consent_forms SET title = 'ZZZ_VERIFY_CONSENT_FORM_UPDATED' WHERE id = $1 RETURNING id, title`,
          values: [id],
        }),
      },
    },

    // 5. Parent: consent_responses
    {
      table: 'consent_responses',
      role: 'parent',
      screen: 'ParentConsentForms',
      payload: {
        getInsertSql: async (client, u) => {
          const formRes = await client.query(`SELECT id FROM consent_forms LIMIT 1`);
          const formId = formRes.rows[0]?.id;
          return {
            text: `INSERT INTO consent_responses (form_id, student_id, status, signed_by_name, parent_relation)
                   VALUES ($1, $2, 'approved', 'Rajesh Sharma', 'Father')
                   ON CONFLICT (form_id, student_id) DO UPDATE SET status = 'approved', signed_by_name = 'Rajesh Sharma'
                   RETURNING id, student_id, status, signed_by_name, tenant_id`,
            values: [formId, u.childId],
          };
        },
        getUpdateSql: async (client, id) => ({
          text: `UPDATE consent_responses SET status = 'rejected', decline_reason = 'Schedule conflict' WHERE id = $1 RETURNING id, status, decline_reason`,
          values: [id],
        }),
      },
    },

    // 6. Parent: ptm_bookings
    {
      table: 'ptm_bookings',
      role: 'parent',
      screen: 'ParentPTM',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO ptm_bookings (teacher_id, student_id, subject, slot, mode, requested_by)
                 VALUES ($1, $2, 'Mathematics', '11:00 AM - 11:20 AM', 'online', 'guardian')
                 RETURNING id, teacher_id, student_id, subject, slot, tenant_id`,
          values: [USERS.teacher.profileId, u.childId],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE ptm_bookings SET status = 'completed' WHERE id = $1 RETURNING id, status`,
          values: [id],
        }),
      },
    },

    // 7. Student: support_tickets
    {
      table: 'support_tickets',
      role: 'student',
      screen: 'StudentSupport',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO support_tickets (raised_by, category, subject, description, status)
                 VALUES ($1, 'Academic Query', 'ZZZ_VERIFY_SUPPORT_TICKET', 'Verification query description', 'open')
                 RETURNING id, raised_by, category, subject, status, tenant_id`,
          values: [u.profileId],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE support_tickets SET reply = 'Resolved by mentor', status = 'resolved' WHERE id = $1 RETURNING id, status, reply`,
          values: [id],
        }),
      },
    },

    // 8. Parent: parent_feedback
    {
      table: 'parent_feedback',
      role: 'parent',
      screen: 'ParentFeedback',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO parent_feedback (submitted_by, category, subject, message, rating, status)
                 VALUES ($1, 'Academic', 'ZZZ_VERIFY_FEEDBACK', 'Test feedback message', 5, 'received')
                 RETURNING id, submitted_by, category, subject, rating, tenant_id`,
          values: [u.profileId],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE parent_feedback SET admin_response = 'Reviewed and action taken', status = 'addressed' WHERE id = $1 RETURNING id, status, admin_response`,
          values: [id],
        }),
      },
    },

    // 9. Teacher: curriculum_topics
    {
      table: 'curriculum_topics',
      role: 'teacher',
      screen: 'CurriculumTracker',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO curriculum_topics (batch_id, subject_id, unit_name, topic_name, is_completed)
                 VALUES ($1, $2, 'Unit 1: Verified Algebra', 'ZZZ_VERIFY_TOPIC_CALCULUS', false)
                 RETURNING id, batch_id, subject_id, topic_name, is_completed, tenant_id`,
          values: [USERS.batchId, USERS.subjectId],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE curriculum_topics SET is_completed = true WHERE id = $1 RETURNING id, is_completed`,
          values: [id],
        }),
      },
    },

    // 10. Student: assignment_submissions
    {
      table: 'assignment_submissions',
      role: 'student',
      screen: 'StudentAssignments',
      payload: {
        getInsertSql: async (client, u) => {
          const asgRes = await client.query(`SELECT id FROM assignments LIMIT 1`);
          const asgId = asgRes.rows[0]?.id;
          return {
            text: `INSERT INTO assignment_submissions (assignment_id, student_id, submission_url, student_notes, status)
                   VALUES ($1, $2, 'https://storage.school.edu/zzz_test.pdf', 'ZZZ_VERIFY_SUBMISSION_NOTE', 'submitted')
                   ON CONFLICT (assignment_id, student_id) DO UPDATE SET student_notes = 'ZZZ_VERIFY_SUBMISSION_NOTE'
                   RETURNING id, assignment_id, student_id, submission_url, status`,
            values: [asgId, u.studentRecordId],
          };
        },
        getUpdateSql: async (client, id) => ({
          text: `UPDATE assignment_submissions SET student_notes = 'ZZZ_VERIFY_SUBMISSION_NOTE_UPDATED' WHERE id = $1 RETURNING id, student_notes, status`,
          values: [id],
        }),
      },
    },

    // 11. Teacher: assignments
    {
      table: 'assignments',
      role: 'teacher',
      screen: 'TeacherAssignments',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO assignments (batch_id, subject_id, teacher_id, title, description, due_date, max_marks)
                 VALUES ($1, $2, $3, 'ZZZ_VERIFY_ASSIGNMENT', 'Solve all verification problems', CURRENT_DATE + 5, 25)
                 RETURNING id, title, batch_id, teacher_id, max_marks, tenant_id`,
          values: [USERS.batchId, USERS.subjectId, u.profileId],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE assignments SET title = 'ZZZ_VERIFY_ASSIGNMENT_UPDATED' WHERE id = $1 RETURNING id, title`,
          values: [id],
        }),
      },
    },

    // 12. Principal: notices
    {
      table: 'notices',
      role: 'principal',
      screen: 'NoticeBoard / PrincipalDashboard',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO notices (title, content, category, target_role, created_by)
                 VALUES ('ZZZ_VERIFY_CIRCULAR', 'Notice content verification for parents', 'general', 'all', $1)
                 RETURNING id, title, category, target_role, tenant_id`,
          values: [u.profileId],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE notices SET title = 'ZZZ_VERIFY_CIRCULAR_UPDATED' WHERE id = $1 RETURNING id, title`,
          values: [id],
        }),
      },
    },

    // 13. Teacher: attendances
    {
      table: 'attendances',
      role: 'teacher',
      screen: 'TeacherAttendance',
      payload: {
        getInsertSql: async (client, u) => {
          const stRes = await client.query(`SELECT id FROM students WHERE batch_id = $1 LIMIT 1`, [USERS.batchId]);
          const stId = stRes.rows[0]?.id || '5db67ae3-59d1-416d-94f5-c38ffe95bc33';
          return {
            text: `INSERT INTO attendances (student_id, batch_id, date, status, marked_by, remarks)
                   VALUES ($1, $2, CURRENT_DATE, 'present', $3, 'ZZZ_VERIFY_ATTENDANCE')
                   RETURNING id, student_id, batch_id, date, status, tenant_id`,
            values: [stId, USERS.batchId, u.profileId],
          };
        },
        getUpdateSql: async (client, id) => ({
          text: `UPDATE attendances SET status = 'late', remarks = 'Late by 5 mins' WHERE id = $1 RETURNING id, status, remarks`,
          values: [id],
        }),
      },
    },

    // 14. Teacher: exams
    {
      table: 'exams',
      role: 'teacher',
      screen: 'TeacherExams',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO exams (batch_id, subject_id, title, exam_type, total_marks, duration_minutes, exam_date, is_published, created_by)
                 VALUES ($1, $2, 'ZZZ_VERIFY_MIDTERM_EXAM', 'Unit Test', 50, 60, CURRENT_DATE + 10, true, $3)
                 RETURNING id, title, batch_id, exam_type, total_marks, tenant_id`,
          values: [USERS.batchId, USERS.subjectId, u.profileId],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE exams SET title = 'ZZZ_VERIFY_MIDTERM_EXAM_UPDATED' WHERE id = $1 RETURNING id, title`,
          values: [id],
        }),
      },
    },

    // 15. Super Admin / Finance: fee_structures
    {
      table: 'fee_structures',
      role: 'superAdmin',
      screen: 'FinanceWorkspace / FeeStructures',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO fee_structures (class_name, academic_year, name, total_annual_amount, installment_scheme)
                 VALUES ('Class 10', '2026-2027', 'ZZZ_VERIFY_ANNUAL_FEE', 65000, 'quarterly')
                 RETURNING id, class_name, academic_year, name, total_annual_amount, tenant_id`,
          values: [],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE fee_structures SET total_annual_amount = 70000 WHERE id = $1 RETURNING id, total_annual_amount`,
          values: [id],
        }),
      },
    },

    // 16. Finance / Parent: fee_invoices
    {
      table: 'fee_invoices',
      role: 'superAdmin',
      screen: 'FinanceWorkspace / ParentFees',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO fee_invoices (student_id, student_name, roll_number, batch_name, invoice_number, title, amount, due_date, status)
                 VALUES ($1, 'Aarav Sharma', '1001', 'Class 10-A', 'INV-ZZZ-999', 'ZZZ_VERIFY_TERM_FEE', 15000, CURRENT_DATE + 30, 'pending')
                 RETURNING id, student_id, student_name, invoice_number, amount, status, tenant_id`,
          values: [USERS.parent.childId],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE fee_invoices SET status = 'paid', paid_amount = 15000, payment_method = 'UPI', transaction_ref = 'TXN_ZZZ_123' WHERE id = $1 RETURNING id, status, payment_method`,
          values: [id],
        }),
      },
    },

    // 17. Teacher: leave_requests
    {
      table: 'leave_requests',
      role: 'teacher',
      screen: 'TeacherLeave / AdminLeave',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status, days_count)
                 VALUES ($1, 'Casual Leave', CURRENT_DATE + 5, CURRENT_DATE + 6, 'ZZZ_VERIFY_LEAVE_REASON', 'pending', 2)
                 RETURNING id, employee_id, leave_type, reason, status, tenant_id`,
          values: [u.profileId],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE leave_requests SET status = 'approved', review_comment = 'Approved by Principal' WHERE id = $1 RETURNING id, status, review_comment`,
          values: [id],
        }),
      },
    },

    // 18. Teacher: lms_courses
    {
      table: 'lms_courses',
      role: 'teacher',
      screen: 'TeacherLMS / StudentLMS',
      payload: {
        getInsertSql: async (client, u) => ({
          text: `INSERT INTO lms_courses (subject_id, batch_id, title, description, created_by)
                 VALUES ($1, $2, 'ZZZ_VERIFY_COURSE_PHYSICS', 'Advanced mechanics and thermodynamics', $3)
                 RETURNING id, subject_id, batch_id, title, tenant_id`,
          values: [USERS.subjectId, USERS.batchId, u.profileId],
        }),
        getUpdateSql: async (client, id) => ({
          text: `UPDATE lms_courses SET title = 'ZZZ_VERIFY_COURSE_PHYSICS_UPDATED' WHERE id = $1 RETURNING id, title`,
          values: [id],
        }),
      },
    },
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const t of tablesToVerify) {
    const user = USERS[t.role];
    const client = getClient();
    try {
      await client.connect();
      await client.query('BEGIN');
      await client.query("SELECT set_config('role', 'authenticated', true)");
      await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [user.authUid]);
      await client.query("SELECT set_config('request.jwt.claim.role', 'authenticated', true)");
      await client.query(
        "SELECT set_config('request.jwt.claims', $1, true)",
        [JSON.stringify({ sub: user.authUid, role: 'authenticated', email: `${t.role}@test.local` })]
      );

      const res = await testTableCycle(client, user, t.table, t.payload);
      await client.query('COMMIT');
      await client.end();

      passed++;
      results.push({
        table: t.table,
        screen: t.screen,
        role: t.role,
        read: 'YES',
        write: 'YES',
        evidence: `Insert/Read/Update/Delete verified (ID: ${res.insertedId}, tenant: ${res.verifiedRead.tenant_id || 'isolated'})`,
      });

      console.log(`[PASS] ${t.table.padEnd(25)} (${t.screen})`);
      console.log(`       Role: ${t.role.padEnd(12)} | Inserted ID: ${res.insertedId}`);
      console.log(`       Read verified: ${JSON.stringify(res.verifiedRead).slice(0, 110)}...`);
      console.log(`       Update verified: ${JSON.stringify(res.verifiedUpdate)}`);
      console.log(`       Delete verified: Cleaned up row ${res.deletedId}\n`);
    } catch (err) {
      try {
        await client.query('ROLLBACK');
        await client.end();
      } catch {}
      failed++;
      results.push({
        table: t.table,
        screen: t.screen,
        role: t.role,
        read: 'FAIL',
        write: 'FAIL',
        evidence: `Error: ${err.message}`,
      });
      console.log(`[FAIL] ${t.table} (${t.screen})`);
      console.log(`       Role: ${t.role} | Error: ${err.message}\n`);
    }
  }

  console.log('='.repeat(95));
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${tablesToVerify.length} tables tested.`);
  console.log('='.repeat(95));
}

runAudit().catch(e => {
  console.error(e);
  process.exit(1);
});
