# EDUOS-102 — Test Plan (Authentication)

**What changed:** the app had no authentication. Role came from
`useState<UserRole>('student')` in `page.tsx`, so any visitor could select
Principal or Super Admin from the sidebar. This ticket adds real sign-in, route
protection, and a session that carries `{ userId, tenantId, branchId, roles[] }`.

> **Verification status:** TypeScript compiles clean (`npx tsc --noEmit`, 0 errors).
> **I did not run the app** — every case below is unverified at runtime. Expect to
> find things.

---

## Files changed

**New**
| File | Purpose |
|---|---|
| `supabase/migrations/EDUOS-102-auth.sql` | Role CHECK fix, MFA columns, signup trigger, bootstrap policy |
| `frontend/src/lib/auth/session.ts` | `EduosSession` type, profile→session mapper, MFA role list |
| `frontend/src/lib/auth/client.ts` | Browser client, `signInWithPassword`, `fetchSession` |
| `frontend/src/lib/auth/demo.ts` | Sandbox session for the no-Supabase mode |
| `frontend/src/lib/auth/AuthProvider.tsx` | React context, `useAuth()` / `useSession()` |
| `frontend/src/app/login/page.tsx` | Sign-in screen |
| `frontend/src/middleware.ts` | Route protection |
| `frontend/src/components/common/DemoModeBanner.tsx` | Sandbox banner |

**Modified:** `app/layout.tsx` (AuthProvider), `app/page.tsx` (session-driven role +
loading/no-access states), `components/layout/Sidebar.tsx` (role list, identity,
sign-out), `frontend/.env.example`

---

## 0. Setup — do this first

Your `frontend/.env.local` already has **real Supabase credentials**, so the app
runs in authenticated mode, not the demo sandbox.

### 0.1 Run the migration ⚠️ required

Sign-in **will not work** until this runs — `fetchSession()` selects
`mfa_enrolled_at`, and a missing column makes the query fail, which the app
renders as "No access".

Supabase → SQL Editor → New Query → paste and run:

```
supabase/migrations/EDUOS-102-auth.sql
```

- [ ] Runs with no errors
- [ ] If `schema.sql` was never run against this project, run it **first**

### 0.2 Create a tenant and a profile

`schema.sql` seeds nothing, so there are no rows to sign in as. In the SQL editor:

```sql
INSERT INTO public.tenants (name, subdomain, institution_type)
VALUES ('Modern Public School', 'mpsdelhi', 'school')
RETURNING id;
```

Copy that UUID into the next statement, and use an email you can receive mail at:

```sql
INSERT INTO public.user_profiles
    (tenant_id, email, first_name, last_name, role)
VALUES
    ('<paste-tenant-uuid>', 'you@example.com', 'Asha', 'Rao', 'principal');
```

- [ ] Both inserts succeed
- [ ] `role` is one of: `student, parent, teacher, principal, hr_manager, finance, super_admin`

### 0.3 Create the auth user

Supabase → Authentication → Users → **Invite user** (or Add user with a password),
using **the same email** as the profile row.

Then confirm the trigger linked them:

```sql
SELECT email, role, auth_user_id FROM public.user_profiles;
```

- [ ] `auth_user_id` is populated, not NULL

> If it is NULL, the trigger did not fire. Check that the emails match exactly
> (the trigger compares case-insensitively but not across typos) and that
> `on_auth_user_created` exists on `auth.users`.

### 0.4 Start the app

```bash
cd frontend && npm run dev
```

> Note: `.claude/launch.json` here defines `eduos-web`, but my preview tool
> resolved a launch config from a different project, so start it manually.

---

## 1. Route protection

| # | Steps | Expected |
|---|---|---|
| 1.1 | Open `http://localhost:3000/` signed out | Redirects to `/login?next=%2F` |
| 1.2 | Open `/careers` signed out | **Loads normally** — public route, no redirect |
| 1.3 | Open `/login` signed out | Loads the sign-in form |
| 1.4 | Disable JavaScript, open `/` | Still redirects — the gate is server-side middleware, not a client effect |

- [ ] 1.1 · [ ] 1.2 · [ ] 1.3 · [ ] 1.4

---

## 2. Sign in

| # | Steps | Expected |
|---|---|---|
| 2.1 | Correct email + password | Lands on `/`, dashboard renders |
| 2.2 | Correct email, **wrong** password | Red error box, stays on `/login`, no redirect |
| 2.3 | Email with no `user_profiles` row | Amber **"No active profile for this account"** box, and you are signed back out |
| 2.4 | Submit with empty fields | Browser validation blocks submit |
| 2.5 | Watch the button during submit | Spinner + "Signing in…", button disabled (no double-submit) |

- [ ] 2.1 · [ ] 2.2 · [ ] 2.3 · [ ] 2.4 · [ ] 2.5

**For 2.3**, create an auth user whose email has no matching profile row — this is
the case where credentials are valid but no institution has granted access.

---

## 3. Session lifecycle

| # | Steps | Expected |
|---|---|---|
| 3.1 | Sign in, hard-refresh (Ctrl+F5) | Still signed in — session is in cookies, not localStorage |
| 3.2 | Sign in, close tab, reopen `localhost:3000` | Still signed in |
| 3.3 | Signed in, navigate to `/login` | Redirects to `/` — no re-login while a session exists |
| 3.4 | Click sign-out (sidebar footer, bottom-right) | Returns to `/login`; pressing Back does not restore the dashboard |
| 3.5 | Open two tabs, sign out in one | The other tab drops to signed-out on its next render |
| 3.6 | Check `last_login_at` in SQL after signing in | Timestamp updated |

- [ ] 3.1 · [ ] 3.2 · [ ] 3.3 · [ ] 3.4 · [ ] 3.5 · [ ] 3.6

---

## 4. Session contents and role exposure

This is the part that actually closes the hole.

| # | Steps | Expected |
|---|---|---|
| 4.1 | Sign in as the `principal` profile | Sidebar shows the Principal dashboard |
| 4.2 | Click the workspace switcher (top-left, under the logo) | **Does not open.** One role held ⇒ no chevron, control is inert |
| 4.3 | Read the switcher label | Says **"Signed in as"** with your real name, and the role beneath it — not "Viewing as" |
| 4.4 | Sidebar footer | Shows your real name and email from `user_profiles`, not a fixture |
| 4.5 | Change the profile's role in SQL to `student`, sign out, sign back in | Student dashboard. You cannot reach Principal screens from the UI |

- [ ] 4.1 · [ ] 4.2 · [ ] 4.3 · [ ] 4.4 · [ ] 4.5

**4.2 and 4.5 are the core regression test.** Before this ticket, any visitor could
switch to Super Admin. Now the switcher only offers roles present in
`session.roles`, which currently holds exactly one entry.

---

## 5. Security checks

| # | Steps | Expected |
|---|---|---|
| 5.1 | Visit `/login?next=https://evil.example.com`, sign in | Lands on `/` — **not** the external site. Open-redirect guard rejects anything not starting with a single `/` |
| 5.2 | Visit `/login?next=//evil.example.com`, sign in | Lands on `/` — protocol-relative URLs also rejected |
| 5.3 | Visit `/login?next=/careers`, sign in | Lands on `/careers` — legitimate relative paths still honoured |
| 5.4 | DevTools → Application → Local Storage | No Supabase session token there; it lives in cookies |
| 5.5 | Delete the `sb-*` cookies, refresh | Redirected to `/login` |

- [ ] 5.1 · [ ] 5.2 · [ ] 5.3 · [ ] 5.4 · [ ] 5.5

---

## 6. Demo sandbox mode (optional)

Only if you want to confirm the fallback still works. **Back up `.env.local` first.**

Comment out both `NEXT_PUBLIC_SUPABASE_*` lines, restart the dev server.

| # | Steps | Expected |
|---|---|---|
| 6.1 | Open `/` | Loads straight into the dashboard, no redirect |
| 6.2 | Top of the page | Amber **"Demo sandbox"** banner, always visible |
| 6.3 | Workspace switcher | Opens, offers all 6 roles, switching works |
| 6.4 | Sign-out button | Disabled, tooltip "No session to end in the demo sandbox" |
| 6.5 | Open `/login` | Form is disabled with a "no database connected" notice and a "Continue to the demo" link |

- [ ] 6.1 · [ ] 6.2 · [ ] 6.3 · [ ] 6.4 · [ ] 6.5

**Restore `.env.local` afterwards.**

---

## 7. Regression sweep

The sidebar and root page were both touched, so give the existing screens a pass.

- [ ] Every nav item for your role renders without a console error
- [ ] Mobile drawer (narrow the window below `lg`) opens and closes
- [ ] `/careers` public job board still works
- [ ] No React hydration warnings in the console

---

## What this ticket does NOT do

Worth being explicit, so testing does not chase things that are deliberately out
of scope:

| Not covered | Ticket |
|---|---|
| The backend still connects as `postgres` (table owner) and **bypasses RLS entirely** | EDUOS-103 |
| 17 tables still have no RLS policy | EDUOS-104 |
| No server-side permission checks — a signed-in Student could still call a Principal API route directly | EDUOS-106 |
| `roles[]` holds one entry; true multi-role needs the `user_roles` table | EDUOS-105 |
| 2FA is a **scaffold only** — `requiresMfa` is computed and surfaced, but no TOTP enrolment or challenge exists | EDUOS-105/106 |

So: **authentication now proves who a caller is. It does not yet constrain what
they can reach.** Anyone with a session can still hit the NestJS API directly and
read across tenants. That is the next three tickets.

---

## Reporting back

For anything that fails, the useful details are: case number, what you saw, the
browser console output, and the Supabase logs (Dashboard → Logs → API / Auth).
Most likely failure by far is a missed step in §0 — check `auth_user_id` is
populated before assuming the code is wrong.
