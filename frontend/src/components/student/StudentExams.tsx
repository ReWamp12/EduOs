'use client';

import React, { useState } from 'react';
import { mockExamResults, mockCurrentStudent } from '@/lib/mockData';
import { ExamResult } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { PageHeader, SectionCard, Card, Badge, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  Trophy,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Download,
  ChevronDown,
  Target,
  CalendarDays,
  CalendarClock,
} from 'lucide-react';

export const StudentExams: React.FC = () => {
  const { exams } = useAppStore();
  const upcoming = exams.filter(
    (e) => e.status === 'scheduled' && e.batchName === mockCurrentStudent.batchName,
  );
  const [results] = useState<ExamResult[]>(() => mockExamResults.map((e) => ({ ...e })));
  const [expandedId, setExpandedId] = useState<string | null>(results[0]?.id ?? null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handleDownloadScorecard = async (exam: ExamResult) => {
    setDownloadingId(exam.id);
    await new Promise((r) => setTimeout(r, 700));
    setDownloadingId(null);
    toast('Scorecard downloaded', 'success', `${exam.examTitle} scorecard exported as PDF.`);
  };

  const handleDownloadTranscript = async () => {
    setDownloadingAll(true);
    await new Promise((r) => setTimeout(r, 900));
    setDownloadingAll(false);
    toast('Transcript downloaded', 'success', 'Cumulative performance transcript exported as PDF.');
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exams & AI Diagnostic Scorecards"
        subtitle="All-India mock test performance, percentiles & mistake classifications"
        actions={
          <button className="btn-primary" onClick={handleDownloadTranscript} disabled={downloadingAll}>
            <Download size={16} /> {downloadingAll ? 'Preparing…' : 'Cumulative Transcript'}
          </button>
        }
      />

      {upcoming.length > 0 && (
        <SectionCard title="Upcoming exams" icon={<CalendarClock size={18} />} bodyClassName="flex flex-col gap-2.5">
          {upcoming.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-md border border-warning/20 bg-warning-soft px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-meta font-semibold text-foreground">{e.title}</div>
                <div className="mt-0.5 truncate text-micro text-text-tertiary">
                  {e.subject} · {e.examType} · max {e.maxMarks} marks
                </div>
              </div>
              <div className="shrink-0 text-right">
                <Badge tone="warning">Scheduled</Badge>
                <div className="mt-1 text-micro text-text-tertiary">{e.examDate}</div>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      <div className="flex flex-col gap-4">
        {results.map((exam) => {
          const pct = Math.round((exam.marksObtained / exam.totalMarks) * 100);
          const isOpen = expandedId === exam.id;
          return (
            <SectionCard
              key={exam.id}
              title={exam.examTitle}
              icon={<Trophy size={18} />}
              action={
                <div className="flex items-center gap-2">
                  <Badge tone="success">
                    <TrendingUp size={12} /> {exam.percentile}%ile
                  </Badge>
                  <Badge tone="warning">
                    <Trophy size={12} /> Rank #{exam.rankInBatch}
                  </Badge>
                </div>
              }
              bodyClassName="flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-text-tertiary">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={13} /> {exam.examDate}
                  </span>
                  <span>·</span>
                  <span>{exam.subject}</span>
                  <span>·</span>
                  <span>CBT Examination Mode</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[1.75rem] font-semibold leading-none tracking-tight text-foreground">
                    {exam.marksObtained}
                  </span>
                  <span className="text-body text-text-tertiary">/ {exam.totalMarks}</span>
                  <span
                    className={cn(
                      'ml-1 badge',
                      pct >= 75 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger',
                    )}
                  >
                    {pct}%
                  </span>
                </div>
              </div>

              {/* AI diagnostic */}
              <div className="rounded-md border border-primary/15 bg-primary-soft p-4">
                <div className="flex items-center gap-2 text-micro font-semibold uppercase tracking-wide text-primary">
                  <Sparkles size={15} /> AI Test Analysis & Mistake Pattern Detection
                </div>
                <p className="mt-1.5 text-meta leading-relaxed text-text-secondary">{exam.mistakeSummary}</p>
              </div>

              <button
                className="btn-tertiary self-start"
                onClick={() => setExpandedId(isOpen ? null : exam.id)}
                aria-expanded={isOpen}
              >
                <ChevronDown size={15} className={cn('transition-transform', isOpen && 'rotate-180')} />
                {isOpen ? 'Hide details' : 'View weak topics & scorecard'}
              </button>

              {isOpen && (
                <div className="flex flex-col gap-4 border-t border-border pt-4">
                  {exam.weakTopics.length > 0 && (
                    <div>
                      <div className="eyebrow mb-2 flex items-center gap-1.5">
                        <Target size={13} /> Detected revision areas
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {exam.weakTopics.map((topic, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive-soft px-3 py-1.5 text-micro font-semibold text-destructive"
                          >
                            <AlertCircle size={13} /> {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
                    {[
                      { label: 'Marks', value: `${exam.marksObtained}/${exam.totalMarks}` },
                      { label: 'Percentage', value: `${pct}%` },
                      { label: 'Percentile', value: `${exam.percentile}` },
                      { label: 'Batch Rank', value: `#${exam.rankInBatch}` },
                    ].map((s) => (
                      <div key={s.label}>
                        <div className="eyebrow">{s.label}</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">{s.value}</div>
                      </div>
                    ))}
                  </Card>

                  <button
                    className="btn-secondary self-start"
                    onClick={() => handleDownloadScorecard(exam)}
                    disabled={downloadingId === exam.id}
                  >
                    <Download size={16} /> {downloadingId === exam.id ? 'Preparing…' : 'Download scorecard'}
                  </button>
                </div>
              )}
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
};
