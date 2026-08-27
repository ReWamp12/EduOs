-- ============================================================================
-- EduOS Vector Function: match_rag_chunks()
-- Cosine similarity vector search over embedded curriculum & policy documents
-- ============================================================================

CREATE OR REPLACE FUNCTION public.match_rag_chunks(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.65,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    content TEXT,
    similarity FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT
        rc.id,
        rc.document_id,
        rc.content,
        1 - (rc.embedding <=> query_embedding) AS similarity,
        rc.metadata
    FROM public.rag_chunks rc
    WHERE 1 - (rc.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;
