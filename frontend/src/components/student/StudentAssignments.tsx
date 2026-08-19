'use client';

import React, { useState } from 'react';
import { dataService } from '@/lib/dataService';
import { mockAssignments, mockCurrentStudent } from '@/lib/mockData';
import { Assignment } from '@/lib/types';
import { useAppStore, addSubmission } from '@/lib/store';
import { PageHeader, SectionCard, Card, Badge, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { Clock, CheckCircle2, Upload, Award, MessageSquareText, ClipboardCheck, Inbox } from 'lucide-react';

const statusBadge: Record<Assignment['status'], { tone: 'warning' | 'info' | 'success'; label: string; icon: React.ReactNode }> = {
  pending: { tone: 'warning', label: 'Pending', icon: <Clock size={12} /> },
  submitted: { tone: 'info', label: 'Under Review', icon: <ClipboardCheck size={12} /> },
  graded: { tone: 'success', label: 'Graded', icon: <CheckCircle2 size={12} /> },
};

export const StudentAssignments: React.FC = () => {
  const { submissions } = useAppStore();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Display status is the shared store's truth (a teacher grading it flows back
  // here); fall back to the assignment's own mock status if not yet in the store.
  const assignments: Assignment[] = mockAssignments.map((a) => {
    const sub = submissions.find(
      (s) => s.assignmentId === a.id && s.studentName === mockCurrentStudent.name,
    );
    if (!sub) return { ...a };
    return {
      ...a,
      status: sub.status,
      obtainedMarks: sub.obtainedMarks ?? a.obtainedMarks,
      feedback: sub.feedback ?? a.feedback,
    };
  });

  const handleSubmit = async (assignment: Assignment) => {
    setSubmittingId(assignment.id);
    try {
      await dataService.submitAssignment({
        assignmentId: assignment.id,
        studentId: 's-1',
        submissionUrl: `https://storage.eduos.app/submissions/std-1-${assignment.id}.pdf`,
      });
      // Write to the shared store so it lands in the teacher's grading queue.
      addSubmission({
        assignmentId: assignment.id,
        title: assignment.title,
        subject: assignment.subject,
        batchName: assignment.batchName,
        studentName: mockCurrentStudent.name,
        maxMarks: assignment.maxMarks,
      });
      toast('Assignment submitted', 'success', `${assignment.title} sent for review.`);
    } catch {
      toast('Submission failed', 'error', 'Please try again in a moment.');
    } finally {
      setSubmittingId(null);
    }
  };

  const pendingCount = assignments.filter((a) => a.status === 'pending').length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Daily Practice Problems & Assignments"
        subtitle="Class 11 - JEE Advanced Alpha problem sets"
        actions={<Badge tone={pendingCount ? 'warning' : 'success'}>{pendingCount} pending</Badge>}
      />

      {pendingCount === 0 && (
        <SectionCard title="Pending Work" icon={<Inbox size={18} />} bodyClassName="p-0">
          <EmptyState
            icon={<CheckCircle2 size={22} />}
            title="You're all caught up"
            description="No pending assignments right now. New DPPs will appear here as your faculty publishes them."
          />
        </SectionCard>
      )}

      <div className="flex flex-col gap-4">
        {assignments.map((a) => {
          const badge = statusBadge[a.status];
          const isSubmitting = submittingId === a.id;
          return (
            <Card key={a.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge tone="primary">{a.subject}</Badge>
                  <Badge tone={badge.tone}>
                    {badge.icon} {badge.label}
                  </Badge>
                </div>
                <h3 className="mt-2 text-section text-foreground">{a.title}</h3>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-text-tertiary">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={13} /> Due{' '}
                    <strong className={cn(a.status === 'pending' ? 'text-warning' : 'text-foreground')}>{a.dueDate}</strong>
                  </span>
                  <span>Max marks: {a.maxMarks}</span>
                  {a.status === 'graded' && a.obtainedMarks !== undefined && (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-success">
                      <Award size={13} /> Score {a.obtainedMarks}/{a.maxMarks}
                    </span>
                  )}
                </div>

                {a.status === 'graded' && a.feedback && (
                  <div className="mt-3 flex items-start gap-2 rounded-md border border-success/20 bg-success-soft px-3.5 py-2.5">
                    <MessageSquareText size={15} className="mt-0.5 shrink-0 text-success" />
                    <p className="text-micro text-text-secondary">
                      <span className="font-semibold text-foreground">Faculty feedback: </span>
                      {a.feedback}
                    </p>
                  </div>
                )}
              </div>

              <div className="shrink-0 lg:pt-1">
                {a.status === 'pending' ? (
                  <button className="btn-primary w-full lg:w-auto" onClick={() => handleSubmit(a)} disabled={isSubmitting}>
                    <Upload size={16} /> {isSubmitting ? 'Submitting…' : 'Submit Solution'}
                  </button>
                ) : a.status === 'submitted' ? (
                  <Badge tone="info">
                    <ClipboardCheck size={13} /> Awaiting grade
                  </Badge>
                ) : (
                  <Badge tone="success">
                    <CheckCircle2 size={13} /> Graded
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
