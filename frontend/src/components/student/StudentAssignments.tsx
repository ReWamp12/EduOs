'use client';

import React, { useState, useMemo } from 'react';
import { dataService } from '@/lib/dataService';
import { mockCurrentStudent } from '@/lib/mockData';
import { Assignment, AssignmentAttachment } from '@/lib/types';
import { useAppStore, addSubmission, AssignmentRecord, Submission } from '@/lib/store';
import { PageHeader, SectionCard, Card, Badge, StatCard, ProgressBar, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  Clock,
  CheckCircle2,
  Upload,
  Award,
  MessageSquareText,
  ClipboardCheck,
  Inbox,
  Paperclip,
  Download,
  Filter,
  Search,
  BookOpen,
  FileText,
  FileCheck2,
  AlertCircle,
  X,
  Send,
  HelpCircle,
  FileUp,
} from 'lucide-react';

const statusBadge: Record<Assignment['status'], { tone: 'warning' | 'info' | 'success'; label: string; icon: React.ReactNode }> = {
  pending: { tone: 'warning', label: 'Action Required', icon: <Clock size={12} /> },
  submitted: { tone: 'info', label: 'Under Review', icon: <ClipboardCheck size={12} /> },
  graded: { tone: 'success', label: 'Graded', icon: <CheckCircle2 size={12} /> },
};

export const StudentAssignments: React.FC = () => {
  const { assignments: storeAssignments, submissions } = useAppStore();

  // Active student batch assignments
  const studentBatchAssignments = useMemo(() => {
    return storeAssignments.filter(
      (a) => !a.batchName || a.batchName === mockCurrentStudent.batchName || a.batchId === mockCurrentStudent.batchId,
    );
  }, [storeAssignments]);

  // Combined assignment status with student's submissions
  const assignments: (AssignmentRecord & { studentSubmission?: Submission })[] = useMemo(() => {
    return studentBatchAssignments.map((a) => {
      const sub = submissions.find(
        (s) => s.assignmentId === a.id && (s.studentName === mockCurrentStudent.name || s.studentId === mockCurrentStudent.id),
      );
      if (!sub) {
        return {
          ...a,
          status: 'pending' as const,
        };
      }
      return {
        ...a,
        status: sub.status,
        obtainedMarks: sub.obtainedMarks ?? a.obtainedMarks,
        feedback: sub.feedback ?? a.feedback,
        studentSubmission: sub,
      };
    });
  }, [studentBatchAssignments, submissions]);

  // Filter & Search states
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Submission Modal state
  const [activeSubmittingAssignment, setActiveSubmittingAssignment] = useState<AssignmentRecord | null>(null);
  const [solutionFileName, setSolutionFileName] = useState<string>('');
  const [studentNotes, setStudentNotes] = useState<string>('');
  const [confirmedHonorCode, setConfirmedHonorCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available subjects for filtering
  const subjectsList = useMemo(() => {
    const set = new Set(assignments.map((a) => a.subject));
    return Array.from(set);
  }, [assignments]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchTab = activeTabFilter === 'all' || a.status === activeTabFilter;
      const matchSubject = selectedSubject === 'all' || a.subject === selectedSubject;
      const matchSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchTab && matchSubject && matchSearch;
    });
  }, [assignments, activeTabFilter, selectedSubject, searchQuery]);

  // Metrics
  const pendingCount = assignments.filter((a) => a.status === 'pending').length;
  const underReviewCount = assignments.filter((a) => a.status === 'submitted').length;
  const gradedCount = assignments.filter((a) => a.status === 'graded').length;

  const averageScore = useMemo(() => {
    const graded = assignments.filter((a) => a.status === 'graded' && a.obtainedMarks !== undefined);
    if (!graded.length) return 0;
    const sumPct = graded.reduce((acc, curr) => acc + ((curr.obtainedMarks || 0) / curr.maxMarks) * 100, 0);
    return Math.round(sumPct / graded.length);
  }, [assignments]);

  const handleOpenSubmitModal = (assignment: AssignmentRecord) => {
    setActiveSubmittingAssignment(assignment);
    const existing = submissions.find(
      (s) => s.assignmentId === assignment.id && s.studentName === mockCurrentStudent.name,
    );
    setSolutionFileName(existing?.fileName || `${mockCurrentStudent.name.toLowerCase().replace(/\s+/g, '_')}_${assignment.subject.toLowerCase().replace(/[^a-z0-9]/g, '_')}_solution.pdf`);
    setStudentNotes(existing?.studentNotes || '');
    setConfirmedHonorCode(true);
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmittingAssignment) return;

    if (!confirmedHonorCode) {
      toast('Declaration required', 'warning', 'Please confirm the academic honor code declaration.');
      return;
    }

    setIsSubmitting(true);
    try {
      await dataService.submitAssignment({
        assignmentId: activeSubmittingAssignment.id,
        studentId: mockCurrentStudent.id,
        submissionUrl: `https://storage.eduos.app/submissions/std-1-${activeSubmittingAssignment.id}.pdf`,
      });

      // Write to shared reactive store
      addSubmission({
        assignmentId: activeSubmittingAssignment.id,
        title: activeSubmittingAssignment.title,
        subject: activeSubmittingAssignment.subject,
        batchName: activeSubmittingAssignment.batchName,
        studentId: mockCurrentStudent.id,
        studentName: mockCurrentStudent.name,
        studentRoll: mockCurrentStudent.rollNumber,
        studentAvatar: mockCurrentStudent.avatarUrl,
        maxMarks: activeSubmittingAssignment.maxMarks,
        fileName: solutionFileName || `${mockCurrentStudent.name.toLowerCase().replace(/\s+/g, '_')}_solution.pdf`,
        fileSize: '2.1 MB',
        fileUrl: `https://storage.eduos.app/submissions/std-1-${activeSubmittingAssignment.id}.pdf`,
        studentNotes: studentNotes.trim() || 'Solution uploaded for teacher evaluation.',
      });

      toast(
        'Assignment Submitted',
        'success',
        `"${activeSubmittingAssignment.title}" uploaded and sent to faculty for evaluation.`,
      );
      setActiveSubmittingAssignment(null);
    } catch {
      toast('Submission failed', 'error', 'Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <PageHeader
        title="Daily Practice Problems & Homework Hub"
        subtitle={`${mockCurrentStudent.batchName} · Roll ${mockCurrentStudent.rollNumber}`}
        actions={
          <Badge tone={pendingCount ? 'warning' : 'success'}>
            {pendingCount > 0 ? `${pendingCount} Pending Homework` : 'All Homework Submitted'}
          </Badge>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Assigned"
          value={assignments.length}
          tone="primary"
          icon={<BookOpen size={16} />}
          hint="Assigned this term"
        />
        <StatCard
          label="Pending Submission"
          value={pendingCount}
          tone={pendingCount > 0 ? 'warning' : 'success'}
          icon={<Clock size={16} />}
          hint={pendingCount > 0 ? 'Action required before due date' : 'Zero overdue items'}
        />
        <StatCard
          label="Under Review"
          value={underReviewCount}
          tone="info"
          icon={<ClipboardCheck size={16} />}
          hint="Submitted, awaiting teacher review"
        />
        <StatCard
          label="Average Score"
          value={<>{averageScore}<span className="text-base font-medium text-text-tertiary">%</span></>}
          tone="success"
          icon={<Award size={16} />}
          hint={`${gradedCount} graded assignments`}
        />
      </div>

      {/* Filters and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 rounded-lg bg-surface-muted p-1 border border-border">
              <button
                onClick={() => setActiveTabFilter('all')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-meta font-medium transition-all',
                  activeTabFilter === 'all'
                    ? 'bg-surface text-foreground shadow-xs font-semibold'
                    : 'text-text-secondary hover:text-foreground',
                )}
              >
                All ({assignments.length})
              </button>
              <button
                onClick={() => setActiveTabFilter('pending')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-meta font-medium transition-all',
                  activeTabFilter === 'pending'
                    ? 'bg-surface text-warning shadow-xs font-semibold'
                    : 'text-text-secondary hover:text-foreground',
                )}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setActiveTabFilter('submitted')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-meta font-medium transition-all',
                  activeTabFilter === 'submitted'
                    ? 'bg-surface text-info shadow-xs font-semibold'
                    : 'text-text-secondary hover:text-foreground',
                )}
              >
                In Review ({underReviewCount})
              </button>
              <button
                onClick={() => setActiveTabFilter('graded')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-meta font-medium transition-all',
                  activeTabFilter === 'graded'
                    ? 'bg-surface text-success shadow-xs font-semibold'
                    : 'text-text-secondary hover:text-foreground',
                )}
              >
                Graded ({gradedCount})
              </button>
            </div>

            {/* Subject Selector */}
            <div className="flex items-center gap-2">
              <span className="text-micro text-text-tertiary inline-flex items-center gap-1">
                <Filter size={13} /> Subject:
              </span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="input py-1.5 text-meta sm:w-44"
              >
                <option value="all">All Subjects</option>
                {subjectsList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search problem sets by title, chapter or topic…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>
      </Card>

      {/* Assignment List */}
      <div className="flex flex-col gap-4">
        {filteredAssignments.length === 0 ? (
          <SectionCard bodyClassName="p-0">
            <EmptyState
              icon={<Inbox size={26} />}
              title="No assignments match your criteria"
              description={
                activeTabFilter === 'pending'
                  ? "You're all caught up! No pending homework due right now."
                  : 'Try selecting a different status filter or clear your search.'
              }
            />
          </SectionCard>
        ) : (
          filteredAssignments.map((a) => {
            const badge = statusBadge[a.status];
            const isGraded = a.status === 'graded';
            const isSubmitted = a.status === 'submitted';
            const isPending = a.status === 'pending';
            const scorePct = isGraded && a.obtainedMarks !== undefined ? Math.round((a.obtainedMarks / a.maxMarks) * 100) : 0;

            return (
              <Card
                key={a.id}
                className={cn(
                  'flex flex-col gap-4 p-5 transition-all',
                  isPending ? 'border-warning/30 hover:border-warning/60 bg-surface' : 'bg-surface',
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="primary">{a.subject}</Badge>
                      <Badge tone={badge.tone}>
                        {badge.icon} {badge.label}
                      </Badge>
                      {a.category && (
                        <span className="text-micro font-medium uppercase tracking-wider text-text-tertiary">
                          {a.category.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="mt-2 text-section font-semibold text-foreground">{a.title}</h3>

                    {/* Description */}
                    {a.description && (
                      <p className="mt-1 text-meta text-text-secondary leading-relaxed">
                        {a.description}
                      </p>
                    )}

                    {/* Instructions */}
                    {a.instructions && (
                      <div className="mt-2.5 rounded-md border border-border bg-surface-muted p-3 text-micro text-text-secondary">
                        <div className="font-semibold text-foreground mb-1">Faculty Directions:</div>
                        <div className="whitespace-pre-line">{a.instructions}</div>
                      </div>
                    )}

                    {/* Metadata line */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-text-tertiary">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} /> Due:{' '}
                        <strong className={cn(isPending ? 'text-warning font-semibold' : 'text-foreground')}>
                          {a.dueDate}
                        </strong>
                      </span>
                      <span>Max marks: <strong className="text-foreground">{a.maxMarks}</strong></span>
                      {a.teacherName && <span>Faculty: <strong>{a.teacherName}</strong></span>}
                    </div>

                    {/* Attached Problem Sheet Files (Teacher attachments) */}
                    {a.attachments && a.attachments.length > 0 && (
                      <div className="mt-3.5 flex flex-wrap items-center gap-2">
                        <span className="text-micro font-medium text-text-tertiary">Problem Sheets:</span>
                        {a.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              toast('Download Started', 'info', `Downloading ${att.name}`);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary-soft px-2.5 py-1 text-micro font-medium text-primary hover:bg-primary/20 transition-colors"
                          >
                            <Download size={12} />
                            <span>{att.name}</span>
                            <span className="text-primary/70">({att.size})</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Graded Feedback Card */}
                    {isGraded && (
                      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-success/25 bg-success-soft p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-semibold text-success text-meta">
                            <Award size={16} /> Evaluation Score: {a.obtainedMarks}/{a.maxMarks} ({scorePct}%)
                          </div>
                          <Badge tone="success">Grade {scorePct >= 90 ? 'A+' : scorePct >= 75 ? 'A' : 'B'}</Badge>
                        </div>

                        {a.feedback && (
                          <div className="flex items-start gap-2 mt-1">
                            <MessageSquareText size={15} className="mt-0.5 shrink-0 text-success" />
                            <p className="text-meta text-text-secondary">
                              <span className="font-semibold text-foreground">Faculty Feedback: </span>
                              &ldquo;{a.feedback}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Student's Uploaded Submission details (if in review or graded) */}
                    {a.studentSubmission && (
                      <div className="mt-3 flex items-center gap-2 text-micro text-text-tertiary">
                        <Paperclip size={13} className="text-primary" />
                        <span>Submitted file: <strong className="text-foreground">{a.studentSubmission.fileName}</strong> ({a.studentSubmission.fileSize || '1.8 MB'})</span>
                        <span>· Submitted on {new Date(a.studentSubmission.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    )}
                  </div>

                  {/* Submission Action Button */}
                  <div className="shrink-0 lg:pt-1">
                    {isPending ? (
                      <button
                        onClick={() => handleOpenSubmitModal(a)}
                        className="btn-primary w-full lg:w-auto"
                      >
                        <Upload size={16} /> Submit Solution
                      </button>
                    ) : isSubmitted ? (
                      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col items-end">
                        <Badge tone="info" className="py-1 px-3">
                          <ClipboardCheck size={14} /> Under Faculty Review
                        </Badge>
                        <button
                          onClick={() => handleOpenSubmitModal(a)}
                          className="btn-secondary py-1 px-2.5 text-micro"
                        >
                          Update Submission
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge tone="success" className="py-1 px-3">
                          <CheckCircle2 size={14} /> Evaluated
                        </Badge>
                        <span className="text-micro font-bold text-success">
                          {a.obtainedMarks}/{a.maxMarks} Marks
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT SOLUTION */}
      {/* ========================================================================= */}
      {activeSubmittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Upload size={20} />
                </span>
                <div>
                  <h3 className="text-section font-semibold text-foreground">Submit Assignment Solution</h3>
                  <p className="text-micro text-text-tertiary">{activeSubmittingAssignment.subject} · Max {activeSubmittingAssignment.maxMarks} Marks</p>
                </div>
              </div>
              <button
                onClick={() => setActiveSubmittingAssignment(null)}
                className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmitSolution} className="flex flex-1 flex-col overflow-y-auto p-6 gap-4">
              {/* Assignment Summary Box */}
              <div className="rounded-lg border border-border bg-surface-muted p-4">
                <div className="text-meta font-semibold text-foreground">{activeSubmittingAssignment.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-text-tertiary">
                  <span>Due Date: <strong className="text-warning">{activeSubmittingAssignment.dueDate}</strong></span>
                  <span>Max Marks: {activeSubmittingAssignment.maxMarks}</span>
                  <span>Batch: {mockCurrentStudent.batchName.split(' - ')[0]}</span>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="label">Upload Solution Document (PDF, Image, or Doc)</label>
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-surface-muted/60 p-6 text-center transition-colors">
                  <FileUp size={32} className="text-primary mb-2" />
                  <div className="text-meta font-medium text-foreground">
                    Selected File: <strong className="text-primary">{solutionFileName || 'solution_work.pdf'}</strong>
                  </div>
                  <p className="text-micro text-text-tertiary mt-1">
                    Drag and drop your scanned homework PDF or browse device (Max 25 MB)
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Rename file…"
                      value={solutionFileName}
                      onChange={(e) => setSolutionFileName(e.target.value)}
                      className="input py-1 text-meta max-w-xs"
                    />
                    <button
                      type="button"
                      onClick={() => toast('File Selected', 'info', 'File ready for upload.')}
                      className="btn-secondary py-1 text-meta"
                    >
                      Browse Files
                    </button>
                  </div>
                </div>
              </div>

              {/* Student Notes */}
              <div>
                <label className="label" htmlFor="student-notes">
                  Student Remarks / Questions for Teacher (Optional)
                </label>
                <textarea
                  id="student-notes"
                  rows={3}
                  placeholder="e.g. Completed all questions. For Q7, I used the alternate derivation method taught on Tuesday."
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  className="input"
                />
              </div>

              {/* Honor Code Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer rounded-md border border-border bg-surface-muted p-3">
                <input
                  type="checkbox"
                  checked={confirmedHonorCode}
                  onChange={(e) => setConfirmedHonorCode(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-micro text-text-secondary">
                  <strong>Academic Honor Pledge:</strong> I confirm that this submitted solution is my own original work and adheres to the CBSE school code of conduct.
                </span>
              </label>

              {/* Modal Footer */}
              <div className="mt-2 flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setActiveSubmittingAssignment(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  <Send size={16} /> {isSubmitting ? 'Uploading…' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
