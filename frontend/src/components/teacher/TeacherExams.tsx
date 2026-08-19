'use client';

import React, { useState } from 'react';
import { useAppStore, addExam } from '@/lib/store';
import { useTeacherBatch } from '@/lib/teacherContext';
import { PageHeader, SectionCard, StatCard, Badge, EmptyState } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { CalendarPlus, ClipboardList, CheckCircle2, Clock, FileText } from 'lucide-react';

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Full Syllabus (PCM)'];
const EXAM_TYPES = ['Unit Test', 'Mock Test', 'Practice Test', 'Mid-Term', 'Final Exam'];

export const TeacherExams: React.FC = () => {
  const { batch, batches } = useTeacherBatch();
  const { exams } = useAppStore();
  // Exam history for the currently selected class.
  const batchExams = exams.filter((e) => e.batchName === batch.name);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [batchName, setBatchName] = useState(batch.name);
  const [examType, setExamType] = useState(EXAM_TYPES[0]);
  const [examDate, setExamDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');

  const scheduled = batchExams.filter((e) => e.status === 'scheduled').length;
  const completed = batchExams.filter((e) => e.status === 'completed').length;

  const handleCreate = () => {
    if (!title.trim() || !examDate) {
      toast('Add a title and date', 'info', 'Exam title and date are required.');
      return;
    }
    addExam({
      title: title.trim(),
      subject,
      batchName,
      examType,
      examDate: new Date(examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      maxMarks: Number(maxMarks) || 100,
      createdBy: 'Prof. Amit Verma',
    });
    toast('Exam scheduled', 'success', `${title.trim()} · ${batchName}`);
    setTitle('');
    setExamDate('');
    setMaxMarks('100');
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exams"
        subtitle={`Schedule assessments and review exam history for ${batch.name}.`}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Exams" value={batchExams.length} tone="info" icon={<ClipboardList size={16} />} />
        <StatCard label="Scheduled" value={scheduled} tone="warning" icon={<Clock size={16} />} />
        <StatCard label="Completed" value={completed} tone="success" icon={<CheckCircle2 size={16} />} />
        <StatCard label="My Classes" value={batches.length} tone="primary" icon={<FileText size={16} />} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.5fr]">
        {/* Create exam */}
        <SectionCard title="Schedule a new exam" icon={<CalendarPlus size={18} />} bodyClassName="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="exam-title">Exam title</label>
            <input id="exam-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. All-India Mock Test 05" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="exam-subject">Subject</label>
              <select id="exam-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="exam-type">Type</label>
              <select id="exam-type" className="input" value={examType} onChange={(e) => setExamType(e.target.value)}>
                {EXAM_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="exam-batch">Batch</label>
            <select id="exam-batch" className="input" value={batchName} onChange={(e) => setBatchName(e.target.value)}>
              {batches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="exam-date">Exam date</label>
              <input id="exam-date" type="date" className="input" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="exam-marks">Max marks</label>
              <input id="exam-marks" type="number" min={1} className="input" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
            </div>
          </div>
          <button onClick={handleCreate} className="btn-primary self-start">
            <CalendarPlus size={16} /> Schedule exam
          </button>
        </SectionCard>

        {/* History */}
        <SectionCard title="Exam history" icon={<ClipboardList size={18} />} bodyClassName="p-0">
          {batchExams.length === 0 ? (
            <EmptyState icon={<FileText size={22} />} title="No exams yet" description="Scheduled and completed exams will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table min-w-[560px]">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Batch</th>
                    <th>Date</th>
                    <th className="text-right">Max</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batchExams.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div className="font-semibold text-foreground">{e.title}</div>
                        <div className="mt-0.5 text-micro text-text-tertiary">{e.subject} · {e.examType}</div>
                      </td>
                      <td className="text-text-secondary">{e.batchName.split(' - ')[0]}</td>
                      <td className="text-text-secondary">{e.examDate}</td>
                      <td className="text-right font-medium text-foreground">{e.maxMarks}</td>
                      <td>
                        <Badge tone={e.status === 'completed' ? 'success' : 'warning'}>
                          {e.status === 'completed' ? 'Completed' : 'Scheduled'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};
