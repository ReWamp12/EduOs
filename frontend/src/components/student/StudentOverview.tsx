'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '@/lib/dataService';
import { Student } from '@/lib/types';
import { mockCurrentStudent } from '@/lib/mockData';
import { useAppStore } from '@/lib/store';
import { StatCard, SectionCard, Badge, Skeleton, SkeletonCard } from '@/components/ui';
import {
  Clock,
  Trophy,
  Flame,
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

const WEEKLY_SCHEDULE: DaySchedule[] = [
  {
    dayName: 'Monday',
    dayShort: 'Mon',
    dayNumber: 1,
    dateStr: '17 Aug',
    periods: [
      { period: 1, subject: 'Mathematics (Quadratic Equations)', subjectColor: '#2563EB', teacher: 'Prof. Amit Verma', room: 'Room 101', startTime: '08:00 AM', endTime: '08:45 AM', type: 'lecture' },
      { period: 2, subject: 'Science (Physics: Electricity Lab)', subjectColor: '#0D9488', teacher: 'Mrs. Sunita Rao', room: 'Science Lab 1', startTime: '08:45 AM', endTime: '09:30 AM', type: 'lab' },
      { period: 3, subject: 'English Literature (First Flight)', subjectColor: '#7C3AED', teacher: 'Mrs. Ananya Sen', room: 'Room 101', startTime: '09:30 AM', endTime: '10:15 AM', type: 'lecture' },
      { period: 4, subject: 'Social Science (Federalism & Democracy)', subjectColor: '#EA580C', teacher: 'Mr. Rakesh Sharma', room: 'Room 101', startTime: '10:35 AM', endTime: '11:20 AM', type: 'lecture' },
      { period: 5, subject: 'Hindi Course A / Sanskrit', subjectColor: '#DC2626', teacher: 'Dr. Meenakshi Joshi', room: 'Room 101', startTime: '11:20 AM', endTime: '12:05 PM', type: 'lecture' },
      { period: 6, subject: 'Information Technology (Python Coding)', subjectColor: '#059669', teacher: 'Mr. Sandeep Patil', room: 'IT Lab 2', startTime: '12:05 PM', endTime: '12:50 PM', type: 'lab' },
    ],
  },
  {
    dayName: 'Tuesday',
    dayShort: 'Tue',
    dayNumber: 2,
    dateStr: '18 Aug',
    periods: [
      { period: 1, subject: 'Chemistry (Chemical Reactions & Equations)', subjectColor: '#0891B2', teacher: 'Dr. Kavita Nair', room: 'Chem Lab', startTime: '08:00 AM', endTime: '08:45 AM', type: 'lab' },
      { period: 2, subject: 'Mathematics (Pair of Linear Equations)', subjectColor: '#2563EB', teacher: 'Prof. Amit Verma', room: 'Room 101', startTime: '08:45 AM', endTime: '09:30 AM', type: 'lecture' },
      { period: 3, subject: 'Biology (Life Processes & Nutrition)', subjectColor: '#16A34A', teacher: 'Dr. Neha Kapoor', room: 'Bio Lab', startTime: '09:30 AM', endTime: '10:15 AM', type: 'lab' },
      { period: 4, subject: 'English Grammar & Formal Letters', subjectColor: '#7C3AED', teacher: 'Mrs. Ananya Sen', room: 'Room 101', startTime: '10:35 AM', endTime: '11:20 AM', type: 'lecture' },
      { period: 5, subject: 'Social Science (Economics: Development)', subjectColor: '#EA580C', teacher: 'Mr. Rakesh Sharma', room: 'Room 101', startTime: '11:20 AM', endTime: '12:05 PM', type: 'lecture' },
      { period: 6, subject: 'Physical Education & Sports Drill', subjectColor: '#D97706', teacher: 'Coach Imran Khan', room: 'Sports Complex', startTime: '12:05 PM', endTime: '12:50 PM', type: 'activity' },
    ],
  },
  {
    dayName: 'Wednesday',
    dayShort: 'Wed',
    dayNumber: 3,
    dateStr: '19 Aug',
    periods: [
      { period: 1, subject: 'Physics (Magnetic Effects of Current)', subjectColor: '#0D9488', teacher: 'Mrs. Sunita Rao', room: 'Room 101', startTime: '08:00 AM', endTime: '08:45 AM', type: 'lecture' },
      { period: 2, subject: 'Chemistry Lab (Acids, Bases & Salts)', subjectColor: '#0891B2', teacher: 'Dr. Kavita Nair', room: 'Chem Lab', startTime: '08:45 AM', endTime: '09:30 AM', type: 'lab' },
      { period: 3, subject: 'Mathematics (Trigonometric Identities)', subjectColor: '#2563EB', teacher: 'Prof. Amit Verma', room: 'Room 101', startTime: '09:30 AM', endTime: '10:15 AM', type: 'lecture' },
      { period: 4, subject: 'Hindi Grammar & Creative Writing', subjectColor: '#DC2626', teacher: 'Dr. Meenakshi Joshi', room: 'Room 101', startTime: '10:35 AM', endTime: '11:20 AM', type: 'lecture' },
      { period: 5, subject: 'History (Nationalism in India)', subjectColor: '#EA580C', teacher: 'Mr. Rakesh Sharma', room: 'Room 101', startTime: '11:20 AM', endTime: '12:05 PM', type: 'lecture' },
      { period: 6, subject: 'Library & Guided Self-Study', subjectColor: '#4F46E5', teacher: 'Mrs. Ritu Malhotra', room: 'Central Library', startTime: '12:05 PM', endTime: '12:50 PM', type: 'activity' },
    ],
  },
  {
    dayName: 'Thursday',
    dayShort: 'Thu',
    dayNumber: 4,
    dateStr: '20 Aug',
    periods: [
      { period: 1, subject: 'Mathematics (Arithmetic Progressions)', subjectColor: '#2563EB', teacher: 'Prof. Amit Verma', room: 'Room 101', startTime: '08:00 AM', endTime: '08:45 AM', type: 'lecture' },
      { period: 2, subject: 'Physics (Light: Reflection & Refraction)', subjectColor: '#0D9488', teacher: 'Mrs. Sunita Rao', room: 'Room 101', startTime: '08:45 AM', endTime: '09:30 AM', type: 'lecture' },
      { period: 3, subject: 'Chemistry (Metals and Non-Metals)', subjectColor: '#0891B2', teacher: 'Dr. Kavita Nair', room: 'Room 101', startTime: '09:30 AM', endTime: '10:15 AM', type: 'lecture' },
      { period: 4, subject: 'English (Footprints without Feet)', subjectColor: '#7C3AED', teacher: 'Mrs. Ananya Sen', room: 'Room 101', startTime: '10:35 AM', endTime: '11:20 AM', type: 'lecture' },
      { period: 5, subject: 'Information Technology (HTML/CSS)', subjectColor: '#059669', teacher: 'Mr. Sandeep Patil', room: 'IT Lab 2', startTime: '11:20 AM', endTime: '12:05 PM', type: 'lab' },
      { period: 6, subject: 'Arts & Music / Cultural Club', subjectColor: '#9333EA', teacher: 'Ms. Tanvi Sethi', room: 'Activity Hall', startTime: '12:05 PM', endTime: '12:50 PM', type: 'activity' },
    ],
  },
  {
    dayName: 'Friday',
    dayShort: 'Fri',
    dayNumber: 5,
    dateStr: '21 Aug',
    periods: [
      { period: 1, subject: 'Mathematics (Quadratic Equations)', subjectColor: '#2563EB', teacher: 'Prof. Amit Verma', room: 'Room 101', startTime: '08:00 AM', endTime: '08:45 AM', type: 'lecture' },
      { period: 2, subject: 'Science (Physics: Electricity)', subjectColor: '#0D9488', teacher: 'Mrs. Sunita Rao', room: 'Science Lab 1', startTime: '08:45 AM', endTime: '09:30 AM', type: 'lab' },
      { period: 3, subject: 'English (First Flight: Poetry)', subjectColor: '#7C3AED', teacher: 'Mrs. Ananya Sen', room: 'Room 101', startTime: '09:30 AM', endTime: '10:15 AM', type: 'lecture' },
      { period: 4, subject: 'Social Science (Federalism & Democracy)', subjectColor: '#EA580C', teacher: 'Mr. Rakesh Sharma', room: 'Room 101', startTime: '10:35 AM', endTime: '11:20 AM', type: 'lecture' },
      { period: 5, subject: 'Hindi Course A / Sanskrit', subjectColor: '#DC2626', teacher: 'Dr. Meenakshi Joshi', room: 'Room 101', startTime: '11:20 AM', endTime: '12:05 PM', type: 'lecture' },
      { period: 6, subject: 'Information Technology (Code 402)', subjectColor: '#059669', teacher: 'Mr. Sandeep Patil', room: 'IT Lab 2', startTime: '12:05 PM', endTime: '12:50 PM', type: 'lab' },
    ],
  },
  {
    dayName: 'Saturday',
    dayShort: 'Sat',
    dayNumber: 6,
    dateStr: '22 Aug',
    periods: [
      { period: 1, subject: 'Board Exam Doubt Clearing & Remedial Math', subjectColor: '#2563EB', teacher: 'Prof. Amit Verma', room: 'Room 101', startTime: '08:00 AM', endTime: '08:50 AM', type: 'remedial' },
      { period: 2, subject: 'Science Olympiad & Lab Simulator Practical', subjectColor: '#0D9488', teacher: 'Mrs. Sunita Rao', room: 'Science Lab 1', startTime: '08:50 AM', endTime: '09:40 AM', type: 'lab' },
      { period: 3, subject: 'Inter-House Quiz, Debate & Model UN', subjectColor: '#7C3AED', teacher: 'Mrs. Ananya Sen', room: 'Auditorium', startTime: '09:40 AM', endTime: '10:30 AM', type: 'activity' },
      { period: 4, subject: 'Sports Drill, Yoga & Athletics', subjectColor: '#D97706', teacher: 'Coach Imran Khan', room: 'School Ground', startTime: '10:50 AM', endTime: '11:45 AM', type: 'activity' },
    ],
  },
  {
    dayName: 'Sunday',
    dayShort: 'Sun',
    dayNumber: 0,
    dateStr: '23 Aug',
    isHoliday: true,
    periods: [],
  },
];

export const StudentOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const { assignments, submissions } = useAppStore();

  // Current day of week (Friday = 5 by default, or today's system day)
  const currentDayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon ... 5 = Fri
  const [selectedDayName, setSelectedDayName] = useState<string>(
    WEEKLY_SCHEDULE.find((d) => d.dayNumber === currentDayIndex)?.dayName || 'Friday'
  );

  const pendingAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const isMyBatch = !a.batchName || a.batchName === mockCurrentStudent.batchName;
      const isSubmitted = submissions.some(
        (s) => s.assignmentId === a.id && s.studentName === mockCurrentStudent.name,
      );
      return isMyBatch && !isSubmitted;
    });
  }, [assignments, submissions]);

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
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  const selectedSchedule = WEEKLY_SCHEDULE.find((d) => d.dayName === selectedDayName) || WEEKLY_SCHEDULE[4];
  const isSelectedToday = selectedSchedule.dayNumber === currentDayIndex;

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
          <button onClick={() => onNavigate('id_card')} className="btn-primary shrink-0 self-start sm:self-auto shadow-xs">
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
          hint="Eligible for CBSE board exam (>75% required)"
        />
        <StatCard
          label="Batch Standing"
          value={<>Rank #{student.rankInBatch}<span className="text-base font-medium text-text-tertiary"> / 38</span></>}
          tone="warning"
          icon={<Trophy size={16} />}
          hint="Top 5% in Section 10-A (96.8%ile)"
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
          label="Next Mock Test"
          value={<span className="text-xl">15 Sep · 09:00 AM</span>}
          tone="primary"
          icon={<CalendarDays size={16} />}
          hint="CBSE Pre-Board Examination 2"
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
            {WEEKLY_SCHEDULE.map((day) => {
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
