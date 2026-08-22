'use client';

import React, { useState, useMemo } from 'react';
import { Student } from '@/lib/types';
import { AssignmentRecord, Submission, gradeStudentAssignment, sendStudentReminder, sendAssignmentReminder } from '@/lib/store';
import { Card, Badge, EmptyState, ProgressBar, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { StudentProfileDetailModal } from '@/components/common/StudentProfileDetailModal';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bell,
  Paperclip,
  FileCheck2,
  Award,
  MessageSquareText,
  Edit3,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Download,
  Phone,
} from 'lucide-react';

const QUICK_FEEDBACK_TAGS = [
  '⭐ Flawless step-by-step working & derivations!',
  '👍 Strong conceptual clarity and presentation.',
  '⚠️ Minor calculation slip in final step.',
  '📝 Please label diagrams and formulas clearly.',
  '💡 Review sign rules and discriminant values.',
  '🎯 Full marks on problem logic. Well done!',
];

interface Props {
  assignment: AssignmentRecord;
  students: Student[];
  submissions: Submission[];
  teacherName: string;
  onInspectSubmission?: (student: Student, submission?: Submission) => void;
}

export const AssignmentStudentRosterWidget: React.FC<Props> = ({
  assignment,
  students,
  submissions,
  teacherName,
  onInspectSubmission,
}) => {
  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'not_submitted' | 'pending' | 'graded'>('all');

  // Inline grading state per student: studentId -> { marks: string, feedback: string, isEditing: boolean }
  const [editingScores, setEditingScores] = useState<Record<string, { marks: string; feedback: string }>>({});
  const [activeEditStudentId, setActiveEditStudentId] = useState<string | null>(null);

  // Student Profile Modal inspection
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);

  // Sort students strictly by Roll Number (e.g. CBSE-10A-01, CBSE-10A-02...)
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const rollA = a.rollNumber || '';
      const rollB = b.rollNumber || '';
      return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [students]);

  // Map submissions by student name
  const submissionsByStudentName = useMemo(() => {
    const map = new Map<string, Submission>();
    submissions
      .filter((s) => s.assignmentId === assignment.id)
      .forEach((s) => {
        map.set(s.studentName.toLowerCase().trim(), s);
      });
    return map;
  }, [submissions, assignment.id]);

  // Filtered student list
  const filteredRoster = useMemo(() => {
    return sortedStudents.filter((student) => {
      const sub = submissionsByStudentName.get(student.name.toLowerCase().trim());
      const isSubmitted = !!sub;
      const isGraded = sub?.status === 'graded';
      const isPending = sub?.status === 'submitted';

      // Status filter
      if (statusFilter === 'submitted' && !isSubmitted) return false;
      if (statusFilter === 'not_submitted' && isSubmitted) return false;
      if (statusFilter === 'pending' && !isPending) return false;
      if (statusFilter === 'graded' && !isGraded) return false;

      // Search query filter (matches student name, roll number, or parent name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = student.name.toLowerCase().includes(q);
        const matchRoll = student.rollNumber.toLowerCase().includes(q);
        const matchParent = student.parentName?.toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchParent) return false;
      }

      return true;
    });
  }, [sortedStudents, submissionsByStudentName, statusFilter, searchQuery]);

  // Overall metrics
  const totalEnrolled = sortedStudents.length;
  const submittedCount = sortedStudents.filter((s) => submissionsByStudentName.has(s.name.toLowerCase().trim())).length;
  const notSubmittedCount = totalEnrolled - submittedCount;
  const gradedCount = sortedStudents.filter(
    (s) => submissionsByStudentName.get(s.name.toLowerCase().trim())?.status === 'graded',
  ).length;
  const pendingCount = submittedCount - gradedCount;
  const turnInPct = totalEnrolled > 0 ? Math.round((submittedCount / totalEnrolled) * 100) : 0;

  // Handlers
  const handleSaveGrade = (student: Student) => {
    const current = editingScores[student.id] || { marks: '', feedback: '' };
    const sub = submissionsByStudentName.get(student.name.toLowerCase().trim());
    const marksNum = Number(current.marks || (sub?.obtainedMarks !== undefined ? String(sub.obtainedMarks) : ''));

    if (isNaN(marksNum) || marksNum < 0 || marksNum > assignment.maxMarks) {
      toast('Invalid marks', 'error', `Please enter valid marks between 0 and ${assignment.maxMarks}.`);
      return;
    }

    const feedbackText = current.feedback || sub?.feedback || 'Good effort. Keep up the consistent practice.';

    gradeStudentAssignment({
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      subject: assignment.subject,
      batchName: assignment.batchName || 'Class Roster',
      maxMarks: assignment.maxMarks,
      studentName: student.name,
      obtainedMarks: marksNum,
      feedback: feedbackText,
      teacherName,
    });

    toast('Marks checked & verified', 'success', `Recorded ${marksNum}/${assignment.maxMarks} for ${student.name}. Parent notified.`);
    setActiveEditStudentId(null);
  };

  const handleSendReminderToStudent = (student: Student) => {
    sendStudentReminder(assignment.id, student.name);
    toast('Reminder Sent', 'success', `Submission alert for "${assignment.title}" sent to ${student.name} & guardian.`);
  };

  const handleBroadcastReminderToAll = () => {
    const count = sendAssignmentReminder(assignment.id);
    toast('Broadcast Sent', 'success', `Submission alert broadcast to all ${notSubmittedCount} pending students.`);
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-surface-muted/40 p-4 sm:p-5">
      {/* Widget Header & Metrics */}
      <div className="flex flex-col gap-3 border-b border-border/70 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary font-bold">
            <Users size={18} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-section font-semibold text-foreground">Student Submissions Roster</h4>
              <Badge tone="primary">Roll No. Ordered</Badge>
              <Badge tone="neutral">Max {assignment.maxMarks} Marks</Badge>
            </div>
            <p className="text-micro text-text-tertiary">
              Submission status, student solution sheets, and inline marks evaluation for {assignment.title}
            </p>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-2.5 py-1 text-micro shadow-2xs">
            <span className="text-text-tertiary">Turn-in:</span>
            <span className="font-semibold text-primary">{submittedCount}/{totalEnrolled} ({turnInPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-2.5 py-1 text-micro shadow-2xs">
            <span className="text-text-tertiary">Checked:</span>
            <span className="font-semibold text-success">{gradedCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-2.5 py-1 text-micro shadow-2xs">
            <span className="text-text-tertiary">Missing:</span>
            <span className="font-semibold text-warning">{notSubmittedCount}</span>
          </div>
          {notSubmittedCount > 0 && (
            <button
              onClick={handleBroadcastReminderToAll}
              className="btn-secondary py-1 px-2.5 text-micro text-warning hover:border-warning"
              title="Send notification to all students who have not submitted yet"
            >
              <Bell size={13} /> Remind All Missing ({notSubmittedCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: `All (${totalEnrolled})` },
            { id: 'submitted', label: `Submitted (${submittedCount})` },
            { id: 'not_submitted', label: `Not Submitted (${notSubmittedCount})` },
            { id: 'pending', label: `To Grade (${pendingCount})` },
            { id: 'graded', label: `Graded (${gradedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-micro font-medium transition-colors',
                statusFilter === tab.id
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface border border-border/80 text-text-secondary hover:bg-muted',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search by student name or roll number */}
        <div className="relative sm:w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search roll no or student…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-8 py-1 text-micro"
          />
        </div>
      </div>

      {/* Student Submissions List / Roster Table */}
      {filteredRoster.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No students match criteria"
          description="Try changing the filter or search query."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredRoster.map((student) => {
            const sub = submissionsByStudentName.get(student.name.toLowerCase().trim());
            const isSubmitted = !!sub;
            const isGraded = sub?.status === 'graded';
            const isEditing = activeEditStudentId === student.id;

            const editData = editingScores[student.id] || {
              marks: sub?.obtainedMarks !== undefined ? String(sub.obtainedMarks) : '',
              feedback: sub?.feedback || '',
            };

            const marksPct = sub?.obtainedMarks !== undefined ? Math.round((sub.obtainedMarks / assignment.maxMarks) * 100) : null;

            return (
              <div
                key={student.id}
                className={cn(
                  'flex flex-col gap-3 rounded-xl border bg-surface p-3.5 transition-all shadow-2xs',
                  isGraded
                    ? 'border-border/80 hover:border-success/40'
                    : isSubmitted
                    ? 'border-primary/30 bg-primary-soft/5'
                    : 'border-border/70 bg-surface',
                )}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  {/* Student Identity & Roll No */}
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <span className="shrink-0 rounded-md bg-surface-muted border border-border/80 px-2 py-1 text-micro font-mono font-bold text-foreground">
                      {student.rollNumber || 'Roll -'}
                    </span>
                    <img
                      src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={student.name}
                      className="h-9 w-9 rounded-full object-cover border border-border/80 shrink-0 cursor-pointer"
                      onClick={() => setSelectedStudentForProfile(student)}
                    />
                    <div className="min-w-0">
                      <button
                        onClick={() => setSelectedStudentForProfile(student)}
                        className="truncate text-meta font-semibold text-foreground hover:text-primary hover:underline text-left block"
                      >
                        {student.name}
                      </button>
                      <div className="flex items-center gap-2 text-micro text-text-tertiary">
                        <span>Adm: {student.admissionNumber}</span>
                        {student.parentPhone && (
                          <span className="hidden sm:inline-flex items-center gap-1">
                            · <Phone size={10} /> {student.parentPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submission Status & Attachment */}
                  <div className="flex flex-1 flex-col gap-1.5 md:px-4">
                    {isSubmitted ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="success" className="gap-1">
                            <CheckCircle2 size={12} /> Submitted
                          </Badge>
                          <span className="text-micro text-text-tertiary">
                            {new Date(sub.submittedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* File Attachment Chip */}
                        {sub.fileName && (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-surface-muted px-2 py-0.5 text-micro font-medium text-text-secondary">
                              <Paperclip size={12} className="text-primary" />
                              <span className="truncate max-w-[200px]">{sub.fileName}</span>
                              <span className="text-text-tertiary">({sub.fileSize || '1.5 MB'})</span>
                            </span>
                            <button
                              onClick={() => {
                                toast('Document Preview', 'info', `Viewing solution file: ${sub.fileName || 'Solution.pdf'} (${student.name})`);
                              }}
                              className="text-micro font-medium text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              View Sheet <ExternalLink size={11} />
                            </button>
                          </div>
                        )}

                        {/* Student Notes */}
                        {sub.studentNotes && (
                          <p className="text-micro italic text-text-tertiary line-clamp-1">
                            &ldquo;{sub.studentNotes}&rdquo;
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge tone="warning" className="gap-1">
                          <AlertCircle size={12} /> Not Submitted
                        </Badge>
                        <button
                          onClick={() => handleSendReminderToStudent(student)}
                          className="btn-secondary py-1 px-2 text-micro text-warning hover:border-warning/60"
                        >
                          <Bell size={12} /> Remind Student
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Marks Checked & Scorecard Section */}
                  <div className="flex shrink-0 items-center justify-between gap-3 md:justify-end">
                    {isGraded && !isEditing ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-section font-bold text-foreground">
                              {sub.obtainedMarks}
                            </span>
                            <span className="text-micro text-text-tertiary">/ {assignment.maxMarks}</span>
                            <Badge tone={marksPct && marksPct >= 80 ? 'success' : marksPct && marksPct >= 60 ? 'primary' : 'warning'}>
                              {marksPct}%
                            </Badge>
                          </div>
                          {sub.feedback && (
                            <p className="text-micro text-text-secondary max-w-[220px] truncate" title={sub.feedback}>
                              {sub.feedback}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setActiveEditStudentId(student.id);
                            setEditingScores((prev) => ({
                              ...prev,
                              [student.id]: {
                                marks: String(sub.obtainedMarks || ''),
                                feedback: sub.feedback || '',
                              },
                            }));
                          }}
                          className="btn-secondary py-1 px-2 text-micro"
                          title="Edit marks or feedback"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {!isEditing ? (
                          <button
                            onClick={() => {
                              setActiveEditStudentId(student.id);
                              setEditingScores((prev) => ({
                                ...prev,
                                [student.id]: {
                                  marks: sub?.obtainedMarks !== undefined ? String(sub.obtainedMarks) : '',
                                  feedback: sub?.feedback || '',
                                },
                              }));
                            }}
                            className={cn(
                              'py-1.5 px-3 text-micro font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors',
                              isSubmitted
                                ? 'bg-primary text-white hover:bg-primary-hover shadow-2xs'
                                : 'bg-surface border border-border text-text-secondary hover:bg-muted',
                            )}
                          >
                            <FileCheck2 size={14} /> {isSubmitted ? 'Check & Grade' : 'Mark Offline Notebook'}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSaveGrade(student)}
                              className="btn-primary py-1 px-2.5 text-micro"
                            >
                              <Check size={13} /> Save
                            </button>
                            <button
                              onClick={() => setActiveEditStudentId(null)}
                              className="btn-secondary py-1 px-2 text-micro text-text-tertiary"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Inline Evaluation Form */}
                {isEditing && (
                  <div className="mt-2 flex flex-col gap-2.5 rounded-lg border border-primary/30 bg-surface-muted/70 p-3 animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-micro font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles size={14} className="text-primary" /> Evaluate & Record Marks for {student.name}
                      </span>
                      <span className="text-micro text-text-tertiary">Max Marks: {assignment.maxMarks}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="label text-micro mb-1">Marks Obtained *</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={assignment.maxMarks}
                            placeholder={`0-${assignment.maxMarks}`}
                            value={editData.marks}
                            onChange={(e) =>
                              setEditingScores((prev) => ({
                                ...prev,
                                [student.id]: { ...editData, marks: e.target.value },
                              }))
                            }
                            className="input py-1 text-meta font-bold w-24"
                          />
                          <span className="text-meta font-medium text-text-tertiary">/ {assignment.maxMarks}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="label text-micro mb-1">Teacher Remarks & Feedback</label>
                        <input
                          type="text"
                          placeholder="e.g. Excellent step derivations. Keep it up!"
                          value={editData.feedback}
                          onChange={(e) =>
                            setEditingScores((prev) => ({
                              ...prev,
                              [student.id]: { ...editData, feedback: e.target.value },
                            }))
                          }
                          className="input py-1 text-meta"
                        />
                      </div>
                    </div>

                    {/* Quick feedback tags */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-micro text-text-tertiary">Quick feedback:</span>
                      {QUICK_FEEDBACK_TAGS.map((tag, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setEditingScores((prev) => ({
                              ...prev,
                              [student.id]: { ...editData, feedback: tag },
                            }))
                          }
                          className="rounded-md border border-border bg-surface px-2 py-0.5 text-micro text-text-secondary hover:border-primary hover:text-primary transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setActiveEditStudentId(null)}
                        className="btn-secondary py-1 px-3 text-micro"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveGrade(student)}
                        className="btn-primary py-1 px-3 text-micro"
                      >
                        <Check size={14} /> Verify & Publish Score
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Student 360° Profile & Digital ID Modal */}
      {selectedStudentForProfile && (
        <StudentProfileDetailModal
          student={selectedStudentForProfile}
          viewerRole="teacher"
          onClose={() => setSelectedStudentForProfile(null)}
        />
      )}
    </div>
  );
};
