'use client';

import React, { useState, useMemo } from 'react';
import { dataService } from '@/lib/dataService';
import { useAppStore, recordResults } from '@/lib/store';
import { useTeacherBatch } from '@/lib/teacherContext';
import { Student } from '@/lib/types';
import { ShieldCheck, Lock, Unlock, ClipboardList, Users, FileText, Award, CheckCircle2 } from 'lucide-react';
import { PageHeader, SectionCard, StatCard, Badge, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { ReportCardGeneratorModal } from './ReportCardGeneratorModal';

interface Row {
  marks: number;
  feedback: string;
}

export const TeacherGradebook: React.FC = () => {
  const { batch, students, teacher } = useTeacherBatch();
  const { exams } = useAppStore();
  // Only exams scheduled for the selected batch are gradable here.
  const batchExams = exams.filter((e) => e.batchName === batch.name);

  // Each exam starts with a blank marks sheet — nothing is pre-filled.
  const buildRows = (): Record<string, Row> => {
    const map: Record<string, Row> = {};
    students.forEach((s) => {
      map[s.id] = { marks: 0, feedback: '' };
    });
    return map;
  };

  const [selectedExamId, setSelectedExamId] = useState<string>(() => batchExams[0]?.id ?? '');
  const [publishedExams, setPublishedExams] = useState<Set<string>>(new Set());
  const [pendingApprovalExams, setPendingApprovalExams] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);

  // Marks entry state kept per exam so switching tests preserves each one's grades.
  const [rowsByExam, setRowsByExam] = useState<Record<string, Record<string, Row>>>({});

  const exam = batchExams.find((e) => e.id === selectedExamId) ?? batchExams[0];
  const maxMarks = exam?.maxMarks ?? 100;
  const published = exam ? publishedExams.has(exam.id) : false;
  const isPendingApproval = exam ? pendingApprovalExams.has(exam.id) : false;
  const rows = (exam && rowsByExam[exam.id]) || buildRows();

  const setRows = (updater: (prev: Record<string, Row>) => Record<string, Row>) => {
    if (!exam) return;
    setRowsByExam((prev) => ({ ...prev, [exam.id]: updater(prev[exam.id] || buildRows()) }));
  };

  const updateMarks = (id: string, val: number) => {
    if (published || isPendingApproval) return;
    const clamped = Math.max(0, Math.min(maxMarks, val || 0));
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], marks: clamped } }));
  };

  const updateFeedback = (id: string, val: string) => {
    if (published || isPendingApproval) return;
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], feedback: val } }));
  };

  const average = useMemo(() => {
    const values = students.map((s) => rows[s.id]?.marks ?? 0);
    if (!values.length) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length / maxMarks) * 100;
  }, [rows, maxMarks]);

  const topScore = useMemo(
    () => Math.max(0, ...students.map((s) => rows[s.id]?.marks ?? 0)),
    [rows],
  );

  const handleSubmitForSignoff = async () => {
    if (!exam || published || isPendingApproval) return;
    setPublishing(true);
    try {
      // 1. Local reactive layer: update exam state, student grades, and parent alerts immediately
      recordResults({
        assessmentTitle: exam.title,
        maxMarks,
        markedBy: teacher?.name || 'Faculty',
        results: students.map((s) => ({ studentName: s.name, obtainedMarks: rows[s.id]?.marks ?? 0 })),
      });

      // 2. Publish to backend Supabase if available
      let writtenCount = students.length;
      try {
        const written = await dataService.publishExamResults(
          exam.id,
          students.map((s) => ({
            studentId: s.id,
            marksObtained: rows[s.id]?.marks ?? 0,
            feedback: rows[s.id]?.feedback ?? '',
          })),
          teacher?.id,
        );
        if (typeof written === 'number') writtenCount = written;
      } catch (err: any) {
        console.warn('Backend exam publish degraded to client store:', err?.message);
      }

      setPendingApprovalExams((prev) => new Set(prev).add(exam.id));
      toast(
        'Marks published & queued for sign-off',
        'success',
        `${exam.title}: ${writtenCount} student result(s) saved. Parent alerts & student scorecards updated.`,
      );
    } catch {
      toast('Submission failed', 'error', 'Could not submit grades. Try again.');
    } finally {
      setPublishing(false);
    }
  };

  if (!exam) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Gradebook" subtitle="Enter and publish marks for an assessment." />
        <SectionCard bodyClassName="p-0">
          <EmptyState
            icon={<FileText size={22} />}
            title="No exams to grade yet"
            description="Schedule an exam under Teaching → Exams, then return here to enter marks."
          />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gradebook & Evaluation"
        subtitle={`${exam.title} · ${exam.batchName}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStudentForReport(students[0] || null)}
              className="btn-secondary text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Award size={14} /> Preview CBSE Report Card
            </button>
            <button
              onClick={handleSubmitForSignoff}
              disabled={published || isPendingApproval || publishing}
              className={published ? 'btn-secondary' : 'btn-primary'}
            >
              {published ? (
                <Unlock size={16} />
              ) : isPendingApproval ? (
                <CheckCircle2 size={16} />
              ) : (
                <Lock size={16} />
              )}
              {published
                ? 'Signed & Published'
                : isPendingApproval
                ? 'Pending Principal Sign-off'
                : publishing
                ? 'Submitting…'
                : 'Submit for Principal Sign-off'}
            </button>
          </div>
        }
      />

      {/* Exam selector */}
      <div className="flex flex-col gap-1.5 sm:max-w-md">
        <label htmlFor="exam" className="label">Select test / exam</label>
        <select
          id="exam"
          className="input"
          value={exam.id}
          onChange={(e) => setSelectedExamId(e.target.value)}
        >
          {batchExams.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.title} — {ex.subject} · {ex.examDate} (/{ex.maxMarks}){publishedExams.has(ex.id) ? ' · published' : ''}
            </option>
          ))}
        </select>
        <p className="text-micro text-text-tertiary">
          {exam.examType} · {exam.batchName} · max {maxMarks} marks
        </p>
      </div>

      {/* Gate status */}
      <div
        className={cn(
          'flex items-center gap-3 rounded-md border p-4',
          published ? 'border-success/25 bg-success-soft' : 'border-warning/25 bg-warning-soft',
        )}
      >
        <ShieldCheck size={20} className={published ? 'text-success' : 'text-warning'} />
        <div className="text-meta">
          <span className={cn('font-semibold', published ? 'text-success' : 'text-warning')}>
            {published ? 'Live & visible' : 'Draft & locked'}
          </span>
          <span className="ml-2 text-text-secondary">
            {published
              ? 'Results are visible to students and parents.'
              : 'Grades are hidden from students until you publish.'}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Students" value={students.length} tone="info" icon={<Users size={16} />} />
        <StatCard
          label="Batch average"
          value={<>{average.toFixed(1)}<span className="text-base font-medium text-text-tertiary">%</span></>}
          tone="primary"
          icon={<ClipboardList size={16} />}
        />
        <StatCard
          label="Top score"
          value={<>{topScore}<span className="text-base font-medium text-text-tertiary">/{maxMarks}</span></>}
          tone="success"
          icon={<ClipboardList size={16} />}
        />
        <StatCard
          label="Status"
          value={<span className="text-xl">{published ? 'Published' : 'Draft'}</span>}
          tone={published ? 'success' : 'warning'}
          icon={published ? <Unlock size={16} /> : <Lock size={16} />}
        />
      </div>

      {/* Grade table */}
      <SectionCard
        title="Marks Entry"
        icon={<ClipboardList size={18} />}
        action={<Badge tone={published ? 'success' : 'warning'}>{published ? 'Locked' : 'Editable'}</Badge>}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll</th>
                <th>Marks (/{maxMarks})</th>
                <th>Feedback</th>
                <th className="text-right">%</th>
                <th className="text-right">Transcript</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const row = rows[student.id] || { marks: 0, feedback: '' };
                const pct = maxMarks ? Math.round((row.marks / maxMarks) * 100) : 0;
                return (
                  <tr key={student.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={student.avatarUrl} alt={student.name} className="h-9 w-9 rounded-md object-cover" />
                        <div className="font-semibold text-foreground">{student.name}</div>
                      </div>
                    </td>
                    <td className="text-text-secondary">{student.rollNumber}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={maxMarks}
                        value={row.marks}
                        disabled={published || isPendingApproval}
                        onChange={(e) => updateMarks(student.id, Number(e.target.value))}
                        className="input w-20 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Marks for ${student.name}`}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.feedback}
                        disabled={published || isPendingApproval}
                        placeholder="Optional note…"
                        onChange={(e) => updateFeedback(student.id, e.target.value)}
                        className="input min-w-[12rem] disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Feedback for ${student.name}`}
                      />
                    </td>
                    <td className="text-right">
                      <span
                        className={cn(
                          'font-semibold',
                          pct >= 75 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-destructive',
                        )}
                      >
                        {pct}%
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedStudentForReport(student)}
                        className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <Award size={13} /> Report Card
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Report Card Modal */}
      {selectedStudentForReport && (
        <ReportCardGeneratorModal
          student={selectedStudentForReport}
          examTitle={exam.title}
          batchName={batch.name}
          isPrincipalSigned={published}
          onClose={() => setSelectedStudentForReport(null)}
        />
      )}
    </div>
  );
};
