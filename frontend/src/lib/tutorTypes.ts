/**
 * Response contract of the EduOS RAG tutor (backend POST /api/rag/ask).
 *
 * `mode` tells the UI how the answer was produced:
 *  - grounded_llm : LLM synthesis over retrieved textbook context
 *  - extractive   : verbatim textbook passages (server has no LLM key)
 *  - no_context   : nothing relevant found — honest refusal, no citations
 */

export interface TutorCitation {
  source: string;
  page?: number;
  url: string;
  tier: string;
  license?: string;
}

export interface TutorResponse {
  query?: string;
  mode?: 'grounded_llm' | 'extractive' | 'no_context';
  count?: number;
  synthesized_answer: string;
  key_formulae_or_terms: string[];
  citations: TutorCitation[];
  results?: unknown[];
}
