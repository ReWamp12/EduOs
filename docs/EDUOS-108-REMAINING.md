# EDUOS-108 — Handoff: what's done, what's left, and how to finish it

**Audience:** the next Claude (or human) engineer continuing EDUOS-108
("Remove hardcoded data, enforce RBAC everywhere, verify real persistence").
**Repo:** `C:\Users\hhars\OneDrive\Desktop\EduOs` · frontend = Next.js, backend =
NestJS (secondary tier), DB = Supabase Postgres 17.
**Today's date used during this work:** 2026-08-26.

> Read this whole file before touching anything. The ticket is audit-first and
> verify-per-item: **never report a write as working without an independent DB
> query proving the row exists.** That discipline is why the bugs below were
> found; keep it.

---

## 0. The verification harness (use it for every DB claim)

Three Node scripts live in the session scratchpad — recreate them if missing
(they read `backend/.env` for the service-role DB creds):

| Script | Purpose |
| --- | --- |
| `scratchpad/q.js` | Run SQL as the **service role** (bypasses RLS). `node q.js "<sql>"` |
| `scratchpad/as.js` | Run SQL **as an impersonated end-user** — sets `role authenticated` + a JWT `sub` claim so RLS applies exactly as it would for that signed-in user. `node as.js <auth_user_id|anon> "<sql>"` (wrapped in a rolled-back tx; add `--commit` to persist). |
| `scratchpad/apply.js` | Apply a migration file in one transaction. `node apply.js supabase/migrations/<file>.sql` |

`as.js` is the important one: **RBAC claims must be proven with `as.js`, not
`q.js`** (the service role bypasses every policy). A successful `INSERT` inside
the rolled-back tx still proves the write is *accepted* — you don't need
`--commit` to prove a path works.

Reference identities in the live seed (auth_user_id → note):
- Student `ayush.kumar` `0a7fb70b-9e44-41b3-9712-c32fe8dc7adf` (profile-scoped to one student)
- Teacher `suresh.pillai` auth `53f9686a-872e-43df-96c5-4479d41f634f`, **profile id** `4d9ada55-6040-4d40-a853-18a7359fae50` (owns the Mon/Tue slots of the Class 10-A batch)
- Teacher/mentor `meera.iyer` auth `359906c7-37eb-42d3-ba3e-2fab45142bf6` (class mentor)
- Principal auth `be0bd985-48ff-4bd9-8004-eab9593fba6b`, profile `2e4e2df7-6730-4c99-b36a-a1e25208234c`
- HR `neha.kapoor` auth `56af7385-1a18-4a81-bd93-c47bc115f132`
- Parent auth `d86b6532-0130-4222-a7c6-6be5e805b32a`
- Batch (Class 10-A) `21cf1f85-8d48-4843-9216-7457a3f6fe10`

> **`created_by` / `graded_by` / `employee_id` want the `user_profiles.id`
> (profile id), which is what `session.userId` carries — NOT the `auth_user_id`.**
> This trips up hand-written test SQL; the app already passes the right one.

---

## 1. The shared permission layer (reuse it — do not hand-roll checks)

`supabase/migrations/EDUOS-108-rbac-hardening.sql` (APPLIED) defines the single
source of truth for authorization. **Every new policy or SECURITY DEFINER
function must reuse these**, never inline `role = '...'` string checks:

`current_tenant_id()` · `current_profile_id()` · `current_profile_email()` ·
`current_user_role()` · `has_role(VARIADIC text[])` · `is_admin_staff()`
(principal/super_admin) · `is_school_staff()` (any staff) · `is_hr_staff()` ·
`is_finance_staff()` (from EDUOS-129) · `current_student_id()` ·
`teacher_is_class_mentor(batch)` · `teacher_teaches_batch(batch)` ·
`is_guardian_of(student)` · `can_view_student(student)` ·
`can_edit_student_academics(student)`.

The two the original brief assumed existed — `teacher_teaches_batch()` and
`teacher_is_class_mentor()` — **did not exist** before this ticket; they were
inlined inside `mark_attendance`. They exist now. Reuse them.

**tenant_id auto-fill:** `set_tenant_id_from_session()` (a BEFORE INSERT trigger
on `exams`, `notices`, `leave_requests`, `assignments`) stamps
`tenant_id = current_tenant_id()` when an insert omits it. So new inserts to
those tables should **not** send `tenant_id`. If you add more tenant-scoped
write tables, attach the same trigger (see the `DO $$ … FOREACH` block in
`EDUOS-108-write-path-schema.sql`).

---

## 2. DONE and VERIFIED (do not redo)

### Migrations (all applied to the live DB, all idempotent)
| File | What it does | Verified by |
| --- | --- | --- |
| `EDUOS-108-rbac-hardening.sql` | Replaces the blanket `FOR ALL USING (tenant_id=…)` policies on ~25 tables with per-command, role-scoped policies. Adds a trigger guarding `user_profiles.role/status/tenant` and one guarding `assignment_submissions` grading columns. | Attack matrix below |
| `EDUOS-108-attendance-caller-integrity.sql` | Rewrites `mark_attendance()` to resolve the acting teacher from `auth.uid()` (was: trusted client-supplied `p_caller_id` → a student could mark the register as their mentor). Guards `get_attendance_defaulters()`. Revokes both from `anon`/`PUBLIC`. | Attack matrix below |
| `EDUOS-108-write-path-schema.sql` | Adds the columns/constraints the write paths need: `exam_results` unique(exam_id,student_id)+graded_by/at/feedback (also de-dups 20 seed duplicates), `assignment_submissions` unique(assignment_id,student_id)+notes/file/graded, `exams.subject_id/created_by`, `leave_requests.reviewed_at/review_comment/designation/days_count`, `notices.audience[]`. Plus the tenant auto-fill trigger. | E2E writes below |
| `EDUOS-108-student-summary-view.sql` | `v_student_academic_summary` view computing **real** attendance % and batch rank from the register + results (replaces the fabricated `94.2` / `idx+1`). **`security_invoker = true`** — without it the view leaked every student's row to any caller (this was a bug in the first cut; fixed + retested). | Scoping test below |

**Attack matrix (all run via `as.js`, all now behave correctly):**
- student `UPDATE user_profiles SET role='super_admin'` → `42501` blocked (was: succeeded)
- student `SELECT * FROM employee_records` → 0 rows (was: read all staff pay/police data)
- student `UPDATE exam_results SET marks_obtained=99` on own row → 0 rows (was: succeeded)
- student `UPDATE attendances SET status='present'` over own absence → 0 rows (was: succeeded)
- student calls `mark_attendance(..., p_caller_id => mentor's id)` → `42501` "cannot be marked on behalf of another user" (was: `{success:true}`)
- `anon` calls `mark_attendance` → `42501` (was: succeeded; EXECUTE was granted to anon)
- honest teacher marks their own period → succeeds; wrong-period teacher → `42501`
- student files leave / broadcasts notice / publishes own marks → all `42501`
- **regressions checked:** teacher/principal/HR/parent all retain their legitimate reads and writes.

**E2E write paths proven (impersonated, tenant auto-filled):** teacher creates
exam ✓ · teacher upserts exam_results ✓ · teacher files own leave ✓ · principal
approves leave ✓ (teacher cannot) · principal broadcasts notice ✓ · student
sees only their own `v_student_academic_summary` row while teacher sees all 30 ✓.

### Frontend (typechecks clean: `cd frontend && npx tsc --noEmit`)
- **Role switcher removed from authenticated UI** (`app/page.tsx`, `layout/Sidebar.tsx`,
  `layout/Navbar.tsx`): the "view-as any role" override is gone; the switcher now
  renders only when a session holds >1 role (i.e. the fixture sandbox). This was
  the biggest UI hole — every student could pick "Super Admin".
- **Fabricated-success returns removed in `lib/dataService.ts`** — these used to
  return a fake `{success:true}` / `Promise.resolve(true)` / a minted local id
  when the (hardcoded `localhost:4000`) backend was unreachable:
  `markAttendance` (throws on failure now), `gradeSubmission`, `createAssignment`,
  `submitAssignment`, `createTenant`, `updateTenantBranding`, `getTenants`.
- **New real write methods in `lib/dataService.ts`:** `createNotice`, `createExam`,
  `publishExamResults`, `applyForLeave`, `decideLeave` (all return `null`/`false`
  on refusal, never a fake success).
- **Components wired to persist then update the reactive store:** `TeacherExams`
  (createExam), `TeacherGradebook` (publishExamResults — was calling
  `gradeSubmission` against the wrong table with student ids as submission ids),
  `TeacherLeavePortal` (applyForLeave + real session identity, was hardcoded
  "Prof. Amit Verma"), `PrincipalApprovals` (decideLeave), `NoticeBoard`
  (createNotice + real author, was `mockProfiles[role]`).
- **Student reads use the view** (prior work, verified): `getStudentOverview`,
  `getStudents` now read `attendance_pct`/`rank_in_batch` from
  `v_student_academic_summary`, nullable, no fabrication. `lib/format.ts`
  (`formatPct`/`formatRank`) renders `—` for null.

---

## 3. REMAINING WORK (in priority order)

### R1 — HR writes are still mock/localStorage  ⟶ highest value, tables already exist
`lib/dataService.ts` methods `createJob`, `updateApplicantStage`,
`submitInterviewScorecard`, `updatePoliceVerification`, `addScaleIncrement`,
`getTrainingRecords`, `addTrainingRecord` still hit `localhost:4000` then fall
back to `localStorage` + the (empty) `mock.mock*` arrays. Their *reads*
(`getJobs`, `getApplicants`, `getEmployees`, `getHROverview`) are already real.

The tables **exist and are RLS-scoped to `is_hr_staff()`** already
(`job_openings`, `applicants`, `interview_scorecards`, `employee_records`,
`employee_service_records`, `training_records`). So this is pure frontend wiring
— rewrite each method to `authClient.from(...).insert/update(...)` following the
exact pattern of the finished `createNotice`/`createExam` (persist → return row
or `null`). Column names are visible via
`node q.js "select column_name from information_schema.columns where table_name='employee_records'"`.
The CPD register especially: `training_records` holds **20 real rows** the
current `getTrainingRecords` never shows (it queries NestJS only).

**Verify:** for each, `as.js <hr_auth_id> "<the insert>"` succeeds, and
`as.js <student_auth_id> "<same insert>"` is refused `42501`.

### R2 — Six feature tables do not exist (the user asked for all six to be built)
Screens for these persist to the React store/localStorage only; there is **no
table**. Create ONE migration `EDUOS-108-missing-feature-tables.sql` and wire the
screens. Suggested schema (reuse the §1 helpers for RLS; attach the tenant
trigger; `ENABLE`+`FORCE` RLS; idempotent `CREATE TABLE IF NOT EXISTS` +
`DROP POLICY IF EXISTS`):

1. `consent_forms` (title, description, category, target_type, target_batch_id,
   author_id, author_role, event_date, deadline, instructions) — staff CRUD;
   parent/student SELECT in tenant. Screens: `PrincipalConsentForms`,
   `TeacherConsentForms`, `ParentConsentForms`. Store actions today:
   `createConsentForm`/`signConsentForm`/`declineConsentForm` in `lib/store.ts`.
2. `consent_responses` (form_id, student_id, status, signed_by_name,
   parent_relation, signed_at, decline_reason) — staff CRUD; guardian/student
   may SELECT + UPDATE their own row to sign/decline (WITH CHECK on their student).
3. `ptm_bookings` (teacher_id, student_id, subject, slot, mode, status,
   requested_by) — staff CRUD; guardian INSERT+SELECT own. Screen: `ParentPTM`
   (store `addPtmBooking`/`confirmPtmBooking`).
4. `support_tickets` (raised_by, category, subject, description, status, reply)
   — raiser INSERT+SELECT own; staff SELECT/UPDATE all. Screen: `StudentSupport`
   (currently pure `useState` with 2 fixture tickets).
5. `parent_feedback` (submitted_by, category, subject, message, rating, status)
   — submitter INSERT+SELECT own; admin SELECT/UPDATE all. Screen: `ParentFeedback`
   (pure `useState` fixture list + `mockProfiles.parent` header identity).
6. `curriculum_topics` (batch_id, subject_id, unit_name, topic_name,
   is_completed, completed_at, sequence_order) — SELECT tenant; write
   `is_admin_staff() OR teacher_teaches_batch(batch_id)`. Screen: `CurriculumTracker`.

Plus transport (Parent Bus Tracking is 100% mock): `bus_routes` +
`bus_route_assignments`. Lower priority — flag if descoping.

After creating tables, wire each screen: replace the `lib/store.ts` local action
(or `useState`) with a `dataService` method that inserts, then keep the store
call only as the reactive echo. **Verify each with `as.js` positive + negative.**

### R3 — Backend NestJS RBAC (B3 + B4)  ⟶ real only if the NestJS tier is deployed
The frontend now talks to Supabase directly for all hardened paths, so the
NestJS server at `localhost:4000` is a secondary/legacy tier — but it is still a
live **unauthenticated** surface if it is ever deployed:
- **B3:** `backend/src/auth/permissions.guard.ts` derives the role from
  `request.headers['x-user-role']` (default `'student'`). Anyone sends
  `x-user-role: super_admin` → `'*': ['*']`. Must read role from a verified
  Supabase JWT, never a header.
- **B4:** `backend/src/hr/hr.controller.ts` (15 endpoints incl.
  `PATCH police-verification`) and `backend/src/app.controller.ts` (19) have **no
  `@UseGuards`**. `main.ts` CORS is `origin:'*'`.

Fix: add a `SupabaseAuthGuard` that verifies `Authorization: Bearer <jwt>` via
`SupabaseService` (`supabase.auth.getUser(token)`), resolves the
`user_profiles` row, and attaches `{id,role,tenantId}` to `request.user`; change
`PermissionsGuard` to read only from `request.user`; apply guard +
`@RequirePermission` to HR and the sensitive AppController writes. **Leave the
public RAG search/ask/resources GETs and the public careers job-list + public
application POST unguarded** (careers is intentionally anonymous). Verify with
`curl` that an unauth call → 401 and a wrong-role call → 403.

### R4 — Student/parent identity still from fixtures in several components
`dataService.getStudentOverview(session.userId)` and
`dataService.getParentChildren()` return real rows, but these screens still read
identity from `mockCurrentStudent` / `mockParentChildren` / `mockProfiles`:
`student/StudentAssignments.tsx` (submit path posts as Aarav, roll 1 — also
needs to call `dataService.submitAssignment({assignmentId, studentId, submissionUrl})`
with the real id), `student/StudentExams.tsx`, `student/StudentOverview.tsx`,
`parent/ParentOverview.tsx`, `parent/ParentConsentForms.tsx`,
`parent/ParentExamHistory.tsx`, `parent/ParentAttendanceAlerts.tsx`,
`parent/ParentPTM.tsx`, `parent/ParentFeedback.tsx`,
`teacher/ExamSeatingAdmitCardModal.tsx`. Copy the pattern already used correctly
in `student/StudentAttendance.tsx` / `StudentIDCard.tsx` (call
`getStudentOverview(session?.userId)`, loading + null empty-state) and in
`parent/ParentFees.tsx` (`getParentChildren()`). Never re-introduce a fabricated
fallback (`|| 94.6`); use `formatPct`/`formatRank` from `lib/format.ts`.

### R5 — TeacherAssignments create + StudentAssignments submit not yet persisted
`teacher/TeacherAssignments.tsx` still calls store `addAssignment` only.
`dataService.createAssignment({batchId, subjectId, teacherId, title, dueDate,
maxMarks})` already exists and is RLS-guarded — wire it like `TeacherExams`.
`StudentAssignments` upload is real (private `submissions` bucket) but the
submission record goes to the store; call `dataService.submitAssignment` too.

### R6 — Leaf-screen fixtures / fake actions (lower blast radius)
- `common/SettingsView.tsx`: **password change is a `setTimeout` + success toast
  — it never calls `supabase.auth.updateUser`.** Profile save + "revoke other
  sessions" likewise fake. Wire to Supabase Auth. (Security-relevant: a user
  believes their password rotated when it didn't.)
- `admin/AdminOverview.tsx`: hardcoded 3-tenant list + KPIs (`12 tenants`,
  `8,420 students`, `₹8.40L MRR`). Read from `tenants` (super-admin scope).
- `admin/BrandingStudio.tsx`: calls `updateTenantBranding('t-1', …)` — hardcoded
  tenant id. Pass `session.tenantId`.
- `admin/FeatureMatrix.tsx`, `admin/ComplianceLib.tsx`,
  `principal/PrincipalInspection.tsx`, `teacher/TeacherAIQuestions.tsx`,
  `teacher/TeacherTimetable.tsx` (substitutions), `student/StudentLMS.tsx`
  (`lms_*` tables are empty), `parent/ParentBusTracking.tsx`,
  `parent/ParentAIReport.tsx`: all still local-only. Wire or flag per feature.
- Minor fabricated reads still in `dataService`: `getExamResults` invents
  `percentile 94.5`/`rank 1`/`weakTopics`/`aiNarrative` when columns are null;
  `getLeaveRequests` invents `daysCount:1`/`balanceRemaining:12`; `getHROverview`
  `openPositions || 3`. Replace with real columns or null.

### R7 — Finish Phase 3 formally
Once R1–R3 land, run the full unauthorized-access matrix per role and record the
actual 403s (a good chunk is already done — see §2). Also confirm no screen
silently falls back to fixture data on a failed fetch (the `dataService` fake
returns are gone; verify no component re-introduces one). Confirm the
single-role interim limitation isn't being worked around client-side (the role
switcher removal in §2 was the main offender).

---

## 4. Known constraints / gotchas
- **`API_BASE = 'http://localhost:4000/api'`** is hardcoded in `dataService.ts`.
  Any remaining method that still "falls back" to it cannot work in a deployed
  build — that's *why* the fake-success returns were dangerous. Prefer removing
  the NestJS tier from a method entirely once its Supabase path exists.
- **Store id vs DB id:** the reactive store (`lib/store.ts`) historically minted
  local ids (`exam-${Date.now()}`). `addExam` now accepts a real `id` so the
  gradebook can publish against the true `exams.id`. When wiring more store
  actions, thread the DB-returned id through the same way, or the FK will fail.
- **Roster comes from `lib/batchData.ts` fixtures** until
  `syncBatchDataFromSupabase()` runs (it does, in `teacherContext`), after which
  `studentsForBatch(batchId)` returns real rows with real uuids. Any teacher
  write keyed on a student id must run after that sync — it does in the current
  screens, but keep it in mind.
- **Single role per user** is the interim auth shape (`user_profiles.role` is one
  column; the `user_roles` join table from EDUOS-105 exists in a migration file
  but is **not applied** to the live DB). Do not work around this client-side —
  if a screen needs multi-role, flag it for the `user_roles` rollout.
- **Three EDUOS-105/109/112 migrations are unapplied** (`roles`, `permissions`,
  `role_permissions`, `user_roles`, `audit_logs`, `workflows` tables don't exist
  live). The RBAC in this ticket deliberately uses `user_profiles.role` + the
  §1 helpers, not that unapplied matrix. Don't assume those tables exist.

---

## 5. Suggested order for the next session
R1 (HR writes — tables ready, pure wiring) → R4 (identity — unblocks correct
data everywhere) → R2 (six tables) → R5 (assignments) → R3 (backend guards) →
R6 (leaf screens) → R7 (formal Phase 3 write-up). Do **one item, verify with
`as.js`, then the next** — do not batch.
