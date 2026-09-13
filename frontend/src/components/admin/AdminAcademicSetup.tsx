'use client';

/**
 * Admin Academic Setup — real subject CRUD + faculty assignment.
 *
 * Closes spec §1.3 (subject management) and §4 admin workflow
 * ("Create / Configure Subjects → Assign Faculty").
 *
 * Distinguished from AdminAcademicOverview: overview REPORTS on
 * per-subject/batch progress; this screen CREATES and ASSIGNS. They share the
 * `subjects` table but read/write it for different purposes, so keeping them
 * separate keeps each screen focused.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  UserMinus,
  Loader2,
  X,
  Check,
  Star,
} from 'lucide-react';
import { PageHeader, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';

interface SubjectRow {
  id: string;
  name: string;
  code: string;
  color?: string;
  iconName?: string;
}

interface AssignmentRow {
  assignmentId: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  batchId: string | null;
  isPrimary: boolean;
}

interface TeacherOption {
  id: string;
  name: string;
  email: string;
}

const DEFAULT_COLOR = '#3B82F6';

export const AdminAcademicSetup: React.FC = () => {
  const { session } = useAuth();
  const tenantId = session?.tenantId;

  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/edit modal state
  const [editing, setEditing] = useState<SubjectRow | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formColor, setFormColor] = useState(DEFAULT_COLOR);
  const [saving, setSaving] = useState(false);

  // Assignment panel state — one subject open at a time
  const [assignPanelSubjectId, setAssignPanelSubjectId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [pickTeacherId, setPickTeacherId] = useState<string>('');
  const [pickAsPrimary, setPickAsPrimary] = useState(false);

  // Delete confirmation state — a soft-delete of a subject cascades semantically
  // (its syllabus is orphaned), so an accidental click shouldn't do it.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [subs, tchs] = await Promise.all([
      dataService.listSubjects(tenantId),
      dataService.listTeachers(tenantId),
    ]);
    setSubjects(subs);
    setTeachers(tchs);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormCode('');
    setFormColor(DEFAULT_COLOR);
    setShowFormModal(true);
  };

  const openEdit = (s: SubjectRow) => {
    setEditing(s);
    setFormName(s.name);
    setFormCode(s.code);
    setFormColor(s.color || DEFAULT_COLOR);
    setShowFormModal(true);
  };

  const saveSubject = async () => {
    if (!formName.trim() || !formCode.trim()) {
      toast('Name and code are required', 'error');
      return;
    }
    if (!tenantId) {
      toast('Sign in to save', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const ok = await dataService.updateSubject(editing.id, {
          name: formName,
          code: formCode,
          color: formColor,
        });
        if (!ok) {
          toast('Failed to update subject', 'error');
          return;
        }
        toast('Subject updated', 'success');
      } else {
        const newId = await dataService.createSubject({
          tenantId,
          name: formName,
          code: formCode,
          color: formColor,
        });
        if (!newId) {
          toast('Failed to create subject', 'error');
          return;
        }
        toast('Subject created', 'success');
      }
      setShowFormModal(false);
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (id: string) => {
    const ok = await dataService.deleteSubject(id);
    if (!ok) {
      toast('Failed to delete subject', 'error');
      return;
    }
    toast('Subject deleted', 'success');
    setPendingDeleteId(null);
    if (assignPanelSubjectId === id) setAssignPanelSubjectId(null);
    await loadAll();
  };

  const openAssignPanel = async (subjectId: string) => {
    if (assignPanelSubjectId === subjectId) {
      setAssignPanelSubjectId(null);
      return;
    }
    setAssignPanelSubjectId(subjectId);
    setPickTeacherId('');
    setPickAsPrimary(false);
    setAssignLoading(true);
    const rows = await dataService.listSubjectTeachers(subjectId);
    setAssignments(rows);
    setAssignLoading(false);
  };

  const addAssignment = async () => {
    if (!assignPanelSubjectId || !pickTeacherId || !tenantId) return;
    setAssignLoading(true);
    const res = await dataService.assignFaculty({
      tenantId,
      subjectId: assignPanelSubjectId,
      teacherId: pickTeacherId,
      isPrimary: pickAsPrimary,
    });
    if (res.error === 'duplicate') {
      toast('That teacher is already assigned to this subject', 'error');
    } else if (res.error === 'primary_conflict') {
      toast('Another primary teacher exists — demote them first', 'error');
    } else if (res.error) {
      toast('Failed to assign teacher', 'error');
    } else {
      toast('Teacher assigned', 'success');
      const rows = await dataService.listSubjectTeachers(assignPanelSubjectId);
      setAssignments(rows);
      setPickTeacherId('');
      setPickAsPrimary(false);
    }
    setAssignLoading(false);
  };

  const removeAssignment = async (assignmentId: string) => {
    if (!assignPanelSubjectId) return;
    setAssignLoading(true);
    const ok = await dataService.unassignFaculty(assignmentId);
    if (!ok) {
      toast('Failed to remove assignment', 'error');
    } else {
      toast('Assignment removed', 'success');
      const rows = await dataService.listSubjectTeachers(assignPanelSubjectId);
      setAssignments(rows);
    }
    setAssignLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title="Academic Setup"
        subtitle="Create subjects, edit them, and assign teaching faculty."
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
          >
            <Plus size={16} /> New subject
          </button>
        }
      />

      {subjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          <BookOpen size={32} className="mx-auto mb-3 text-primary/60" />
          <p className="font-semibold text-foreground">No subjects yet</p>
          <p className="mt-1">Click &quot;New subject&quot; to add the first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map((s) => {
            const isOpen = assignPanelSubjectId === s.id;
            return (
              <div key={s.id} className="rounded-xl border border-border bg-surface overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: (s.color || DEFAULT_COLOR) + '22' }}
                  >
                    <BookOpen size={18} style={{ color: s.color || DEFAULT_COLOR }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm">{s.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{s.code}</div>
                  </div>
                  <button
                    onClick={() => openAssignPanel(s.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border',
                      isOpen ? 'bg-primary text-primary-foreground border-primary' : 'bg-surface border-border text-foreground hover:bg-muted',
                    )}
                  >
                    <UserPlus size={14} /> Faculty
                  </button>
                  <button
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Edit subject"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(s.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600"
                    title="Delete subject"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-border bg-muted/30 p-4 space-y-3">
                    {assignLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 size={14} className="animate-spin" /> Loading assignments…
                      </div>
                    ) : (
                      <>
                        {assignments.length === 0 ? (
                          <div className="text-xs text-muted-foreground">No teachers assigned yet.</div>
                        ) : (
                          <ul className="space-y-2">
                            {assignments.map((a) => (
                              <li
                                key={a.assignmentId}
                                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                              >
                                {a.isPrimary && (
                                  <Star size={14} className="text-amber-500 fill-amber-500" aria-label="Primary teacher" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-foreground truncate">{a.teacherName || '(unnamed)'}</div>
                                  <div className="text-xs text-muted-foreground truncate">{a.teacherEmail}</div>
                                </div>
                                <button
                                  onClick={() => removeAssignment(a.assignmentId)}
                                  className="p-1.5 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                  title="Remove"
                                >
                                  <UserMinus size={15} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <select
                            value={pickTeacherId}
                            onChange={(e) => setPickTeacherId(e.target.value)}
                            className="flex-1 min-w-[180px] rounded-lg border border-border bg-surface text-sm px-2.5 py-1.5"
                          >
                            <option value="">Select a teacher…</option>
                            {teachers.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name || t.email}
                              </option>
                            ))}
                          </select>
                          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={pickAsPrimary}
                              onChange={(e) => setPickAsPrimary(e.target.checked)}
                              className="rounded border-border"
                            />
                            Primary teacher
                          </label>
                          <button
                            onClick={addAssignment}
                            disabled={!pickTeacherId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
                          >
                            <Check size={14} /> Assign
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/edit modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface border border-border shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">
                {editing ? 'Edit subject' : 'New subject'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Code</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. MATH-10"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Colour</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="h-9 w-12 rounded-lg border border-border bg-surface cursor-pointer"
                  />
                  <span className="text-xs font-mono text-muted-foreground">{formColor}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowFormModal(false)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={saveSubject}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface border border-border shadow-lg p-5">
            <h3 className="text-base font-bold text-foreground mb-1">Delete subject?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This hides the subject from teachers and students. Its syllabus,
              exams and assignments are kept in the database but will no longer
              appear.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => doDelete(pendingDeleteId)}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAcademicSetup;
