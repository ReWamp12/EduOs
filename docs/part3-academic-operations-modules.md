# PART 3 — ACADEMIC CORE & OPERATIONAL MODULES

---

## 3.1 ACADEMIC CORE (Curriculum, Timetable, Exams, LMS, Attendance)

**Use cases:** Structure what's taught, when, how it's assessed, and how it's delivered online and offline.

**Features:**
- **Curriculum/syllabus builder**: subject → unit → topic hierarchy, mapped to board/curriculum standard (CBSE/ICSE/State Board/IB/IGCSE/university semester system — pluggable per tenant via the compliance ruleset from Part 4).
- **Timetable engine**: auto-generation with constraint solving (teacher availability, room capacity, subject-period rules, no double-booking) plus manual override; substitution auto-suggestion when a teacher is on leave.
- **Attendance**: biometric/RFID/QR/manual capture, period-wise or day-wise per policy, real-time sync to parent alerts (2.7), and to statutory reporting (Part 4 — many boards require minimum attendance percentage for exam eligibility, especially Class IX–XII).
- **Exam management**: exam scheduling, seating-plan generator, hall-ticket/admit-card generation (Document Engine), invigilation duty assignment.
- **Online exam engine**: MCQ and subjective question banks, auto-grading for objective types, plagiarism-aware submission for written work, configurable proctoring (see Part 5 for AI-proctoring).
- **Report card / transcript generator**: fully configurable templates per board (CBSE CCE-style, percentage-based, GPA-based, narrative/competency-based for younger grades), auto-computed from Gradebook (2.4) and Attendance, teacher remarks, principal sign-off gate before publishing to parents/students.
- **LMS**: video/PDF/interactive content hosting, assignment distribution and collection, quiz builder, progress tracking per student, offline-download support for low-connectivity areas.
- **Syllabus-completion tracker**: maps lesson plans (2.4) against curriculum plan, flags falling-behind subjects for Principal visibility — several boards' inspection norms effectively require demonstrable pacing.
- **Learning outcome/competency tracking**: for boards moving to competency-based assessment (India's NEP 2020 direction), tag assessments to specific learning outcomes, not just marks.

**Workflow:** Curriculum defined at year start → timetable generated → classes conducted, attendance marked → assignments/quizzes/exams conducted → grades computed → Principal/Teacher publishes report cards → visible to student/parent → data rolls up into statutory reporting (Part 4).

**Entities:** Curriculum, Subject, Unit, Timetable, Exam, Question, QuestionBank, ReportCardTemplate, LMSContent, Attendance, LearningOutcome.

---

## 3.2 COMMUNICATION & NOTIFICATIONS (institution-facing layer on top of the Part 1 Notification Service)

**Use cases:** Unified, targeted, trackable communication across every stakeholder.

**Features:**
- In-app messaging/chat (Teacher↔Parent, Staff↔Staff, with appropriate RBAC — e.g., students should not have unsupervised direct messaging with staff without institutional oversight, configurable per tenant's child-safety policy).
- Broadcast notices targeted by role/class/branch/individual.
- Multi-channel delivery (push/SMS/email/WhatsApp) with delivery and read-receipt tracking.
- Emergency/SOS broadcast (weather closure, security incident) with acknowledgment tracking — Principal can see who has and hasn't acknowledged a critical alert.
- Language preference per user (multi-language notice delivery).
- Notification digest/preference center so users aren't overwhelmed (daily digest option vs real-time).

**Entities:** Message, Notice, NotificationLog, Channel, AcknowledgmentReceipt.

---

## 3.3 TRANSPORT

**Use cases:** Manage bus routes and drivers, ensure student boarding safety, track vehicles live.

**Features:**
- Route planner with stop sequencing and estimated timing.
- Vehicle and driver assignment; driver document tracking (license, permit, badge — with expiry alerts).
- Live GPS tracking, parent-facing map view with ETA.
- RFID/QR boarding and deboarding logs — auto-alert parent on both events.
- Vehicle maintenance and compliance tracking: fitness certificate, insurance, pollution certificate, permit — all with expiry reminders (school-bus safety norms in several Indian states mandate these, plus speed governors, CCTV in buses, and a female attendant on routes carrying young children).
- Route optimization suggestions and capacity planning against enrolled students.
- Incident/breakdown reporting from driver app.

**Entities:** Vehicle, Route, Stop, Driver, BoardingLog, ComplianceDocument(vehicle).

---

## 3.4 HOSTEL

**Use cases:** Room allocation, mess management, resident safety and leave tracking.

**Features:**
- Room/bed allocation with capacity management and roommate preferences where applicable.
- Mess menu planning and billing (linked to Finance).
- In/out register for residents (gate-pass style, warden-approved).
- Leave request workflow requiring parent approval (digital consent, not just staff sign-off).
- Warden dashboard: occupancy, pending leave requests, health/incident log for residents.
- Visitor log specific to hostel premises.
- Emergency contact quick-access for wardens (links to 2.7 medical/emergency data).

**Entities:** HostelBlock, Room, Bed, MessMenu, HostelLeave, HostelVisitorLog.

---

## 3.5 LIBRARY

**Use cases:** Catalog management, circulation, digital resource access.

**Features:**
- Catalog search (title/author/subject/ISBN), barcode-based issue/return.
- Fine auto-calculation on overdue returns, linked to Finance for collection.
- Reservation queue for high-demand titles.
- Digital library/e-book access with per-user lending limits.
- Reading-habit analytics (books read per student per term — useful for holistic development tracking).
- Inter-branch catalog sharing for multi-campus trusts.

**Entities:** Book, Copy, Loan, Fine, DigitalResource, Reservation.

---

## 3.6 EVENTS & CALENDAR

**Use cases:** Plan and run academic/cultural/sports events, manage registration and ticketing.

**Features:**
- Unified academic calendar (holidays, exams, events, PTMs) visible per role with relevant filtering.
- Event creation with registration, capacity limits, and optional ticketing/payment for paid events (links to Finance).
- Volunteer/staff duty assignment for event logistics.
- Post-event photo/video gallery — auto-feeds Social Media module (2.13) subject to the same photo-consent guardrail.
- Certificate-of-participation auto-generation (Document Engine) for competitions/events.

**Entities:** Event, RSVP, Ticket, DutyAssignment, EventGallery.

---

**End of Part 3. Proceed to Part 4 for the Government & Regulatory Compliance Module.**
