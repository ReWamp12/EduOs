'use client';

import React, { useState } from 'react';
import { Sparkles, Send, RefreshCw, BookOpen, KeyRound, FileQuestion } from 'lucide-react';
import { PageHeader, SectionCard, Badge, EmptyState, Skeleton, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';

const CLASSES = ['Class 10', 'Class 11', 'Class 12'];
const SUBJECTS = ['Physics', 'Physical Chemistry', 'Organic Chemistry', 'Mathematics'];
const CHAPTERS: Record<string, string[]> = {
  Physics: ['Rotational Dynamics & Moment of Inertia', 'Thermodynamics & Kinetic Theory', 'Electrostatics & Gauss Law'],
  'Physical Chemistry': ['Chemical Thermodynamics', 'Ionic & Chemical Equilibrium', 'Electrochemistry'],
  'Organic Chemistry': ['Reaction Mechanisms (EAS)', 'Aldehydes, Ketones & Carboxylic Acids', 'Isomerism'],
  Mathematics: ['Definite Integrals & Area', 'Continuity & Differentiability', 'Complex Numbers'],
};
const DIFFICULTIES = ['JEE Main', 'JEE Advanced', 'NEET UG', 'Olympiad / KVPY'];
const QUESTION_TYPES = ['MCQ', 'Subjective', 'Numerical', 'Assertion-Reasoning', 'Case-based'] as const;
type QType = (typeof QUESTION_TYPES)[number];

interface GenQuestion {
  number: number;
  type: QType;
  marks: number;
  question: string;
  answer: string;
}

interface Paper {
  title: string;
  className: string;
  subject: string;
  chapter: string;
  difficulty: string;
  totalMarks: number;
  questions: GenQuestion[];
}

const MARKS_BY_TYPE: Record<QType, number> = {
  MCQ: 4,
  Subjective: 6,
  Numerical: 4,
  'Assertion-Reasoning': 3,
  'Case-based': 5,
};

function buildQuestion(type: QType, n: number, subject: string, chapter: string, difficulty: string): GenQuestion {
  const templates: Record<QType, { q: string; a: string }> = {
    MCQ: {
      q: `[${difficulty}] Single-correct MCQ on ${chapter}: identify the correct expression governing the primary ${subject} relationship in this scenario.`,
      a: 'Option (C) — derived from the standard governing equation for this topic.',
    },
    Subjective: {
      q: `[${difficulty}] Derive, from first principles, the key result for ${chapter}. Show every intermediate step and state assumptions.`,
      a: 'Full derivation expected; award step-marks for setup, integration, and final simplification.',
    },
    Numerical: {
      q: `[${difficulty}] Numerical value type on ${chapter}: compute the required quantity to two decimal places (use standard constants).`,
      a: 'Correct numeric value with units — accept ±0.05 tolerance.',
    },
    'Assertion-Reasoning': {
      q: `[${difficulty}] Assertion (A) about ${chapter} and Reason (R): decide whether R correctly explains A.`,
      a: 'Both A and R true, and R is the correct explanation of A.',
    },
    'Case-based': {
      q: `[${difficulty}] Case study in ${subject} (${chapter}): read the passage and answer the sub-parts on application and analysis.`,
      a: 'Model answers provided per sub-part; grade holistically against the rubric.',
    },
  };
  const t = templates[type];
  return { number: n, type, marks: MARKS_BY_TYPE[type], question: t.q, answer: t.a };
}

export const TeacherAIQuestions: React.FC = () => {
  const [className, setClassName] = useState(CLASSES[1]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [chapter, setChapter] = useState(CHAPTERS[SUBJECTS[0]][0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1]);
  const [numQuestions, setNumQuestions] = useState(6);
  const [types, setTypes] = useState<QType[]>(['MCQ', 'Numerical', 'Assertion-Reasoning']);
  const [generating, setGenerating] = useState(false);
  const [paper, setPaper] = useState<Paper | null>(null);

  const onSubjectChange = (s: string) => {
    setSubject(s);
    setChapter(CHAPTERS[s][0]);
  };

  const toggleType = (t: QType) => {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const generate = () => {
    if (types.length === 0) {
      toast('Select a question type', 'warning', 'Choose at least one question type to generate.');
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      const questions: GenQuestion[] = Array.from({ length: numQuestions }, (_, i) =>
        buildQuestion(types[i % types.length], i + 1, subject, chapter, difficulty),
      );
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      setPaper({
        title: `${difficulty} Practice Paper — ${chapter}`,
        className,
        subject,
        chapter,
        difficulty,
        totalMarks,
        questions,
      });
      setGenerating(false);
      toast('Question paper generated', 'success', `${numQuestions} questions · ${totalMarks} marks`);
    }, 800);
  };

  const publish = () => {
    toast('Published to LMS', 'success', `${paper?.title} is now available to the batch`);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Question Studio"
        subtitle="Generate balanced test papers with model answer keys in seconds"
        actions={<Badge tone="info"><Sparkles size={12} /> AI Engine</Badge>}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.6fr]">
        {/* Config */}
        <SectionCard title="Paper Configuration" icon={<BookOpen size={18} />} bodyClassName="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="class">Class</label>
            <select id="class" className="input" value={className} onChange={(e) => setClassName(e.target.value)}>
              {CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="subject">Subject</label>
            <select id="subject" className="input" value={subject} onChange={(e) => onSubjectChange(e.target.value)}>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="chapter">Chapter</label>
            <select id="chapter" className="input" value={chapter} onChange={(e) => setChapter(e.target.value)}>
              {CHAPTERS[subject].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="difficulty">Difficulty</label>
            <select id="difficulty" className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="num">
              Number of questions: <span className="text-primary">{numQuestions}</span>
            </label>
            <input
              id="num"
              type="range"
              min={4}
              max={20}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <span className="label">Question types</span>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map((t) => {
                const active = types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleType(t)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-micro font-semibold transition-colors',
                      active
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-border bg-surface text-text-secondary hover:bg-muted',
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={generate} disabled={generating} className="btn-primary mt-1 w-full">
            <Sparkles size={16} /> {generating ? 'Generating…' : paper ? 'Regenerate' : 'Generate'}
          </button>
        </SectionCard>

        {/* Output */}
        <SectionCard
          title="Generated Paper"
          icon={<FileQuestion size={18} />}
          action={
            paper ? (
              <div className="flex gap-2">
                <button onClick={generate} disabled={generating} className="btn-secondary px-3 py-1.5 text-micro">
                  <RefreshCw size={13} /> Regenerate
                </button>
                <button onClick={publish} className="btn-primary px-3 py-1.5 text-micro">
                  <Send size={13} /> Publish to LMS
                </button>
              </div>
            ) : undefined
          }
          bodyClassName="flex flex-col gap-4"
        >
          {generating ? (
            <>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : paper ? (
            <>
              <div className="rounded-md border border-border bg-surface-muted p-4">
                <h3 className="text-section text-foreground">{paper.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="neutral">{paper.className}</Badge>
                  <Badge tone="primary">{paper.subject}</Badge>
                  <Badge tone="info">{paper.difficulty}</Badge>
                  <Badge tone="success">{paper.questions.length} questions · {paper.totalMarks} marks</Badge>
                </div>
              </div>

              {/* Questions */}
              <div className="flex flex-col gap-3">
                {paper.questions.map((q) => (
                  <div key={q.number} className="rounded-md border border-border bg-surface p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-meta font-semibold text-foreground">Question {q.number}</span>
                      <div className="flex items-center gap-2">
                        <Badge tone="neutral">{q.type}</Badge>
                        <Badge tone="primary">{q.marks} marks</Badge>
                      </div>
                    </div>
                    <p className="text-meta leading-relaxed text-text-secondary">{q.question}</p>
                  </div>
                ))}
              </div>

              {/* Answer key */}
              <div className="rounded-md border border-info/20 bg-info-soft p-4">
                <div className="mb-2 flex items-center gap-2 text-info">
                  <KeyRound size={16} />
                  <span className="text-meta font-semibold">Answer Key</span>
                </div>
                <ol className="flex flex-col gap-2">
                  {paper.questions.map((q) => (
                    <li key={q.number} className="text-micro leading-relaxed text-text-secondary">
                      <span className="font-semibold text-foreground">Q{q.number}.</span> {q.answer}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Sparkles size={22} />}
              title="No paper yet"
              description="Configure parameters on the left and generate an AI question paper with a full answer key."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
};
