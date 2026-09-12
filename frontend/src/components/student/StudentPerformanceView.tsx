'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import {
  StudentPerformanceSummary,
  SubjectPerformanceBreakdown,
  AssessmentScoreHistoryItem,
  AssessmentTrendSummary,
  FacultyRemarkItem,
} from '@/lib/types';
import {
  Trophy,
  CalendarCheck2,
  BookOpen,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  BarChart3,
  GraduationCap,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Filter,
  Loader2,
} from 'lucide-react';
import { cn } from '@/components/ui';

interface StudentPerformanceViewProps {
  onNavigate?: (tab: string) => void;
}

export const StudentPerformanceView: React.FC<StudentPerformanceViewProps> = ({ onNavigate }) => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<StudentPerformanceSummary | null>(null);
  const [subjects, setSubjects] = useState<SubjectPerformanceBreakdown[]>([]);
  const [history, setHistory] = useState<AssessmentScoreHistoryItem[]>([]);
  const [trend, setTrend] = useState<AssessmentTrendSummary | null>(null);
  const [remarks, setRemarks] = useState<FacultyRemarkItem[]>([]);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      // Find active student id
      // Find active student id
      const st = await dataService.getStudentOverview(session?.userId);
      const sId = st?.id || 'a7000000-0000-0000-0000-000000000003'; // default to Rohan Mehta

      const [perfSummary, subjPerf, examHist, facRemarks] = await Promise.all([
        dataService.getStudentPerformance(sId, session?.tenantId),
        dataService.getStudentSubjectPerformance(sId, session?.tenantId),
        dataService.getStudentAssessmentHistory(sId),
        dataService.getFacultyRemarks(sId),
      ]);

      if (perfSummary) setSummary(perfSummary);
      if (subjPerf) setSubjects(subjPerf);
      if (examHist) {
        setHistory(examHist.history);
        setTrend(examHist.trend);
      }
      if (facRemarks) setRemarks(facRemarks);
    } catch (err) {
      console.warn('Error loading student performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session?.userId, session?.tenantId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-body text-text-secondary">Aggregating live academic performance data…</p>
      </div>
    );
  }

  const overall = summary?.overallScore || 80;
  const isAttention = summary?.attentionStatus === 'attention';

  // Filtered history
  const filteredHistory = selectedSubjectFilter === 'all'
    ? history
    : history.filter((h) => h.subjectId === selectedSubjectFilter);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Header Banner & Attention Banner if needed */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-primary/5 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Academic Performance Overview
                </h1>
                {isAttention ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 border border-amber-500/20">
                    <AlertTriangle className="h-3 w-3" /> Needs Attention
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" /> Good Standing
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                {summary?.studentName} • Roll No: {summary?.rollNumber || '3'} • Automated multi-pillar learning analytics
              </p>
            </div>
          </div>

          {/* Large Overall Score Gauge */}
          <div className="flex items-center gap-4 rounded-xl border border-border/80 bg-surface/80 backdrop-blur-md px-5 py-3 shadow-xs">
            <div className="text-right">
              <div className="text-xs font-medium uppercase tracking-wider text-text-tertiary">Overall Score</div>
              <div className="text-xs text-text-secondary">Weighted Composite</div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-foreground">{overall}%</span>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('syllabus')}
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all ml-2"
              >
                <BookOpen className="h-4 w-4 text-primary" />
                <span>View Syllabus</span>
              </button>
            )}
          </div>
        </div>

        {/* Attention Alerts Banner if any rules triggered */}
        {summary?.attentionReasons && summary.attentionReasons.length > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 p-4 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold">Academic Indicators Requiring Attention:</div>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs opacity-90">
                {summary.attentionReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 2. Four Core Performance Input Pillars (Section 2.2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Assessments */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs transition hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Assessments</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600">
              <Trophy size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{summary?.assessmentsAverage || 0}%</span>
            <span className="text-xs text-text-tertiary">avg marks</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(100, summary?.assessmentsAverage || 0)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-text-secondary flex justify-between">
            <span>{summary?.totalExamsTaken || 0} tests recorded</span>
            <span className="font-medium text-foreground">Weight: 60%</span>
          </div>
        </div>

        {/* Pillar 2: Attendance */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs transition hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Attendance</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <CalendarCheck2 size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{summary?.attendancePercentage || 0}%</span>
            <span className="text-xs text-text-tertiary">presence</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                (summary?.attendancePercentage || 0) < 75 ? 'bg-amber-500' : 'bg-emerald-500'
              )}
              style={{ width: `${Math.min(100, summary?.attendancePercentage || 0)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-text-secondary flex justify-between">
            <span>{summary?.attendedClasses} / {summary?.totalClasses} classes</span>
            <span className="font-medium text-foreground">Weight: 15%</span>
          </div>
        </div>

        {/* Pillar 3: Assignments */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs transition hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Assignments</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
              <FileCheck size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {summary?.assignmentsCompleted} / {summary?.assignmentsTotal}
            </span>
            <span className="text-xs text-text-tertiary">({summary?.assignmentsPercentage}%)</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, summary?.assignmentsPercentage || 0)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-text-secondary flex justify-between">
            <span>Submission rate</span>
            <span className="font-medium text-foreground">Weight: 10%</span>
          </div>
        </div>

        {/* Pillar 4: Syllabus Progress (Live Phase 1 Integration) */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs transition hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Syllabus Progress</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/10 text-violet-600">
              <BookOpen size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{summary?.syllabusProgressPercentage || 0}%</span>
            <span className="text-xs text-text-tertiary">curriculum</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-500"
              style={{ width: `${Math.min(100, summary?.syllabusProgressPercentage || 0)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-text-secondary flex justify-between">
            <span>Live from Curriculum</span>
            <span className="font-medium text-foreground">Weight: 15%</span>
          </div>
        </div>
      </div>

      {/* 3. Subject-Wise Performance Breakdown & Historical Trends (Sections 2.8 & 2.9) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject-Wise Performance Cards */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-border/80">
            <div>
              <h2 className="text-base font-semibold text-foreground">Subject Performance Breakdown</h2>
              <p className="text-xs text-text-secondary">Multi-metric evaluation across enrolled subjects</p>
            </div>
            <span className="text-xs text-text-tertiary">Class 10 - Section A</span>
          </div>

          <div className="mt-4 space-y-4">
            {subjects.map((sub) => (
              <div
                key={sub.subjectId}
                className="rounded-xl border border-border/70 p-4 transition-all hover:bg-surface-secondary/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: sub.color || '#3b82f6' }}
                    />
                    <div>
                      <div className="font-semibold text-foreground text-sm">{sub.subjectName}</div>
                      <div className="text-xs text-text-tertiary">{sub.subjectCode}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-foreground">{sub.compositeScore}%</span>
                    {sub.status === 'attention' ? (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-micro font-medium text-amber-600">
                        Attention
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-micro font-medium text-emerald-600">
                        Good
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-meters for this subject */}
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-surface-secondary/50 p-2">
                    <div className="text-text-tertiary text-micro">Exam Avg</div>
                    <div className="font-semibold text-foreground mt-0.5">{sub.assessmentAvg}%</div>
                  </div>
                  <div className="rounded-lg bg-surface-secondary/50 p-2">
                    <div className="text-text-tertiary text-micro">Attendance</div>
                    <div className="font-semibold text-foreground mt-0.5">{sub.attendancePct}%</div>
                  </div>
                  <div className="rounded-lg bg-surface-secondary/50 p-2">
                    <div className="text-text-tertiary text-micro">Assignments</div>
                    <div className="font-semibold text-foreground mt-0.5">{sub.assignmentPct}%</div>
                  </div>
                  <div className="rounded-lg bg-surface-secondary/50 p-2">
                    <div className="text-text-tertiary text-micro">Syllabus</div>
                    <div className="font-semibold text-foreground mt-0.5">{sub.syllabusPct}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Progression & Trend (Section 2.9) */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <h2 className="text-base font-semibold text-foreground">Score Progression</h2>
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    trend.direction === 'improving'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : trend.direction === 'declining'
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                  )}
                >
                  {trend.direction === 'improving' && <TrendingUp className="h-3 w-3" />}
                  {trend.direction === 'declining' && <TrendingDown className="h-3 w-3" />}
                  {trend.direction === 'steady' && <Minus className="h-3 w-3" />}
                  {trend.label}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-text-secondary">
              Chronological score progression across tests showing genuine academic velocity.
            </p>

            {/* Visual Step Progression */}
            <div className="mt-4 flex items-center justify-between gap-1">
              {trend?.scoreProgression.map((score, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'w-full rounded-md py-1 text-center text-xs font-bold transition-all',
                      i === trend.scoreProgression.length - 1
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-surface-secondary text-foreground'
                    )}
                  >
                    {score}%
                  </div>
                  <span className="text-[10px] text-text-tertiary">T{i + 1}</span>
                </div>
              ))}
            </div>

            {/* Test History List */}
            <div className="mt-5 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {filteredHistory.map((item) => (
                <div
                  key={item.examId}
                  className="flex items-center justify-between rounded-lg border border-border/60 p-2.5 text-xs"
                >
                  <div>
                    <div className="font-semibold text-foreground">{item.examTitle}</div>
                    <div className="text-micro text-text-tertiary">
                      {item.subjectName} • {item.examDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground text-sm">{item.percentage}%</span>
                    <div className="text-micro text-text-tertiary">
                      {item.marksObtained}/{item.totalMarks}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/80 text-micro text-text-tertiary text-center">
            Scores retained automatically from graded assessments.
          </div>
        </div>
      </div>

      {/* 4. Faculty Remarks & Feedback (Section 2.12) */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Teacher Remarks & Guidance</h2>
          </div>
          <span className="text-xs text-text-tertiary">{remarks.length} remarks on record</span>
        </div>

        {remarks.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-secondary">
            No faculty remarks recorded yet for this academic session.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {remarks.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-border/70 bg-surface-secondary/20 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{r.facultyName}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-micro font-medium text-primary">
                      {r.subjectName}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm text-foreground/90 italic">
                    "{r.remarkText}"
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/50 text-micro text-text-tertiary flex items-center justify-between">
                  <span className="capitalize">{r.category} Note</span>
                  <span>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
