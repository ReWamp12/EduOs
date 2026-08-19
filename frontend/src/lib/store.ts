'use client';

import { useEffect, useState } from 'react';
import { mockAssignments, mockNotices, mockExamResults, mockStudentsInBatch } from './mockData';

/**
 * EduOS shared client store.
 *
 * Cross-role entities (PTM bookings, assignment submissions) need to be visible
 * across stakeholder views — a parent booking a slot must appear in the teacher's
 * view, a student submission must land in the teacher's grading queue. The demo
 * backend doesn't expose a shared query layer for these, so this is a lightweight
 * reactive, localStorage-persisted store that acts as the single source of truth.
 */

export interface PTMBooking {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  slot: string;
  mode: string;
  studentName: string;
  parentName: string;
  status: 'requested' | 'confirmed';
  createdAt: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  title: string;
  subject: string;
  batchName: string;
  studentName: string;
  maxMarks: number;
  status: 'submitted' | 'graded';
  obtainedMarks?: number;
  feedback?: string;
  submittedAt: number;
}

/** Unified parent notification feed — attendance + published results. */
export interface ParentAlert {
  id: string;
  type: 'attendance' | 'result' | 'exam';
  studentName: string;
  title: string;
  message: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
  date: string;
  source: string; // teacher who triggered it
  read: boolean;
  createdAt: number;
}

export type NoticeAudience = 'teacher' | 'student' | 'parent';

export interface NoticeMessage {
  id: string;
  title: string;
  content: string;
  category: 'academic' | 'exam' | 'event' | 'urgent' | 'general';
  audience: NoticeAudience[];
  senderRole: 'principal' | 'teacher' | 'super_admin';
  senderName: string;
  date: string;
  createdAt: number;
}

export interface ExamRecord {
  id: string;
  title: string;
  subject: string;
  batchName: string;
  examType: string;
  examDate: string;
  maxMarks: number;
  status: 'scheduled' | 'completed';
  createdBy: string;
  createdAt: number;
  // Per-child result (populated for completed exams in this single-student demo).
  studentName?: string;
  marksObtained?: number;
  percentile?: number;
  rankInBatch?: number;
}

export interface AppState {
  ptmBookings: PTMBooking[];
  submissions: Submission[];
  parentAlerts: ParentAlert[];
  notices: NoticeMessage[];
  exams: ExamRecord[];
}

const STORAGE_KEY = 'eduos-store-v1';

// Deterministic seed — identical on server and first client render (no hydration
// mismatch). Seeds the two already-submitted/graded assignments so the teacher's
// queue isn't empty and the student's statuses stay consistent.
function seed(): AppState {
  const submissions: Submission[] = mockAssignments
    .filter((a) => a.status !== 'pending')
    .map((a) => ({
      id: `sub-seed-${a.id}`,
      assignmentId: a.id,
      title: a.title,
      subject: a.subject,
      batchName: a.batchName,
      studentName: 'Aarav Sharma',
      maxMarks: a.maxMarks,
      status: a.status === 'graded' ? 'graded' : 'submitted',
      obtainedMarks: a.obtainedMarks,
      feedback: a.feedback,
      submittedAt: Date.now() - 86_400_000,
    }));
  // Seed the notice board with the existing school circulars, addressed to everyone.
  const notices: NoticeMessage[] = mockNotices.map((n, i) => ({
    id: `notice-seed-${n.id}`,
    title: n.title,
    content: n.content,
    category: n.category,
    audience: ['teacher', 'student', 'parent'],
    senderRole: 'principal',
    senderName: n.author,
    date: n.date,
    createdAt: Date.now() - (i + 1) * 3_600_000,
  }));
  // Seed completed exams (with the child's results) so history isn't empty.
  const exams: ExamRecord[] = mockExamResults.map((er, i) => ({
    id: `exam-seed-${er.id}`,
    title: er.examTitle,
    subject: er.subject,
    batchName: 'Class 11 - JEE Advanced Alpha',
    examType: 'Mock Test',
    examDate: er.examDate,
    maxMarks: er.totalMarks,
    status: 'completed',
    createdBy: 'Prof. Amit Verma',
    createdAt: Date.now() - (i + 1) * 172_800_000,
    studentName: 'Aarav Sharma',
    marksObtained: er.marksObtained,
    percentile: er.percentile,
    rankInBatch: er.rankInBatch,
  }));
  return { ptmBookings: [], submissions, parentAlerts: [], notices, exams };
}

let state: AppState = seed();
let hydrated = false;
let listeners: Array<(s: AppState) => void> = [];

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

function emit() {
  listeners.forEach((l) => l(state));
}

function setState(next: Partial<AppState>) {
  state = { ...state, ...next };
  persist();
  emit();
}

/** Load persisted state on the client, once, after first render. */
function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      if (parsed && typeof parsed === 'object') {
        // Merge over seed defaults so older persisted shapes (missing newer
        // collections) stay valid.
        state = { ...seed(), ...parsed };
        emit();
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
}

/* ------------------------------ actions ------------------------------ */

export function addPtmBooking(input: Omit<PTMBooking, 'id' | 'status' | 'createdAt'>): PTMBooking {
  const booking: PTMBooking = {
    ...input,
    id: `ptm-${Date.now()}`,
    status: 'requested',
    createdAt: Date.now(),
  };
  setState({ ptmBookings: [booking, ...state.ptmBookings] });
  return booking;
}

export function confirmPtmBooking(id: string) {
  setState({
    ptmBookings: state.ptmBookings.map((b) => (b.id === id ? { ...b, status: 'confirmed' } : b)),
  });
}

export function addSubmission(input: Omit<Submission, 'id' | 'status' | 'submittedAt'>): Submission {
  // Replace any prior submission for the same assignment+student.
  const filtered = state.submissions.filter(
    (s) => !(s.assignmentId === input.assignmentId && s.studentName === input.studentName),
  );
  const submission: Submission = {
    ...input,
    id: `sub-${Date.now()}`,
    status: 'submitted',
    submittedAt: Date.now(),
  };
  setState({ submissions: [submission, ...filtered] });
  return submission;
}

function pushAlerts(alerts: ParentAlert[]) {
  setState({ parentAlerts: [...alerts, ...state.parentAlerts] });
}

function todayLabel() {
  try {
    return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return 'Today';
  }
}

/** Teacher grades a queued submission → student sees the grade AND parent is notified. */
export function gradeSubmission(id: string, obtainedMarks: number, feedback: string) {
  const sub = state.submissions.find((s) => s.id === id);
  const submissions = state.submissions.map((s) =>
    s.id === id ? { ...s, status: 'graded' as const, obtainedMarks, feedback } : s,
  );
  const alerts: ParentAlert[] = sub
    ? [resultAlert(sub.studentName, sub.title, obtainedMarks, sub.maxMarks, 'Prof. Amit Verma')]
    : [];
  setState({ submissions, parentAlerts: [...alerts, ...state.parentAlerts] });
}

function attendanceMessage(name: string, status: 'present' | 'absent' | 'late', period: string, batchName: string) {
  const first = name.split(' ')[0];
  if (status === 'absent') return `${first} was marked ABSENT for ${period} in ${batchName} today. Please contact the school if this is unexpected.`;
  if (status === 'late') return `${first} arrived LATE for ${period} in ${batchName} today.`;
  return `${first} was marked present for ${period} in ${batchName} today.`;
}

/** Teacher submits attendance → a parent alert per student. */
export function recordAttendance(input: {
  batchName: string;
  markedBy: string;
  period: string;
  date: string;
  records: { studentName: string; status: 'present' | 'absent' | 'late' }[];
}): ParentAlert[] {
  const now = Date.now();
  const alerts: ParentAlert[] = input.records.map((r, i) => ({
    id: `att-${now}-${i}`,
    type: 'attendance',
    studentName: r.studentName,
    title: `Marked ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`,
    message: attendanceMessage(r.studentName, r.status, input.period, input.batchName),
    tone: r.status === 'absent' ? 'danger' : r.status === 'late' ? 'warning' : 'success',
    date: input.date,
    source: input.markedBy,
    read: false,
    createdAt: now,
  }));
  pushAlerts(alerts);
  return alerts;
}

function resultAlert(studentName: string, title: string, obtained: number, max: number, source: string): ParentAlert {
  const first = studentName.split(' ')[0];
  const pct = max > 0 ? Math.round((obtained / max) * 100) : 0;
  const tone: ParentAlert['tone'] = pct >= 75 ? 'success' : pct >= 40 ? 'info' : 'warning';
  return {
    id: `res-${Date.now()}-${Math.round(obtained)}-${title.length}`,
    type: 'result',
    studentName,
    title: `Result published · ${title}`,
    message: `${first} scored ${obtained}/${max} (${pct}%) in ${title}.`,
    tone,
    date: todayLabel(),
    source,
    read: false,
    createdAt: Date.now(),
  };
}

/** Teacher publishes gradebook marks → a result alert per student for parents. */
export function recordResults(input: {
  assessmentTitle: string;
  maxMarks: number;
  markedBy: string;
  results: { studentName: string; obtainedMarks: number }[];
}): ParentAlert[] {
  const alerts = input.results.map((r, i) => ({
    ...resultAlert(r.studentName, input.assessmentTitle, r.obtainedMarks, input.maxMarks, input.markedBy),
    id: `res-${Date.now()}-${i}`,
  }));
  pushAlerts(alerts);
  return alerts;
}

/** Teacher schedules a new exam → appears in exam history for staff, students & parents. */
export function addExam(input: {
  title: string;
  subject: string;
  batchName: string;
  examType: string;
  examDate: string;
  maxMarks: number;
  createdBy: string;
}): ExamRecord {
  const exam: ExamRecord = {
    ...input,
    id: `exam-${Date.now()}`,
    status: 'scheduled',
    createdAt: Date.now(),
  };

  // Notify parents of students in this batch (parent dashboard alert feed).
  const now = Date.now();
  const examAlerts: ParentAlert[] = mockStudentsInBatch
    .filter((s) => s.batchName === exam.batchName)
    .map((s, i) => ({
      id: `exam-alert-${now}-${i}`,
      type: 'exam',
      studentName: s.name,
      title: 'New exam scheduled',
      message: `${s.name.split(' ')[0]}'s ${exam.subject} ${exam.examType} “${exam.title}” is scheduled for ${exam.examDate} (max ${exam.maxMarks} marks).`,
      tone: 'info',
      date: exam.examDate,
      source: exam.createdBy,
      read: false,
      createdAt: now,
    }));

  // Notify students AND parents via the notice board inbox.
  const notice: NoticeMessage = {
    id: `notice-exam-${now}`,
    title: `New exam scheduled: ${exam.title}`,
    content: `A ${exam.examType} in ${exam.subject} has been scheduled for ${exam.batchName} on ${exam.examDate} (maximum ${exam.maxMarks} marks). Please prepare accordingly.`,
    category: 'exam',
    audience: ['student', 'parent'],
    senderRole: 'teacher',
    senderName: exam.createdBy,
    date: todayLabel(),
    createdAt: now,
  };

  setState({
    exams: [exam, ...state.exams],
    parentAlerts: [...examAlerts, ...state.parentAlerts],
    notices: [notice, ...state.notices],
  });
  return exam;
}

/** Principal / teacher broadcasts a notice to selected audiences. */
export function sendNotice(input: {
  title: string;
  content: string;
  category: NoticeMessage['category'];
  audience: NoticeAudience[];
  senderRole: NoticeMessage['senderRole'];
  senderName: string;
}): NoticeMessage {
  const notice: NoticeMessage = {
    ...input,
    id: `notice-${Date.now()}`,
    date: todayLabel(),
    createdAt: Date.now(),
  };
  setState({ notices: [notice, ...state.notices] });
  return notice;
}

export function markParentAlertsRead(studentNames?: string[]) {
  setState({
    parentAlerts: state.parentAlerts.map((a) =>
      !studentNames || studentNames.includes(a.studentName) ? { ...a, read: true } : a,
    ),
  });
}

/* ------------------------------ hook ------------------------------ */

export function useAppStore(): AppState {
  const [snapshot, setSnapshot] = useState<AppState>(state);
  useEffect(() => {
    hydrate();
    const l = (s: AppState) => setSnapshot(s);
    listeners.push(l);
    setSnapshot(state); // pick up any state hydrated before this effect ran
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);
  return snapshot;
}
