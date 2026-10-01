'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import { useTeacherBatch } from '@/lib/teacherContext';
import { dataService } from '@/lib/dataService';
import { RemedialPlan } from '@/lib/types';
import { PageHeader, Card, Badge, EmptyState } from '@/components/ui';
import { toast } from '@/components/ui/toast';

export const TeacherRemedial: React.FC = () => {
  const { batch } = useTeacherBatch();
  const [plans, setPlans] = useState<RemedialPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setPlans(await dataService.getRemedialPlans({ batchId: batch.id }));
    setLoading(false);
  }, [batch.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleResolve = async (plan: RemedialPlan) => {
    const score = Number(scores[plan.id]);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      toast('Enter the re-test score', 'warning', 'A percentage between 0 and 100 is required.');
      return;
    }
    if (!(await dataService.resolveRemedialPlan(plan.id, score))) {
      toast('Could not resolve plan', 'error', 'Please try again.');
      return;
    }
    toast('Plan resolved', 'success', `${plan.studentName} re-assessed at ${score}%.`);
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Remedial Support"
        subtitle={`Support plans for ${batch.name}. Start one from the Gradebook for any student below 50%.`}
      />

      {!loading && plans.length === 0 ? (
        <Card>
          <EmptyState icon={<LifeBuoy size={20} />} title="No support plans yet" description="Plans you start from the Gradebook appear here." />
        </Card>
      ) : (
        plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-meta font-semibold text-foreground">{plan.studentName}</div>
                <div className="text-micro text-text-tertiary">
                  {plan.subjectName} — {plan.topic}
                  {plan.triggerScorePct !== null && ` · scored ${plan.triggerScorePct}%`}
                </div>
              </div>
              <Badge tone={plan.status === 'resolved' ? 'success' : 'warning'}>
                {plan.status === 'resolved' ? `Resolved · ${plan.resolvedScorePct}%` : 'Active'}
              </Badge>
            </div>
            {plan.resourceNote && <p className="text-body text-text-secondary">{plan.resourceNote}</p>}
            {plan.status === 'active' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="input w-32"
                  placeholder="Re-test %"
                  aria-label={`Re-test percentage for ${plan.studentName}`}
                  value={scores[plan.id] ?? ''}
                  onChange={(e) => setScores((prev) => ({ ...prev, [plan.id]: e.target.value }))}
                />
                <button className="btn-primary" onClick={() => handleResolve(plan)}>
                  Mark resolved
                </button>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
};
