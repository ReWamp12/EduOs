# EduOS — Current System Updates

## Scope

This document defines the **next updates to the current EduOS system**.

For this stage, the system should focus on only two core features:

1. **Syllabus & Learning**
2. **Student Performance**

No additional product divisions or editions are considered in this update.

The objective is to extend the current system with a simple academic workflow that connects:

```text
Syllabus
   ↓
Learning
   ↓
Assessment
   ↓
Student Performance
```

The system must remain simple and usable by **administrators, faculty/teachers, and students**, including users with no technical background.

---

# 1. Update: Syllabus & Learning

## 1.1 Objective

Add a structured syllabus and learning system to the current application.

The feature should allow administrators/faculty to organize educational content into subjects, chapters, and topics.

Students should be able to view the syllabus, access learning resources, and understand their learning progress.

The primary goal is:

> Make it clear what needs to be taught, what has been taught, what material is available, and what the student needs to learn next.

---

# 1.2 Academic Structure

The current system should support the following hierarchy:

```text
Academic Year
    ↓
Class / Group
    ↓
Subject
    ↓
Chapter
    ↓
Topic
    ↓
Learning Material
```

### Example

```text
Class 10
└── Mathematics
    ├── Real Numbers
    │   ├── Euclid's Division Lemma
    │   ├── Fundamental Theorem of Arithmetic
    │   └── Irrational Numbers
    │
    ├── Polynomials
    │   ├── Introduction
    │   └── Zeros of Polynomial
    │
    └── Linear Equations
```

The exact terminology can follow the current system's existing terminology, but the hierarchy should remain clear.

---

# 1.3 Subject Management

A subject should contain:

- Subject name
- Subject code (optional)
- Description (optional)
- Assigned faculty
- Associated class/group
- Syllabus
- Learning materials

Example:

```text
Mathematics

Faculty: Amit Sharma

Syllabus:
12 Chapters
64 Topics

Progress:
68%
```

---

# 1.4 Chapter Management

Each subject can contain multiple chapters.

Each chapter should have:

- Chapter name
- Description (optional)
- Order/sequence
- Topics
- Learning materials
- Completion status
- Progress percentage

Example:

```text
Mathematics
└── Chapter 1 — Real Numbers
    ├── Topic 1
    ├── Topic 2
    └── Topic 3
```

Chapters should be reorderable so the learning sequence is maintained.

---

# 1.5 Topic Management

Topics represent the smallest learning unit in the initial system.

Each topic should contain:

- Topic name
- Description
- Order
- Status
- Learning materials
- Faculty notes
- Completion date (where applicable)

### Topic status

Use only three statuses initially:

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
```

User-friendly display:

```text
○ Not Started
◐ In Progress
✓ Completed
```

Avoid unnecessary workflow states.

---

# 1.6 Faculty Workflow

Faculty should have a simple workflow.

```text
Login
  ↓
My Subjects
  ↓
Select Subject
  ↓
View Syllabus
  ↓
Select Chapter
  ↓
Select Topic
  ↓
Add / View Material
  ↓
Teach Topic
  ↓
Mark Topic Completed
```

After completing a topic, the system automatically updates the syllabus progress.

---

# 1.7 Learning Materials

Faculty should be able to attach educational resources to chapters or topics.

Initial supported resources:

- PDF
- Images
- Video
- External links
- Text/notes
- Presentations where supported

Example:

```text
Real Numbers
└── Euclid's Division Lemma

Learning Material
├── Class Notes.pdf
├── Practice Questions.pdf
├── Lecture Video
└── Reference Link
```

The interface should make uploading material as simple as possible.

Example:

```text
+ Add Material

Material Type:
[ PDF ]

Title:
[ Euclid's Division Lemma Notes ]

Upload:
[ Choose File ]

[ Save ]
```

---

# 1.8 Student Learning Workflow

Student workflow:

```text
Login
  ↓
Dashboard
  ↓
My Subjects
  ↓
Select Subject
  ↓
View Syllabus
  ↓
Select Chapter
  ↓
Select Topic
  ↓
Read / Watch Material
```

The student should immediately understand:

- Completed topics
- Current topic
- Remaining topics
- Available material
- Overall progress

---

# 1.9 Student Syllabus View

Example:

```text
Mathematics

Overall Progress
████████████░░░ 80%

Chapter 1 — Real Numbers
✓ Euclid's Division Lemma
✓ Fundamental Theorem
✓ Irrational Numbers

Chapter 2 — Polynomials
✓ Introduction
◐ Zeros of Polynomial

Chapter 3 — Linear Equations
○ Introduction
○ Graphical Method
```

The interface should prioritize visual clarity rather than displaying technical information.

---

# 1.10 Syllabus Progress

Progress should be calculated automatically.

Basic calculation:

```text
Completed Topics
---------------- × 100
Total Topics
```

Example:

```text
Completed Topics = 16
Total Topics = 20

Progress = 80%
```

Progress should be available at:

- Topic level
- Chapter level
- Subject level
- Student level
- Class/group level

---

# 1.11 Faculty Syllabus Dashboard

Faculty should be able to see:

```text
My Subject — Mathematics

Overall Progress
██████████░░░░░ 68%

Chapter 1       100%
Chapter 2       100%
Chapter 3        65%
Chapter 4         0%

Topics Remaining
18
```

The purpose is to help faculty understand where they are in the syllabus.

---

# 1.12 Admin Syllabus Overview

The administrator should be able to see a high-level overview.

Example:

```text
Academic Progress

Mathematics       68%
Science            72%
English            81%
Social Science     61%
```

The administrator does not need detailed teaching controls on this screen.

The focus is visibility.

---

# 1.13 Syllabus & Learning V1 Requirements

### Required

- Subject management
- Chapter management
- Topic management
- Topic ordering
- Topic status
- Faculty assignment
- Student access
- Learning material upload
- Learning material viewing
- Syllabus progress calculation
- Faculty syllabus dashboard
- Student syllabus dashboard
- Basic admin overview

### Not required in this update

- AI-generated lessons
- AI syllabus generation
- Gamification
- Badges
- Competencies
- SCORM
- H5P
- Complex learning paths
- Advanced content authoring
- Live-class infrastructure
- Marketplace

---

# 2. Update: Student Performance

## 2.1 Objective

Add a simple performance system that turns student academic activity into an understandable overview.

The system should help answer:

> How is this student performing?

The performance system should use actual academic data rather than requiring faculty to manually maintain a separate performance score.

---

# 2.2 Performance Inputs

The initial performance system should use:

```text
Attendance
    +
Assessment / Test Marks
    +
Assignment Completion
    +
Syllabus Progress
```

These values are combined to provide a student performance overview.

---

# 2.3 Student Performance Dashboard

Example:

```text
Rohan Mehta

Overall Performance
82%

Attendance
91%

Syllabus Progress
76%

Assignments
14 / 15

Assessments
82%
```

Subject-wise:

```text
Mathematics       88%
Science           79%
English            81%
```

The dashboard should be simple enough for a student to understand without explanation.

---

# 2.4 Attendance

Attendance should be recorded and displayed as a performance input.

Example:

```text
Total Classes       50
Present             45
Absent               5

Attendance          90%
```

The system should maintain:

- Attendance records
- Attendance percentage
- Attendance history
- Subject/class attendance where applicable

---

# 2.5 Assessments

The initial assessment system can remain simple.

Faculty should be able to record:

- Assessment name
- Subject
- Date
- Total marks
- Student marks
- Optional remarks

Example:

```text
Mathematics — Chapter 1 Test

Total Marks: 100

Rohan       82
Aarav       76
Diya        91
```

The system calculates percentages automatically.

Example:

```text
82 / 100 = 82%
```

---

# 2.6 Assignment Completion

Track basic assignment activity.

Example:

```text
Assignments Assigned     15
Submitted                14

Completion               93%
```

Initial statuses:

```text
PENDING
SUBMITTED
EVALUATED
```

The performance dashboard should use completion data.

---

# 2.7 Syllabus Progress as Performance Input

The Syllabus & Learning feature already calculates progress.

That progress becomes one of the student's performance indicators.

Example:

```text
Syllabus Progress
76%
```

This allows the system to identify students who may be falling behind academically.

---

# 2.8 Subject Performance

Performance should be visible per subject.

Example:

```text
Mathematics

Assessment Average       84%
Attendance               92%
Assignments              90%
Syllabus Progress        80%

Subject Performance      86%
```

This allows faculty and students to identify strong and weak areas.

---

# 2.9 Performance History

The system should retain historical assessment results.

Example:

```text
Mathematics

Test 1        62%
Test 2        68%
Test 3        74%
Test 4        81%
```

This allows the UI to show a simple trend:

```text
62 → 68 → 74 → 81

Improving ↑
```

The initial version does not need advanced predictive analytics.

---

# 2.10 Faculty Performance View

Faculty should be able to see all students they teach.

Example:

```text
Mathematics — Class 10

Student        Score    Attendance    Status

Rohan          86%        92%         Good
Aarav          79%        88%         Good
Diya           61%        72%         Attention
Kabir          91%        95%         Good
```

Clicking a student should open the student's detailed performance.

---

# 2.11 Performance Indicators

The system should provide simple rule-based indicators.

### Low Attendance

```text
Attendance < 75%

→ Low Attendance
```

### Low Assessment Performance

```text
Assessment Average < 50%

→ Needs Academic Attention
```

### Incomplete Assignments

```text
Assignment Completion < 60%

→ Incomplete Work
```

### Falling Behind

If syllabus progress is significantly below the relevant class/group average:

```text
→ Falling Behind
```

These are indicators, not automatic judgments.

Faculty should always be able to interpret the data.

---

# 2.12 Faculty Remarks

Faculty should optionally be able to add a simple remark.

Examples:

```text
Good improvement in Mathematics.

Needs more practice in Algebra.

Attendance needs improvement.
```

Remarks should be plain text and easy to add/edit.

No complicated feedback workflow is required.

---

# 2.13 Admin Performance Overview

The administrator should be able to see a high-level summary.

Example:

```text
Academic Performance

Students                240

Average Performance      78%
Average Attendance       91%
Average Syllabus         72%

Students Needing Attention
18
```

The administrator can drill down:

```text
Overview
  ↓
Subject
  ↓
Class / Group
  ↓
Student
  ↓
Detailed Performance
```

---

# 2.14 Performance Calculation

The system should keep individual metrics separate.

Primary metrics:

```text
Assessment Performance
Attendance
Assignment Completion
Syllabus Progress
```

A combined **Academic Performance Score** may be displayed if required.

A simple initial weighting can be:

```text
Assessment Score       60%
Attendance             15%
Assignment Completion  10%
Syllabus Progress      15%
```

Example:

```text
Assessment       82
Attendance       90
Assignments      93
Syllabus         75

Performance =
(82 × 0.60)
+ (90 × 0.15)
+ (93 × 0.10)
+ (75 × 0.15)

= 83.45%
```

This score is an internal progress indicator.

It must not replace official examination marks or institutional grading rules.

If the institution does not want a combined score, the system should simply show the four metrics independently.

---

# 2.15 Student Performance V1 Requirements

### Required

- Attendance percentage
- Assessment marks
- Assessment percentage
- Assignment completion
- Syllabus progress
- Student performance dashboard
- Subject-wise performance
- Assessment history
- Basic performance trend
- Rule-based attention indicators
- Faculty remarks
- Faculty class/group performance view
- Basic admin performance overview

### Not required in this update

- AI predictions
- Machine-learning performance prediction
- Dropout prediction
- Complex BI dashboards
- Advanced benchmarking
- Gamification
- Leaderboards
- Competency mapping
- AI-generated reports
- Advanced counseling workflows

---

# 3. Relationship Between Both Features

The two features must be connected.

## Syllabus & Learning produces

```text
Subjects
Chapters
Topics
Materials
Topic Completion
Syllabus Progress
```

## Student Performance uses

```text
Syllabus Progress
        +
Attendance
        +
Assessments
        +
Assignments
```

Therefore:

```text
             SYLLABUS & LEARNING
                     │
                     ▼
              Syllabus Progress
                     │
                     ▼
               PERFORMANCE
                     ▲
                     │
        ┌────────────┼────────────┐
        │            │            │
   Attendance    Assessments   Assignments
```

The performance page should never require duplicate manual entry of syllabus progress.

---

# 4. Complete User Workflow

## Administrator

```text
Login
  ↓
Open Academic Setup
  ↓
Create / Configure Subjects
  ↓
Configure Syllabus
  ↓
Assign Faculty
  ↓
Ensure Students Have Access
  ↓
View Academic Progress
  ↓
View Performance Overview
```

The administrator's job is primarily configuration and visibility.

---

## Faculty

```text
Login
  ↓
Open My Subjects
  ↓
Select Subject
  ↓
Open Syllabus
  ↓
Teach Topic
  ↓
Upload Material
  ↓
Mark Topic Completed
  ↓
Record Attendance
  ↓
Create / Record Assessment
  ↓
Record Assignment Activity
  ↓
View Student Performance
  ↓
Identify Students Needing Attention
```

The faculty workflow should require as few clicks as possible.

---

## Student

```text
Login
  ↓
Open Dashboard
  ↓
View Subjects
  ↓
Open Syllabus
  ↓
View Topics
  ↓
Access Learning Material
  ↓
View Syllabus Progress
  ↓
View Assessments
  ↓
View Performance
```

The student should not need to understand how the system calculates performance.

---

# 5. Simple Real-World Use Case

## Scenario

A faculty member teaches Mathematics.

The administrator has already configured:

```text
Mathematics
 ├── Real Numbers
 ├── Polynomials
 └── Linear Equations
```

The faculty opens Mathematics and teaches:

```text
Real Numbers
→ Euclid's Division Lemma
```

After the class, the faculty marks the topic:

```text
✓ Completed
```

The faculty uploads:

```text
Euclid's Division Lemma Notes.pdf
```

The student logs in and sees:

```text
Mathematics

Syllabus Progress: 25%

✓ Euclid's Division Lemma
○ Fundamental Theorem
○ Irrational Numbers
```

The student opens the notes.

Later, the faculty records a test:

```text
Real Numbers Test
Total: 100

Student: Rohan
Marks: 82
```

The student also has:

```text
Attendance: 92%
Assignments: 90%
Syllabus: 25%
Assessment: 82%
```

The performance dashboard now displays these metrics.

As more topics, assignments, attendance records, and assessments are recorded, the performance view automatically becomes more meaningful.

---

# 6. Required Data Relationships

The basic data model should support:

```text
User
 │
 ├── Faculty
 └── Student

Academic Year
 │
 └── Class / Group
      │
      ├── Subjects
      │    │
      │    └── Syllabus
      │         ├── Chapters
      │         │    └── Topics
      │         │         └── Materials
      │
      ├── Faculty
      └── Students

Student
 │
 ├── Enrollment
 ├── Topic Progress
 ├── Attendance
 ├── Assignments
 ├── Assessments
 └── Performance
```

---

# 7. Logical Technical Modules

These are implementation boundaries, not necessarily separate deployed microservices.

## Identity

- Users
- Authentication
- Roles
- Permissions

## Academic

- Academic year
- Classes/groups
- Subjects
- Faculty assignments
- Student enrollment

## Syllabus & Learning

- Chapters
- Topics
- Topic status
- Learning materials
- Progress

## Assessment

- Assessments
- Marks
- Assignments
- Submissions
- Results

## Attendance

- Attendance records
- Attendance percentage
- Attendance history

## Performance

- Performance aggregation
- Subject performance
- Trends
- Indicators
- Remarks

## File Storage

- Learning materials
- File metadata
- Access control

These boundaries should initially live inside the existing application as clearly separated modules unless there is a specific reason to deploy them independently.

---

# 8. UX Requirements

The target users are non-technical.

Therefore:

### Simple language

Use:

- Subjects
- Chapters
- Topics
- Materials
- Attendance
- Tests
- Results
- Performance

Avoid exposing technical terminology.

### Simple actions

For faculty:

```text
Select Topic
→ Upload Material
→ Mark Completed
```

For attendance:

```text
Select Class
→ Mark Students
→ Save
```

For assessment:

```text
Select Test
→ Enter Marks
→ Save
```

### Clear visual feedback

Use:

```text
✓ Completed
◐ In Progress
○ Not Started
```

and progress bars such as:

```text
████████░░ 80%
```

The interface should prioritize the most important information and avoid overwhelming users with configuration options.

---

# 9. Current System Update Checklist

## Syllabus & Learning

- [x] Subject structure
- [x] Chapter CRUD
- [x] Topic CRUD
- [x] Topic ordering
- [x] Topic status
- [x] Faculty assignment
- [x] Student syllabus access
- [x] Material upload
- [x] Material view/download
- [x] Topic progress
- [x] Chapter progress
- [x] Subject progress
- [x] Student syllabus dashboard
- [x] Faculty syllabus dashboard
- [x] Admin overview

## Student Performance

- [x] Attendance data integration
- [x] Assessment creation/marks
- [x] Assignment tracking
- [x] Syllabus progress integration
- [x] Student performance dashboard
- [x] Subject performance
- [x] Assessment history
- [x] Performance trend
- [x] Attention indicators
- [x] Faculty remarks
- [x] Faculty class/group performance
- [x] Admin performance overview

---

# 10. Definition of Done

The update is complete when a non-technical faculty member can perform this entire workflow without developer assistance:

```text
Open Subject
   ↓
View Syllabus
   ↓
Open Chapter
   ↓
Open Topic
   ↓
Upload Learning Material
   ↓
Teach Topic
   ↓
Mark Topic Completed
   ↓
Record Attendance
   ↓
Record Assessment Marks
   ↓
View Student Performance
```

And a student can:

```text
Login
   ↓
View Subjects
   ↓
View Syllabus
   ↓
Open Topics
   ↓
Access Learning Material
   ↓
View Syllabus Progress
   ↓
View Assessment Results
   ↓
View Overall Performance
```

The system should automatically connect the data so that:

```text
Teaching
   ↓
Learning
   ↓
Attendance / Assignments / Assessments
   ↓
Progress
   ↓
Student Performance
```

---

# 11. Final Scope

The current update should remain strictly focused on:

## 1. Syllabus & Learning

**Organize and deliver what students need to learn.**

## 2. Student Performance

**Measure and visualize how students are progressing.**

Everything else should only be implemented when it directly supports these two workflows.

The guiding principle for this version is:

> **Keep the system simple: faculty manages learning, students follow the learning path, and the system automatically turns academic activity into understandable performance information.**
