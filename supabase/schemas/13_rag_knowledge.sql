-- ============================================================================
-- EduOS Schema: AI RAG Knowledge Base & Embeddings Repository
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE IF NOT EXISTS public.rag_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    grade_level TEXT,
    subject TEXT,
    source_url TEXT,
    total_documents INT DEFAULT 0,
    total_chunks INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rag_resource_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES public.rag_resources(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES public.rag_resources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    file_path TEXT,
    file_url TEXT,
    total_pages INT DEFAULT 1,
    content_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rag_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.rag_documents(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES public.rag_resources(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    token_count INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
