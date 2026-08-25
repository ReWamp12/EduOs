'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { teacherBatches } from '@/lib/batchData';
import { Batch, LeaveRequest } from '@/lib/types';
import { StatCard, SectionCard, Badge } from '@/components/ui';
import {
  Users,
  IndianRupee,
  CheckCircle2,
  ShieldAlert,
  CalendarCheck,
  ChevronRight,
  FileCheck2,
} from 'lucide-react';

export const PrincipalOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { session } = useAuth();
  const [batches, setBatches] = useState<Batch[]>(teacherBatches);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      dataService.getBatches(),
      dataService.getLeaveRequests(),
    ]).then(([bRes, lRes]) => {
      if (active) {
        if (bRes && bRes.length > 0) setBatches(bRes);
        if (lRes && lRes.length > 0) setLeaveRequests(lRes);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending');
  const principalName = session ? `${session.firstName} ${session.lastName}`.trim() : 'Asha Rao';

  const compliance = [
    { label: 'Fire Safety NOC', status: 'Valid · Nov 2026' },
    { label: 'Building Stability Certificate', status: 'Compliant' },
    { label: 'POCSO & Child Protection Committee', status: 'Constituted' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div
          className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          style={{ background: 'linear-gradient(120deg, var(--success-soft), var(--surface) 62%)' }}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-title text-foreground">Operations Command Center</h2>
              <Badge tone="success">Main Campus · Delhi</Badge>
            </div>
            <p className="mt-1 text-body text-text-secondary">
              Executive Directorate · {principalName} (Principal) · Session 2026–2027
            </p>
          </div>
          <button onClick={() => onNavigate('inspection_mode')} className="btn-primary shrink-0 self-start sm:self-auto">
            <FileCheck2 size={16} /> Board Inspection Mode
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Morning Attendance"
          value="94.2%"
          tone="success"
          icon={<CalendarCheck size={16} />}
          trend={{ value: '+0.8%', direction: 'up' }}
          hint="Class 10-A verified · View Directory"
          onClick={() => onNavigate('students')}
        />
        <StatCard
          label="Staff On Duty"
          value={<>5<span className="text-base font-medium text-text-tertiary"> / 5</span></>}
          tone="info"
          icon={<Users size={16} />}
          hint="5 Faculty active in Session"
        />
        <StatCard
          label="Today's Fee Collection"
          value="₹2.45L"
          tone="warning"
          icon={<IndianRupee size={16} />}
          hint="Term 1 installment transactions"
        />
        <StatCard
          label="Pending Approvals"
          value={<>{pendingLeaves.length}<span className="text-base font-medium text-text-tertiary"> request{pendingLeaves.length === 1 ? '' : 's'}</span></>}
          tone="primary"
          icon={<CheckCircle2 size={16} />}
          hint={pendingLeaves[0] ? `${pendingLeaves[0].employeeName} · ${pendingLeaves[0].leaveType}` : 'All requests cleared'}
          onClick={() => onNavigate('approvals')}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Batches */}
        <SectionCard
          title="Active Academic Batches"
          action={
            <button onClick={() => onNavigate('students')} className="btn-secondary py-1 px-2.5 text-micro">
              <Users size={13} /> View All Student Profiles
            </button>
          }
          bodyClassName="flex flex-col gap-2.5"
        >
          {batches.map((b) => (
            <div
              key={b.id}
              onClick={() => onNavigate('students')}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-4 py-3.5 hover:border-primary/40 cursor-pointer transition-colors"
            >
              <div className="min-w-0">
                <div className="truncate text-meta font-semibold text-foreground">{b.name}</div>
                <div className="mt-0.5 truncate text-micro text-text-tertiary">
                  Mentor {b.mentorTeacherName} · {b.roomNumber}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-meta font-semibold text-foreground">
                  {b.studentCount}<span className="text-text-tertiary"> / {b.capacity}</span>
                </div>
                <Badge tone="neutral" className="mt-1">{b.targetExam}</Badge>
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Compliance pulse */}
        <SectionCard
          title="Statutory Compliance Pulse"
          icon={<ShieldAlert size={18} />}
          bodyClassName="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-2">
            {compliance.map((c) => (
              <div
                key={c.label}
                className="flex items-center justify-between gap-2 rounded-md border border-success/20 bg-success-soft px-3.5 py-2.5"
              >
                <span className="text-meta text-foreground">{c.label}</span>
                <Badge tone="success">{c.status}</Badge>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate('inspection_mode')} className="btn-secondary mt-auto w-full">
            Launch inspection dossier <ChevronRight size={16} />
          </button>
        </SectionCard>
      </div>
    </div>
  );
};
