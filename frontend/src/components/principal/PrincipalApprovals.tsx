'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore, updateLeaveStatus } from '@/lib/store';
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
} from 'lucide-react';

type Decision = 'approved' | 'rejected';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const statusTone: Record<LeaveRequest['status'], 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export const PrincipalApprovals: React.FC = () => {
  const { leaveRequests } = useAppStore();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<StatusFilter>('all');

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

  const handleDecision = (req: LeaveRequest, decision: Decision) => {
    const note = comments[req.id]?.trim();
    updateLeaveStatus(req.id, decision, note);

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

  const setComment = (id: string, value: string) =>
    setComments((prev) => ({ ...prev, [id]: value }));

  const filters: { key: StatusFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: leaveRequests.length },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff Leave Approvals Queue"
        subtitle="Executive authority sign-off for teaching & non-teaching staff"
      />

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
    </div>
  );
};
