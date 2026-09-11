'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore, updateLeaveStatus } from '@/lib/store';
import { dataService } from '@/lib/dataService';
import { useSession } from '@/lib/auth/AuthProvider';
import { LeaveRequest } from '@/lib/types';
import {
  PageHeader,
  StatCard,
  SectionCard,
  Card,
  Badge,
  EmptyState,
  Skeleton,
  cn,
} from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  Check,
  X,
  Calendar,
  Clock,
  UserCheck,
  Inbox,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Award,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

type Decision = 'approved' | 'rejected';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type ApprovalCategory = 'leave' | 'gradebook';

const statusTone: Record<LeaveRequest['status'], 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

interface GradebookApprovalItem {
  id: string;
  examTitle: string;
  batchName: string;
  teacherName: string;
  subject: string;
  submittedAt: string;
  studentCount: number;
  averagePct: number;
  status: 'pending_signoff' | 'signed_published';
}

const INITIAL_GRADEBOOK_QUEUE: GradebookApprovalItem[] = [
  {
    id: 'gb-1',
    examTitle: 'CBSE Pre-Board Assessment 1 (Full Syllabus)',
    batchName: 'Class 10 - Section A (Board Batch)',
    teacherName: 'Prof. Amit Verma',
    subject: 'Mathematics (Standard)',
    submittedAt: 'Today, 02:30 PM',
    studentCount: 38,
    averagePct: 86.4,
    status: 'pending_signoff',
  },
  {
    id: 'gb-2',
    examTitle: 'All-India Science Olympiad Mock 03',
    batchName: 'Class 10 - Section A (Board Batch)',
    teacherName: 'Mrs. Sunita Rao',
    subject: 'Science (Physics & Chemistry)',
    submittedAt: 'Yesterday, 04:15 PM',
    studentCount: 38,
    averagePct: 81.2,
    status: 'pending_signoff',
  },
];

export const PrincipalApprovals: React.FC = () => {
  const { leaveRequests } = useAppStore();
  const session = useSession();
  const [activeCategory, setActiveCategory] = useState<ApprovalCategory>('leave');
  const [comments, setComments] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [gradebookQueue, setGradebookQueue] = useState<GradebookApprovalItem[]>(INITIAL_GRADEBOOK_QUEUE);

  const counts = useMemo(
    () => ({
      pending: leaveRequests.filter((r) => r.status === 'pending').length,
      approved: leaveRequests.filter((r) => r.status === 'approved').length,
      rejected: leaveRequests.filter((r) => r.status === 'rejected').length,
    }),
    [leaveRequests],
  );

  const visible = useMemo(
    () => (filter === 'all' ? leaveRequests : leaveRequests.filter((r) => r.status === filter)),
    [leaveRequests, filter],
  );

  const handleDecision = async (req: LeaveRequest, decision: Decision) => {
    const note = comments[req.id]?.trim();

    try {
      await dataService.decideLeave(req.id, decision, note, session?.userId);
    } catch (err) {
      console.warn('Backend decideLeave degraded to client store:', err);
    }

    updateLeaveStatus(req.id, decision, note, session ? `${session.firstName} ${session.lastName}`.trim() : undefined);

    if (decision === 'approved') {
      toast(
        'Leave Approved & Stamped',
        'success',
        note ? `${req.employeeName} · ${note}` : `${req.employeeName} · ${req.leaveType} authorized.`,
      );
    } else {
      toast(
        'Leave Application Declined',
        'warning',
        note ? `${req.employeeName} · ${note}` : `${req.employeeName} · ${req.leaveType} rejected.`,
      );
    }
  };

  const handleSignoffGradebook = (item: GradebookApprovalItem) => {
    setGradebookQueue((prev) =>
      prev.map((g) => (g.id === item.id ? { ...g, status: 'signed_published' } : g)),
    );
    toast(
      'Gradebook Signed & Published',
      'success',
      `${item.examTitle} · Digital seal applied · Report cards visible to parents.`,
    );
  };

  const setComment = (id: string, value: string) =>
    setComments((prev) => ({ ...prev, [id]: value }));

  const filters: { key: StatusFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: leaveRequests.length },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  const pendingGradebookCount = gradebookQueue.filter((g) => g.status === 'pending_signoff').length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Institutional Approvals & Governance Queue"
        subtitle="Executive authority sign-off for staff leave applications and academic report cards"
      />

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveCategory('leave')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-all',
            activeCategory === 'leave'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-text-secondary hover:text-foreground',
          )}
        >
          <UserCheck size={16} /> Staff Leave Requests
          {counts.pending > 0 && <Badge tone="warning">{counts.pending}</Badge>}
        </button>
        <button
          onClick={() => setActiveCategory('gradebook')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-all',
            activeCategory === 'gradebook'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-text-secondary hover:text-foreground',
          )}
        >
          <Award size={16} /> Gradebook &amp; Report Card Sign-off
          {pendingGradebookCount > 0 && <Badge tone="warning">{pendingGradebookCount} Pending</Badge>}
        </button>
      </div>

      {activeCategory === 'gradebook' ? (
        /* Gradebook & Report Card Sign-off Queue */
        <div className="space-y-4 animate-fade-in">
          <SectionCard
            title="Academic Assessment Sign-off Queue"
            icon={<FileSpreadsheet size={18} />}
            action={<Badge tone="warning">{pendingGradebookCount} Awaiting Signature</Badge>}
            bodyClassName="flex flex-col gap-4"
          >
            <p className="text-xs text-text-secondary">
              Review teacher-submitted scorecards and apply the Principal Digital Seal to publish official CBSE Report Cards to Student and Parent dashboards.
            </p>

            <div className="space-y-3">
              {gradebookQueue.map((item) => (
                <Card key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-foreground text-sm">{item.examTitle}</h4>
                      <Badge tone={item.status === 'signed_published' ? 'success' : 'warning'}>
                        {item.status === 'signed_published' ? 'Signed & Live' : 'Pending Principal Seal'}
                      </Badge>
                    </div>
                    <div className="text-xs text-text-secondary flex flex-wrap items-center gap-3">
                      <span>Batch: <strong className="text-foreground">{item.batchName}</strong></span>
                      <span>Subject: <strong className="text-foreground">{item.subject}</strong></span>
                      <span>Evaluator: <strong>{item.teacherName}</strong></span>
                      <span>Submitted: <strong>{item.submittedAt}</strong></span>
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {item.studentCount} Students evaluated · Batch Average: <strong className="text-primary">{item.averagePct}%</strong>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {item.status === 'signed_published' ? (
                      <div className="flex items-center gap-1.5 text-xs text-success font-semibold px-3 py-2 bg-success-soft rounded-lg">
                        <ShieldCheck size={16} /> Digitally Signed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSignoffGradebook(item)}
                        className="btn-primary text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <ShieldCheck size={15} /> Sign &amp; Publish Report Cards
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </SectionCard>
        </div>
      ) : (
        /* Leave Requests Queue */
        <>
          {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting Decision"
          value={counts.pending}
          tone="warning"
          icon={<Clock size={16} />}
          hint="Pending your sign-off"
        />
        <StatCard
          label="Approved"
          value={counts.approved}
          tone="success"
          icon={<CheckCircle2 size={16} />}
          hint="Logged in audit register"
        />
        <StatCard
          label="Rejected"
          value={counts.rejected}
          tone="destructive"
          icon={<XCircle size={16} />}
          hint="Declined with remarks"
        />
      </div>

      <SectionCard
        title="Leave Requests"
        icon={<UserCheck size={18} />}
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-micro font-semibold transition-colors',
                  filter === f.key
                    ? 'bg-primary text-white'
                    : 'bg-surface-muted text-text-secondary hover:bg-muted',
                )}
              >
                {f.label}
                {typeof f.count === 'number' && (
                  <span className={cn('ml-1', filter === f.key ? 'text-white/80' : 'text-text-tertiary')}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        }
        bodyClassName="flex flex-col gap-4"
      >
        {visible.length === 0 ? (
          <EmptyState
            icon={<Inbox size={22} />}
            title={filter === 'all' ? 'No leave requests' : `No ${filter} requests`}
            description={
              filter === 'all'
                ? 'New staff leave applications will appear here for your sign-off.'
                : 'Try a different filter to see other requests.'
            }
            action={
              filter !== 'all' ? (
                <button className="btn-secondary" onClick={() => setFilter('all')}>
                  View all requests
                </button>
              ) : undefined
            }
          />
        ) : (
          visible.map((req) => (
            <Card key={req.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-section text-foreground">{req.employeeName}</h3>
                    <Badge tone="neutral">{req.designation}</Badge>
                    <Badge tone={statusTone[req.status]}>{req.status.toUpperCase()}</Badge>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-micro text-text-secondary">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={14} className="text-text-tertiary" />
                      <span className="font-semibold text-foreground">
                        {req.startDate} &ndash; {req.endDate}
                      </span>
                    </span>
                    <span>
                      Type: <span className="font-semibold text-foreground">{req.leaveType}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={14} className="text-text-tertiary" />
                      Applied {req.appliedAt}
                    </span>
                  </div>

                  <p className="mt-3 rounded-md border border-border bg-surface-muted px-3.5 py-2.5 text-meta text-text-secondary">
                    <span className="font-semibold text-foreground">Reason: </span>
                    {req.reason}
                  </p>

                  {req.status === 'pending' && (
                    <div className="mt-3">
                      <label htmlFor={`comment-${req.id}`} className="label">
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquare size={13} className="text-text-tertiary" />
                          Remarks (optional)
                        </span>
                      </label>
                      <input
                        id={`comment-${req.id}`}
                        className="input mt-1"
                        placeholder="Add a note recorded with your decision…"
                        value={comments[req.id] ?? ''}
                        onChange={(e) => setComment(req.id, e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {req.status === 'pending' ? (
                    <div className="flex gap-2 lg:flex-col lg:w-40">
                      <button
                        onClick={() => handleDecision(req, 'approved')}
                        className="btn-primary flex-1 justify-center"
                      >
                        <Check size={16} /> Approve
                      </button>
                      <button
                        onClick={() => handleDecision(req, 'rejected')}
                        className="btn-destructive flex-1 justify-center"
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-micro font-semibold',
                        req.status === 'approved'
                          ? 'bg-success-soft text-success'
                          : 'bg-destructive-soft text-destructive',
                      )}
                    >
                      {req.status === 'approved' ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                      Decision logged
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </SectionCard>
      </>
      )}
    </div>
  );
};
