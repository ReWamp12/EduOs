'use client';

import React, { useMemo, useState } from 'react';
import { mockNotices } from '@/lib/mockData';
import { Notice } from '@/lib/types';
import { PageHeader, Card, Badge, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { Calendar, Megaphone, CheckCheck, Inbox, Dot } from 'lucide-react';

type Category = Notice['category'];
type Filter = Category | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'academic', label: 'Academic' },
  { value: 'exam', label: 'Exam' },
  { value: 'event', label: 'Event' },
  { value: 'urgent', label: 'Urgent' },
];

const categoryTone: Record<Category, 'success' | 'primary' | 'info' | 'danger'> = {
  academic: 'success',
  exam: 'primary',
  event: 'info',
  urgent: 'danger',
};

const categoryBorder: Record<Category, string> = {
  academic: 'border-l-success',
  exam: 'border-l-primary',
  event: 'border-l-info',
  urgent: 'border-l-destructive',
};

export const StudentNotices: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const notices = mockNotices;
  const unreadCount = notices.filter((n) => !readIds.has(n.id)).length;

  const filtered = useMemo(
    () => (filter === 'all' ? notices : notices.filter((n) => n.category === filter)),
    [filter, notices],
  );

  const markAllRead = () => {
    setReadIds(new Set(notices.map((n) => n.id)));
    toast('All notices marked read', 'success', `${unreadCount} circular(s) cleared.`);
  };

  const markRead = (id: string) => {
    if (readIds.has(id)) return;
    setReadIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Circulars & Official Notices"
        subtitle="Official broadcasts from the Academic Directorate & Principal's Office"
        actions={
          <>
            <Badge tone={unreadCount ? 'primary' : 'neutral'}>{unreadCount} unread</Badge>
            <button className="btn-secondary" onClick={markAllRead} disabled={unreadCount === 0}>
              <CheckCheck size={16} /> Mark all read
            </button>
          </>
        }
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-micro font-semibold transition-colors',
                active
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-muted',
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<Inbox size={22} />}
            title="No notices here"
            description="There are no circulars in this category right now. Try a different filter."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((n) => {
            const isRead = readIds.has(n.id);
            return (
              <Card
                key={n.id}
                interactive
                onClick={() => markRead(n.id)}
                className={cn('border-l-4 p-5', categoryBorder[n.category])}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge tone={categoryTone[n.category]}>
                      <Megaphone size={12} /> {n.category.toUpperCase()}
                    </Badge>
                    {!isRead && (
                      <span className="inline-flex items-center gap-0.5 text-micro font-semibold text-primary">
                        <Dot size={16} className="-mx-1.5" /> New
                      </span>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-micro text-text-tertiary">
                    <Calendar size={13} /> {n.date}
                  </div>
                </div>

                <h3 className={cn('mt-2.5 text-section', isRead ? 'text-text-secondary' : 'text-foreground')}>
                  {n.title}
                </h3>
                <p className="mt-1.5 text-meta leading-relaxed text-text-secondary">{n.content}</p>

                <div className="mt-3 text-micro text-text-tertiary">
                  Issued by <span className="font-semibold text-foreground">{n.author}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
