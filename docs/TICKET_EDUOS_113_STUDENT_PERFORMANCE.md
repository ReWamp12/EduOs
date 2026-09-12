# Ticket EDUOS-113: Student Academic Performance Engine & Multi-Stakeholder Dashboards

- **Ticket Key**: `EDUOS-113`
- **Epic**: `Academic Core & Learning Analytics (Phase 2)`
- **Module**: `Student Performance & Assessment Management`
- **Priority**: `High (P1)`
- **Specification Reference**: [`EduOS_Current_System_Updates.md`](file:///c:/Users/hhars/OneDrive/Desktop/EduOs/EduOS_Current_System_Updates.md) (§1.12, §2.1–§2.15, §3, §4, §5, §6, §7, §8, §9, §10, §11)
- **Prerequisite / Implemented Scope**: Phase 1: Syllabus & Learning is complete ([`16_syllabus_learning.sql`](file:///c:/Users/hhars/OneDrive/Desktop/EduOs/supabase/schemas/16_syllabus_learning.sql), `CurriculumTracker.tsx`, `StudentSyllabus.tsx`). This ticket strictly encompasses **Phase 2: Student Performance** and the overarching Academic Overview.

---

## 1. Executive Summary & Objective

Transform live academic activity into an intuitive, unified performance overview answering: **"How is this student performing?"**

The system aggregates actual operational data across four pillars:
1. **Attendance** (presence records & percentage)
2. **Assessment / Test Marks** (test scores & historical percentages)
3. **Assignment Completion** (submission & evaluation rates)
4. **Syllabus Progress** (dynamically pulled from the completed Phase 1 `student_topic_progress` / `syllabus_topics` tables — **zero duplicate manual entry**)

The solution provides role-tailored dashboards for **Students**, **Faculty/Teachers**, and **Administrators** with automated, rule-based attention indicators for students falling behind.

```text
             SYLLABUS & LEARNING (Phase 1 - Done)
                           │
                           ▼
                    Syllabus Progress
                           │
                           ▼
                 STUDENT PERFORMANCE (Phase 2 - EDUOS-113)
                           ▲
                           │
              ┌────────────┼────────────┐
              │            │            │
         Attendance   Assessments   Assignments
```

---

## 2. Performance Aggregation Formula & Weighting

### 2.1 Four Independent Core Metrics
The system preserves the four metrics individually to ensure transparency:
- **Assessment Performance**: $\frac{\sum \text{Marks Obtained}}{\sum \text{Max Marks}} \times 100$
- **Attendance Percentage**: $\frac{\text{Classes Present}}{\text{Total Classes}} \times 100$
- **Assignment Completion**: $\frac{\text{Submitted Assignments}}{\text{Total Assigned}} \times 100$
- **Syllabus Progress**: $\frac{\text{Completed Topics}}{\text{Total Topics}} \times 100$ (from Phase 1)

### 2.2 Combined Academic Performance Score (Configurable)
When a composite metric is displayed, apply standard weighted aggregation:
$$\text{Performance Score} = (0.60 \times \text{Assessment}) + (0.15 \times \text{Attendance}) + (0.10 \times \text{Assignments}) + (0.15 \times \text{Syllabus Progress})$$

*(Note: The score functions as an internal progress indicator and does not replace statutory board examination marks).*

---

## 3. Automated Rule-Based Attention Indicators

Provide instant visual warnings to teachers and administrators based on deterministic rules:
- ⚠️ **Low Attendance**: `Attendance < 75%`
- ⚠️ **Needs Academic Attention**: `Assessment Average < 50%`
- ⚠️ **Incomplete Work**: `Assignment Completion < 60%`
- ⚠️ **Falling Behind**: `Student Syllabus Progress` significantly below class/batch average

---

## 4. User Stories

### 4.1 As a Student:
- I want a clean, non-technical dashboard showing my **Overall Performance %** and the 4 key metrics: Attendance %, Syllabus %, Assignments (e.g., 14/15), and Assessments %.
- I want to see a subject-wise breakdown (e.g., Mathematics 88%, Science 79%, English 81%) so I know my strengths and weaknesses.
- I want to see my assessment history with simple visual trend indicators (`62% → 68% → 74% → 81% (Improving ↑)`).
- I want to read encouragement or feedback remarks left by my teachers.

### 4.2 As a Faculty Member / Teacher:
- I want to record and manage tests/assessments (Title, Date, Total Marks, Student Scores, Remarks) with as few clicks as possible.
- I want a single **Class Performance View** showing all students in my batch with their overall score, attendance, and status badge (`Good` vs `Attention`).
- I want to click any student to drill down into their full academic profile.
- I want to add or edit plain-text remarks (e.g., *"Good improvement in Mathematics"*, *"Needs more practice in Algebra"*) without complex workflows.

### 4.3 As an Administrator / Principal:
- I want a high-level **Academic Performance Overview** showing:
  - Total Students
  - School Average Performance %
  - School Average Attendance %
  - School Average Syllabus Progress %
  - Total Students Needing Attention count
- I want a seamless 4-level drill-down path:
  $$\text{Overview} \longrightarrow \text{Subject} \longrightarrow \text{Class / Batch} \longrightarrow \text{Student Detailed Performance}$$
- I want high-level visibility over syllabus completion rates across all subjects (closing §1.12 from the updates specification).

---

## 5. Technical Architecture & Database Schema

### 5.1 New Migration: `supabase/schemas/17_student_performance.sql`

#### Tables:
1. **`assessments`**:
   - `id`: UUID Primary Key
   - `tenant_id`: UUID references `tenants(id)`
   - `batch_id`: UUID references `batches(id)`
   - `subject_id`: UUID references `subjects(id)`
   - `title`: TEXT NOT NULL (e.g., "Real Numbers Unit Test")
   - `assessment_type`: TEXT DEFAULT 'test' (`test`, `quiz`, `midterm`, `final`)
   - `date`: DATE NOT NULL
   - `total_marks`: NUMERIC NOT NULL
   - `passing_marks`: NUMERIC
   - `created_by`: UUID references `user_profiles(id)`
   - Timestamps & `is_deleted`

2. **`assessment_scores`**:
   - `id`: UUID Primary Key
   - `tenant_id`: UUID references `tenants(id)`
   - `assessment_id`: UUID references `assessments(id)` ON DELETE CASCADE
   - `student_id`: UUID references `students(id)`
   - `marks_obtained`: NUMERIC NOT NULL
   - `remarks`: TEXT
   - Unique constraint on `(assessment_id, student_id)`

3. **`student_assignments`**:
   - `id`: UUID Primary Key
   - `tenant_id`: UUID references `tenants(id)`
   - `batch_id`: UUID references `batches(id)`
   - `subject_id`: UUID references `subjects(id)`
   - `title`: TEXT NOT NULL
   - `due_date`: DATE
   - `total_points`: NUMERIC DEFAULT 100
   - Timestamps & `is_deleted`

4. **`assignment_submissions`**:
   - `id`: UUID Primary Key
   - `tenant_id`: UUID references `tenants(id)`
   - `assignment_id`: UUID references `student_assignments(id)` ON DELETE CASCADE
   - `student_id`: UUID references `students(id)`
   - `status`: TEXT NOT NULL DEFAULT 'pending' (`pending`, `submitted`, `evaluated`)
   - `submission_date`: TIMESTAMPTZ
   - `grade`: NUMERIC

5. **`faculty_remarks`**:
   - `id`: UUID Primary Key
   - `tenant_id`: UUID references `tenants(id)`
   - `student_id`: UUID references `students(id)`
   - `faculty_id`: UUID references `user_profiles(id)`
   - `subject_id`: UUID references `subjects(id)`
   - `remark_text`: TEXT NOT NULL
   - `created_at`: TIMESTAMPTZ DEFAULT now()
   - `updated_at`: TIMESTAMPTZ DEFAULT now()

---

## 6. Implementation Sub-Tasks / Breakdown

| Sub-Task Key | Scope | Deliverables |
|---|---|---|
| **EDUOS-113.1** | **Database Schema & Seed Data** | Migration `17_student_performance.sql` with RLS, indexes, and realistic Class 10 assessment/assignment/attendance demo records. |
| **EDUOS-113.2** | **Types & Data Service Methods** | Add TypeScript models and methods in `dataService.ts`: `getStudentPerformance(studentId)`, `getClassPerformance(batchId, subjectId)`, `createAssessment()`, `recordMarks()`, `saveFacultyRemark()`, and `getAdminPerformanceOverview()`. |
| **EDUOS-113.3** | **Student Performance Dashboard** | Build `StudentPerformanceView.tsx` with 4 metric cards, subject performance breakdown, assessment history trend (`Improving ↑`), and faculty remarks. |
| **EDUOS-113.4** | **Faculty Class Performance View** | Build `FacultyPerformanceView.tsx` with class roster table, score/attendance badges, attention alerts, assessment creation/marks entry modal, and inline remarks editing. |
| **EDUOS-113.5** | **Admin Performance & Syllabus Overview** | Build `AdminAcademicOverview.tsx` with school-wide KPIs, students-needing-attention queue, and 4-level drill-down navigation. |

---

## 7. Explicit Out-of-Scope (Strictly per Specification)

Do **NOT** implement the following in this ticket:
- ❌ Machine-learning or AI performance predictions
- ❌ Dropout risk AI models
- ❌ Complex external BI dashboards
- ❌ Gamification, points, or student badges / leaderboards
- ❌ Competency mapping / skill trees
- ❌ Advanced multi-step counseling workflows

---

## 8. Definition of Done (Verification Checklist)

The ticket is considered DONE when:
- [ ] **Data Pipeline**: Syllabus progress from Phase 1 flows directly into performance calculation with 0 manual duplication.
- [ ] **Student Verification**:
  - Student logs in, navigates to Performance, and views Overall Score %, Attendance %, Syllabus %, Assignments count, and Tests %.
  - Student views historical test trends with visual indicators.
- [ ] **Teacher Verification**:
  - Teacher views Class Performance roster with status tags (`Good` / `Attention`).
  - Teacher creates a test, inputs marks for the class, and saves with instant percentage calculations.
  - Teacher adds/edits a remark for a student; the student immediately sees the updated remark.
- [ ] **Admin Verification**:
  - Admin opens Academic Overview and views aggregate metrics and count of students needing attention.
  - Admin drills down: Overview $\rightarrow$ Subject $\rightarrow$ Batch $\rightarrow$ Student.
- [ ] **Rule Alerts**:
  - A student with `< 75%` attendance is flagged with `Low Attendance`.
  - A student with `< 50%` test average is flagged with `Needs Academic Attention`.
