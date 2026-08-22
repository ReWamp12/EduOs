'use client';

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, ArrowLeftRight, UserCheck, CalendarOff } from 'lucide-react';
import { TimetableSlot } from '@/lib/types';
import { useTeacherBatch } from '@/lib/teacherContext';
import { timetableForBatch } from '@/lib/batchData';
import { PageHeader, SectionCard, Badge, EmptyState } from '@/components/ui';
import { toast } from '@/components/ui/toast';

interface SubRequest {
  id: string;
  requestor: string;
  subject: string;
  batch: string;
  period: string;
  date: string;
  reason: string;
}

const DAYS = [
  { dayNumber: 1, name: 'Mon' },
  { dayNumber: 2, name: 'Tue' },
  { dayNumber: 3, name: 'Wed' },
  { dayNumber: 4, name: 'Thu' },
  { dayNumber: 5, name: 'Fri' },
  { dayNumber: 6, name: 'Sat' },
];

export const TeacherTimetable: React.FC = () => {
  const { batch } = useTeacherBatch();
  const timetable = timetableForBatch(batch.id);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [requestedSlots, setRequestedSlots] = useState<Record<string, boolean>>({});

  const [substitutionRequests, setSubstitutionRequests] = useState<SubRequest[]>([
    {
      id: 'sub-1',
      requestor: 'Prof. Vikram Roy',
      subject: 'Mathematics (Calculus)',
      batch: 'Class 11 - JEE Advanced Alpha',
      period: 'Period 3 · 12:30–02:00 PM',
      date: 'Tomorrow, Aug 20',
      reason: 'Attending CBSE Regional Academic Conclave',
    },
    {
      id: 'sub-2',
      requestor: 'Dr. Sunita Rao',
      subject: 'Organic Chemistry',
      batch: 'Class 12 - NEET Medical Champions',
      period: 'Period 4 · 02:15–03:45 PM',
      date: 'Wednesday, Aug 21',
      reason: 'Medical Leave',
    },
  ]);

  const currentSlots: TimetableSlot[] = (timetable || [])
    .filter((s: TimetableSlot) => s.dayOfWeek === selectedDay)
    .sort((a: TimetableSlot, b: TimetableSlot) => a.periodNumber - b.periodNumber);

  const handleRequestSub = (slot: TimetableSlot) => {
    setRequestedSlots((prev) => ({ ...prev, [slot.id]: true }));
    toast('Substitution request sent', 'success', `Period ${slot.periodNumber} · ${slot.subjectName} posted to coverage marketplace`);
  };

  const handleClaim = (req: SubRequest) => {
    setSubstitutionRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast('Coverage confirmed', 'success', `You are covering ${req.requestor}'s ${req.subject} class`);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Faculty Timetable"
        subtitle={`${batch?.name || 'Faculty Timetable'} · weekly schedule with peer class coverage & substitutions`}
        actions={<Badge tone="primary">Academic Year 2026-27</Badge>}
      />

      {/* Day switcher */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => {
          const isSelected = selectedDay === d.dayNumber;
          const count = (timetable || []).filter((s: TimetableSlot) => s.dayOfWeek === d.dayNumber).length;
          return (
            <button
              key={d.dayNumber}
              onClick={() => setSelectedDay(d.dayNumber)}
              className={isSelected ? 'btn-primary' : 'btn-secondary'}
            >
              {d.name}
              {count > 0 && (
                <span
                  className={
                    isSelected
                      ? 'ml-1 rounded-full bg-white/25 px-1.5 text-micro font-semibold'
                      : 'ml-1 rounded-full bg-muted px-1.5 text-micro font-semibold text-text-secondary'
                  }
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Schedule list */}
        <SectionCard
          title={`${['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDay]} Schedule`}
          icon={<Calendar size={18} />}
          action={<Badge tone="neutral">{currentSlots.length} periods</Badge>}
          bodyClassName="flex flex-col gap-3"
        >
          {currentSlots.length > 0 ? (
            currentSlots.map((slot: TimetableSlot) => {
              const requested = requestedSlots[slot.id];
              return (
                <div
                  key={slot.id}
                  className="flex flex-col gap-3 rounded-md border border-border bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderLeft: `4px solid ${slot.subjectColor}` }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-micro font-bold text-white"
                        style={{ background: slot.subjectColor }}
                      >
                        {slot.periodNumber}
                      </span>
                      <span className="truncate text-meta font-semibold text-foreground">{slot.subjectName}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-text-tertiary">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={13} /> {slot.startTime} – {slot.endTime}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} /> {slot.roomNumber}
                      </span>
                    </div>
                  </div>

                  {requested ? (
                    <Badge tone="warning" className="shrink-0 self-start sm:self-auto">
                      Coverage requested
                    </Badge>
                  ) : (
                    <button
                      onClick={() => handleRequestSub(slot)}
                      className="btn-secondary shrink-0 self-start px-3 py-2 text-micro sm:self-auto"
                    >
                      <ArrowLeftRight size={13} /> Request substitution
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={<CalendarOff size={22} />}
              title="No lectures scheduled"
              description="This day is free for research and lesson preparation."
            />
          )}
        </SectionCard>

        {/* Substitution marketplace */}
        <SectionCard
          title="Coverage Marketplace"
          icon={<ArrowLeftRight size={18} />}
          action={<Badge tone="warning">{substitutionRequests.length} open</Badge>}
          bodyClassName="flex flex-col gap-3"
        >
          <p className="text-micro leading-relaxed text-text-secondary">
            Claim open coverage requests from fellow faculty. Claimed hours count towards institutional service credits.
          </p>

          {substitutionRequests.length > 0 ? (
            substitutionRequests.map((req) => (
              <div key={req.id} className="flex flex-col gap-2 rounded-md border border-warning/25 bg-warning-soft p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-meta font-semibold text-foreground">{req.requestor}</span>
                  <Badge tone="warning">{req.date}</Badge>
                </div>
                <div className="text-micro text-text-secondary">
                  <span className="font-semibold text-foreground">{req.subject}</span> · {req.period}
                </div>
                <div className="text-micro text-text-tertiary">{req.batch}</div>
                <div className="text-micro text-text-tertiary">Reason: {req.reason}</div>
                <button onClick={() => handleClaim(req)} className="btn-primary mt-1 w-full px-3 py-2 text-micro">
                  <UserCheck size={14} /> Accept &amp; cover class
                </button>
              </div>
            ))
          ) : (
            <EmptyState
              icon={<UserCheck size={22} />}
              title="All covered"
              description="Every peer substitution request has been claimed."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
};
