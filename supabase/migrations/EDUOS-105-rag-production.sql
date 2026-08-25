-- ============================================================================
-- EDUOS-105 : Production RAG knowledge base
-- ----------------------------------------------------------------------------
-- Upgrades the prototype RAG schema into a production retrieval layer:
--   1. rag_documents      - document hierarchy (board > subject > chapter)
--   2. rag_chunks         - real 384-d semantic vectors + full-text tsvector,
--                           SHA-256 dedup, chapter/page citation metadata
--   3. HNSW + GIN indexes - vector ANN and BM25-style lexical search
--   4. match_rag_hybrid   - Reciprocal Rank Fusion over vector + lexical
--
-- Idempotent: safe to re-run.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- 1. Document hierarchy
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rag_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board           TEXT NOT NULL,                       -- CBSE | ICSE | GSEB
  class           INT  NOT NULL DEFAULT 10,
  subject         TEXT NOT NULL,                       -- canonical: Mathematics, Science, ...
  book_code       TEXT NOT NULL,                       -- jemh1, jesc1, jess3 ...
  book_title      TEXT NOT NULL,                       -- "Mathematics", "First Flight"
  chapter_no      INT,
  chapter_title   TEXT,
  language        TEXT NOT NULL DEFAULT 'en',          -- en | hi | gu
  category        TEXT NOT NULL,                       -- textbook | prev_year_paper | ...
  source_tier     TEXT NOT NULL,                       -- official | cc_licensed_open | third_party_pointer
  source_url      TEXT NOT NULL,
  publisher       TEXT,
  license         TEXT,
  content_hash    TEXT NOT NULL,                       -- SHA-256 of extracted text
  page_count      INT,
  char_count      INT,
  ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rag_documents_unique_book_chapter UNIQUE (board, book_code, chapter_no, language)
);

CREATE UNIQUE INDEX IF NOT EXISTS rag_documents_hash_key
  ON public.rag_documents (content_hash);

CREATE INDEX IF NOT EXISTS rag_documents_lookup_idx
  ON public.rag_documents (board, subject, category);

-- ---------------------------------------------------------------------------
-- 2. Chunk table upgrade (additive - preserves existing rows)
-- ---------------------------------------------------------------------------
ALTER TABLE public.rag_chunks
  ADD COLUMN IF NOT EXISTS document_id   UUID REFERENCES public.rag_documents(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS chapter_no    INT,
  ADD COLUMN IF NOT EXISTS chapter_title TEXT,
  ADD COLUMN IF NOT EXISTS heading_path  TEXT,
  ADD COLUMN IF NOT EXISTS content_hash  TEXT,
  ADD COLUMN IF NOT EXISTS token_count   INT,
  ADD COLUMN IF NOT EXISTS language      TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS is_retrievable BOOLEAN NOT NULL DEFAULT TRUE;

-- resource_id was NOT NULL in the prototype; new NCERT chunks hang off
-- rag_documents instead, so relax it.
ALTER TABLE public.rag_chunks ALTER COLUMN resource_id DROP NOT NULL;

-- Generated lexical search column (English config; adequate for Hinglish queries too)
ALTER TABLE public.rag_chunks
  ADD COLUMN IF NOT EXISTS tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(chapter_title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(heading_path,  '')), 'B') ||
    setweight(to_tsvector('english', coalesce(chunk_text,    '')), 'C')
  ) STORED;

-- Dedup guard: identical text may not be stored twice.
CREATE UNIQUE INDEX IF NOT EXISTS rag_chunks_content_hash_key
  ON public.rag_chunks (content_hash) WHERE content_hash IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------
-- HNSW ANN index for cosine distance. m/ef_construction tuned for <1M rows.
CREATE INDEX IF NOT EXISTS rag_chunks_embedding_hnsw
  ON public.rag_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS rag_chunks_tsv_gin
  ON public.rag_chunks USING gin (tsv);

CREATE INDEX IF NOT EXISTS rag_chunks_filter_idx
  ON public.rag_chunks (board, subject, category) WHERE is_retrievable;

CREATE INDEX IF NOT EXISTS rag_chunks_document_idx
  ON public.rag_chunks (document_id, chunk_index);

-- ---------------------------------------------------------------------------
-- 4. Hybrid retrieval via Reciprocal Rank Fusion
-- ---------------------------------------------------------------------------
-- Pure vector search misses exact terms ("Shreedharacharya", "1 kWh", "Article 32").
-- Pure lexical search misses paraphrase. RRF fuses both ranked lists:
--     score = SUM over lists of  1 / (k + rank)
-- k=60 is the standard damping constant from the original RRF paper.
DROP FUNCTION IF EXISTS public.match_rag_hybrid(vector, text, int, text, text, text, text);

CREATE OR REPLACE FUNCTION public.match_rag_hybrid (
  query_embedding VECTOR(384),
  query_text      TEXT,
  match_count     INT  DEFAULT 12,
  filter_board    TEXT DEFAULT NULL,
  filter_subject  TEXT DEFAULT NULL,
  filter_category TEXT DEFAULT NULL,
  filter_language TEXT DEFAULT NULL
)
RETURNS TABLE (
  id             UUID,
  document_id    UUID,
  chunk_text     TEXT,
  chapter_no     INT,
  chapter_title  TEXT,
  heading_path   TEXT,
  page_number    INT,
  board          TEXT,
  subject        TEXT,
  category       TEXT,
  language       TEXT,
  book_title     TEXT,
  source_url     TEXT,
  publisher      TEXT,
  license        TEXT,
  source_tier    TEXT,
  vector_sim     FLOAT,
  lexical_rank   FLOAT,
  rrf_score      FLOAT
)
LANGUAGE sql STABLE
AS $fn$
WITH
-- Candidate pool: over-fetch 5x so fusion has material to work with.
params AS (
  SELECT GREATEST(match_count * 5, 60) AS pool
),
filtered AS (
  SELECT c.*
  FROM public.rag_chunks c
  WHERE c.is_retrievable
    AND c.embedding IS NOT NULL
    AND (filter_board    IS NULL OR LOWER(c.board)    = LOWER(filter_board))
    AND (filter_subject  IS NULL OR LOWER(c.subject)  = LOWER(filter_subject))
    AND (filter_category IS NULL OR LOWER(c.category) = LOWER(filter_category))
    AND (filter_language IS NULL OR LOWER(c.language) = LOWER(filter_language))
),
vec AS (
  SELECT f.id,
         1 - (f.embedding <=> query_embedding) AS sim,
         ROW_NUMBER() OVER (ORDER BY f.embedding <=> query_embedding) AS rnk
  FROM filtered f
  ORDER BY f.embedding <=> query_embedding
  LIMIT (SELECT pool FROM params)
),
lex AS (
  SELECT f.id,
         ts_rank_cd(f.tsv, websearch_to_tsquery('english', query_text)) AS rank,
         ROW_NUMBER() OVER (
           ORDER BY ts_rank_cd(f.tsv, websearch_to_tsquery('english', query_text)) DESC
         ) AS rnk
  FROM filtered f
  WHERE query_text IS NOT NULL
    AND length(trim(query_text)) > 0
    AND f.tsv @@ websearch_to_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT (SELECT pool FROM params)
),
fused AS (
  SELECT
    COALESCE(v.id, l.id)                     AS id,
    COALESCE(v.sim, 0)::FLOAT                AS vector_sim,
    COALESCE(l.rank, 0)::FLOAT               AS lexical_rank,
    (COALESCE(1.0 / (60 + v.rnk), 0) +
     COALESCE(1.0 / (60 + l.rnk), 0))::FLOAT AS rrf_score
  FROM vec v
  FULL OUTER JOIN lex l ON v.id = l.id
)
SELECT
  c.id,
  c.document_id,
  c.chunk_text,
  c.chapter_no,
  c.chapter_title,
  c.heading_path,
  c.page_number,
  c.board,
  c.subject,
  c.category,
  c.language,
  d.book_title,
  COALESCE(d.source_url, r.url)             AS source_url,
  COALESCE(d.publisher, r.author_publisher) AS publisher,
  COALESCE(d.license, r.license)            AS license,
  COALESCE(d.source_tier, r.source_tier)    AS source_tier,
  f.vector_sim,
  f.lexical_rank,
  f.rrf_score
FROM fused f
JOIN public.rag_chunks c            ON c.id = f.id
LEFT JOIN public.rag_documents d    ON d.id = c.document_id
LEFT JOIN public.rag_resources r    ON r.id = c.resource_id
ORDER BY f.rrf_score DESC
LIMIT match_count;
$fn$;

-- ---------------------------------------------------------------------------
-- 5. Coverage view - what the tutor actually knows
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.rag_coverage AS
SELECT d.board, d.subject, d.category, d.language,
       COUNT(DISTINCT d.id)  AS documents,
       COUNT(c.id)           AS chunks,
       SUM(d.char_count)     AS source_chars
FROM public.rag_documents d
LEFT JOIN public.rag_chunks c ON c.document_id = d.id
GROUP BY 1,2,3,4
ORDER BY chunks DESC;

-- ---------------------------------------------------------------------------
-- 6. RLS - knowledge base is read-only reference data for all signed-in users
-- ---------------------------------------------------------------------------
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_chunks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rag_documents_read ON public.rag_documents;
CREATE POLICY rag_documents_read ON public.rag_documents
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS rag_chunks_read ON public.rag_chunks;
CREATE POLICY rag_chunks_read ON public.rag_chunks
  FOR SELECT TO authenticated USING (is_retrievable);

DROP POLICY IF EXISTS rag_resources_read ON public.rag_resources;
CREATE POLICY rag_resources_read ON public.rag_resources
  FOR SELECT TO authenticated USING (true);
