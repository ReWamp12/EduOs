'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTeacherBatch } from '@/lib/teacherContext';
import { useAppStore, addAssignment, deleteAssignment, sendAssignmentReminder, AssignmentRecord, Submission } from '@/lib/store';
import { AssignmentAttachment } from '@/lib/types';
import { PageHeader, Card, Badge, ProgressBar, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { AssignmentStudentRosterWidget } from './AssignmentStudentRosterWidget';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Users,
  Paperclip,
  Award,
  Trash2,
  Bell,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
  X,
  Search,
  UploadCloud,
} from 'lucide-react';

const CATEGORY_OPTIONS: { id: 'dpp' | 'homework' | 'project' | 'worksheet'; label: string; tone: 'primary' | 'info' | 'warning' | 'neutral' }[] = [
  { id: 'homework', label: 'Homework', tone: 'primary' },
  { id: 'dpp', label: 'DPP (Daily Practice)', tone: 'info' },
  { id: 'worksheet', label: 'Chapter Worksheet', tone: 'warning' },
  { id: 'project', label: 'Lab Practical / Project', tone: 'neutral' },
];

export const TeacherAssignments: React.FC = () => {
  const { batch, batches, students, teacher, subjects } = useTeacherBatch();
  const { assignments, submissions } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active batch assignments
  const batchAssignments = useMemo(() => {
    return assignments.filter((a) => !a.batchName || a.batchName === batch.name);
  }, [assignments, batch.name]);

  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Form state for creating assignment
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState<string>(() => subjects[0] || 'Mathematics');
  const [formCategory, setFormCategory] = useState<'dpp' | 'homework' | 'project' | 'worksheet'>('homework');
  const [formDueDate, setFormDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  });
  const [formMaxMarks, setFormMaxMarks] = useState('25');
  const [formDescription, setFormDescription] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formAttachments, setFormAttachments] = useState<AssignmentAttachment[]>([
    { name: 'Problem_Set_Exercise_Worksheet.pdf', url: 'https://storage.eduos.app/sheets/worksheet.pdf', size: '1.4 MB', type: 'pdf' },
  ]);

  // Sync default subject when subjects change
  useEffect(() => {
    if (subjects.length > 0 && !subjects.includes(formSubject)) {
      setFormSubject(subjects[0]);
    }
  }, [subjects]);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: AssignmentAttachment[] = Array.from(files).map((file) => {
      const sizeStr =
        file.size < 1024 * 1024
          ? `${Math.max(1, Math.round(file.size / 1024))} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      const isImg = /\.(png|jpe?g|webp)$/i.test(file.name);
      return {
        name: file.name,
        url: URL.createObjectURL(file),
        size: sizeStr,
        type: isPdf ? 'pdf' : isImg ? 'image' : 'doc',
      };
    });

    setFormAttachments((prev) => [...prev, ...newItems]);
    toast('File attached', 'success', `Attached ${newItems.length} file(s) to assignment.`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddPreset = (presetName: string, size: string) => {
    if (formAttachments.some((a) => a.name === presetName)) {
      toast('Already attached', 'info', `${presetName} is already attached.`);
      return;
    }
    setFormAttachments((prev) => [
      ...prev,
      {
        name: presetName,
        url: `https://storage.eduos.app/sheets/${encodeURIComponent(presetName)}`,
        size,
        type: 'pdf',
      },
    ]);
    toast('Problem sheet attached', 'success', `Added ${presetName.replace(/_/g, ' ')}`);
  };

  const handleRemoveAttachment = (index: number) => {
    setFormAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return batchAssignments.filter((a) => {
      const matchSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = selectedCategoryFilter === 'all' || a.category === selectedCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [batchAssignments, searchQuery, selectedCategoryFilter]);

  // Overall metrics
  const totalSubmissionsInBatch = useMemo(() => {
    const asgIds = new Set(batchAssignments.map((a) => a.id));
    return submissions.filter((s) => asgIds.has(s.assignmentId));
  }, [batchAssignments, submissions]);

  const pendingGradingCount = useMemo(() => {
    return totalSubmissionsInBatch.filter((s) => s.status === 'submitted').length;
  }, [totalSubmissionsInBatch]);

  const gradedSubmissionsCount = useMemo(() => {
    return totalSubmissionsInBatch.filter((s) => s.status === 'graded').length;
  }, [totalSubmissionsInBatch]);

  // Helpers
  const getSubmissionsForAssignment = (assignmentId: string) => {
    return submissions.filter((s) => s.assignmentId === assignmentId);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast('Title required', 'info', 'Please enter a title for the assignment.');
      return;
    }

    const created = addAssignment({
      title: formTitle.trim(),
      subject: formSubject || subjects[0] || 'Mathematics',
      category: formCategory,
      batchId: batch.id,
      batchName: batch.name,
      dueDate: formDueDate,
      maxMarks: Number(formMaxMarks) || 25,
      description: formDescription.trim() || 'Please solve all questions in your class notebook and upload clear step-by-step solutions.',
      instructions: formInstructions.trim() || '1. Show complete calculations.\n2. Verify final answers.\n3. Upload scanned PDF.',
      teacherName: teacher.name,
      teacherId: teacher.id,
      attachments: formAttachments,
      tags: [formSubject || subjects[0] || 'Coursework', formCategory.toUpperCase(), 'CBSE 2026'],
    });

    toast('Assignment Shared', 'success', `"${created.title}" shared with ${batch.name.split(' — ')[0]}. Students notified.`);
    setShowCreateModal(false);

    // Reset fields
    setFormTitle('');
    setFormDescription('');
    setFormInstructions('');
  };

  const handleDeleteAssignment = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete assignment "${title}"?`)) {
      deleteAssignment(id);
      toast('Assignment removed', 'info', `${title} deleted.`);
      if (expandedAssignmentId === id) {
        setExpandedAssignmentId(null);
      }
    }
  };

  const handleRemindStudents = (assignmentId: string, title: string) => {
    sendAssignmentReminder(assignmentId);
    toast('Reminder sent', 'success', `Submission alert for "${title}" broadcast to students.`);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Soft Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-title font-semibold text-foreground">Assignments & Coursework</h1>
          <p className="text-meta text-text-secondary">
            Manage practice problem sheets, homework, and review student evaluations for {batch.name.split(' — ')[0]}.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary shrink-0 self-start sm:self-auto gap-2"
          id="btn-create-assignment"
        >
          <PlusCircle size={16} /> Share New Assignment
        </button>
      </div>

      {/* Soft KPI Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
          <div className="text-micro font-medium text-text-tertiary">Active Assignments</div>
          <div className="mt-1 text-title font-bold text-foreground">{batchAssignments.length}</div>
          <div className="mt-1 text-micro text-text-tertiary">{batch.name.split(' — ')[0]}</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
          <div className="text-micro font-medium text-text-tertiary">Submissions</div>
          <div className="mt-1 text-title font-bold text-primary">
            {totalSubmissionsInBatch.length}
            <span className="text-sm font-normal text-text-tertiary"> / {batchAssignments.length * students.length || '—'}</span>
          </div>
          <div className="mt-1 text-micro text-text-tertiary">Turn-in rate</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
          <div className="text-micro font-medium text-text-tertiary">To Check & Grade</div>
          <div className="mt-1 text-title font-bold text-warning">{pendingGradingCount}</div>
          <div className="mt-1 text-micro text-text-tertiary">Awaiting score check</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
          <div className="text-micro font-medium text-text-tertiary">Evaluated</div>
          <div className="mt-1 text-title font-bold text-success">{gradedSubmissionsCount}</div>
          <div className="mt-1 text-micro text-text-tertiary">Marks verified</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search assignments by title or topic…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 py-1.5 text-meta"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-micro text-text-tertiary inline-flex items-center gap-1">
            <Filter size={13} /> Filter:
          </span>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="input py-1 text-meta sm:w-44"
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-surface p-8 text-center shadow-xs">
          <EmptyState
            icon={<FileText size={28} />}
            title="No assignments found"
            description="Create and share your first Daily Practice Problem (DPP) or homework assignment with this batch."
            action={
              <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-2">
                <PlusCircle size={16} /> Create Assignment
              </button>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredAssignments.map((assignment) => {
            const asgSubs = getSubmissionsForAssignment(assignment.id);
            const submittedCount = asgSubs.length;
            const gradedCount = asgSubs.filter((s) => s.status === 'graded').length;
            const pendingCount = asgSubs.filter((s) => s.status === 'submitted').length;
            const pctSubmitted = students.length > 0 ? Math.round((submittedCount / students.length) * 100) : 0;
            const catConfig = CATEGORY_OPTIONS.find((c) => c.id === assignment.category) || CATEGORY_OPTIONS[0];
            const isExpanded = expandedAssignmentId === assignment.id;

            return (
              <div
                key={assignment.id}
                className={cn(
                  'flex flex-col gap-4 rounded-2xl border bg-surface p-5 transition-all shadow-xs',
                  isExpanded ? 'border-primary/50 shadow-md ring-1 ring-primary/20' : 'border-border/80 hover:border-border-strong',
                )}
              >
                {/* Assignment Info Header */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={catConfig.tone}>{catConfig.label}</Badge>
                      <Badge tone="neutral">{assignment.subject}</Badge>
                      <span className="inline-flex items-center gap-1 text-micro text-text-tertiary">
                        <Clock size={12} /> Due: <strong className="text-foreground">{assignment.dueDate}</strong>
                      </span>
                      <span className="text-micro text-text-tertiary">· Max {assignment.maxMarks} Marks</span>
                    </div>

                    <h3 className="mt-2 text-section font-semibold text-foreground">{assignment.title}</h3>
                    {assignment.description && (
                      <p className="mt-1 line-clamp-2 text-meta text-text-secondary">
                        {assignment.description}
                      </p>
                    )}

                    {/* Attachments preview */}
                    {assignment.attachments && assignment.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-micro font-medium text-text-tertiary">Attachments:</span>
                        {assignment.attachments.map((att, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface-muted px-2.5 py-1 text-micro font-medium text-text-secondary"
                          >
                            <Paperclip size={12} className="text-primary" />
                            <span className="truncate max-w-[180px]">{att.name}</span>
                            <span className="text-text-tertiary">({att.size})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submission progress */}
                  <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-surface-muted/60 p-3.5 lg:w-64">
                    <div className="flex items-center justify-between text-micro">
                      <span className="font-semibold text-foreground">Turn-in</span>
                      <span className="font-medium text-text-secondary">{submittedCount}/{students.length} ({pctSubmitted}%)</span>
                    </div>
                    <ProgressBar value={pctSubmitted} tone={pctSubmitted >= 80 ? 'success' : pctSubmitted >= 40 ? 'primary' : 'warning'} />
                    <div className="flex items-center justify-between text-micro text-text-tertiary">
                      <span>{pendingCount} to check</span>
                      <span>{gradedCount} evaluated</span>
                    </div>
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setExpandedAssignmentId(isExpanded ? null : assignment.id)}
                      className={cn(
                        'py-1.5 px-3.5 text-meta font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all shadow-2xs',
                        isExpanded
                          ? 'bg-primary text-white'
                          : 'bg-primary-soft text-primary hover:bg-primary-soft/80',
                      )}
                    >
                      <Users size={14} />
                      {isExpanded
                        ? 'Hide Student Submissions Roster'
                        : `View Student Submissions (${submittedCount}/${students.length})`}
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <button
                      onClick={() => handleRemindStudents(assignment.id, assignment.title)}
                      className="btn-secondary py-1.5 px-3 text-meta"
                    >
                      <Bell size={13} /> Remind Missing
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                    className="inline-flex items-center gap-1 text-micro text-text-tertiary hover:text-destructive transition-colors p-1"
                    title="Delete assignment"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>

                {/* Expandable Student Submissions & Evaluation Roster Widget Card */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-border/60 animate-fade-in">
                    <AssignmentStudentRosterWidget
                      assignment={assignment}
                      students={students}
                      submissions={submissions}
                      teacherName={teacher.name}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE ASSIGNMENT */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in">
            {/* Modal Header (Sticky) */}
            <div className="shrink-0 flex items-center justify-between border-b border-border bg-surface-muted px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <PlusCircle size={20} />
                </span>
                <div>
                  <h3 className="text-section font-semibold text-foreground">Share Assignment or DPP</h3>
                  <p className="text-micro text-text-tertiary">Distribute coursework to {batch.name.split(' — ')[0]}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleCreateAssignment} id="create-assignment-form" className="flex flex-1 flex-col overflow-y-auto p-6 gap-4 min-h-0">
              {/* Teacher Context Information Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted p-3">
                <div className="flex items-center gap-2">
                  <span className="eyebrow">Assigned Class:</span>
                  <Badge tone="primary">{batch.name.split(' — ')[0]}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="eyebrow">Faculty:</span>
                  <span className="text-micro font-semibold text-foreground">{teacher.name}</span>
                  <span className="text-micro text-text-tertiary">({teacher.designation})</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="asg-subject">Subject *</label>
                  <select
                    id="asg-subject"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="input"
                  >
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor="asg-title">Assignment Title *</label>
                  <input
                    id="asg-title"
                    type="text"
                    required
                    placeholder="e.g. Chapter 5: Arithmetic Progressions DPP 01"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="label" htmlFor="asg-category">Category</label>
                  <select
                    id="asg-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="input"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor="asg-marks">Max Marks</label>
                  <input
                    id="asg-marks"
                    type="number"
                    min={1}
                    max={100}
                    value={formMaxMarks}
                    onChange={(e) => setFormMaxMarks(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="asg-due">Submission Due Date</label>
                  <input
                    id="asg-due"
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="asg-desc">Description & Topics Covered</label>
                <textarea
                  id="asg-desc"
                  rows={2}
                  placeholder="Outline key concepts, textbook exercises (e.g. Exercise 5.2 Q1 to Q10) or problem areas…"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label" htmlFor="asg-instructions">Special Instructions for Students</label>
                <textarea
                  id="asg-instructions"
                  rows={2}
                  placeholder="e.g. 1. Show all derivations. 2. Verify quadratic discriminant before solving. 3. Upload scanned PDF."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="input"
                />
              </div>

              {/* Attachments Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Problem Sheets & Attachments</label>
                  <span className="text-micro text-text-tertiary">{formAttachments.length} attached</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Upload Trigger Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-muted/60 p-4 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary-soft/30 group"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary group-hover:scale-110 transition-transform">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <span className="text-meta font-semibold text-primary group-hover:underline">
                      Click to browse & upload files
                    </span>
                    <span className="text-meta text-text-secondary"> or drag & drop</span>
                    <p className="text-micro text-text-tertiary mt-0.5">
                      Supports PDF, Word Documents (.docx), and Images (PNG, JPG)
                    </p>
                  </div>
                </div>

                {/* Quick Add Presets */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-micro font-medium text-text-tertiary">Quick add templates:</span>
                  {[
                    { name: 'NCERT_Exemplar_Practice_Sheet.pdf', size: '1.2 MB' },
                    { name: 'Chapter_Formula_MindMap.pdf', size: '850 KB' },
                    { name: 'Previous_5Yr_Board_Problems.pdf', size: '2.1 MB' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleAddPreset(preset.name, preset.size)}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-micro text-text-secondary hover:border-primary hover:text-primary transition-colors"
                    >
                      + {preset.name.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                {/* Attached Files List */}
                {formAttachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formAttachments.map((att, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-muted px-2.5 py-1 text-micro font-medium text-foreground shadow-2xs"
                      >
                        <Paperclip size={13} className="text-primary" />
                        <span className="truncate max-w-[200px]">{att.name}</span>
                        <span className="text-text-tertiary">({att.size})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="text-text-tertiary hover:text-destructive ml-1 text-sm leading-none font-bold"
                          title="Remove file"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </form>

            {/* Modal Footer (Sticky) */}
            <div className="shrink-0 flex items-center justify-end gap-3 border-t border-border bg-surface-muted px-6 py-3.5">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-assignment-form"
                className="btn-primary"
              >
                <Send size={16} /> Publish & Share to Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
