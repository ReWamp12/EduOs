'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { Badge, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  X,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
  Send,
  Save,
  FileText,
  User,
  Check,
  AlertCircle,
  BookOpen,
  Search,
  CheckCheck,
  HelpCircle,
} from 'lucide-react';

interface Props {
  exam: {
    id: string;
    title: string;
    maxMarks: number;
    passingMarks?: number;
    status: string;
    subject?: string;
  };
  onClose: () => void;
  onEvaluated?: () => void;
}

export const TeacherExamEvaluationModal: React.FC<Props> = ({
  exam,
  onClose,
  onEvaluated,
}) => {
  const { session } = useAuth();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Grade inputs state: questionId -> { marks: number, feedback: string, saving: boolean }
  const [gradeInputs, setGradeInputs] = useState<
    Record<string, { marks: number | string; feedback: string; saving?: boolean }>
  >({});
  const [publishingAll, setPublishingAll] = useState(false);

  const loadAttempts = async () => {
    setLoading(true);
    try {
      const list = await dataService.getExamAttemptsForTeacher(exam.id);
      setAttempts(list || []);
      if (list && list.length > 0 && !selectedAttemptId) {
        setSelectedAttemptId(list[0].id);
      }
    } catch (err) {
      console.warn('Failed to load exam attempts:', err);
      toast('Error', 'error', 'Could not load student attempts roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts();
  }, [exam.id]);

  // Load selected attempt detail
  useEffect(() => {
    if (!selectedAttemptId) {
      setAttemptDetail(null);
      return;
    }
    let active = true;
    setLoadingDetail(true);
    dataService
      .getExamAttemptDetail(selectedAttemptId)
      .then((detail) => {
        if (!active) return;
        setAttemptDetail(detail);

        // Populate initial grade inputs for subjective questions
        if (detail?.questions) {
          const initialInputs: Record<string, { marks: number | string; feedback: string }> = {};
          detail.questions.forEach((q: any) => {
            initialInputs[q.id] = {
              marks: q.marksAwarded !== null && q.marksAwarded !== undefined ? q.marksAwarded : '',
              feedback: q.facultyFeedback || '',
            };
          });
          setGradeInputs(initialInputs);
        }
      })
      .catch((err) => {
        console.warn('Error fetching attempt detail:', err);
      })
      .finally(() => {
        if (active) setLoadingDetail(false);
      });

    return () => {
      active = false;
    };
  }, [selectedAttemptId]);

  const handleSaveQuestionGrade = async (q: any) => {
    if (!q.responseId) {
      toast('Cannot Grade', 'warning', 'No submitted response found for this question.');
      return;
    }
    const input = gradeInputs[q.id];
    const marksNum = Number(input?.marks);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > q.marks) {
      toast(
        'Invalid Marks',
        'warning',
        `Marks must be between 0 and ${q.marks} for this question.`
      );
      return;
    }

    setGradeInputs((prev) => ({
      ...prev,
      [q.id]: { ...prev[q.id], saving: true },
    }));

    try {
      const graderId = session?.userId || 'Faculty';
      const ok = await dataService.gradeAttemptResponse(
        q.responseId,
        marksNum,
        input?.feedback || '',
        graderId
      );

      if (ok) {
        toast('Grade Recorded', 'success', `Awarded ${marksNum}/${q.marks} marks.`);
        // Reload detail and list to refresh score totals
        if (selectedAttemptId) {
          const updated = await dataService.getExamAttemptDetail(selectedAttemptId);
          setAttemptDetail(updated);
        }
        const updatedList = await dataService.getExamAttemptsForTeacher(exam.id);
        setAttempts(updatedList || []);
        if (onEvaluated) onEvaluated();
      } else {
        toast('Save Failed', 'error', 'Could not record marks in database.');
      }
    } catch (e: any) {
      toast('Error', 'error', e?.message || 'Error saving grade.');
    } finally {
      setGradeInputs((prev) => ({
        ...prev,
        [q.id]: { ...prev[q.id], saving: false },
      }));
    }
  };

  const handlePublishSingleAttempt = async (attemptId: string) => {
    try {
      const ok = await dataService.publishExamAttempt(attemptId);
      if (ok) {
        toast('Results Published', 'success', 'Published scorecard to student portal.');
        await loadAttempts();
        if (selectedAttemptId === attemptId) {
          const updated = await dataService.getExamAttemptDetail(attemptId);
          setAttemptDetail(updated);
        }
        if (onEvaluated) onEvaluated();
      } else {
        toast('Publish Failed', 'error', 'Could not publish attempt result.');
      }
    } catch (e: any) {
      toast('Error', 'error', e?.message);
    }
  };

  const handlePublishAllResults = async () => {
    if (!confirm('Publish results for all evaluated candidate attempts? Students will be notified.')) {
      return;
    }
    setPublishingAll(true);
    try {
      const count = await dataService.publishAllExamResultsForExam(exam.id);
      toast(
        'Assessment Results Published',
        'success',
        `Successfully published scorecards for ${count} candidate(s).`
      );
      await loadAttempts();
      if (selectedAttemptId) {
        const updated = await dataService.getExamAttemptDetail(selectedAttemptId);
        setAttemptDetail(updated);
      }
      if (onEvaluated) onEvaluated();
    } catch (e: any) {
      toast('Publish Error', 'error', e?.message);
    } finally {
      setPublishingAll(false);
    }
  };

  const filteredAttempts = attempts.filter(
    (a) =>
      a.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const evaluatedCount = attempts.filter((a) => a.status === 'evaluated' || a.isPublished).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in">
        {/* Modal Top Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border bg-surface-muted px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary font-bold">
              <Award size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-section font-semibold text-foreground">
                  Assessment Evaluation & Roster
                </h3>
                <Badge tone="primary">{exam.title}</Badge>
                <Badge tone="neutral" className="text-micro">
                  Max: {exam.maxMarks} Marks
                </Badge>
              </div>
              <p className="text-micro text-text-tertiary">
                {attempts.length} candidate attempts · {evaluatedCount} evaluated · Passing marks:{' '}
                {exam.passingMarks || Math.round(exam.maxMarks * 0.4)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {attempts.length > 0 && (
              <button
                onClick={handlePublishAllResults}
                disabled={publishingAll}
                className="btn-primary py-1.5 px-3 text-meta gap-1.5 shadow-xs"
                title="Publish all evaluated scorecards to students"
              >
                <CheckCheck size={14} />
                {publishingAll ? 'Publishing…' : 'Publish All Results'}
              </button>
            )}

            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary hover:bg-muted hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content: 2-Column Evaluation Workspace */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Column: Attempts Roster */}
          <div className="w-80 sm:w-96 shrink-0 border-r border-border bg-surface-muted/30 flex flex-col min-h-0">
            {/* Search Bar */}
            <div className="p-3 border-b border-border bg-surface">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Filter student or roll no…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-8 py-1.5 text-meta w-full"
                />
              </div>
            </div>

            {/* Candidate List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/60 p-2 space-y-1">
              {loading ? (
                <div className="py-12 text-center text-meta text-text-tertiary">
                  Loading candidate attempts…
                </div>
              ) : filteredAttempts.length === 0 ? (
                <div className="py-12 text-center text-meta text-text-tertiary">
                  No candidate attempts submitted yet.
                </div>
              ) : (
                filteredAttempts.map((att) => {
                  const isSelected = att.id === selectedAttemptId;
                  const isPublished = Boolean(att.isPublished);
                  const isEvaluated = att.status === 'evaluated' || isPublished;
                  return (
                    <div
                      key={att.id}
                      onClick={() => setSelectedAttemptId(att.id)}
                      className={cn(
                        'flex flex-col gap-1.5 p-3 rounded-xl cursor-pointer transition-all text-left border',
                        isSelected
                          ? 'border-primary bg-primary-soft/20 shadow-xs ring-1 ring-primary'
                          : 'border-transparent bg-surface hover:bg-surface-muted'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-meta truncate">
                          {att.studentName}
                        </span>
                        <span className="font-mono text-micro text-text-tertiary">
                          #{att.rollNumber}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-micro">
                        <div className="flex items-center gap-1.5">
                          {isPublished ? (
                            <Badge tone="success" className="text-[10px]">
                              Published
                            </Badge>
                          ) : isEvaluated ? (
                            <Badge tone="info" className="text-[10px]">
                              Evaluated
                            </Badge>
                          ) : (
                            <Badge tone="warning" className="text-[10px]">
                              Pending Grade
                            </Badge>
                          )}
                          {att.autoSubmitted && (
                            <span className="text-micro text-text-tertiary italic">Timer Exp</span>
                          )}
                        </div>

                        <div className="font-bold text-foreground">
                          {att.obtainedMarks !== null && att.obtainedMarks !== undefined
                            ? `${att.obtainedMarks} / ${att.maxMarks || exam.maxMarks}`
                            : '— / ' + exam.maxMarks}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Candidate Answer Sheet & Grade Input */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 min-h-0 bg-surface">
            {loadingDetail ? (
              <div className="py-24 text-center text-meta text-text-tertiary">
                Loading candidate submission…
              </div>
            ) : !attemptDetail ? (
              <EmptyState
                icon={<FileText size={32} />}
                title="Select a Candidate Attempt"
                description="Select a candidate from the roster on the left to review their responses and award subjective grades."
              />
            ) : (
              <div className="space-y-6 max-w-3xl mx-auto w-full">
                {/* Candidate Overview Strip */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted/60 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-section font-bold text-foreground">
                        {attemptDetail.studentName || 'Candidate Submission'}
                      </h4>
                      <Badge tone="primary" className="text-micro">
                        Attempt #{attemptDetail.attemptNumber || 1}
                      </Badge>
                      {attemptDetail.isPublished && (
                        <Badge tone="success" className="text-micro">
                          Scorecard Published
                        </Badge>
                      )}
                    </div>
                    <p className="text-micro text-text-tertiary mt-0.5">
                      Submitted on{' '}
                      {attemptDetail.submittedAt
                        ? new Date(attemptDetail.submittedAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-micro text-text-tertiary">Candidate Score</span>
                      <div className="text-section font-bold text-primary">
                        {attemptDetail.obtainedMarks ?? 0} / {exam.maxMarks} (
                        {attemptDetail.percentage ?? 0}%)
                      </div>
                    </div>

                    {!attemptDetail.isPublished && (
                      <button
                        onClick={() => handlePublishSingleAttempt(attemptDetail.id)}
                        className="btn-secondary py-1.5 px-3 text-meta text-success hover:border-success gap-1"
                        title="Publish this student's result immediately"
                      >
                        <Send size={13} /> Publish Scorecard
                      </button>
                    )}
                  </div>
                </div>

                {/* Questions & Responses List */}
                <div className="space-y-5">
                  {attemptDetail.questions?.map((q: any, idx: number) => {
                    const isObjective =
                      q.questionType === 'single_choice' ||
                      q.questionType === 'multiple_choice' ||
                      q.questionType === 'mcq' ||
                      q.questionType === 'true_false';

                    const isSubjective =
                      q.questionType === 'subjective' ||
                      q.questionType === 'descriptive' ||
                      q.questionType === 'short_answer';

                    const input = gradeInputs[q.id] || { marks: '', feedback: '' };

                    return (
                      <div
                        key={q.id}
                        className={cn(
                          'rounded-xl border p-5 transition-all shadow-2xs space-y-3',
                          q.marksAwarded !== null && q.marksAwarded !== undefined
                            ? 'border-border bg-surface'
                            : 'border-warning/50 bg-warning-soft/10'
                        )}
                      >
                        {/* Question Header */}
                        <div className="flex items-center justify-between border-b border-border pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-md bg-primary-soft text-primary font-bold text-micro">
                              {idx + 1}
                            </span>
                            <Badge tone="neutral" className="capitalize text-micro">
                              {q.questionType.replace('_', ' ')}
                            </Badge>
                            <span className="text-micro text-text-tertiary">
                              Max: <strong>{q.marks} Marks</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {q.marksAwarded !== null && q.marksAwarded !== undefined ? (
                              <Badge
                                tone={q.marksAwarded > 0 ? 'success' : 'neutral'}
                                className="text-micro font-bold"
                              >
                                {q.marksAwarded} / {q.marks} Marks
                              </Badge>
                            ) : (
                              <Badge tone="warning" className="text-micro">
                                Needs Grading
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Statement */}
                        <p className="text-meta font-medium text-foreground whitespace-pre-line leading-relaxed">
                          {q.questionText}
                        </p>

                        {/* Candidate's Response Section */}
                        <div className="mt-3">
                          <span className="text-micro font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">
                            Candidate's Response:
                          </span>

                          {isObjective ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options?.map((opt: any, optIdx: number) => {
                                const optKey =
                                  opt.optionKey || opt.key || String.fromCharCode(65 + optIdx);
                                const isCandidateSelection =
                                  q.responseText === opt.id || q.responseText === optKey;
                                const isCorrectKey = Boolean(opt.isCorrect ?? opt.is_correct);

                                return (
                                  <div
                                    key={opt.id || optKey}
                                    className={cn(
                                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-micro transition-colors',
                                      isCandidateSelection && isCorrectKey
                                        ? 'border-success bg-success/15 text-foreground font-semibold ring-1 ring-success'
                                        : isCandidateSelection && !isCorrectKey
                                        ? 'border-destructive bg-destructive/15 text-foreground font-semibold ring-1 ring-destructive'
                                        : isCorrectKey
                                        ? 'border-success/40 bg-success/5 text-text-secondary'
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
                                          : 'bg-border text-text-tertiary'
                                      )}
                                    >
                                      {optKey}
                                    </span>
                                    <span className="truncate">{opt.optionText || opt.text}</span>
                                    {isCandidateSelection && (
                                      <span className="ml-auto text-[10px] font-bold text-primary">
                                        (Selected)
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-border bg-surface-muted p-3.5 text-meta text-foreground font-mono leading-relaxed whitespace-pre-line">
                              {q.responseText ? (
                                q.responseText
                              ) : (
                                <span className="text-text-tertiary italic">
                                  No response provided by candidate.
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Subjective Manual Grading Controls */}
                        {isSubjective && (
                          <div className="mt-3 rounded-xl border border-primary/30 bg-primary-soft/10 p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <span className="text-meta font-semibold text-foreground flex items-center gap-1.5">
                                <Award size={14} className="text-primary" />
                                Award Marks & Remarks
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-micro text-text-secondary">
                                  Marks (0 - {q.marks}):
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  max={q.marks}
                                  step={0.5}
                                  placeholder="0"
                                  value={input.marks}
                                  onChange={(e) =>
                                    setGradeInputs((prev) => ({
                                      ...prev,
                                      [q.id]: { ...prev[q.id], marks: e.target.value },
                                    }))
                                  }
                                  className="input w-24 py-1 text-meta font-bold text-center"
                                />
                              </div>
                            </div>

                            <div>
                              <input
                                type="text"
                                placeholder="Faculty feedback / remark (optional)…"
                                value={input.feedback}
                                onChange={(e) =>
                                  setGradeInputs((prev) => ({
                                    ...prev,
                                    [q.id]: { ...prev[q.id], feedback: e.target.value },
                                  }))
                                }
                                className="input w-full py-1 text-meta"
                              />
                            </div>

                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleSaveQuestionGrade(q)}
                                disabled={input.saving}
                                className="btn-primary py-1 px-3 text-meta gap-1.5"
                              >
                                <Save size={13} />
                                {input.saving ? 'Saving…' : 'Save Grade'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Solution & Explanation */}
                        {q.explanation && (
                          <div className="text-micro text-text-secondary bg-surface-muted/60 p-2.5 rounded-lg border border-border/70">
                            <strong className="text-foreground">Official Solution:</strong>{' '}
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-border bg-surface-muted px-6 py-3">
          <div className="text-micro text-text-tertiary">
            Evaluated attempts contribute immediately to Student Performance composite analytics.
          </div>
          <button onClick={onClose} className="btn-secondary py-1.5 px-4 text-meta">
            Close Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
