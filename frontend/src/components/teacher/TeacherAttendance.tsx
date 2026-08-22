'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore, saveAttendanceSession, AttendanceEntry } from '@/lib/store';
import { useTeacherBatch } from '@/lib/teacherContext';
import {
  Send,
  Users,
  CheckCheck,
  CalendarCheck2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Search,
  UserX,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { PageHeader, SectionCard, StatCard, Card, Badge, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';

type Status = 'present' | 'absent' | 'late' | 'medical';
type ViewMode = 'daily' | 'calendar' | 'defaulters';

const STATUS_CONFIG: Record<
  Status,
  { label: string; short: string; badgeTone: 'success' | 'danger' | 'warning' | 'info'; activeClass: string }
> = {
  present: { label: 'Present', short: 'P', badgeTone: 'success', activeClass: 'bg-success text-white shadow-2xs' },
  absent: { label: 'Absent', short: 'A', badgeTone: 'danger', activeClass: 'bg-destructive text-white shadow-2xs' },
  late: { label: 'Late', short: 'L', badgeTone: 'warning', activeClass: 'bg-warning text-white shadow-2xs' },
  medical: { label: 'Medical', short: 'M', badgeTone: 'info', activeClass: 'bg-info text-white shadow-2xs' },
};

const PERIODS = [
  { id: 'p1', name: 'Period 1 (08:30 – 09:15 AM)', subject: 'Mathematics' },
  { id: 'p2', name: 'Period 2 (09:15 – 10:00 AM)', subject: 'Physics Lab' },
  { id: 'p3', name: 'Period 3 (10:15 – 11:00 AM)', subject: 'Chemistry' },
  { id: 'p4', name: 'Period 4 (11:00 – 11:45 AM)', subject: 'Computer Science' },
  { id: 'p5', name: 'Period 5 (12:30 – 01:15 PM)', subject: 'Physical Education' },
];

export const TeacherAttendance: React.FC = () => {
  const { batch, students } = useTeacherBatch();
  const { attendanceSessions } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0], // e.g. "2026-08-20"
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string>('p1');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Local draft changes before saving
  const [draftStatuses, setDraftStatuses] = useState<Record<string, Status>>({});
  const [draftRemarks, setDraftRemarks] = useState<Record<string, string>>({});

  // Active saved session for currently selected batch, date and period
  const activeSavedSession = useMemo(() => {
    return attendanceSessions.find(
      (s) => s.batchId === batch.id && s.date === selectedDate && s.periodId === selectedPeriod,
    );
  }, [attendanceSessions, batch.id, selectedDate, selectedPeriod]);

  // Helper to get status of a student (from draft, or from saved session, or default 'present')
  const getStudentStatus = (studentId: string): Status => {
    const key = `${selectedDate}_${selectedPeriod}_${studentId}`;
    if (draftStatuses[key]) return draftStatuses[key];

    if (activeSavedSession) {
      const rec = activeSavedSession.records.find((r) => r.studentId === studentId);
      if (rec) return rec.status;
    }
    return 'present';
  };

  const getStudentRemark = (studentId: string): string => {
    const key = `${selectedDate}_${selectedPeriod}_${studentId}`;
    if (draftRemarks[key] !== undefined) return draftRemarks[key];

    if (activeSavedSession) {
      const rec = activeSavedSession.records.find((r) => r.studentId === studentId);
      if (rec?.remarks) return rec.remarks;
    }
    return '';
  };

  const handleSetStatus = (studentId: string, status: Status) => {
    const key = `${selectedDate}_${selectedPeriod}_${studentId}`;
    setDraftStatuses((prev) => ({ ...prev, [key]: status }));
  };

  const handleSetRemark = (studentId: string, remark: string) => {
    const key = `${selectedDate}_${selectedPeriod}_${studentId}`;
    setDraftRemarks((prev) => ({ ...prev, [key]: remark }));
  };

  const markAllPresent = () => {
    setDraftStatuses((prev) => {
      const next = { ...prev };
      students.forEach((s) => {
        next[`${selectedDate}_${selectedPeriod}_${s.id}`] = 'present';
      });
      return next;
    });
    toast('All Marked Present', 'info', `Marked all ${students.length} students as Present.`);
  };

  // Date Navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Derived Daily Counts
  const { presentCount, absentCount, lateCount, medicalCount, turnoutPct } = useMemo(() => {
    let p = 0, a = 0, l = 0, m = 0;
    students.forEach((s) => {
      const st = getStudentStatus(s.id);
      if (st === 'present') p++;
      else if (st === 'absent') a++;
      else if (st === 'late') l++;
      else if (st === 'medical') m++;
    });
    const total = students.length || 1;
    const turnout = Math.round(((p + l + m) / total) * 100);
    return { presentCount: p, absentCount: a, lateCount: l, medicalCount: m, turnoutPct: turnout };
  }, [students, draftStatuses, activeSavedSession, selectedDate, selectedPeriod]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.admissionNumber?.toLowerCase().includes(q),
    );
  }, [students, searchQuery]);

  // CBSE Defaulters (<75% Attendance)
  const defaulters = useMemo(() => {
    return students.filter((s) => s.attendancePct < 75);
  }, [students]);

  // Save Attendance to Store
  const handleSubmit = () => {
    setSubmitting(true);
    const activePeriodObj = PERIODS.find((p) => p.id === selectedPeriod) || PERIODS[0];

    const records: AttendanceEntry[] = students.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      rollNumber: s.rollNumber,
      status: getStudentStatus(s.id),
      remarks: getStudentRemark(s.id),
    }));

    setTimeout(() => {
      saveAttendanceSession({
        batchId: batch.id,
        batchName: batch.name,
        date: selectedDate,
        periodId: selectedPeriod,
        periodName: activePeriodObj.name.split(' (')[0],
        markedBy: 'Prof. Amit Verma',
        records,
      });

      setSubmitting(false);
      const notified = absentCount + lateCount;
      toast(
        'Attendance Saved & Synced',
        'success',
        `${presentCount} Present · ${absentCount} Absent recorded for ${selectedDate}. Real-time alerts dispatched${notified ? ` to ${notified} parents` : ''}.`,
      );
    }, 400);
  };

  // Export CSV Sheet
  const handleExportCSV = () => {
    try {
      const activePeriodObj = PERIODS.find((p) => p.id === selectedPeriod) || PERIODS[0];
      const headers = ['Roll Number', 'Student Name', 'Admission No', 'Date', 'Period', 'Status', 'Attendance %', 'Teacher Remarks'];
      const rows = students.map((s) => [
        `"${s.rollNumber}"`,
        `"${s.name}"`,
        `"${s.admissionNumber || 'N/A'}"`,
        `"${selectedDate}"`,
        `"${activePeriodObj.name}"`,
        `"${getStudentStatus(s.id).toUpperCase()}"`,
        `"${s.attendancePct}%"`,
        `"${getStudentRemark(s.id)}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Attendance_${batch.name.replace(/\s+/g, '_')}_${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Attendance Sheet Downloaded', 'success', `Exported register for ${students.length} students.`);
    } catch {
      toast('Export Failed', 'error');
    }
  };

  // Generate calendar days for current month (August 2026) using real recorded sessions
  const calendarDays = useMemo(() => {
    const current = new Date(selectedDate);
    const year = current.getFullYear();
    const month = current.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let day = 1; day <= numDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, day).getDay(); // 0 = Sun, 6 = Sat
      const isSunday = dayOfWeek === 0;
      const isSecondSaturday = dayOfWeek === 6 && day > 7 && day <= 14;
      const isHoliday = isSunday || isSecondSaturday;

      // Find real recorded sessions on this date for this batch
      const sessionsForDay = attendanceSessions.filter(
        (s) => s.batchId === batch.id && s.date === dateStr,
      );

      let turnout: number | null = null;
      let presentTotal = 0;
      let totalEnrolled = students.length;

      if (sessionsForDay.length > 0) {
        const latest = sessionsForDay[0];
        presentTotal = latest.records.filter((r) => r.status !== 'absent').length;
        turnout = Math.round((presentTotal / (totalEnrolled || 1)) * 100);
      }

      days.push({
        day,
        dateStr,
        dayOfWeek,
        isHoliday,
        turnout,
        presentTotal,
        totalEnrolled,
        hasRecordedSession: sessionsForDay.length > 0,
        isToday: dateStr === new Date().toISOString().split('T')[0],
        isSelected: dateStr === selectedDate,
      });
    }
    return days;
  }, [selectedDate, attendanceSessions, batch.id, students.length]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Class Attendance & Register"
          subtitle={
            <>
              {batch.name} · <span className="font-semibold text-foreground">Room {batch.roomNumber}</span> · {students.length} Students
            </>
          }
        />

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-border/80 bg-surface p-1.5 shadow-2xs">
          <button
            onClick={() => setViewMode('daily')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-meta font-semibold transition-colors',
              viewMode === 'daily'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-text-secondary hover:bg-muted',
            )}
          >
            <CalendarCheck2 size={15} /> Day Register
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-meta font-semibold transition-colors',
              viewMode === 'calendar'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-text-secondary hover:bg-muted',
            )}
          >
            <CalendarIcon size={15} /> Monthly Heatmap
          </button>
          <button
            onClick={() => setViewMode('defaulters')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-meta font-semibold transition-colors',
              viewMode === 'defaulters'
                ? 'bg-destructive text-white shadow-2xs'
                : 'text-text-secondary hover:bg-muted',
            )}
          >
            <AlertTriangle size={15} /> Shortage Defaulters ({defaulters.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: DAY REGISTER (DAILY ATTENDANCE) */}
      {/* ========================================================================= */}
      {viewMode === 'daily' && (
        <div className="flex flex-col gap-5">
          {/* Day & Period Control Toolbar */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            {/* Date Navigator */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevDay}
                className="grid h-9 w-9 place-items-center rounded-lg border border-border text-text-secondary hover:bg-muted hover:text-foreground"
                title="Previous Day"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-surface-muted/60 px-3 py-1.5">
                <CalendarIcon size={15} className="text-primary" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-meta font-bold text-foreground focus:outline-hidden"
                />
              </div>

              <button
                onClick={handleNextDay}
                className="grid h-9 w-9 place-items-center rounded-lg border border-border text-text-secondary hover:bg-muted hover:text-foreground"
                title="Next Day"
              >
                <ChevronRight size={16} />
              </button>

              <button
                onClick={handleToday}
                className="btn-secondary py-1.5 text-meta font-semibold"
              >
                Today
              </button>

              {activeSavedSession && (
                <Badge tone="success" className="ml-2 gap-1">
                  <CheckCircle2 size={12} /> Saved in Registry
                </Badge>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleExportCSV} className="btn-secondary gap-1.5 text-meta py-1.5">
                <Download size={14} /> Export CSV
              </button>
              <button onClick={markAllPresent} className="btn-secondary gap-1.5 text-meta py-1.5">
                <CheckCheck size={15} className="text-success" /> Mark All Present
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary gap-1.5 text-meta py-1.5 shadow-sm"
              >
                <Send size={14} /> {submitting ? 'Saving…' : 'Save & Alert Parents'}
              </button>
            </div>
          </div>

          {/* Period Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {PERIODS.map((period) => {
              const isRecorded = attendanceSessions.some(
                (s) => s.batchId === batch.id && s.date === selectedDate && s.periodId === period.id,
              );

              return (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-meta transition-all',
                    selectedPeriod === period.id
                      ? 'border-primary bg-primary-soft text-primary font-bold shadow-2xs ring-1 ring-primary/30'
                      : 'border-border bg-surface text-text-secondary hover:bg-muted',
                  )}
                >
                  <Clock size={14} />
                  <span>{period.name}</span>
                  {isRecorded && (
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-success text-white text-[9px]">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Turnout KPI Stat Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard
              label="Turnout Rate"
              value={`${turnoutPct}%`}
              tone={turnoutPct >= 90 ? 'success' : turnoutPct >= 75 ? 'warning' : 'destructive'}
              icon={<CalendarCheck2 size={16} />}
              hint={`${presentCount + lateCount + medicalCount} of ${students.length} present`}
            />
            <StatCard
              label="Present"
              value={presentCount}
              tone="success"
              icon={<UserCheck size={16} />}
            />
            <StatCard
              label="Absent"
              value={absentCount}
              tone="destructive"
              icon={<UserX size={16} />}
              hint={absentCount > 0 ? 'Parent alert ready' : '0 absentees'}
            />
            <StatCard
              label="Late Arrival"
              value={lateCount}
              tone="warning"
              icon={<Clock size={16} />}
            />
            <StatCard
              label="Medical / Leave"
              value={medicalCount}
              tone="info"
              icon={<Sparkles size={16} />}
            />
          </div>

          {/* Student Daily Attendance Roster Table */}
          <SectionCard
            title={`Attendance Roster for ${new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}`}
            icon={<Users size={18} />}
            action={
              <div className="relative w-64">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search roll no or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input h-8 pl-8 text-meta"
                />
              </div>
            }
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th className="w-16 text-center">Roll No</th>
                    <th>Student Details</th>
                    <th>Term Avg</th>
                    <th className="text-center">Status</th>
                    <th>Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((student) => {
                    const currentStatus = getStudentStatus(student.id);
                    const currentRemark = getStudentRemark(student.id);

                    return (
                      <tr
                        key={student.id}
                        className={cn(
                          'transition-colors',
                          currentStatus === 'absent'
                            ? 'bg-destructive-soft/30'
                            : currentStatus === 'late'
                            ? 'bg-warning-soft/20'
                            : currentStatus === 'medical'
                            ? 'bg-info-soft/20'
                            : 'hover:bg-muted/40',
                        )}
                      >
                        {/* Roll Number */}
                        <td className="text-center font-mono font-bold text-foreground">
                          {student.rollNumber}
                        </td>

                        {/* Student Name & Avatar */}
                        <td>
                          <div className="flex items-center gap-3">
                            <img
                              src={student.avatarUrl}
                              alt={student.name}
                              className="h-9 w-9 rounded-lg object-cover ring-1 ring-border"
                            />
                            <div>
                              <div className="font-semibold text-foreground">{student.name}</div>
                              <div className="text-micro text-text-tertiary">
                                Guardian: {student.parentName} · {student.parentPhone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Term Attendance Percentage */}
                        <td>
                          <span
                            className={cn(
                              'font-mono font-bold text-meta',
                              student.attendancePct >= 90
                                ? 'text-success'
                                : student.attendancePct >= 75
                                ? 'text-warning'
                                : 'text-destructive',
                            )}
                          >
                            {student.attendancePct}%
                          </span>
                        </td>

                        {/* Period Status Toggle Buttons */}
                        <td>
                          <div className="flex justify-center">
                            <div className="inline-flex gap-1 rounded-xl border border-border/80 bg-surface-muted p-1">
                              {(['present', 'absent', 'late', 'medical'] as Status[]).map((st) => {
                                const active = currentStatus === st;
                                const cfg = STATUS_CONFIG[st];

                                return (
                                  <button
                                    key={st}
                                    onClick={() => handleSetStatus(student.id, st)}
                                    className={cn(
                                      'rounded-lg px-2.5 py-1 text-micro font-bold transition-all',
                                      active ? cfg.activeClass : 'text-text-secondary hover:bg-muted hover:text-foreground',
                                    )}
                                  >
                                    {cfg.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Remarks Input */}
                        <td>
                          <input
                            type="text"
                            placeholder={currentStatus === 'absent' ? 'e.g. Sick leave' : 'Optional teacher note'}
                            value={currentRemark}
                            onChange={(e) => handleSetRemark(student.id, e.target.value)}
                            className="input h-8 text-meta py-1 w-full max-w-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: MONTHLY ATTENDANCE CALENDAR & MATRIX HEATMAP */}
      {/* ========================================================================= */}
      {viewMode === 'calendar' && (
        <div className="flex flex-col gap-6">
          {/* Calendar Header Card */}
          <Card className="p-5 rounded-2xl border border-border shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
              <div>
                <h3 className="text-section font-bold text-foreground">
                  {new Date(selectedDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Attendance Heatmap
                </h3>
                <p className="text-micro text-text-secondary mt-0.5">
                  Reflects verified recorded sessions in the institutional registry. Click any date to mark/review.
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-micro">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-success" /> 90%+ High Turnout
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-warning" /> 75% - 89% Average
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-destructive" /> &lt;75% Low Turnout
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-muted border border-border" /> Unmarked / Holiday
                </span>
              </div>
            </div>

            {/* 7-Day Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 pt-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-micro font-bold uppercase text-text-tertiary pb-2">
                  {d}
                </div>
              ))}

              {calendarDays.map((cDay) => {
                const isSelected = cDay.isSelected;

                return (
                  <button
                    key={cDay.dateStr}
                    onClick={() => {
                      setSelectedDate(cDay.dateStr);
                      setViewMode('daily');
                      toast('Date Selected', 'info', `Switched day register to ${cDay.dateStr}.`);
                    }}
                    className={cn(
                      'flex flex-col items-center justify-between rounded-xl border p-2.5 min-h-[76px] transition-all text-left group',
                      isSelected
                        ? 'border-primary bg-primary-soft/50 ring-2 ring-primary shadow-sm'
                        : cDay.isHoliday
                        ? 'border-border/60 bg-surface-muted/40 opacity-70'
                        : cDay.turnout !== null
                        ? cDay.turnout >= 90
                          ? 'border-success/40 bg-success-soft/25 hover:border-success'
                          : cDay.turnout >= 75
                          ? 'border-warning/40 bg-warning-soft/25 hover:border-warning'
                          : 'border-destructive/40 bg-destructive-soft/25 hover:border-destructive'
                        : 'border-border bg-surface hover:border-border-strong',
                    )}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span
                        className={cn(
                          'text-meta font-bold',
                          cDay.isToday ? 'grid h-6 w-6 place-items-center rounded-full bg-primary text-white text-micro' : 'text-foreground',
                        )}
                      >
                        {cDay.day}
                      </span>
                      {cDay.isToday && <span className="text-[9px] font-bold uppercase text-primary">Today</span>}
                    </div>

                    <div className="w-full mt-2">
                      {cDay.isHoliday ? (
                        <span className="text-[10px] font-medium text-text-tertiary">Holiday</span>
                      ) : cDay.turnout !== null ? (
                        <div className="flex items-center justify-between w-full">
                          <span className={cn(
                            'text-micro font-bold',
                            cDay.turnout >= 90 ? 'text-success' : cDay.turnout >= 75 ? 'text-warning' : 'text-destructive',
                          )}>
                            {cDay.turnout}%
                          </span>
                          <span className="text-[10px] text-text-tertiary">
                            {cDay.presentTotal}/{cDay.totalEnrolled}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-text-tertiary font-medium">Unmarked</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Monthly Matrix Table */}
          <SectionCard title="Cumulative Monthly Attendance Matrix" icon={<FileSpreadsheet size={18} />} bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="data-table w-full text-center">
                <thead>
                  <tr>
                    <th className="text-left">Student</th>
                    {calendarDays.slice(0, 15).map((d) => (
                      <th key={d.day} className="px-1.5 text-center text-micro">
                        {d.day}
                      </th>
                    ))}
                    <th className="text-right">Term Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/40">
                      <td className="text-left font-semibold text-foreground py-2">
                        {student.rollNumber} · {student.name}
                      </td>
                      {calendarDays.slice(0, 15).map((d) => {
                        if (d.isHoliday) {
                          return (
                            <td key={d.day} className="text-micro text-text-disabled bg-surface-muted/30">
                              H
                            </td>
                          );
                        }

                        // Check if there is a recorded session on this date
                        const session = attendanceSessions.find(
                          (s) => s.batchId === batch.id && s.date === d.dateStr,
                        );

                        if (!session) {
                          return (
                            <td key={d.day} className="px-1.5 py-2 text-micro text-text-tertiary">
                              -
                            </td>
                          );
                        }

                        const rec = session.records.find((r) => r.studentId === student.id);
                        const st = rec?.status || 'present';

                        return (
                          <td key={d.day} className="px-1.5 py-2">
                            <span
                              className={cn(
                                'inline-block h-5 w-5 rounded-md text-[10px] font-bold leading-5',
                                st === 'absent'
                                  ? 'bg-destructive text-white'
                                  : st === 'late'
                                  ? 'bg-warning text-white'
                                  : st === 'medical'
                                  ? 'bg-info text-white'
                                  : 'bg-success/20 text-success font-semibold',
                              )}
                            >
                              {st === 'absent' ? 'A' : st === 'late' ? 'L' : st === 'medical' ? 'M' : 'P'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="text-right font-mono font-bold text-meta text-primary">
                        {student.attendancePct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 3: CBSE ATTENDANCE DEFAULTERS (<75%) */}
      {/* ========================================================================= */}
      {viewMode === 'defaulters' && (
        <div className="flex flex-col gap-5">
          {/* Statutory Warning Box */}
          <div className="rounded-2xl border border-destructive/30 bg-destructive-soft/20 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive text-white">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h4 className="text-meta font-bold text-foreground">
                  CBSE Examination Bye-Laws: 75% Mandatory Attendance Rule
                </h4>
                <p className="text-micro text-text-secondary mt-0.5">
                  Students with aggregate attendance below 75% are flagged for Board Exam admit card clearance review.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                toast(
                  'Notices Dispatched',
                  'success',
                  `Official low-attendance warning SMS dispatched to parents of ${defaulters.length} students.`,
                );
              }}
              className="btn-primary gap-1.5 self-start sm:self-auto bg-destructive hover:bg-destructive/90"
            >
              <Send size={15} /> Dispatch Warning Notice to All ({defaulters.length})
            </button>
          </div>

          {/* Defaulter Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {defaulters.length === 0 ? (
              <div className="col-span-2 rounded-2xl border border-success/30 bg-success-soft/20 p-8 text-center">
                <CheckCircle2 size={32} className="mx-auto text-success mb-2" />
                <h4 className="text-meta font-bold text-foreground">Zero Defaulters in {batch.name}!</h4>
                <p className="text-micro text-text-secondary">All students meet the mandatory 75% attendance threshold.</p>
              </div>
            ) : (
              defaulters.map((st) => (
                <Card key={st.id} className="p-5 rounded-2xl border border-destructive/30 bg-surface shadow-xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img src={st.avatarUrl} alt={st.name} className="h-12 w-12 rounded-xl object-cover ring-2 ring-destructive/40" />
                      <div>
                        <h4 className="text-section font-semibold text-foreground">{st.name}</h4>
                        <div className="text-micro text-text-tertiary">
                          Roll {st.rollNumber} · Guardian: <strong className="text-foreground">{st.parentName}</strong>
                        </div>
                        <div className="text-micro text-text-tertiary mt-0.5">Phone: {st.parentPhone}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-destructive">{st.attendancePct}%</div>
                      <span className="text-micro text-destructive font-semibold">Shortage: -{75 - st.attendancePct}%</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-micro text-text-secondary">
                      Requires <strong>{Math.ceil((75 - st.attendancePct) * 1.8)} consecutive days</strong> of presence to normalize.
                    </span>
                    <button
                      onClick={() => {
                        toast('Warning Alert Sent', 'success', `Urgent attendance shortage alert dispatched to ${st.parentName} (${st.parentPhone}).`);
                      }}
                      className="btn-secondary gap-1 text-meta py-1"
                    >
                      <Send size={13} className="text-destructive" /> Alert Parent
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
