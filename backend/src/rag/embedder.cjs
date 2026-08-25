/**
 * EduOS RAG — single source of truth for text embeddings.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The previous implementation hashed words into random buckets with MD5 and
 * called the result a "384-d vector". That has no semantic content at all:
 * "how do plants make food" and "photosynthesis" shared zero buckets, so
 * cosine similarity was ~0 and retrieval was noise.
 *
 * Worse, that hash function was COPY-PASTED into both the ingest pipeline and
 * the query endpoint. Two copies of an embedding function is a latent disaster:
 * the moment one drifts, indexed vectors and query vectors live in different
 * spaces and retrieval silently returns garbage with no error.
 *
 * So: exactly one module computes embeddings, and both ingest and query
 * import it. Do not inline an embedding function anywhere else.
 *
 * Model: Xenova/paraphrase-multilingual-MiniLM-L12-v2 — 384 dims (matches the
 * pgvector column and the HNSW index unchanged), runs locally via ONNX, no API
 * key, no per-call cost.
 *
 * WHY MULTILINGUAL: EduOS serves CBSE (English + Hindi), ICSE (English) and
 * GSEB (Gujarati, Hindi, Sanskrit, English). Measured against the English-only
 * all-MiniLM-L6-v2 on the same probe set:
 *
 *                          en-only      multilingual
 *   English margin          0.409          0.422
 *   Hindi margin            0.157          0.413
 *   EN query -> HI doc     -0.000          0.423
 *   EN query -> GU doc     -0.026          0.483
 *
 * The English-only model scores ~0 across scripts, i.e. a student typing
 * "what is photosynthesis" could NEVER retrieve the Hindi or Gujarati chapter.
 * The multilingual model matches it on English and additionally makes
 * cross-lingual retrieval work.
 *
 * IMPORTANT — token window: trained at ~128 word-piece tokens and capped at
 * 512. Devanagari and Gujarati tokenise less efficiently than Latin script, so
 * keep chunks at or under EMBED_MAX_CHARS. Text past the window is truncated
 * and simply does not influence the vector. Use neighbour expansion at query
 * time to hand the LLM more context than was embedded.
 */

'use strict';

const path = require('path');

const MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const EMBED_DIMS = 384;
// Conservative for Devanagari/Gujarati, which tokenise into more word-pieces
// per character than Latin script. Beyond this the tail is truncated.
const EMBED_MAX_CHARS = 900;

let _pipelinePromise = null;

/** Lazily construct the feature-extraction pipeline exactly once per process. */
async function getPipeline() {
  if (_pipelinePromise) return _pipelinePromise;

  _pipelinePromise = (async () => {
    // @xenova/transformers v2 is ESM-only, so it must be loaded dynamically
    // even though this module is CommonJS.
    const { pipeline, env } = await import('@xenova/transformers');

    // Pin the cache next to the backend so scripts and the Nest process share
    // one copy of the weights instead of re-downloading per working directory.
    const cacheDir = path.join(__dirname, '..', '..', '.model-cache');
    env.cacheDir = cacheDir;
    env.localModelPath = cacheDir;
    env.allowRemoteModels = true;

    return pipeline('feature-extraction', MODEL_ID, { quantized: true });
  })();

  return _pipelinePromise;
}

/**
 * Normalise text before embedding.
 *
 * Critically this strips the "[CBSE Class 10 Science - TEXTBOOK]" style prefix
 * that the old pipeline baked into every chunk_text. That boilerplate was
 * identical across thousands of chunks, so it pulled every vector toward a
 * common centroid and destroyed what little discrimination remained. Board and
 * subject belong in metadata columns and WHERE clauses, not in the embedded text.
 */
function normaliseForEmbedding(text) {
  if (!text) return '';
  return String(text)
    .replace(/^\s*\[[^\]]{0,120}\]\s*/, '') // leading [BOARD Class 10 SUBJECT - CATEGORY]
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, EMBED_MAX_CHARS);
}

/** Embed a single string -> plain number[] of length 384, L2-normalised. */
async function embed(text) {
  const [vec] = await embedBatch([text]);
  return vec;
}

/**
 * Embed many strings. Batched to bound peak memory on large ingests.
 * Returns number[][] aligned with the input order.
 */
async function embedBatch(texts, options = {}) {
  const batchSize = options.batchSize || 32;
  const onProgress = options.onProgress;
  const extractor = await getPipeline();

  const out = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize).map(normaliseForEmbedding);

    // Empty strings would produce NaN vectors; substitute a harmless token.
    const safe = slice.map((s) => (s.length > 0 ? s : 'empty'));

    const result = await extractor(safe, { pooling: 'mean', normalize: true });

    // transformers.js returns one flat tensor of shape [n, 384].
    const flat = result.data;
    for (let r = 0; r < safe.length; r++) {
      out.push(Array.from(flat.slice(r * EMBED_DIMS, (r + 1) * EMBED_DIMS)));
    }

    if (onProgress) onProgress(Math.min(i + batchSize, texts.length), texts.length);
  }
  return out;
}

/** Format a vector as a pgvector literal: "[0.01,-0.02,...]". */
function toPgVector(vec) {
  if (!Array.isArray(vec) || vec.length !== EMBED_DIMS) {
    throw new Error(`Expected ${EMBED_DIMS}-d vector, got ${Array.isArray(vec) ? vec.length : typeof vec}`);
  }
  return `[${vec.map((v) => v.toFixed(6)).join(',')}]`;
}

/** Cosine similarity. Inputs are already L2-normalised, so this is a dot product. */
function cosine(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

module.exports = {
  MODEL_ID,
  EMBED_DIMS,
  EMBED_MAX_CHARS,
  embed,
  embedBatch,
  toPgVector,
  cosine,
  normaliseForEmbedding,
  getPipeline,
};
