-- ============================================================================
-- EduOS Schema: Transport Fleet, Library Catalog & Asset Inventory
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transport_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    vehicle_number TEXT NOT NULL,
    capacity INT NOT NULL DEFAULT 42,
    driver_name TEXT NOT NULL,
    driver_phone TEXT NOT NULL,
    attendant_name TEXT,
    attendant_phone TEXT,
    gps_device_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    fitness_expiry_date DATE,
    insurance_expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL,
    UNIQUE(tenant_id, vehicle_number)
);

CREATE TABLE IF NOT EXISTS public.transport_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
    route_number TEXT NOT NULL,
    route_name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    eta_minutes INT DEFAULT 15,
    speed_kmh NUMERIC(5,2) DEFAULT 32.0,
    current_stop TEXT,
    next_stop TEXT,
    status TEXT DEFAULT 'on_route' CHECK (status IN ('not_started', 'on_route', 'completed', 'delayed')),
    stops JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL,
    UNIQUE(tenant_id, route_number)
);

CREATE TABLE IF NOT EXISTS public.library_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    isbn TEXT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    publisher TEXT,
    total_copies INT DEFAULT 1 NOT NULL,
    available_copies INT DEFAULT 1 NOT NULL,
    shelf_location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.library_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    borrowed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    due_date DATE NOT NULL,
    returned_at TIMESTAMPTZ,
    fine_amount NUMERIC(6,2) DEFAULT 0.00,
    status TEXT DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue', 'lost')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    asset_tag TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_cost NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'under_repair', 'disposed')),
    next_inspection_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    version INT DEFAULT 1 NOT NULL,
    UNIQUE(tenant_id, asset_tag)
);

CREATE TABLE IF NOT EXISTS public.procurement_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    estimated_amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'ordered', 'received')),
    approval_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
