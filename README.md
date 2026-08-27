# EduOS - Core Multi-Tenant Platform Foundation (Phase 1)

EduOS is a high-fidelity, White-Label Multi-Tenant SaaS platform designed for educational institutions (schools, colleges, and coaching institutes). This codebase satisfies **Phase 1 (Platform Foundation)** of the master design specification.

---

## 📂 Project Directory Structure

```
EduOs/ (root)
├── frontend/             # Next.js 14 Web Frontend (Port 3000)
│   ├── src/
│   │   ├── app/          # Dashboard page routing
│   │   ├── components/   # Stakeholder dashboards (Student, Parent, Admin, etc.)
│   │   └── lib/          # API fetchers (dataService) & Supabase config
│   └── package.json
│
├── backend/              # NestJS API Backend (Port 4000)
│   ├── src/
│   │   ├── entities/     # TypeORM entity definitions (auto-sync)
│   │   ├── app.module.ts # Core module (wiring Config & TypeORM)
│   │   ├── main.ts       # Server bootstraper (global API path, CORS)
│   │   └── mockData.ts   # Offline sandbox datasets
│   └── package.json
│
├── supabase/             # Database Setup & RLS Config
│   └── schema.sql        # Database tables & kernel Row-Level Security rules
│
└── architecture_decision_record.md  # Architectural designs log
```

---

## ⚙️ Setup and Installation

### 1. Database Provisioning (Supabase)
1. Create a new project on **[Supabase](https://supabase.com)**.
2. In your Supabase left sidebar, click **SQL Editor** $\to$ **New Query**.
3. Paste the contents of **[`supabase/schema.sql`](supabase/schema.sql)** and click **Run**.

### 2. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Copy `.env` from template and fill in your Supabase DB password:
   ```bash
   DB_HOST=db.your-project-id.supabase.co
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your-database-password
   DB_NAME=postgres
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-publishable-api-key
   ```
3. Start the NestJS server:
   ```bash
   npm run start:dev
   ```

### 3. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Create `.env.local` and add your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-api-key
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

---

## 🛠️ Phase 1 Features Implemented (Per Specifications)

1. **Multi-Tenancy Isolation (RLS)**: Enforced via SQL Row-Level Security filters using `app.current_tenant_id` context.
2. **Super Admin Developer Dashboard**:
   * **Tenant Manager**: Dynamic tenant creation, custom subdomain mapping.
   * **Branding Studio**: Interactive primary, secondary, and accent color theme editor. Saves styles to the database.
   * **Feature Matrix**: Toggle individual feature modules (LMS, Fees, Bus, PTM) per tenant in real time.
3. **Mock Fallback Sandbox**: Seamless offline capability. If Supabase is unconfigured, the app falls back to local data structure streams instead of crashing.
4. **NestJS Standalone API**: Relays client-side queries, enabling loose frontend/backend separation.
5. **TypeORM Auto-Sync**: Automatically updates Supabase tables when Entity schemas change in code.
