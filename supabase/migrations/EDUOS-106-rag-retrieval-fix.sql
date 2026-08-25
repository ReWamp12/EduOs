-- ============================================================================
-- EDUOS-106 : RAG retrieval fixes (follows EDUOS-105)
-- ----------------------------------------------------------------------------
-- 1. SECURITY DEFINER on the retrieval RPC.
--    EDUOS-105 enabled RLS with SELECT granted TO authenticated only, but the
--    NestJS backend talks to Supabase with the *anon* key. match_rag_hybrid
--    was SECURITY INVOKER, so every backend search silently returned 0 rows.
--    The function is the sanctioned read path over public reference data, so
--    it runs as definer with a pinned search_path.
--
-- 2. Per-document diversity cap. Pure RRF ordering can fill all K slots with
--    adjacent chunks of one chapter; cap at 4 chunks per document so a second
--    relevant source can surface.
--
-- 3. Drop the prototype match_rag_chunks (hash-embedding era; nothing calls
--    it after the EDUOS-106 controller).
--
-- Idempotent: safe to re-run.
-- ============================================================================

DROP FUNCTION IF EXISTS public.match_rag_chunks(vector, double precision, int, text, text, text);
DROP FUNCTION IF EXISTS public.match_rag_chunks(vector, float, int, text, text, text);

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
  chunk_index    INT,
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
SECURITY DEFINER
SET search_path = public
AS $fn$
WITH
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
),
ranked AS (
  SELECT
    c.id, c.document_id, c.chunk_text, c.chunk_index, c.chapter_no, c.chapter_title,
    c.heading_path, c.page_number, c.board, c.subject, c.category, c.language,
    d.book_title,
    COALESCE(d.source_url, r.url)             AS source_url,
    COALESCE(d.publisher, r.author_publisher) AS publisher,
    COALESCE(d.license, r.license)            AS license,
    COALESCE(d.source_tier, r.source_tier)    AS source_tier,
    f.vector_sim, f.lexical_rank, f.rrf_score,
    -- diversity: rank of this chunk within its own document
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(c.document_id, c.resource_id)
      ORDER BY f.rrf_score DESC
    ) AS doc_rank
  FROM fused f
  JOIN public.rag_chunks c            ON c.id = f.id
  LEFT JOIN public.rag_documents d    ON d.id = c.document_id
  LEFT JOIN public.rag_resources r    ON r.id = c.resource_id
)
SELECT
  id, document_id, chunk_text, chunk_index, chapter_no, chapter_title,
  heading_path, page_number, board, subject, category, language,
  book_title, source_url, publisher, license, source_tier,
  vector_sim, lexical_rank, rrf_score
FROM ranked
WHERE doc_rank <= 4
ORDER BY rrf_score DESC
LIMIT match_count;
$fn$;

GRANT EXECUTE ON FUNCTION public.match_rag_hybrid(vector, text, int, text, text, text, text)
  TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- Neighbour window fetch: given a hit, pull the surrounding chunks of the same
-- document in reading order so the LLM sees continuous textbook context.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.rag_fetch_windows(uuid[], int[], int);

CREATE OR REPLACE FUNCTION public.rag_fetch_windows (
  doc_ids   UUID[],
  centers   INT[],
  span      INT DEFAULT 1
)
RETURNS TABLE (
  document_id UUID,
  chunk_index INT,
  chunk_text  TEXT,
  page_number INT
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT DISTINCT c.document_id, c.chunk_index, c.chunk_text, c.page_number
  FROM unnest(doc_ids, centers) AS t(doc_id, center)
  JOIN public.rag_chunks c
    ON c.document_id = t.doc_id
   AND c.chunk_index BETWEEN t.center - span AND t.center + span
  WHERE c.is_retrievable
  ORDER BY c.document_id, c.chunk_index;
$fn$;

GRANT EXECUTE ON FUNCTION public.rag_fetch_windows(uuid[], int[], int)
  TO anon, authenticated;
