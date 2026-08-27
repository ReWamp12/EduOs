# PART 4 — GOVERNMENT & REGULATORY COMPLIANCE MODULE

> **Disclaimer to build into the product itself:** This module operationalizes *publicly known regulatory categories* (as of 2026 research) so the software helps institutions stay organized and inspection-ready. It is not legal advice, and rules vary by state, board, and institution type, and change over time. Ship this as a **configurable rule-engine per board/state**, with an in-app notice telling tenant admins to verify current requirements with their board/state education department or legal counsel, and a mechanism for Super Admin to update rulesets centrally as regulations change (so every tenant benefits from one update rather than each tenant needing a code change).

This is what makes EduOS genuinely different from a generic school-management tool: compliance isn't a checklist PDF a Principal keeps in a drawer — it's live, tracked, and inspection-ready inside the platform.

---

## 4.1 COMPLIANCE RULE ENGINE (architecture)

- **RulesetLibrary**: Super Admin-maintained library of compliance rulesets, each tied to a jurisdiction (country/state) and/or board (CBSE, ICSE/CISCE, State Board, IB, university regulator like UGC/AICTE).
- Each ruleset is composed of **ComplianceItems**: a required document, register, committee, certificate, or recurring filing, with: name, description, mandating authority, frequency (one-time/annual/ongoing), renewal/expiry tracking, responsible role, and linked module (so, e.g., a "Fire NOC" item can attach its file directly and set a reminder before expiry).
- Tenant is assigned one or more rulesets during onboarding (Part 1 §4); Tenant Admin sees a live **Compliance Dashboard**: green/amber/red status per item, days-to-expiry countdowns, and a single-click "Inspection Mode" view bundling everything an inspector might ask for.
- Every ComplianceItem that requires a document links directly into the Document/File service (Part 1 §6) so evidence is stored, versioned, and retrievable — not just a checkbox someone can mark true without proof.

---

## 4.2 KNOWN COMPLIANCE CATEGORIES TO PRE-BUILD (India context — build as data, not hardcoded logic)

### A. UDISE+ (Unified District Information System for Education Plus)
Government of India's mandatory annual data-collection system covering essentially every recognized school (government, aided, private) from pre-primary to Class XII.
- **Module features:** structured data capture matching UDISE+ categories — school profile, safety indicators, receipts/expenditure, physical facilities, enrollment by age/class/category, teacher records (including the "National Code" identifier derived from Aadhaar), student records including APAAR ID (the national academic ID linked to Aadhaar) and CWSN (Children With Special Needs) flags.
- Bulk-export in a UDISE+-compatible format so a school isn't re-typing data already sitting in EduOS; ideally a direct API/file-upload integration if/when the government portal supports it, with manual export as the safe fallback.
- Deadline tracking (typically annual, with a "data lock" date after which corrections require going through the Block/District Education Office) and reminders escalating to the Principal as the date approaches.
- Mid-year admission handling (new students admitted after the annual cutoff still need a follow-up entry).

### B. RTE Act, 2009 (Right of Children to Free and Compulsory Education)
- School Management Committee (SMC) composition and term tracking (feeds Trustee module 2.2).
- 25% reserved-category seat tracking in the Admissions module (2.14): category-wise seat quota, proof-of-category documentation, and — where applicable — the government fee-reimbursement claim workflow tied to Finance (2.9).
- Recognition-certificate tracking (a prerequisite for UDISE+ registration and board affiliation) with renewal reminders.
- Infrastructure-norm checklist (classroom-to-student ratio, drinking water, toilets — particularly separate girls' toilets, playground) as trackable ComplianceItems feeding the Inventory/Facilities module (2.11).

### C. Board Affiliation Compliance (CBSE / ICSE / State Boards — pluggable per tenant)
Based on CBSE Affiliation Bye-Laws as a representative model (other boards have analogous but distinct requirements — build the ruleset abstraction so ICSE/State Board rules can be added without re-architecture):
- **Mandatory records/registers** (build each as a trackable, auditable register inside the relevant module rather than a loose document): admission and withdrawal register, examination question-paper/answer-sheet retention (with a configurable retention period), attendance registers with Principal/nominated-teacher sign-off, and staff service records (appointment letters, confirmation letters, service book — feeds HR module 2.10).
- **Mandatory Public Disclosure**: many boards require schools to publish specific information on their website (affiliation status, fee structure, infrastructure details, staff qualifications). Build a "Public Disclosure" auto-generated page from live platform data (fed by Finance, HR, Inventory) so it's always current rather than a stale manually-updated PDF.
- **Safety compliance checklist**: fire extinguisher placement/recharge status, fire exit signage, structural safety certificate, boundary wall, CCTV coverage, first-aid room, ramp/accessibility for differently-abled students — all as ComplianceItems with photo-evidence upload and recheck scheduling, feeding the Inventory/Maintenance module (2.11).
- **List of Candidates (LOC)** submission tracking for board exam registration (Class X/XII), with a configurable multi-year record-retention reminder.
- **Inspection readiness**: the "Inspection Mode" dashboard view assembles admission registers, attendance records, financial records, fee receipts, staff appointment letters, and safety documentation in one place.
- **Teacher training-day tracking**: several bye-law frameworks require a minimum number of annual training days for teaching staff including Principal/Vice-Principal — track via the Training Record entity from HR (2.10).
- **Compliance-status escalation model**: track the notice-and-response cycle a board may use for violations (show-cause style timelines) as a workflow so a Principal never misses a response deadline.

### D. Child Safety & Protection
- **POCSO Act, 2012 (Protection of Children from Sexual Offences)**: mandatory institutional Child Protection/School Complaints Committee — track composition, meeting cadence, and case handling. A digital, access-controlled complaint box (distinct from general Support Tickets in 2.6 — this needs stricter confidentiality/RBAC, routed only to the designated committee and never to a student's regular teacher by default) with mandatory-reporting-aware workflow. Counselor assignment and availability tracking.
- **POSH Act, 2013 (Prevention of Sexual Harassment at Workplace)**: mandatory Internal Committee (IC) for institutions with the statutory minimum number of employees — composition tracking, complaint intake (again strict confidentiality/RBAC, separate from the POCSO committee since POSH concerns adult employees), case timeline tracking against statutory resolution windows.
- **Anti-Ragging Committee** (primarily higher-ed/college/university tenants, per Supreme Court/UGC direction): committee composition, annual affidavit collection from students/parents, complaint intake and case tracking.
- **Student Safeguarding / Safety Audits**: several states now mandate an annual, standardized school safety self-audit (covering staff verification, transport safety, CCTV, complaint mechanisms) — model this as a recurring ComplianceItem with a structured audit-form template, submittable and re-usable year to year.
- **Staff background verification**: police verification/background-check status for staff in child-facing roles, tracked as an onboarding-blocking ComplianceItem in HR (2.10) — i.e., certain system access shouldn't fully activate until verification is on file (configurable, since exact requirements vary by state).

### E. Financial & Labour Statutory Compliance
- GST registration and periodic return tracking (where applicable — many educational trusts have exemptions, but ancillary revenue like hostel/canteen may be taxable — flag for the institution's CA/accountant rather than auto-deciding).
- Trust/Society registration renewal and 12A/80G (income-tax exemption/donor-deduction) status tracking, relevant to the Alumni donation module (2.8).
- PF (Provident Fund), ESI, and Professional Tax compliance tracking tied to Payroll (2.9).
- TDS return filing reminders.
- Statutory minimum-wage and labour-law leave-policy configuration checks for Non-Teaching Staff.

### F. Health & Safety
- Fire NOC (No Objection Certificate) tracking with renewal reminders.
- Building safety/structural stability certificate tracking.
- Medical room/first-aid readiness and periodic health-checkup drive scheduling for students (many state education departments run mandated health-screening programs).
- Food safety (FSSAI-style) compliance for institutions running a canteen/mess, tracked as a ComplianceItem for the Hostel/Cafeteria operation.

---

## 4.3 EXTENSIBILITY FOR OTHER JURISDICTIONS

Every category above must be modeled as **data in the RulesetLibrary**, never as hardcoded application logic, specifically so:
- A tenant outside India can be assigned a different jurisdiction's ruleset (or none, with generic best-practice compliance items only) without touching code.
- Within India, different states' additional requirements (e.g., a state-specific safety-audit form) layer on top of the national/board baseline as additive ComplianceItems.
- Super Admin can update a ruleset centrally (e.g., when CBSE issues revised bye-laws) and the platform can prompt every affected tenant to re-review their compliance status rather than silently going stale.

---

## 4.4 COMPLIANCE MODULE ENTITIES

`RulesetLibrary, ComplianceItem, TenantComplianceAssignment, ComplianceEvidence(document), ComplianceStatusLog, Committee (generic: SMC/POCSO/POSH/AntiRagging/SafetyAudit), CommitteeMember, ComplaintCase (access-restricted), SafetyAuditForm, TrainingRecord(cross-ref HR).`

**RBAC note:** ComplaintCase records (POCSO/POSH) require the strictest access control in the entire platform — visible only to designated committee members and, for POCSO cases, handled per legally mandated reporting obligations. Build a distinct, more restrictive permission tier for these, separate from general Support Ticket or Incident Log access, and log every single view (not just edit) of these records in the audit trail.

---

**End of Part 4. Proceed to Part 5 for future-facing, AI-native differentiator features.**
