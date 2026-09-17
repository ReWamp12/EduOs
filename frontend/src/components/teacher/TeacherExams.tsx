'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore, addExam } from '@/lib/store';
import { dataService } from '@/lib/dataService';
import { useTeacherBatch } from '@/lib/teacherContext';
import { ExamMode, ExamLifecycleStatus, SyllabusChapter } from '@/lib/types';
import { PageHeader, SectionCard, StatCard, Badge, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  CalendarPlus,
  ClipboardList,
  CheckCircle2,
  Clock,
  FileText,
  Grid3X3,
  Layers,
  Radio,
  Play,
  Send,
  StopCircle,
  Award,
  BookOpen,
  Settings,
  Sparkles,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import { ExamSeatingAdmitCardModal } from './ExamSeatingAdmitCardModal';
import { ExamQuestionBuilderModal } from './ExamQuestionBuilderModal';
import { TeacherExamEvaluationModal } from './TeacherExamEvaluationModal';

const EXAM_TYPES = ['Unit Test', 'Mock Test', 'Practice Test', 'Mid-Term', 'Final Exam', 'Weekly Quiz'];

export const TeacherExams: React.FC = () => {
  const { batch, batches, teacher, subjects: contextSubjects } = useTeacherBatch();
  const { exams: storeExams } = useAppStore();

  const [liveExams, setLiveExams] = useState<any[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [syllabusChapters, setSyllabusChapters] = useState<SyllabusChapter[]>([]);

  // Create form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState(EXAM_TYPES[0]);
  const [mode, setMode] = useState<ExamMode>('online');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [maxMarks, setMaxMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('40');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [instructions, setInstructions] = useState('Read each question carefully before submitting your answer.');
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [status, setStatus] = useState<ExamLifecycleStatus>('scheduled');
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [selectedExamForSeating, setSelectedExamForSeating] = useState<any | null>(null);
  const [selectedExamForQuestions, setSelectedExamForQuestions] = useState<any | null>(null);
  const [selectedExamForEvaluation, setSelectedExamForEvaluation] = useState<any | null>(null);

  // Load live exams
  const loadExams = async () => {
    if (batch?.id) {
      setLoadingLive(true);
      try {
        const list = await dataService.getExams(batch.id, true);
        if (list) setLiveExams(list);
      } catch (e) {
        console.warn('Error loading live exams:', e);
      } finally {
        setLoadingLive(false);
      }
    }
  };

  useEffect(() => {
    loadExams();
  }, [batch?.id]);

  // Load chapters for batch
  useEffect(() => {
    if (batch?.id) {
      dataService.getSyllabusChapters(batch.id).then((chs) => {
        if (chs) setSyllabusChapters(chs);
      }).catch(() => {});
    }
  }, [batch?.id]);

  // Default subject
  const subjects = useMemo(() => {
    if (contextSubjects && contextSubjects.length > 0) return contextSubjects;
    return ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'General'];
  }, [contextSubjects]);

  useEffect(() => {
    if (subjects.length > 0 && !subject) {
      setSubject(subjects[0]);
    }
  }, [subjects, subject]);

  // Merge live and store exams
  const batchExams = useMemo(() => {
    const map = new Map<string, any>();
    // Live exams
    liveExams.forEach((e) => {
      map.set(e.id, {
        id: e.id,
        title: e.title,
        subject: e.subject?.name || e.subject_name || subject,
        batchName: e.batch?.name || batch.name,
        examType: e.exam_type || e.examType || 'Mock Test',
        examDate: e.exam_date || e.examDate,
        startTime: e.start_time,
        durationMinutes: e.duration_minutes,
        maxMarks: e.total_marks || e.maxMarks || 100,
        passingMarks: e.passing_marks || 40,
        mode: e.mode || 'offline',
        status: e.status || (e.is_published ? 'scheduled' : 'draft'),
        instructions: e.instructions,
        chapterTitle: e.chapter?.title,
        topicTitle: e.topic?.title,
        createdBy: e.created_by,
      });
    });
    // Store exams fallback
    storeExams.forEach((se) => {
      if (!map.has(se.id) && (!se.batchName || se.batchName === batch.name)) {
        map.set(se.id, {
          ...se,
          mode: 'offline' as ExamMode,
          status: se.status || 'scheduled',
          passingMarks: Math.round((se.maxMarks || 100) * 0.4),
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());
  }, [liveExams, storeExams, batch.name, subject]);

  const scheduled = batchExams.filter((e) => e.status === 'scheduled').length;
  const liveCount = batchExams.filter((e) => e.status === 'live').length;
  const completed = batchExams.filter((e) => e.status === 'completed' || e.status === 'result_published').length;

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !examDate) {
      toast('Title and date required', 'warning', 'Please provide an assessment title and scheduled date.');
      return;
    }

    setSubmitting(true);
    let createdId = `exam-${Date.now()}`;
    try {
      const created = await dataService.createExam({
        batchId: batch.id,
        title: title.trim(),
        examType,
        totalMarks: Number(maxMarks) || 100,
        examDate,
        subjectId: null,
        mode,
        durationMinutes: mode === 'online' ? Number(durationMinutes) || 60 : undefined,
        startTime: mode === 'online' ? startTime : undefined,
        instructions: instructions.trim() || undefined,
        maxAttempts: mode === 'online' ? Number(maxAttempts) || 1 : 1,
        passingMarks: Number(passingMarks) || Math.round((Number(maxMarks) || 100) * 0.4),
        chapterId: chapterId || undefined,
        topicId: topicId || undefined,
        status,
        createdBy: teacher?.id ?? null,
      });
      if (created?.id) {
        createdId = created.id;
      }
    } catch (err) {
      console.warn('Backend exam create degraded to store:', err);
    }

    addExam({
      id: createdId,
      title: title.trim(),
      subject: subject || 'General',
      batchName: batch.name,
      examType,
      examDate: new Date(examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      maxMarks: Number(maxMarks) || 100,
      createdBy: teacher?.name || 'Faculty',
    });

    toast(
      mode === 'online' ? 'Online Assessment Configured' : 'Offline Exam Scheduled',
      'success',
      `"${title.trim()}" created for ${batch.name.split(' — ')[0]}.`
    );

    // Reset fields
    setTitle('');
    setInstructions('Read each question carefully before submitting your answer.');
    setSubmitting(false);
    await loadExams();
  };

  const handleStatusTransition = async (examId: string, newStatus: ExamLifecycleStatus, examTitle: string) => {
    const ok = await dataService.updateExamStatus(examId, newStatus);
    if (ok) {
      toast(
        'Assessment Status Updated',
        'success',
        `"${examTitle}" is now marked as ${newStatus.toUpperCase().replace('_', ' ')}.`
      );
      await loadExams();
    } else {
      toast('Update failed', 'error', 'Could not update exam lifecycle status.');
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-micro font-bold text-destructive animate-pulse">
            <Radio size={12} /> LIVE NOW
          </span>
        );
      case 'scheduled':
        return (
          <Badge tone="warning" className="gap-1">
            <Clock size={12} /> Scheduled
          </Badge>
        );
      case 'result_published':
      case 'completed':
        return (
          <Badge tone="success" className="gap-1">
            <CheckCircle2 size={12} /> Published
          </Badge>
        );
      case 'grading':
        return (
          <Badge tone="info" className="gap-1">
            <Award size={12} /> In Grading
          </Badge>
        );
      default:
        return (
          <Badge tone="neutral" className="gap-1">
            Draft
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assessments & Test Engine"
        subtitle={`Schedule online computerized assessments, offline tests, and question banks for ${batch.name}.`}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Assessments" value={batchExams.length} tone="info" icon={<ClipboardList size={16} />} />
        <StatCard label="Scheduled" value={scheduled} tone="warning" icon={<Clock size={16} />} />
        <StatCard label="Live Now" value={liveCount} tone="destructive" icon={<Radio size={16} />} />
        <StatCard label="Completed / Results" value={completed} tone="success" icon={<CheckCircle2 size={16} />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1.8fr]">
        {/* ========================================================================= */}
        {/* FORM: SCHEDULE / CONFIGURE ASSESSMENT */}
        {/* ========================================================================= */}
        <SectionCard
          title="Create Assessment"
          icon={<CalendarPlus size={18} />}
          bodyClassName="flex flex-col gap-4"
        >
          <form onSubmit={handleCreateExam} className="flex flex-col gap-4">
            {/* Mode Switcher */}
            <div>
              <label className="label">Delivery Mode</label>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-muted p-1">
                <button
                  type="button"
                  onClick={() => setMode('online')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg py-2 text-meta font-medium transition-colors',
                    mode === 'online'
                      ? 'bg-surface text-primary shadow-xs font-semibold'
                      : 'text-text-secondary hover:text-foreground'
                  )}
                >
                  <Radio size={15} /> Computerized Online Test
                </button>
                <button
                  type="button"
                  onClick={() => setMode('offline')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg py-2 text-meta font-medium transition-colors',
                    mode === 'offline'
                      ? 'bg-surface text-primary shadow-xs font-semibold'
                      : 'text-text-secondary hover:text-foreground'
                  )}
                >
                  <FileText size={15} /> Paper / Pen Offline Exam
                </button>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="exam-title">Assessment Title</label>
              <input
                id="exam-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 04 Rotational Dynamics Speed Test"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="exam-subject">Subject</label>
                <select
                  id="exam-subject"
                  className="input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="exam-type">Type</label>
                <select
                  id="exam-type"
                  className="input"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                >
                  {EXAM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Syllabus Chapter linking */}
            {syllabusChapters.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Linked Syllabus Chapter</label>
                  <select
                    className="input text-meta"
                    value={chapterId}
                    onChange={(e) => {
                      setChapterId(e.target.value);
                      setTopicId('');
                    }}
                  >
                    <option value="">-- Optional: Entire Course --</option>
                    {syllabusChapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        Ch {c.chapterNumber}: {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Specific Topic</label>
                  <select
                    className="input text-meta"
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    disabled={!chapterId}
                  >
                    <option value="">-- All Chapter Topics --</option>
                    {syllabusChapters
                      .find((c) => c.id === chapterId)
                      ?.topics?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* Date & Marks */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="exam-date">Date</label>
                <input
                  id="exam-date"
                  type="date"
                  className="input"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="exam-marks">Total Marks</label>
                <input
                  id="exam-marks"
                  type="number"
                  min={5}
                  className="input"
                  value={maxMarks}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMaxMarks(val);
                    setPassingMarks(String(Math.round((Number(val) || 100) * 0.4)));
                  }}
                  required
                />
              </div>
            </div>

            {/* Online Assessment specific fields */}
            {mode === 'online' && (
              <div className="rounded-xl border border-primary/30 bg-primary-soft/10 p-4 space-y-3.5 animate-scale-in">
                <div className="flex items-center justify-between">
                  <span className="text-meta font-semibold text-foreground flex items-center gap-1.5">
                    <Settings size={15} className="text-primary" /> Online Test Configuration
                  </span>
                  <Badge tone="primary">Auto-Proctored</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="label text-micro">Start Time</label>
                    <input
                      type="time"
                      className="input py-1 text-meta"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label text-micro">Duration (Min)</label>
                    <input
                      type="number"
                      min={10}
                      className="input py-1 text-meta"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label text-micro">Passing Marks</label>
                    <input
                      type="number"
                      min={1}
                      className="input py-1 text-meta"
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label text-micro">Candidate Directions / Rules</label>
                  <textarea
                    rows={2}
                    className="input text-micro"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Initial status */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-meta text-text-secondary">Publish status:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ExamLifecycleStatus)}
                  className="input py-1 text-meta w-32"
                >
                  <option value="draft">Save as Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Make Live Now</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-2 px-4 gap-1.5"
              >
                <CalendarPlus size={16} /> Save Assessment
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ========================================================================= */}
        {/* ROSTER / HISTORY TABLE */}
        {/* ========================================================================= */}
        <SectionCard
          title="Assessments Roster"
          icon={<ClipboardList size={18} />}
          bodyClassName="p-0"
        >
          {batchExams.length === 0 ? (
            <EmptyState
              icon={<FileText size={22} />}
              title="No assessments configured"
              description="Create an online computerized test or offline paper exam to get started."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table min-w-[620px]">
                <thead>
                  <tr>
                    <th>Assessment & Scope</th>
                    <th>Mode</th>
                    <th>Date & Time</th>
                    <th className="text-right">Marks</th>
                    <th>Status</th>
                    <th className="text-right">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {batchExams.map((e) => {
                    const isOnline = e.mode === 'online';
                    return (
                      <tr key={e.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3">
                          <div className="font-semibold text-foreground text-meta">{e.title}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-micro text-text-tertiary">
                            <span>{e.subject}</span>
                            <span>·</span>
                            <span>{e.examType}</span>
                            {e.chapterTitle && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1 text-primary font-medium">
                                  <BookOpen size={10} /> {e.chapterTitle}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        <td>
                          <Badge tone={isOnline ? 'primary' : 'neutral'} className="text-micro font-medium">
                            {isOnline ? 'Online' : 'Offline'}
                          </Badge>
                        </td>

                        <td className="text-text-secondary text-meta">
                          <div>{e.examDate}</div>
                          {isOnline && e.startTime && (
                            <div className="text-micro text-text-tertiary">
                              {e.startTime} ({e.durationMinutes || 60}m)
                            </div>
                          )}
                        </td>

                        <td className="text-right font-medium text-foreground text-meta">
                          {e.maxMarks}
                          <span className="text-micro text-text-tertiary block">
                            pass: {e.passingMarks || Math.round(e.maxMarks * 0.4)}
                          </span>
                        </td>

                        <td>{getStatusBadge(e.status)}</td>

                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Manage Questions button for Online tests */}
                            {isOnline && (
                              <button
                                onClick={() => setSelectedExamForQuestions(e)}
                                className="btn-secondary text-micro py-1 px-2.5 inline-flex items-center gap-1 shadow-2xs font-semibold text-primary hover:border-primary"
                                title="Add and configure questions in question bank"
                              >
                                <Layers size={13} /> Questions
                              </button>
                            )}

                            {/* Evaluation / Submissions roster button */}
                            {isOnline && (
                              <button
                                onClick={() => setSelectedExamForEvaluation(e)}
                                className="btn-secondary text-micro py-1 px-2.5 inline-flex items-center gap-1 shadow-2xs font-semibold text-foreground hover:border-primary"
                                title="Review candidate submissions and grade answers"
                              >
                                <FileCheck size={13} className="text-primary" /> Submissions
                              </button>
                            )}

                            {/* Status transitions */}
                            {e.status === 'draft' && (
                              <button
                                onClick={() => handleStatusTransition(e.id, 'scheduled', e.title)}
                                className="btn-secondary text-micro py-1 px-2 text-warning hover:border-warning"
                                title="Mark as Scheduled"
                              >
                                Schedule
                              </button>
                            )}

                            {e.status === 'scheduled' && (
                              <button
                                onClick={() => handleStatusTransition(e.id, 'live', e.title)}
                                className="btn-primary text-micro py-1 px-2.5 gap-1 bg-destructive hover:bg-destructive/90 text-white"
                                title="Go Live Now for students"
                              >
                                <Play size={11} fill="currentColor" /> Go Live
                              </button>
                            )}

                            {e.status === 'live' && (
                              <button
                                onClick={() => handleStatusTransition(e.id, 'grading', e.title)}
                                className="btn-secondary text-micro py-1 px-2 text-warning hover:border-warning gap-1"
                                title="Stop test taking and begin grading"
                              >
                                <StopCircle size={12} /> Conclude
                              </button>
                            )}

                            {e.status === 'grading' && (
                              <button
                                onClick={() => handleStatusTransition(e.id, 'result_published', e.title)}
                                className="btn-secondary text-micro py-1 px-2 text-success hover:border-success gap-1"
                                title="Publish results to student gradebooks"
                              >
                                <Award size={12} /> Publish
                              </button>
                            )}

                            {/* Seating / Admit card */}
                            <button
                              onClick={() => setSelectedExamForSeating(e)}
                              className="btn-secondary text-micro py-1 px-2 text-text-secondary hover:text-foreground"
                              title="Generate admit cards and seating roster"
                            >
                              <Grid3X3 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Modal: Seating & Admit cards */}
      {selectedExamForSeating && (
        <ExamSeatingAdmitCardModal
          examTitle={selectedExamForSeating.title}
          batchName={selectedExamForSeating.batchName}
          onClose={() => setSelectedExamForSeating(null)}
        />
      )}

      {/* Modal: Question Bank Builder */}
      {selectedExamForQuestions && (
        <ExamQuestionBuilderModal
          exam={{
            id: selectedExamForQuestions.id,
            title: selectedExamForQuestions.title,
            totalMarks: selectedExamForQuestions.maxMarks,
            mode: selectedExamForQuestions.mode,
            status: selectedExamForQuestions.status,
          }}
          onClose={() => setSelectedExamForQuestions(null)}
          onQuestionsUpdated={loadExams}
        />
      )}

      {/* Modal: Candidate Evaluation & Submissions Roster */}
      {selectedExamForEvaluation && (
        <TeacherExamEvaluationModal
          exam={{
            id: selectedExamForEvaluation.id,
            title: selectedExamForEvaluation.title,
            maxMarks: selectedExamForEvaluation.maxMarks,
            passingMarks: selectedExamForEvaluation.passingMarks,
            status: selectedExamForEvaluation.status,
            subject: selectedExamForEvaluation.subject,
          }}
          onClose={() => setSelectedExamForEvaluation(null)}
          onEvaluated={loadExams}
        />
      )}
    </div>
  );
};
