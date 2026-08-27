# EduOS — Master Prompt Index
## Full-Stack, Multi-Tenant, White-Label Education Operating System

This master prompt is split into 7 parts because of its scope. Feed them to your AI coding agent (Claude Code, Cursor, etc.) **in order**, either as one combined document or sequentially at the start of each build phase. Tell the agent to read all 7 before writing code, and to re-read the relevant part at the start of each phase.

| Part | File | Contents |
|---|---|---|
| 1 | `part1-architecture-rbac.md` | Vision, multi-tenancy engine, white-label engine, tech stack, full RBAC framework |
| 2 | `part2-stakeholder-modules.md` | Every human stakeholder module: Trustee, Principal, Teaching, Non-Teaching, Students, Parents, Alumni, HR/Hiring, Finance, Inventory, Marketing, Social Media, Admissions/CRM |
| 3 | `part3-academic-operations-modules.md` | Academic core (curriculum, timetable, exams, LMS, attendance), Transport, Hostel, Library, Events, Communication |
| 4 | `part4-government-compliance-module.md` | India-specific statutory/regulatory compliance engine — UDISE+, RTE Act, board affiliation bye-laws, POCSO, POSH, Anti-Ragging, safety audits, labour/tax compliance — built extensibly for other countries |
| 5 | `part5-future-ai-differentiators.md` | Features that don't widely exist yet — AI-native and next-generation capabilities |
| 6 | `part6-data-rbac-matrix-api.md` | Full data model, complete RBAC permission matrix (role × module × action), API/event/webhook catalog |
| 7 | `part7-buildplan-deliverables-appendix.md` | Phased build plan, QA/testing bar, deliverables, appendix of every mandatory register/document a real Indian school must maintain |

**Important disclaimer to carry into the build:** Part 4 reflects publicly available regulatory information as of research done in 2026 (UDISE+, CBSE Affiliation Bye-Laws 2018/2025/2026 updates, POCSO Act 2012, POSH Act 2013, RTE Act 2009, state-level safety orders). Rules vary by state/board and change over time. Build the compliance module as **configurable rule-sets per board/state**, not hardcoded logic — and put a visible disclaimer in the product that institutions must verify current requirements with their board/state education department or legal counsel. This is not legal advice.
