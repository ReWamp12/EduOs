'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTeacherBatch } from '@/lib/teacherContext';
import { dataService } from '@/lib/dataService';
import { ClassStudentPerformanceRow, SubjectPerformanceBreakdown, StudentPerformanceSummary } from '@/lib/types';
import {
  Users,
  Search,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  CalendarCheck2,
  BookOpen,
  FileCheck,
  Plus,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  X,
  Send,
  Loader2,
  Check,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/components/ui';

interface FacultyPerformanceViewProps {
  onNavigate?: (tab: string) => void;
}

export const FacultyPerformanceView: React.FC<FacultyPerformanceViewProps> = ({ onNavigate }) => {
  const { session } = useAuth();
  const { batchId } = useTeacherBatch();
  const activeBatchId = batchId || 'a5000000-0000-0000-0000-000000000001';

  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState<ClassStudentPerformanceRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'attention' | 'good'>('all');

  // Detail Modal State
  const [selectedStudent, setSelectedStudent] = useState<ClassStudentPerformanceRow | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentPerformanceSummary | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Remark Modal State
  const [remarkStudent, setRemarkStudent] = useState<ClassStudentPerformanceRow | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [remarkCategory, setRemarkCategory] = useState<'academic' | 'attendance' | 'behavior' | 'general'>('academic');
  const [savingRemark, setSavingRemark] = useState(false);

  // Record Assessment Modal State
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testSubjectId, setTestSubjectId] = useState('a6000000-0000-0000-0000-000000000001'); // Mathematics
  const [testTotalMarks, setTestTotalMarks] = useState(100);
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentMarks, setStudentMarks] = useState<Record<string, number>>({});
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadRoster = async () => {
    setLoading(true);
    try {
      const data = await dataService.getClassPerformanceRoster(activeBatchId, undefined, session?.tenantId);
      setRoster(data);

      // Prepopulate marks state for the modal
      const initialMarks: Record<string, number> = {};
      data.forEach((s) => {
        initialMarks[s.studentId] = 75;
      });
      setStudentMarks(initialMarks);
    } catch (e) {
      console.warn('Error loading class performance roster:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [activeBatchId, session?.tenantId]);

  // Open detail drawer
  const openStudentDetail = async (s: ClassStudentPerformanceRow) => {
    setSelectedStudent(s);
    setLoadingDetail(true);
    try {
      const detail = await dataService.getStudentPerformance(s.studentId, session?.tenantId);
      setStudentDetail(detail);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Save faculty remark
  const handleSaveRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkStudent || !remarkText.trim()) return;
    setSavingRemark(true);
    try {
      const res = await dataService.saveFacultyRemark(
        remarkStudent.studentId,
        session?.userId || 'a2000000-0000-0000-0000-000000000002',
        testSubjectId,
        activeBatchId,
        remarkText,
        remarkCategory,
        session?.tenantId
      );
      if (res) {
        setSuccessToast(`Remark saved for ${remarkStudent.studentName}`);
        setTimeout(() => setSuccessToast(null), 3500);
        setRemarkStudent(null);
        setRemarkText('');
        loadRoster();
      }
    } finally {
      setSavingRemark(false);
    }
  };

  // Create new assessment with scores
  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;
    setSavingAssessment(true);
    try {
      const scoresPayload = roster.map((s) => ({
        studentId: s.studentId,
        marks: studentMarks[s.studentId] !== undefined ? studentMarks[s.studentId] : 75,
        feedback: 'Recorded via Faculty Assessment Studio',
      }));

      const ok = await dataService.createAssessmentWithScores(
        activeBatchId,
        testSubjectId,
        testTitle,
        'unit_test',
        testTotalMarks,
        testDate,
        session?.userId || 'a2000000-0000-0000-0000-000000000002',
        scoresPayload,
        session?.tenantId
      );

      if (ok) {
        setSuccessToast(`Assessment "${testTitle}" recorded and published successfully!`);
        setTimeout(() => setSuccessToast(null), 4000);
        setShowAssessmentModal(false);
        setTestTitle('');
        loadRoster();
      }
    } finally {
      setSavingAssessment(false);
    }
  };

  // Filtered roster
  const filteredRoster = roster.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.includes(searchQuery);
    if (!matchesSearch) return false;
    if (filterMode === 'attention') return s.status === 'attention';
    if (filterMode === 'good') return s.status === 'good';
    return true;
  });

  const attentionCount = roster.filter((s) => s.status === 'attention').length;
  const avgClassScore =
    roster.length > 0 ? Math.round(roster.reduce((acc, curr) => acc + curr.overallScore, 0) / roster.length) : 0;
  const avgAttendance =
    roster.length > 0 ? Math.round(roster.reduce((acc, curr) => acc + curr.attendancePct, 0) / roster.length) : 0;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <Check className="h-4 w-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 1. Header Banner with Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-foreground">Class Academic Performance</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Live Roster
            </span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Continuous multi-pillar performance tracker for Class 10 - Section A
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('curriculum')}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
            >
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Syllabus Pacing</span>
            </button>
          )}
          <button
            onClick={() => setShowAssessmentModal(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Record Test Marks</span>
          </button>
        </div>
      </div>

      {/* 2. Key Batch Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Class Average Score</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{avgClassScore}%</span>
            <span className="text-xs text-text-secondary">weighted</span>
          </div>
          <div className="mt-2 text-micro text-text-tertiary">Based on exams, attendance, and syllabus</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Average Attendance</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{avgAttendance}%</span>
            <span className="text-xs text-emerald-600 font-medium">Session To Date</span>
          </div>
          <div className="mt-2 text-micro text-text-tertiary">232 verified period logs</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Students Needing Attention</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{attentionCount}</span>
            <span className="text-xs text-text-secondary">of {roster.length} students</span>
          </div>
          <div className="mt-2 text-micro text-text-tertiary">Rule-triggered indicators</div>
        </div>
      </div>

      {/* 3. Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary h-4 w-4" />
          <input
            type="text"
            placeholder="Search by student name or roll number…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface p-1 shadow-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filterMode === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-text-secondary hover:text-foreground'
            )}
          >
            All ({roster.length})
          </button>
          <button
            onClick={() => setFilterMode('attention')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
              filterMode === 'attention'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-text-secondary hover:text-foreground'
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            Attention ({attentionCount})
          </button>
          <button
            onClick={() => setFilterMode('good')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filterMode === 'good'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-text-secondary hover:text-foreground'
            )}
          >
            Good Standing ({roster.length - attentionCount})
          </button>
        </div>
      </div>

      {/* 4. Class Performance Roster Table (Section 2.10) */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-sm text-text-secondary flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Loading class performance metrics…
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-secondary">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-secondary/40 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Roll</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Overall Score</th>
                  <th className="py-3.5 px-4">Attendance</th>
                  <th className="py-3.5 px-4">Syllabus</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Teacher Remark</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRoster.map((s) => (
                  <tr
                    key={s.studentId}
                    className="hover:bg-surface-secondary/30 transition-colors group cursor-pointer"
                    onClick={() => openStudentDetail(s)}
                  >
                    <td className="py-3.5 px-4 font-mono text-xs text-text-tertiary">
                      #{s.rollNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground">{s.studentName}</div>
                      <div className="text-micro text-text-tertiary">Adm: {s.admissionNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-foreground">{s.overallScore}%</span>
                      </div>
                      <div className="text-micro text-text-tertiary">Test avg: {s.assessmentAvg}%</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'font-semibold text-xs',
                          s.attendancePct < 75 ? 'text-amber-600' : 'text-emerald-600'
                        )}
                      >
                        {s.attendancePct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-xs text-foreground">
                      {s.syllabusPct}%
                    </td>
                    <td className="py-3.5 px-4">
                      {s.status === 'attention' ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-micro font-semibold text-amber-600 border border-amber-500/20">
                          <AlertTriangle className="h-3 w-3" /> Attention
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-micro font-semibold text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Good
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-xs text-text-secondary">
                      {s.latestRemark ? (
                        <span className="italic text-foreground/80">"{s.latestRemark}"</span>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setRemarkStudent(s);
                          setRemarkText(s.latestRemark || '');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-secondary hover:border-primary/50 transition-all"
                      >
                        <MessageSquare className="h-3 w-3 text-primary" />
                        <span>Remark</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Student Detail Drawer/Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedStudent.studentName}</h3>
                <p className="text-xs text-text-secondary">
                  Roll No: #{selectedStudent.rollNumber} • Class 10 - Section A
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-text-tertiary hover:bg-surface-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 text-center text-sm text-text-secondary flex flex-col items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Aggregating student analytics…
              </div>
            ) : studentDetail ? (
              <div className="mt-4 space-y-4">
                {/* Score Header */}
                <div className="flex items-center justify-between rounded-xl bg-surface-secondary/40 p-4">
                  <div>
                    <div className="text-xs text-text-tertiary">Composite Performance Score</div>
                    <div className="text-3xl font-extrabold text-foreground mt-0.5">
                      {studentDetail.overallScore}%
                    </div>
                  </div>
                  <div>
                    {studentDetail.attentionStatus === 'attention' ? (
                      <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 border border-amber-500/20">
                        Needs Attention
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-500/20">
                        Good Standing
                      </span>
                    )}
                  </div>
                </div>

                {/* 4 Pillars in detail */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-border p-3">
                    <span className="text-text-tertiary">Assessment Avg</span>
                    <div className="text-lg font-bold text-foreground mt-1">
                      {studentDetail.assessmentsAverage}%
                    </div>
                    <div className="text-micro text-text-secondary">{studentDetail.totalExamsTaken} tests taken</div>
                  </div>

                  <div className="rounded-xl border border-border p-3">
                    <span className="text-text-tertiary">Attendance</span>
                    <div className="text-lg font-bold text-foreground mt-1">
                      {studentDetail.attendancePercentage}%
                    </div>
                    <div className="text-micro text-text-secondary">
                      {studentDetail.attendedClasses}/{studentDetail.totalClasses} classes
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-3">
                    <span className="text-text-tertiary">Assignments</span>
                    <div className="text-lg font-bold text-foreground mt-1">
                      {studentDetail.assignmentsPercentage}%
                    </div>
                    <div className="text-micro text-text-secondary">
                      {studentDetail.assignmentsCompleted}/{studentDetail.assignmentsTotal} submitted
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-3">
                    <span className="text-text-tertiary">Syllabus Progress</span>
                    <div className="text-lg font-bold text-foreground mt-1">
                      {studentDetail.syllabusProgressPercentage}%
                    </div>
                    <div className="text-micro text-text-secondary">Direct curriculum count</div>
                  </div>
                </div>

                {/* Attention Reasons if any */}
                {studentDetail.attentionReasons.length > 0 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200">
                    <div className="font-semibold mb-1">Attention Flags:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {studentDetail.attentionReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-xl bg-surface-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-secondary/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Faculty Remark Modal (Section 2.12) */}
      {remarkStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSaveRemark}
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-foreground">Teacher Remark</h3>
              </div>
              <button
                type="button"
                onClick={() => setRemarkStudent(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-text-tertiary hover:bg-surface-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-xs text-text-secondary">
              Add plain text feedback for <strong className="text-foreground">{remarkStudent.studentName}</strong>. This remark will be immediately visible on the student's dashboard.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground">Remark Category</label>
                <select
                  value={remarkCategory}
                  onChange={(e: any) => setRemarkCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="academic">Academic Feedback</option>
                  <option value="attendance">Attendance Guidance</option>
                  <option value="behavior">Class Conduct</option>
                  <option value="general">General Encouragement</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Feedback Note</label>
                <textarea
                  rows={3}
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="e.g., Good improvement in Mathematics. Needs more practice in Algebra."
                  className="mt-1 w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {/* Quick Presets (Section 2.12) */}
              <div>
                <div className="text-micro font-medium text-text-tertiary mb-1">Quick Presets:</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Good improvement in Mathematics.',
                    'Needs more practice in Algebra.',
                    'Attendance needs improvement.',
                    'Keep up the consistent effort!',
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setRemarkText(preset)}
                      className="rounded-lg border border-border bg-surface-secondary/40 px-2 py-1 text-[11px] text-text-secondary hover:text-foreground hover:bg-surface-secondary"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRemarkStudent(null)}
                className="rounded-xl bg-surface-secondary px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-secondary/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingRemark || !remarkText.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {savingRemark && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>Save Remark</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. Record Assessment Modal (Section 2.5) */}
      {showAssessmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleCreateAssessment}
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Record Assessment & Test Marks</h3>
                  <p className="text-xs text-text-secondary">
                    Create test and enter student marks with automatic percentage calculation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssessmentModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-text-tertiary hover:bg-surface-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-foreground">Assessment Title *</label>
                  <input
                    type="text"
                    required
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="e.g. Chapter 4 — Quadratic Equations Test"
                    className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Max Marks</label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={testTotalMarks}
                    onChange={(e) => setTestTotalMarks(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Subject</label>
                  <select
                    value={testSubjectId}
                    onChange={(e) => setTestSubjectId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="a6000000-0000-0000-0000-000000000001">Mathematics (MATH-10)</option>
                    <option value="a6000000-0000-0000-0000-000000000002">Physics (PHY-10)</option>
                    <option value="a6000000-0000-0000-0000-000000000003">Chemistry (CHEM-10)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Date Conducted</label>
                  <input
                    type="date"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Student Marks Entry Grid */}
              <div className="mt-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-semibold text-foreground">Student Scores Matrix</span>
                  <span className="text-micro text-text-tertiary">Max Marks: {testTotalMarks}</span>
                </div>

                <div className="mt-2 divide-y divide-border/60 max-h-[220px] overflow-y-auto pr-1">
                  {roster.map((s) => {
                    const currentMarks = studentMarks[s.studentId] !== undefined ? studentMarks[s.studentId] : 75;
                    const calculatedPct = testTotalMarks > 0 ? Math.round((currentMarks / testTotalMarks) * 100) : 0;
                    return (
                      <div key={s.studentId} className="flex items-center justify-between py-2.5 gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-micro text-text-tertiary">#{s.rollNumber}</span>
                          <span className="text-xs font-medium text-foreground">{s.studentName}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={0}
                            max={testTotalMarks}
                            value={currentMarks}
                            onChange={(e) => {
                              const val = Math.min(testTotalMarks, Math.max(0, Number(e.target.value) || 0));
                              setStudentMarks((prev) => ({ ...prev, [s.studentId]: val }));
                            }}
                            className="w-20 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-right font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <span className="text-xs font-bold text-foreground w-12 text-right">
                            {calculatedPct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-6 border-t border-border bg-surface-secondary/20">
              <button
                type="button"
                onClick={() => setShowAssessmentModal(false)}
                className="rounded-xl bg-surface px-4 py-2 text-xs font-medium text-foreground border border-border hover:bg-surface-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingAssessment || !testTitle.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-xs"
              >
                {savingAssessment && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>Save & Publish Marks</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
