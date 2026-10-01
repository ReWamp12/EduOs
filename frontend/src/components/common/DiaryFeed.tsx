'use client';

import React, { useMemo } from 'react';
import { BookOpen, NotebookPen } from 'lucide-react';
import { DiaryEntry } from '@/lib/types';
import { Card, EmptyState, Skeleton } from '@/components/ui';

const formatDay = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  });

/** Read-only day-by-day diary, shared by the parent and teacher views. */
export const DiaryFeed: React.FC<{ entries: DiaryEntry[]; loading: boolean }> = ({ entries, loading }) => {
  const days = useMemo(() => {
    const byDate = new Map<string, DiaryEntry[]>();
    entries.forEach((e) => byDate.set(e.date, [...(byDate.get(e.date) || []), e]));
    return Array.from(byDate.entries());
  }, [entries]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<NotebookPen size={20} />}
          title="No diary entries yet"
          description="Classwork and homework appear here once teachers post them."
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {days.map(([date, dayEntries]) => (
        <section key={date} aria-label={formatDay(date)} className="flex flex-col gap-3">
          <h3 className="text-section text-foreground">{formatDay(date)}</h3>
          {dayEntries.map((entry) => (
            <Card key={entry.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-meta font-semibold text-foreground">
                  <BookOpen size={15} className="text-primary" aria-hidden="true" />
                  {entry.subject}
                </span>
                <span className="text-micro text-text-tertiary">{entry.teacherName}</span>
              </div>
              <div>
                <div className="text-micro font-semibold uppercase tracking-wider text-text-tertiary">Classwork</div>
                <p className="mt-1 whitespace-pre-line text-body text-foreground">{entry.classwork}</p>
              </div>
              {entry.homework && (
                <div className="rounded-md bg-primary-soft p-3">
                  <div className="text-micro font-semibold uppercase tracking-wider text-primary">Homework</div>
                  <p className="mt-1 whitespace-pre-line text-body text-foreground">{entry.homework}</p>
                </div>
              )}
            </Card>
          ))}
        </section>
      ))}
    </div>
  );
};
