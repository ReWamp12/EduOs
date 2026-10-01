'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { dataService } from '@/lib/dataService';
import { ParentQuery } from '@/lib/types';
import { Badge, SectionCard } from '@/components/ui';

/** Principal view: parent queries still unanswered after 48 hours. Renders nothing when there are none. */
export const EscalatedQueriesCard: React.FC = () => {
  const [queries, setQueries] = useState<ParentQuery[]>([]);

  useEffect(() => {
    let active = true;
    dataService.getQueries({ escalated: true }).then((rows) => {
      if (active) setQueries(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  if (queries.length === 0) return null;

  return (
    <SectionCard
      title="Unanswered parent queries"
      icon={<AlertTriangle size={18} />}
      action={<Badge tone="danger">{queries.length} overdue</Badge>}
      bodyClassName="flex flex-col gap-2"
    >
      {queries.map((q) => (
        <div key={q.id} className="rounded-md border border-border p-3 text-meta">
          <span className="font-semibold text-foreground">{q.studentName}</span> → {q.teacherName}
          <span className="ml-2 capitalize text-text-tertiary">{q.category}</span>
          <p className="mt-1 line-clamp-2 text-text-secondary">{q.message}</p>
        </div>
      ))}
    </SectionCard>
  );
};
