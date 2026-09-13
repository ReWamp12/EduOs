'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { AdminAcademicOverviewData, ClassStudentPerformanceRow, Batch } from '@/lib/types';
import {
  GraduationCap,
  Users,
  CalendarCheck2,
  BookOpen,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Search,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Building,
  Loader2,
  Settings,
  UserCheck,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';

type DrillLevel = 'overview' | 'subject' | 'batch' | 'student';

interface AdminAcademicOverviewProps {
  onNavigate?: (tab: string) => void;
}

export const AdminAcademicOverview: React.FC<AdminAcademicOverviewProps> = ({ onNavigate }) => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AdminAcademicOverviewData | null>(null);

  // Batches for the drill-down cards, loaded from Supabase not hardcoded.
  // (A previous "Subject Configuration Modal" lived here; it never called any
  // dataService method — Save was a setTimeout+toast — and duplicated the
  // real AdminAcademicSetup panel. The trigger button now routes there.)
  const [batches, setBatches] = useState<Batch[]>([]);

  // Drill Down Navigation State (Section 2.13)
  const [drillLevel, setDrillLevel] = useState<DrillLevel>('overview');
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string } | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<{ id: string; name: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<ClassStudentPerformanceRow | null>(null);
  const [batchRoster, setBatchRoster] = useState<ClassStudentPerformanceRow[]>([]);
  const [loadingBatch, setLoadingBatch] = useState(false);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAdminAcademicOverview(session?.tenantId);
      setOverview(data);
      // Real batches for the drill-down cards — previously two hardcoded UUIDs.
      const bs = await dataService.getBatches();
      setBatches(bs);
    } catch (e) {
      console.warn('Error loading admin academic overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [session?.tenantId]);

  // Load batch roster for drill down
  const handleSelectBatch = async (batchId: string, batchName: string) => {
    setSelectedBatch({ id: batchId, name: batchName });
    setDrillLevel('batch');
    setLoadingBatch(true);
    try {
      const roster = await dataService.getClassPerformanceRoster(batchId, undefined, session?.tenantId);
      setBatchRoster(roster);
    } finally {
      setLoadingBatch(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-text-secondary">Aggregating school-wide academic data…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Breadcrumb / Navigation Bar for 4-Level Drill Down */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs text-text-secondary shadow-xs">
        <button
          onClick={() => {
            setDrillLevel('overview');
            setSelectedSubject(null);
            setSelectedBatch(null);
            setSelectedStudent(null);
          }}
          className={cn(
            'hover:text-primary transition-colors font-medium',
            drillLevel === 'overview' ? 'text-foreground font-bold' : ''
          )}
        >
          School Overview
        </button>

        {selectedSubject && (
          <>
            <ChevronRight className="h-3 w-3 text-text-tertiary" />
            <button
              onClick={() => {
                setDrillLevel('subject');
                setSelectedBatch(null);
                setSelectedStudent(null);
              }}
              className={cn(
                'hover:text-primary transition-colors font-medium',
                drillLevel === 'subject' ? 'text-foreground font-bold' : ''
              )}
            >
              {selectedSubject.name}
            </button>
          </>
        )}

        {selectedBatch && (
          <>
            <ChevronRight className="h-3 w-3 text-text-tertiary" />
            <button
              onClick={() => {
                setDrillLevel('batch');
                setSelectedStudent(null);
              }}
              className={cn(
                'hover:text-primary transition-colors font-medium',
                drillLevel === 'batch' ? 'text-foreground font-bold' : ''
              )}
            >
              {selectedBatch.name}
            </button>
          </>
        )}

        {selectedStudent && (
          <>
            <ChevronRight className="h-3 w-3 text-text-tertiary" />
            <span className="font-bold text-foreground">{selectedStudent.studentName}</span>
          </>
        )}
      </div>

      {/* VIEW LEVEL 1: MACRO SCHOOL OVERVIEW */}
      {drillLevel === 'overview' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-foreground">Institutional Academic Performance</h1>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Executive Visibility
                </span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                High-level visibility over syllabus completion rates and student performance metrics
              </p>
            </div>

            <button
              onClick={() => onNavigate?.('academic_setup')}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all self-start md:self-auto shrink-0"
            >
              <Settings className="h-4 w-4" />
              <span>Configure Subjects & Faculty</span>
            </button>
          </div>

          {/* Macro KPI Strip (Section 2.13) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Active Students</div>
              <div className="mt-2 text-3xl font-extrabold text-foreground">{overview?.totalStudents || 8}</div>
              <div className="mt-1 text-micro text-text-secondary">Enrolled Class 10</div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Avg Performance</div>
              <div className="mt-2 text-3xl font-extrabold text-foreground">{overview?.averagePerformance || 80}%</div>
              <div className="mt-1 text-micro text-text-secondary">Cross-subject composite</div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Avg Attendance</div>
              <div className="mt-2 text-3xl font-extrabold text-emerald-600">{overview?.averageAttendance || 92}%</div>
              <div className="mt-1 text-micro text-text-secondary">Session compliance</div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Avg Syllabus</div>
              <div className="mt-2 text-3xl font-extrabold text-violet-600">{overview?.averageSyllabusProgress || 72}%</div>
              <div className="mt-1 text-micro text-text-secondary">Covered topics rate</div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Needing Attention</div>
              <div className="mt-2 text-3xl font-extrabold text-amber-600">
                {overview?.studentsNeedingAttentionCount || 1}
              </div>
              <div className="mt-1 text-micro text-amber-700 dark:text-amber-300 font-medium">Attention flags active</div>
            </div>
          </div>

          {/* Section 1.12: Admin Syllabus Overview & Subject Performance Grid */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-foreground">Syllabus Progress & Subject Health</h2>
                <p className="text-xs text-text-secondary">Click any subject to drill into class batches</p>
              </div>
              <span className="text-xs text-text-tertiary">Academic Year 2026</span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview?.subjectAverages.map((sub) => (
                <div
                  key={sub.subjectId}
                  onClick={() => {
                    setSelectedSubject({ id: sub.subjectId, name: sub.subjectName });
                    setDrillLevel('subject');
                  }}
                  className="rounded-xl border border-border p-4 transition-all hover:border-primary/50 hover:bg-surface-secondary/30 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {sub.subjectName}
                      </div>
                      <div className="text-micro text-text-tertiary">{sub.subjectCode}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <span>View Batches</span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Progress Bar (Section 1.12) */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-secondary">Syllabus Completion</span>
                      <span className="font-bold text-foreground">{sub.averageSyllabusProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all duration-500"
                        style={{ width: `${sub.averageSyllabusProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between text-xs text-text-secondary pt-2 border-t border-border/50">
                    <span>{sub.completedTopics} / {sub.totalTopics} topics taught</span>
                    <span>Class 10 Average</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW LEVEL 2: SUBJECT DRILL DOWN (SHOWING BATCHES) */}
      {drillLevel === 'subject' && selectedSubject && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div>
              <h2 className="text-xl font-bold text-foreground">{selectedSubject.name} — Class Batches</h2>
              <p className="text-xs text-text-secondary">
                Select a class batch to view individual student roster and performance breakdown
              </p>
            </div>
            <button
              onClick={() => {
                setDrillLevel('overview');
                setSelectedSubject(null);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Overview
            </button>
          </div>

          {/*
           * Drill-down batch cards. Rendered from the real batches list —
           * previously two hardcoded UUIDs for Class 9-A / 10-A. The per-batch
           * Avg Score / Syllabus numbers on this card are placeholders that
           * still show static values until getAdminAcademicOverview returns
           * per-batch aggregates; the studentCount comes from the real fetch.
           */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {batches.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-text-secondary">
                No batches configured for this tenant yet.
              </div>
            ) : (
              batches.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleSelectBatch(b.id, b.name)}
                  className="rounded-xl border border-border bg-surface p-5 hover:border-primary/50 hover:bg-surface-secondary/30 transition-all cursor-pointer shadow-xs group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                        {b.name}
                      </h3>
                      <div className="text-xs text-text-secondary mt-0.5">
                        Mentor: {b.mentorTeacherName || '—'}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-surface-secondary/60 p-2">
                      <div className="text-micro text-text-tertiary">Students</div>
                      <div className="font-bold text-foreground mt-0.5">{b.studentCount ?? '—'}</div>
                    </div>
                    <div className="rounded-lg bg-surface-secondary/60 p-2">
                      <div className="text-micro text-text-tertiary">Capacity</div>
                      <div className="font-bold text-foreground mt-0.5">{b.capacity ?? '—'}</div>
                    </div>
                    <div className="rounded-lg bg-surface-secondary/60 p-2">
                      <div className="text-micro text-text-tertiary">Grade</div>
                      <div className="font-bold text-foreground mt-0.5">{b.gradeLevel || '—'}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW LEVEL 3: BATCH ROSTER */}
      {drillLevel === 'batch' && selectedBatch && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div>
              <h2 className="text-xl font-bold text-foreground">{selectedBatch.name} — Student Roster</h2>
              <p className="text-xs text-text-secondary">
                Click any student row to view complete 4-pillar performance analysis
              </p>
            </div>
            <button
              onClick={() => setDrillLevel('subject')}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Batches
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
            {loadingBatch ? (
              <div className="py-16 text-center text-sm text-text-secondary flex flex-col items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Loading batch student performance data…
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-secondary/40 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Roll</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Performance Score</th>
                    <th className="py-3.5 px-4">Attendance</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Teacher Remark</th>
                    <th className="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {batchRoster.map((s) => (
                    <tr
                      key={s.studentId}
                      onClick={() => {
                        setSelectedStudent(s);
                        setDrillLevel('student');
                      }}
                      className="hover:bg-surface-secondary/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs text-text-tertiary">#{s.rollNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-foreground group-hover:text-primary transition-colors">
                        {s.studentName}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">{s.overallScore}%</td>
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
                      <td className="py-3.5 px-4">
                        {s.status === 'attention' ? (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-micro font-semibold text-amber-600 border border-amber-500/20">
                            Attention
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-micro font-semibold text-emerald-600 border border-emerald-500/20">
                            Good
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-xs text-text-secondary">
                        {s.latestRemark ? `"${s.latestRemark}"` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <ChevronRight className="inline-block h-4 w-4 text-text-tertiary group-hover:translate-x-0.5 transition-transform" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* VIEW LEVEL 4: DETAILED STUDENT PROFILE */}
      {drillLevel === 'student' && selectedStudent && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {selectedStudent.studentName} — Performance Dossier
              </h2>
              <p className="text-xs text-text-secondary">
                Roll No: #{selectedStudent.rollNumber} • {selectedBatch?.name || 'Class 10 - Section A'}
              </p>
            </div>
            <button
              onClick={() => setDrillLevel('batch')}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Batch
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <div className="text-xs text-text-tertiary">Overall Performance</div>
              <div className="text-3xl font-extrabold text-foreground mt-1">{selectedStudent.overallScore}%</div>
              <div className="text-micro text-text-secondary mt-1">Weighted composite</div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <div className="text-xs text-text-tertiary">Attendance</div>
              <div className="text-3xl font-extrabold text-foreground mt-1">{selectedStudent.attendancePct}%</div>
              <div className="text-micro text-text-secondary mt-1">Biometric/Period logs</div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <div className="text-xs text-text-tertiary">Assessment Avg</div>
              <div className="text-3xl font-extrabold text-foreground mt-1">{selectedStudent.assessmentAvg}%</div>
              <div className="text-micro text-text-secondary mt-1">All unit tests</div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <div className="text-xs text-text-tertiary">Syllabus Progress</div>
              <div className="text-3xl font-extrabold text-foreground mt-1">{selectedStudent.syllabusPct}%</div>
              <div className="text-micro text-text-secondary mt-1">Curriculum topics</div>
            </div>
          </div>

          {selectedStudent.attentionReasons && selectedStudent.attentionReasons.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 p-4 text-xs text-amber-900 dark:text-amber-200">
              <div className="font-semibold mb-1">Attention Indicators:</div>
              <ul className="list-disc list-inside space-y-0.5">
                {selectedStudent.attentionReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
