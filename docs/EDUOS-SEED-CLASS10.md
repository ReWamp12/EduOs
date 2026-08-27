# EDUOS-SEED — Seed CBSE Class 10-A (real schema)

**Depends on:** EDUOS-102 (auth) already merged and its migration run — confirm
`user_profiles.mfa_enrolled_at` exists and `on_auth_user_created` fires before
starting this.

**Roles seeded:** `student` (30), `teacher` (5), `principal` (1), `hr_manager`
(1), `super_admin` (1) — matching what was actually asked for. **No `parent`
accounts** — see §0 for why.

---

## 0. Two things to flag, not silently work around

**0.1 — No parent↔student link exists.**
`public.students` stores `parent_name`, `parent_phone`, `parent_email` as
plain text columns. There is no FK from a `user_profiles` row with
`role = 'parent'` to a specific student. If we created parent login accounts
now, they'd authenticate successfully and then have no way to know whose
data they're allowed to see — same "auths fine, resolves to nothing useful"
shape the auth ticket already called out for unmatched emails. So: this seed
does **not** create parent accounts. It populates the text fields on
`students`, which is enough for front-office use (a human reading the
record), but not enough for a parent login. If/when a parent portal is
wanted, that needs a real `parent_student_links(parent_user_id, student_id)`
table and its own RLS policy — flag it as a follow-up ticket, don't
improvise it inside a seed script.

**0.2 — `user_profiles.tenant_id` is `NOT NULL`.**
The README describes Super Admin as cross-tenant ("Tenant Manager" that
creates/manages *other* tenants), but the schema requires every profile,
super_admin included, to belong to one `tenant_id`. There's currently no
way to represent a truly tenant-less platform operator. For this seed,
assign the `super_admin` profile to the same seeded tenant as everyone
else — that's a workaround, not a fix. Say so explicitly in your summary at
the end; don't let it read as if super_admin is "properly" cross-tenant.

---

## 1. Confirmed schema (from `schema.sql` + `EDUOS-102-auth.sql` — do not
deviate from these names/columns; this is not a guess)

- `tenants(id, name, subdomain, custom_domain, institution_type, primary_color, secondary_color, accent_color, logo_url, tagline)`
- `branches(id, tenant_id, name, code, city, is_main)` — optional; `branch_id` is nullable everywhere it's referenced, so it's fine to skip, but one "Main Campus" row is more realistic. Your call.
- `user_profiles(id, auth_user_id, tenant_id, branch_id, email, phone, first_name, last_name, role, avatar_url, status, ...)` — `role` CHECK now allows `student, parent, teacher, principal, hr_manager, finance, super_admin` (post-migration). `status` defaults `'active'`, and `current_profile()`/RLS depend on that default — don't override it.
- `batches(id, tenant_id, branch_id, name, code, target_exam, academic_year, room_number, mentor_teacher_id, capacity)` — **this is "Class 10-A."** `mentor_teacher_id` FK → `user_profiles.id` **is** the class teacher; there's no separate "class teacher" concept.
- `students(id, user_id, tenant_id, branch_id, batch_id, roll_number, admission_number, dob, gender, parent_name, parent_phone, parent_email, blood_group, qr_code_id)` — `user_id` is the FK to `user_profiles`, `UNIQUE`. `qr_code_id` has a default, leave it.
- `teachers(id, user_id, tenant_id, employee_code, designation, specialization, qualification, joining_date)` — same pattern, `user_id` FK to `user_profiles`.
- `subjects(id, tenant_id, name, code, icon_name, color)` — tenant-wide, not batch-specific.
- `timetables(id, tenant_id, batch_id, subject_id, teacher_id, day_of_week, period_number, start_time, end_time, room_number)` — **this is the only place "which teacher teaches which subject to which class" is expressed.** There is no simpler junction table — don't invent one.

---

## 2. Tenant

Check for an existing tenant with `subdomain = 'mpsdelhi'` first (don't
duplicate). Otherwise:

```
name: "Modern Public School"
subdomain: "mpsdelhi"
institution_type: "school"
```

Optional: one `branches` row, `name: "Main Campus"`, `is_main: true`.

---

## 3. People

### 3.1 Teachers — 5, one is also the class teacher

Insert order matters: `user_profiles` row first (role='teacher', no
`auth_user_id` yet), then the matching `teachers` detail row referencing its
`user_id`.

| Subject | Name | employee_code | specialization | Class teacher of 10-A? |
|---|---|---|---|---|
| English | Meera Iyer | MPS-T001 | English | ✅ |
| Hindi | Suresh Pillai | MPS-T002 | Hindi | |
| Mathematics | Anjali Deshmukh | MPS-T003 | Mathematics | |
| Science | Karan Bhatt | MPS-T004 | Science | |
| Social Science | Priya Menon | MPS-T005 | Social Science | |

### 3.2 Class 10-A — one `batches` row

```
name: "Class 10 - A"
code: "10A"
target_exam: "CBSE"
academic_year: "2026-2027"
capacity: 30
mentor_teacher_id: <Meera Iyer's user_profiles.id>
```

### 3.3 Subjects — 5 rows in `subjects`

English, Hindi, Mathematics, Science, Social Science — one row each,
`tenant_id` = the seeded tenant. Pick reasonable `code`s (`ENG`, `HIN`,
`MATH`, `SCI`, `SST`) and leave `icon_name`/`color` at their defaults unless
you want to theme them.

### 3.4 Timetable — wire subject ↔ teacher ↔ class

Create one `timetables` row per subject for 10-A, `teacher_id` matching
§3.1, spread across `day_of_week` 1–5 (Mon–Fri) and `period_number` 1–5 so
each subject meets at least once a week. Exact times are cosmetic — e.g.
periods at 09:00, 09:45, 10:30, 11:30, 12:15 with 45-minute slots is fine.
This is what makes "who teaches Class 10-A Mathematics" a real, queryable
fact instead of just implied by the teacher's `specialization` text field.

### 3.5 Students — 30, roll numbers 1–30

Same two-step pattern as teachers: `user_profiles` row (role='student') →
`students` detail row referencing its `user_id` and `batch_id` = 10-A.

For each of the 30:
- Realistic Indian name, roughly even gender split
- `roll_number`: `"1"`–`"30"` (it's TEXT, not INT — keep zero-padding out unless you want it, just be consistent)
- `admission_number`: `MPS2026{roll:03d}` — this column is globally UNIQUE, not just per-tenant, so don't reuse the scheme across future seed runs without checking
- `dob`: 2010–2011, appropriate for Class 10 in the 2026–27 academic year
- `gender`
- `parent_name`, `parent_phone`, `parent_email` — plain text, per §0.1
- `blood_group`: optional, cosmetic
- `email` on the `user_profiles` row: `firstname.lastname@mpsdelhi.eduos.app`, dedupe collisions with a middle initial

### 3.6 Staff — 1 each, `user_profiles` only (no detail table for these roles)

| Role | Name |
|---|---|
| `principal` | Asha Rao |
| `hr_manager` | Neha Kapoor |
| `super_admin` | Vikram Nair — see §0.2, same tenant as everyone else |

---

## 4. Auth users — link every profile to a real login

Do this **after** all `user_profiles`/`teachers`/`students`/`batches` rows
exist, in one batch pass over all 39 profiles (5 teachers + 30 students + 3
staff):

- Use `supabase.auth.admin.createUser({ email, password: 'Welcome@123', email_confirm: true })` with the **service role key**, server-side/CLI only — never in a file that ships to the frontend, never committed.
- Email must exactly match the `user_profiles.email` you already inserted (case-insensitive is fine, the trigger handles that) — the `on_auth_user_created` trigger only links to a profile whose `auth_user_id IS NULL`, so creating the auth user *after* the profile row exists is required, not optional.
- Skip (don't error) on accounts that already have an `auth_user_id` set, so the script is safe to re-run.

---

## 5. Script requirements

- Location: `backend/scripts/seed-class10.ts` — check for an existing seed-script convention first, don't invent a new location if one exists.
- **Idempotent**: check by `subdomain` / `lower(email)` / `admission_number` before inserting; skip or upsert.
- Read `SUPABASE_SERVICE_ROLE_KEY` from env, fail loudly (don't silently fall back to anon key) if missing.
- Insert order: tenant → branch (optional) → teacher profiles → teacher details → batch (needs mentor_teacher_id) → subjects → timetables → student profiles → student details → principal/hr_manager/super_admin profiles → auth users for all.
- Log a final summary: counts created vs. skipped per table, and explicitly restate the two flags from §0 so they don't get lost in a wall of log output.
- Write a **local-only, gitignored** `seed-credentials.md`: email + role per account (password is the same for all, no need to repeat it 39 times).

---

## 6. Verify against the EDUOS-102 test plan

Re-run with real accounts instead of the single manual profile from the auth
ticket's §0.2:

- **§2.1–2.3**: sign in as Asha Rao (principal), as any student, then try an email you didn't seed.
- **§4.1 & 4.5**: sign in as Meera Iyer — teacher dashboard. Sign in as a student — confirm no path to principal/HR screens.
- Confirm `auth_user_id` is populated for all 39 accounts, not just one:
  ```sql
  SELECT count(*) FROM public.user_profiles WHERE auth_user_id IS NULL;
  -- expect 0 among the 39 you just seeded
  ```
- Spot-check that `public.teachers` has no RLS policy of its own (it's `ENABLE ROW LEVEL SECURITY`'d in `schema.sql` with no matching `CREATE POLICY`) — note whether that currently means teacher records are unreadable to everyone including their own owner, or something else; don't fix it, just report what you observe so it feeds into EDUOS-104.

Report back in the same format as the auth ticket: what you ran, what you
did **not** verify, and anything from §0 that needs a real decision before
the next ticket.
