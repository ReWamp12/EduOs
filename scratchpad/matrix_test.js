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

// Real User Profiles & Auth UIDs
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
  otherStudentId: '5db67ae3-ddf2-49ce-b4c6-2c5e5812fe57',
  otherUserProfileId: '4d9ada55-6040-4d40-a853-18a7359fae50',
  batch10A: '21cf1f85-8d48-4843-9216-7457a3f6fe10', // Timetable batch taught by Suresh Pillai
  mathSubjectId: '957dc26f-d02b-4d13-aa79-fdfe10f830d1',
  tenantId: '247afd96-7c93-41bb-b0c7-062e08e6f1f4',
};

async function testAsUser(userKey, label, testFn) {
  const user = USERS[userKey];
  const client = getClient();
  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query("SELECT set_config('role', 'authenticated', true)");
    await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [user.authUid]);
    await client.query("SELECT set_config('request.jwt.claim.role', 'authenticated', true)");
    await client.query(
      "SELECT set_config('request.jwt.claims', $1, true)",
      [JSON.stringify({ sub: user.authUid, role: 'authenticated', email: `${userKey}@test.local` })]
    );

    const result = await testFn(client, user);
    await client.query('ROLLBACK');
    await client.end();
    return { ok: true, result };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
      await client.end();
    } catch {}
    return { ok: false, code: err.code, message: err.message };
  }
}

async function runMatrix() {
  console.log('='.repeat(80));
  console.log('EDUOS-108: FULL RBAC & PERSISTENCE SECURITY MATRIX VERIFICATION');
  console.log('='.repeat(80));

  const testCases = [
    // 1. HR writes: job_openings
    {
      domain: 'R1: HR Operations',
      target: 'job_openings insert',
      actor: 'hr',
      expected: 'PASS (Tenant auto-filled)',
      fn: async (client, u) => {
        const res = await client.query(
          `INSERT INTO job_openings (title, department, job_type, experience_required, description, status)
           VALUES ('Math HOD', 'Academics', 'Full-time', '5+ yrs', 'Department leadership position', 'published')
           RETURNING id, tenant_id`
        );
        return `Inserted ID ${res.rows[0].id}, tenant=${res.rows[0].tenant_id}`;
      },
    },
    {
      domain: 'R1: HR Operations (Unauthorized)',
      target: 'job_openings insert by student',
      actor: 'student',
      expected: 'FAIL (42501 RLS Violation)',
      fn: async (client, u) => {
        await client.query(
          `INSERT INTO job_openings (title, department, job_type, experience_required, status)
           VALUES ('Unauthorized Opening', 'Academics', 'Full-time', '0 yrs', 'draft')`
        );
        return 'Unexpected success';
      },
    },

    // 2. Consent Forms: Principal create vs Student create
    {
      domain: 'R2: Consent Forms',
      target: 'consent_forms create by Principal',
      actor: 'principal',
      expected: 'PASS (Tenant auto-filled)',
      fn: async (client, u) => {
        const res = await client.query(
          `INSERT INTO consent_forms (title, category, target_type, deadline, author_id, author_role)
           VALUES ('Science Trip Form', 'Excursion', 'all', CURRENT_DATE + 5, $1, 'principal')
           RETURNING id, tenant_id`,
          [u.profileId]
        );
        return `Inserted ID ${res.rows[0].id}, tenant=${res.rows[0].tenant_id}`;
      },
    },
    {
      domain: 'R2: Consent Forms (Unauthorized)',
      target: 'consent_forms create by Student',
      actor: 'student',
      expected: 'FAIL (42501 RLS Violation)',
      fn: async (client, u) => {
        await client.query(
          `INSERT INTO consent_forms (title, category, target_type, deadline, author_id, author_role)
           VALUES ('Fake Form', 'Excursion', 'all', CURRENT_DATE + 5, $1, 'student')`,
          [u.profileId]
        );
        return 'Unexpected success';
      },
    },

    // 3. Consent Responses: Parent for own child vs other child
    {
      domain: 'R2/R4: Consent Responses',
      target: 'consent_responses sign for own child',
      actor: 'parent',
      expected: 'PASS',
      fn: async (client, u) => {
        const formRes = await client.query(`SELECT id FROM consent_forms LIMIT 1`);
        const formId = formRes.rows[0]?.id;
        if (!formId) return 'No form available';
        const res = await client.query(
          `INSERT INTO consent_responses (form_id, student_id, status, signed_by_name, parent_relation)
           VALUES ($1, $2, 'approved', 'Rajesh Sharma', 'Father')
           RETURNING id`,
          [formId, u.childId]
        );
        return `Signed response ID ${res.rows[0].id}`;
      },
    },
    {
      domain: 'R2/R4: Consent Responses (Unauthorized Cross-Child)',
      target: 'consent_responses sign for foreign student',
      actor: 'parent',
      expected: 'FAIL (42501 RLS Violation)',
      fn: async (client, u) => {
        const formRes = await client.query(`SELECT id FROM consent_forms LIMIT 1`);
        const formId = formRes.rows[0]?.id;
        await client.query(
          `INSERT INTO consent_responses (form_id, student_id, status, signed_by_name, parent_relation)
           VALUES ($1, $2, 'approved', 'Rajesh Sharma', 'Father')`,
          [formId, USERS.otherStudentId]
        );
        return 'Unexpected success';
      },
    },

    // 4. PTM Bookings: Parent for own child vs other student
    {
      domain: 'R2: PTM Consultation',
      target: 'ptm_bookings book for own child',
      actor: 'parent',
      expected: 'PASS',
      fn: async (client, u) => {
        const res = await client.query(
          `INSERT INTO ptm_bookings (teacher_id, student_id, subject, slot, requested_by)
           VALUES ($1, $2, 'Physics', '10:00 AM - 10:20 AM', 'guardian')
           RETURNING id`,
          [USERS.teacher.profileId, u.childId]
        );
        return `Booked PTM ID ${res.rows[0].id}`;
      },
    },
    {
      domain: 'R2: PTM Consultation (Unauthorized Cross-Student)',
      target: 'ptm_bookings book for foreign student',
      actor: 'parent',
      expected: 'FAIL (42501 RLS Violation)',
      fn: async (client, u) => {
        await client.query(
          `INSERT INTO ptm_bookings (teacher_id, student_id, subject, slot, requested_by)
           VALUES ($1, $2, 'Physics', '10:00 AM - 10:20 AM', 'guardian')`,
          [USERS.teacher.profileId, USERS.otherStudentId]
        );
        return 'Unexpected success';
      },
    },

    // 5. Support Tickets: Student own profile vs Spoofed profile
    {
      domain: 'R2: Support Desk',
      target: 'support_tickets raise for own profile',
      actor: 'student',
      expected: 'PASS',
      fn: async (client, u) => {
        const res = await client.query(
          `INSERT INTO support_tickets (raised_by, category, subject, description)
           VALUES ($1, 'Academic Query', 'Chapter 4 Doubt', 'Please explain problem 6')
           RETURNING id`,
          [u.profileId]
        );
        return `Ticket ID ${res.rows[0].id}`;
      },
    },
    {
      domain: 'R2: Support Desk (Unauthorized Spoofing)',
      target: 'support_tickets raise spoofing another user ID',
      actor: 'student',
      expected: 'FAIL (42501 RLS Violation)',
      fn: async (client, u) => {
        await client.query(
          `INSERT INTO support_tickets (raised_by, category, subject, description)
           VALUES ($1, 'Academic Query', 'Spoofed Ticket', 'Fake')`,
          [USERS.otherUserProfileId]
        );
        return 'Unexpected success';
      },
    },

    // 6. Parent Feedback: Parent own profile vs Spoofed profile
    {
      domain: 'R2: Parent Feedback',
      target: 'parent_feedback submit with own profile',
      actor: 'parent',
      expected: 'PASS',
      fn: async (client, u) => {
        const res = await client.query(
          `INSERT INTO parent_feedback (submitted_by, category, subject, message, rating)
           VALUES ($1, 'Transport', 'Route 4 Timing', 'On time today, thanks', 5)
           RETURNING id`,
          [u.profileId]
        );
        return `Feedback ID ${res.rows[0].id}`;
      },
    },
    {
      domain: 'R2: Parent Feedback (Unauthorized Spoofing)',
      target: 'parent_feedback submit spoofing another profile',
      actor: 'parent',
      expected: 'FAIL (42501 RLS Violation)',
      fn: async (client, u) => {
        await client.query(
          `INSERT INTO parent_feedback (submitted_by, category, subject, message, rating)
           VALUES ($1, 'Transport', 'Spoofed', 'Fake', 1)`,
          [USERS.otherUserProfileId]
        );
        return 'Unexpected success';
      },
    },

    // 7. Curriculum Topics: Teacher vs Student
    {
      domain: 'R2: Curriculum Tracker',
      target: 'curriculum_topics create by assigned teacher',
      actor: 'teacher',
      expected: 'PASS',
      fn: async (client, u) => {
        const res = await client.query(
          `INSERT INTO curriculum_topics (batch_id, subject_id, unit_name, topic_name)
           VALUES ($1, $2, 'Unit 1: Algebra', 'Quadratic Formula Verification')
           RETURNING id`,
          [USERS.batch10A, USERS.mathSubjectId]
        );
        return `Topic ID ${res.rows[0].id}`;
      },
    },
    {
      domain: 'R2: Curriculum Tracker (Unauthorized)',
      target: 'curriculum_topics create by student',
      actor: 'student',
      expected: 'FAIL (42501 RLS Violation)',
      fn: async (client, u) => {
        await client.query(
          `INSERT INTO curriculum_topics (batch_id, subject_id, unit_name, topic_name)
           VALUES ($1, $2, 'Unit 1: Algebra', 'Student Created Topic')`,
          [USERS.batch10A, USERS.mathSubjectId]
        );
        return 'Unexpected success';
      },
    },

    // 8. Assignments: Student submission own vs Student submission foreign
    {
      domain: 'R5: Assignment Submissions',
      target: 'assignment_submissions submit for own student ID',
      actor: 'student',
      expected: 'PASS',
      fn: async (client, u) => {
        const asgRes = await client.query(`SELECT id FROM assignments LIMIT 1`);
        const asgId = asgRes.rows[0]?.id;
        if (!asgId) return 'No assignment found';
        const res = await client.query(
          `INSERT INTO assignment_submissions (assignment_id, student_id, submission_url, student_notes, status)
           VALUES ($1, $2, 'https://cdn.school.edu/submission.pdf', 'Completed all 10 proofs', 'submitted')
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [asgId, u.studentRecordId]
        );
        return `Submission ID ${res.rows[0]?.id || 'already exists'}`;
      },
    },
    {
      domain: 'R5: Assignment Submissions (Unauthorized Cross-Student)',
      target: 'assignment_submissions submit for foreign student ID',
      actor: 'student',
      expected: 'FAIL (42501 RLS Violation)',
      fn: async (client, u) => {
        const asgRes = await client.query(`SELECT id FROM assignments LIMIT 1`);
        const asgId = asgRes.rows[0]?.id;
        await client.query(
          `INSERT INTO assignment_submissions (assignment_id, student_id, submission_url, student_notes, status)
           VALUES ($1, $2, 'https://malicious.com/spoof.pdf', 'Malicious spoofed submission', 'submitted')`,
          [asgId, USERS.otherStudentId]
        );
        return 'Unexpected success';
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const outcome = await testAsUser(tc.actor, tc.target, tc.fn);
    const isExpectedFail = tc.expected.startsWith('FAIL') && !outcome.ok && outcome.code === '42501';
    const isExpectedPass = tc.expected.startsWith('PASS') && outcome.ok;
    const testPassed = isExpectedPass || isExpectedFail;

    if (testPassed) {
      passed++;
      console.log(`[PASS] ${tc.domain} — ${tc.target}`);
      console.log(`       Actor: ${tc.actor} | Expected: ${tc.expected}`);
      console.log(`       Result: ${outcome.ok ? outcome.result : `Blocked with SQLSTATE ${outcome.code}`}\n`);
    } else {
      failed++;
      console.log(`[FAIL] ${tc.domain} — ${tc.target}`);
      console.log(`       Actor: ${tc.actor} | Expected: ${tc.expected}`);
      console.log(`       Outcome: ${outcome.ok ? outcome.result : `${outcome.code}: ${outcome.message}`}\n`);
    }
  }

  console.log('='.repeat(80));
  console.log(`Matrix Test Results: ${passed} PASSED, ${failed} FAILED out of ${testCases.length} tests.`);
  console.log('='.repeat(80));
}


runMatrix().catch((e) => {
  console.error(e);
  process.exit(1);
});
