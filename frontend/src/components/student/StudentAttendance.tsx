'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { mockCurrentStudent } from '@/lib/mockData';
import { dataService } from '@/lib/dataService';
import { PageHeader, StatCard, SectionCard, Badge, ProgressBar, Skeleton, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  CalendarCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Download,
  Percent,
  UserX,
} from 'lucide-react';

type DayStatus = 'present' | 'absent' | 'holiday';

interface AttendanceApiRecord {
  id: string;
  date: string;
  status: string;
  remarks?: string;
}

const MONTHS = [
  { value: '2026-06', label: 'June 2026' },
  { value: '2026-07', label: 'July 2026' },
  { value: '2026-08', label: 'August 2026' },
];

const subjectAttendance = [
  { subject: 'Physics (Mechanics & Rotational)', attended: 28, total: 29, pct: 96.5, tone: 'success' as const },
  { subject: 'Mathematics (Calculus & Functions)', attended: 27, total: 29, pct: 93.1, tone: 'success' as const },
  { subject: 'Physical Chemistry (Thermodynamics)', attended: 25, total: 28, pct: 89.2, tone: 'warning' as const },
  { subject: 'Organic Chemistry (Mechanisms)', attended: 22, total: 24, pct: 91.6, tone: 'success' as const },
  { subject: 'JEE Advanced Problem Solving Lab', attended: 14, total: 14, pct: 100.0, tone: 'primary' as const },
];

export const StudentAttendance: React.FC = () => {
  const student = mockCurrentStudent;
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [records, setRecords] = useState<AttendanceApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    dataService.getStudentAttendance(student.id).then((res) => {
      if (active) {
        setRecords(res as AttendanceApiRecord[]);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [student.id]);

  // Build a per-month register. Simulate absences on the 7th & 21st; Sundays are holidays.
  const daysInMonth: { day: number; status: DayStatus }[] = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const isAbsent = day === 7 || day === 21;
      const isSunday = day % 7 === 0;
      return {
        day,
        status: (isSunday ? 'holiday' : isAbsent ? 'absent' : 'present') as DayStatus,
      };
    });
  }, [selectedMonth]);

  const monthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label ?? 'August 2026';

  // History list derived from the register plus any API records for the selected month.
  const historyList = useMemo(() => {
    const fromApi = records
      .filter((r) => r.date.startsWith(selectedMonth))
      .map((r) => ({
        key: r.id,
        day: Number(r.date.slice(-2)),
        status: (r.status === 'present' ? 'present' : r.status === 'absent' ? 'absent' : 'present') as DayStatus,
        remarks: r.remarks ?? '',
      }));

    const fromRegister = daysInMonth
      .filter((d) => d.status !== 'holiday')
      .map((d) => ({
        key: `${selectedMonth}-${d.day}`,
        day: d.day,
        status: d.status,
        remarks: d.status === 'absent' ? 'Marked absent · parent notified' : 'On time',
      }));

    const apiDays = new Set(fromApi.map((r) => r.day));
    return [...fromApi, ...fromRegister.filter((r) => !apiDays.has(r.day))].sort((a, b) => b.day - a.day);
  }, [records, selectedMonth, daysInMonth]);

  const handleDownload = async () => {
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 700));
    setDownloading(false);
    toast('Attendance report downloaded', 'success', `${monthLabel} register exported as PDF.`);
  };

  const dayFormatLong = (day: number) =>
    new Date(`${selectedMonth}-${String(day).padStart(2, '0')}T00:00:00`).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance Analytics"
        subtitle={
          <>
            Batch: {student.batchName} · Roll <span className="font-semibold text-foreground">{student.rollNumber}</span>
          </>
        }
        actions={
          <>
            <Badge tone="success">
              <ShieldCheck size={14} /> Exam Eligible · 94.2% &gt; 75%
            </Badge>
            <button className="btn-secondary" onClick={handleDownload} disabled={downloading}>
              <Download size={16} /> {downloading ? 'Preparing…' : 'Download report'}
            </button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Overall Attendance"
          value="94.2%"
          tone="success"
          icon={<Percent size={16} />}
          trend={{ value: '+1.4%', direction: 'up' }}
          hint="116 of 124 lectures attended"
        />
        <StatCard
          label="Present Sessions"
          value="116"
          tone="primary"
          icon={<CheckCircle2 size={16} />}
          hint="Full-day credit recorded"
        />
        <StatCard
          label="Absent Sessions"
          value="8"
          tone="destructive"
          icon={<UserX size={16} />}
          hint="Alerts delivered to parent phone"
        />
        <StatCard
          label="Leaves Remaining"
          value={<>23<span className="text-base font-medium text-text-tertiary"> days</span></>}
          tone="warning"
          icon={<CalendarCheck size={16} />}
          hint="Before falling below 75% threshold"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* Subject breakdown */}
        <SectionCard title="Subject-Wise Breakdown" icon={<CalendarCheck size={18} />} bodyClassName="flex flex-col gap-5">
          {subjectAttendance.map((item, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 text-meta">
                <span className="font-semibold text-foreground">{item.subject}</span>
                <span className="shrink-0 font-semibold text-text-secondary">
                  {item.attended}/{item.total}{' '}
                  <span className={cn(item.tone === 'warning' ? 'text-warning' : 'text-success')}>({item.pct}%)</span>
                </span>
              </div>
              <ProgressBar value={item.pct} tone={item.tone} />
            </div>
          ))}
        </SectionCard>

        {/* Monthly calendar + filter */}
        <SectionCard
          title={`${monthLabel} Register`}
          icon={<CalendarDays size={18} />}
          action={
            <select
              className="input h-9 py-0 text-meta"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Select month"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          }
          bodyClassName="flex flex-col gap-4"
        >
          <div className="flex items-center gap-4 text-micro">
            <span className="inline-flex items-center gap-1.5 text-success">
              <CheckCircle2 size={13} /> Present
            </span>
            <span className="inline-flex items-center gap-1.5 text-destructive">
              <XCircle size={13} /> Absent
            </span>
            <span className="inline-flex items-center gap-1.5 text-text-tertiary">
              <span className="h-2.5 w-2.5 rounded-sm bg-muted" /> Holiday
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} className="pb-1 text-micro font-bold text-text-tertiary">
                {day}
              </div>
            ))}
            {daysInMonth.map((d) => (
              <div
                key={d.day}
                className={cn(
                  'grid place-items-center rounded-md border py-2 text-micro font-bold',
                  d.status === 'present' && 'border-success/25 bg-success-soft text-success',
                  d.status === 'absent' && 'border-destructive/30 bg-destructive-soft text-destructive',
                  d.status === 'holiday' && 'border-transparent bg-muted text-text-tertiary',
                )}
              >
                {d.day}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* History list */}
      <SectionCard
        title={`Daily History · ${monthLabel}`}
        icon={<CalendarCheck size={18} />}
        action={<Badge tone="neutral">{historyList.length} records</Badge>}
        bodyClassName="p-0"
      >
        {loading ? (
          <div className="flex flex-col gap-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((r) => (
                  <tr key={r.key}>
                    <td className="font-medium text-foreground">{dayFormatLong(r.day)}</td>
                    <td>
                      {r.status === 'present' ? (
                        <Badge tone="success">
                          <CheckCircle2 size={12} /> Present
                        </Badge>
                      ) : (
                        <Badge tone="danger">
                          <XCircle size={12} /> Absent
                        </Badge>
                      )}
                    </td>
                    <td className="text-text-secondary">{r.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};
