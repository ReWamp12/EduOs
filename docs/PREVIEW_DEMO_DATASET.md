# EduOS 2-School Master Setup Dataset (Live on Supabase)

This document details the **Master Directory & Structural Setup** configured on the live Supabase PostgreSQL database. 

> [!NOTE]
> All transactional activity tables (`attendances`, `exams`, `exam_results`, `assignments`, `assignment_submissions`, `fee_invoices`, `consent_responses`, `ptm_bookings`, `library_loans`, `support_tickets`) are **completely clean (0 rows)** so you can perform live actions in the application UI (e.g. create assignments, submit homework, grade papers, mark attendance, record fee payments) and observe the real-time reflections in Supabase.

---

## 1. Multi-Tenant School Institutions

| # | School Name | Board | Subdomain | Primary Color | Branch Count |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Greenfield International Academy** | CBSE | `greenfield` | `#1E40AF` (Royal Blue) | 2 Branches |
| **2** | **Heritage Valley World School** | ICSE | `heritage` | `#7C2D12` (Mahogany) | 2 Branches |

---

## 2. Super Administrator

- **Role**: `super_admin`
- **Email**: `superadmin@eduos.app`
- **Name**: System SuperAdmin
- **Scope**: Cross-tenant multi-institution management

---

## 3. School 1: Greenfield International Academy (CBSE)

### Campuses / Branches
1. **North Campus - Senior Wing** (`a1000000-0000-0000-0000-000000000001`) — Main Campus (New Delhi)
2. **City Campus - Junior Wing** (`a1000000-0000-0000-0000-000000000002`) (New Delhi)

### Academic Batches & Subjects
- **Batches**:
  - `Class 10 - Section A` (Code: `10-A-2026`, Mentor: Amit Verma, Room: 204)
  - `Class 9 - Section A` (Code: `9-A-2026`, Mentor: Sunita Rao, Room: 102)
  - `Class 11 - Science` (Code: `11-SCI-2026`, Mentor: Rajesh Gupta, Room: Lab 301)
- **Subjects**: Mathematics (`MATH-10`), Physics (`PHY-10`), Chemistry (`CHEM-10`), Biology (`BIO-10`), Computer Science (`CS-10`)

### Staff & Leadership
- **Principal**: Sunita Sharma (`principal.sharma@greenfield.edu.in`)
- **Physics Faculty**: Amit Verma (`amit.verma@greenfield.edu.in`)
- **Mathematics HOD**: Sunita Rao (`sunita.rao@greenfield.edu.in`)
- **Chemistry Faculty**: Rajesh Gupta (`rajesh.gupta@greenfield.edu.in`)
- **Biology Faculty**: Neha Kapoor (`neha.kapoor@greenfield.edu.in`)
- **Computer Science Faculty**: Priya Singh (`priya.singh@greenfield.edu.in`)
- **Finance Officer**: Rohan Deshmukh (`finance@greenfield.edu.in`)
- **HR Manager**: Meenakshi Iyer (`hr@greenfield.edu.in`)
- **Transport Manager**: Ram Singh (`transport@greenfield.edu.in`)
- **Librarian**: Anand Joshi (`librarian@greenfield.edu.in`)

### Students & Parents Roster (Class 10-A)
1. **Aarav Sharma** (Roll 1, `GIA2026001`) — Parent: Rajesh Sharma (`rajesh.sharma@gmail.com`, `+91-9810111001`)
2. **Ananya Patel** (Roll 2, `GIA2026002`) — Parent: Dr. Harish Patel (`harish.patel@gmail.com`, `+91-9810111002`)
3. **Rohan Mehta** (Roll 3, `GIA2026003`) — Parent: Deepak Mehta (`deepak.mehta@gmail.com`, `+91-9810111003`)
4. **Diya Verma** (Roll 4, `GIA2026004`) — Parent: Sunita Verma (`sunita.verma@gmail.com`, `+91-9810111004`)
5. **Kabir Sen** (Roll 5, `GIA2026005`) — Parent: Sourav Sen (`sourav.sen@gmail.com`, `+91-9810111005`)
6. **Ishita Nair** (Roll 6, `GIA2026006`) — Parent: Suresh Nair (`suresh.nair@gmail.com`, `+91-9810111006`)
7. **Aditya Roy** (Roll 7, `GIA2026007`) — Parent: Vikram Roy (`vikram.roy@gmail.com`, `+91-9810111007`)
8. **Sanya Malhotra** (Roll 8, `GIA2026008`) — Parent: Ritu Malhotra (`ritu.malhotra@gmail.com`, `+91-9810111008`)

---

## 4. School 2: Heritage Valley World School (ICSE)

### Campuses / Branches
1. **Main Heritage Estate** (`b1000000-0000-0000-0000-000000000001`) — Main Campus (Dehradun)
2. **East Campus Arts Wing** (`b1000000-0000-0000-0000-000000000002`) (Dehradun)

### Academic Batches & Subjects
- **Batches**:
  - `Grade 10 - ICSE Emerald` (Code: `10-EMERALD`, Mentor: Arundhati Roy, Room: Hall A-1)
  - `Grade 9 - ICSE Sapphire` (Code: `9-SAPPHIRE`, Mentor: Sanjay Singhania, Room: Hall B-2)
  - `Grade 11 - Commerce` (Code: `11-COMM`, Mentor: Anand Kumar, Room: Seminar Room)
- **Subjects**: English Literature (`LIT-10`), Commercial Studies (`COMM-10`), Economics (`ECON-10`), Mathematics (`MATH-ICSE`), History & Civics (`HIST-10`)

### Staff & Leadership
- **Principal**: K. R. Menon (`principal.menon@heritage.edu.in`)
- **Literature HOD**: Arundhati Roy (`arundhati.roy@heritage.edu.in`)
- **Commercial Studies Faculty**: Sanjay Singhania (`sanjay.singhania@heritage.edu.in`)
- **Mathematics Faculty**: Anand Kumar (`anand.kumar@heritage.edu.in`)
- **History & Civics Faculty**: Meenakshi Sundaram (`meenakshi.s@heritage.edu.in`)
- **Computer Applications Faculty**: Kavita Deshmukh (`kavita.deshmukh@heritage.edu.in`)
- **Finance Officer**: Vikram Singhania (`finance@heritage.edu.in`)
- **HR Manager**: Shalini Bose (`hr@heritage.edu.in`)
- **Transport Manager**: Gurpreet Singh (`transport@heritage.edu.in`)
- **Librarian**: Father Thomas (`librarian@heritage.edu.in`)

### Students & Parents Roster (Grade 10 Emerald)
1. **Dev Singhania** (Roll 1, `HVWS2026001`) — Parent: Gautam Singhania (`gautam.singhania@gmail.com`, `+91-9820111001`)
2. **Tara Mukherjee** (Roll 2, `HVWS2026002`) — Parent: Anirban Mukherjee (`anirban.mukherjee@gmail.com`, `+91-9820111002`)
3. **Zayaan Merchant** (Roll 3, `HVWS2026003`) — Parent: Tariq Merchant (`tariq.merchant@gmail.com`, `+91-9820111003`)
4. **Avani Reddy** (Roll 4, `HVWS2026004`) — Parent: Dr. K. S. Reddy (`ks.reddy@gmail.com`, `+91-9820111004`)
5. **Neil D'Souza** (Roll 5, `HVWS2026005`) — Parent: Anthony D'Souza (`anthony.dsouza@gmail.com`, `+91-9820111005`)
6. **Kavya Kulkarni** (Roll 6, `HVWS2026006`) — Parent: Milind Kulkarni (`milind.kulkarni@gmail.com`, `+91-9820111006`)
7. **Samarjit Roy** (Roll 7, `HVWS2026007`) — Parent: Subir Roy (`subir.roy@gmail.com`, `+91-9820111007`)
8. **Nandini Agarwal** (Roll 8, `HVWS2026008`) — Parent: Rakesh Agarwal (`rakesh.agarwal@gmail.com`, `+91-9820111008`)

---

## 5. Summary of Live Supabase Tables

| Table Category | Tables Included | Live State |
| :--- | :--- | :--- |
| **Master Institutions** | `tenants`, `branches` | 2 Schools, 4 Campuses |
| **Master Academic** | `batches`, `subjects` | 6 Classes/Sections, 10 Subjects |
| **Master Identities** | `user_profiles`, `teachers`, `students` | 53 Users (10 Teachers, 16 Students, 16 Parents, Staff) |
| **Live Activity Tables** | `attendances`, `exams`, `exam_results`, `assignments`, `assignment_submissions`, `fee_invoices`, `consent_responses`, `ptm_bookings`, `library_loans`, `support_tickets`, `journal_entries` | **0 rows (Clean slate ready for live UI testing)** |
