# PART 2 — STAKEHOLDER MODULES (DEEP SPEC)

For every module: **Use Cases → Features → Workflow → Key Entities → RBAC notes.** All modules must be built against the RBAC and event-bus foundation from Part 1.

---

## 2.1 SUPER ADMIN / DEVELOPER DASHBOARD
Already specified in Part 1 §4. Cross-reference here: this module is the entry point that provisions every other module below.

---

## 2.2 TRUSTEE / MANAGEMENT / BOARD

**Use cases:** Monitor institutional financial health, approve major expenditure/policy, oversee multi-branch performance, ensure statutory compliance, govern via formal board process.

**Features:**
- Executive dashboard: enrollment trend, revenue/expense trend, staff headcount, compliance status traffic-light (from Part 4), multi-branch comparison.
- Budget approval workflow (submitted by Finance, routed through Approval Engine).
- Policy document repository with version history.
- Board meeting scheduler, agenda builder, digital minutes with action-item tracking.
- Managing Committee/Society records (legally required composition — see Part 4) with term tracking and renomination reminders.
- Multi-branch roll-up reports with drill-down to branch level.
- Read-only access to any module for oversight (respecting RBAC scope = tenant-wide).

**Workflow:** Finance submits annual/quarterly budget → routed to Trustee via Approval Engine → Trustee approves/rejects/requests revision with comments → decision recorded, pushed back to Finance, and logged in audit trail → once approved, budget becomes the baseline Finance module tracks actuals against.

**Entities:** BoardMember, BoardMeeting, Minutes, ActionItem, PolicyDocument, BudgetPlan, ApprovalRequest.

---

## 2.3 PRINCIPAL / DIRECTOR / INSTITUTION ADMIN

**Use cases:** Run daily operations, approve staff leave and resource requests, monitor academic performance, handle escalations/discipline, own admissions decisions, ensure day-to-day compliance.

**Features:**
- Unified operations dashboard (attendance today, pending approvals, fee collection status, upcoming exams/events, open maintenance tickets, open compliance items).
- Staff directory & management (assign classes/subjects, view service records — see Part 4 statutory service-record requirements).
- Leave approval queue (staff and, where policy requires, student leave).
- Academic performance heatmaps (class-wise, subject-wise, teacher-wise, trending).
- Discipline/incident log with severity classification and escalation path (feeds Child Protection/POCSO workflow in Part 4 where applicable).
- Admission final approval (after Admissions Officer screening).
- Circulars/notices broadcaster (targeted by role/class/branch, delivery-tracked).
- Timetable oversight and conflict resolution.
- Inspection-readiness view: one-click "board inspection mode" showing all mandatory registers/documents (Part 4) and flagging gaps.

**Workflow:** Staff/teacher raises a request (leave, resource, escalation) → routed to Principal via Approval Engine → decision made → notification fires to requester → audit logged.

**Entities:** Staff, LeaveRequest, Circular, IncidentLog, ApprovalQueue, InspectionChecklist.

---

## 2.4 TEACHING STAFF

**Use cases:** Deliver instruction, mark attendance, grade work, communicate with parents, manage classroom logistics, professional development tracking (statutory training requirements — Part 4).

**Features:**
- Digital attendance (manual, QR self-check-in, biometric/RFID device integration).
- Gradebook and automated report-card generation feeding the Document Engine.
- LMS authoring: upload materials, create assignments/quizzes, video lessons, auto-graded objective questions.
- Timetable view, substitution requests and coverage marketplace (teacher can request/offer to cover a class).
- Parent-teacher messaging and meeting scheduler (auto-suggests slots based on both calendars).
- Leave application against configured leave policy.
- Payslip and Form 16/tax document access.
- Lesson plan submission and syllabus-completion tracker (many boards require documented syllabus pacing — configurable per compliance ruleset).
- Professional development/training record (CBSE-style rules mandate periodic teacher training — track completion here, feeds compliance module).
- Co-curricular/extracurricular activity logging (for CCE/holistic report cards where applicable).

**Workflow:** Teacher creates an assignment in LMS → students submit digitally or teacher records offline submission → teacher grades → grade auto-syncs into report-card engine and gradebook analytics → visible instantly to student/parent, subject to a configurable "publish" gate so grades aren't visible before the teacher finalizes them.

**Entities:** ClassSection, Attendance, Assignment, Submission, Grade, LessonPlan, Timetable, SubstitutionRequest, TrainingRecord.

---

## 2.5 NON-TEACHING STAFF

**Use cases:** Front-office operations, transport/hostel coordination, facility upkeep, security/visitor management.

**Sub-role features:**
- **Front Office**: visitor management with gate pass and photo capture, enquiry logging (feeds Marketing/Admissions CRM), courier/document register, ID card issuance.
- **Accountant** (may overlap with Finance module — see 2.9): daily collection entry, petty cash register.
- **Librarian**: see Part 3 Library module.
- **Transport Coordinator**: see Part 3 Transport module.
- **Warden**: see Part 3 Hostel module.
- **Facilities/Maintenance**: maintenance ticketing (raised by any role) → assignment → resolution with photo proof → closure; preventive maintenance scheduling for critical infrastructure (fire extinguishers, electrical, water) tied into the safety-audit requirements in Part 4.
- **Security**: visitor log, CCTV status checklist (many state safety orders require documented daily CCTV functionality checks), incident reporting.

**Workflow (maintenance example):** Any user reports an issue → ticket auto-categorized and assigned → staff resolves and uploads proof → requester confirms closure → recurring/critical items (fire safety equipment) auto-scheduled for periodic recheck.

**Entities:** VisitorLog, GatePass, MaintenanceTicket, PettyCashEntry, IDCard, SecurityChecklist.

---

## 2.6 STUDENTS

**Use cases:** Access academics, pay fees, track progress, use library, join events, get support.

**Features:**
- Student portal/app: dashboard (attendance %, pending fees, homework due, upcoming exams, notices).
- Digital ID card with QR (usable for gate entry, library, exam hall).
- Fee payment gateway with payment history and downloadable receipts.
- Exam results, report cards, and cumulative transcript.
- Library search/reserve/renew.
- Event registration and co-curricular activity portfolio (useful for college applications, holistic report cards).
- Discussion forums / peer Q&A per class (moderated).
- Career/counseling resource hub (stream selection, college guidance for senior students).
- Digital certificate/document wallet (report cards, TC, bonafide, achievement certificates — all issued from the Document Engine, tamper-evident).
- Support ticket raising (academic or administrative query) routed via Approval/Workflow Engine.
- Student wellbeing check-in (optional, links to Part 5 mental-health features) with strict privacy controls.

**Entities:** StudentProfile, FeeInvoice, ExamResult, LibraryLoan, EventRegistration, DigitalIDCard, SupportTicket.

**RBAC note:** A student must never see another student's individual data (grades, attendance, fee status) — only aggregate/class-level where explicitly permitted (e.g., class rank if the institution enables it).

---

## 2.7 PARENTS/GUARDIANS

**Use cases:** Monitor child's academic and behavioral progress in real time, manage payments, communicate with school, give consent for activities.

**Features:**
- Parent app/portal, multi-child support (one login, switch between children, including children across different branches if a trust operates several schools).
- Real-time attendance alerts (absence notification within minutes via SMS/push/WhatsApp).
- Fee payment with auto-reminders, configurable installment plans, and scholarship/discount visibility.
- Report card and progress access, including teacher remarks.
- PTM (parent-teacher meeting) scheduling with time-slot booking.
- Live bus tracking (GPS) for transport-enrolled children.
- Digital consent forms (field trips, photo/video usage, medical emergencies) — legally significant, must be versioned and timestamped, not just a checkbox.
- Complaint/feedback submission with tracked resolution status.
- Access to the same digital certificate/document wallet as the child (view/download only).
- Emergency contact and medical information management (allergies, conditions) — visible to relevant staff (nurse, class teacher) per RBAC, critical for duty-of-care.

**Workflow:** Attendance marked absent → automated alert fires to parent within minutes → parent can message the class teacher directly from the alert → if no response/explanation within a configurable window, escalates to front office.

**Entities:** ParentProfile, Alert, Payment, ConsentForm, Complaint, EmergencyContact, MedicalRecord.

---

## 2.8 ALUMNI

**Use cases:** Stay connected, network, mentor, donate, attend reunions.

**Features:**
- Alumni directory with privacy controls (opt-in visibility).
- Networking/mentorship matching (current students or junior alumni request mentorship from senior alumni by field/industry).
- Job board (alumni or institution post openings).
- Donation/fundraising module: campaign creation, online donation with auto-generated tax-exemption receipts (where the institution/trust has 80G or equivalent status — configurable), donor recognition tiers.
- Reunion/event management with RSVP and ticketing.
- Success-story showcase (auto-feeds Marketing/Social Media modules with alumni consent).
- Alumni newsletter builder.

**Workflow:** Student graduates → record auto-migrates to Alumni module (retaining historical academic data per retention policy) → alumni opts into directory/networking → can post jobs, donate, RSVP.

**Entities:** AlumniProfile, Donation, JobPosting, MentorshipMatch, ReunionEvent, Newsletter.

---

## 2.9 FINANCE & ACCOUNTS

**Use cases:** Fee collection/reconciliation, payroll, vendor payments, budgeting, statutory financial reporting.

**Features:**
- Fee structure builder: class-wise, category-wise (including RTE reserved-category fee waivers where applicable — Part 4), scholarships/discounts, one-time vs recurring heads (tuition, transport, hostel, exam fee, etc.).
- Online + offline (cash/cheque/DD) payment recording with reconciliation against bank statements.
- Automated payment reminders and configurable late-fee rules.
- Payroll engine: salary structure (basic, HRA, allowances), statutory deductions (PF, ESI, professional tax, TDS), payslip generation, Form 16 generation.
- Vendor/purchase invoicing with multi-level approval chain (via Approval Engine).
- General ledger, trial balance, balance sheet, P&L, cash-flow statement.
- Budget-vs-actual tracking tied to the Trustee-approved budget (2.2).
- GST computation and statutory report exports; income-tax and TDS filing-support exports.
- Scholarship/fee-waiver workflow with eligibility rules and audit trail (important for RTE 25% reservation reimbursement claims where government reimburses the institution — Part 4).
- Fixed-asset depreciation schedule integrated with the Inventory module (2.10).

**Workflow:** Fee due date approaches → invoice auto-generated per fee structure → parent pays online or cash recorded by accountant → payment reconciled → receipt auto-issued (Document Engine) → GL entry posted automatically → dashboard and Trustee reporting update in real time.

**Entities:** FeeStructure, Invoice, Payment, PayrollRun, Payslip, Vendor, PurchaseOrder, GLEntry, ScholarshipGrant, FixedAsset.

---

## 2.10 HR & HIRING

**Use cases:** Recruit, onboard, manage employee lifecycle, review performance, offboard.

**Features:**
- White-labeled career page builder.
- Applicant Tracking System: resume upload/parsing, screening, interview scheduling, structured interview scorecards.
- Offer letter generation (Document Engine) and e-signature acceptance.
- Onboarding checklist automation (documents to collect — see statutory service-record list in Part 4; system access provisioning; induction training assignment).
- Performance review cycles (configurable frequency, 360-degree option, goal-setting/OKR support).
- Staff leave and attendance (links to Teaching/Non-Teaching modules).
- Statutory employee document vault: appointment letters, qualification certificates, police verification/background check records (increasingly required for child-facing roles — Part 4), background-check status.
- Exit management: resignation workflow, clearance checklist (library, IT assets, finance dues), exit interview, full-and-final settlement trigger to Payroll.

**Workflow:** Vacancy posted on career page → applications collected in ATS → shortlisted → interview scheduled and scored → offer generated and e-signed → onboarding checklist auto-assigned → employee record created, which feeds Payroll (2.9) and role/RBAC provisioning (Part 1 §7) automatically.

**Entities:** JobOpening, Applicant, Interview, Offer, Employee, OnboardingTask, PerformanceReview, ExitClearance.

---

## 2.11 INVENTORY & EQUIPMENT / FACILITIES

**Use cases:** Track assets (labs, sports, furniture, IT), manage procurement, prevent loss, ensure safety-equipment upkeep.

**Features:**
- Asset register with QR/barcode tagging, category, location, purchase value, depreciation link to Finance.
- Stock in/out logs with low-stock alerts (consumables: stationery, lab chemicals, sports consumables).
- Procurement request → approval (Approval Engine) → purchase order → vendor invoice → Finance payment, fully linked end to end.
- Maintenance scheduling and history, with mandatory-safety-equipment tracking (fire extinguisher recharge dates, electrical safety checks) flagged and reported into the compliance dashboard (Part 4).
- Room/lab/equipment booking calendar to prevent double-booking.
- Asset disposal/write-off workflow with approval trail.

**Entities:** Asset, StockItem, ProcurementRequest, PurchaseOrder, MaintenanceLog, RoomBooking, DisposalRecord.

---

## 2.12 MARKETING

**Use cases:** Run admission campaigns, manage leads, build landing pages, measure ROI.

**Features:**
- White-labeled drag-drop landing page builder.
- Lead capture forms (embeddable, QR-code linkable for offline events).
- CRM pipeline for admission leads: Inquiry → Campus Visit → Application → Test/Interview → Offer → Enrolled (stages configurable).
- Email/SMS/WhatsApp campaign builder with templates and automated nurture sequences.
- UTM/ad-campaign tracking and ROI dashboard (cost per lead, cost per enrollment, channel attribution).
- Referral program management (existing parents/alumni referring new admissions, with tracked incentives).
- Content library shared with Social Media module (2.13).

**Workflow:** Lead submits inquiry form → enters CRM pipeline → automated nurture sequence triggers → lead converts to Application → handed to Admissions module (Part 3) with full attribution history intact.

**Entities:** Lead, Campaign, LandingPage, PipelineStage, ReferralCode, UTMSource.

---

## 2.13 SOCIAL MEDIA MANAGEMENT

**Use cases:** Plan/publish institutional content, monitor engagement, protect reputation.

**Features:**
- Multi-platform content calendar and scheduler (Instagram, Facebook, LinkedIn, X, YouTube).
- Post approval workflow (Marketing drafts → Principal/Admin approves before publish — important given school reputational sensitivity and child-safety image considerations).
- Media asset library shared with Marketing.
- Engagement analytics dashboard (reach, likes, comments, follower growth) aggregated across platforms.
- Auto-post suggestions triggered by events elsewhere in the system (exam toppers, sports wins, event photos) — always routed through the same approval gate, never auto-published without human sign-off given minors are involved.
- Reputation monitoring: aggregate reviews/mentions (Google reviews, etc.) into one dashboard.
- **Child-safety guardrail (mandatory, not optional):** any post containing a student photo must check against a parental photo/video consent flag (from 2.7 Consent Forms) before it can be scheduled — block publish and alert Marketing/Principal if consent is missing or withdrawn.

**Entities:** SocialPost, ContentCalendarEntry, MediaAsset, EngagementMetric, SocialAccount, ConsentCheck.

---

## 2.14 ADMISSIONS & CRM (institution-facing intake, distinct from Marketing's lead-gen)

**Use cases:** Manage application intake through enrollment, handle document verification, run entrance processes, manage seats.

**Features:**
- Online application form builder (per class/program, configurable fields).
- Document upload and verification checklist (birth certificate, previous school TC, category certificates for reservation quotas, address proof, etc. — see Part 4 for what's statutorily required, e.g., RTE 25% reservation category proof).
- Entrance test/interview scheduling and scoring.
- Merit list generation with configurable weighting (test score, interview, sibling/alumni preference, reserved-category quotas).
- Seat allotment engine with waitlist management and auto-promotion from waitlist as seats free up.
- Admission-to-fee-invoice auto-linking (on offer acceptance, first invoice auto-generated in Finance).
- On confirmed admission, auto-creates the StudentProfile (2.6) and links ParentProfile (2.7), eliminating duplicate data entry.

**Entities:** Application, Document, EntranceTest, MeritList, SeatOffer, WaitlistEntry.

---

**End of Part 2. Proceed to Part 3 for Academic Core and Operational modules.**
