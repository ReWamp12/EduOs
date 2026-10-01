'use client';

import React from 'react';
import { ParentQuery } from '@/lib/types';
import { Badge, Card } from '@/components/ui';

/** One parent query with its reply; `children` renders the role-specific action area. */
export const QueryCard: React.FC<{
  query: ParentQuery;
  counterpart: 'teacher' | 'student';
  children?: React.ReactNode;
}> = ({ query, counterpart, children }) => (
  <Card className="flex flex-col gap-3 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="text-meta font-semibold text-foreground">
        {counterpart === 'teacher' ? query.teacherName : query.studentName}
        <span className="ml-2 text-micro font-normal capitalize text-text-tertiary">{query.category}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-micro text-text-tertiary">
          {new Date(query.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
        <Badge tone={query.status === 'answered' ? 'success' : 'warning'}>
          {query.status === 'answered' ? 'Answered' : 'Open'}
        </Badge>
      </div>
    </div>
    <p className="whitespace-pre-line text-body text-foreground">{query.message}</p>
    {query.reply && (
      <div className="rounded-md bg-primary-soft p-3">
        <div className="text-micro font-semibold uppercase tracking-wider text-primary">Reply</div>
        <p className="mt-1 whitespace-pre-line text-body text-foreground">{query.reply}</p>
      </div>
    )}
    {children}
  </Card>
);
