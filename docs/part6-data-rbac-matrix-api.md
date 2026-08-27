# PART 6 — DATA MODEL, RBAC PERMISSION MATRIX, API & EVENT CATALOG

---

## 6.1 CORE DATA MODEL (high level — expand per module in Parts 2–5)

```
Tenant (1)──<Branch (1)──<AcademicYear──<ClassSection──<Student
Tenant (1)──<Employee (role: Teaching/NonTeaching/HR/Finance/Marketing/SocialMedia/Inventory/Admissions)
Tenant (1)──<FeatureFlag, BrandingConfig, DomainMapping, Subscription, TenantComplianceAssignment
Student (1)──<Attendance, Grade, FeeInvoice, LibraryLoan, HostelAllocation, DigitalIDCard
Employee (1)──<Payslip, LeaveRequest, PerformanceReview, TrainingRecord
Lead ──>Application ──>Student (conversion event)
Student ──>AlumniProfile (post-graduation migration event)
Role (1)──<Permission (module, sub_feature, action, scope)
ComplianceItem (1)──<ComplianceEvidence, ComplianceStatusLog
```

**Universal columns on every table:** `id (uuid), tenant_id, branch_id (nullable), created_at, updated_at, created_by, updated_by, is_deleted (soft delete), version (optimistic locking on financial/academic records)`.

**Financial and academic records are append-mostly**: corrections to grades, attendance, or ledger entries should create a correction record referencing the original, never silently overwrite — this preserves audit integrity for both Trustee oversight and board inspection (Part 4).

---

## 6.2 RBAC PERMISSION MATRIX (representative — ship as seed data, tenant-editable)

Format: `Role → Module → Action(s) → Scope`

| Role | Can do | Cannot do (by default) |
|---|---|---|
| Super Admin | Everything on the platform layer: tenant CRUD, feature flags, billing-to-tenant, impersonation (logged) | Cannot silently view a tenant's operational data without impersonation being logged and visible to the tenant |
| Trustee | View: all modules, tenant-wide scope. Approve: budgets, major policy | Cannot edit day-to-day operational records (attendance, grades) — oversight, not operations |
| Principal | View/Edit/Approve: all modules, branch scope. Approve: leave, admissions, incidents | Cannot edit Finance ledger entries directly (view + approve only, to preserve segregation of duties) |
| Teacher | View/Edit: own classes' attendance, grades, LMS content, lesson plans. View: own payslips | Cannot view other teachers' classes' grades, cannot view Finance/HR/other students' records |
| Class Teacher | Teacher permissions + View: full roster of own class across subjects, Edit: class-level remarks | Same restrictions as Teacher otherwise |
| Non-Teaching (sub-typed) | Scoped strictly to their function (Front Office: visitor/enquiry; Accountant: collections; Librarian: catalog/circulation) | Cannot view academic grades, HR records, or other functions' data |
| HR Manager | View/Edit: Employee records, ATS, Payroll input, PerformanceReview | Cannot view Student academic/financial records unless also holding a Finance/Admin role |
| Finance Manager | View/Edit: FeeStructure, Invoice, Payment, PayrollRun, GL, Vendor | Cannot edit Student academic records; cannot approve own large expenditures without Trustee approval chain |
| Marketing Manager | View/Edit: Lead, Campaign, LandingPage | Cannot view enrolled Student academic/financial records unless converted and handed off |
| Social Media Manager | View/Edit: SocialPost, MediaAsset, EngagementMetric | Cannot publish a post containing a student photo without a passing ConsentCheck (system-enforced, not just policy) |
| Inventory Manager | View/Edit: Asset, StockItem, ProcurementRequest, PurchaseOrder | Cannot approve own procurement above configured threshold — routes to Principal/Finance |
| Admissions Officer | View/Edit: Application, Document, EntranceTest, MeritList | Cannot finalize admission without Principal approval step |
| Student | View: own records only (attendance, grades, fees, library) | Cannot view any other student's individual data |
| Parent | View: own child(ren)'s records only; Edit: own consent forms, payment | Cannot view other students' data, cannot edit grades/attendance |
| Alumni | View/Edit: own AlumniProfile, Donation, JobPosting (own posts) | Cannot access current students' operational data beyond opted-in mentorship scope |
| Auditor/Compliance Officer | View (read-only): cross-module, tenant-wide, plus full ComplianceItem access | Cannot edit any operational record — pure oversight role |
| POCSO/POSH Committee Member | View/Edit: ComplaintCase records they're assigned to, strictly | Cannot view unrelated student/staff records; every view logged |

Full matrix (every module × sub-feature × action) should be generated as a seed migration from this pattern, not hand-typed per row — build a script that expands module definitions from Parts 2–5 into the permissions table automatically, then allow manual override for exceptions.

---

## 6.3 CORE DOMAIN EVENTS (event bus catalog — extend per module)

```
tenant.created / tenant.suspended / tenant.plan_changed
student.enrolled / student.withdrawn / student.promoted / student.graduated
staff.onboarded / staff.offboarded / staff.role_changed
attendance.marked / attendance.corrected
grade.recorded / grade.published
fee.invoiced / fee.paid / fee.overdue / fee.waived
application.submitted / application.status_changed / seat.offered / seat.confirmed
asset.issued / asset.returned / maintenance.ticket_raised / maintenance.ticket_resolved
compliance.item_expiring / compliance.item_expired / compliance.evidence_uploaded
complaint.case_opened / complaint.case_updated (access-restricted event, notify only assigned committee)
donation.received / alumni.migrated
social_post.scheduled / social_post.published / social_post.consent_blocked
```

Every event carries `tenant_id`, `branch_id`, `actor_id`, `timestamp`, and a typed payload. Subscribers (e.g., Notification Service, Audit Log) attach independently — publishing modules never need to know who's listening.

---

## 6.4 API STRUCTURE

- **REST namespace per module:** `/api/v1/{tenant}/academics/*`, `/api/v1/{tenant}/finance/*`, `/api/v1/{tenant}/hr/*`, `/api/v1/{tenant}/compliance/*`, etc.
- **GraphQL gateway** for dashboard aggregation (e.g., Principal's unified dashboard pulling from six modules in one query).
- **Webhooks** for every domain event in §6.3 so a tenant's approved integrations (or EduOS's own async workers) can react without polling.
- **Public developer API** (for the marketplace ecosystem in Part 5 §5.6): scoped, tenant-consented, OAuth2-based access for verified third-party plugin developers.
- **Rate limiting and API keys** per integration, independently revocable.
- **OpenAPI spec auto-generated and published per tenant's environment** so their own IT staff (for larger institutions) can build lightweight internal integrations if truly needed — reinforcing the "you don't need other software, but you're not locked in either" positioning.

---

**End of Part 6. Proceed to Part 7 for the build plan, QA bar, deliverables, and the compliance-register appendix.**
