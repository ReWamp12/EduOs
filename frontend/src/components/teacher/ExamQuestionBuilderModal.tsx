'use client';

import React, { useState, useEffect } from 'react';
import { dataService } from '@/lib/dataService';
import { ExamQuestion, QuestionType } from '@/lib/types';
import { Badge, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  Award,
  Sparkles,
  Save,
  Check,
  AlertCircle,
  Layers,
} from 'lucide-react';

interface Props {
  exam: {
    id: string;
    title: string;
    totalMarks: number;
    mode?: string;
    status?: string;
  };
  onClose: () => void;
  onQuestionsUpdated?: () => void;
}

export const ExamQuestionBuilderModal: React.FC<Props> = ({ exam, onClose, onQuestionsUpdated }) => {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New question form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<QuestionType>('single_choice');
  const [qMarks, setQMarks] = useState('4');
  const [qNegMarks, setQNegMarks] = useState('1');
  const [qExplanation, setQExplanation] = useState('');
  const [options, setOptions] = useState<Array<{ text: string; isCorrect: boolean }>>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const qList = await dataService.getExamQuestions(exam.id);
      setQuestions(qList || []);
    } catch (err) {
      console.warn('Failed to load exam questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [exam.id]);

  const totalCalculatedMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);

  const handleAddOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast('Minimum 2 options required', 'warning', 'Multiple choice questions require at least 2 options.');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleToggleCorrect = (index: number) => {
    if (qType === 'single_choice') {
      setOptions(
        options.map((opt, i) => ({
          ...opt,
          isCorrect: i === index,
        }))
      );
    } else {
      setOptions(
        options.map((opt, i) => (i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt))
      );
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) {
      toast('Question text required', 'warning', 'Please enter the question statement.');
      return;
    }

    if (qType === 'single_choice' || qType === 'multiple_choice') {
      const filled = options.filter((o) => o.text.trim().length > 0);
      if (filled.length < 2) {
        toast('Incomplete options', 'warning', 'Please provide at least 2 non-empty options.');
        return;
      }
      const hasCorrect = options.some((o) => o.isCorrect && o.text.trim().length > 0);
      if (!hasCorrect) {
        toast('Select correct answer', 'warning', 'Mark at least one option as the correct answer.');
        return;
      }
    }

    setSaving(true);
    try {
      const formattedOptions =
        qType === 'single_choice' || qType === 'multiple_choice'
          ? options
              .filter((o) => o.text.trim().length > 0)
              .map((o, idx) => ({
                optionKey: String.fromCharCode(65 + idx),
                optionText: o.text.trim(),
                isCorrect: o.isCorrect,
                orderNumber: idx + 1,
              }))
          : undefined;

      const created = await dataService.createExamQuestion(exam.id, {
        questionText: qText.trim(),
        questionType: qType,
        marks: Number(qMarks) || 4,
        negativeMarks: Number(qNegMarks) || 0,
        explanation: qExplanation.trim() || undefined,
        options: formattedOptions as any,
      });

      if (created) {
        toast('Question added', 'success', `Question #${questions.length + 1} added to assessment.`);
        setShowAddForm(false);
        setQText('');
        setQExplanation('');
        setOptions([
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ]);
        await loadQuestions();
        if (onQuestionsUpdated) onQuestionsUpdated();
      } else {
        toast('Error', 'error', 'Could not save question to database.');
      }
    } catch (err: any) {
      toast('Error saving question', 'error', err?.message || 'Unexpected error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    const ok = await dataService.deleteExamQuestion(questionId);
    if (ok) {
      toast('Question removed', 'info', 'Question removed from question bank.');
      await loadQuestions();
      if (onQuestionsUpdated) onQuestionsUpdated();
    } else {
      toast('Delete failed', 'error', 'Could not delete question.');
    }
  };

  const handleSeedSampleQuestions = async () => {
    setSaving(true);
    try {
      const samples = [
        {
          questionText: 'Which of the following describes the rotational analog of mass in classical mechanics?',
          questionType: 'single_choice' as QuestionType,
          marks: 4,
          negativeMarks: 1,
          explanation: 'Moment of inertia (I) is the measure of rotational inertia, directly analogous to mass in linear motion.',
          options: [
            { optionKey: 'A', optionText: 'Angular Momentum', isCorrect: false },
            { optionKey: 'B', optionText: 'Moment of Inertia', isCorrect: true },
            { optionKey: 'C', optionText: 'Torque', isCorrect: false },
            { optionKey: 'D', optionText: 'Angular Velocity', isCorrect: false },
          ],
        },
        {
          questionText: 'For an ideal gas undergoing an adiabatic reversible expansion, which relationship holds constant? (gamma = Cp/Cv)',
          questionType: 'single_choice' as QuestionType,
          marks: 4,
          negativeMarks: 1,
          explanation: 'For an adiabatic reversible process of an ideal gas, PV^gamma = constant.',
          options: [
            { optionKey: 'A', optionText: 'P * V = constant', isCorrect: false },
            { optionKey: 'B', optionText: 'P * V^gamma = constant', isCorrect: true },
            { optionKey: 'C', optionText: 'T * V^(gamma) = constant', isCorrect: false },
            { optionKey: 'D', optionText: 'P^(gamma) * V = constant', isCorrect: false },
          ],
        },
        {
          questionText: 'Evaluate the limit: lim (x -> 0) [sin(5x) / x]',
          questionType: 'numerical' as QuestionType,
          marks: 4,
          negativeMarks: 0,
          explanation: 'lim (x -> 0) [sin(5x) / (5x) * 5] = 1 * 5 = 5.',
        },
      ];

      for (const s of samples) {
        await dataService.createExamQuestion(exam.id, {
          questionText: s.questionText,
          questionType: s.questionType,
          marks: s.marks,
          negativeMarks: s.negativeMarks,
          explanation: s.explanation,
          options: (s as any).options,
        });
      }
      toast('Template questions loaded', 'success', 'Added 3 curated standard questions.');
      await loadQuestions();
      if (onQuestionsUpdated) onQuestionsUpdated();
    } catch (e: any) {
      toast('Error seeding', 'error', e?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border bg-surface-muted px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary font-bold">
              <Layers size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-section font-semibold text-foreground">Assessment Question Bank</h3>
                <Badge tone="primary">{exam.title}</Badge>
              </div>
              <p className="text-micro text-text-tertiary">
                {questions.length} questions configured · Total marks: {totalCalculatedMarks} / {exam.totalMarks}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted/50 p-3.5">
            <div className="flex items-center gap-3">
              <span className="text-meta font-medium text-text-secondary">Status:</span>
              <Badge tone={totalCalculatedMarks === exam.totalMarks ? 'success' : 'warning'}>
                {totalCalculatedMarks === exam.totalMarks ? 'Marks Balanced' : `${exam.totalMarks - totalCalculatedMarks} Marks Delta`}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {questions.length === 0 && (
                <button
                  onClick={handleSeedSampleQuestions}
                  disabled={saving}
                  className="btn-secondary py-1.5 px-3 text-meta gap-1.5"
                >
                  <Sparkles size={14} className="text-primary" /> Load Standard Questions
                </button>
              )}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn-primary py-1.5 px-3.5 text-meta gap-1.5"
              >
                <Plus size={15} /> {showAddForm ? 'Cancel Form' : 'Add New Question'}
              </button>
            </div>
          </div>

          {/* Add Question Form */}
          {showAddForm && (
            <form
              onSubmit={handleSaveQuestion}
              className="flex flex-col gap-4 rounded-xl border border-primary/40 bg-primary-soft/15 p-5 animate-scale-in"
            >
              <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                <h4 className="text-meta font-semibold text-foreground flex items-center gap-2">
                  <FileQuestion size={16} className="text-primary" />
                  Compose Question #{questions.length + 1}
                </h4>
                <div className="flex items-center gap-2">
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as QuestionType)}
                    className="input py-1 text-meta w-44"
                  >
                    <option value="single_choice">Single Choice (MCQ)</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="numerical">Numerical Value</option>
                    <option value="subjective">Subjective / Descriptive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Question Statement & Problem</label>
                <textarea
                  rows={3}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Enter clear, concise question statement. Formulae or diagrams can be referenced."
                  className="input"
                  required
                />
              </div>

              {/* Options for MCQ / Multiple choice */}
              {(qType === 'single_choice' || qType === 'multiple_choice') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="label mb-0">Answer Options & Correct Key</label>
                    <span className="text-micro text-text-tertiary">
                      Click radio/checkbox to mark correct answer
                    </span>
                  </div>
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleCorrect(idx)}
                        className={cn(
                          'grid h-8 w-8 shrink-0 place-items-center rounded-lg border font-bold text-micro transition-colors',
                          opt.isCorrect
                            ? 'border-success bg-success text-white shadow-2xs'
                            : 'border-border bg-surface text-text-secondary hover:border-primary'
                        )}
                        title={opt.isCorrect ? 'Correct Option' : 'Mark as Correct'}
                      >
                        {opt.isCorrect ? <Check size={14} /> : String.fromCharCode(65 + idx)}
                      </button>
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + idx)} description…`}
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx].text = e.target.value;
                          setOptions(updated);
                        }}
                        className="input flex-1 py-1.5 text-meta"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-text-tertiary hover:text-destructive p-1"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="inline-flex items-center gap-1 text-micro font-medium text-primary hover:underline pt-1"
                    >
                      <Plus size={13} /> Add another option
                    </button>
                  )}
                </div>
              )}

              {/* Numerical or Subjective Note */}
              {qType === 'numerical' && (
                <div className="rounded-lg border border-border bg-surface-muted p-3 text-micro text-text-secondary">
                  <strong>Numerical Input:</strong> Student will enter a decimal or integer number during the test.
                </div>
              )}

              {qType === 'subjective' && (
                <div className="rounded-lg border border-border bg-surface-muted p-3 text-micro text-text-secondary">
                  <strong>Subjective Answer:</strong> Student will write text or upload derivations. This will be marked by teacher in the evaluation step.
                </div>
              )}

              {/* Marks & Neg marks */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Marks Awarded</label>
                  <input
                    type="number"
                    min={1}
                    value={qMarks}
                    onChange={(e) => setQMarks(e.target.value)}
                    className="input py-1.5"
                  />
                </div>
                <div>
                  <label className="label">Negative Marks</label>
                  <input
                    type="number"
                    min={0}
                    step={0.25}
                    value={qNegMarks}
                    onChange={(e) => setQNegMarks(e.target.value)}
                    className="input py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="label">Solution / Explanation (Shown after results)</label>
                <textarea
                  rows={2}
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Step-by-step reasoning or formula used to derive the answer…"
                  className="input"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary py-1.5 px-3 text-meta"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-1.5 px-4 text-meta gap-1.5"
                >
                  <Save size={14} /> Save Question
                </button>
              </div>
            </form>
          )}

          {/* Question List */}
          {loading ? (
            <div className="py-12 text-center text-text-tertiary">Loading assessment questions…</div>
          ) : questions.length === 0 ? (
            <EmptyState
              icon={<FileQuestion size={28} />}
              title="No questions in this assessment"
              description="Click 'Add New Question' or 'Load Standard Questions' to build your assessment paper."
            />
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="group relative flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/40 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-primary-soft text-primary font-bold text-micro">
                        {idx + 1}
                      </span>
                      <Badge tone="neutral" className="text-micro capitalize">
                        {q.questionType.replace('_', ' ')}
                      </Badge>
                      <span className="text-micro font-medium text-success">
                        +{q.marks} Marks
                      </span>
                      {q.negativeMarks ? (
                        <span className="text-micro font-medium text-destructive">
                          -{q.negativeMarks} Neg
                        </span>
                      ) : null}
                    </div>

                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-text-tertiary hover:text-destructive p-1 transition-colors"
                      title="Delete question"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <p className="text-meta font-medium text-foreground whitespace-pre-line leading-relaxed">
                    {q.questionText}
                  </p>

                  {/* MCQ Options Display */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {q.options.map((opt: any, optIdx: number) => {
                        const isCorrect = Boolean(opt.isCorrect ?? opt.is_correct);
                        const optKey = opt.optionKey || opt.key || String.fromCharCode(65 + optIdx);
                        const optText = opt.optionText || opt.text || '';
                        return (
                          <div
                            key={opt.id || optKey}
                            className={cn(
                              'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-micro transition-colors',
                              isCorrect
                                ? 'border-success/40 bg-success/10 text-foreground font-medium'
                                : 'border-border bg-surface-muted text-text-secondary'
                            )}
                          >
                            <span
                              className={cn(
                                'grid h-5 w-5 place-items-center rounded-full text-micro font-bold',
                                isCorrect ? 'bg-success text-white' : 'bg-border text-text-tertiary'
                              )}
                            >
                              {optKey}
                            </span>
                            <span className="truncate">{optText}</span>
                            {isCorrect && (
                              <CheckCircle2 size={13} className="ml-auto text-success shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="rounded-md border border-border/80 bg-surface-muted/60 p-2.5 text-micro text-text-secondary">
                      <strong className="text-foreground">Solution:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-border bg-surface-muted px-6 py-3.5">
          <div className="text-micro text-text-tertiary">
            Total Questions: <strong>{questions.length}</strong> · Total Marks: <strong>{totalCalculatedMarks}</strong>
          </div>
          <button onClick={onClose} className="btn-primary py-1.5 px-4 text-meta">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
