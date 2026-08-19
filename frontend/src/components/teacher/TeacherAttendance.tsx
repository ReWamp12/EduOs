'use client';

import React, { useState, useMemo } from 'react';
import { dataService } from '@/lib/dataService';
import { recordAttendance } from '@/lib/store';
import { useTeacherBatch } from '@/lib/teacherContext';
import { Send, Users, CheckCheck, CalendarCheck2 } from 'lucide-react';
import { PageHeader, SectionCard, StatCard, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';

type Status = 'present' | 'absent' | 'late';

const STATUS_OPTIONS: { value: Status; label: string; active: string }[] = [
  { value: 'present', label: 'Present', active: 'bg-success text-white' },
  { value: 'absent', label: 'Absent', active: 'bg-destructive text-white' },
  { value: 'late', label: 'Late', active: 'bg-warning text-white' },
];

export const TeacherAttendance: React.FC = () => {
  const { batch, students } = useTeacherBatch();
  const buildDefault = () => {
    const map: Record<string, Status> = {};
    students.forEach((s) => {
      map[s.id] = 'present';
    });
    return map;
  };
  const [attendance, setAttendance] = useState<Record<string, Status>>(buildDefault);
  const [submitting, setSubmitting] = useState(false);

  const setStatus = (id: string, status: Status) => {
    setAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const markAllPresent = () => {
    setAttendance(buildDefault());
    toast('Marked all present', 'info', `${students.length} students set to present`);
  };

  const { presentCount, absentCount, lateCount } = useMemo(() => {
    const values = students.map((s) => attendance[s.id] || 'present');
    return {
      presentCount: values.filter((v) => v === 'present').length,
      absentCount: values.filter((v) => v === 'absent').length,
      lateCount: values.filter((v) => v === 'late').length,
    };
  }, [attendance, students]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const records = students.map((s) => ({
      studentId: s.id,
      status: attendance[s.id] || 'present',
      remarks: 'Period 1 marked',
    }));
    try {
      await dataService.markAttendance(batch.id, records);
      // Notify parents: push a real-time attendance alert per student to the store.
      const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      recordAttendance({
        batchName: batch.name,
        markedBy: 'Prof. Amit Verma',
        period: 'Period 1',
        date: today,
        records: students.map((s) => ({
          studentName: s.name,
          status: attendance[s.id] || 'present',
        })),
      });
      const notified = absentCount + lateCount;
      toast(
        'Attendance submitted',
        'success',
        `${presentCount} present · ${absentCount} absent · parents notified${notified ? ` (${notified} alert${notified > 1 ? 's' : ''})` : ''}`,
      );
    } catch {
      toast('Submission failed', 'error', 'Could not record attendance. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Period Attendance"
        subtitle={`${batch.name} · Period 1 · ${batch.roomNumber}`}
        actions={
          <>
            <button onClick={markAllPresent} className="btn-secondary">
              <CheckCheck size={16} /> Mark all present
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
              <Send size={16} /> {submitting ? 'Submitting…' : 'Submit attendance'}
            </button>
          </>
        }
      />

      {/* Live summary */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Enrolled" value={students.length} tone="info" icon={<Users size={16} />} />
        <StatCard label="Present" value={presentCount} tone="success" icon={<CalendarCheck2 size={16} />} />
        <StatCard label="Absent" value={absentCount} tone="destructive" icon={<CalendarCheck2 size={16} />} />
        <StatCard label="Late" value={lateCount} tone="warning" icon={<CalendarCheck2 size={16} />} />
      </div>

      {/* Roster */}
      <SectionCard title="Class Roster" icon={<Users size={18} />} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll number</th>
                <th>Attendance</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const current = attendance[student.id] || 'present';
                return (
                  <tr
                    key={student.id}
                    className={cn(current === 'absent' && 'bg-destructive-soft/40')}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatarUrl}
                          alt={student.name}
                          className="h-9 w-9 rounded-md object-cover"
                        />
                        <div>
                          <div className="font-semibold text-foreground">{student.name}</div>
                          <div className="text-micro text-text-tertiary">Rank #{student.rankInBatch}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-text-secondary">{student.rollNumber}</td>
                    <td>
                      <span
                        className={cn(
                          'font-semibold',
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
                    <td>
                      <div className="flex justify-end">
                        <div className="inline-flex gap-1 rounded-md border border-border bg-surface-muted p-1">
                          {STATUS_OPTIONS.map((opt) => {
                            const isActive = current === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => setStatus(student.id, opt.value)}
                                aria-pressed={isActive}
                                className={cn(
                                  'rounded px-3 py-1 text-micro font-semibold transition-colors',
                                  isActive ? opt.active : 'text-text-secondary hover:bg-muted',
                                )}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};
