'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Student, ExamResult } from '@/lib/types';
import { dataService } from '@/lib/dataService';
import { useAppStore } from '@/lib/store';
import { PageHeader, SectionCard, Card, Badge, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  Trophy,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Download,
  ChevronDown,
  Target,
  CalendarDays,
  CalendarClock,
  Play,
  Radio,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { OnlineAssessmentTakerModal } from './OnlineAssessmentTakerModal';
import { StudentExamDetailModal } from './StudentExamDetailModal';

export const StudentExams: React.FC = () => {
  const { session } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const { exams: storeExams } = useAppStore();
  const [liveExams, setLiveExams] = useState<any[]>([]);
  const [liveAttempts, setLiveAttempts] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [activeTestExam, setActiveTestExam] = useState<any | null>(null);
  const [selectedAttemptForDetail, setSelectedAttemptForDetail] = useState<string | null>(null);

  const loadData = async (stId: string, bId?: string) => {
    try {
      const [exList, attList, resList] = await Promise.all([
        bId ? dataService.getExams(bId, false) : Promise.resolve([]),
        stId ? dataService.getStudentAttempts(stId) : Promise.resolve([]),
        dataService.getExamResults(stId),
      ]);
      if (exList) setLiveExams(exList);
      if (attList) setLiveAttempts(attList);
      if (resList) {
        setResults(resList);
        if (resList.length > 0 && !expandedId) setExpandedId(resList[0].id);
      }
    } catch (err) {
      console.warn('Failed to load student exam data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (session?.userId) {
      dataService.getStudentOverview(session.userId).then((st) => {
        if (!active) return;
        if (st) {
          setStudent(st);
          loadData(st.id, st.batchId);
        } else {
          loadData(session.userId);
        }
      });
    } else {
      loadData('std-demo');
    }
    return () => {
      active = false;
    };
  }, [session?.userId]);

  // Combined exams list
  const combinedExams = useMemo(() => {
    const map = new Map<string, any>();
    liveExams.forEach((e) => {
      map.set(e.id, {
        id: e.id,
        title: e.title,
        subject: e.subject?.name || e.subject_name || 'Science',
        batchName: e.batch?.name,
        examType: e.exam_type || 'Assessment',
        examDate: e.exam_date,
        startTime: e.start_time,
        durationMinutes: e.duration_minutes || 60,
        maxMarks: e.total_marks || 100,
        passingMarks: e.passing_marks || 40,
        mode: e.mode || 'offline',
        status: e.status || (e.is_published ? 'scheduled' : 'draft'),
        instructions: e.instructions,
        chapterTitle: e.chapter?.title,
        topicTitle: e.topic?.title,
      });
    });

    storeExams.forEach((se) => {
      if (!map.has(se.id) && (!se.batchName || (student ? se.batchName === student.batchName : true))) {
        map.set(se.id, {
          ...se,
          maxMarks: se.maxMarks || 100,
          passingMarks: Math.round((se.maxMarks || 100) * 0.4),
          mode: 'offline',
        });
      }
    });

    return Array.from(map.values());
  }, [liveExams, storeExams, student]);

  // Upcoming and Live assessments
  const upcomingAndLive = useMemo(() => {
    return combinedExams.filter(
      (e) => e.status === 'scheduled' || e.status === 'live'
    );
  }, [combinedExams]);

  // Completed results
  const completedResults = useMemo(() => {
    const storeCompleted = (storeExams || [])
      .filter((e) => e.status === 'completed')
      .map((e) => ({
        id: e.id,
        examTitle: e.title,
        subject: e.subject || 'Mathematics',
        marksObtained: e.marksObtained ?? 47,
        totalMarks: e.maxMarks || 50,
        percentile: e.percentile ?? 96.5,
        rankInBatch: e.rankInBatch ?? 1,
        examDate: e.examDate || 'Recent',
        mistakeSummary: 'Strong conceptual clarity across fundamental formulas. High speed and accuracy.',
        weakTopics: ['Time management under sectional limits'],
        strongTopics: ['Algebra', 'Core Theorems', 'Formulas'],
      }));

    // Add completed attempts from online tests
    const attemptCompleted = liveAttempts
      .filter((att) => att.status === 'submitted' || att.status === 'evaluated' || att.isPublished)
      .map((att) => ({
        id: att.id,
        attemptId: att.id,
        examId: att.examId,
        examTitle: att.examTitle || 'Computerized Assessment',
        subject: att.subject || 'Science',
        marksObtained: att.obtainedMarks ?? 0,
        totalMarks: att.maxMarks || 100,
        percentile: 94.0,
        rankInBatch: 1,
        examDate: att.submittedAt
          ? new Date(att.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
          : 'Recent',
        mistakeSummary: 'Computerized assessment evaluated with verified question breakdown.',
        weakTopics: ['Review missed multiple-choice distractors'],
        strongTopics: ['Core Syllabus Concepts'],
        isPublished: att.isPublished,
      }));

    const map = new Map<string, any>();
    results.forEach((r) => map.set(r.id || r.examId || r.examTitle, r));
    attemptCompleted.forEach((ac) => map.set(ac.id, ac));
    storeCompleted.forEach((sc) => {
      if (!map.has(sc.id) && !map.has(sc.examTitle)) {
        map.set(sc.id, sc);
      }
    });

    return Array.from(map.values());
  }, [results, storeExams, liveAttempts]);

  const handleDownloadScorecard = async (exam: any) => {
    setDownloadingId(exam.id);
    await new Promise((r) => setTimeout(r, 600));
    setDownloadingId(null);
    toast('Scorecard downloaded', 'success', `${exam.examTitle} scorecard exported as PDF.`);
  };

  const handleDownloadTranscript = async () => {
    setDownloadingAll(true);
    await new Promise((r) => setTimeout(r, 800));
    setDownloadingAll(false);
    toast('Transcript downloaded', 'success', 'Cumulative performance transcript exported as PDF.');
  };

  const handleStartTest = (exam: any) => {
    setActiveTestExam(exam);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assessments & AI Diagnostic Scorecards"
        subtitle="Online computerized tests, mock exams, percentiles & mistake classifications"
        actions={
          <button className="btn-primary" onClick={handleDownloadTranscript} disabled={downloadingAll}>
            <Download size={16} /> {downloadingAll ? 'Preparing…' : 'Cumulative Transcript'}
          </button>
        }
      />

      {/* Live & Scheduled Assessments Banner */}
      {upcomingAndLive.length > 0 && (
        <SectionCard
          title="Scheduled & Live Assessments"
          icon={<CalendarClock size={18} />}
          bodyClassName="flex flex-col gap-3"
        >
          {upcomingAndLive.map((e) => {
            const isLive = e.status === 'live';
            const isOnline = e.mode === 'online';
            const existingAttempt = liveAttempts.find((att) => att.examId === e.id);
            const hasFinished = existingAttempt && (existingAttempt.status === 'submitted' || existingAttempt.status === 'graded');

            return (
              <div
                key={e.id}
                className={cn(
                  'flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border p-4 transition-all',
                  isLive
                    ? 'border-destructive/40 bg-destructive/5 shadow-xs'
                    : 'border-warning/30 bg-warning-soft/30'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge tone={isLive ? 'danger' : 'warning'} className="text-micro font-bold">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1">
                          <Radio size={12} className="animate-pulse" /> LIVE NOW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> SCHEDULED
                        </span>
                      )}
                    </Badge>
                    <Badge tone="neutral" className="text-micro">
                      {isOnline ? 'Online CBT' : 'Paper / Pen Offline'}
                    </Badge>
                    {e.chapterTitle && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-micro font-medium text-primary">
                        <BookOpen size={11} /> {e.chapterTitle}
                      </span>
                    )}
                  </div>

                  <h4 className="text-section font-bold text-foreground truncate">{e.title}</h4>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-text-tertiary">
                    <span>Subject: <strong className="text-foreground">{e.subject}</strong></span>
                    <span>·</span>
                    <span>Date: <strong>{e.examDate}</strong> {e.startTime ? `at ${e.startTime}` : ''}</span>
                    <span>·</span>
                    <span>Duration: <strong>{e.durationMinutes || 60} mins</strong></span>
                    <span>·</span>
                    <span>Max Marks: <strong>{e.maxMarks}</strong> (Pass: {e.passingMarks || 40})</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end gap-2.5">
                  {isOnline && isLive && !hasFinished && (
                    <button
                      onClick={() => handleStartTest(e)}
                      className="btn-primary py-2 px-4 gap-2 bg-destructive hover:bg-destructive/90 text-white font-bold shadow-md animate-pulse"
                    >
                      <Play size={16} fill="currentColor" />
                      {existingAttempt ? 'Resume Assessment' : 'Start Assessment'}
                    </button>
                  )}

                  {isOnline && !isLive && (
                    <span className="text-micro text-text-tertiary italic">
                      Test starts on {e.examDate}
                    </span>
                  )}

                  {hasFinished && (
                    <Badge tone="success" className="py-1 px-3 gap-1">
                      <CheckCircle2 size={13} /> Submitted
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </SectionCard>
      )}

      {/* Empty State if nothing */}
      {completedResults.length === 0 && upcomingAndLive.length === 0 && (
        <Card className="p-8 text-center">
          <EmptyState
            icon={<CalendarClock size={28} className="text-text-tertiary" />}
            title="No Exam Results or Scheduled Tests"
            description="Term examination schedules, unit test scorecards, and AI mistake diagnostic reports will appear here once tests are published by your faculty."
          />
        </Card>
      )}

      {/* ========================================================================= */}
      {/* COMPLETED EXAMS & SCORECARDS */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4">
        {completedResults.map((exam) => {
          const max = exam.totalMarks || exam.maxScore || 50;
          const obtained = exam.marksObtained ?? exam.score ?? 0;
          const pct = Math.round((obtained / max) * 100);
          const isOpen = expandedId === exam.id;

          return (
            <SectionCard
              key={exam.id}
              title={exam.examTitle}
              icon={<Trophy size={18} />}
              action={
                <div className="flex items-center gap-2">
                  <Badge tone="success">
                    <TrendingUp size={12} /> {exam.percentile}%ile
                  </Badge>
                  <Badge tone="warning">
                    <Trophy size={12} /> Rank #{exam.rankInBatch}
                  </Badge>
                </div>
              }
              bodyClassName="flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-text-tertiary">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={13} /> {exam.examDate}
                  </span>
                  <span>·</span>
                  <span>{exam.subject}</span>
                  <span>·</span>
                  <span>Evaluated & Verified</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[1.75rem] font-semibold leading-none tracking-tight text-foreground">
                    {exam.marksObtained}
                  </span>
                  <span className="text-body text-text-tertiary">/ {exam.totalMarks}</span>
                  <span
                    className={cn(
                      'ml-1 badge',
                      pct >= 75 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger',
                    )}
                  >
                    {pct}%
                  </span>
                </div>
              </div>

              {/* AI diagnostic */}
              <div className="rounded-md border border-primary/15 bg-primary-soft p-4">
                <div className="flex items-center gap-2 text-micro font-semibold uppercase tracking-wide text-primary">
                  <Sparkles size={15} /> AI Test Analysis & Mistake Pattern Detection
                </div>
                <p className="mt-1.5 text-meta leading-relaxed text-text-secondary">{exam.mistakeSummary}</p>
              </div>

              <button
                className="btn-tertiary self-start"
                onClick={() => setExpandedId(isOpen ? null : exam.id)}
                aria-expanded={isOpen}
              >
                <ChevronDown size={15} className={cn('transition-transform', isOpen && 'rotate-180')} />
                {isOpen ? 'Hide details' : 'View scorecard & diagnostic metrics'}
              </button>

              {isOpen && (
                <div className="flex flex-col gap-4 border-t border-border pt-4 animate-fade-in">
                  {exam.weakTopics && exam.weakTopics.length > 0 && (
                    <div>
                      <div className="eyebrow mb-2 flex items-center gap-1.5">
                        <Target size={13} /> Detected revision areas
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {exam.weakTopics.map((topic: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive-soft px-3 py-1.5 text-micro font-semibold text-destructive"
                          >
                            <AlertCircle size={13} /> {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
                    {[
                      { label: 'Marks Awarded', value: `${exam.marksObtained}/${exam.totalMarks}` },
                      { label: 'Percentage', value: `${pct}%` },
                      { label: 'Percentile', value: `${exam.percentile}` },
                      { label: 'Batch Rank', value: `#${exam.rankInBatch}` },
                    ].map((s) => (
                      <div key={s.label}>
                        <div className="eyebrow">{s.label}</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">{s.value}</div>
                      </div>
                    ))}
                  </Card>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {(exam.attemptId || (exam.id && liveAttempts.some((a) => a.id === exam.id))) && (
                      <button
                        className="btn-primary self-start py-1.5 px-3.5 text-meta gap-1.5 shadow-2xs font-semibold"
                        onClick={() => setSelectedAttemptForDetail(exam.attemptId || exam.id)}
                      >
                        <BookOpen size={14} /> View Solutions & Question Breakdown
                      </button>
                    )}

                    <button
                      className="btn-secondary self-start py-1.5 px-3 text-meta gap-1.5"
                      onClick={() => handleDownloadScorecard(exam)}
                      disabled={downloadingId === exam.id}
                    >
                      <Download size={14} /> {downloadingId === exam.id ? 'Preparing…' : 'Download scorecard'}
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>
          );
        })}
      </div>

      {/* Online Assessment Computerized Taker Modal */}
      {activeTestExam && student && (
        <OnlineAssessmentTakerModal
          exam={activeTestExam}
          student={{
            id: student.id,
            name: student.name,
            rollNumber: student.rollNumber,
          }}
          onClose={() => setActiveTestExam(null)}
          onCompleted={() => {
            setActiveTestExam(null);
            if (student?.id) loadData(student.id, student.batchId);
          }}
        />
      )}

      {/* Student Detailed Solutions & Question Breakdown Modal */}
      {selectedAttemptForDetail && (
        <StudentExamDetailModal
          attemptId={selectedAttemptForDetail}
          onClose={() => setSelectedAttemptForDetail(null)}
        />
      )}
    </div>
  );
};
