# EDUOS-106 — RAG Production Runbook

**Status as of 2026-08-24:** The production RAG pipeline is fully built and verified end-to-end.
The NCERT corpus ingest was started and deliberately paused — **4 of ~93 chapters are in the
database** (Science ch1–4, 289 real chunks). Resuming it is one command (§3). Everything else
(embeddings, retrieval, API, frontend, eval) is finished and working.

---

## 1. What was rebuilt and why

| Component | Before (prototype) | Now (production) |
|---|---|---|
| Embeddings | MD5 hash-buckets pretending to be vectors — zero semantic content, copy-pasted in 2 places | `paraphrase-multilingual-MiniLM-L12-v2` (384-d, local ONNX, free) in **one shared module** used by both ingest and query |
| Corpus | 27 hand-written paragraphs standing in for entire textbooks + scraped commercial-site text | Real NCERT chapter PDFs downloaded, extracted page-by-page, chunked structure-aware |
| `rag_documents` | 0 rows | One row per chapter with content-hash, page counts, license, canonical PDF URL |
| Dedup | `content_hash` NULL on every chunk (index inert) | SHA-256 per chunk + per chapter, `ON CONFLICT DO NOTHING` |
| Retrieval | `match_rag_chunks` fed hash vectors; RLS silently returned **0 rows** to the backend (anon key vs `TO authenticated` policy) | `match_rag_hybrid` (RRF vector+BM25, per-document diversity cap, SECURITY DEFINER) + `rag_fetch_windows` neighbour expansion |
| Generation | Hardcoded if/else answers for 6 topics (3 separate copies); Groq key exposed to browsers via `NEXT_PUBLIC_` + `dangerouslyAllowBrowser` | Server-side Groq in `RagService`; extractive textbook-passage mode without a key; honest `no_context` refusal below similarity 0.32 |
| Licensing | Full text scraped from vedantu/byjus/shaalaa/etc. | **Official sources only** (user decision). Commercial sites remain as pointer-only "further reading" links in `rag_resources` |
| Eval | none | `scripts/rag-eval.cjs` — 46-question golden set, recall@5 / recall@1 / MRR / refusal negatives |

**Verified working** (with the 4 ingested chapters): hybrid search returns real passages at
cosine 0.60–0.77 with true page numbers; `POST /api/rag/ask` serves extractive answers with real
citations (`jesc103.pdf p.18`); out-of-syllabus queries ("poker strategy" → sim 0.07) correctly
refuse. Cross-lingual retrieval measured: EN query → HI/GU document scores 0.42–0.48 (was 0.00).

---

## 2. Architecture (the contract that must not break)

```
INGEST (scripts/rag-ingest-ncert.cjs)          QUERY (src/rag/rag.service.ts)
  download PDF (ranged resume)                    POST /api/rag/ask | GET /api/rag/search
  extract pages (pdfjs, y-coord lines)               |
  chunk (src/rag/chunker.cjs)                        |
      |                                              |
      +----------> src/rag/embedder.cjs <------------+   ← THE ONLY EMBEDDER
      |            (multilingual MiniLM, 384-d)      |
      v                                              v
  rag_documents + rag_chunks  ───────────  match_rag_hybrid (RRF, SECURITY DEFINER)
                                           rag_fetch_windows (neighbour context)
                                                     |
                                           Groq synthesis (server-side)
                                           or extractive fallback
                                           or no_context refusal (sim < 0.32)
```

Rules:
- **Never add a second embedding implementation.** Both sides import `src/rag/embedder.cjs`. The
  previous system died precisely because ingest and query each had their own copy.
- **Chunks store pure text.** Board/subject/chapter live in columns. The chapter title is prepended
  only at embedding time. (The old `[CBSE Class 10 X - CATEGORY]` prefixes poisoned every vector.)
- `MIN_VECTOR_SIM = 0.32` lives in `src/rag/rag.service.ts` and `scripts/rag-eval.cjs` — change both together.

---

## 3. TO DO NEXT — complete the corpus ingest (~60–90 min, unattended)

The ingest is **resumable**: finished chapters are skipped via content-hash, partial PDF downloads
continue from the last byte (the NCERT server stalls large transfers; the downloader does ranged
resume with a 30s idle timeout, 12 retries — this is why it works; don't "simplify" it).

```bash
cd backend
node scripts/rag-ingest-ncert.cjs
```

Leave it running. It prints one line per chapter (`ch5 + 71 chunks / 18p — Life Processes`) and a
coverage table at the end. Expected final corpus: **~90 chapters / roughly 4,500–6,500 chunks**
across Science, Maths, Geography, Economics, History, Civics, First Flight, Footprints, and the
three Hindi readers.

Useful variants:

```bash
node scripts/rag-ingest-ncert.cjs --books jesc1,jemh1   # subset
node scripts/rag-ingest-ncert.cjs --force               # re-ingest even if unchanged
node scripts/rag-ingest-ncert.cjs --inspect jess1       # preview page 1, no DB writes
```

If a chapter line says `FAIL download failed after 12 attempts` — the NCERT server was down for
that file; just re-run the same command later, everything done is skipped.

PDFs cache in `backend/.rag-cache/pdf/` (gitignored, ~250 MB when complete).

### 3b. Then run the eval — this is the acceptance gate

```bash
cd backend
node scripts/rag-eval.cjs            # add --verbose to see per-question ranks
```

46 golden questions (incl. paraphrases with no keyword overlap, Hindi, and 3 out-of-syllabus
negatives). Healthy targets with the full corpus: **recall@5 ≥ 85%**, **recall@1 ≥ 60%**,
**negatives 3/3** below the refusal threshold. If a subject underperforms, its failures print with
what was retrieved instead — that tells you whether it's a chunking, embedding, or coverage issue.

### 3c. Enable LLM synthesis (optional but recommended)

Get a free key at console.groq.com → put it in `backend/.env`:

```
GROQ_API_KEY=gsk_...
```

Restart the backend. Without the key the tutor serves verbatim textbook passages with citations
(honest, but not pedagogical). With it: grounded synthesis with inline `[Source N]` citations and
a `KEY_TERMS:` trailer parsed into the UI chips. The key never reaches the browser — `groq-sdk`
was removed from the frontend entirely.

---

## 4. Running the stack

```bash
# backend  (port 4000)
cd backend && npm run build && node dist/main.js       # or: npm run start:dev

# frontend (port 3000)
cd frontend && npm run dev
```

Endpoints:
- `GET  /api/rag/search?q=...&board=&subject=&limit=` → raw hybrid hits
- `POST /api/rag/ask` `{query, board?, subject?, language?}` → `{mode, synthesized_answer, key_formulae_or_terms, citations, results}`
  where `mode` ∈ `grounded_llm | extractive | no_context`
- `GET  /api/rag/resources` → the pointer-only "further reading" directory (unchanged)

**Boot note:** TypeORM `synchronize` is now **false** (app.module.ts). It was attempting
destructive column rebuilds against the live Supabase schema at every boot (`job_openings.title`,
`employee_records.employee_code`) and crashing the server. Schema changes now belong in
`supabase/migrations/*.sql`, which is already the project's pattern.

---

## 5. Roadmap after the corpus lands (in priority order)

1. **GSEB + CISCE official documents.** The ingest registry (`BOOKS` array in
   `rag-ingest-ncert.cjs`) accepts any PDF URL. Add GSSTB Gujarati-medium textbooks
   (gsstb.gujarat.gov.in) and CISCE specimen papers (cisce.org). Watch out: many GSSTB PDFs are
   *scanned images* → they will extract ~0 chars and need OCR (tesseract with `guj` traineddata)
   — the pipeline currently throws `no chunks extracted` on those, which is the correct failure.
2. **CBSE previous-year papers + marking schemes** (cbseacademic.nic.in — official, so within the
   licensing decision). New `category: 'prev_year_paper'` documents; the schema already supports it.
3. **Answer streaming.** `/rag/ask` returns one shot; the frontend fakes token reveal. Real SSE
   from the backend (Groq supports streaming) would cut perceived latency.
4. **Reranker.** If eval shows near-miss ranking (right chapter at rank 4–5), add a cross-encoder
   rerank of the top-30 pool (e.g. `Xenova/ms-marco-MiniLM-L-6-v2`) before the diversity cap.
5. **Heading-path extraction.** `rag_chunks.heading_path` exists but is NULL — populating it from
   section numbers ("1.2 Balanced Equations") would sharpen both citations and lexical rank.
6. **Sanskrit (GSEB/CBSE)** and NCERT Exemplar books — same registry mechanism.
7. **Telemetry.** Log `(query, top rrf_score, mode)` per request to find corpus gaps from real
   student usage; the `no_context` rate per subject is the metric that matters.

---

## 6. File inventory

**New:**
- `backend/src/rag/embedder.cjs` — the single shared embedder (+ pgvector formatting, cosine)
- `backend/src/rag/chunker.cjs` — furniture stripping, sentence packing ~750 chars, 1-sentence overlap, page provenance
- `backend/src/rag/rag.service.ts` — retrieval + windows + Groq/extractive/refusal
- `backend/scripts/rag-ingest-ncert.cjs` — resumable NCERT ingest (registry of 11 books / ~93 chapters)
- `backend/scripts/rag-purge-legacy.cjs` — the one-time legacy purge (already executed; dry-run by default)
- `backend/scripts/rag-eval.cjs` — golden-set retrieval eval
- `supabase/migrations/EDUOS-106-rag-retrieval-fix.sql` — SECURITY DEFINER fns, diversity cap, drops prototype fn (**applied to live DB**)
- `frontend/src/lib/tutorTypes.ts` — shared response contract

**Deleted** (all were hash-embedding era / canned-answer era):
- `frontend/src/lib/ragTutorEngine.ts`, `frontend/src/lib/groqTutor.ts`
- `backend/scripts/rag-deep-pipeline.js`, `rag-full-pipeline.js`, `rag-bulk-scraper.js`,
  `restore-official-tier.js`, `test-query.js`, `test-search-step4.js`, `verify-rag-ticket2.js`,
  `rag-schema-upgrade.js`, `execute-quarantine-step2.js`, `fix-constraint.js`
- `backend/_audit-rag.js`, `_migrate.js`, `_test-embed.mjs`, stray JSON reports

**Modified:**
- `backend/src/app.controller.ts` — RAG endpoints now delegate to `RagService`; hash-embedding code and the canned `synthesizeRagResponse` removed
- `backend/src/app.module.ts` — `RagService` registered; `synchronize: false`
- `backend/src/entities/job-opening.entity.ts` — column types aligned to live DB (text)
- `backend/nest-cli.json` / `tsconfig.build.json` — `.cjs` assets copied to dist; `scripts/` excluded from build
- `frontend/src/lib/dataService.ts` — tutor calls go to `POST /api/rag/ask`; lexical `textSearch` fallback replaces the first-word `ilike`
- `frontend/package.json` — `groq-sdk` removed from the browser bundle
- `.gitignore` — `backend/.model-cache/`, `backend/.rag-cache/`
- `backend/.env` — `GROQ_API_KEY=` slot added (empty)

**Database actions already performed on live Supabase:**
- Purged all 2,361 legacy chunks (hash vectors, hand-written summaries, commercial full text)
- 147 third-party resources flipped to `fetch_status='pointer_only'`
- EDUOS-106 migration applied; prototype `match_rag_chunks` dropped
- `job_openings` NULL titles: none found (6/6 rows already titled — the boot crash was type drift, fixed in code)

**Data reality check (before → target):** 2,361 fake chunks → 289 real chunks now → ~5,000+ real
chunks after `node scripts/rag-ingest-ncert.cjs` finishes.

---

## 7. Open items outside RAG scope (flagged, not done)

- ~21 legacy scripts in `backend/scripts/` still hardcode the live DB password (`ReWamp@2026`).
  They are untracked (never committed), but rotate the password and move them to dotenv — a task
  chip was raised for this. `live-db-audit.js` is already converted and is the pattern to copy.
- `backend/src/app.controller.spec.ts` is the stale Nest scaffold test (asserts a `getHello()`
  that no longer exists) — separate task chip raised.
