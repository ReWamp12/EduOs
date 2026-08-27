# Architecture Decision Record (ADR) - EduOS Platform Foundation

This document details the architectural decisions and technology choices made during Phase 1 of the EduOS project, in alignment with the master specification blueprints (`part1-architecture-rbac.md`).

---

## 1. Multi-Tenancy Architecture (Shared-Database with RLS)

### Decision
We selected a **single shared database with PostgreSQL Row-Level Security (RLS)** as the core multi-tenancy isolation strategy, rather than a separate-database or separate-schema-per-tenant pattern.

### Rationale
* **Operational Simplicity**: A single database structure reduces infrastructure overhead, making backups, indexing updates, and schema migrations unified and simple to execute.
* **Security Isolation**: PostgreSQL Row-Level Security (RLS) filters all queries at the database kernel level based on the context variable `app.current_tenant_id`. This prevents cross-tenant data leaks even in the event of application-level bugs.
* **Cost Efficiency**: Running multiple small institutions under a single database container matches the "SaaS for micro-institutes" model.

---

## 2. Full-Stack Separation (Next.js & NestJS Dual-Scaffold)

### Decision
We separated the project into two distinct directories:
1. **[`frontend/`](file:///c:/Users/hhars/OneDrive/Desktop/EduOs/frontend)**: Next.js (React/TypeScript) Web Dashboard running on Port `3000`.
2. **[`backend/`](file:///c:/Users/hhars/OneDrive/Desktop/EduOs/backend)**: NestJS (Node.js/TypeScript) API server running on Port `4000`.

### Rationale
* **Scalability**: Decoupling the user interface from the API server allows independent horizontal scaling, caching strategies, and isolated deployment pipelines.
* **Alignment with Specifications**: Directly fulfills the technical requirements in `part1-architecture-rbac.md` §5.
* **Clean Code Separation**: Keeps client-side state, UI components, and Next.js page routing separated from NestJS modules, controllers, and TypeORM entities.

---

## 3. Database Layer & Schema Auto-Synchronization

### Decision
We implemented a dual-mode database access strategy:
1. **TypeORM (direct PostgreSQL connection)** inside NestJS to support automated entity synchronization (`synchronize: true`) during local development and testing.
2. **Supabase Client SDK** for client-side authentication, real-time subscriptions, and data retrieval behind RLS filters.

### Rationale
* **Development Velocity**: TypeORM entity files act as a single source of truth for tables. Changes in code are instantly propagated to Supabase, eliminating manual migrations.
* **Resilient Offline Sandbox Fallback**: If no live Supabase keys are provided, the API controllers automatically fall back to high-fidelity local mock data structures, allowing developers to test the full stack with zero setup.
