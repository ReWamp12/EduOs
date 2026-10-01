'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { ParentQuery } from '@/lib/types';
import { PageHeader, Card, EmptyState } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { QueryCard } from '@/components/common/QueryCard';

export const TeacherQueries: React.FC = () => {
  const { session } = useAuth();
  const [queries, setQueries] = useState<ParentQuery[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (session) setQueries(await dataService.getQueries({ teacherId: session.userId }));
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReply = async (query: ParentQuery) => {
    const reply = (replies[query.id] || '').trim();
    if (!reply) return;
    if (!(await dataService.replyToQuery(query.id, reply))) {
      toast('Could not send reply', 'error', 'Please try again.');
      return;
    }
    toast('Reply sent', 'success', `${query.studentName}'s parent can now see it.`);
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Parent Queries" subtitle="Questions addressed to you. Unanswered queries escalate to the principal after 48 hours." />
      {queries.length === 0 ? (
        <Card>
          <EmptyState icon={<MessageSquareText size={20} />} title="No queries" description="Parent questions addressed to you appear here." />
        </Card>
      ) : (
        queries.map((q) => (
          <QueryCard key={q.id} query={q} counterpart="student">
            {q.status === 'open' && (
              <div className="flex flex-col gap-2">
                <textarea
                  className="input min-h-[72px]"
                  aria-label={`Reply to ${q.studentName}'s parent`}
                  value={replies[q.id] ?? ''}
                  onChange={(e) => setReplies((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
                <div>
                  <button className="btn-primary" onClick={() => handleReply(q)} disabled={!(replies[q.id] || '').trim()}>
                    Send reply
                  </button>
                </div>
              </div>
            )}
          </QueryCard>
        ))
      )}
    </div>
  );
};
