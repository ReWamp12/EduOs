/**
 * EduOS RAG — structure-aware chunker for extracted textbook pages.
 *
 * Input:  [{ page: 1, text: '...' }, ...]  (one entry per PDF page)
 * Output: [{ text, page, index }, ...]
 *
 * Design constraints:
 *  - The embedder truncates at ~EMBED_MAX_CHARS (900), so a chunk larger than
 *    that is silently half-invisible to retrieval. Target well under it.
 *  - Never split mid-sentence; prefer paragraph boundaries.
 *  - One-sentence overlap between adjacent chunks so an answer that straddles
 *    a boundary is still retrievable from at least one side.
 *  - Carry the page number where each chunk STARTS, for real citations.
 */

'use strict';

const TARGET_CHARS = 750;   // aim
const MAX_CHARS = 880;      // hard cap (embedder truncates at 900)
const MIN_CHARS = 120;      // drop fragments smaller than this (page furniture)
const OVERLAP_SENTENCES = 1;

/**
 * Remove per-page furniture that repeats across a book:
 * running heads ("MATHEMATICS", "REAL NUMBERS 5"), bare page numbers, and the
 * NCERT reprint watermark. Detection is frequency-based: any short line whose
 * normalised form appears on >=30% of pages is furniture, not content.
 */
function stripPageFurniture(pages) {
  const freq = new Map();
  const norm = (l) => l.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim().toLowerCase();

  for (const p of pages) {
    const seen = new Set();
    for (const line of p.text.split('\n')) {
      const n = norm(line);
      if (n.length > 0 && n.length <= 40 && !seen.has(n)) {
        seen.add(n);
        freq.set(n, (freq.get(n) || 0) + 1);
      }
    }
  }
  const threshold = pages.length <= 4 ? 2 : Math.max(3, Math.ceil(pages.length * 0.3));
  const furniture = new Set([...freq.entries()].filter(([, c]) => c >= threshold).map(([k]) => k));

  return pages.map((p) => ({
    page: p.page,
    text: p.text
      .split('\n')
      .filter((line) => {
        const t = line.trim();
        if (t === '') return true; // keep paragraph breaks
        if (/^\d{1,3}$/.test(t)) return false;                 // bare page number
        if (/rationalised\s*20\d\d[-–]\d\d/i.test(t)) return false; // NCERT watermark
        if (/^reprint\s*20\d\d/i.test(t)) return false;
        return !furniture.has(norm(line));
      })
      .join('\n'),
  }));
}

/**
 * Collapse the "faux-bold" duplication artifact. NCERT renders many section
 * headings by drawing the same glyphs 4-5 times at ~0.4px offsets to fake a
 * bold/embossed weight. Text extraction concatenates every copy, producing
 * runs like "2.2 WHA2.2 WHA2.2 WHA2.2 WHAT DO ALL ACIDS...COMMON?COMMON?".
 * Collapsing consecutive repeats (3+ occurrences) restores the real heading
 * and is a no-op on normal prose and math (verified: 0 chars changed on a
 * sampled maths page). Operates per line — `.` never matches `\n` here.
 */
function collapseRepeats(text) {
  return text
    .replace(/(.{2,40}?)\1{2,}/g, '$1')                        // no-separator: COMMON?COMMON?COMMON? -> COMMON?
    .replace(/\b(\w[\w .,?()-]{1,60}?)(?: \1\b){2,}/g, '$1');  // space-separated repeated phrase
}

/** Repair artifacts of PDF text extraction inside one page. */
function cleanPageText(text) {
  return collapseRepeats(text)
    .replace(/([a-z])-\n([a-z])/g, '$1$2')  // de-hyphenate across line breaks
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Sentence split that survives textbook notation: avoids breaking on
 * "Fig. 1.2", "i.e.", "e.g.", decimals ("3.14"), and numbered lists ("1. ").
 * Devanagari danda (।) is a sentence end for Hindi text.
 */
function splitSentences(paragraph) {
  const guarded = paragraph
    .replace(/\b(Fig|Eq|No|Dr|Mr|Mrs|Ms|Prof|St|etc|viz|approx|Ex)\.\s/gi, '$1<DOT> ')
    .replace(/\b(i\.e|e\.g)\./gi, (m) => m.replace(/\./g, '<DOT>'))
    .replace(/(\d)\.(\d)/g, '$1<DOT>$2');

  const parts = guarded
    .split(/(?<=[.!?।])\s+(?=[A-Z0-9("'\u0900-\u097F\u0A80-\u0AFF])/u)
    .map((s) => s.replace(/<DOT>/g, '.').trim())
    .filter((s) => s.length > 0);

  return parts.length > 0 ? parts : [paragraph.trim()];
}

/**
 * Pack sentences into chunks of ~TARGET_CHARS with sentence overlap.
 * `units` is [{ sentence, page }]. A single sentence longer than MAX_CHARS
 * (garbled math extraction can produce these) is hard-wrapped on word bounds.
 */
function packSentences(units) {
  const chunks = [];
  let buf = [];
  let bufLen = 0;

  const flush = () => {
    if (bufLen === 0) return;
    const text = buf.map((u) => u.sentence).join(' ').trim();
    if (text.length >= MIN_CHARS) {
      chunks.push({ text, page: buf[0].page });
    }
    const tail = buf.slice(-OVERLAP_SENTENCES);
    buf = tail.map((u) => ({ ...u }));
    bufLen = buf.reduce((s, u) => s + u.sentence.length + 1, 0);
  };

  for (const unit of units) {
    let { sentence } = unit;
    if (sentence.length > MAX_CHARS) {
      // hard-wrap oversized "sentences" on word boundaries
      const words = sentence.split(' ');
      let piece = '';
      for (const w of words) {
        if (piece.length + w.length + 1 > MAX_CHARS) {
          if (bufLen > 0) flush();
          if (piece.length >= MIN_CHARS) chunks.push({ text: piece.trim(), page: unit.page });
          piece = '';
          buf = []; bufLen = 0;
        }
        piece += (piece ? ' ' : '') + w;
      }
      sentence = piece; // remainder continues as a normal sentence
      if (sentence.length === 0) continue;
    }

    if (bufLen + sentence.length + 1 > TARGET_CHARS && bufLen > 0) flush();
    buf.push({ sentence, page: unit.page });
    bufLen += sentence.length + 1;
  }

  // final flush without seeding overlap
  if (bufLen > 0) {
    const text = buf.map((u) => u.sentence).join(' ').trim();
    if (text.length >= MIN_CHARS) chunks.push({ text, page: buf[0].page });
  }

  return chunks.map((c, index) => ({ ...c, index }));
}

/** Main entry: pages -> chunks. */
function chunkPages(rawPages) {
  const pages = stripPageFurniture(rawPages).map((p) => ({ page: p.page, text: cleanPageText(p.text) }));

  const units = [];
  for (const p of pages) {
    for (const para of p.text.split(/\n\s*\n/)) {
      const flat = para.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
      if (flat.length === 0) continue;
      for (const sentence of splitSentences(flat)) {
        units.push({ sentence, page: p.page });
      }
    }
  }
  return packSentences(units);
}

module.exports = { chunkPages, stripPageFurniture, cleanPageText, splitSentences, TARGET_CHARS, MAX_CHARS, MIN_CHARS };
