# EduOS — Multi-Tenant Demo Data Specification (2 Schools)

> **Prompt Context for Claude**: Generate a complete, relationally intact SQL seed script (`seed_demo_2_schools.sql`) for **TWO distinct school tenants** to demonstrate multi-tenancy, custom branding, and Supabase Row-Level Security (RLS) data isolation.
>
> 🏫 **School 1 (CBSE Day School)**:
> - **Tenant ID**: `'247afd96-506e-494c-a603-510b44316919'`
> - **Institution Name**: `Greenfield International Academy`
> - **Subdomain**: `greenfield`
> - **Branding**: Primary: `#1E40AF` (Deep Blue), Secondary: `#0D9488` (Teal), Accent: `#F59E0B`
> - **Curriculum**: `CBSE (Class 9, 10, 11 Science)`
>
> 🏰 **School 2 (ICSE / International Academy)**:
> - **Tenant ID**: `'3b8d9c12-789a-4123-bcde-567890abcdef'`
> - **Institution Name**: `Heritage Valley World School`
> - **Subdomain**: `heritage`
> - **Branding**: Primary: `#7C2D12` (Deep Maroon), Secondary: `#D97706` (Warm Gold), Accent: `#10B981`
> - **Curriculum**: `ICSE (Class 9, 10, 11 Commerce & Humanities)`
>
> 🔑 **Default Password**: `Demo@2026!` across all mock accounts.

---

## 1. Multi-Tenant Seeding Dependency Order

For each of the 2 schools, execute table inserts in this strict sequence:

```mermaid
flowchart TD
    T[1. tenants (2 Schools)] --> B[2. branches]
    B --> UP[3. user_profiles & teachers & employee_records]
    B --> BAT[4. batches & subjects]
    BAT --> TIM[5. timetables]
    BAT --> STU[6. students & linked parent profiles]
    STU --> ATT[7. attendances]
    BAT --> EXM[8. exams & exam_results & assignments & submissions]
    T --> FIN[9. chart_of_accounts & fee_structures & fee_invoices & journal_entries]
    UP --> PAY[10. payroll_runs & payroll_items & leave_requests]
    T --> OPS[11. transport_vehicles & transport_routes & library & inventory]
    T --> GOV[12. compliance_documents & smc_minutes & udise_records & complaint_cases]
    T --> CRM[13. inquiry_leads & admission_applications & alumni_donations]
    STU --> PRN[14. consent_forms & consent_responses & ptm_bookings & notices & support_tickets]
```

---

## 2. Target Dataset Breakdown for School 1 & School 2

### 🏫 1. Institution Profiles & Campuses
| Field | School 1: Greenfield International | School 2: Heritage Valley World School |
|---|---|---|
| `tenant_id` | `'247afd96-506e-494c-a603-510b44316919'` | `'3b8d9c12-789a-4123-bcde-567890abcdef'` |
| `name` | `Greenfield International Academy` | `Heritage Valley World School` |
| `subdomain` | `greenfield` (`greenfield.eduos.app`) | `heritage` (`heritage.eduos.app`) |
| `primary_color` | `#1E40AF` (Royal Blue) | `#7C2D12` (Imperial Maroon) |
| `secondary_color` | `#0D9488` (Teal) | `#D97706` (Amber Gold) |
| `tagline` | *Nurturing Excellence, Inspiring Innovation* | *Tradition of Wisdom, Vision for Tomorrow* |
| **Branches** | 1. `North Campus - Senior Wing` (Sector 14)<br>2. `City Junior Wing` (Civil Lines) | 1. `Main Heritage Estate` (Green Valley)<br>2. `East Campus Arts Wing` |

---

### 👥 2. User Accounts & Staff Roster
Generate separate staff accounts for each school:

#### **School 1: Greenfield Staff (`@greenfield.edu.in`)**
- `admin@greenfield.edu.in` (Super Admin)
- `principal.sharma@greenfield.edu.in` (Dr. Sunita Sharma — Principal)
- `amit.verma@greenfield.edu.in` (Senior PGT Physics)
- `sunita.rao@greenfield.edu.in` (Mathematics HOD)
- `rajesh.gupta@greenfield.edu.in` (Chemistry Faculty)
- `neha.kapoor@greenfield.edu.in` (Biology Faculty)
- `vikram.mehta@greenfield.edu.in` (English Faculty)
- `priya.singh@greenfield.edu.in` (Computer Science)
- `finance@greenfield.edu.in`, `hr@greenfield.edu.in`, `transport@greenfield.edu.in`, `librarian@greenfield.edu.in`

#### **School 2: Heritage Valley Staff (`@heritage.edu.in`)**
- `admin@heritage.edu.in` (Super Admin)
- `principal.menon@heritage.edu.in` (Dr. K. R. Menon — Principal)
- `arundhati.roy@heritage.edu.in` (English Literature HOD)
- `sanjay.singhania@heritage.edu.in` (Economics & Commerce)
- `anand.kumar@heritage.edu.in` (Mathematics Faculty)
- `meenakshi.sundaram@heritage.edu.in` (History & Civics)
- `kavita.deshmukh@heritage.edu.in` (Commercial Applications / CS)
- `finance@heritage.edu.in`, `hr@heritage.edu.in`, `transport@heritage.edu.in`, `librarian@heritage.edu.in`

---

### 📚 3. Batches, Subjects & Timetable

#### **School 1 (Greenfield — CBSE & Science Focus)**
- **Batches**:
  - `Class 10 - Section A` (`10-A-2026`, Mentor: Amit Verma, 30 students)
  - `Class 10 - Section B` (`10-B-2026`, 30 students)
  - `Class 11 - Science (PCM/PCB)` (`11-SCI-2026`, 25 students)
  - `Class 9 - Section A` (`9-A-2026`, 30 students)
- **Subjects**: Mathematics (`MATH-10`), Physics (`PHY-10`), Chemistry (`CHEM-10`), Biology (`BIO-10`), English (`ENG-10`), Computer Science (`CS-10`).
- **Timetables**: 20 periods/week (Periods 1 to 5, Mon to Fri).

#### **School 2 (Heritage — ICSE & Commerce/Humanities Focus)**
- **Batches**:
  - `Grade 10 - ICSE Emerald` (`10-ICSE-A`, Mentor: Arundhati Roy, 25 students)
  - `Grade 10 - ICSE Sapphire` (`10-ICSE-B`, 25 students)
  - `Grade 11 - Commerce & Economics` (`11-COMM-2026`, 20 students)
  - `Grade 9 - ICSE Foundation` (`9-ICSE-2026`, 25 students)
- **Subjects**: English Literature (`LIT-10`), Commercial Studies (`COMM-10`), Economics (`ECON-10`), Mathematics (`MATH-ICSE`), History & Civics (`HIST-10`), Computer Applications (`CA-10`).
- **Timetables**: 20 periods/week (Periods 1 to 5, Mon to Fri).

---

### 🎓 4. Students & Linked Parent Accounts

- **School 1**: 20–25 Students with roll numbers `1` to `25`, admission numbers `GIA2026001` to `GIA2026025`, DOBs, linked to parent accounts (`rajesh.sharma@gmail.com`, `anita.patel@gmail.com`, etc.).
- **School 2**: 20–25 Students with roll numbers `1` to `25`, admission numbers `HVWS2026001` to `HVWS2026025`, linked to parent accounts (`vikram.singhania@gmail.com`, `geeta.iyer@gmail.com`, etc.).

---

### 📋 5. Attendance Records
- **School 1**: 150+ attendance records for Class 10-A across last 20 school days (92% Present, 5% Absent, 3% Late).
- **School 2**: 150+ attendance records for Grade 10 ICSE Emerald across last 20 school days (95% Present, 3% Absent, 2% Late).

---

### 📝 6. Exams, Marks & Assignments

#### **School 1 (Greenfield)**:
- **Exams**: `CBSE Mid-Term Exam 2026` (Max 100) & `Unit Test 1` (Max 50).
- **Exam Results**: 40+ scored results with grades `A1`, `A2`, `B1` and teacher remarks.
- **Assignments**: *"Ray Optics Problem Set"*, *"Quadratic Equations Worksheet"*.
- **Submissions**: 10 submissions graded with marks awarded and feedback.

#### **School 2 (Heritage)**:
- **Exams**: `ICSE Term 1 Examination 2026` (Max 100) & `Economics Practical Assessment` (Max 50).
- **Exam Results**: 40+ scored results with grades `A1`, `A2`, `B1`.
- **Assignments**: *"Macroeconomics Case Study: Inflation & GDP"*, *"Shakespeare Merchant of Venice Critical Analysis"*.
- **Submissions**: 10 submissions graded with marks awarded.

---

### 💰 7. Finance, Billing & Double-Entry Ledger

#### **School 1 (Greenfield)**:
- **Chart of Accounts**: `1001` HDFC Operating Bank, `4001` Tuition Revenue, `4002` Transport Fees, `5001` Faculty Salaries.
- **Fee Structure**: Class 10 CBSE Standard (₹68,000/year — ₹17,000/quarter).
- **Invoices**: 25 invoices (`INV-GIA-2026-Q1-001` to `025`) with mixed `paid` (UPI/Netbanking) and `unpaid` statuses.
- **Journal Entries**: Balanced GL entries matching fee collections.

#### **School 2 (Heritage)**:
- **Chart of Accounts**: `1001` ICICI Bank Main, `4001` Academic Tuition Fee, `4002` Boarding & Dining, `5001` Staff Compensation.
- **Fee Structure**: Grade 10 ICSE Premium (₹96,000/year — ₹24,000/quarter).
- **Invoices**: 25 invoices (`INV-HVWS-2026-Q1-001` to `025`) with `paid` and `unpaid` statuses.
- **Journal Entries**: Balanced double-entry records.

---

### 🚌 8. Transport, Library & Campus Assets

#### **School 1 (Greenfield)**:
- **Bus & Route**: `DL-01-AB-1234` | Route 12 (North Campus Express) with 4 GPS stops (`Sector 14` ➔ `Civil Lines` ➔ `Campus`).
- **Library**: *HC Verma Physics*, *RD Sharma Math*, *NCERT Science* with 5 active student loans.
- **Inventory**: Optical Microscopes, Dell Workstations, Fire Extinguishers.

#### **School 2 (Heritage)**:
- **Bus & Route**: `DL-01-EF-9012` | Route 05 (Heritage Valley Shuttle) with 4 GPS stops (`Green Valley Gate` ➔ `City Center` ➔ `Campus`).
- **Library**: *Frank ICSE Economics*, *Total English ICSE*, *Oxford World Atlas* with 5 active loans.
- **Inventory**: Apple iMac Design Lab, Smart Interactive Panels, Safety Equipment.

---

### 🛡️ 9. Compliance, Parent Portal & Admissions CRM

- **Compliance Certificates**:
  - School 1: `Delhi Fire Service NOC`, `CBSE Affiliation Renewal (2025-2028)`.
  - School 2: `CISCE Board Affiliation NOC`, `National Building Safety Stability Certificate`.
- **SMC Minutes**: Quarterly committee resolutions for both schools.
- **Consent Slips**:
  - School 1: *"National Science Centre Excursion 2026"*.
  - School 2: *"Model United Nations (MUN) Conference Trip"*.
- **PTM Bookings**: 4 scheduled parent-teacher meeting slots per school.
- **Admissions CRM**: 4 leads & applications per school in various stages.
- **Alumni**: 2 alumni profiles and ₹50,000 donations (80G tax receipt) per school.

---

## 3. Ready-to-Copy Prompt for Claude

```text
You are an expert PostgreSQL Database Engineer for EduOS.

Using the complete schema specification above, generate a single, comprehensive, copy-paste-ready SQL seed script ('seed_demo_2_schools.sql') for TWO DISTINCT SCHOOL TENANTS:

1. School 1: '247afd96-506e-494c-a603-510b44316919' (Greenfield International Academy — CBSE Day School)
2. School 2: '3b8d9c12-789a-4123-bcde-567890abcdef' (Heritage Valley World School — ICSE International Academy)

### Strict Requirements:
1. Wrap everything in a single transaction (BEGIN; ... COMMIT;).
2. Use deterministic UUIDs (e.g. 'a0000000-0000-0000-0000-000000000001' for School 1, 'b0000000-0000-0000-0000-000000000001' for School 2) so all Foreign Key relationships link with 100% precision.
3. Completely isolate data between the two tenants:
   - School 1 user profiles (@greenfield.edu.in), batches, students, attendance, exams, and invoices MUST have tenant_id = '247afd96-506e-494c-a603-510b44316919'.
   - School 2 user profiles (@heritage.edu.in), batches, students, attendance, exams, and invoices MUST have tenant_id = '3b8d9c12-789a-4123-bcde-567890abcdef'.
4. Ensure double-entry journal entries balance (Debit = Credit) in chart_of_accounts for each tenant.
5. Use ON CONFLICT DO NOTHING to make the script idempotent and re-runnable.
```
