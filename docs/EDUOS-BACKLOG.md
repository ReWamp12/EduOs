# EduOS — Pending Work Backlog

Derived from an audit of `part1`–`part7` specs against the code at commit `63eb08f` (14 commits).
Ordered so you can work **top to bottom** — each ticket's dependencies appear above it.

**Numbering** starts at `EDUOS-102` (`EDUOS-101` is used by the HRMS commit).

| Legend | Meaning |
|---|---|
| 🔴 P0 | Blocks everything / security hole. Do first. |
| 🟠 P1 | Core product. Spec calls it non-negotiable. |
| 🟡 P2 | Feature modules. Sequence per Part 7 phases. |

**Status key:** `[ ]` todo · `[~]` in progress · `[x]` done

---

# EPIC A — Security & Tenancy Foundation 🔴

> Part 1 §2 calls DB-level isolation critical and warns that app-layer-only isolation is
> "a common and dangerous shortcut". Today there is neither layer. Nothing else should
> ship until Epic A is closed — every module built before it inherits the hole.

---

## [ ] EDUOS-102 — Implement authentication 🔴
**Phase:** 1 · **Spec:** part1 §5 (Auth), §8 · **Depends on:** —

There is no login anywhere. `frontend/src/app/page.tsx` exposes only `/` and `/careers`;
role comes from `useState<UserRole>('student')`, so any visitor can select any role.

**Acceptance criteria**
- [ ] Supabase Auth email/password sign-in + sign-out, session persisted
- [ ] `/login` route; all dashboard routes redirect when unauthenticated
- [ ] `user_profiles.auth_user_id` populated on signup, linked to `tenant_id`
- [ ] Session exposes `{ userId, tenantId, branchId, roles[] }`
- [ ] 2FA scaffold for Super Admin / Trustee / Principal / Finance / HR (part1 §8)

**Files:** `frontend/src/app/login/`, `frontend/src/lib/supabase.ts`, `backend/src/auth/`

---

## [ ] EDUOS-103 — Fix RLS bypass and resolve the ADR/schema contradiction 🔴
**Phase:** 1 · **Spec:** part1 §2 · **Depends on:** 102

Three independent defects make tenant isolation inert:

1. Backend connects as `DB_USER=postgres` — the table **owner**, which Postgres exempts
   from RLS unless `FORCE ROW LEVEL SECURITY` is set. It is not set. Every NestJS query
   sees all tenants.
2. Policies key off `auth.uid()`, which is null because nobody logs in.
3. `architecture_decision_record.md` says isolation uses `app.current_tenant_id`.
   `supabase/schema.sql` uses `auth.uid()` lookups instead, and that variable is never set
   anywhere in the codebase. **One of those two documents describes a system that does
   not exist.**

**Acceptance criteria**
- [ ] Decide the mechanism (recommend `app.current_tenant_id` set per request) and make
      the ADR and schema agree
- [ ] `ALTER TABLE ... FORCE ROW LEVEL SECURITY` on every tenant-scoped table
- [ ] Backend connects as a **non-owner** role without `BYPASSRLS`
- [ ] Request middleware sets tenant context on every connection checkout
- [ ] `architecture_decision_record.md` updated to match what was built

**Files:** `supabase/schema.sql`, `backend/src/app.module.ts`, `architecture_decision_record.md`

---

## [ ] EDUOS-104 — Close RLS coverage gaps on 17 tables 🔴
**Phase:** 1 · **Spec:** part1 §2, part6 §6.1 · **Depends on:** 103

23 tables exist; 15 have RLS enabled; only **6** have a policy.

**No RLS at all (8):** `branches`, `subjects`, `timetables`, `lms_courses`, `lms_lessons`,
`assignments`, `assignment_submissions`, `interview_scorecards`

**RLS enabled but no policy (9):** `tenants`, `teachers`, `exams`, `exam_results`, `notices`,
`leave_requests`, `applicants`, `employee_service_records`, `training_records`

**Acceptance criteria**
- [ ] Every tenant-scoped table has RLS enabled **and** a tenant-isolation policy
- [ ] Part 6 §6.1 universal columns everywhere: `id, tenant_id, branch_id, created_at,
      updated_at, created_by, updated_by, is_deleted, version`
- [ ] A migration guard fails CI if a new table lands without RLS

---

## [ ] EDUOS-105 — RBAC permission model as data 🔴
**Phase:** 1 · **Spec:** part1 §7, part6 §6.2 · **Depends on:** 102

No permission table, no seed, no matrix. Part 1 §7.3 requires the matrix be built as
**data, not code**, and that "no module is allowed to invent its own separate
access-control mechanism."

**Acceptance criteria**
- [ ] Tables: `roles`, `permissions(module, sub_feature, action, scope)`, `role_permissions`,
      `user_roles`
- [ ] Actions: `view, create, edit, delete, approve, export, impersonate`
- [ ] Scopes: `self`, `branch`, `tenant`
- [ ] All 20 default roles from part1 §7.2 seeded
- [ ] Generator script expands module definitions into permission rows
      (part6 §6.2 — "not hand-typed per row")
- [ ] Multi-role support with context switching, not merged permissions (part1 §7.1)
- [ ] Tenant admins can create custom roles and rename defaults

---

## [ ] EDUOS-106 — Enforce RBAC server-side 🔴
**Phase:** 1 · **Spec:** part1 §7.1 · **Depends on:** 105

**Acceptance criteria**
- [ ] NestJS guard resolving `(role, module, sub_feature, action, scope)` per route
- [ ] Every endpoint in `app.controller.ts`, `hr.controller.ts` and `domain.controller.ts`
      carries a permission decorator
- [ ] Scope filters applied — Teacher sees own classes, Trustee sees tenant-wide
- [ ] Denials return 403 and write an audit entry

---

## [ ] EDUOS-107 — Replace the client-side role switcher 🔴
**Phase:** 1 · **Spec:** part1 §7 · **Depends on:** 102, 106

**Acceptance criteria**
- [ ] `activeRole` derives from the authenticated session, never local state
- [ ] Sidebar lists only roles the user actually holds
- [ ] Multi-role users get an explicit, audited context switch
- [ ] UI hiding is cosmetic only — the server rejects independently

---

## [ ] EDUOS-108 — Tenant-isolation test suite in CI 🔴
**Phase:** 1 · **Spec:** part7 §7.2, part1 §8 · **Depends on:** 104, 106

Only 2 test files exist and both are untouched Nest scaffolding —
`app.controller.spec.ts` still asserts `"Hello World!"`.

**Acceptance criteria**
- [ ] Suite authenticates as Tenant A and attempts read/write of Tenant B across **every**
      module — all attempts must fail
- [ ] RBAC regression tests per role against real API routes, not unit-tested logic
- [ ] Runs on every PR touching a data-access path; blocking

---

# EPIC B — Cross-Cutting Systems 🟠

> Part 1 §6: "build these once, shared by every module". All 8 are missing. Every module
> built before them needs retrofitting — the Approval Engine alone is referenced by
> Trustee, Principal, HR, Finance, Inventory and Admissions.

---

## [ ] EDUOS-109 — Audit Log Service 🟠
**Phase:** 1 · **Spec:** part1 §6, part4 §4.4 · **Depends on:** 102

- [ ] Every create/update/delete/approve logged with actor, role, before/after, timestamp, IP
- [ ] Queryable by tenant admins, exportable for compliance and legal
- [ ] **View-logging** for `ComplaintCase` — part 4 requires logging reads, not just edits
- [ ] Append-only; not mutable through the application

---

## [ ] EDUOS-110 — Event Bus 🟠
**Phase:** 1 · **Spec:** part1 §6, part6 §6.3 · **Depends on:** —

- [ ] Redis Streams publisher/subscriber
- [ ] Every event in part6 §6.3 typed and catalogued
- [ ] Each event carries `tenant_id, branch_id, actor_id, timestamp` and a typed payload
- [ ] Publishers never know their subscribers

---

## [ ] EDUOS-111 — Notification Service 🟠
**Phase:** 1 · **Spec:** part1 §6, part3 §3.2 · **Depends on:** 110

- [ ] Email / SMS / WhatsApp / push behind one interface
- [ ] Per-tenant white-labeled templates and sender identity (part1 §3)
- [ ] Delivery tracking, retry with backoff, per-user channel preference
- [ ] Read receipts and acknowledgment tracking for emergency broadcasts

---

## [ ] EDUOS-112 — Approval / Workflow Engine 🟠
**Phase:** 1 · **Spec:** part1 §6 · **Depends on:** 105

- [ ] Generic reusable state machine; approval chains as config, not per-module code
- [ ] Delegation with expiry (part1 §7.1 — Principal on leave delegates to Vice Principal)
- [ ] Consumed by leave, procurement, budget, admission and content approval

---

## [ ] EDUOS-113 — Document / Certificate Engine 🟠
**Phase:** 1 · **Spec:** part1 §6, §3 · **Depends on:** —

- [ ] Template-based PDF: report cards, TC, bonafide, invoices, ID cards, offer letters
- [ ] Tenant branding auto-injected; versioned templates; tenant-editable designer
- [ ] E-signature integration; tamper-evident issued documents

---

## [ ] EDUOS-114 — File / Media Service 🟠
**Phase:** 1 · **Spec:** part1 §6 · **Depends on:** 105

- [ ] S3-compatible upload, virus scan, thumbnail/preview, access-controlled signed URLs

---

## [ ] EDUOS-115 — Search Service 🟡
**Phase:** 9 · **Spec:** part1 §6 · **Depends on:** 106

- [ ] Unified global search respecting RBAC — a Teacher searching never sees Finance rows

---

## [ ] EDUOS-116 — Import / Export Service 🟠
**Phase:** 1 · **Spec:** part1 §6 · **Depends on:** 104

- [ ] Bulk CSV/Excel import (students, staff, historical fees) with validation + error report
- [ ] Per-module export; full tenant data export for portability

---

# EPIC C — Academic Core completion 🟠 (Phase 2)

---

## [ ] EDUOS-117 — Timetable engine 🟠
**Spec:** part3 §3.1 · **Depends on:** 104

`timetables` table exists with no RLS and no engine; `TeacherTimetable.tsx` is display-only.

- [ ] Constraint-solving auto-generation (teacher availability, room capacity, no double-booking)
- [ ] Manual override; conflicts surfaced to Principal
- [ ] Substitution auto-suggestion when a teacher is on leave

---

## [ ] EDUOS-118 — Report card / transcript generator 🟠
**Spec:** part3 §3.1, part2 §2.4 · **Depends on:** 113

- [ ] Configurable templates per board (CBSE CCE, percentage, GPA, competency/narrative)
- [ ] Auto-computed from gradebook + attendance, plus teacher remarks
- [ ] **Principal sign-off gate before publish** — grades must not surface pre-finalisation
- [ ] Cumulative transcript

---

## [ ] EDUOS-119 — Curriculum builder + syllabus-completion tracker 🟠
**Spec:** part3 §3.1 · **Depends on:** 104

- [ ] Subject → Unit → Topic hierarchy mapped to board standard, pluggable per tenant
- [ ] Lesson plans mapped against the curriculum plan
- [ ] Falling-behind subjects flagged to Principal (inspection norms require pacing evidence)

---

## [ ] EDUOS-120 — Exam management 🟡
**Spec:** part3 §3.1 · **Depends on:** 113

- [ ] Scheduling, seating-plan generator, hall-ticket / admit-card generation
- [ ] Invigilation duty assignment

---

## [ ] EDUOS-121 — Online exam engine + question bank 🟡
**Spec:** part3 §3.1 · **Depends on:** 120

- [ ] MCQ and subjective banks; auto-grading for objective types
- [ ] Plagiarism-aware submission; configurable proctoring

---

## [ ] EDUOS-122 — Learning-outcome / competency tracking 🟡
**Spec:** part3 §3.1 · **Depends on:** 119

- [ ] Tag assessments to learning outcomes, not just marks (NEP 2020 direction)

---

# EPIC D — Finance & Accounts 🟠 (Phase 3 — nothing built)

> Part 7 places Finance at Phase 3, ahead of the HR work already done.
> `ParentFees.tsx` renders fee *display* only; there is no finance module.

---

## [ ] EDUOS-123 — Fee structure builder 🟠
**Spec:** part2 §2.9 · **Depends on:** 104

- [ ] Class-wise and category-wise heads; one-time vs recurring
- [ ] Scholarships and discounts
- [ ] RTE reserved-category waivers (feeds EDUOS-141)

---

## [ ] EDUOS-124 — Invoicing + payment gateway 🟠
**Spec:** part2 §2.9 · **Depends on:** 123, 110, 113

- [ ] Auto-invoice on due date; Razorpay primary, Stripe international, behind an abstraction
- [ ] Offline (cash/cheque/DD) recording with bank reconciliation
- [ ] Auto-reminders and configurable late-fee rules
- [ ] Receipt via Document Engine; `fee.paid` event posts the GL entry
- [ ] Partial payments, refunds, failed gateway callbacks (part7 §7.2 rigor bar)

---

## [ ] EDUOS-125 — Payroll engine 🟠
**Spec:** part2 §2.9 · **Depends on:** 104

- [ ] Salary structure (basic, HRA, allowances)
- [ ] Statutory deductions: PF, ESI, professional tax, TDS
- [ ] Payslip and Form 16 generation
- [ ] Full-and-final settlement triggered from the HR exit workflow

---

## [ ] EDUOS-126 — General ledger + financial statements 🟠
**Spec:** part2 §2.9 · **Depends on:** 124

- [ ] Double-entry GL, trial balance, balance sheet, P&L, cash flow
- [ ] **Append-only with correction records** (part6 §6.1 — never silently overwrite)
- [ ] Budget-vs-actual against the Trustee-approved baseline
- [ ] GST and TDS statutory exports

---

## [ ] EDUOS-127 — Vendor, PO and procurement finance leg 🟡
**Spec:** part2 §2.9, §2.11 · **Depends on:** 112, 126

- [ ] Vendor invoicing with a multi-level approval chain
- [ ] Fixed-asset depreciation schedule linked to Inventory

---

## [ ] EDUOS-128 — Scholarship / fee-waiver workflow 🟡
**Spec:** part2 §2.9 · **Depends on:** 112, 123

- [ ] Eligibility rules with a full audit trail
- [ ] RTE 25% government reimbursement claim flow

---

# EPIC E — Compliance Engine 🟠 (Phase 7 — build early)

> Part 7: "build this earlier than a nice-to-have would suggest, since it's a core
> differentiator, not a Phase-8 afterthought." Part 4 calls it what makes EduOS genuinely
> different. Today `ComplianceLib.tsx` and `PrincipalInspection.tsx` are UI shells and
> **none of the nine specified entities exist.**

---

## [ ] EDUOS-129 — Compliance rule engine core 🟠
**Spec:** part4 §4.1, §4.4 · **Depends on:** 113, 114

- [ ] Entities: `RulesetLibrary`, `ComplianceItem`, `TenantComplianceAssignment`,
      `ComplianceEvidence`, `ComplianceStatusLog`
- [ ] Rulesets as **data, never hardcoded logic** (part4 §4.3)
- [ ] Super Admin maintains the library centrally; one update reaches every tenant
- [ ] Tenant assigned one or more rulesets at onboarding; national + state + board layer additively
- [ ] Compliance Dashboard: green/amber/red per item, days-to-expiry countdown
- [ ] Every item requiring a document links to real stored evidence, not a checkbox
- [ ] In-app disclaimer that institutions must verify with their board/legal counsel

---

## [ ] EDUOS-130 — Inspection Mode 🟠
**Spec:** part4 §4.2C, part2 §2.3 · **Depends on:** 129

- [ ] One-click view bundling admission registers, attendance, financials, fee receipts,
      staff appointment letters and safety documentation
- [ ] Gaps flagged explicitly

---

## [ ] EDUOS-131 — Committees and restricted ComplaintCase 🟠
**Spec:** part4 §4.2D, §4.4 · **Depends on:** 129, 109

**The strictest access control in the platform.** Part 4 requires a distinct, more
restrictive permission tier than general support tickets, and every **view** logged.

- [ ] Generic `Committee` + `CommitteeMember` (SMC / POCSO / POSH / Anti-Ragging / Safety)
- [ ] POCSO Child Protection Committee: composition, meeting cadence, case handling
- [ ] POSH Internal Committee: separate from POCSO, statutory resolution-window tracking
- [ ] Anti-Ragging Committee with annual affidavit collection (higher-ed tenants)
- [ ] `ComplaintCase` visible only to assigned committee members — never routed to a
      student's regular teacher by default
- [ ] Every view logged to the audit trail
- [ ] `complaint.case_opened` / `case_updated` events notify only assigned members

---

## [ ] EDUOS-132 — UDISE+ data capture and export 🟡
**Spec:** part4 §4.2A · **Depends on:** 129

- [ ] Structured capture matching UDISE+ categories (profile, safety, receipts/expenditure,
      facilities, enrollment by age/class/category, teacher records)
- [ ] APAAR ID and CWSN flags on student records; National Code on teacher records
- [ ] Bulk export in UDISE+-compatible format
- [ ] Deadline tracking with data-lock date and escalating reminders to Principal
- [ ] Mid-year admission follow-up handling

---

## [ ] EDUOS-133 — RTE Act compliance 🟡
**Spec:** part4 §4.2B · **Depends on:** 129, 143

- [ ] SMC composition and term tracking (feeds Trustee module)
- [ ] 25% reserved-category seat tracking with category proof
- [ ] Recognition-certificate tracking with renewal reminders
- [ ] Infrastructure-norm checklist (classroom ratio, water, separate girls' toilets, playground)

---

## [ ] EDUOS-134 — Board affiliation registers + Mandatory Public Disclosure 🟡
**Spec:** part4 §4.2C, part7 §7.5 · **Depends on:** 129

- [ ] Admission and withdrawal register as a first-class auditable record
- [ ] Attendance registers with Principal sign-off
- [ ] Exam paper/answer-script retention with configurable window
- [ ] Staff service records (already partly built in EDUOS-101 — wire into compliance)
- [ ] **Public Disclosure page auto-generated from live data**, not a stale PDF
- [ ] LOC submission tracking for Class X/XII
- [ ] Teacher training-day minimums tracked via TrainingRecord
- [ ] Show-cause / notice-and-response timeline workflow

---

## [ ] EDUOS-135 — Safety, health and statutory certificates 🟡
**Spec:** part4 §4.2C, §4.2F · **Depends on:** 129, 145

- [ ] Fire NOC, extinguisher recharge log, fire-exit signage, structural safety certificate
- [ ] CCTV coverage and daily functionality checklist
- [ ] First-aid room, ramp/accessibility
- [ ] Annual safety self-audit as a recurring item with a reusable structured form
- [ ] FSSAI-style food safety for canteen/mess
- [ ] Photo-evidence upload and recheck scheduling on each item

---

## [ ] EDUOS-136 — Financial and labour statutory tracking 🟡
**Spec:** part4 §4.2E · **Depends on:** 129, 125

- [ ] GST registration and return tracking (flag for the institution's CA, do not auto-decide)
- [ ] Trust/Society registration renewal, 12A/80G status (feeds Alumni donations)
- [ ] PF, ESI, professional tax tied to payroll
- [ ] TDS filing reminders
- [ ] Minimum-wage and labour-law leave-policy checks

---

# EPIC F — Missing Stakeholder Modules 🟡

> 8 of 14 Part 2 modules have no code at all.

---

## [ ] EDUOS-137 — Trustee / Board module 🟡
**Phase:** 4 · **Spec:** part2 §2.2 · **Depends on:** 112, 126

- [ ] Executive dashboard: enrollment, revenue/expense, headcount, compliance traffic-light
- [ ] Multi-branch roll-up with drill-down
- [ ] Budget approval workflow; approved budget becomes the Finance baseline
- [ ] Policy repository with version history
- [ ] Board meeting scheduler, agenda builder, digital minutes, action-item tracking
- [ ] Managing Committee / Society records with term and renomination reminders
- [ ] Read-only cross-module oversight — **cannot edit operational records** (part6 §6.2)

---

## [ ] EDUOS-138 — Non-Teaching Staff module 🟡
**Phase:** 6 · **Spec:** part2 §2.5 · **Depends on:** 112

- [ ] Front Office: visitor management with gate pass + photo, enquiry log, courier register, ID issuance
- [ ] Facilities: maintenance ticketing with photo proof and requester confirmation
- [ ] Preventive maintenance scheduling for fire, electrical, water
- [ ] Security: visitor log, CCTV daily checklist, incident reporting
- [ ] Accountant: daily collection entry, petty cash register

---

## [ ] EDUOS-139 — Admissions & CRM 🟡
**Phase:** 5 · **Spec:** part2 §2.14 · **Depends on:** 112, 124

- [ ] Application form builder per class/program
- [ ] Document upload + verification checklist
- [ ] Entrance test / interview scheduling and scoring
- [ ] Merit list with configurable weighting and reserved-category quotas
- [ ] Seat allotment with waitlist auto-promotion
- [ ] On acceptance: auto-create StudentProfile, link ParentProfile, generate first invoice
- [ ] Cannot finalise without Principal approval (part6 §6.2)

---

## [ ] EDUOS-140 — Marketing 🟡
**Phase:** 5 · **Spec:** part2 §2.12 · **Depends on:** 111

- [ ] Drag-drop landing page builder, white-labeled
- [ ] Embeddable / QR-linkable lead capture
- [ ] CRM pipeline with configurable stages
- [ ] Email/SMS/WhatsApp campaigns with nurture sequences
- [ ] UTM and ad-campaign attribution, cost per lead / per enrollment
- [ ] Referral programme tracking
- [ ] Attribution history survives handoff to Admissions

---

## [ ] EDUOS-141 — Inventory & Facilities 🟡
**Phase:** 6 · **Spec:** part2 §2.11 · **Depends on:** 112, 127

- [ ] Asset register with QR/barcode, location, purchase value, depreciation link
- [ ] Stock in/out with low-stock alerts
- [ ] Procurement request → approval → PO → vendor invoice → payment, end to end
- [ ] Safety-equipment tracking feeding the compliance dashboard
- [ ] Room/lab/equipment booking calendar
- [ ] Disposal / write-off with approval trail
- [ ] Inventory Manager cannot approve own procurement above threshold

---

## [ ] EDUOS-142 — Transport (full module) 🟡
**Phase:** 6 · **Spec:** part3 §3.3 · **Depends on:** 111, 129

Only `ParentBusTracking.tsx` exists today.

- [ ] Route planner with stop sequencing and timing
- [ ] Vehicle and driver assignment; driver document expiry alerts
- [ ] Live GPS with parent-facing ETA
- [ ] RFID/QR boarding + deboarding logs with automatic parent alerts on both
- [ ] Vehicle compliance: fitness, insurance, pollution, permit — with expiry reminders
- [ ] Route optimisation and capacity planning
- [ ] Driver incident/breakdown reporting

---

## [ ] EDUOS-143 — Hostel 🟡
**Phase:** 6 · **Spec:** part3 §3.4 · **Depends on:** 112, 124

- [ ] Room/bed allocation with capacity management
- [ ] Mess menu planning and billing linked to Finance
- [ ] In/out register, warden-approved
- [ ] Leave workflow requiring **parent digital consent**, not just staff sign-off
- [ ] Warden dashboard: occupancy, pending leave, health/incident log
- [ ] Hostel visitor log; emergency contact quick-access

---

## [ ] EDUOS-144 — Library 🟡
**Phase:** 6 · **Spec:** part3 §3.5 · **Depends on:** 124

- [ ] Catalog search, barcode issue/return
- [ ] Overdue fine auto-calculation linked to Finance
- [ ] Reservation queue; digital lending limits
- [ ] Reading-habit analytics; inter-branch catalog sharing

---

## [ ] EDUOS-145 — Alumni 🟡
**Phase:** 8 · **Spec:** part2 §2.8 · **Depends on:** 110, 124

- [ ] Directory with opt-in privacy controls
- [ ] Mentorship matching; job board
- [ ] Donations with 80G tax-exemption receipts; donor recognition tiers
- [ ] Reunion management with RSVP and ticketing
- [ ] Auto-migration on graduation via `student.graduated`

---

## [ ] EDUOS-146 — Social Media Management 🟡
**Phase:** 8 · **Spec:** part2 §2.13 · **Depends on:** 112, 114

- [ ] Multi-platform calendar and scheduler
- [ ] Post approval workflow — Marketing drafts, Principal approves
- [ ] **Child-safety guardrail (mandatory):** any post with a student photo must pass a
      `ConsentCheck` against parental consent; block publish and alert if missing or withdrawn
- [ ] Never auto-publish without human sign-off
- [ ] Engagement analytics; reputation monitoring

---

## [ ] EDUOS-147 — Events & Calendar 🟡
**Phase:** 8 · **Spec:** part3 §3.6 · **Depends on:** 113, 124

- [ ] Unified academic calendar filtered per role
- [ ] Event registration with capacity and optional ticketing
- [ ] Volunteer/staff duty assignment
- [ ] Gallery feeding Social Media under the same consent guardrail
- [ ] Certificate-of-participation auto-generation

---

## [ ] EDUOS-148 — Communication layer completion 🟡
**Phase:** 9 · **Spec:** part3 §3.2 · **Depends on:** 111

- [ ] In-app messaging with child-safety RBAC on student↔staff DMs
- [ ] Broadcast targeting by role/class/branch/individual
- [ ] Emergency/SOS broadcast with acknowledgment tracking
- [ ] Per-user language preference; digest vs real-time preference centre

---

# EPIC G — AI Intelligence Layer 🟡 (Part 5 — 2 of 11 built)

> Built: `TeacherAIQuestions.tsx` (5.3), `ParentAIReport.tsx` (5.7).
> Part 5 positions AI as an intelligence layer for teachers/management/parents,
> explicitly **not** a student-facing tutor.

---

## [ ] EDUOS-149 — Intelligence Engine architecture 🟡
**Phase:** 11 · **Spec:** part5 §5.10 · **Depends on:** 110

- [ ] Batch/on-demand processing model, not real-time per-student chatbots
- [ ] Everything below depends on this — build first

---

## [ ] EDUOS-150 — AI student performance analysis 🟡 · part5 §5.1 · dep 149
## [ ] EDUOS-151 — AI test analysis and actionable insights 🟡 · part5 §5.2 · dep 149
## [ ] EDUOS-152 — AI teacher assistant (lesson plans, worksheets, revision) 🟡 · part5 §5.4 · dep 149
## [ ] EDUOS-153 — AI management intelligence 🟡 · part5 §5.5 · dep 149
## [ ] EDUOS-154 — AI admissions intelligence 🟡 · part5 §5.6 · dep 149, 139
## [ ] EDUOS-155 — Content and accessibility features 🟡 · part5 §5.8 · dep 149
## [ ] EDUOS-156 — Marketplace, plugins and opt-in benchmarking 🟡 · part5 §5.9 · dep 158

---

# EPIC H — Platform, API & Delivery 🟠

---

## [ ] EDUOS-157 — Normalise API structure and publish OpenAPI 🟠
**Spec:** part6 §6.4 · **Depends on:** 106

`hr.controller.ts` correctly uses `/api/v1/hr`, but `app.controller.ts` uses flat routes
(`tenants`, `attendance/mark`, `notices`) with no `/api/v1/{tenant}/` prefix.

- [ ] All routes under `/api/v1/{tenant}/{module}/*`
- [ ] OpenAPI spec auto-generated and published per environment
- [ ] Rate limiting and per-integration API keys, independently revocable

---

## [ ] EDUOS-158 — Webhooks and public developer API 🟡
**Spec:** part6 §6.4 · **Depends on:** 110, 157

- [ ] Webhook per domain event in §6.3
- [ ] OAuth2 scoped, tenant-consented access for verified third-party developers

---

## [ ] EDUOS-159 — GraphQL gateway for dashboard aggregation 🟡
**Spec:** part1 §5, part6 §6.4 · **Depends on:** 157

- [ ] Single query serving Principal's dashboard across six modules

---

## [ ] EDUOS-160 — Deployment infrastructure 🟠
**Spec:** part7 §7.4 item 6 · **Depends on:** —

**Nothing exists today** — no Dockerfile, no compose, no k8s, no Terraform, no CI.

- [ ] Docker Compose for local dev
- [ ] Kubernetes manifests + Terraform for production
- [ ] Per-tenant custom-domain ingress routing (pairs with the existing `dns-ssl` module)
- [ ] GitHub Actions: migrations, seed, per-environment deploys

---

## [ ] EDUOS-161 — Mobile app + shared types package 🟡
**Spec:** part1 §5, part7 §7.4 item 2 · **Depends on:** 157

The monorepo is only `frontend/` + `backend/`.

- [ ] React Native (Expo) app
- [ ] Shared TypeScript types/schema package consumed by web, mobile and backend
- [ ] Offline-tolerant attendance queue-and-sync (part7 §7.3)

---

## [ ] EDUOS-162 — White-label engine completion 🟡
**Spec:** part1 §3 · **Depends on:** 111, 113

`BrandingStudio.tsx` covers colours. Still missing:

- [ ] Logo/favicon upload in multiple sizes, font family, display name, tagline
- [ ] Runtime CSS custom properties per tenant — no per-tenant rebuild
- [ ] Per-tenant SMTP / sender ID / WhatsApp number
- [ ] White-label document templates with a tenant-editable designer
- [ ] Co-branding "Powered by EduOS" toggle
- [ ] White-label mobile build pipeline (EAS/Fastlane)

---

## [ ] EDUOS-163 — Super Admin dashboard completion 🟡
**Spec:** part1 §4 · **Depends on:** 105, 109

Built: TenantManager, BrandingStudio, FeatureMatrix, ComplianceLib. Missing:

- [ ] Tenant onboarding wizard (institution type, board, expected scale)
- [ ] Plan/package builder mapping to feature-flag presets
- [ ] Billing to institutions — distinct from institutions' fee collection from parents
- [ ] Usage and health monitoring; churn/limit flags
- [ ] **Impersonation** — time-boxed, logged, with a banner visible to the tenant
- [ ] Global announcements and status page
- [ ] Tenant lifecycle states: trial → active → suspended → archived → deleted

---

## [ ] EDUOS-164 — Remaining QA bars 🟠
**Spec:** part7 §7.2, §7.3 · **Depends on:** 108

- [ ] Financial rigor tests: double-entry correctness, reconciliation edge cases, payroll deductions
- [ ] Compliance accuracy tests: expiry countdown, ruleset layering, ComplaintCase access
- [ ] Load test: 10,000+ student tenant at attendance and report-card peak
- [ ] WCAG 2.1 AA audit on all stakeholder portals
- [ ] White-label rendering across 3+ tenant configs
- [ ] Sub-2-second dashboard load; async queue for heavy report generation

---

## [ ] EDUOS-165 — Second institution-type seed data 🟡
**Spec:** part7 §7.4 item 5 · **Depends on:** 104

Only `seed_cbse_9_10.sql` exists.

- [ ] Seed for a second type (college or coaching institute)
- [ ] Demonstrates the ruleset abstraction with a different board/jurisdiction

---

## [ ] EDUOS-166 — Living spec-to-code README 🟡
**Spec:** part7 §7.4 item 7 · **Depends on:** —

- [ ] README maps all 7 spec parts to implemented modules
- [ ] Correct the current claim that Phase 1 is complete
- [ ] Kept current as each ticket closes

---

# Summary

| Epic | Tickets | Priority |
|---|---|---|
| A — Security & Tenancy | 7 | 🔴 P0 |
| B — Cross-Cutting Systems | 8 | 🟠 P1 |
| C — Academic Core | 6 | 🟠 P1 |
| D — Finance | 6 | 🟠 P1 |
| E — Compliance | 8 | 🟠 P1 |
| F — Stakeholder Modules | 12 | 🟡 P2 |
| G — AI Layer | 8 | 🟡 P2 |
| H — Platform & Delivery | 10 | 🟠/🟡 |
| **Total** | **65** | |

**Start here:** EDUOS-102 → 103 → 104. Until those three land, every new module inherits
a cross-tenant data leak.
