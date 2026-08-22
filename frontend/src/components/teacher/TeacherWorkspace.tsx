'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TeacherBatchProvider } from '@/lib/teacherContext';
import { teacherBatches, studentsForBatch } from '@/lib/batchData';
import { TeacherBatchGate } from './TeacherBatchGate';
import { TeacherOverview } from './TeacherOverview';
import { TeacherAttendance } from './TeacherAttendance';
import { TeacherStudentDirectory } from './TeacherStudentDirectory';
import { TeacherAssignments } from './TeacherAssignments';
import { TeacherConsentForms } from './TeacherConsentForms';
import { TeacherGradebook } from './TeacherGradebook';
import { TeacherExams } from './TeacherExams';
import { TeacherTimetable } from './TeacherTimetable';
import { TeacherAIQuestions } from './TeacherAIQuestions';
import { TeacherLeavePortal } from './TeacherLeavePortal';
import { NoticeBoard } from '@/components/common/NoticeBoard';
import { Users, ChevronsUpDown, Check, LayoutGrid } from 'lucide-react';
import { cn } from '@/components/ui';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  batchId: string | null;
  setBatchId: (id: string | null) => void;
}

const BatchSwitcher: React.FC<{ batchId: string; setBatchId: (id: string | null) => void }> = ({
  batchId,
  setBatchId,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const batch = teacherBatches.find((b) => b.id === batchId) ?? teacherBatches[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-xs">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-primary-soft text-primary">
          <LayoutGrid size={17} />
        </span>
        <div>
          <div className="text-micro text-text-tertiary">Current class workspace</div>
          <div className="text-meta font-semibold text-foreground">{batch.name}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 text-micro text-text-tertiary sm:inline-flex">
          <Users size={13} /> {studentsForBatch(batch.id).length} students
        </span>
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="btn-secondary py-2"
          >
            Switch Class
            <ChevronsUpDown size={14} className="text-text-tertiary" />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-20 mt-1 w-80 rounded-xl border border-border bg-surface p-1.5 shadow-xl animate-scale-in">
              <div className="px-2.5 py-1.5 text-micro font-semibold uppercase tracking-wider text-text-tertiary">
                Your Assigned Classes ({teacherBatches.length})
              </div>
              {teacherBatches.map((b) => {
                const active = b.id === batch.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setBatchId(b.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-meta transition-colors',
                      active ? 'bg-primary-soft text-primary font-medium' : 'text-foreground hover:bg-muted',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{b.name}</span>
                      <span className="block text-micro text-text-tertiary">
                        {b.code} · {studentsForBatch(b.id).length} students
                      </span>
                    </span>
                    {active && <Check size={15} className="shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TeacherWorkspace: React.FC<Props> = ({ activeTab, setActiveTab, batchId, setBatchId }) => {
  if (!batchId) {
    return <TeacherBatchGate onSelect={setBatchId} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <TeacherOverview onNavigate={setActiveTab} />;
      case 'attendance':
        return <TeacherAttendance />;
      case 'students':
        return <TeacherStudentDirectory />;
      case 'assignments':
        return <TeacherAssignments />;
      case 'consent':
        return <TeacherConsentForms />;
      case 'gradebook':
        return <TeacherGradebook />;
      case 'exams':
        return <TeacherExams />;
      case 'ai_question_studio':
        return <TeacherAIQuestions />;
      case 'timetable':
        return <TeacherTimetable />;
      case 'leave':
        return <TeacherLeavePortal />;
      case 'notices':
        return <NoticeBoard role="teacher" />;
      default:
        return <TeacherOverview onNavigate={setActiveTab} />;
    }
  };

  return (
    <TeacherBatchProvider batchId={batchId} setBatchId={setBatchId}>
      <div className="flex flex-col gap-6">
        <BatchSwitcher batchId={batchId} setBatchId={setBatchId} />
        <div key={batchId}>{renderTab()}</div>
      </div>
    </TeacherBatchProvider>
  );
};
