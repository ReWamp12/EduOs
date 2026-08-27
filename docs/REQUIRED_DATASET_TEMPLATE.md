# EduOS — Institutional Dataset Onboarding Template
## Real Data Specification & Import Templates (Excluding RAG)

Use this document to prepare and fill in your school/institute data before production deployment. You can provide this data as **CSV files, Excel sheets, or fill directly into this markdown document**.

---

## 📌 Data Preparation Checklist

- [ ] **Section 1**: Institution & Campus Branding (`tenants`, `branches`)
- [ ] **Section 2**: Leadership, Teachers & Staff (`user_profiles`, `teachers`, `employee_records`)
- [ ] **Section 3**: Academic Batches & Subjects (`batches`, `subjects`, `timetables`)
- [ ] **Section 4**: Student Roster & Parent Contacts (`students`, `user_profiles`)
- [ ] **Section 5**: Fee Structures & Invoicing (`fee_structures`, `chart_of_accounts`)
- [ ] **Section 6**: Statutory Compliance Registers (`compliance_documents`, `smc_minutes`, `udise_records`)
- [ ] **Section 7**: Transport & Fleet Routes (`transport_vehicles`, `transport_routes`)
- [ ] **Section 8**: Facilities & Library (`library_books`, `inventory_assets`)

---

## Section 1: Institution & Campus Profile

### Table: `tenants` (Main School Organization)
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `name` | Text | **YES** | `Modern Public School` | Official registered institution name |
| `subdomain` | Text | **YES** | `mps` | Subdomain for login (`mps.eduos.app`) |
| `custom_domain` | Text | Optional | `portal.mps.edu.in` | Custom CNAME domain (if any) |
| `institution_type` | Text | **YES** | `school` | `school` \| `coaching` \| `college` \| `university` |
| `primary_color` | Text | **YES** | `#2563EB` | Primary brand color hex code |
| `secondary_color` | Text | **YES** | `#0D9488` | Secondary brand color hex code |
| `accent_color` | Text | **YES** | `#F59E0B` | Accent color hex code |
| `tagline` | Text | Optional | `Empowering Future Leaders` | Display tagline |
| `logo_url` | Text | Optional | `https://mps.edu.in/logo.png` | Public logo URL or file name |

### Table: `branches` (Campuses / Wings)
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `name` | Text | **YES** | `North Campus Main Wing` | Branch / Campus name |
| `code` | Text | **YES** | `NC-01` | Short branch code |
| `address` | Text | **YES** | `Plot 12, Sector 14` | Street address |
| `city` | Text | **YES** | `New Delhi` | City |
| `state` | Text | **YES** | `Delhi` | State |
| `pincode` | Text | **YES** | `110001` | Postal code |

---

## Section 2: Leadership, Teachers & Staff

### Table: `user_profiles` & `teachers` (Staff & Faculty Accounts)
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `first_name` | Text | **YES** | `Amit` | First name |
| `last_name` | Text | **YES** | `Verma` | Last name |
| `email` | Text | **YES** | `amit.verma@mps.edu.in` | Login email address |
| `phone` | Text | **YES** | `+91-9810111099` | Mobile phone number |
| `role` | Text | **YES** | `teacher` | `principal` \| `teacher` \| `hr_manager` \| `finance` \| `super_admin` \| `librarian` \| `transport_manager` |
| `employee_code` | Text | **YES** | `EMP-TCH-001` | Institutional employee ID |
| `designation` | Text | **YES** | `Senior PGT Faculty` | Official designation |
| `specialization` | Text | **YES** | `Physics` | Primary subject / department |
| `qualification` | Text | **YES** | `M.Sc. Physics, B.Ed.` | Educational qualifications |
| `joining_date` | Date | **YES** | `2021-06-15` | Date of joining (`YYYY-MM-DD`) |
| `police_verification_status` | Text | **YES** | `verified` | `verified` \| `pending` \| `missing` |

---

## Section 3: Academic Batches & Subjects

### Table: `batches` (Class Sections & Batches)
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `name` | Text | **YES** | `Class 10 - A` | Batch / Class name |
| `code` | Text | **YES** | `10-A-2026` | Short code |
| `grade_level` | Text | **YES** | `10` | Grade level (`1` to `12`) |
| `target_exam` | Text | **YES** | `CBSE` | `CBSE` \| `ICSE` \| `State Board` \| `JEE` \| `NEET` |
| `room_number` | Text | Optional | `Room 204` | Assigned classroom |
| `capacity` | Integer | Optional | `40` | Maximum student capacity |

### Table: `subjects` (Academic Subjects)
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `name` | Text | **YES** | `Physics` | Subject display name |
| `code` | Text | **YES** | `PHY-10` | Unique subject code |
| `color` | Text | **YES** | `#3B82F6` | Subject badge color |
| `icon_name` | Text | Optional | `Atom` | Lucide icon name |

### Table: `timetables` (Weekly Class Schedule)
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `batch_code` | Text | **YES** | `10-A-2026` | Matching batch code |
| `subject_code` | Text | **YES** | `PHY-10` | Matching subject code |
| `teacher_email` | Text | **YES** | `amit.verma@mps.edu.in` | Assigned faculty email |
| `day_of_week` | Integer | **YES** | `1` | `1` (Mon) to `6` (Sat) |
| `period_number` | Integer | **YES** | `1` | Period index (`1` to `8`) |
| `start_time` | Time | **YES** | `08:30:00` | Start time (`HH:MM:SS`) |
| `end_time` | Time | **YES** | `09:15:00` | End time (`HH:MM:SS`) |
| `room_number` | Text | Optional | `Room 204` | Classroom / Lab |

---

## Section 4: Student Roster & Parent Contacts

### Table: `students` & Associated Parent Logins
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `first_name` | Text | **YES** | `Aarav` | Student first name |
| `last_name` | Text | **YES** | `Sharma` | Student last name |
| `email` | Text | **YES** | `aarav.sharma@mps.edu.in` | Student login email |
| `roll_number` | Text | **YES** | `1` | Roll number in class |
| `admission_number` | Text | **YES** | `MPS2026001` | Official admission number |
| `batch_code` | Text | **YES** | `10-A-2026` | Target batch code |
| `dob` | Date | **YES** | `2011-03-15` | Date of birth (`YYYY-MM-DD`) |
| `gender` | Text | **YES** | `male` | `male` \| `female` \| `other` |
| `blood_group` | Text | Optional | `O+` | Blood group |
| `parent_first_name`| Text | **YES** | `Rajesh` | Parent / Guardian first name |
| `parent_last_name` | Text | **YES** | `Sharma` | Parent / Guardian last name |
| `parent_email` | Text | **YES** | `rajesh.sharma@gmail.com`| Parent portal login email |
| `parent_phone` | Text | **YES** | `+91-9810111001` | Parent WhatsApp/SMS mobile |

---

## Section 5: Fee Structures & Financial Ledger

### Table: `fee_structures` (Annual & Installment Blueprints)
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `name` | Text | **YES** | `Class 10 CBSE Standard Fee 2026-27` | Fee plan name |
| `grade_level` | Text | **YES** | `10` | Target grade |
| `academic_year` | Text | **YES** | `2026-2027` | Academic year |
| `total_amount` | Numeric | **YES** | `68000.00` | Total annual fee (₹) |
| `payment_schedule` | Text | **YES** | `quarterly` | `annual` \| `quarterly` \| `monthly` |
| `breakdown` | JSON/Text | **YES** | `Tuition: 45000, Lab: 12000, Activity: 11000` | Fee heads breakdown |

---

## Section 6: Statutory Compliance Documents & Committees

### Table: `compliance_documents` (Inspection Certificates Vault)
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `category` | Text | **YES** | `fire_safety` | `fire_safety` \| `building_safety` \| `board_affiliation` \| `state_recognition` \| `water_sanitation` \| `transport_fitness` |
| `title` | Text | **YES** | `Fire Department No Objection Certificate (NOC)` | Certificate title |
| `issuing_authority`| Text | **YES** | `Delhi Fire Service, Govt of NCT` | Issuing authority |
| `document_number` | Text | **YES** | `DFS/MS/2025/HQ/9941` | Official registration / NOC number |
| `issue_date` | Date | **YES** | `2025-04-10` | Issue date (`YYYY-MM-DD`) |
| `expiry_date` | Date | **YES** | `2027-04-09` | Expiry date (`YYYY-MM-DD`) |
| `status` | Text | **YES** | `valid` | `valid` \| `expiring_soon` \| `expired` |

### Table: `smc_minutes` (School Management Committee)
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `meeting_date` | Date | **YES** | `2026-07-15` | Date of meeting |
| `meeting_type` | Text | **YES** | `Ordinary Quarterly Meeting` | Meeting classification |
| `agenda` | Text | **YES** | `Q2 Infrastructure review, POCSO safety compliance, Parent feedback` | Meeting agenda |
| `resolutions` | Text | **YES** | `1. Approved installation of 8 new CCTV cameras in corridors. 2. Approved science lab modernization budget.` | Final committee resolutions |

### Table: `udise_records` (Annual UDISE+ Return)
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `academic_year` | Text | **YES** | `2026-2027` | Academic year |
| `udise_code` | Text | **YES** | `07010203045` | 11-digit national UDISE code |
| `total_students` | Integer | **YES** | `850` | Total enrolled headcount |
| `total_teachers` | Integer | **YES** | `42` | Total teaching staff |
| `total_classrooms`| Integer | **YES** | `32` | Total active classrooms |
| `submission_status`| Text | **YES** | `submitted_to_ministry` | `draft` \| `verified_by_principal` \| `submitted_to_ministry` |

---

## Section 7: Transport & Fleet Routes

### Table: `transport_vehicles` & `transport_routes`
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `vehicle_number` | Text | **YES** | `DL-01-AB-1234` | RTO vehicle registration number |
| `capacity` | Integer | **YES** | `42` | Seating capacity |
| `driver_name` | Text | **YES** | `Ram Singh` | Driver full name |
| `driver_phone` | Text | **YES** | `+91-9876500001` | Driver mobile number |
| `attendant_name`| Text | Optional | `Sunita Devi` | Route female attendant name |
| `route_number` | Text | **YES** | `Route 12` | Route identifier |
| `route_name` | Text | **YES** | `North Campus Express` | Route description |
| `start_time` | Time | **YES** | `07:15:00` | Morning pickup start time |
| `current_stop` | Text | **YES** | `Sector 14 Main Gate` | Current stop / Landmark |
| `next_stop` | Text | **YES** | `Civil Lines Intersection`| Next upcoming stop |

---

## Section 8: Campus Facilities & Library

### Table: `inventory_assets` (Fixed Assets & Lab Equipment)
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `asset_tag` | Text | **YES** | `AST-LAB-001` | Unique barcode / asset tag |
| `name` | Text | **YES** | `Compound Optical Microscope Set (x10)` | Item description |
| `category` | Text | **YES** | `Laboratory` | `Laboratory` \| `IT & Computers` \| `Furniture` \| `Safety Equipment` \| `Sports` |
| `location` | Text | **YES** | `Physics Lab Room 204` | Physical room / building |
| `purchase_cost`| Numeric | **YES** | `75000.00` | Purchase cost (₹) |
| `purchase_date`| Date | **YES** | `2024-06-15` | Purchase date |
| `status` | Text | **YES** | `operational` | `operational` \| `under_repair` \| `disposed` |

### Table: `library_books` (Library Catalog)
| Field Name | Type | Required? | Example Value | Description |
|---|---|:---:|---|---|
| `isbn` | Text | Optional | `978-0131103627` | ISBN barcode number |
| `title` | Text | **YES** | `Concepts of Physics (Vol 1 & 2)` | Book title |
| `author` | Text | **YES** | `Dr. H.C. Verma` | Author name |
| `category` | Text | **YES** | `Science` | `Science` \| `Mathematics` \| `Literature` \| `History` \| `Reference` |
| `publisher` | Text | Optional | `Bharti Bhawan` | Publisher name |
| `total_copies` | Integer | **YES** | `15` | Total inventory count |
| `available_copies`| Integer | **YES** | `12` | Currently available on shelf |
| `shelf_location` | Text | Optional | `Rack P-04` | Physical shelf coordinate |

---

## 🚀 Next Step: How to Submit Your Data

You can:
1. **Fill directly into a spreadsheet / CSV** for each section (e.g. `students.csv`, `teachers.csv`, `batches.csv`).
2. **Or paste raw text / tables into chat**.

Once received, the automated database ingestion script will load your dataset directly into the live Supabase PostgreSQL database, auto-generate user login credentials, and configure tenant branding for production deployment.
