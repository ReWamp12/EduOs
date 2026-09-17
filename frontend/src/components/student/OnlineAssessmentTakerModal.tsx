'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { dataService } from '@/lib/dataService';
import { ExamQuestion, ExamAttempt, ExamAttemptResponse } from '@/lib/types';
import { Badge, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  Flag,
  RotateCcw,
  Check,
  X,
  Trophy,
  Award,
  Sparkles,
} from 'lucide-react';

interface Props {
  exam: {
    id: string;
    title: string;
    subject?: string;
    totalMarks: number;
    passingMarks?: number;
    durationMinutes?: number;
    instructions?: string;
  };
  student: {
    id: string;
    name: string;
    rollNumber?: string;
  };
  onClose: () => void;
  onCompleted: () => void;
}

export const OnlineAssessmentTakerModal: React.FC<Props> = ({
  exam,
  student,
  onClose,
  onCompleted,
}) => {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, { optionId?: string; answerText?: string; isReview?: boolean }>>({});
  const [secondsRemaining, setSecondsRemaining] = useState((exam.durationMinutes || 60) * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showResultScreen, setShowResultScreen] = useState(false);
  const [resultSummary, setResultSummary] = useState<{ score: number; maxScore: number; percentage: number; passed: boolean } | null>(null);

  // Load questions and start/resume attempt
  useEffect(() => {
    let active = true;
    const initTest = async () => {
      setLoading(true);
      try {
        const qList = await dataService.getExamQuestions(exam.id);
        if (!active) return;
        setQuestions(qList || []);

        const att = await dataService.startExamAttempt(exam.id, student.id);
        if (!active) return;
        if (att) {
          setAttempt({
            id: att.attemptId,
            tenantId: '',
            examId: exam.id,
            studentId: student.id,
            attemptNumber: att.attemptNumber,
            startedAt: new Date().toISOString(),
            autoSubmitted: false,
            status: 'in_progress',
            isPublished: false,
          });
        }
      } catch (err) {
        console.warn('Failed to start assessment attempt:', err);
        toast('Connection Error', 'error', 'Could not initialize assessment questions.');
      } finally {
        if (active) setLoading(false);
      }
    };

    initTest();
    return () => {
      active = false;
    };
  }, [exam.id, student.id]);

  // Timer Countdown
  useEffect(() => {
    if (loading || showResultScreen || showConfirmSubmit) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, showResultScreen, showConfirmSubmit]);

  const currentQ = questions[currentIndex];

  // Helper for formatting time MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionId: string) => {
    if (!currentQ) return;
    const existing = responses[currentQ.id] || {};
    const updated = {
      ...responses,
      [currentQ.id]: {
        ...existing,
        optionId,
      },
    };
    setResponses(updated);

    // Auto-save to Supabase attempt
    if (attempt?.id) {
      dataService.saveAttemptResponse({
        attemptId: attempt.id,
        questionId: currentQ.id,
        selectedOptionId: optionId,
        isMarkedForReview: existing.isReview || false,
      }).catch((e: any) => console.warn('Auto-save response failed:', e));
    }
  };

  const handleTextAnswerChange = (val: string) => {
    if (!currentQ) return;
    const existing = responses[currentQ.id] || {};
    setResponses({
      ...responses,
      [currentQ.id]: {
        ...existing,
        answerText: val,
      },
    });
  };

  const handleSaveTextAnswer = () => {
    if (!currentQ || !attempt?.id) return;
    const existing = responses[currentQ.id] || {};
    dataService.saveAttemptResponse({
      attemptId: attempt.id,
      questionId: currentQ.id,
      responseAnswer: existing.answerText,
      isMarkedForReview: existing.isReview || false,
    }).catch((e: any) => console.warn('Auto-save response failed:', e));
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    const updated = { ...responses };
    delete updated[currentQ.id];
    setResponses(updated);

    if (attempt?.id) {
      dataService.saveAttemptResponse({
        attemptId: attempt.id,
        questionId: currentQ.id,
        selectedOptionId: undefined,
        responseAnswer: undefined,
        isMarkedForReview: false,
      }).catch((e: any) => console.warn('Clear response failed:', e));
    }
  };

  const handleToggleReview = () => {
    if (!currentQ) return;
    const existing = responses[currentQ.id] || {};
    const newReview = !existing.isReview;
    setResponses({
      ...responses,
      [currentQ.id]: {
        ...existing,
        isReview: newReview,
      },
    });

    if (attempt?.id) {
      dataService.saveAttemptResponse({
        attemptId: attempt.id,
        questionId: currentQ.id,
        selectedOptionId: existing.optionId,
        responseAnswer: existing.answerText,
        isMarkedForReview: newReview,
      }).catch((e: any) => console.warn('Toggle review failed:', e));
    }
  };

  const answeredCount = Object.values(responses).filter((r) => r.optionId || r.answerText).length;
  const reviewCount = Object.values(responses).filter((r) => r.isReview).length;
  const unvisitedCount = Math.max(0, questions.length - Object.keys(responses).length);

  const handleFinalSubmit = async (auto = false) => {
    if (!attempt?.id) {
      onClose();
      return;
    }
    setSubmitting(true);
    try {
      const finished = await dataService.submitExamAttempt(attempt.id);
      if (finished) {
        const score = finished.obtainedMarks ?? 0;
        const maxScore = finished.totalMarks ?? exam.totalMarks;
        const pct = Math.round((score / (maxScore || 1)) * 100);
        const passMarks = exam.passingMarks || Math.round(maxScore * 0.4);
        setResultSummary({
          score,
          maxScore,
          percentage: pct,
          passed: score >= passMarks,
        });
        setShowConfirmSubmit(false);
        setShowResultScreen(true);
        onCompleted();
      } else {
        toast('Submit finished', 'info', 'Your answers were submitted successfully.');
        onClose();
        onCompleted();
      }
    } catch (err: any) {
      toast('Submit error', 'error', err?.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-meta font-medium">Initializing Computerized Assessment Engine…</p>
        </div>
      </div>
    );
  }

  // Result / Completion Screen
  if (showResultScreen && resultSummary) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
        <div className="flex w-full max-w-lg flex-col items-center rounded-3xl border border-border bg-surface p-8 text-center shadow-2xl animate-scale-in">
          <div
            className={cn(
              'grid h-20 w-20 place-items-center rounded-3xl text-3xl font-bold shadow-lg mb-4',
              resultSummary.passed
                ? 'bg-success/20 text-success border border-success/40'
                : 'bg-warning/20 text-warning border border-warning/40'
            )}
          >
            {resultSummary.passed ? <Trophy size={40} /> : <Award size={40} />}
          </div>

          <h3 className="text-display font-bold text-foreground">
            {resultSummary.passed ? 'Assessment Completed!' : 'Test Concluded'}
          </h3>
          <p className="mt-1 text-meta text-text-secondary">
            {exam.title} · {exam.subject || 'All Sections'}
          </p>

          <div className="mt-6 w-full rounded-2xl border border-border bg-surface-muted p-5 grid grid-cols-2 gap-4">
            <div>
              <span className="text-micro text-text-tertiary">Obtained Score</span>
              <div className="mt-1 text-2xl font-bold text-foreground">
                {resultSummary.score} / {resultSummary.maxScore}
              </div>
            </div>
            <div>
              <span className="text-micro text-text-tertiary">Accuracy / Percentage</span>
              <div className="mt-1 text-2xl font-bold text-primary">
                {resultSummary.percentage}%
              </div>
            </div>
            <div className="col-span-2 pt-2 border-t border-border flex items-center justify-between">
              <span className="text-micro text-text-secondary">Result Status:</span>
              <Badge tone={resultSummary.passed ? 'success' : 'warning'}>
                {resultSummary.passed ? 'PASSED & QUALIFIED' : 'NEEDS REVISION'}
              </Badge>
            </div>
          </div>

          <p className="mt-4 text-micro text-text-tertiary">
            Detailed sectional breakdown and AI mistake diagnostics are now reflected in your performance dashboard.
          </p>

          <button
            onClick={onClose}
            className="btn-primary mt-6 w-full py-2.5 text-meta"
          >
            Return to Exam Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface text-foreground animate-fade-in overflow-hidden">
      {/* ========================================================================= */}
      {/* TOP CBT HEADER */}
      {/* ========================================================================= */}
      <header className="shrink-0 flex items-center justify-between border-b border-border bg-surface-muted/90 px-6 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary font-bold">
            CBT
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-meta font-bold text-foreground leading-tight">{exam.title}</h2>
              <Badge tone="primary" className="text-micro">{exam.subject || 'Core'}</Badge>
            </div>
            <p className="text-micro text-text-tertiary">
              Candidate: <strong>{student.name}</strong> · Roll: {student.rollNumber || '01'}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3.5 py-1.5 font-mono text-meta font-bold shadow-2xs',
              secondsRemaining < 300
                ? 'border-destructive/60 bg-destructive/10 text-destructive animate-pulse'
                : 'border-border bg-surface text-foreground'
            )}
          >
            <Clock size={16} className={secondsRemaining < 300 ? 'text-destructive' : 'text-primary'} />
            <span>Time Left: {formatTime(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="btn-primary py-1.5 px-4 text-meta gap-1.5 shadow-sm"
          >
            <Send size={14} /> Finish & Submit
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN BODY: 2 COLUMNS (Question on Left, Palette on Right) */}
      {/* ========================================================================= */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Active Question and Input */}
        <main className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8 min-h-0">
          {currentQ ? (
            <div className="flex flex-1 flex-col max-w-3xl mx-auto w-full">
              {/* Question metadata */}
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-section font-bold text-foreground">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <Badge tone="neutral" className="capitalize text-micro">
                    {currentQ.questionType.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-micro">
                  <span className="font-semibold text-success">+{currentQ.marks} Marks</span>
                  {currentQ.negativeMarks ? (
                    <span className="font-semibold text-destructive">-{currentQ.negativeMarks} Neg</span>
                  ) : null}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-body font-medium text-foreground leading-relaxed whitespace-pre-line py-2">
                {currentQ.questionText}
              </div>

              {/* Options or Answer Input */}
              <div className="mt-6 flex-1 space-y-3">
                {currentQ.questionType === 'single_choice' || currentQ.questionType === 'multiple_choice' || currentQ.questionType === 'mcq' ? (
                  currentQ.options?.map((opt: any, optIdx: number) => {
                    const isSelected = responses[currentQ.id]?.optionId === opt.id;
                    const optKey = opt.optionKey || opt.key || String.fromCharCode(65 + optIdx);
                    const optText = opt.optionText || opt.text || '';
                    return (
                      <div
                        key={opt.id || optKey}
                        onClick={() => handleSelectOption(opt.id || optKey)}
                        className={cn(
                          'flex items-center gap-3.5 rounded-xl border p-4 cursor-pointer transition-all',
                          isSelected
                            ? 'border-primary bg-primary-soft/30 shadow-xs ring-1 ring-primary'
                            : 'border-border bg-surface hover:border-border-strong hover:bg-surface-muted'
                        )}
                      >
                        <div
                          className={cn(
                            'grid h-7 w-7 shrink-0 place-items-center rounded-lg border font-bold text-micro transition-colors',
                            isSelected
                              ? 'border-primary bg-primary text-white shadow-2xs'
                              : 'border-border bg-surface-muted text-text-secondary'
                          )}
                        >
                          {optKey}
                        </div>
                        <span className="text-meta font-medium text-foreground">{optText}</span>
                      </div>
                    );
                  })
                ) : (currentQ.questionType as string) === 'numerical' ? (
                  <div className="rounded-xl border border-border bg-surface-muted p-5 space-y-2">
                    <label className="label">Enter Numeric Answer</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 5.25"
                      value={responses[currentQ.id]?.answerText || ''}
                      onChange={(e) => handleTextAnswerChange(e.target.value)}
                      onBlur={handleSaveTextAnswer}
                      className="input max-w-xs font-mono text-section font-bold"
                    />
                    <p className="text-micro text-text-tertiary">
                      Accepts integer or decimal numbers. Use keyboard to type your answer.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="label">Written Answer / Solution Steps</label>
                    <textarea
                      rows={6}
                      placeholder="Type your explanation or derivation steps here…"
                      value={responses[currentQ.id]?.answerText || ''}
                      onChange={(e) => handleTextAnswerChange(e.target.value)}
                      onBlur={handleSaveTextAnswer}
                      className="input font-sans text-meta leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Question Navigation Controls */}
              <div className="mt-8 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleReview}
                    className={cn(
                      'btn-secondary py-1.5 px-3 text-meta gap-1.5 transition-colors',
                      responses[currentQ.id]?.isReview
                        ? 'border-warning bg-warning/15 text-warning font-semibold'
                        : 'text-text-secondary'
                    )}
                  >
                    <Flag size={14} />
                    {responses[currentQ.id]?.isReview ? 'Marked for Review' : 'Mark for Review'}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearResponse}
                    className="btn-tertiary py-1.5 px-2.5 text-meta text-text-tertiary hover:text-destructive"
                  >
                    <RotateCcw size={13} /> Clear
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="btn-secondary py-1.5 px-3 text-meta gap-1"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentIndex === questions.length - 1}
                    className="btn-primary py-1.5 px-4 text-meta gap-1"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-text-tertiary">
              No questions found for this assessment.
            </div>
          )}
        </main>

        {/* Right: Question Palette Sidebar */}
        <aside className="w-72 shrink-0 border-l border-border bg-surface-muted/50 p-5 flex flex-col justify-between hidden md:flex">
          <div>
            <h4 className="text-meta font-bold text-foreground mb-3">Question Palette</h4>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-micro mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-success" />
                <span className="text-text-secondary">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-warning" />
                <span className="text-text-secondary">Review ({reviewCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-border" />
                <span className="text-text-secondary">Unvisited ({unvisitedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-text-secondary">Current Q</span>
              </div>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-[50vh] p-1">
              {questions.map((q, idx) => {
                const resp = responses[q.id];
                const isAnswered = resp?.optionId || resp?.answerText;
                const isReview = resp?.isReview;
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-lg font-mono text-micro font-bold transition-all',
                      isCurrent
                        ? 'ring-2 ring-primary ring-offset-2 bg-primary text-white shadow-xs'
                        : isReview
                        ? 'bg-warning/20 text-warning border border-warning/50'
                        : isAnswered
                        ? 'bg-success text-white shadow-2xs'
                        : 'bg-surface border border-border text-text-secondary hover:border-primary'
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="btn-primary w-full py-2 text-meta justify-center gap-1.5"
            >
              <Send size={15} /> Finish & Submit Test
            </button>
          </div>
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM FINAL SUBMIT */}
      {/* ========================================================================= */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-scale-in">
            <h4 className="text-section font-bold text-foreground">Confirm Assessment Submission</h4>
            <p className="mt-1 text-meta text-text-secondary">
              Are you sure you want to finish this assessment? Once submitted, your responses will be locked and automatically scored.
            </p>

            <div className="my-4 rounded-xl border border-border bg-surface-muted p-4 grid grid-cols-3 gap-2 text-center text-meta">
              <div>
                <span className="text-micro text-text-tertiary">Answered</span>
                <div className="text-lg font-bold text-success">{answeredCount}</div>
              </div>
              <div>
                <span className="text-micro text-text-tertiary">For Review</span>
                <div className="text-lg font-bold text-warning">{reviewCount}</div>
              </div>
              <div>
                <span className="text-micro text-text-tertiary">Unanswered</span>
                <div className="text-lg font-bold text-text-tertiary">
                  {questions.length - answeredCount}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                disabled={submitting}
                className="btn-secondary"
              >
                Back to Test
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="btn-primary gap-1.5"
              >
                <CheckCircle2 size={16} /> {submitting ? 'Submitting…' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
