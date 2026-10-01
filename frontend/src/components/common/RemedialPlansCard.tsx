'use client';

import React, { useEffect, useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import { dataService } from '@/lib/dataService';
import { RemedialPlan } from '@/lib/types';
import { Badge, SectionCard } from '@/components/ui';

/**
 * Read-only remedial support plans. With `studentId` it shows that student's
 * plans (parent/student views); without it, every plan in the school
 * (principal view). Renders nothing while there is nothing to show.
 */
export const RemedialPlansCard: React.FC<{ studentId?: string; showStudent?: boolean }> = ({
  studentId,
  showStudent = false,
}) => {
  const [plans, setPlans] = useState<RemedialPlan[]>([]);

  useEffect(() => {
    let active = true;
    dataService.getRemedialPlans({ studentId }).then((rows) => {
      if (active) setPlans(rows);
    });
    return () => {
      active = false;
    };
  }, [studentId]);

  if (plans.length === 0) return null;

  const activeCount = plans.filter((p) => p.status === 'active').length;

  return (
    <SectionCard
      title="Academic support plans"
      icon={<LifeBuoy size={18} />}
      action={<Badge tone={activeCount > 0 ? 'warning' : 'success'}>{activeCount} active</Badge>}
      bodyClassName="flex flex-col gap-3"
    >
      {plans.map((plan) => (
        <div key={plan.id} className="rounded-md border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-meta font-semibold text-foreground">
              {showStudent && `${plan.studentName} · `}
              {plan.subjectName} — {plan.topic}
            </div>
            <Badge tone={plan.status === 'resolved' ? 'success' : 'warning'}>
              {plan.status === 'resolved' ? `Resolved · ${plan.resolvedScorePct ?? '—'}%` : 'In progress'}
            </Badge>
          </div>
          {plan.resourceNote && <p className="mt-1 text-body text-text-secondary">{plan.resourceNote}</p>}
          {plan.doubtSessionDate && plan.status === 'active' && (
            <p className="mt-1 text-micro text-text-tertiary">
              Doubt-clearing session: {new Date(`${plan.doubtSessionDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </p>
          )}
        </div>
      ))}
    </SectionCard>
  );
};
