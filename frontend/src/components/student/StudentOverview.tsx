'use client';

import React, { useState, useEffect } from 'react';
import { dataService } from '@/lib/dataService';
import { Student } from '@/lib/types';
import { mockAssignments, mockExamResults, mockTimetable } from '@/lib/mockData';
import { StatCard, SectionCard, Badge, Skeleton, SkeletonCard } from '@/components/ui';
import {
  Clock,
  Trophy,
  Flame,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Award,
  CalendarDays,
} from 'lucide-react';

export const StudentOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    dataService.getStudentOverview('s-1').then((res) => {
      if (active) {
        setStudent(res);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading || !student) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  const pendingAssignments = mockAssignments.filter((a) => a.status === 'pending');
  const latestExam = mockExamResults[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div
          className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          style={{ background: 'linear-gradient(120deg, var(--primary-soft), var(--surface) 62%)' }}
        >
          <div className="flex items-center gap-4">
            <img
              src={student.avatarUrl}
              alt={student.name}
              className="h-16 w-16 rounded-lg object-cover ring-2 ring-surface shadow-sm"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-title text-foreground">Welcome back, {student.name.split(' ')[0]}</h2>
                <Badge tone="warning">
                  <Flame size={12} /> 14-day streak
                </Badge>
              </div>
              <p className="mt-1 text-body text-text-secondary">
                {student.batchName} · Roll{' '}
                <span className="font-semibold text-foreground">{student.rollNumber}</span> · Target{' '}
                <span className="font-semibold text-primary">{student.targetExam}</span>
              </p>
            </div>
          </div>
          <button onClick={() => onNavigate('id_card')} className="btn-primary shrink-0 self-start sm:self-auto">
            <Award size={16} /> View Digital ID
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Attendance Rate"
          value={`${student.attendancePct}%`}
          tone="success"
          icon={<CheckCircle2 size={16} />}
          trend={{ value: '+1.4%', direction: 'up' }}
          hint="Eligible for board exam (>75% required)"
        />
        <StatCard
          label="Batch Standing"
          value={<>Rank #{student.rankInBatch}<span className="text-base font-medium text-text-tertiary"> / 38</span></>}
          tone="warning"
          icon={<Trophy size={16} />}
          hint="Top 8% in All-India mock tests"
        />
        <StatCard
          label="Pending Homework"
          value={<>{pendingAssignments.length}<span className="text-base font-medium text-text-tertiary"> DPP due</span></>}
          tone="info"
          icon={<BookOpen size={16} />}
          hint="Physics Work-Energy due tomorrow"
          onClick={() => onNavigate('assignments')}
        />
        <StatCard
          label="Next Mock Test"
          value={<span className="text-xl">Sun · 09:00 AM</span>}
          tone="primary"
          icon={<CalendarDays size={16} />}
          hint="All-India CBT Mock Test 04"
          onClick={() => onNavigate('exams')}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Timetable */}
        <SectionCard
          title="Today's Lecture Schedule"
          icon={<Clock size={18} />}
          action={<Badge tone="primary">Monday</Badge>}
          bodyClassName="p-3"
        >
          <div className="flex flex-col gap-1.5">
            {mockTimetable.map((slot, index) => (
              <div
                key={slot.id}
                className={[
                  'flex items-center justify-between gap-3 rounded-md border px-3 py-3 transition-colors',
                  index === 0 ? 'border-primary/25 bg-primary-soft' : 'border-transparent hover:bg-surface-muted',
                ].join(' ')}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-micro font-bold text-white"
                    style={{ background: slot.subjectColor }}
                  >
                    P{slot.periodNumber}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-meta font-semibold text-foreground">{slot.subjectName}</div>
                    <div className="truncate text-micro text-text-tertiary">
                      {slot.teacherName} · {slot.roomNumber}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-micro font-semibold text-foreground">{slot.startTime}</div>
                  {index === 0 ? (
                    <Badge tone="success" className="mt-1">Up next</Badge>
                  ) : (
                    <div className="text-micro text-text-tertiary">{slot.endTime}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* AI diagnostic */}
        <SectionCard title="AI Diagnostic Summary" icon={<Sparkles size={18} />} bodyClassName="flex flex-col gap-4">
          <div className="rounded-md border border-warning/20 bg-warning-soft p-4">
            <div className="text-micro font-semibold uppercase tracking-wide text-warning">
              Latest: {latestExam.examTitle}
            </div>
            <p className="mt-1.5 text-meta leading-relaxed text-text-secondary">
              &ldquo;{latestExam.mistakeSummary}&rdquo;
            </p>
          </div>

          <div>
            <div className="eyebrow mb-2">Action areas this week</div>
            <div className="flex flex-col gap-1.5">
              {latestExam.weakTopics.map((topic, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-2 text-meta text-foreground"
                >
                  <AlertCircle size={14} className="shrink-0 text-destructive" />
                  <span className="truncate">{topic}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => onNavigate('exams')} className="btn-secondary mt-auto w-full">
            Detailed scorecard & AI review <ChevronRight size={16} />
          </button>
        </SectionCard>
      </div>
    </div>
  );
};
