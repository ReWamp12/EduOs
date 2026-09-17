'use client';

import React, { useState, useEffect } from 'react';
import { dataService } from '@/lib/dataService';
import { Badge, EmptyState, cn } from '@/components/ui';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Award,
  BookOpen,
  HelpCircle,
  FileText,
  Clock,
  Check,
  Trophy,
  MessageSquare,
} from 'lucide-react';

interface Props {
  attemptId: string;
  onClose: () => void;
}

export const StudentExamDetailModal: React.FC<Props> = ({ attemptId, onClose }) => {
  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    dataService
      .getExamAttemptDetail(attemptId)
      .then((res) => {
        if (active && res) setDetail(res);
      })
      .catch((err) => {
        console.warn('Failed to load attempt detail:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attemptId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs animate-fade-in">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border bg-surface-muted px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary font-bold">
              <Trophy size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-section font-semibold text-foreground">
                  {detail?.examTitle || 'Assessment Scorecard & Solutions'}
                </h3>
                {detail?.subject && <Badge tone="primary">{detail.subject}</Badge>}
              </div>
              <p className="text-micro text-text-tertiary">
                Candidate: <strong>{detail?.studentName}</strong> · Roll #{detail?.rollNumber || '01'} · Attempt #{detail?.attemptNumber || 1}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {loading ? (
            <div className="py-24 text-center text-text-tertiary">
              Loading scorecard & verified solutions…
            </div>
          ) : !detail ? (
            <EmptyState
              icon={<FileText size={32} />}
              title="Scorecard Unavailable"
              description="Could not load assessment details or official solutions."
            />
          ) : (
            <>
              {/* Scorecard Hero Banner */}
              <div className="rounded-2xl border border-border bg-surface-muted/60 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-micro text-text-tertiary">Marks Awarded</span>
                  <div className="mt-1 text-2xl font-bold text-foreground">
                    {detail.obtainedMarks ?? 0} / {detail.maxMarks}
                  </div>
                </div>

                <div>
                  <span className="text-micro text-text-tertiary">Score Percentage</span>
                  <div className="mt-1 text-2xl font-bold text-primary">
                    {detail.percentage ?? 0}%
                  </div>
                </div>

                <div>
                  <span className="text-micro text-text-tertiary">Performance Status</span>
                  <div className="mt-1">
                    <Badge tone={(detail.percentage ?? 0) >= 40 ? 'success' : 'warning'}>
                      {(detail.percentage ?? 0) >= 40 ? 'Passed & Qualified' : 'Revision Recommended'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-micro text-text-tertiary">Submission Time</span>
                  <div className="mt-1 text-meta font-medium text-foreground">
                    {detail.submittedAt
                      ? new Date(detail.submittedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </div>
                </div>
              </div>

              {/* Questions with Candidate Responses & Explanations */}
              <div className="space-y-4">
                <h4 className="text-meta font-bold text-foreground flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" /> Question Breakdown & Verified Solutions
                </h4>

                {detail.questions?.map((q: any, idx: number) => {
                  const isObjective =
                    q.questionType === 'single_choice' ||
                    q.questionType === 'multiple_choice' ||
                    q.questionType === 'mcq' ||
                    q.questionType === 'true_false';

                  const isCorrect = Boolean(q.isCorrect);
                  const isAnswered = Boolean(q.responseText);

                  return (
                    <div
                      key={q.id}
                      className={cn(
                        'rounded-2xl border p-5 transition-all shadow-2xs space-y-3.5',
                        isObjective
                          ? isCorrect
                            ? 'border-success/40 bg-success/5'
                            : isAnswered
                            ? 'border-destructive/40 bg-destructive/5'
                            : 'border-border bg-surface'
                          : 'border-border bg-surface'
                      )}
                    >
                      {/* Question Item Header */}
                      <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-md bg-primary-soft text-primary font-bold text-micro">
                            {idx + 1}
                          </span>
                          <Badge tone="neutral" className="capitalize text-micro">
                            {q.questionType.replace('_', ' ')}
                          </Badge>
                          <span className="text-micro text-text-tertiary">
                            Total: <strong>{q.marks} Marks</strong>
                          </span>
                        </div>

                        <div>
                          {isObjective ? (
                            isCorrect ? (
                              <Badge tone="success" className="gap-1 text-micro">
                                <CheckCircle2 size={12} /> +{q.marks} Marks (Correct)
                              </Badge>
                            ) : isAnswered ? (
                              <Badge tone="danger" className="gap-1 text-micro">
                                <AlertCircle size={12} /> 0 Marks (Incorrect)
                              </Badge>
                            ) : (
                              <Badge tone="neutral" className="text-micro">
                                Unattempted
                              </Badge>
                            )
                          ) : (
                            <Badge
                              tone={
                                q.marksAwarded !== null && q.marksAwarded !== undefined
                                  ? q.marksAwarded > 0
                                    ? 'success'
                                    : 'neutral'
                                  : 'warning'
                              }
                              className="text-micro font-bold"
                            >
                              {q.marksAwarded !== null && q.marksAwarded !== undefined
                                ? `${q.marksAwarded} / ${q.marks} Marks Awarded`
                                : 'Under Faculty Review'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Question Text */}
                      <p className="text-meta font-medium text-foreground whitespace-pre-line leading-relaxed">
                        {q.questionText}
                      </p>

                      {/* Options for MCQ */}
                      {isObjective ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {q.options?.map((opt: any, optIdx: number) => {
                            const optKey = opt.optionKey || opt.key || String.fromCharCode(65 + optIdx);
                            const isCandidateSelection = q.responseText === opt.id || q.responseText === optKey;
                            const isCorrectKey = Boolean(opt.isCorrect ?? opt.is_correct);

                            return (
                              <div
                                key={opt.id || optKey}
                                className={cn(
                                  'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-micro transition-colors',
                                  isCandidateSelection && isCorrectKey
                                    ? 'border-success bg-success/20 text-foreground font-bold ring-1 ring-success'
                                    : isCandidateSelection && !isCorrectKey
                                    ? 'border-destructive bg-destructive/15 text-foreground font-semibold ring-1 ring-destructive'
                                    : isCorrectKey
                                    ? 'border-success/60 bg-success/10 text-foreground font-semibold'
                                    : 'border-border bg-surface-muted/40 text-text-secondary'
                                )}
                              >
                                <span
                                  className={cn(
                                    'grid h-5 w-5 place-items-center rounded-full text-micro font-bold',
                                    isCandidateSelection
                                      ? isCorrectKey
                                        ? 'bg-success text-white'
                                        : 'bg-destructive text-white'
                                      : isCorrectKey
                                      ? 'bg-success text-white'
                                      : 'bg-border text-text-tertiary'
                                  )}
                                >
                                  {optKey}
                                </span>
                                <span className="truncate">{opt.optionText || opt.text}</span>
                                {isCandidateSelection && (
                                  <span className="ml-auto text-[10px] font-bold text-primary">
                                    (Your Answer)
                                  </span>
                                )}
                                {!isCandidateSelection && isCorrectKey && (
                                  <span className="ml-auto text-[10px] font-bold text-success">
                                    (Correct Key)
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Candidate response for Subjective / Numerical */
                        <div className="space-y-2 mt-2">
                          <div className="rounded-xl border border-border bg-surface-muted/70 p-3 text-meta text-foreground font-mono leading-relaxed whitespace-pre-line">
                            <span className="text-micro font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                              Your Submitted Answer:
                            </span>
                            {q.responseText ? (
                              q.responseText
                            ) : (
                              <span className="text-text-tertiary italic">No response submitted.</span>
                            )}
                          </div>

                          {/* Faculty Feedback */}
                          {q.facultyFeedback && (
                            <div className="rounded-xl border border-primary/30 bg-primary-soft/15 p-3 text-meta text-foreground flex items-start gap-2">
                              <MessageSquare size={16} className="text-primary shrink-0 mt-0.5" />
                              <div>
                                <span className="text-micro font-bold text-primary uppercase tracking-wider block">
                                  Teacher Remarks:
                                </span>
                                <p className="text-meta italic mt-0.5">{q.facultyFeedback}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Official Explanation / Solution */}
                      {q.explanation && (
                        <div className="rounded-xl border border-border/70 bg-surface-muted/50 p-3 text-micro text-text-secondary mt-2">
                          <strong className="text-foreground font-semibold">Solution & Explanation:</strong>{' '}
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-border bg-surface-muted px-6 py-3.5">
          <div className="text-micro text-text-tertiary">
            Performance verified & logged in academic gradebook.
          </div>
          <button onClick={onClose} className="btn-primary py-1.5 px-4 text-meta">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
