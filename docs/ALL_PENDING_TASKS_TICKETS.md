# EduOS — Master Consolidated Pending Tasks & Engineering Tickets
## Full-Stack, Multi-Tenant, White-Label Education Operating System
**Consolidated Specification & Engineering Implementation Tickets (Parts 1–7)**

---

## 📌 Executive Summary & Architecture Audit

This single master document consolidates every pending feature, statutory compliance deliverable, and architectural requirement identified from the 7 master specification files:
- **Part 1**: Architecture, Multi-Tenancy, White-Labeling & RBAC Framework
- **Part 2**: Stakeholder Modules (Trustee, Principal, Teachers, Staff, Students, Parents, Alumni, HR, Finance, Inventory, Marketing, Social Media, Admissions)
- **Part 3**: Academic Core & Operational Modules (Curriculum, Timetable, Attendance, Exams, LMS, Transport, Hostel, Library, Events)
- **Part 4**: Government & Regulatory Compliance (UDISE+, RTE Act 2009, CBSE/ICSE Bye-Laws, POCSO 2012, POSH 2013, Safety Audits)
- **Part 5**: AI-Native Intelligence Layer (Teacher Intelligence, Management Ask-AI, Admissions Lead Scoring)
- **Part 6**: Core Data Model, RBAC Matrix, Domain Events & Outbound Webhooks
- **Part 7**: Build Plan, QA Bar, Automated Isolation Testing & Mandatory Statutory Registers

---

## 📊 High-Level Roadmap Status

| Specification Area | Source File | Status | Pending Scope |
|---|---|---|---|
| **Part 1: Architecture, Multi-Tenancy & DNS/SSL** | [`part1-architecture-rbac.md`](./part1-architecture-rbac.md) | **95% Complete** | Mobile app build pipeline (Expo EAS / Fastlane) generator |
| **Part 2: Stakeholder Modules** | [`part2-stakeholder-modules.md`](./part2-stakeholder-modules.md) | **82% Complete** | Alumni portal, HRMS ATS & Service Books, Inventory, Admissions CRM, Social Media Scheduler |
| **Part 3: Academic & Operations Core** | [`part3-academic-operations-modules.md`](./part3-academic-operations-modules.md) | **85% Complete** | Library circulation engine, Hostel resident gate-pass, Transport vehicle RTO fitness tracking |
| **Part 4: Government & Statutory Compliance** | [`part4-government-compliance-module.md`](./part4-government-compliance-module.md) | **88% Complete** | UDISE+ data extraction engine, Confidential POCSO/POSH ICC secure access-audited vault |
| **Part 5: AI-Native Intelligence Layer** | [`part5-future-ai-differentiators.md`](./part5-future-ai-differentiators.md) | **85% Complete** | Natural language "Ask-AI" Management query engine, Admissions lead scoring |
| **Part 6: Data Models, Events & RBAC Matrix** | [`part6-data-rbac-matrix-api.md`](./part6-data-rbac-matrix-api.md) | **90% Complete** | Outbound Webhook dispatch engine for domain events |
| **Part 7: QA Bar & Mandatory Indian Registers** | [`part7-buildplan-deliverables-appendix.md`](./part7-buildplan-deliverables-appendix.md) | **88% Complete** | Automated multi-tenant penetration/isolation CI test suite |

---

## 📋 Master Ticket Index

| Ticket Key | Priority | Module | Regulatory / Business Driver |
|---|---|---|---|
| [**EDUOS-101**](#ticket-eduos-101-institutional-hrms-career-ats-statutory-service-book--police-verification-gate) | `High` | HRMS & Staff Lifecycle | CBSE Affiliation Bye-Laws §5.3 Service Book & Police Verification Gate |
| [**EDUOS-102**](#ticket-eduos-102-admissions-crm-funnel-merit-list-generator--seat-allotment-engine) | `High` | Admissions & Intake CRM | Weighted Merit Lists, Waitlist Rollover & RTE Act 25% EWS Quota |
| [**EDUOS-103**](#ticket-eduos-103-social-media-management-studio-with-parental-photo-consent-guardrail) | `Medium-High` | Social Media & Marketing | Child Privacy / Hard-blocking posts lacking Parental Photo Consent |
| [**EDUOS-104**](#ticket-eduos-104-campus-facilities-fixed-asset-inventory--procurement-approval-engine) | `Medium` | Facilities, Assets & Inventory | Asset QR Tracking, Depreciation to GL, Fire NOC & Lab Reagents |
| [**EDUOS-105**](#ticket-eduos-105-library-barcode-circulation-reading-analytics--hostel-resident-gate-pass) | `Medium` | Library & Hostel Operations | ISBN Barcode Circulation & Parent-Approved Digital Hostel Gate-Pass |
| [**EDUOS-106**](#ticket-eduos-106-alumni-directory-mentorship-matching--80g-tax-exempt-donation-portal) | `Medium-Low` | Alumni & Institutional Funds | Graduate Auto-Migration, 1-on-1 Mentorship & 80G Tax-Exempt Receipts |
| [**EDUOS-107**](#ticket-eduos-107-udise-national-unified-data-extraction--ministry-bulk-export-engine) | `Critical (P0)` | Government Compliance | Ministry of Education Mandatory Annual Data Collection (APAAR IDs) |
| [**EDUOS-108**](#ticket-eduos-108-confidential-pocso--posh-internal-complaints-committee-icc-secure-vault) | `Critical (P0)` | Statutory Child/Workplace Safety | POCSO Act 2012 / POSH Act 2013 Confidential Vault & View Audit Log |
| [**EDUOS-109**](#ticket-eduos-109-fleet-iot-vehicle-telematics--rto-transport-compliance-engine) | `Medium-High` | Transport Fleet Operations | Motor Vehicles Act, RTO Fitness, Speed Governor & Safety Checklists |
| [**EDUOS-110**](#ticket-eduos-110-executive-ask-ai-management-query-engine--lead-scoring-intelligence) | `Medium` | AI-Native Intelligence Tier | Executive Natural Language Cross-Module Queries & Lead Scoring |
| [**EDUOS-111**](#ticket-eduos-111-white-label-mobile-app-asset--build-pipeline-generator) | `Low-Medium` | Platform Infrastructure | Expo EAS & Fastlane Automated White-Label Mobile App Bundler |
| [**EDUOS-112**](#ticket-eduos-112-automated-multi-tenant-data-isolation--rbac-penetration-test-suite) | `Critical (P0)` | Security & QA Automation | Automated PostgreSQL RLS & API Cross-Tenant Penetration Test Suite |

---

---

### Ticket EDUOS-101: Institutional HRMS, Career ATS, Statutory Service Book & Police Verification Gate
- **Key**: `EDUOS-101`
- **Module**: `HR & Staff Lifecycle / Statutory Compliance`
- **Priority**: `High`
- **Specification Reference**: `part2-stakeholder-modules.md (§2.10)`, `part4-government-compliance-module.md (§4.2.D)`, `part7 (§7.5)`

#### 1. Context & Regulatory Driver
Under Indian education regulatory frameworks (CBSE Affiliation Bye-Laws 2018/2026 update, State School Education Acts, and Labour/Gratuity acts), educational institutions must maintain an official **Staff Service Book** documenting appointment terms, qualification verification, leave ledger, and salary progression. Furthermore, state child safety orders mandate that all staff in child-facing roles have verified police verification records on file.

#### 2. User Stories
- **As an HR Manager**, I want to post teaching/non-teaching vacancies on our branded career portal and track applicants through screening, interview rounds, and offer letter generation.
- **As an HR Manager**, I want to maintain digitized Service Books and upload verified police verification documents for every staff member.
- **As a Principal / Board Inspector**, I want to view a 1-click summary of staff compliance, ensuring 100% background-checked staff and tracking mandatory 50-hour annual Teacher Professional Development (CPD) completion.
- **As a Teacher / Employee**, I want to access my service records, past performance reviews, and tax documents (Form 16) securely.

#### 3. Acceptance Criteria
- [ ] **Career Portal & ATS**:
  - Public-facing job openings list `/careers` dynamically branded per tenant.
  - Multi-stage candidate pipeline: `Applied → Shortlisted → Interview Scheduled → Offer Extended → E-Signed → Onboarding`.
  - Interview scorecard rubric with ratings for pedagogy, subject knowledge, and communication.
- [ ] **Statutory Service Book & Document Vault**:
  - Entity `EmployeeServiceRecord`: Appointment letter, qualification proofs, scale/increment history, transfer/promotion history.
  - PDF generator producing standardized, inspection-ready **Form Service Book** with school seal.
- [ ] **Police & Background Verification Gate**:
  - Tracking field for `policeVerificationStatus`: `'verified' | 'submitted_pending' | 'missing'`.
  - Automatic system flag blocking full unsupervised role assignment if verification is missing past the 30-day grace window.
- [ ] **Teacher Training Hours Register (CBSE Mandatory 50 Hours)**:
  - Log workshop attendance (CBSE Sahodaya, NCERT, in-house pedagogy).
  - Visual progress bar tracking teacher progress toward the mandatory 50 CPD hours per academic year.

#### 4. Schema & Endpoints
- **Entities**: `EmployeeRecord`, `JobOpening`, `Applicant`, `InterviewScorecard`, `ServiceBookEntry`, `TrainingRecord`.
- **Endpoints**:
  - `GET /api/v1/hr/employees`
  - `POST /api/v1/hr/service-book/:employeeId`
  - `GET /api/v1/hr/service-book/:employeeId/pdf`
  - `PATCH /api/v1/hr/police-verification/:employeeId`

---

---

### Ticket EDUOS-102: Admissions CRM Funnel, Merit List Generator & Seat Allotment Engine
- **Key**: `EDUOS-102`
- **Module**: `Marketing & Admissions / Student Intake`
- **Priority**: `High`
- **Specification Reference**: `part2-stakeholder-modules.md (§2.12, §2.14)`, `part4-government-compliance-module.md (§4.2.B)`

#### 1. Context & Business Value
The student admission process represents the primary revenue and enrollment pipeline for schools and coaching institutes. The platform requires an integrated inquiry CRM, entrance test scoring mechanism, weighted merit list generator, and statutory Right to Education (RTE) 25% quota manager that automatically hands off confirmed applicants to the core student database and fee ledger.

#### 2. User Stories
- **As an Admissions Officer**, I want to track incoming inquiries across lead stages (`Inquiry → Campus Tour → Form Submitted → Entrance Assessment → Seat Offered → Enrolled`) and identify drop-off points.
- **As an Admissions Committee Lead**, I want to generate merit lists with custom weightages (Entrance score 60%, Previous marks 20%, Sibling/Alumni 20%) and allocate seats with waitlist rollover.
- **As an Accounts Officer**, I want admission acceptance to automatically generate the initial composite fee invoice.
- **As a Parent**, I want to apply online, upload required statutory documents (Birth certificate, Aadhaar, previous TC), and track our application status in real-time.

#### 3. Acceptance Criteria
- [ ] Multi-stage CRM pipeline dashboard with drag-and-drop lead stage movement.
- [ ] Online multi-step application form with document upload verification (Birth Certificate, Category Certificate, Transfer Certificate).
- [ ] RTE Act 25% quota tracking with category validation and separate seat allocation ledger.
- [ ] Weighted merit list calculation algorithm with auto-promotion from waitlist as offers expire.
- [ ] Seamless auto-provisioning: Once offer is accepted and paid, automatically creates `StudentProfile` and `ParentProfile` without manual re-entry.

#### 4. Schema & Endpoints
- **Entities**: `ApplicationRecord`, `InquiryLead`, `EntranceExamScore`, `MeritListRule`, `SeatAllotmentOffer`, `WaitlistQueue`.
- **Endpoints**:
  - `GET /api/v1/admissions/leads`
  - `POST /api/v1/admissions/applications`
  - `POST /api/v1/admissions/merit-list/generate`
  - `POST /api/v1/admissions/seat-offer/:applicationId/confirm`

---

---

### Ticket EDUOS-103: Social Media Management Studio with Parental Photo-Consent Guardrail
- **Key**: `EDUOS-103`
- **Module**: `Marketing & Social Media / Child Protection`
- **Priority**: `Medium-High`
- **Specification Reference**: `part2-stakeholder-modules.md (§2.13)`, `part2 (§2.7)`

#### 1. Context & Child Protection Driver
Educational institutions frequently publish photos and videos of student achievements, sports events, and classroom activities on Instagram, Facebook, LinkedIn, and YouTube. To prevent privacy violations and comply with child data protection laws (DPDP Act / POCSO guidelines), no student photo may be published without verified parental photo/media consent.

#### 2. User Stories
- **As a Social Media Manager**, I want a unified visual calendar to schedule posts across multiple platforms (Instagram, LinkedIn, Facebook, X) with media asset attachments.
- **As a Social Media Manager**, when drafting a post featuring students, I want to select the students involved and have the system verify parental consent status.
- **As a Principal**, I want to review and approve all scheduled posts before they go live on official institutional channels.
- **As a System**, I must hard-block publishing if any student tagged in the media lacks active parental photo consent.

#### 3. Acceptance Criteria
- [ ] Multi-platform visual scheduler with draft, pending approval, and scheduled states.
- [ ] Tagging interface to select students appearing in post imagery.
- [ ] Automated verification against `ParentConsentForms` (Category: *Media & Photography Authorization*).
- [ ] Hard-block safeguard: If any tagged student's parent has declined or not submitted consent, the post is locked with a prominent red compliance warning banner identifying the student.
- [ ] Principal sign-off approval workflow before any post is published.
- [ ] Aggregated analytics dashboard tracking post reach, impressions, and engagement metrics.

#### 4. Schema & Endpoints
- **Entities**: `SocialPost`, `ContentScheduleItem`, `SocialAccountLink`, `MediaAsset`, `ConsentVerificationCheck`.
- **Endpoints**:
  - `GET /api/v1/social/calendar`
  - `POST /api/v1/social/posts/draft`
  - `POST /api/v1/social/posts/:id/verify-consent`
  - `POST /api/v1/social/posts/:id/publish`

---

---

### Ticket EDUOS-104: Campus Facilities, Fixed-Asset Inventory & Procurement Approval Engine
- **Key**: `EDUOS-104`
- **Module**: `Facilities, Assets & Inventory / Operations`
- **Priority**: `Medium`
- **Specification Reference**: `part2-stakeholder-modules.md (§2.11)`, `part4-government-compliance-module.md (§4.2.C, §4.2.F)`

#### 1. Context & Business Value
Schools and coaching institutes manage capital assets (computer labs, science equipment, smart panels, sports infrastructure) and consumables (chemistry reagents, examination papers, stationery). Asset depreciation must sync with Finance, while critical safety equipment (fire extinguishers, electrical earthing, water purifiers) requires mandatory recurring compliance tracking.

#### 2. User Stories
- **As an Estate / Inventory Officer**, I want to register all institutional assets with QR/barcode identifiers, physical location, and purchase cost.
- **As a Lab In-Charge**, I want to track consumable chemical/paper stock levels and receive automated low-stock notifications.
- **As a Department Head**, I want to submit procurement requisitions that route through multi-level approval (Finance $\rightarrow$ Principal $\rightarrow$ PO Generated).
- **As a Compliance Officer**, I want to log fire extinguisher recharge dates, building safety certificates, and water testing reports with automated expiry countdowns.

#### 3. Acceptance Criteria
- [ ] Asset register with QR code generation, category, location, and depreciation schedule.
- [ ] Consumables stock-in/stock-out ledger with automated threshold reorder alerts.
- [ ] End-to-end procurement workflow: Requisition $\rightarrow$ Approval Chain $\rightarrow$ Purchase Order $\rightarrow$ Vendor Goods Receipt Note (GRN) $\rightarrow$ Finance Payment.
- [ ] Safety equipment maintenance scheduler tracking fire NOC expiry, cylinder pressure tests, and structural safety audits.
- [ ] Smart room and lab booking calendar to prevent scheduling collisions.

#### 4. Schema & Endpoints
- **Entities**: `AssetRecord`, `StockConsumableItem`, `ProcurementRequisition`, `PurchaseOrder`, `MaintenanceLog`, `SafetyEquipmentLog`.
- **Endpoints**:
  - `GET /api/v1/facilities/assets`
  - `POST /api/v1/facilities/procurement/requisitions`
  - `GET /api/v1/facilities/safety-audit`

---

---

### Ticket EDUOS-105: Library Barcode Circulation, Reading Analytics & Hostel Resident Gate-Pass
- **Key**: `EDUOS-105`
- **Module**: `Library & Hostel Operations / Campus Life`
- **Priority**: `Medium`
- **Specification Reference**: `part3-academic-operations-modules.md (§3.4, §3.5)`

#### 1. Context & Campus Operations
The Library and Hostel represent fundamental daily operational hubs. The library module requires cataloging, barcode circulation, and reading analytics for student holistic assessment. The hostel module requires room/bed allocation, mess billing, and a parent-authenticated digital gate-pass system for resident outings.

#### 2. User Stories
- **As a Librarian**, I want to catalog books by ISBN, scan barcodes to issue/return books to students and staff, and auto-calculate overdue fines.
- **As a Class Teacher / Principal**, I want to view student reading analytics (books borrowed per term, genre breakdown) for holistic student profiles.
- **As a Hostel Warden**, I want to view room occupancy, manage bed allocation, and process resident leave/outing requests.
- **As a Parent of a Hostel Resident**, I want to receive instant digital consent prompts when my child requests an outing and approve/decline with one tap.

#### 3. Acceptance Criteria
- [ ] Library catalog management with ISBN lookup, barcode generation, and search filters.
- [ ] Circulation desk: Instant checkout/return with student QR ID scan and automatic fine ledger posting.
- [ ] Student reading analytics matrix measuring books read per term.
- [ ] Hostel block, floor, room, and bed allocation with gender and batch separation rules.
- [ ] Parent-approved digital outing workflow: Student requests pass $\rightarrow$ Parent approves via SMS/App $\rightarrow$ Warden verifies and generates QR gate-pass.

#### 4. Schema & Endpoints
- **Entities**: `LibraryBook`, `BookLoanRecord`, `OverdueFine`, `HostelBlock`, `HostelRoomBed`, `HostelGatePassRequest`.
- **Endpoints**:
  - `GET /api/v1/library/catalog`
  - `POST /api/v1/library/checkout`
  - `POST /api/v1/hostel/gatepass/request`
  - `POST /api/v1/hostel/gatepass/:id/parent-sign`

---

---

### Ticket EDUOS-106: Alumni Directory, Mentorship Matching & 80G Tax-Exempt Donation Portal
- **Key**: `EDUOS-106`
- **Module**: `Alumni Relations & Institutional Fundraising`
- **Priority**: `Medium-Low`
- **Specification Reference**: `part2-stakeholder-modules.md (§2.8)`, `part4 §4.2.E`

#### 1. Context & Business Value
Graduating cohorts represent institutional legacy and fundraising potential. The Alumni module facilitates automatic graduate migration, mentorship pairing with senior school/college students, career opportunities posting, and online donations with automatic generation of Section 80G tax-exemption receipts.

#### 2. User Stories
- **As a Graduating Student**, upon graduation, I want my profile to automatically transition to the Alumni network with privacy controls.
- **As an Alumni Member**, I want to offer mentorship slots, post internship/job opportunities, and donate to institutional development funds.
- **As a Current Student (Class 11/12 or College)**, I want to search verified alumni by college/industry and request mentorship calls.
- **As a Trust Management Member**, I want to run fundraising campaigns and automatically issue valid Section 80G / 12A tax exemption receipts to donors.

#### 3. Acceptance Criteria
- [ ] Automated student $\rightarrow$ alumni lifecycle transition on graduation with historical academic transcript retention.
- [ ] Opt-in alumni directory filtered by graduation year, university, company, and industry.
- [ ] 1-on-1 mentorship request and scheduling module.
- [ ] Alumni job board for internships and entry-level positions.
- [ ] Donation campaign portal supporting payment gateways and issuing instant 80G tax-deductible PDF receipts with trust registration numbers.

#### 4. Schema & Endpoints
- **Entities**: `AlumniProfile`, `MentorshipProgramSlot`, `JobBoardPosting`, `DonationCampaign`, `TaxExemptionReceipt`.
- **Endpoints**:
  - `GET /api/v1/alumni/directory`
  - `POST /api/v1/alumni/mentorship/request`
  - `POST /api/v1/alumni/donations/checkout`

---

---

### Ticket EDUOS-107: UDISE+ National Unified Data Extraction & Ministry Bulk Export Engine
- **Key**: `EDUOS-107`
- **Module**: `Government & Statutory Compliance / Ministry Reporting`
- **Priority**: `Critical (P0)`
- **Specification Reference**: `part4-government-compliance-module.md (§4.2.A)`, `part7 §7.5`

#### 1. Context & Statutory Mandate
UDISE+ (Unified District Information System for Education Plus) is the Government of India's mandatory annual data collection system covering every recognized school in the country. Failure to file or submitting erroneous records jeopardizes school recognition, CBSE/ICSE board affiliation, and RTE reimbursement claims.

#### 2. User Stories
- **As a Principal / Data Operator**, I want EduOS to automatically aggregate data from our existing student roster, teacher records, facilities ledger, and fee records into official UDISE+ categories.
- **As a Compliance Officer**, I want a pre-submission validation report that flags anomalies (e.g. missing APAAR ID, invalid student Aadhaar format, unverified teacher National Codes) before export.
- **As a School Administrator**, I want a 1-click export of UDISE+-compliant JSON/CSV files ready for upload into the national portal.

#### 3. Acceptance Criteria
- [ ] Structured extraction service aggregating:
  1. School Profile & Physical Infrastructure (toilets, drinking water, boundary wall, ramp access).
  2. Enrolment by Age, Social Category (SC/ST/OBC/General), Minority status, and CWSN flags.
  3. Student APAAR ID and Aadhaar verification status.
  4. Teacher National Codes, academic qualifications, and teaching subject assignments.
  5. Receipts and expenditures matching financial heads.
- [ ] Anomaly detection report highlighting missing mandatory fields.
- [ ] 1-click standardized UDISE+ bulk data export file generator.
- [ ] Annual national data-lock deadline tracking with automated principal reminders.

#### 4. Schema & Endpoints
- **Entities**: `UdiseSchoolProfile`, `UdiseStudentEnrolmentData`, `UdiseTeacherProfileData`, `UdiseFacilityMetrics`, `UdiseExportBatch`.
- **Endpoints**:
  - `GET /api/v1/compliance/udise/preview`
  - `GET /api/v1/compliance/udise/validate`
  - `POST /api/v1/compliance/udise/export-payload`

---

---

### Ticket EDUOS-108: Confidential POCSO / POSH Internal Complaints Committee (ICC) Secure Vault
- **Key**: `EDUOS-108`
- **Module**: `Statutory Compliance / Child Safety & Legal Protection`
- **Priority**: `Critical (P0)`
- **Specification Reference**: `part4-government-compliance-module.md (§4.2.D, §4.4)`, `part6-data-rbac-matrix-api.md §6.2`

#### 1. Context & Legal Mandate
Under the **POCSO Act 2012** (Protection of Children from Sexual Offences) and the **POSH Act 2013** (Prevention of Sexual Harassment at Workplace), institutions must maintain dedicated committees, confidential complaint intake channels, and strict statutory case turnaround times (90 days for POSH inquiry). These records require the strictest confidentiality on the entire platform—they must be completely isolated from regular support tickets, school staff, and platform Super Admins.

#### 2. User Stories
- **As a Student, Parent, or Staff Member**, I want to submit a confidential complaint directly to the designated committee (POCSO Child Protection Committee or POSH Internal Committee) without exposure to regular teachers or school staff.
- **As an ICC / POCSO Committee Member**, I want to manage assigned cases, schedule hearings, log counselor notes, and track statutory reporting deadlines.
- **As a Legal Compliance Officer**, I want every single access or view of a confidential complaint record to be immutably logged to prevent unauthorized leaks.

#### 3. Acceptance Criteria
- [ ] Dedicated, access-restricted database entity `ComplaintCase` with column-level encryption.
- [ ] Segregated RBAC: Records visible **only** to explicitly assigned committee members; blocked from regular teachers, staff, and non-impersonating super admins.
- [ ] Confidential digital intake portal with optional anonymity option.
- [ ] Statutory milestone checklist: POSH 90-day inquiry completion countdown; POCSO mandatory reporting milestones to Child Welfare Committee (CWC) / Special Juvenile Police Unit (SJPU).
- [ ] Immutable audit logging: Every single view, document access, or status update generates an audit entry capturing actor ID, timestamp, IP address, and cryptographic signature.

#### 4. Schema & Endpoints
- **Entities**: `ConfidentialComplaintCase`, `CommitteeAssignment`, `HearingLog`, `CounselorNote`, `StatutoryReportingMilestone`, `ConfidentialAccessAudit`.
- **Endpoints**:
  - `POST /api/v1/compliance/icc/confidential-report`
  - `GET /api/v1/compliance/icc/cases` (Restricted to assigned ICC members)
  - `POST /api/v1/compliance/icc/cases/:id/milestones`

---

---

### Ticket EDUOS-109: Fleet IoT Vehicle Telematics & RTO Transport Compliance Engine
- **Key**: `EDUOS-109`
- **Module**: `Transport & Fleet Safety / Operations`
- **Priority**: `Medium-High`
- **Specification Reference**: `part3-academic-operations-modules.md (§3.3)`, `part4 §4.2.C`

#### 1. Context & Student Safety Driver
School transport operations are heavily regulated under the Motor Vehicles Act and state school-bus safety policies (mandating fitness certificates, commercial permits, speed governor limits of 40 km/h, fire extinguishers, CCTV, and female attendants for young children). The platform requires complete vehicle document compliance tracking alongside driver credential management.

#### 2. User Stories
- **As a Transport Coordinator**, I want to monitor the expiry dates of vehicle Fitness Certificates, State Permits, Commercial Insurance, and Pollution Under Control (PUC) certificates across our fleet.
- **As a Transport Coordinator**, I want to track driver credentials (heavy vehicle license, PSV badge, annual medical fitness, and police verification).
- **As a School Safety Inspector**, I want to audit daily digital pre-trip inspection logs (CCTV check, emergency door operation, first aid kit check).
- **As a Driver**, I want a simple mobile interface to log student boarding/deboarding and report vehicle breakdowns or route delays.

#### 3. Acceptance Criteria
- [ ] Vehicle compliance dashboard with visual green/amber/red status and expiry countdowns for Fitness, Permit, Insurance, and PUC.
- [ ] Automated email/WhatsApp notifications sent to Transport Manager at 30, 15, and 7 days prior to any document expiry.
- [ ] Driver profile vault tracking licenses, badges, medical records, and verification status.
- [ ] Daily digital bus safety inspection checklist (CCTV, speed limiter, first-aid, emergency exits).
- [ ] Integrated route management with stop sequence planning and student passenger manifest.

#### 4. Schema & Endpoints
- **Entities**: `TransportVehicle`, `VehicleComplianceDocument`, `DriverProfile`, `DailySafetyInspection`, `BusRoute`, `StudentBoardingLog`.
- **Endpoints**:
  - `GET /api/v1/transport/fleet`
  - `GET /api/v1/transport/compliance/expiring`
  - `POST /api/v1/transport/inspection/pre-trip`

---

---

### Ticket EDUOS-110: Executive "Ask-AI" Management Query Engine & Lead-Scoring Intelligence
- **Key**: `EDUOS-110`
- **Module**: `AI-Native Intelligence Tier / Executive Analytics`
- **Priority**: `Medium`
- **Specification Reference**: `part5-future-ai-differentiators.md (§5.5, §5.6, §5.10)`

#### 1. Context & Architectural Positioning
As specified in Part 5, EduOS positions AI as an **intelligence and decision-support layer** for teachers, principals, and trustees—not a student-facing chatbot tutor. The Management Intelligence tier allows directors and branch leaders to query cross-module data using plain English, while the admissions team receives predictive lead-scoring insights.

#### 2. User Stories
- **As a Trustee / Managing Director**, I want to type natural language queries (e.g. *"Compare Term 1 fee collection vs last year across all branches"* or *"Which batches have declining attendance in the last 30 days?"*) and receive summarized insights and charts.
- **As a Branch Principal**, I want AI to identify students at risk of dropout or academic failure based on attendance and test performance correlations.
- **As an Admissions Head**, I want AI to score incoming leads based on engagement signals and recommend high-priority follow-ups.

#### 3. Acceptance Criteria
- [ ] Natural Language to SQL/Aggregation Query Engine querying student, fee, attendance, and exam databases.
- [ ] Strict RBAC boundary enforcement: Query engine respects the user's role scope (e.g. Branch Principal queries cannot cross into other branches).
- [ ] Predictive Dropout Risk Model: Batch analyzes attendance drops combined with test score dips to surface early intervention alerts.
- [ ] Admissions Lead Scoring algorithm: Evaluates campus visit attendance, scholarship test score, and response latency to assign high/medium/low intent scores.
- [ ] Batch processing architecture to keep LLM operational costs minimal and predictable.

#### 4. Schema & Endpoints
- **Entities**: `ManagementQueryLog`, `AiInsightSummary`, `DropoutRiskAlert`, `AdmissionsLeadScore`.
- **Endpoints**:
  - `POST /api/v1/ai/management/query`
  - `GET /api/v1/ai/insights/dropout-risk`
  - `GET /api/v1/ai/admissions/lead-scores`

---

---

### Ticket EDUOS-111: White-Label Mobile App Asset & Build Pipeline Generator
- **Key**: `EDUOS-111`
- **Module**: `Platform Infrastructure / Mobile White-Labeling`
- **Priority**: `Low-Medium`
- **Specification Reference**: `part1-architecture-rbac.md (§3)`, `part7 (§7.1, §7.4)`

#### 1. Context & Business Value
EduOS offers an enterprise white-label tier allowing institutional clients to deploy custom-branded iOS and Android mobile apps on the Apple App Store and Google Play Store under their own institutional name and developer account.

#### 2. User Stories
- **As a Super Admin / White-Label Reseller**, I want an automated tool that takes a tenant's brand colors, logo, and display name and generates complete React Native / Expo EAS configuration files and icon bundles.
- **As an Institutional IT Administrator**, I want a pre-configured store-listing kit (app descriptions, privacy policy URLs, screenshot templates) for publishing on our school's developer accounts.

#### 3. Acceptance Criteria
- [ ] Automated asset generation utility converting tenant SVG logos into Android Adaptive Icons and iOS App Icon sets.
- [ ] Per-tenant `app.json` / `eas.json` generator setting custom bundle identifiers (e.g. `com.institution.eduos`), scheme names, and splash configurations.
- [ ] Push notification credential provisioning (Firebase Cloud Messaging / Apple APNs per tenant).
- [ ] Store submission metadata checklist generator.

#### 4. Schema & Scripts
- **Entities**: `TenantMobileAppConfig`, `EASBuildConfig`.
- **CLI Utilities**: `scripts/generate-mobile-assets.ts`, `scripts/build-eas-config.ts`.

---

---

### Ticket EDUOS-112: Automated Multi-Tenant Data Isolation & RBAC Penetration Test Suite
- **Key**: `EDUOS-112`
- **Module**: `Security Architecture & Automated QA Pipeline`
- **Priority**: `Critical (P0)`
- **Specification Reference**: `part1-architecture-rbac.md (§8)`, `part6-data-rbac-matrix-api.md §6.2`, `part7 (§7.2)`

#### 1. Context & Architectural Mandate
In a multi-tenant SaaS application managing sensitive child identity, educational transcripts, and financial ledgers, tenant data isolation is non-negotiable. App-layer checks alone are insufficient; PostgreSQL Row-Level Security (RLS) policies and API gateway authorization gates must be validated by an automated penetration test suite executing on every CI/CD pull request.

#### 2. User Stories
- **As a Security Engineer**, I want automated CI test suites that authenticate as Tenant A and actively attempt to read, write, update, or delete Tenant B records across all entities (`Student`, `FeeInvoice`, `Employee`, `ExamResult`), asserting that 100% of unauthorized attempts fail with `403 Forbidden` or empty results.
- **As a Platform Architect**, I want regression tests for the complete RBAC permission matrix (asserting that Students cannot access teacher gradebooks, Teachers cannot access finance ledgers, and unauthorized staff cannot view confidential POCSO records).

#### 3. Acceptance Criteria
- [ ] Automated cross-tenant isolation test suite covering:
  - `GET /api/v1/students`
  - `GET /api/v1/finance/invoices`
  - `POST /api/v1/attendance`
  - Direct PostgreSQL queries bypassing application logic using Tenant A database role.
- [ ] Zero data leakage: Assert that cross-tenant queries return strictly 0 rows.
- [ ] Complete RBAC role × permission automated test suite matching the Part 6 matrix.
- [ ] Integrated into GitHub Actions CI pipeline running on every PR touching entities, migrations, or controllers.

#### 4. Test Specifications
- `test/security/tenant-isolation.e2e-spec.ts`
- `test/security/rbac-matrix.e2e-spec.ts`
- `test/security/confidential-vault-access.e2e-spec.ts`

---

## 🎯 Recommended Next Execution Order

To take the platform from **~91% to 100% complete**, execute the tickets in this sequenced sprint order:
1. **Sprint A (Critical Compliance & Security Core)**:
   - `EDUOS-107`: UDISE+ National Unified Data Extraction & Export Engine
   - `EDUOS-108`: Confidential POCSO / POSH Internal Complaints Committee Secure Vault
   - `EDUOS-112`: Automated Multi-Tenant Data Isolation & RBAC Penetration Test Suite
2. **Sprint B (Institutional Operations & Staff Lifecycle)**:
   - `EDUOS-101`: Institutional HRMS, Career ATS & Statutory Service Book
   - `EDUOS-102`: Admissions CRM Funnel & Merit List Allotment Engine
   - `EDUOS-109`: Fleet IoT Vehicle Telematics & RTO Transport Compliance
3. **Sprint C (Campus Operations & Child Protection)**:
   - `EDUOS-103`: Social Media Management Studio with Parental Photo-Consent Guardrail
   - `EDUOS-104`: Campus Facilities, Fixed-Asset Inventory & Procurement Approval Engine
   - `EDUOS-105`: Library Barcode Circulation & Hostel Resident Gate-Pass
4. **Sprint D (Community, AI Intelligence & Mobile Delivery)**:
   - `EDUOS-106`: Alumni Directory, Mentorship Matching & 80G Donation Portal
   - `EDUOS-110`: Executive "Ask-AI" Management Query Engine & Lead Scoring
   - `EDUOS-111`: White-Label Mobile App Asset & Build Pipeline Generator

---
*Created automatically by Antigravity Agent for EduOS Architecture & Delivery Roadmap.*
