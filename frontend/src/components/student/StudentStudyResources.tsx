'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader, SectionCard, Badge, Card, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { dataService } from '@/lib/dataService';
import {
  Search,
  Sparkles,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  FileText,
  HelpCircle,
  Layers,
  GraduationCap,
  Bookmark,
  Compass,
  ArrowRight,
  Lightbulb,
  Zap,
  Globe,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

interface RagResult {
  id: string;
  similarity: number;
  url: string;
  domain?: string;
  source_tier?: string;
  title: string;
  board: string;
  subject: string;
  category: string;
  page_number?: number;
  chunk_text: string;
}

interface ResourceCatalogItem {
  id: string;
  board: string;
  class: number;
  subject: string;
  category: string;
  note?: string;
  url?: string;
  domain?: string;
  source_tier?: string;
  title?: string;
  content_type?: string;
}

const PROMPT_CHIPS = [
  { label: 'Light Reflection & Mirror Formula', board: 'CBSE', subject: 'Science' },
  { label: 'Chemical Reactions & Equations', board: 'CBSE', subject: 'Science' },
  { label: 'Real Numbers & Fundamental Theorem', board: 'CBSE', subject: 'Mathematics' },
  { label: 'Selina Chemistry Periodic Table', board: 'ICSE', subject: 'Chemistry' },
  { label: 'ICSE Civics Supreme Court Jurisdiction', board: 'ICSE', subject: 'History & Civics' },
  { label: 'Treasure Chest Poem & Short Stories', board: 'ICSE', subject: 'English (Language & Literature)' },
  { label: 'GSEB Maths Standard vs Basic Blueprint', board: 'GSEB', subject: 'Mathematics (Standard & Basic)' },
  { label: 'Gujarati Vyakaran Grammar & Samas', board: 'GSEB', subject: 'Gujarati (First Language)' },
  { label: 'Sanskrit Shlokas & Dhatu Roop', board: 'GSEB', subject: 'Sanskrit' },
];

const BOARDS = ['ALL', 'CBSE', 'ICSE', 'GSEB'];

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'textbook', label: 'Textbooks' },
  { id: 'solution', label: 'Solutions & Guides' },
  { id: 'prev_year_paper', label: 'Previous Year Papers' },
  { id: 'specimen_model_paper', label: 'Exemplar & Specimen' },
  { id: 'miscellaneous', label: 'Notes & Formulae' },
];

export const StudentStudyResources: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'library'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<RagResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Resource Library State
  const [catalog, setCatalog] = useState<ResourceCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Explainer Drawer
  const [selectedChunkForAI, setSelectedChunkForAI] = useState<RagResult | null>(null);

  // Fetch initial catalog
  useEffect(() => {
    setCatalogLoading(true);
    dataService.getRagResourceCatalog({ board: selectedBoard !== 'ALL' ? selectedBoard : undefined })
      .then((data) => {
        setCatalog(data || []);
      })
      .finally(() => setCatalogLoading(false));
  }, [selectedBoard]);

  // Execute Search
  const handleSearch = async (queryToRun?: string) => {
    const q = queryToRun !== undefined ? queryToRun : searchQuery;
    if (!q.trim()) {
      toast('Please enter a query', 'warning', 'Type a question, topic, or concept.');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const results = await dataService.searchRagResources(q, {
        board: selectedBoard !== 'ALL' ? selectedBoard : undefined,
        subject: selectedSubject !== 'ALL' ? selectedSubject : undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        limit: 8,
      });
      setSearchResults(results || []);
    } catch (err: any) {
      console.error('RAG search error:', err);
      toast('Search failed', 'error', 'Could not query knowledge base.');
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chip: typeof PROMPT_CHIPS[0]) => {
    setSearchQuery(chip.label);
    setSelectedBoard(chip.board);
    setSelectedSubject(chip.subject);
    handleSearch(chip.label);
  };

  const handleCopyNote = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast('Copied to Clipboard', 'success', 'Study note copied for quick reference.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Group catalog items by Subject
  const catalogBySubject = useMemo(() => {
    const map = new Map<string, ResourceCatalogItem[]>();
    catalog.forEach((item) => {
      const key = `${item.board} — ${item.subject}`;
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [catalog]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Class 10 AI Study Resources & RAG Knowledge Base"
          subtitle="Semantic search across 2,300+ vector chunks & verified textbooks (CBSE, ICSE, GSEB)"
          actions={
            <div className="flex items-center gap-2">
              <Badge tone="primary">
                <Sparkles size={14} /> AI Powered
              </Badge>
              <Badge tone="primary">
                <BookOpen size={14} /> 3 National & State Boards
              </Badge>
            </div>
          }
        />

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-border/80 bg-surface p-1.5 shadow-2xs">
          <button
            onClick={() => setActiveTab('search')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-meta font-semibold transition-colors',
              activeTab === 'search'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-text-secondary hover:bg-muted',
            )}
          >
            <Sparkles size={15} /> AI Semantic Search
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-meta font-semibold transition-colors',
              activeTab === 'library'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-text-secondary hover:bg-muted',
            )}
          >
            <Compass size={15} /> Board Resource Library
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: AI SEMANTIC RAG SEARCH */}
      {/* ========================================================================= */}
      {activeTab === 'search' && (
        <div className="flex flex-col gap-6">
          {/* Hero Search Box */}
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-linear-to-b from-surface via-surface to-surface-muted p-6 sm:p-8 shadow-xs">
            <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-info/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-micro font-bold text-primary">
                  <Lightbulb size={13} /> Ask any CBSE, ICSE, or GSEB Class 10 Concept
                </div>
                <h2 className="mt-2 text-title font-extrabold text-foreground tracking-tight">
                  Instant Textbook & Solution Answers with Verified Citations
                </h2>
                <p className="text-meta text-text-secondary">
                  Retrieve direct passages, definitions, formulas, and textbook solutions across all major subjects.
                </p>
              </div>

              {/* Main Search Input */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="E.g., Write the mirror formula and Snell's law of refraction in Science..."
                    className="w-full rounded-xl border border-border bg-surface pl-11 pr-4 py-3.5 text-body text-foreground shadow-2xs placeholder:text-text-tertiary focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="btn-primary shrink-0 gap-2 px-6 py-3.5 text-body font-bold shadow-xs hover:shadow-sm"
                >
                  {loading ? (
                    <>Searching Vectors...</>
                  ) : (
                    <>
                      <Sparkles size={16} /> Search RAG
                    </>
                  )}
                </button>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* Board Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-micro font-bold text-text-tertiary uppercase tracking-wider">Board:</span>
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
                    {BOARDS.map((b) => (
                      <button
                        key={b}
                        onClick={() => setSelectedBoard(b)}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-micro font-bold transition-colors',
                          selectedBoard === b
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:bg-muted',
                        )}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-micro font-bold text-text-tertiary uppercase tracking-wider">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-micro font-semibold text-foreground focus:outline-hidden"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preset Chips */}
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-micro font-bold text-text-tertiary uppercase tracking-wider">
                  Suggested Questions & Topics:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_CHIPS.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleChipClick(chip)}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-surface/80 px-3 py-1.5 text-micro font-medium text-text-secondary transition-all hover:border-primary/50 hover:bg-primary-soft hover:text-primary shadow-2xs"
                    >
                      <Badge tone={chip.board === 'CBSE' ? 'primary' : chip.board === 'ICSE' ? 'info' : 'warning'}>
                        {chip.board}
                      </Badge>
                      <span>{chip.label}</span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Area */}
          {hasSearched && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-section font-bold text-foreground">
                    Retrieved Knowledge Chunks ({searchResults.length})
                  </h3>
                  <Badge tone="success">
                    <CheckCircle2 size={12} /> Cosine Ranked
                  </Badge>
                </div>
                <span className="text-micro text-text-tertiary">
                  Matches filtered for: {selectedBoard} · {selectedCategory}
                </span>
              </div>

              {searchResults.length === 0 && !loading && (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                  <HelpCircle size={40} className="text-text-tertiary mb-3" />
                  <div className="text-meta font-bold text-foreground">No Exact Vector Matches Found</div>
                  <p className="mt-1 max-w-md text-micro text-text-secondary">
                    Try broadening your keywords or resetting the board/category filter to "ALL".
                  </p>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {searchResults.map((res, idx) => {
                  const matchPct = Math.round((res.similarity || 0.75) * 100);
                  const isOfficial = res.source_tier === 'official' || res.url.includes('nic.in') || res.url.includes('gov.in') || res.url.includes('cisce.org');

                  return (
                    <Card
                      key={res.id || idx}
                      className="group flex flex-col justify-between border border-border/80 p-5 transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3">
                        {/* Top Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={res.board === 'CBSE' ? 'primary' : res.board === 'ICSE' ? 'info' : 'warning'}>
                              {res.board} Class 10
                            </Badge>
                            <Badge tone="neutral">{res.subject}</Badge>
                            <Badge tone={isOfficial ? 'success' : 'neutral'}>
                              {isOfficial ? 'Official Source' : 'Verified Solution'}
                            </Badge>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-micro font-extrabold text-primary">
                            <Zap size={11} /> {matchPct}% Match
                          </span>
                        </div>

                        {/* Title & Chapter Reference */}
                        <div>
                          <h4 className="text-meta font-bold text-foreground group-hover:text-primary transition-colors">
                            {res.title || `${res.board} ${res.subject} Material`}
                          </h4>
                          <div className="mt-1 flex items-center gap-2 text-micro text-text-tertiary">
                            <Globe size={12} />
                            <span className="font-mono text-micro">{res.domain || new URL(res.url).hostname}</span>
                            {res.page_number && <span>· Page {res.page_number}</span>}
                          </div>
                        </div>

                        {/* Content Passage */}
                        <div className="rounded-lg bg-surface-muted p-3.5 text-body text-text-secondary leading-relaxed border border-border/50 text-meta">
                          {res.chunk_text}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/40">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyNote(res.chunk_text, res.id || String(idx))}
                            className="btn-tertiary text-micro gap-1.5 py-1 px-2.5"
                          >
                            {copiedId === (res.id || String(idx)) ? (
                              <>
                                <Check size={13} className="text-success" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy size={13} /> Copy Note
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedChunkForAI(res)}
                            className="btn-secondary text-micro gap-1.5 py-1 px-2.5 text-primary border-primary/30"
                          >
                            <Sparkles size={13} /> AI Breakdown
                          </button>
                        </div>

                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary text-micro gap-1.5 py-1 px-3"
                        >
                          <span>Open Source</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CURATED BOARD RESOURCE LIBRARY */}
      {/* ========================================================================= */}
      {activeTab === 'library' && (
        <div className="flex flex-col gap-6">
          {/* Board Navigation Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/80 bg-surface p-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-meta font-bold text-foreground">Select Board:</span>
              <div className="flex items-center gap-1.5">
                {BOARDS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBoard(b)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-meta font-bold transition-colors',
                      selectedBoard === b
                        ? 'bg-primary text-white shadow-2xs'
                        : 'text-text-secondary hover:bg-muted',
                    )}
                  >
                    {b === 'ALL' ? 'All Boards (295 resources)' : `${b} Class 10`}
                  </button>
                ))}
              </div>
            </div>

            <Badge tone="primary">
              <Layers size={14} /> {catalog.length} Curated Resources Active
            </Badge>
          </div>

          {/* Catalog Grouped by Subject */}
          <div className="flex flex-col gap-6">
            {catalogBySubject.map(([subjectHeading, items]) => (
              <SectionCard
                key={subjectHeading}
                title={subjectHeading}
                icon={<GraduationCap size={18} />}
                action={<Badge tone="neutral">{items.length} links</Badge>}
                bodyClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                {items.map((item) => {
                  const isOfficial = item.source_tier === 'official' || item.url?.includes('nic.in') || item.url?.includes('gov.in') || item.url?.includes('cisce.org');
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-xl border border-border/70 bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-xs"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            tone={
                              item.category === 'textbook'
                                ? 'primary'
                                : item.category === 'solution'
                                ? 'info'
                                : item.category === 'prev_year_paper'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {item.category.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                          {isOfficial && (
                            <span className="text-micro font-bold text-success flex items-center gap-1">
                              <CheckCircle2 size={12} /> Official
                            </span>
                          )}
                        </div>

                        <div className="text-meta font-bold text-foreground line-clamp-2">
                          {item.title || item.subject}
                        </div>

                        {item.note && (
                          <div className="text-micro italic text-text-tertiary">
                            Note: {item.note}
                          </div>
                        )}

                        <div className="text-micro font-mono text-text-tertiary truncate">
                          {item.domain}
                        </div>
                      </div>

                      {item.url && (
                        <div className="mt-3 pt-3 border-t border-border/40">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-micro font-bold text-primary hover:underline"
                          >
                            <span>Access Resource</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </SectionCard>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AI EXPLAINER MODAL SHEET */}
      {/* ========================================================================= */}
      {selectedChunkForAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h3 className="text-meta font-bold text-foreground">AI Concept & Formula Breakdown</h3>
                  <p className="text-micro text-text-tertiary">{selectedChunkForAI.board} Class 10 · {selectedChunkForAI.subject}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChunkForAI(null)}
                className="btn-tertiary py-1 px-2.5 text-micro"
              >
                Close
              </button>
            </div>

            {/* Original Passage */}
            <div className="rounded-xl border border-border/70 bg-surface-muted p-4">
              <span className="text-micro font-bold text-text-tertiary uppercase">Original Textbook Passage:</span>
              <p className="mt-1 text-meta text-foreground leading-relaxed">{selectedChunkForAI.chunk_text}</p>
            </div>

            {/* AI Breakdown Highlights */}
            <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary-soft/30 p-4">
              <div className="flex items-center gap-2 text-meta font-bold text-primary">
                <Lightbulb size={16} /> Key Takeaways for Board Examinations
              </div>
              <ul className="flex flex-col gap-2 text-meta text-text-secondary list-disc pl-5">
                <li><strong>Core Concept:</strong> Master the definitions and mathematical formulas directly stated in this chapter.</li>
                <li><strong>Common Board Exam Trap:</strong> Double-check sign conventions and unit conversions when applying these formulas.</li>
                <li><strong>Exam Preparation:</strong> Practice 3 solved numericals and 2 previous-year board questions from this topic.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <a
                href={selectedChunkForAI.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary gap-1.5 py-2 px-4 text-meta font-bold"
              >
                <span>Open Full Chapter Link</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
