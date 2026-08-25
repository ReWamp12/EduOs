import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { SupabaseService } from '../supabase.service';

// The embedder is shared verbatim with the ingest pipeline
// (scripts/rag-ingest-ncert.cjs) so query vectors and indexed vectors can
// never drift into different spaces. Never inline an embedding function here.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const embedder = require('./embedder.cjs') as {
  embed(text: string): Promise<number[]>;
  toPgVector(vec: number[]): string;
  MODEL_ID: string;
};

export interface RagCitation {
  source: string;
  page?: number;
  url: string;
  tier: string;
  license?: string;
}

export interface RagAnswer {
  query: string;
  mode: 'grounded_llm' | 'extractive' | 'no_context';
  count: number;
  synthesized_answer: string;
  key_formulae_or_terms: string[];
  citations: RagCitation[];
  results: RagChunkHit[];
}

export interface RagChunkHit {
  id: string;
  document_id: string | null;
  chunk_text: string;
  chunk_index: number | null;
  chapter_no: number | null;
  chapter_title: string | null;
  page_number: number | null;
  board: string;
  subject: string;
  category: string;
  language: string;
  book_title: string | null;
  source_url: string | null;
  publisher: string | null;
  license: string | null;
  source_tier: string | null;
  vector_sim: number;
  lexical_rank: number;
  rrf_score: number;
}

// Below this cosine similarity the best hit is unrelated to the question and
// the honest answer is "not in the knowledge base", never a hallucination.
const MIN_VECTOR_SIM = 0.32;

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private groq: Groq | null = null;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {
    const key = this.configService.get<string>('GROQ_API_KEY');
    if (key && key.trim() && !key.includes('placeholder')) {
      this.groq = new Groq({ apiKey: key.trim() });
      this.logger.log('Groq LLM enabled for RAG answer synthesis.');
    } else {
      this.logger.warn('GROQ_API_KEY not set — RAG runs in extractive mode (textbook excerpts + citations, no LLM synthesis).');
    }
  }

  // -------------------------------------------------------------------------
  // Retrieval
  // -------------------------------------------------------------------------
  async search(
    query: string,
    opts: { board?: string; subject?: string; category?: string; language?: string; limit?: number } = {},
  ): Promise<RagChunkHit[]> {
    if (!this.supabaseService.isConfigured()) return [];

    const vec = await embedder.embed(query);
    const client = this.supabaseService.getClient();

    const { data, error } = await client.rpc('match_rag_hybrid', {
      query_embedding: embedder.toPgVector(vec),
      query_text: query,
      match_count: Math.min(Math.max(opts.limit ?? 8, 1), 25),
      filter_board: opts.board || null,
      filter_subject: opts.subject || null,
      filter_category: opts.category || null,
      filter_language: opts.language || null,
    });

    if (error) {
      this.logger.error(`match_rag_hybrid failed: ${error.message}`);
      return [];
    }
    return (data ?? []) as RagChunkHit[];
  }

  /**
   * Expand top hits into contiguous windows (hit ± 1 chunk of the same
   * document, in reading order) so the LLM sees continuous textbook prose
   * rather than isolated fragments.
   */
  private async buildContext(hits: RagChunkHit[]): Promise<string> {
    const docHits = hits.filter((h) => h.document_id && h.chunk_index !== null).slice(0, 5);
    let windows: Array<{ document_id: string; chunk_index: number; chunk_text: string; page_number: number | null }> = [];

    if (docHits.length > 0) {
      const client = this.supabaseService.getClient();
      const { data, error } = await client.rpc('rag_fetch_windows', {
        doc_ids: docHits.map((h) => h.document_id),
        centers: docHits.map((h) => h.chunk_index),
        span: 1,
      });
      if (!error && data) windows = data;
      else if (error) this.logger.warn(`rag_fetch_windows failed: ${error.message}`);
    }

    const byDoc = new Map<string, RagChunkHit>();
    for (const h of docHits) if (!byDoc.has(h.document_id!)) byDoc.set(h.document_id!, h);

    const sections: string[] = [];
    let si = 1;

    if (windows.length > 0) {
      const grouped = new Map<string, typeof windows>();
      for (const w of windows) {
        if (!grouped.has(w.document_id)) grouped.set(w.document_id, []);
        grouped.get(w.document_id)!.push(w);
      }
      for (const [docId, ws] of grouped) {
        const meta = byDoc.get(docId);
        const label = meta
          ? `${meta.book_title ?? meta.subject}, Ch. ${meta.chapter_no ?? '?'} "${meta.chapter_title ?? ''}", p. ${meta.page_number ?? '?'}`
          : 'Source';
        const text = ws
          .sort((a, b) => a.chunk_index - b.chunk_index)
          .map((w) => w.chunk_text)
          .join('\n');
        sections.push(`[Source ${si}: ${label}]\n${text}`);
        si++;
      }
    }

    // Hits without document linkage (or if window fetch failed) fall back to
    // their own chunk text.
    for (const h of hits) {
      if (h.document_id && windows.some((w) => w.document_id === h.document_id)) continue;
      sections.push(`[Source ${si}: ${h.book_title ?? h.subject}, p. ${h.page_number ?? '?'}]\n${h.chunk_text}`);
      si++;
      if (si > 7) break;
    }

    return sections.join('\n\n');
  }

  private buildCitations(hits: RagChunkHit[]): RagCitation[] {
    const seen = new Set<string>();
    const citations: RagCitation[] = [];
    for (const h of hits) {
      const url = h.source_url ?? 'https://ncert.nic.in';
      const key = `${url}#${h.chapter_no ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      citations.push({
        source: [h.book_title ?? `${h.board} Class 10 ${h.subject}`, h.chapter_title ? `Ch. ${h.chapter_no}: ${h.chapter_title}` : null]
          .filter(Boolean)
          .join(' — '),
        page: h.page_number ?? undefined,
        url,
        tier: h.source_tier ?? 'official',
        license: h.license ?? undefined,
      });
      if (citations.length >= 5) break;
    }
    return citations;
  }

  // -------------------------------------------------------------------------
  // Grounded answering
  // -------------------------------------------------------------------------
  async ask(
    query: string,
    opts: { board?: string; subject?: string; language?: string; limit?: number } = {},
  ): Promise<RagAnswer> {
    const hits = await this.search(query, { ...opts, limit: opts.limit ?? 8 });
    const confident = hits.length > 0 && hits[0].vector_sim >= MIN_VECTOR_SIM;

    if (!confident) {
      return {
        query,
        mode: 'no_context',
        count: hits.length,
        synthesized_answer:
          `I could not find this topic in the EduOS knowledge base (official Class 10 textbooks). ` +
          `Try rephrasing with textbook terminology, or pick a chapter from your subject. ` +
          `I answer only from verified curriculum sources, so I would rather say "not found" than guess.`,
        key_formulae_or_terms: [],
        citations: [],
        results: hits,
      };
    }

    const citations = this.buildCitations(hits);
    const context = await this.buildContext(hits);

    if (!this.groq) return this.extractiveAnswer(query, hits, citations);

    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 1400,
        messages: [
          {
            role: 'system',
            content:
              `You are the EduOS Class 10 tutor. Answer ONLY from the provided textbook context.\n` +
              `Rules:\n` +
              `1. Ground every claim in the context. If the context does not contain the answer, say exactly what is missing — never invent facts, numbers, or formulas.\n` +
              `2. Cite inline as [Source N] right after each claim or formula taken from source N.\n` +
              `3. Structure: ### heading, then a clear explanation built for a 15-year-old; use $...$ / $$...$$ LaTeX for math; end with one exam tip.\n` +
              `4. Quote at most 15-20 consecutive words from any source verbatim.\n` +
              `5. Finish with one line: KEY_TERMS: term 1 | term 2 | term 3 (3-4 items, each under 45 chars).`,
          },
          {
            role: 'user',
            content: `Question: ${query}\n\nTextbook context:\n${context}`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? '';
      if (!raw.trim()) return this.extractiveAnswer(query, hits, citations);

      // Parse and strip the KEY_TERMS trailer.
      let terms: string[] = [];
      const m = raw.match(/KEY_TERMS:\s*(.+)\s*$/im);
      if (m) {
        terms = m[1].split('|').map((t) => t.trim()).filter((t) => t.length > 0 && t.length < 60).slice(0, 4);
      }
      const answer = raw.replace(/KEY_TERMS:.*$/im, '').trim();

      return {
        query,
        mode: 'grounded_llm',
        count: hits.length,
        synthesized_answer: answer,
        key_formulae_or_terms: terms,
        citations,
        results: hits,
      };
    } catch (err) {
      this.logger.error(`Groq synthesis failed, serving extractive answer: ${(err as Error).message}`);
      return this.extractiveAnswer(query, hits, citations);
    }
  }

  /**
   * No-LLM fallback: the top textbook passages verbatim with their citations,
   * honestly labeled. Strictly better than a canned template because every
   * word on screen is real curriculum text.
   */
  private extractiveAnswer(query: string, hits: RagChunkHit[], citations: RagCitation[]): RagAnswer {
    const top = hits.slice(0, 3);
    const body = top
      .map((h, i) => {
        const src = `${h.book_title ?? `${h.board} ${h.subject}`}${h.chapter_title ? ` — Ch. ${h.chapter_no}: ${h.chapter_title}` : ''}, p. ${h.page_number ?? '?'}`;
        return `**Passage ${i + 1}** *(${src})*\n\n> ${h.chunk_text.replace(/\n/g, '\n> ')}`;
      })
      .join('\n\n');

    return {
      query,
      mode: 'extractive',
      count: hits.length,
      synthesized_answer:
        `### Textbook passages for “${query}”\n\n${body}\n\n` +
        `*(Direct excerpts from official textbooks — AI synthesis is disabled until a GROQ_API_KEY is configured on the server.)*`,
      key_formulae_or_terms: [],
      citations,
      results: hits,
    };
  }
}
