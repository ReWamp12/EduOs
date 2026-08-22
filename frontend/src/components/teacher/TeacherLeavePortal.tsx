'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore, applyForLeave, LeaveRequest } from '@/lib/store';
import { PageHeader, SectionCard, Card, StatCard, Badge, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  FileText,
  UserCheck,
  Building2,
  CalendarCheck,
  X,
  Send,
} from 'lucide-react';

const LEAVE_TYPES = [
  'Casual Leave',
  'Medical Leave',
  'Academic / Workshop Duty',
  'Earned Leave',
  'Emergency Leave',
];

const TEACHER_COLLEAGUES = [
  'Mrs. Sunita Rao (Science HOD · Science Lab 1)',
  'Dr. A. K. Banerjee (Physics Faculty · Lab 2)',
  'Mr. Rajesh Singh (Physical Education Director)',
  'Ms. Pooja Mehra (English Department)',
  'Mr. Vikram Malhotra (Computer Science Lab)',
];

export const TeacherLeavePortal: React.FC = () => {
  const { leaveRequests } = useAppStore();
  const teacherName = 'Prof. Amit Verma';
  const teacherDesignation = 'HOD Mathematics (Class 9 & 10)';

  const myLeaves = useMemo(() => {
    return leaveRequests.filter(
      (l) => l.employeeName.toLowerCase().trim() === teacherName.toLowerCase().trim(),
    );
  }, [leaveRequests]);

  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isApplying, setIsApplying] = useState(false);

  // Clean Form State
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [reason, setReason] = useState('');
  const [substitutionTeacher, setSubstitutionTeacher] = useState(TEACHER_COLLEAGUES[0]);
  const [submitting, setSubmitting] = useState(false);

  // Calculate days duration
  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  }, [startDate, endDate]);

  const counts = useMemo(
    () => ({
      pending: myLeaves.filter((l) => l.status === 'pending').length,
      approved: myLeaves.filter((l) => l.status === 'approved').length,
      rejected: myLeaves.filter((l) => l.status === 'rejected').length,
    }),
    [myLeaves],
  );

  const visibleLeaves = useMemo(() => {
    if (filter === 'all') return myLeaves;
    return myLeaves.filter((l) => l.status === filter);
  }, [myLeaves, filter]);

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast('Reason Required', 'warning', 'Please provide a reason for the leave application.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      applyForLeave({
        employeeName: teacherName,
        designation: teacherDesignation,
        leaveType,
        startDate,
        endDate,
        daysCount: calculatedDays,
        reason: reason.trim(),
        substitutionTeacher,
      });

      setSubmitting(false);
      setIsApplying(false);
      setReason('');

      toast(
        'Leave Application Submitted',
        'success',
        `Application for ${calculatedDays} day(s) of ${leaveType} submitted to Principal for review.`,
      );
    }, 400);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Staff Leave Application & History"
          subtitle={
            <>
              Faculty: <span className="font-semibold text-foreground">{teacherName}</span> · {teacherDesignation}
            </>
          }
        />

        <button onClick={() => setIsApplying(true)} className="btn-primary gap-1.5 self-start sm:self-auto shadow-sm">
          <Plus size={16} /> Apply for Leave
        </button>
      </div>

      {/* Summary Status Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting Principal Review"
          value={counts.pending}
          tone="warning"
          icon={<Clock size={16} />}
          hint={counts.pending > 0 ? 'Pending sign-off' : 'No pending applications'}
        />
        <StatCard
          label="Authorized & Approved"
          value={counts.approved}
          tone="success"
          icon={<CheckCircle2 size={16} />}
          hint="Approved leaves"
        />
        <StatCard
          label="Declined"
          value={counts.rejected}
          tone="destructive"
          icon={<XCircle size={16} />}
          hint="Declined applications"
        />
      </div>

      {/* Leave History Section */}
      <SectionCard
        title="Leave Applications History"
        icon={<FileText size={18} />}
        action={
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface p-1 shadow-2xs">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-lg px-3 py-1 text-micro font-semibold transition-colors uppercase',
                  filter === f
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-text-secondary hover:bg-muted',
                )}
              >
                {f} ({f === 'all' ? myLeaves.length : counts[f]})
              </button>
            ))}
          </div>
        }
      >
        {visibleLeaves.length === 0 ? (
          <div className="p-8 text-center text-text-tertiary text-meta">
            No leave applications found for this filter.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleLeaves.map((leave) => (
              <Card
                key={leave.id}
                className={cn(
                  'p-5 rounded-2xl border transition-all shadow-xs flex flex-col gap-3',
                  leave.status === 'pending'
                    ? 'border-warning/40 bg-surface'
                    : leave.status === 'approved'
                    ? 'border-success/30 bg-surface'
                    : 'border-destructive/30 bg-surface',
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={cn(
                        'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                        leave.status === 'pending'
                          ? 'bg-warning-soft text-warning'
                          : leave.status === 'approved'
                          ? 'bg-success-soft text-success'
                          : 'bg-destructive-soft text-destructive',
                      )}
                    >
                      {leave.status === 'pending' && <Clock size={18} />}
                      {leave.status === 'approved' && <CheckCircle2 size={18} />}
                      {leave.status === 'rejected' && <XCircle size={18} />}
                    </span>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-section font-bold text-foreground">{leave.leaveType}</h4>
                        <Badge
                          tone={
                            leave.status === 'pending'
                              ? 'warning'
                              : leave.status === 'approved'
                              ? 'success'
                              : 'danger'
                          }
                          className="gap-1 font-semibold"
                        >
                          {leave.status === 'pending' && '⏳ Pending Review'}
                          {leave.status === 'approved' && '✓ Approved'}
                          {leave.status === 'rejected' && '✕ Declined'}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-micro text-text-tertiary">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-primary" />
                          <strong className="text-foreground">{leave.startDate}</strong> to <strong className="text-foreground">{leave.endDate}</strong> ({leave.daysCount || 1} day{leave.daysCount !== 1 ? 's' : ''})
                        </span>
                        <span>·</span>
                        <span>Applied: {leave.appliedAt}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason box */}
                <div className="rounded-xl border border-border bg-surface-muted/40 p-3 text-meta">
                  <p className="text-foreground"><strong className="text-text-secondary">Reason:</strong> {leave.reason}</p>

                  {leave.substitutionTeacher && (
                    <div className="mt-2 pt-2 border-t border-border/70 text-micro text-text-secondary flex items-center gap-1.5">
                      <UserCheck size={13} className="text-primary" />
                      <span>Class Substitution: <strong>{leave.substitutionTeacher}</strong></span>
                    </div>
                  )}
                </div>

                {/* Principal Decision Remarks (if reviewed) */}
                {leave.status !== 'pending' && leave.reviewComment && (
                  <div className="flex items-start gap-2 rounded-xl border border-border bg-surface p-2.5 text-meta">
                    <span className="mt-0.5 text-primary shrink-0">
                      <Building2 size={15} />
                    </span>
                    <div className="text-micro">
                      <span className="font-semibold text-text-secondary">Principal Remark: </span>
                      <span className="text-foreground font-medium">{leave.reviewComment}</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ========================================================================= */}
      {/* CLEAN MODAL: APPLY FOR LEAVE FORM */}
      {/* ========================================================================= */}
      {isApplying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-border bg-surface-muted px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
                  <CalendarCheck size={16} />
                </span>
                <div>
                  <h3 className="text-section font-semibold text-foreground">Apply for Leave</h3>
                  <p className="text-micro text-text-tertiary">Submitted to Principal for approval</p>
                </div>
              </div>

              <button
                onClick={() => setIsApplying(false)}
                disabled={submitting}
                className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Clean Form Body */}
            <form onSubmit={handleSubmitApplication} className="flex flex-1 flex-col overflow-y-auto p-6 gap-4 min-h-0">
              {/* Leave Type Dropdown */}
              <div>
                <label className="label">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="input font-medium"
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input font-bold"
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input font-bold"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface-muted/50 px-3 py-2 text-micro text-text-secondary flex items-center justify-between">
                <span>Duration:</span>
                <strong className="text-foreground">{calculatedDays} Day{calculatedDays !== 1 ? 's' : ''}</strong>
              </div>

              {/* Reason */}
              <div>
                <label className="label">Reason for Leave</label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for leave..."
                  className="input py-2"
                />
              </div>

              {/* Class Substitution */}
              <div>
                <label className="label">Class Substitution (Optional)</label>
                <select
                  value={substitutionTeacher}
                  onChange={(e) => setSubstitutionTeacher(e.target.value)}
                  className="input font-medium"
                >
                  {TEACHER_COLLEAGUES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border mt-1">
                <button
                  type="button"
                  onClick={() => setIsApplying(false)}
                  disabled={submitting}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary gap-1.5"
                >
                  <Send size={14} />
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
