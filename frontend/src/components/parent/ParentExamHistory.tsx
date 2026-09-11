'use client';

import React, { useState, useEffect } from 'react';
import { Student } from '@/lib/types';
import { dataService } from '@/lib/dataService';
import { useAppStore } from '@/lib/store';
import { PageHeader, Card, StatCard, Badge, ProgressBar, EmptyState, cn } from '@/components/ui';
import { Trophy, TrendingUp, ClipboardList, CalendarClock, FileText } from 'lucide-react';

export const ParentExamHistory: React.FC = () => {
  const { exams } = useAppStore();
  const [children, setChildren] = useState<Student[]>([]);
  const [childId, setChildId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    dataService.getParentChildren().then((kids) => {
      if (!active) return;
      if (kids && kids.length > 0) {
        setChildren(kids);
        setChildId((prev) => prev || kids[0].id);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const child = children.find((c) => c.id === childId) || children[0];

  const cName = (child?.name || '').toLowerCase().trim();
  const cFirst = cName.split(' ')[0] || '';

  // Exams for this child: matched by batch or student result.
  const childExams = (exams || []).filter(
    (e) =>
      !e.batchName ||
      !child?.batchName ||
      e.batchName === child.batchName ||
      e.batchName.includes(child.batchName) ||
      (e.studentName && cName && (e.studentName.toLowerCase().trim() === cName || (cFirst && e.studentName.toLowerCase().includes(cFirst)))),
  );
  const completed = childExams.filter((e) => e.status === 'completed');
  const upcoming = childExams.filter((e) => e.status === 'scheduled');

  const bestPercentile = completed.reduce((m, e) => Math.max(m, e.percentile ?? 0), 0);
  const bestRank = completed.reduce((m, e) => (e.rankInBatch ? Math.min(m, e.rankInBatch) : m), Infinity);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exam history"
        subtitle="Your child's assessments, scores and upcoming exams."
        actions={
          children.length > 1 ? (
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface p-1 shadow-xs">
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChildId(c.id)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-meta transition-colors',
                    c.id === childId ? 'bg-primary-soft font-semibold text-primary' : 'font-medium text-text-secondary hover:bg-muted',
                  )}
                >
                  {c.name ? c.name.split(' ')[0] : 'Child'}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Exams Taken" value={completed.length} tone="info" icon={<ClipboardList size={16} />} />
        <StatCard label="Best Percentile" value={bestPercentile ? `${bestPercentile}` : '—'} tone="success" icon={<TrendingUp size={16} />} />
        <StatCard label="Best Rank" value={bestRank !== Infinity ? `#${bestRank}` : '—'} tone="warning" icon={<Trophy size={16} />} />
        <StatCard label="Upcoming" value={upcoming.length} tone="primary" icon={<CalendarClock size={16} />} />
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="eyebrow">Upcoming exams</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {upcoming.map((e) => (
              <Card key={e.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="truncate text-meta font-semibold text-foreground">{e.title}</div>
                  <div className="mt-0.5 text-micro text-text-tertiary">{e.subject} · {e.examType} · max {e.maxMarks}</div>
                </div>
                <div className="shrink-0 text-right">
                  <Badge tone="warning">Scheduled</Badge>
                  <div className="mt-1 text-micro text-text-tertiary">{e.examDate}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed history */}
      <div className="flex flex-col gap-3">
        <h3 className="eyebrow">Result history</h3>
        {completed.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FileText size={22} />}
              title="No results yet"
              description={`Completed exam results for ${child?.name ? child.name.split(' ')[0] : 'your child'} will appear here once graded.`}
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {completed.map((e) => {
              const pct = e.marksObtained && e.maxMarks ? Math.round((e.marksObtained / e.maxMarks) * 100) : 0;
              const tone: 'success' | 'warning' | 'destructive' = pct >= 75 ? 'success' : pct >= 40 ? 'warning' : 'destructive';
              return (
                <Card key={e.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="info">{e.subject}</Badge>
                        <Badge tone="neutral">{e.examType}</Badge>
                      </div>
                      <h4 className="mt-1 text-meta font-semibold text-foreground">{e.title}</h4>
                      <div className="mt-0.5 text-micro text-text-tertiary">{e.examDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-section font-semibold text-foreground">
                        {e.marksObtained} / {e.maxMarks}
                      </div>
                      <Badge tone={tone === 'destructive' ? 'danger' : tone} className="mt-1">{pct}%</Badge>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ProgressBar value={pct} tone={tone} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
