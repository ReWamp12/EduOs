'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { Student } from '@/lib/types';
import { toast } from '@/components/ui/toast';

interface Props {
  student: Student;
  batchId: string;
  subjectName: string;
  triggerScorePct: number;
  onClose: () => void;
}

export const RemedialPlanModal: React.FC<Props> = ({ student, batchId, subjectName, triggerScorePct, onClose }) => {
  const { session } = useAuth();
  const [topic, setTopic] = useState('');
  const [resourceNote, setResourceNote] = useState('');
  const [doubtSessionDate, setDoubtSessionDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    const ok = await dataService.createRemedialPlan({
      tenantId: session.tenantId,
      teacherId: session.userId,
      studentId: student.id,
      batchId,
      subjectName,
      topic: topic.trim(),
      resourceNote: resourceNote.trim(),
      doubtSessionDate,
      triggerScorePct,
    });
    setSaving(false);
    if (!ok) {
      toast('Could not create plan', 'error', 'Please try again.');
      return;
    }
    toast('Support plan started', 'success', `${student.name}'s parent and the principal can now see it.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-2xl"
        role="dialog"
        aria-label="Start remedial plan"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-section text-foreground">Start support plan</h3>
            <p className="mt-1 text-meta text-text-secondary">
              {student.name} scored {triggerScorePct}% in {subjectName}.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-text-tertiary hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="label">Topic needing focus</span>
            <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} required placeholder="Linear equations" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Practice resource</span>
            <textarea className="input min-h-[72px]" value={resourceNote} onChange={(e) => setResourceNote(e.target.value)} placeholder="NCERT Exercise 4.2, questions 1–10" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Doubt-clearing session (optional)</span>
            <input className="input" type="date" value={doubtSessionDate} onChange={(e) => setDoubtSessionDate(e.target.value)} />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving || !topic.trim()}>
            {saving ? 'Saving…' : 'Start plan'}
          </button>
        </div>
      </form>
    </div>
  );
};
