'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { Student, TimetableSlot } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { StatCard, SectionCard, Badge, Skeleton, SkeletonCard } from '@/components/ui';
import {
  Clock,
  Trophy,
  Flame,
  Sparkles,
  BookOpen,
  CheckCircle2,
  CalendarDays,
  Award,
  Sun,
  MapPin,
  User,
  Coffee,
  Check,
  Calendar as CalendarIcon,
  Loader2,
} from 'lucide-react';

interface DaySchedule {
  dayName: string;
  dayShort: string;
  dayNumber: number; // 0 for Sun, 1 for Mon, etc.
  dateStr: string;
  isHoliday?: boolean;
  periods: {
    period: number;
    subject: string;
    subjectColor: string;
    teacher: string;
    room: string;
    startTime: string;
    endTime: string;
    type?: 'lecture' | 'lab' | 'activity' | 'remedial';
  }[];
}

const DAYS_META = [
  { dayName: 'Monday', dayShort: 'Mon', dayNumber: 1, offset: 0 },
  { dayName: 'Tuesday', dayShort: 'Tue', dayNumber: 2, offset: 1 },
  { dayName: 'Wednesday', dayShort: 'Wed', dayNumber: 3, offset: 2 },
  { dayName: 'Thursday', dayShort: 'Thu', dayNumber: 3, offset: 3 },
  { dayName: 'Friday', dayShort: 'Fri', dayNumber: 5, offset: 4 },
  { dayName: 'Saturday', dayShort: 'Sat', dayNumber: 6, offset: 5 },
  { dayName: 'Sunday', dayShort: 'Sun', dayNumber: 0, offset: 6, isHoliday: true },
];

export const StudentOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { session } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const { assignments, submissions, exams } = useAppStore();

  // Current day of week (0 = Sun, 1 = Mon ... 5 = Fri)
  const currentDayIndex = new Date().getDay();
  const currentDayMeta = DAYS_META.find((d) => d.dayNumber === currentDayIndex) || DAYS_META[0];
  const [selectedDayName, setSelectedDayName] = useState<string>(currentDayMeta.dayName);

  // Compute dynamic weekly dates for current calendar week
  const weeklySchedule: DaySchedule[] = useMemo(() => {
    const today = new Date();
    // Find Monday of current week
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));

    return DAYS_META.map((meta, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      if (meta.isHoliday) {
        return {
          dayName: meta.dayName,
          dayShort: meta.dayShort,
          dayNumber: meta.dayNumber,
          dateStr,
          isHoliday: true,
          periods: [],
        };
      }

      const daySlots = timetableSlots
        .filter((s) => s.dayOfWeek === meta.dayNumber)
        .sort((a, b) => a.periodNumber - b.periodNumber);

      return {
        dayName: meta.dayName,
        dayShort: meta.dayShort,
        dayNumber: meta.dayNumber,
        dateStr,
        isHoliday: daySlots.length === 0,
        periods: daySlots.map((s) => ({
          period: s.periodNumber,
          subject: s.subjectName,
          subjectColor: s.subjectColor || '#2563EB',
          teacher: s.teacherName,
          room: s.roomNumber || 'Room 101',
          startTime: s.startTime,
          endTime: s.endTime,
          type: s.type || 'lecture',
        })),
      };
    });
  }, [timetableSlots]);

  const selectedSchedule = useMemo(() => {
    return weeklySchedule.find((d) => d.dayName === selectedDayName) || weeklySchedule[0] || {
      dayName: 'Monday',
      dayShort: 'Mon',
      dayNumber: 1,
      dateStr: '',
      periods: [],
    };
  }, [weeklySchedule, selectedDayName]);

  const isSelectedToday = selectedSchedule.dayNumber === currentDayIndex;

  const pendingAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const isMyBatch = !student?.batchName || !a.batchName || a.batchName === student.batchName;
      const isSubmitted = submissions.some(
        (s) => s.assignmentId === a.id && (!student?.name || s.studentName === student.name || s.studentId === student.id),
      );
      return isMyBatch && !isSubmitted;
    });
  }, [assignments, submissions, student]);

  const nextExam = useMemo(() => {
    const scheduled = exams.filter(
      (e) => e.status === 'scheduled' && (!e.batchName || (student ? e.batchName === student.batchName : true))
    );
    return scheduled.length > 0 ? scheduled[0] : null;
  }, [exams, student]);

  useEffect(() => {
    let active = true;
    dataService.getStudentOverview(session?.userId).then((res) => {
      if (!active) return;
      setStudent(res);
      setLoading(false);

      if (res?.batchId) {
        dataService.getTimetableForBatch(res.batchId, session?.tenantId).then((slots) => {
          if (!active) return;
          setTimetableSlots(slots);
          setLoadingTimetable(false);
        });
      } else {
        setLoadingTimetable(false);
      }
    });
    return () => {
      active = false;
    };
  }, [session?.userId, session?.tenantId]);


  if (loading || !student) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto">
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
                <h2 className="text-title text-foreground">Welcome back, {student?.name ? student.name.split(' ')[0] : 'Student'}</h2>
                <Badge tone="primary">
                  <Sparkles size={12} /> Active Student
                </Badge>
              </div>
              <p className="mt-1 text-body text-text-secondary">
                {student.batchName} · Roll{' '}
                <span className="font-semibold text-foreground">{student.rollNumber}</span> · Target{' '}
                <span className="font-semibold text-primary">{student.targetExam}</span>
              </p>
            </div>
          </div>
          <button onClick={() => onNavigate('id_card')} className="btn-primary shrink-0 self-start sm:self-auto shadow-xs">
            <Award size={16} /> View Digital ID
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Attendance Rate"
          value={student.attendancePct !== null && student.attendancePct !== undefined ? `${student.attendancePct}%` : 'N/A'}
          tone={student.attendancePct !== null && student.attendancePct >= 75 ? 'success' : 'neutral'}
          icon={<CheckCircle2 size={16} />}
          hint={student.attendancePct !== null ? 'Eligible for CBSE board exam (>75% required)' : 'No sessions marked yet'}
          onClick={() => onNavigate('attendance')}
        />
        <StatCard
          label="Batch Standing"
          value={student.rankInBatch ? <>Rank #{student.rankInBatch}<span className="text-base font-medium text-text-tertiary"> in batch</span></> : 'Unranked'}
          tone={student.rankInBatch ? 'warning' : 'neutral'}
          icon={<Trophy size={16} />}
          hint={student.rankInBatch ? 'Based on latest verified assessments' : 'Awaiting term examination'}
          onClick={() => onNavigate('exams')}
        />
        <StatCard
          label="Pending Homework"
          value={<>{pendingAssignments.length}<span className="text-base font-medium text-text-tertiary"> DPP due</span></>}
          tone="info"
          icon={<BookOpen size={16} />}
          hint={pendingAssignments[0] ? `${pendingAssignments[0].subject} due ${pendingAssignments[0].dueDate}` : 'All homework submitted'}
          onClick={() => onNavigate('assignments')}
        />
        <StatCard
          label="Next Scheduled Exam"
          value={nextExam ? <span className="text-xl">{nextExam.examDate}</span> : 'No Exams'}
          tone={nextExam ? 'primary' : 'neutral'}
          icon={<CalendarDays size={16} />}
          hint={nextExam ? `${nextExam.title} (${nextExam.subject})` : 'No upcoming tests scheduled'}
          onClick={() => onNavigate('exams')}
        />
      </div>

      {/* ========================================================================= */}
      {/* FULL WEEKLY CALENDAR & TIMETABLE HUB                                      */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
        {/* Hub Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight flex items-center gap-2">
                Weekly Class Timetable & Schedule
              </h3>
              <p className="text-xs text-text-secondary">
                Select any day to review scheduled periods, subject topics, teachers, and classroom venues.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge tone="primary" className="text-xs">
              <CalendarIcon size={12} className="mr-1" />
              {selectedSchedule.dayName} · {selectedSchedule.dateStr}
              {isSelectedToday && ' (Today)'}
            </Badge>
          </div>
        </div>

        {/* Days of the Week Selector Bar */}
        <div className="p-3 bg-muted/10 border-b border-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {weeklySchedule.map((day) => {
              const isSelected = day.dayName === selectedDayName;
              const isToday = day.dayNumber === currentDayIndex;

              return (
                <button
                  key={day.dayName}
                  onClick={() => setSelectedDayName(day.dayName)}
                  className={`relative p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between min-h-[68px] ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm ring-1 ring-primary'
                      : 'border-border bg-surface hover:border-border-strong hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {day.dayName}
                    </span>
                    {isToday && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-primary/15 text-primary'
                        }`}
                      >
                        Today
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className={isSelected ? 'text-primary-foreground/80' : 'text-text-tertiary font-mono'}>
                      {day.dateStr}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        isSelected
                          ? 'text-primary-foreground/90'
                          : day.isHoliday
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-text-secondary'
                      }`}
                    >
                      {day.isHoliday ? 'Holiday' : `${day.periods.length} Periods`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timetable Period Grid for Selected Day */}
        <div className="p-4 sm:p-6">
          {selectedSchedule.isHoliday ? (
            /* Sunday / Holiday View */
            <div className="py-16 px-4 text-center max-w-md mx-auto space-y-3">
              <div className="h-14 w-14 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center mx-auto">
                <Sun size={28} />
              </div>
              <h4 className="text-base font-bold text-foreground">
                Sunday Weekly Holiday
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                No formal lectures or laboratory sessions scheduled for {selectedSchedule.dayName}. Use this time for revision, mock exam preparation, and self-study.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('assignments')}
                  className="rounded bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-xs inline-flex items-center gap-1.5"
                >
                  <BookOpen size={14} /> Review Pending Homework DPPs
                </button>
              </div>
            </div>
          ) : (
            /* Regular Day Periods */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-text-tertiary border-b border-border pb-2 px-1">
                <span>Lecture Timeline & Topics ({selectedSchedule.dayName})</span>
                <span>Batch: <strong>{student.batchName}</strong> · Room 101 Wing</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedSchedule.periods.map((slot, index) => {
                  const isFirstPeriod = isSelectedToday && index === 0;

                  return (
                    <div
                      key={slot.period}
                      className={`p-3.5 rounded-lg border transition-all space-y-2.5 ${
                        isFirstPeriod
                          ? 'border-primary/40 bg-primary/5 shadow-xs'
                          : 'border-border bg-surface hover:border-border-strong hover:shadow-xs'
                      }`}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="h-8 w-8 rounded-md shrink-0 grid place-items-center text-white font-bold text-xs shadow-xs"
                            style={{ backgroundColor: slot.subjectColor }}
                          >
                            P{slot.period}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-xs text-foreground truncate">
                              {slot.subject}
                            </h4>
                            <span className="text-[10px] text-text-tertiary capitalize">
                              {slot.type || 'Lecture'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-semibold text-foreground font-mono">
                            {slot.startTime}
                          </div>
                          <div className="text-[10px] text-text-tertiary font-mono">
                            {slot.endTime}
                          </div>
                        </div>
                      </div>

                      {/* Bottom meta row */}
                      <div className="flex items-center justify-between text-[11px] text-text-secondary pt-2 border-t border-border/60">
                        <span className="flex items-center gap-1 truncate">
                          <User size={12} className="text-text-tertiary shrink-0" /> {slot.teacher}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-text-tertiary shrink-0">
                          <MapPin size={12} className="text-text-tertiary" /> {slot.room}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recess Break Indicator */}
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-2.5 text-center text-xs text-text-secondary flex items-center justify-center gap-2">
                <Coffee size={14} className="text-amber-600 dark:text-amber-400" />
                <span>Short Break & Nutrition Recess: <strong>10:15 AM — 10:35 AM</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
