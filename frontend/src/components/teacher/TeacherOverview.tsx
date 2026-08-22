'use client';

import React from 'react';
import { mockProfiles } from '@/lib/mockData';
import { useTeacherBatch } from '@/lib/teacherContext';
import { timetableForBatch } from '@/lib/batchData';
import { StatCard, SectionCard, Badge, EmptyState } from '@/components/ui';
import { TeacherInbox } from './TeacherInbox';
import { TimetableSlot } from '@/lib/types';
import {
  CalendarCheck2,
  Sparkles,
  ClipboardList,
  Clock,
  ChevronRight,
  GraduationCap,
  Users,
  CalendarOff,
} from 'lucide-react';

export const TeacherOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const teacher = mockProfiles.teacher;
  const { batch, students, batches } = useTeacherBatch();
  const slots: TimetableSlot[] = batch?.id ? timetableForBatch(batch.id) : [];
  const avgAttendance = students.length
    ? (students.reduce((a, s) => a + s.attendancePct, 0) / students.length).toFixed(1)
    : '—';

  const batchShortName = batch?.name ? batch.name.split(' - ')[0].split(' — ')[0] : 'No Batch';

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div
          className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          style={{ background: 'linear-gradient(120deg, var(--secondary-soft), var(--surface) 62%)' }}
        >
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-primary text-primary-foreground font-semibold text-xl ring-2 ring-surface shadow-sm">
              {teacher?.firstName ? teacher.firstName[0] : 'T'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-title text-foreground">
                  Welcome, {teacher?.firstName || 'Faculty'} {teacher?.lastName || ''}
                </h2>
                <Badge tone="primary">{batchShortName}</Badge>
              </div>
              <p className="mt-1 text-body text-text-secondary">
                Mentor · <span className="font-semibold text-foreground">{batch?.name || 'No Batch Assigned'}</span> · {batch?.targetExam || ''}
              </p>
            </div>
          </div>
          <button onClick={() => onNavigate('ai_question_studio')} className="btn-primary shrink-0 self-start sm:self-auto">
            <Sparkles size={16} /> AI Question Studio
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students in Class"
          value={students.length}
          tone="info"
          icon={<Users size={16} />}
          hint={`${batchShortName} · View Roster`}
          onClick={() => onNavigate('students')}
        />
        <StatCard
          label="Today's Lectures"
          value={<>{slots.length}<span className="text-base font-medium text-text-tertiary"> periods</span></>}
          tone="primary"
          icon={<Clock size={16} />}
          hint={slots[0] ? `${slots[0].startTime} · ${slots[0].roomNumber}` : 'No lectures today'}
        />
        <StatCard
          label="Avg Attendance"
          value={<>{avgAttendance}<span className="text-base font-medium text-text-tertiary">%</span></>}
          tone="success"
          icon={<CalendarCheck2 size={16} />}
          hint="Class average this term"
          onClick={() => onNavigate('attendance')}
        />
        <StatCard
          label="My Classes"
          value={batches.length}
          tone="warning"
          icon={<GraduationCap size={16} />}
          hint="Batches you teach"
        />
      </div>

      {/* Cross-role inbox — parent PTM requests + student submissions (this batch) */}
      <TeacherInbox />

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Today's classes */}
        <SectionCard
          title="Today's Assigned Classes"
          icon={<Clock size={18} />}
          action={<Badge tone="primary">Monday</Badge>}
          bodyClassName="flex flex-col gap-2.5"
        >
          {slots.length === 0 ? (
            <EmptyState
              icon={<CalendarOff size={22} />}
              title="No lectures scheduled"
              description="This class has no periods scheduled today."
            />
          ) : (
            slots.map((slot: TimetableSlot, i: number) => (
              <div
                key={slot.id}
                className={[
                  'flex items-center justify-between gap-3 rounded-md border px-4 py-3.5',
                  i === 0 ? 'border-primary/25 bg-primary-soft' : 'border-border bg-surface-muted',
                ].join(' ')}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-micro font-bold text-white"
                    style={{ background: slot.subjectColor || '#2563EB' }}
                  >
                    P{slot.periodNumber}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-meta font-semibold text-foreground">{slot.subjectName}</div>
                    <div className="mt-0.5 truncate text-micro text-text-tertiary">
                      {slot.roomNumber} · {slot.startTime} – {slot.endTime}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('attendance')}
                  className="inline-flex shrink-0 items-center gap-1 text-meta font-medium text-primary hover:underline"
                >
                  Take Attendance <ChevronRight size={14} />
                </button>
              </div>
            ))
          )}
        </SectionCard>

        {/* Quick action card */}
        <SectionCard title="Batch Actions" icon={<ClipboardList size={18} />}>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onNavigate('attendance')}
              className="flex items-center justify-between rounded-md border border-border bg-surface p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/50"
            >
              <div>
                <div className="text-meta font-semibold text-foreground">Mark Attendance</div>
                <div className="text-micro text-text-tertiary">Log daily period presence & sync alerts</div>
              </div>
              <ChevronRight size={16} className="text-text-tertiary" />
            </button>
            <button
              onClick={() => onNavigate('assignments')}
              className="flex items-center justify-between rounded-md border border-border bg-surface p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/50"
            >
              <div>
                <div className="text-meta font-semibold text-foreground">Create Assignment</div>
                <div className="text-micro text-text-tertiary">Distribute homework, DPPs, and practical sheets</div>
              </div>
              <ChevronRight size={16} className="text-text-tertiary" />
            </button>
            <button
              onClick={() => onNavigate('consent')}
              className="flex items-center justify-between rounded-md border border-border bg-surface p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/50"
            >
              <div>
                <div className="text-meta font-semibold text-foreground">Dispatch Consent Form</div>
                <div className="text-micro text-text-tertiary">Publish field trip & remedial permissions</div>
              </div>
              <ChevronRight size={16} className="text-text-tertiary" />
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};
