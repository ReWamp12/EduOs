---
description: Strict policy requiring all components, views, and services to load and mutate data exclusively from live Supabase PostgreSQL.
globs: frontend/src/**/*
---

# Supabase-First Live Data Policy

> [!IMPORTANT]
> **NO HARDCODED MOCK/DUMMY DATA IN ANY VIEW OR COMPONENT.**
> All application pages, dashboards, overview cards, registers, forms, and admin panels must query and persist directly to the live Supabase PostgreSQL database.

## Core Rules

1. **Direct Database Queries via `dataService` or `authClient`**:
   - Every dashboard and overview page (e.g. `AdminOverview`, `FinanceWorkspace`, `TenantManager`, `BrandingStudio`, `SettingsView`, `TeacherOverview`, `StudentOverview`, `ParentOverview`) must load live records from Supabase tables (`tenants`, `branches`, `batches`, `subjects`, `students`, `teachers`, `user_profiles`, `fee_invoices`, `assignments`, `attendances`, `journal_entries`).
   - If a table is empty (0 rows), render a clean dynamic empty state (e.g., `0 Active Records - Ready for live input`), NOT fake placeholder numbers like "12 tenants" or "8,420 students".

2. **No Fallbacks to Fake Mock Arrays**:
   - Do not fall back to static fixtures like `Modern Public School`, `Greenwood World School`, or `Target Medical Academy`.
   - The actual live institutions in Supabase are:
     1. **Greenfield International Academy (CBSE)** — `greenfield.eduos.app`
     2. **Heritage Valley World School (ICSE)** — `heritage.eduos.app`

3. **Live State Updates**:
   - Whenever an action is performed (e.g. collecting a fee, marking attendance, creating an assignment, updating branding, provisioning a tenant), it must execute the corresponding SQL mutation or RPC call against Supabase and re-fetch from the database.

4. **Multi-Tenancy Awareness**:
   - Super Admin views must dynamically fetch all active tenants from `tenants` and allow tenant-specific filtering or consolidated aggregation.
   - School staff views must filter strictly by `session.tenantId`.
