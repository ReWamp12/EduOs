# PART 7 — BUILD PLAN, QA BAR, DELIVERABLES & COMPLIANCE APPENDIX

---

## 7.1 SUGGESTED BUILD ORDER (confirm/adjust with the coding agent before Phase 1)

| Phase | Scope |
|---|---|
| 1 | Platform foundation: multi-tenancy engine + RLS, auth/RBAC engine, Developer Dashboard (tenant CRUD, feature flags, branding, domain mapping), event bus, notification service skeleton |
| 2 | Academic core: Student/Staff records, Class/Timetable, Attendance, Gradebook, basic LMS, report-card engine |
| 3 | Finance: fee structure, invoicing, payment gateway integration, payroll basics, GL |
| 4 | Stakeholder portals: Parent app, Student app, Principal dashboard, Trustee dashboard |
| 5 | Admissions & Marketing: lead CRM, landing-page builder, application-to-enrollment flow |
| 6 | HR & Hiring, Inventory/Facilities, Transport, Hostel, Library |
| 7 | Compliance Module (Part 4): ruleset engine, UDISE+/board/RTE ComplianceItems, POCSO/POSH/Anti-Ragging committee workflows — build this earlier than a "nice to have" would suggest, since it's a core differentiator, not a Phase-8 afterthought |
| 8 | Social Media Management, Alumni, Events |
| 9 | Analytics/BI, document/compliance vault polish, notification-engine refinement |
| 10 | White-label mobile app pipeline, public API/webhooks, marketplace of plugins |
| 11 (ongoing) | Part 5 AI-native features, rolled out incrementally behind an "Innovation Tier" flag once core stability is proven |

The agent should restate understanding of the current phase's scope, propose a task breakdown, and flag any Part-1-architecture decision it's about to make irreversibly (e.g., choosing shared-DB vs schema-per-tenant) before writing code.

---

## 7.2 QA / TESTING BAR

- **Tenant-isolation tests**: automated suite that authenticates as Tenant A and actively attempts to read/write Tenant B's data across every module — must always fail. Run on every PR touching a data-access layer.
- **RBAC regression tests**: for every role, a test asserting what it *can* and *cannot* do per the matrix in Part 6 §6.2 — run against real API routes, not just unit-tested permission logic.
- **Financial-module test rigor**: double-entry ledger correctness, payment-reconciliation edge cases (partial payments, refunds, failed gateway callbacks), payroll statutory-deduction accuracy.
- **Compliance-module accuracy tests**: expiry-date countdown logic, ruleset-assignment inheritance (tenant gets national + state + board rules correctly layered), and access-restriction tests on ComplaintCase records specifically.
- **Load/scale testing**: simulate a large tenant (10,000+ students) for attendance-marking and report-card-generation peak windows (start of term, exam season) — these are predictable traffic spikes unique to education software.
- **Accessibility testing**: WCAG 2.1 AA automated + manual audit on all stakeholder portals, particularly Parent/Student given wide device/literacy variance.
- **White-label rendering tests**: verify branding (colors, logo, domain) renders correctly across at least 3 sample tenant configurations, including RTL-language readiness if targeting relevant markets.

---

## 7.3 NON-FUNCTIONAL TARGETS

- 99.9% uptime target; automated backups with point-in-time recovery.
- Sub-2-second dashboard load; async/queued processing for heavy report generation (bulk report cards, UDISE+ export).
- Support institutions from ~100 students to 50,000+ students per tenant without architecture change (only scaling config).
- Offline-tolerant mobile flows for attendance and low-connectivity rural deployments (queue-and-sync).

---

## 7.4 EXPECTED DELIVERABLES FROM THE CODING AGENT (per phase, cumulative)

1. Architecture decision record confirming Part 1 choices (or documented deviations with rationale).
2. Monorepo scaffold: backend, frontend, mobile, shared TypeScript types/schema package.
3. Working multi-tenancy + RBAC + feature-flag engine with the isolation test suite (§7.2) passing.
4. Functional Developer Dashboard: create tenant → toggle features → brand → map domain, end to end.
5. Each subsequent phase delivered with: working demo, seed data for at least 2 institution types (school + college), API documentation (OpenAPI/GraphQL schema auto-generated), and updated test coverage.
6. Deployment scripts: Docker Compose for local dev, Kubernetes manifests + Terraform for production, including per-tenant custom-domain ingress routing.
7. A living README mapping this 7-part spec to actual implemented modules, so future contributors (human or AI) can navigate the codebase against this document.

---

## 7.5 APPENDIX — MANDATORY REGISTERS/DOCUMENTS AN INDIAN SCHOOL TYPICALLY MAINTAINS
*(build each as a first-class, auditable record inside the relevant module — never a loose uploaded file standing in for the real data)*

| Register/Document | Maintained by (module) | Statutory driver (representative) |
|---|---|---|
| Admission & withdrawal register | Admissions/Student module | Board affiliation bye-laws |
| Attendance registers (with sign-off) | Academic Core | Board bye-laws; exam-eligibility rules |
| Examination question papers/answer scripts (retention window) | Academic Core / Exam module | Board bye-laws |
| Staff service records (appointment/confirmation letters, service book) | HR module | Board bye-laws; labour law |
| Fee structure & receipts | Finance module | State fee-regulation acts; board mandatory disclosure |
| Managing Committee/SMC composition & minutes | Trustee module | RTE Act; board bye-laws |
| UDISE+ annual data submission | Compliance module (auto-fed from Academic/HR/Facilities) | Ministry of Education mandate |
| Recognition certificate | Compliance module | RTE Act / State Education Act |
| Board affiliation letter & LOC records | Compliance module | Board affiliation bye-laws |
| Fire safety NOC & extinguisher log | Compliance / Facilities module | State fire safety norms |
| Building/structural safety certificate | Compliance / Facilities module | State safety norms |
| POCSO Child Protection/Complaints Committee records | Compliance module (restricted access) | POCSO Act, 2012 |
| POSH Internal Committee records | Compliance module (restricted access) | POSH Act, 2013 |
| Anti-Ragging Committee records (higher ed) | Compliance module | UGC/Supreme Court mandate |
| Annual safety self-audit | Compliance module | State-level safety orders (varies) |
| Staff background/police verification | HR module (onboarding gate) | State-level child-safety orders (varies) |
| Transport vehicle compliance (fitness, insurance, permit) | Transport module | Motor Vehicles Act; state school-transport safety rules |
| Payroll statutory records (PF/ESI/PT/TDS) | Finance/HR module | Labour & tax law |
| Mandatory Public Disclosure page | Compliance module (auto-generated) | Board affiliation bye-laws |

*(This table is illustrative and non-exhaustive; exact requirements vary by state and board and change over time — this is precisely why Part 4's ruleset engine must be data-driven and centrally updatable, not hardcoded.)*

---

**End of Master Prompt (Parts 1–7).** Feed all 7 parts (plus `00-INDEX.md`) to the coding agent as its founding specification, and have it confirm Phase 1 scope before writing any code.
