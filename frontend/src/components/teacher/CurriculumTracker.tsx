'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  Calendar,
  FileCheck,
  Plus,
} from 'lucide-react';
import { PageHeader, SectionCard, StatCard, Badge, ProgressBar, Card, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';

interface Topic {
  id: string;
  name: string;
  periods: number;
  completed: boolean;
  targetDate: string;
  hasLessonPlan: boolean;
}

interface Chapter {
  id: string;
  number: number;
  title: string;
  topics: Topic[];
}

interface Unit {
  id: string;
  name: string;
  weightageMarks: number;
  chapters: Chapter[];
}

const CURRICULUM_DATA: Record<string, Unit[]> = {
  Mathematics: [
    {
      id: 'u1',
      name: 'Unit I: Number Systems',
      weightageMarks: 6,
      chapters: [
        {
          id: 'c1',
          number: 1,
          title: 'Real Numbers',
          topics: [
            { id: 't1', name: 'Fundamental Theorem of Arithmetic', periods: 4, completed: true, targetDate: '15 Jul 2026', hasLessonPlan: true },
            { id: 't2', name: 'Revisiting Irrational Numbers (Proofs of √2, √3)', periods: 4, completed: true, targetDate: '22 Jul 2026', hasLessonPlan: true },
          ],
        },
      ],
    },
    {
      id: 'u2',
      name: 'Unit II: Algebra',
      weightageMarks: 20,
      chapters: [
        {
          id: 'c2',
          number: 2,
          title: 'Polynomials',
          topics: [
            { id: 't3', name: 'Zeros of a Polynomial & Geometric Meaning', periods: 4, completed: true, targetDate: '02 Aug 2026', hasLessonPlan: true },
            { id: 't4', name: 'Relationship between Zeros and Coefficients of Quadratic Polynomials', periods: 4, completed: true, targetDate: '10 Aug 2026', hasLessonPlan: true },
          ],
        },
        {
          id: 'c3',
          number: 3,
          title: 'Pair of Linear Equations in Two Variables',
          topics: [
            { id: 't5', name: 'Graphical Method of Solution & Consistency', periods: 5, completed: true, targetDate: '18 Aug 2026', hasLessonPlan: true },
            { id: 't6', name: 'Algebraic Methods: Substitution & Elimination', periods: 6, completed: true, targetDate: '28 Aug 2026', hasLessonPlan: true },
          ],
        },
        {
          id: 'c4',
          number: 4,
          title: 'Quadratic Equations',
          topics: [
            { id: 't7', name: 'Standard Form of Quadratic Equations', periods: 3, completed: true, targetDate: '05 Sep 2026', hasLessonPlan: true },
            { id: 't8', name: 'Solution by Factorisation & Quadratic Formula', periods: 6, completed: false, targetDate: '15 Sep 2026', hasLessonPlan: true },
            { id: 't9', name: 'Discriminant and Nature of Roots', periods: 4, completed: false, targetDate: '22 Sep 2026', hasLessonPlan: false },
          ],
        },
        {
          id: 'c5',
          number: 5,
          title: 'Arithmetic Progressions',
          topics: [
            { id: 't10', name: 'nth Term of an AP', periods: 4, completed: false, targetDate: '05 Oct 2026', hasLessonPlan: true },
            { id: 't11', name: 'Sum of First n Terms of an AP', periods: 6, completed: false, targetDate: '15 Oct 2026', hasLessonPlan: false },
          ],
        },
      ],
    },
    {
      id: 'u3',
      name: 'Unit III: Coordinate Geometry',
      weightageMarks: 6,
      chapters: [
        {
          id: 'c6',
          number: 6,
          title: 'Coordinate Geometry',
          topics: [
            { id: 't12', name: 'Distance Formula & Applications', periods: 4, completed: false, targetDate: '28 Oct 2026', hasLessonPlan: true },
            { id: 't13', name: 'Section Formula (Internal Division)', periods: 4, completed: false, targetDate: '05 Nov 2026', hasLessonPlan: false },
          ],
        },
      ],
    },
    {
      id: 'u4',
      name: 'Unit IV: Geometry',
      weightageMarks: 15,
      chapters: [
        {
          id: 'c7',
          number: 7,
          title: 'Triangles',
          topics: [
            { id: 't14', name: 'Basic Proportionality Theorem (Thales Theorem)', periods: 6, completed: false, targetDate: '15 Nov 2026', hasLessonPlan: true },
            { id: 't15', name: 'Criteria for Similarity of Triangles (AAA, SSS, SAS)', periods: 6, completed: false, targetDate: '25 Nov 2026', hasLessonPlan: false },
          ],
        },
        {
          id: 'c8',
          number: 8,
          title: 'Circles',
          topics: [
            { id: 't16', name: 'Tangent to a Circle & Theorem Proofs', periods: 6, completed: false, targetDate: '05 Dec 2026', hasLessonPlan: false },
          ],
        },
      ],
    },
    {
      id: 'u5',
      name: 'Unit V: Trigonometry',
      weightageMarks: 12,
      chapters: [
        {
          id: 'c9',
          number: 9,
          title: 'Introduction to Trigonometry & Identities',
          topics: [
            { id: 't17', name: 'Trigonometric Ratios of Specific Angles (30°, 45°, 60°)', periods: 5, completed: false, targetDate: '15 Dec 2026', hasLessonPlan: true },
            { id: 't18', name: 'Proof and Application of sin²θ + cos²θ = 1', periods: 5, completed: false, targetDate: '22 Dec 2026', hasLessonPlan: false },
          ],
        },
      ],
    },
  ],
  Science: [
    {
      id: 'su1',
      name: 'Unit I: Chemical Substances - Nature and Behaviour',
      weightageMarks: 25,
      chapters: [
        {
          id: 'sc1',
          number: 1,
          title: 'Chemical Reactions and Equations',
          topics: [
            { id: 'st1', name: 'Balanced Chemical Equations & Types of Reactions', periods: 6, completed: true, targetDate: '20 Jul 2026', hasLessonPlan: true },
            { id: 'st2', name: 'Oxidation, Reduction, Corrosion & Rancidity', periods: 4, completed: true, targetDate: '30 Jul 2026', hasLessonPlan: true },
          ],
        },
        {
          id: 'sc2',
          number: 2,
          title: 'Acids, Bases and Salts',
          topics: [
            { id: 'st3', name: 'pH Scale & Importance in Everyday Life', periods: 5, completed: true, targetDate: '15 Aug 2026', hasLessonPlan: true },
            { id: 'st4', name: 'Preparation and Uses of Plaster of Paris, Bleaching Powder', periods: 5, completed: false, targetDate: '28 Aug 2026', hasLessonPlan: true },
          ],
        },
      ],
    },
    {
      id: 'su2',
      name: 'Unit II: World of Living',
      weightageMarks: 25,
      chapters: [
        {
          id: 'sc3',
          number: 3,
          title: 'Life Processes',
          topics: [
            { id: 'st5', name: 'Nutrition in Plants and Animals (Human Alimentary Canal)', periods: 6, completed: true, targetDate: '08 Sep 2026', hasLessonPlan: true },
            { id: 'st6', name: 'Respiration & Transportation in Human Beings (Heart & Circulation)', periods: 7, completed: false, targetDate: '20 Sep 2026', hasLessonPlan: true },
            { id: 'st7', name: 'Excretion in Human Beings & Nephron Structure', periods: 5, completed: false, targetDate: '30 Sep 2026', hasLessonPlan: false },
          ],
        },
      ],
    },
  ],
};

export const CurriculumTracker: React.FC = () => {
  const subjects = Object.keys(CURRICULUM_DATA);
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]);
  const [units, setUnits] = useState<Unit[]>(CURRICULUM_DATA[subjects[0]]);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({ u1: true, u2: true, su1: true });

  const handleSubjectChange = (subj: string) => {
    setSelectedSubject(subj);
    setUnits(CURRICULUM_DATA[subj] || []);
  };

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const toggleTopic = (unitId: string, chapterId: string, topicId: string) => {
    setUnits((prevUnits) =>
      prevUnits.map((u) => {
        if (u.id !== unitId) return u;
        return {
          ...u,
          chapters: u.chapters.map((c) => {
            if (c.id !== chapterId) return c;
            return {
              ...c,
              topics: c.topics.map((t) => {
                if (t.id !== topicId) return t;
                const nextState = !t.completed;
                if (nextState) {
                  toast('Topic completed', 'success', `${t.name} marked as taught.`);
                }
                return { ...t, completed: nextState };
              }),
            };
          }),
        };
      }),
    );
  };

  const allTopics = useMemo(() => {
    const list: Topic[] = [];
    units.forEach((u) => u.chapters.forEach((c) => list.push(...c.topics)));
    return list;
  }, [units]);

  const completedCount = allTopics.filter((t) => t.completed).length;
  const totalCount = allTopics.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalPeriods = allTopics.reduce((sum, t) => sum + t.periods, 0);
  const completedPeriods = allTopics.filter((t) => t.completed).reduce((sum, t) => sum + t.periods, 0);

  // Target expected completion by late August is ~40%
  const pacingStatus = completionPct >= 40 ? 'on_track' : 'needs_pacing';

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title="Curriculum & Syllabus Completion Tracker"
        subtitle="CBSE Class 10 NCERT-aligned unit hierarchy, syllabus pacing & period breakdown"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="input text-xs font-semibold"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s} (CBSE Class 10)
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Syllabus Completed"
          value={<>{completionPct}<span className="text-base font-medium text-text-tertiary">%</span></>}
          tone={completionPct >= 50 ? 'success' : 'primary'}
          icon={<CheckCircle2 size={16} />}
          hint={`${completedCount} of ${totalCount} topics covered`}
        />
        <StatCard
          label="Periods Taught"
          value={<>{completedPeriods}<span className="text-base font-medium text-text-tertiary"> / {totalPeriods}</span></>}
          tone="info"
          icon={<Clock size={16} />}
          hint="45-min periods allocated"
        />
        <StatCard
          label="Pacing Health"
          value={pacingStatus === 'on_track' ? 'On Track' : 'Needs Pacing'}
          tone={pacingStatus === 'on_track' ? 'success' : 'warning'}
          icon={pacingStatus === 'on_track' ? <Sparkles size={16} /> : <AlertTriangle size={16} />}
          hint="Pre-Board target: 100% by 15 Dec"
        />
        <StatCard
          label="Lesson Plans Attached"
          value={`${allTopics.filter((t) => t.hasLessonPlan).length}/${totalCount}`}
          tone="primary"
          icon={<FileCheck size={16} />}
          hint="Inspection-ready pedagogy notes"
        />
      </div>

      {/* Progress Bar Header */}
      <div className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <BookOpen size={14} className="text-primary" /> {selectedSubject} Total Academic Progress
          </span>
          <span className="font-mono text-primary font-bold">{completionPct}% Completed</span>
        </div>
        <ProgressBar value={completionPct} tone={completionPct >= 75 ? 'success' : 'primary'} />
      </div>

      {/* Unit Hierarchy List */}
      <div className="space-y-4">
        {units.map((unit) => {
          const unitTopics: Topic[] = [];
          unit.chapters.forEach((c) => unitTopics.push(...c.topics));
          const unitCompleted = unitTopics.filter((t) => t.completed).length;
          const unitPct = Math.round((unitCompleted / unitTopics.length) * 100);
          const isExpanded = expandedUnits[unit.id] ?? true;

          return (
            <div key={unit.id} className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
              {/* Unit Header */}
              <div
                onClick={() => toggleUnit(unit.id)}
                className="p-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-between gap-3 select-none"
              >
                <div className="flex items-center gap-2.5">
                  {isExpanded ? <ChevronDown size={18} className="text-text-tertiary" /> : <ChevronRight size={18} className="text-text-tertiary" />}
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight">
                      {unit.name}
                    </h3>
                    <p className="text-micro text-text-secondary">
                      Weightage: <strong className="text-foreground">{unit.weightageMarks} Marks</strong> in CBSE Board Blueprint · {unit.chapters.length} Chapters
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right text-xs">
                    <span className="font-bold text-foreground">{unitCompleted}/{unitTopics.length}</span>
                    <span className="text-text-tertiary ml-1">topics</span>
                  </div>
                  <Badge tone={unitPct === 100 ? 'success' : unitPct > 0 ? 'primary' : 'neutral'}>
                    {unitPct}%
                  </Badge>
                </div>
              </div>

              {/* Chapters & Topics */}
              {isExpanded && (
                <div className="p-4 sm:p-5 border-t border-border space-y-4 bg-surface">
                  {unit.chapters.map((chapter) => (
                    <div key={chapter.id} className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-text-secondary border-b border-border/60 pb-1.5">
                        <span>Chapter {chapter.number}: {chapter.title}</span>
                        <span className="text-micro font-normal text-text-tertiary">{chapter.topics.length} Key Concepts</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {chapter.topics.map((topic) => (
                          <div
                            key={topic.id}
                            className={cn(
                              'p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5',
                              topic.completed
                                ? 'border-success/30 bg-success-soft/30'
                                : 'border-border bg-surface hover:border-border-strong',
                            )}
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={topic.completed}
                                onChange={() => toggleTopic(unit.id, chapter.id, topic.id)}
                                className="mt-0.5 sm:mt-0 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                              />
                              <div className="min-w-0">
                                <span className={cn('text-xs font-semibold text-foreground', topic.completed && 'line-through text-text-secondary')}>
                                  {topic.name}
                                </span>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-tertiary mt-0.5">
                                  <span>{topic.periods} Periods</span>
                                  <span>Target: {topic.targetDate}</span>
                                  {topic.hasLessonPlan && (
                                    <span className="text-primary font-medium inline-flex items-center gap-0.5">
                                      <FileCheck size={11} /> Lesson Plan Attached
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
                              <Badge tone={topic.completed ? 'success' : 'neutral'} className="text-[10px]">
                                {topic.completed ? 'Completed' : 'Pending Teaching'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
