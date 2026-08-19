'use client';

import React from 'react';
import { mockBatches, mockLeaveRequests } from '@/lib/mockData';
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
  const pendingLeaves = mockLeaveRequests.filter((l) => l.status === 'pending');

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
              <Badge tone="success">Ahmedabad Main Campus</Badge>
            </div>
            <p className="mt-1 text-body text-text-secondary">
              Executive Directorate · Dr. Rajesh Iyer · Session 2026–2027
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
          value="93.8%"
          tone="success"
          icon={<CalendarCheck size={16} />}
          trend={{ value: '+0.6%', direction: 'up' }}
          hint="103 of 110 students present"
        />
        <StatCard
          label="Staff On Duty"
          value={<>18<span className="text-base font-medium text-text-tertiary"> / 20</span></>}
          tone="info"
          icon={<Users size={16} />}
          hint="2 faculty on approved leave"
        />
        <StatCard
          label="Today's Fee Collection"
          value="₹2.45L"
          tone="warning"
          icon={<IndianRupee size={16} />}
          hint="14 term installment transactions"
        />
        <StatCard
          label="Pending Approvals"
          value={<>{pendingLeaves.length}<span className="text-base font-medium text-text-tertiary"> request</span></>}
          tone="primary"
          icon={<CheckCircle2 size={16} />}
          hint="Prof. Vikram Roy · casual leave"
          onClick={() => onNavigate('approvals')}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Batches */}
        <SectionCard title="Active Academic Batches" bodyClassName="flex flex-col gap-2.5">
          {mockBatches.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-4 py-3.5"
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
