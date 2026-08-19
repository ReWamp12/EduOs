'use client';

import React, { useState } from 'react';
import { useAppStore, confirmPtmBooking, gradeSubmission } from '@/lib/store';
import { useTeacherBatch } from '@/lib/teacherContext';
import { SectionCard, Badge, EmptyState } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { CalendarClock, Inbox, Check, GraduationCap, Users } from 'lucide-react';

/**
 * Cross-role activity for the teacher: PTM requests raised by parents and
 * assignment submissions raised by students, both read from the shared store.
 * Actions here (confirm / grade) flow back to the parent & student views.
 */
export const TeacherInbox: React.FC = () => {
  const { students } = useTeacherBatch();
  const { ptmBookings, submissions } = useAppStore();
  const [marks, setMarks] = useState<Record<string, string>>({});

  // Scope to students in the selected batch.
  const names = new Set(students.map((s) => s.name));
  const batchPtm = ptmBookings.filter((b) => names.has(b.studentName));
  const batchSubs = submissions.filter((s) => names.has(s.studentName));

  const pendingSubs = batchSubs.filter((s) => s.status === 'submitted');
  const gradedCount = batchSubs.filter((s) => s.status === 'graded').length;
  const openRequests = batchPtm.filter((b) => b.status === 'requested').length;

  const handleConfirm = (id: string, name: string, slot: string) => {
    confirmPtmBooking(id);
    toast('Meeting confirmed', 'success', `${name} · ${slot} · invite sent to parent`);
  };

  const handleGrade = (id: string, title: string, maxMarks: number) => {
    const raw = marks[id];
    const value = Number(raw);
    if (!raw || Number.isNaN(value) || value < 0 || value > maxMarks) {
      toast('Enter valid marks', 'info', `Marks must be between 0 and ${maxMarks}.`);
      return;
    }
    gradeSubmission(id, value, 'Reviewed and graded by faculty.');
    setMarks((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
    toast('Grade published', 'success', `${title} · ${value}/${maxMarks} — visible to student`);
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Parent meeting requests */}
      <SectionCard
        title="Parent meeting requests"
        icon={<CalendarClock size={18} />}
        action={<Badge tone={openRequests ? 'warning' : 'neutral'}>{openRequests} open</Badge>}
        bodyClassName="p-0"
      >
        {batchPtm.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="No meeting requests yet"
            description="When a parent books a PTM slot with you, it appears here to confirm."
          />
        ) : (
          <ul className="divide-y divide-border">
            {batchPtm.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-meta font-semibold text-foreground">{b.studentName}</span>
                    <Badge tone={b.status === 'confirmed' ? 'success' : 'info'}>
                      {b.status === 'confirmed' ? 'Confirmed' : 'Requested'}
                    </Badge>
                  </div>
                  <div className="mt-0.5 truncate text-micro text-text-tertiary">
                    {b.subject} · {b.slot} · {b.mode} · by {b.parentName}
                  </div>
                </div>
                {b.status === 'requested' ? (
                  <button
                    onClick={() => handleConfirm(b.id, b.studentName, b.slot)}
                    className="btn-primary shrink-0 px-3 py-1.5 text-micro"
                  >
                    <Check size={14} /> Confirm
                  </button>
                ) : (
                  <Badge tone="success" className="shrink-0">
                    <Check size={12} /> Booked
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Submission grading queue */}
      <SectionCard
        title="Submissions to grade"
        icon={<Inbox size={18} />}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={pendingSubs.length ? 'warning' : 'neutral'}>{pendingSubs.length} to grade</Badge>
            {gradedCount > 0 && <Badge tone="success">{gradedCount} graded</Badge>}
          </div>
        }
        bodyClassName="p-0"
      >
        {pendingSubs.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={22} />}
            title="Nothing awaiting grades"
            description="When a student submits an assignment, it lands here for you to grade."
          />
        ) : (
          <ul className="divide-y divide-border">
            {pendingSubs.map((s) => (
              <li key={s.id} className="flex flex-col gap-2.5 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-meta font-semibold text-foreground">{s.title}</div>
                  <div className="mt-0.5 truncate text-micro text-text-tertiary">
                    {s.studentName} · {s.subject} · max {s.maxMarks}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={s.maxMarks}
                    value={marks[s.id] ?? ''}
                    onChange={(e) => setMarks((m) => ({ ...m, [s.id]: e.target.value }))}
                    placeholder={`/ ${s.maxMarks}`}
                    className="input h-9 w-20"
                    aria-label={`Marks for ${s.title}`}
                  />
                  <button
                    onClick={() => handleGrade(s.id, s.title, s.maxMarks)}
                    className="btn-secondary h-9 px-3 py-0 text-micro"
                  >
                    Publish
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};
