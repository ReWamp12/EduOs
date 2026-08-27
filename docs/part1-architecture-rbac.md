# PART 1 — VISION, ARCHITECTURE, TECH STACK & RBAC FRAMEWORK

---

## 1. PRODUCT VISION

Build **EduOS**: a multi-tenant SaaS Education Operating System that replaces every piece of software an educational institution currently uses — SIS, LMS, accounting, HRMS, CRM, marketing automation, social media scheduler, inventory system, communication tool, alumni platform, compliance tracker — with one platform, sold white-labeled to schools, colleges, coaching institutes, and universities directly or through resellers.

**Strategic Focus (this build):** This implementation prioritizes **coaching institutes** as the primary target, with extensible architecture to support schools, colleges, and universities. The AI strategy (Part 5) reflects coaching-institute priorities: **AI as an intelligence layer for teachers, management, and parents — not a student-facing tutor.** This results in significantly lower operational cost, clearer ROI, and reduced child-safety compliance burden compared to student-tutoring models.

Non-negotiable properties:
- **Multi-tenant**: one codebase, many isolated institutions.
- **White-label**: every tenant can look like their own product (branding, domain, app).
- **Modular & feature-flagged**: a tenant only sees/pays for what's enabled. Coaching institutes enable fewer compliance-heavy modules than schools; universities enable research/alumni/credential-issuing features.
- **RBAC-driven end-to-end**: every screen, API route, report, and notification respects role permissions — no feature exists "outside" the permission system.
- **Compliant by design**: statutory recordkeeping and reporting (Part 4) isn't a bolt-on, it's core. Rulesets are configurable per jurisdiction/board.
- **AI-as-intelligence, not-AI-as-tutor**: AI powers backend analysis, dashboards, and insights for stakeholders. Does not position an AI as the primary instructor. Coaching-friendly cost model: batch processing and on-demand analysis rather than real-time per-student chatbots.
- **Future-proof**: architecture leaves room for additional features (Part 5) without re-architecture.

---

## 2. MULTI-TENANCY ENGINE

- **Isolation strategy**: default to shared database with mandatory `tenant_id` on every table + Postgres Row-Level Security (RLS) policies enforced at the DB layer (not just application layer — this is critical, app-layer-only isolation is a common and dangerous shortcut). Offer schema-per-tenant or DB-per-tenant as an "Enterprise isolation" upgrade for large clients (universities, government contracts) who require it contractually.
- **Tenant resolution**: by subdomain (`{tenant}.eduos.app`) by default, or by custom domain (mapped via Part 1 §4).
- **Tenant hierarchy**: support Tenant → Branch/Campus → Academic Year → Class/Section, so a single institution group (e.g., a trust running 5 schools) can be one tenant with multiple branches, with roll-up reporting at the trust level and isolated operational data at branch level.
- **Tenant lifecycle states**: `trial → active → suspended (non-payment) → archived (read-only export mode) → deleted (after data-retention window + explicit confirmation)`.
- **Per-tenant configuration store**: academic calendar, grading scale, currency, language, board/curriculum type, compliance ruleset (Part 4), fee categories — all tenant-configurable, none hardcoded.

---

## 3. WHITE-LABEL ENGINE

- **Branding config per tenant**: logo (multiple sizes/formats), favicon, primary/secondary/accent colors, font family, app display name, tagline, email "from" name, support contact details.
- **Theming implementation**: CSS custom properties/design tokens generated per tenant at runtime (not per-tenant recompiled builds) so branding updates apply instantly without redeployment.
- **Custom domain mapping**: tenant enters their domain in the Developer Dashboard → system displays required CNAME/A record → background job polls DNS → on verification, auto-provisions SSL (Let's Encrypt/ACM) → routes via reverse proxy/ingress → tenant site goes live on their domain with EduOS branding invisible to end users unless explicitly permitted (co-branding toggle for "Powered by EduOS" footer).
- **White-label mobile app pipeline** (advanced tier): per-tenant app icon/splash/name generation, automated build pipeline (Expo EAS or Fastlane) producing tenant-specific iOS/Android builds, optional store-listing metadata generator, submission checklist for tenants who want their own App Store/Play Store listing.
- **White-label email/SMS/WhatsApp sender identity**: tenant can configure their own SMTP, sender ID, and WhatsApp Business number so all communications appear to originate from the institution, not from EduOS.
- **White-label document templates**: certificates, report cards, invoices, ID cards, offer letters — all templated with tenant branding auto-injected, but tenant-editable via a template designer.

---

## 4. DEVELOPER / SUPER ADMIN DASHBOARD

This is the control tower. Build it as its own privileged app, separate route/subdomain from tenant apps.

**Core capabilities:**
- Tenant CRUD + onboarding wizard (institution type: school/college/coaching/university; board/curriculum; expected scale).
- **Feature toggle matrix**: a checkbox grid of every module and sub-feature (see Parts 2–5) per tenant, driven by their subscribed plan but individually overridable.
- **Plan/package builder**: define reusable bundles (e.g., "School Starter", "School Pro", "University Enterprise") mapping to feature-toggle presets; assign a plan to a tenant in one click.
- Branding Studio (Section 3) and Domain Mapping UI.
- **Billing to institutions**: subscription plans, seat-based or student-count-based pricing tiers, invoicing, payment collection from the institution itself (distinct from the institution's own fee collection from parents — don't conflate these).
- **Usage & health monitoring**: active users, storage consumed, API call volume, error rates, module adoption per tenant — flag tenants at risk of churn or approaching plan limits.
- **Impersonation**: Super Admin can log in as a tenant's admin for support purposes — must be explicitly logged, time-boxed, and visible to the tenant (a banner "Support is viewing your account" plus an audit trail entry).
- **Global announcements & status page**: platform-wide notices, maintenance windows, incident status.
- **Compliance ruleset library** (feeds Part 4): maintain the master library of board/state compliance rule-sets; assign the applicable ruleset(s) to each tenant.
- **Marketplace/plugin registry** (feeds Part 5 extensibility): approve/list third-party or first-party add-on modules a tenant can enable.

---

## 5. RECOMMENDED TECH STACK

| Layer | Choice | Why |
|---|---|---|
| Frontend (web) | Next.js 14+ (React, TypeScript, App Router) | SSR for public/admission pages, CSR for dashboards, one framework for both |
| Mobile | React Native (Expo) | Shared TypeScript types/logic with web; supports white-label build pipeline |
| Backend | NestJS (Node.js, TypeScript) | Modular, dependency-injected, maps cleanly to domain modules in Parts 2–5 |
| API | REST (public/integration) + GraphQL (internal dashboard aggregation) | Best of both; REST for webhooks/third parties, GraphQL for complex nested dashboard queries |
| Primary DB | PostgreSQL | RLS for tenant isolation, strong relational integrity for financial/academic data |
| Cache/Queue | Redis + BullMQ | Session cache, rate limiting, background jobs (report generation, notifications, DNS polling) |
| Event bus | Redis Streams initially → Kafka at scale | Cross-module events (Section 6) |
| Search | OpenSearch/Elasticsearch | Global search across students, staff, documents, content |
| File/Object storage | S3-compatible (AWS S3 / MinIO for self-host) | Documents, certificates, media, backups |
| Auth | Custom JWT/OAuth2 + RBAC engine; SSO via SAML/OIDC (Google Workspace, Microsoft 365) | Institutions commonly already use Google/Microsoft accounts |
| Payments | Multi-gateway abstraction (Razorpay primary for India, Stripe for international) | Fee collection, payroll disbursement, platform billing |
| Infra | Docker + Kubernetes, Terraform (IaC) | Multi-tenant routing (ingress per custom domain), horizontal scaling |
| CI/CD | GitHub Actions | Automated migrations, seed data, per-environment deploys |
| Notifications | Email (SES/SendGrid), SMS gateway, WhatsApp Business API, Push (FCM/APNs) | Unified notification service (Section 6) |
| BI/Analytics | Metabase (embedded, per-tenant row-secured) or custom dashboards on read replicas | Role-specific analytics across all parts |
| Observability | OpenTelemetry + Grafana/Prometheus + Sentry | Multi-tenant-aware logging/tracing (tag every log/span with tenant_id) |

The agent may substitute equivalents with justification but must preserve: modular monolith with clear domain boundaries, DB-level tenant isolation, feature-flag-driven UI/API, and an internal event bus.

---

## 6. CROSS-CUTTING SYSTEMS (build these once, shared by every module)

- **Event Bus**: canonical domain events (`student.enrolled`, `fee.paid`, `attendance.marked`, `application.submitted`, `grade.published`, `staff.onboarded`, `asset.issued`, etc.). Every module publishes events; other modules subscribe rather than calling each other directly. This is what lets, e.g., fee payment auto-trigger a receipt, a ledger entry, and a parent notification without hardcoded coupling.
- **Notification Service**: single service handling email/SMS/WhatsApp/push, template management per tenant (white-labeled), delivery tracking, retry/backoff, and channel-preference per user.
- **Document/Certificate Engine**: template-based PDF generation (report cards, TC, bonafide certificates, invoices, ID cards, offer letters) with tenant branding, versioned templates, and e-signature integration.
- **Audit Log Service**: every create/update/delete/approve across every module logged with actor, role, before/after state, timestamp, IP — queryable by tenant admins and exportable for compliance/legal purposes.
- **Approval/Workflow Engine**: generic, reusable state-machine so any module (leave requests, procurement, budget approval, admission decisions, content approval) can define an approval chain without custom code per module.
- **Search Service**: unified global search respecting RBAC (a Teacher searching never sees Finance records even if indexed).
- **File/Media Service**: upload, virus-scan, thumbnail/preview generation, access-controlled signed URLs.
- **Import/Export Service**: bulk CSV/Excel import (students, staff, historical fee data) with validation and error reporting; scheduled/on-demand exports for every module, and full tenant data export for portability/compliance.

---

## 7. RBAC FRAMEWORK (foundation — full matrix is in Part 6)

### 7.1 Design principles
- **Role ≠ hardcoded**: platform ships default roles (below) but tenant admins can create custom roles and rename defaults to match local terminology (e.g., "Principal" vs "Director" vs "Headmaster").
- **Granularity**: permission = `(tenant_id, role, module, sub_feature, action)` where action ∈ `{view, create, edit, delete, approve, export, impersonate}`.
- **Scope qualifiers**: permissions can be scoped to `self` (a Teacher sees only their own classes), `branch`, or `tenant-wide` (Trustee sees all branches).
- **Row-level enforcement**: RBAC is enforced at the API/service layer AND reflected in DB row-level security as a second line of defense — never rely on frontend hiding alone.
- **Delegation**: a role holder can temporarily delegate specific permissions (e.g., Principal on leave delegates approval rights to Vice Principal) with an expiry.
- **Multi-role support**: one person can legitimately hold multiple roles (a Teacher who is also a Parent of a student in the same institution) — the system must let them switch context, not merge permissions dangerously.

### 7.2 Default platform roles (starting set — extensible)
1. Super Admin (platform owner/developer)
2. Reseller Admin (optional — for white-label resellers managing multiple tenants)
3. Trustee/Board Member
4. Principal/Director/Institution Admin
5. Vice Principal/Coordinator
6. Teacher/Faculty
7. Class Teacher (Teacher + additional class-owner permissions)
8. Non-Teaching Staff (generic) — with sub-types: Front Office, Accountant, Librarian, Transport Coordinator, Warden, Facilities/Maintenance
9. HR Manager
10. Finance Manager/Accountant
11. Marketing Manager
12. Social Media Manager
13. Inventory/Procurement Manager
14. Admissions Officer
15. Student
16. Parent/Guardian
17. Alumni
18. Prospective Student/Lead (limited, pre-conversion access)
19. Vendor/Supplier (limited portal access — invoices, POs)
20. Auditor/Compliance Officer (read-only cross-module access for statutory reporting)

### 7.3 Permission matrix structure (detailed version in Part 6)
Build the matrix as data, not code: a `permissions` table seeded with sensible defaults per role, editable via the Developer Dashboard and by Tenant Admins for their own custom roles. Every new module built in Parts 2–5 must ship its permission rows in this same table — no module is allowed to invent its own separate access-control mechanism.

---

## 8. SECURITY & COMPLIANCE (technical, cross-cutting — statutory compliance is Part 4)

- Encryption at rest and in transit (TLS 1.2+, AES-256 for sensitive fields like Aadhaar numbers, bank details).
- Field-level encryption/masking for PII (Aadhaar, bank account numbers, medical info) — visible only to roles with explicit permission, masked by default even for admins.
- 2FA mandatory for Super Admin, Trustee, Principal, Finance, HR roles; optional/configurable for others.
- Rate limiting and WAF at the edge.
- Data residency configuration per tenant (important for government/university contracts).
- Data export & right-to-erasure workflows (for individuals leaving the institution, subject to statutory retention rules in Part 4 — e.g., academic records often can't be fully deleted due to board requirements).
- Automated tenant-isolation testing in CI (a test suite that actively tries to access Tenant B's data while authenticated as Tenant A, and must always fail).

---

**End of Part 1. Proceed to Part 2 for stakeholder module specifications.**
