# EduOS Phase 2 — Handoff

For the next agent picking up Assignments & Homework (Task 3) and Tests & Exams (Task 4) from `docs/EduOS_Phase_2_Tasks_3_4.md`.

Date: 2026-09-15. Head of `main`: `f19fde0`.

---

## TL;DR

Foundation is partly in. Two of six planned steps are done, one is blocked on a prod schema mismatch.

| Step | State |
|---|---|
| 1a. Assignments schema extensions (migration 20) | ✅ **applied to prod** |
| 1b. Exam engine schema (migration 21) | ⚠️ **committed + pushed, apply failed on prod drift — fix inline before running** |
| 2. dataService methods for new features | ❌ not started |
| 3. Assignments UI additions (draft/publish, resubmit, chapter-link) | ❌ not started |
| 4. Tests UI (question builder + student attempt flow) | ❌ not started |
| 5. Wire into StudentPerformance + academic_notifications | ❌ not started |

## Ground rules the previous work followed — keep them

- **Every screen reads from Supabase.** No `mockData` in runtime paths. `lib/mockData.ts` still exists but is unreachable in prod (only `auth/demo.ts` uses it, gated on `isSupabaseConfigured() === false`). Don't reintroduce seed fallbacks.
- **No hardcoded UUIDs.** The dashboards resolve real batches, real subjects, real students. If you need to seed data, add a `supabase/seed_*.sql` — never `const DEFAULT_SUBJECTS = [...]`.
- **Schema drift is real.** The `.sql` files in `supabase/schemas/` are AHEAD of prod. Two migrations today (schemas 19, 20) had to catch prod up before Phase 2 columns landed. **Always check `information_schema.columns` against prod before writing an ALTER.** `backend/scripts/check-*.cjs` files are the pattern.
- **Migrations are idempotent.** `ADD COLUMN IF NOT EXISTS`, `CREATE POLICY … NOT EXISTS` guards. A re-run must never fail.
- **Every migration ships with a runner.** `backend/scripts/apply-migration-*.cjs` — copy the pattern; reads `backend/.env`.
- **RLS on every new table.** `ENABLE ROW LEVEL SECURITY` + `tenant_isolation_on_<t>` policy using `public.current_tenant_id()`. Never leave a table wide open.
- **Type-check clean before commit.** `frontend/node_modules/.bin/tsc --noEmit --pretty false` from `frontend/`. Same for `backend/`. Vercel deploys on push, so a broken push breaks prod.

## Prod database drift you WILL hit

Prod has diverged from `supabase/schemas/*.sql` for several tables. What we found today:

| Table | Prod name | Schema-file name |
|---|---|---|
| `subjects` | (no `is_deleted`) | has `is_deleted` — **fixed in migration 19** |
| `assignments` | (no `updated_at`) | has `updated_at` — **fixed in migration 20** |
| `assignment_submissions` | `submission_url` | `file_url` |
| `assignment_submissions` | `marks_obtained` | `marks_awarded` |
| `assignment_submissions` | `student_notes` | `submission_text` |
| `assignment_submissions` | (no `tenant_id`, `created_at`, `updated_at`) | has all three — **fixed in migration 20** |
| **`exams`** | `title` | `name` |
| **`exams`** | `total_marks` | `max_marks` |
| **`exams`** | `is_published` (bool) | `status` (enum) |
| **`exams`** | (no `status`, `passing_marks`, `updated_at`) | has all three |
| `exam_results` | (no `tenant_id`, `updated_at`) | has both |

**The frontend uses the prod names**, so the schema files are what's wrong, not prod. Don't rename prod columns to match the schema file — that will break every reader. Add missing columns where needed, keep the different-name ones as-is.

## What migration 21 tried and why it failed

Migration 21 does `UPDATE public.exams SET status = 'live' WHERE status = 'ongoing'` inside a `DO $$ … $$` block that first drops the CHECK on `status`. Prod's `exams` table has no `status` column at all, so the update fails, the transaction rolls back, and nothing from migration 21 lands.

## Fix migration 21 like this

Before the CHECK / UPDATE block, add a prereq block that:

1. **Adds missing columns to `exams`:**
   ```sql
   ALTER TABLE public.exams
       ADD COLUMN IF NOT EXISTS status         TEXT,
       ADD COLUMN IF NOT EXISTS passing_marks  NUMERIC(6,2),
       ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW();

   -- Backfill status from is_published + exam_date so old rows land in a
   -- sensible lifecycle state.
   UPDATE public.exams
      SET status = CASE
          WHEN is_published AND exam_date > CURRENT_DATE THEN 'scheduled'
          WHEN is_published AND exam_date <= CURRENT_DATE THEN 'result_published'
          WHEN NOT is_published THEN 'draft'
          ELSE 'draft'
      END
    WHERE status IS NULL;

   -- Now tighten to NOT NULL + CHECK.
   ALTER TABLE public.exams
       ALTER COLUMN status SET NOT NULL,
       ALTER COLUMN status SET DEFAULT 'draft';

   -- Passing marks backfill: 33% of total_marks (CBSE default).
   UPDATE public.exams
      SET passing_marks = ROUND(total_marks * 0.33, 2)
    WHERE passing_marks IS NULL;
   ```

2. **Then delete the `UPDATE … WHERE status = 'ongoing'` legacy-migration** — prod never had those legacy values because it never had a `status` column. Skip the update entirely, just add the new CHECK.

3. **`exam_results`:** add `tenant_id` (backfill from parent exam) + `updated_at`. Same pattern as `assignment_submissions` in migration 20.

4. **Rest of migration 21 is fine as written** — questions, attempts, responses, notifications tables were never applied because the file rolled back. They'll create cleanly once the prereq block goes first.

After fixing, run:

```powershell
cd C:\Users\hhars\OneDrive\Desktop\EduOs\backend
node scripts/apply-migrations-20-21.cjs
```

Migration 20 is idempotent — re-running just verifies. Migration 21 is where the actual work happens.

## Steps 2-5: what's left to build

### Step 2 — dataService methods

`frontend/src/lib/dataService.ts`. Add these methods, keep the `// [module] doc + return-empty-on-error` style used everywhere else:

**Assignments:**
- `publishAssignment(id)` — draft → published, stamps `issue_date` if not already set
- `closeAssignment(id)` — published/open → closed, stamps `closed_at`
- `reopenAssignment(id)`
- `submitAssignment(...)` — extend the existing method to detect `submitted_at > due_date` → status `late`
- `resubmitAssignment(assignmentId, studentId, ...)` — checks `allow_resubmission`, increments `attempt_number`, inserts new row
- `listAssignmentAttachments(assignmentId)` / `addAssignmentAttachment(...)`
- `listSubmissionAttachments(submissionId)` / `addSubmissionAttachment(...)`
- `markSubmissionReviewed(submissionId, reviewerId, marks, feedback)` — sets `status=reviewed`, stamps `reviewed_at` + `reviewer_id`

**Exams:**
- `createExamQuestion(examId, { type, text, options, correct_answer, marks, ... })`
- `listExamQuestions(examId)`
- `updateExamQuestion(id, patch)`
- `deleteExamQuestion(id)` — soft
- `startExamAttempt(examId, studentId)` — inserts `exam_attempts` row, returns `attempt_id`. Refuses if `attempt_number > exam.max_attempts`.
- `saveExamResponse(attemptId, questionId, responseText)` — upsert into `exam_attempt_responses`. Autosave-friendly.
- `submitExamAttempt(attemptId, { autoSubmitted = false })` — sets `submitted_at`, runs auto-eval:
  - For each `mcq` / `true_false` response, compare `response_text` to `question.correct_answer`, populate `is_correct` + `marks_awarded`.
  - Sum awarded marks into `exam_attempts.obtained_marks` and `percentage`.
  - Sets attempt status to `submitted` (or `evaluated` if the exam has no descriptive/short-answer questions).
- `gradeAttemptResponse(responseId, marks, feedback, graderId)` — for descriptive/short-answer. Stamps `graded_by` + `graded_at`.
- `publishExamAttempt(attemptId)` — sets `is_published=true`, notifies student.
- `getStudentExamAttempts(studentId)` — for the student's Tests dashboard.
- `getExamAttemptDetail(attemptId)` — attempt + responses + question texts, joined.

**Notifications:**
- `createNotification({ userId, eventType, title, body, assignmentId?, examId?, ... })` — insert into `academic_notifications`.
- `listUnreadNotifications(userId)` / `markNotificationRead(id)`.
- Call `createNotification` from `publishAssignment`, `submitAssignment` (to teacher), `markSubmissionReviewed` (to student), `publishExamAttempt`, etc.

### Step 3 — Assignments UI

`frontend/src/components/teacher/TeacherAssignments.tsx` (668 LOC) and `frontend/src/components/student/StudentAssignments.tsx` (707 LOC) already handle create/list/upload/grade. Add:

- **Draft toggle** in the create modal — "Save as draft" vs "Publish now". Draft assignments only visible to teacher.
- **Chapter/topic picker** (optional) in the create modal — populated by `dataService.getSyllabus(batchId, subjectId)`.
- **Submission-type radio** — file / text / both. Student form respects it.
- **Allow resubmission checkbox** — student sees "Submit again" only when true and their current status is `reviewed` or `returned`.
- **Late badge** on any submission where `submitted_at > due_date`.
- **Status pill** on assignment rows — Draft (gray) / Published (green) / Closed (amber) / Archived (muted).
- **"Close for submissions" action** on teacher rows for published assignments past due.

### Step 4 — Tests UI

This is the biggest chunk. Whole new online-assessment flow.

**Teacher — `TeacherExams.tsx` (currently 185 LOC — expect ~600):**
- Assessment create modal: mode toggle (online/offline), start_time, duration_minutes, instructions, chapter/topic link.
- **Question builder** for online mode:
  - Add question → pick type (mcq/true_false/short/descriptive) → text → for MCQ, add 4-6 option rows with a "correct" radio → marks + optional negative_marks.
  - Reorder questions (drag or up/down buttons).
  - Preview mode showing how the student will see it.
- Publish/schedule button — moves draft → scheduled.
- Attempt roster: list of students, their attempt status, "Grade" button for descriptive answers.
- Result-publish button — bulk publishes all evaluated attempts.

**Student — `StudentExams.tsx` (currently 278 LOC — expect ~500):**
- Upcoming / Live / Completed tabs.
- Live exam card → "Start attempt" button (only if `now >= exam_date + start_time` and status is `scheduled`/`live`).
- **Attempt screen** — new file `StudentExamAttempt.tsx`:
  - Fetches question list once, holds responses in local state, autosaves via `saveExamResponse` every 15s.
  - Question navigator sidebar (spec §5.10): numbered chips, coloured by answered/unanswered/marked-for-review.
  - Countdown timer (spec §5.9): reads `duration_minutes`, auto-submits at zero with `autoSubmitted=true`.
  - Warn-before-leave (`beforeunload`) while in progress.
  - "Submit" button → `submitExamAttempt` → navigates to result screen.
- Result screen (spec §5.15): shows attempt with per-question correctness for auto-eval + feedback for descriptive.

### Step 5 — Performance wiring + notifications surface

- `StudentPerformanceView.tsx` — feed `assignment_completion_pct` and `assignment_average_pct` and `assessment_average_pct` into the existing 60/15/10/15 formula. Metric definitions in spec §7.
- **Notifications bell** — small component in the top nav that polls `listUnreadNotifications(session.userId)` every 60s, renders a badge + dropdown of unread items with deep-links.
- Fire `createNotification` from every write path listed in spec §10.

## File pointers you'll want

| Concern | File |
|---|---|
| DB layer | `frontend/src/lib/dataService.ts` (5000+ LOC, one object of async methods) |
| Auth session | `frontend/src/lib/auth/AuthProvider.tsx` — `useAuth().session` gives `{ authUserId, userId, tenantId, firstName, lastName, email }` |
| Tenant scoping | Every query calls `.eq('tenant_id', session.tenantId)` OR relies on RLS. Both is safer. |
| Teacher batch context | `useTeacherBatch()` from `frontend/src/lib/teacherContext.tsx` — non-null `batch` guaranteed |
| Student enrollment | `dataService.getStudentContext(authUserId)` returns `{ studentId, batchId, subjects }` |
| Existing UI conventions | Existing components under `frontend/src/components/{student,teacher,principal,admin}/` — copy patterns from `AdminAcademicSetup.tsx` (created today), it's the cleanest example of the "modal + list + Supabase" flow |
| App shell / routing | `frontend/src/app/page.tsx` — a giant switch on `activeTab`. New tabs go here. Sidebar entries in `frontend/src/lib/navigation.tsx`. |
| Icons | `lucide-react` throughout, always `size={ICON}` (14/16px scale) |
| Toast | `import { toast } from '@/components/ui/toast'` — `'success'`/`'error'` |
| Empty states | `PageHeader` + a bordered surface — see `StudentSyllabus.tsx` for the pattern |

## Testing accounts (all use password `EduOS@Test123` once you run the password-setter)

See `docs/eduos-tester-logins.xlsx`. Or:
- **Teacher (Greenfield)**: `amit.verma@greenfield.edu.in`
- **Student (Greenfield, roll 1)**: `aarav.sharma@student.greenfield.edu.in`
- **Principal**: `principal.sharma@greenfield.edu.in`
- **Super admin (cross-tenant)**: `superadmin@eduos.app`

Password-setter: `backend/scripts/set-tester-passwords.cjs` — needs `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.

## Deploy pipeline

- **Frontend**: Vercel auto-deploys on push to `origin/main`.
- **Backend**: Render auto-deploys on push to `origin/main`.
- **Supabase schema**: NEVER auto-runs. Every migration you write must be applied manually via `node backend/scripts/apply-migration-*.cjs`.
- After a schema change, PostgREST's schema cache can hold the old shape for ~60s. If a fresh read errors immediately after a migration, wait a minute or reload.

## What still ties Phase 1 together

- `subjects.is_deleted` migration (19) is applied — every subject list depends on it.
- `subject_teachers` table (schema 18) is applied — `AdminAcademicSetup` faculty assignment flow depends on it.
- Both were fixed today; no follow-up needed unless prod gets reprovisioned.

## Contact points

- Commits are attributed. Read the log for context (`git log --oneline -20`) before touching anything cross-cutting.
- Type errors, apply-migration errors and Vercel build errors are all you need to see; the schema-drift pattern above accounts for 90% of prod surprises.

Good luck.
