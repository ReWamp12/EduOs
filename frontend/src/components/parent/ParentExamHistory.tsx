'use client';

import React, { useState } from 'react';
import { mockParentChildren } from '@/lib/mockData';
import { useAppStore } from '@/lib/store';
import { PageHeader, Card, StatCard, Badge, ProgressBar, EmptyState, cn } from '@/components/ui';
import { Trophy, TrendingUp, ClipboardList, CalendarClock, FileText } from 'lucide-react';

export const ParentExamHistory: React.FC = () => {
  const { exams } = useAppStore();
  const defaultChild = { id: '', name: 'Student', rollNumber: '', grade: 'Class N/A', batchName: 'Class N/A', branch: '', targetExam: '', avatarUrl: '', attendance: 0, attendancePct: 0, latestScore: '', rankInBatch: 0, unreadAlerts: 0 };
  const [childId, setChildId] = useState(mockParentChildren[0]?.id || '');
  const child = mockParentChildren.find((c) => c.id === childId) || mockParentChildren[0] || defaultChild;

  // Exams for this child: matched by batch (child.grade / child.batchName) or explicit result name.
  const childExams = (exams || []).filter(
    (e) => (child.grade && e.batchName === child.grade) || (child.batchName && e.batchName === child.batchName) || (child.name && e.studentName === child.name),
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
          mockParentChildren && mockParentChildren.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface p-1 shadow-xs">
              {mockParentChildren.map((c) => (
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
              const tone = pct >= 75 ? 'success' : pct >= 40 ? 'warning' : 'destructive';
              return (
                <Card key={e.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="info">{e.subject}</Badge>
                        <Badge tone="neutral">{e.examType}</Badge>
                      </div>
                      <h4 className="mt-2 text-section text-foreground">{e.title}</h4>
                      <div className="mt-1 text-micro text-text-tertiary">{e.examDate}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-2xl font-semibold text-foreground">
                        {e.marksObtained}
                        <span className="text-base font-medium text-text-tertiary">/{e.maxMarks}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-end gap-2 text-micro text-text-tertiary">
                        {e.percentile !== undefined && <span>{e.percentile} %ile</span>}
                        {e.rankInBatch !== undefined && <Badge tone="primary">Rank #{e.rankInBatch}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={pct} tone={tone} />
                    <div className="mt-1 text-micro text-text-tertiary">{pct}% score</div>
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
