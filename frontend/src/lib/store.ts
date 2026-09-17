'use client';

import { useState, useEffect } from 'react';
import { Assignment, AssignmentAttachment, DigitalConsentForm, ConsentResponse, Student, LeaveRequest } from './types';
import { allStudentsInSchool, studentsByBatch, teacherBatches } from './batchData';
import { authClient } from './auth/client';
import { isSupabaseConfigured } from './supabase';

export type { DigitalConsentForm, ConsentResponse, LeaveRequest };

/**
 * EduOS shared client store.
 *
 * Cross-role entities (PTM bookings, assignments, submissions, notices, exams, digital consent forms) need
 * to be visible across stakeholder views — a teacher creating an assignment appears
 * immediately in student homework lists, student submissions land in teacher grading
 * queues, and graded results notify parents.
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
  studentId?: string;
  studentName: string;
  studentRoll?: string;
  studentAvatar?: string;
  maxMarks: number;
  status: 'submitted' | 'graded' | 'late' | 'reviewed' | 'returned' | 'under_review';
  obtainedMarks?: number;
  feedback?: string;
  isLate?: boolean;
  attemptNumber?: number;
  fileName?: string;
  fileSize?: string;
  /**
   * Object path inside the private `submissions` bucket (EDUOS-127). Viewers
   * mint a short-lived signed URL from this on demand; there is no permanent
   * public link. `fileUrl` only carries a blob: URL in the offline demo.
   */
  filePath?: string;
  fileUrl?: string;
  studentNotes?: string;
  submittedAt: number;
  gradedAt?: number;
  gradedBy?: string;
}

export interface AssignmentRecord extends Assignment {
  createdAt: number;
}

/** Unified parent notification feed — attendance + published results. */
export interface ParentAlert {
  id: string;
  type: 'attendance' | 'result' | 'exam' | 'assignment' | 'fee';
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

export interface FeeBreakdownItem {
  head: string;
  amount: number;
}

export interface FeeInvoiceRecord {
  id: string;
  invoiceNumber: string;
  title: string;
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  studentName: string;
  studentRoll?: string;
  batchName?: string;
  paidOn?: string;
  paidAt?: number;
  paymentMethod?: string;
  transactionId?: string;
  receiptNumber?: string;
  breakdown: FeeBreakdownItem[];
}

export interface AttendanceEntry {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: 'present' | 'absent' | 'late' | 'medical';
  remarks?: string;
}

export interface AttendanceSessionRecord {
  id: string;
  batchId: string;
  batchName: string;
  date: string; // "YYYY-MM-DD"
  periodId: string;
  periodName: string;
  markedBy: string;
  markedAt: number;
  records: AttendanceEntry[];
}

export interface AppState {
  ptmBookings: PTMBooking[];
  assignments: AssignmentRecord[];
  submissions: Submission[];
  parentAlerts: ParentAlert[];
  notices: NoticeMessage[];
  exams: ExamRecord[];
  consentForms: DigitalConsentForm[];
  feeInvoices: FeeInvoiceRecord[];
  attendanceSessions: AttendanceSessionRecord[];
  leaveRequests: LeaveRequest[];
}

// Bumped for EDUOS-129: v4 persisted client-generated fee invoices whose ids
// do not exist in Supabase. Loading them alongside the live ledger let a
// parent click "Pay" on a phantom invoice, which the database then rejected.
const STORAGE_KEY = 'eduos-store-v7';

function seed(): AppState {
  const now = Date.now();
  // No demo fallback — an unloaded student list means the demo consent forms
// / attendance / exam alerts start with no target audience, and the store
// backfills responses when the Supabase sync completes and re-seeds.
const students = allStudentsInSchool;

  const defaultConsentForms: DigitalConsentForm[] = [
    {
      id: 'consent-stem-2026',
      title: 'Annual STEM & Robotics Exhibition Excursion',
      description: 'Educational field trip to the National Science Centre & Robotics Expo. Transport and guided tour provided by the school.',
      category: 'Excursion & Field Visit',
      targetType: 'all_school',
      targetBatchIds: [(teacherBatches[0]?.id || '')],
      targetBatchNames: ['Class 10 - A'],
      authorRole: 'principal',
      authorName: 'Dr. Meenakshi Sundaram',
      eventDate: '2026-09-12',
      deadline: '2026-09-08',
      instructions: '1. Standard school uniform with student ID card is mandatory.\n2. Packed lunch and water bottle should be carried.\n3. Return to campus by 04:30 PM.',
      createdAt: now - 86400000 * 2,
      responses: students.map((s) => ({
        studentId: s.id,
        studentName: s.name,
        rollNumber: s.rollNumber,
        batchName: s.batchName,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        parentEmail: s.parentEmail,
        status: 'pending' as const,
      })),
    },
    {
      id: 'consent-sports-2026',
      title: 'Inter-School Zonal Sports Tournament & Travel',
      description: 'Authorization for student participation in the CBSE Inter-School Zonal Athletics Meet.',
      category: 'Sports & Tournaments',
      targetType: 'batch',
      targetBatchIds: [(teacherBatches[0]?.id || '')],
      targetBatchNames: ['Class 10 - A'],
      authorRole: 'teacher',
      authorName: 'Meera Iyer',
      eventDate: '2026-09-20',
      deadline: '2026-09-15',
      instructions: '1. Sports kit provided by the Physical Education department.\n2. School coach and nurse will accompany the contingent.',
      createdAt: now - 86400000,
      responses: students.map((s) => ({
        studentId: s.id,
        studentName: s.name,
        rollNumber: s.rollNumber,
        batchName: s.batchName,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        parentEmail: s.parentEmail,
        status: s.rollNumber === '1' ? ('signed' as const) : ('pending' as const),
        signedAt: s.rollNumber === '1' ? now - 3600000 : undefined,
        signedByName: s.rollNumber === '1' ? s.parentName : undefined,
        parentRelation: 'Father',
      })),
    },
  ];

  const defaultNotices: NoticeMessage[] = [
    {
      id: 'not-01',
      title: 'Term-1 Examination Schedule & Admit Cards',
      content: 'The official datesheet for Term-1 Assessments has been published. Students can view exam timetables and syllabus guidelines on their dashboard.',
      category: 'exam',
      audience: ['student', 'parent', 'teacher'],
      senderRole: 'principal',
      senderName: 'Dr. Meenakshi Sundaram',
      date: todayLabel(),
      createdAt: now - 3600000 * 4,
    },
    {
      id: 'not-02',
      title: 'Parent-Teacher Meeting (PTM) Schedule',
      content: 'Parent-Teacher consultations for Term 1 progress review will be conducted this Saturday from 09:00 AM to 01:00 PM. Book slots via the PTM portal.',
      category: 'general',
      audience: ['parent', 'teacher'],
      senderRole: 'principal',
      senderName: 'Dr. Meenakshi Sundaram',
      date: todayLabel(),
      createdAt: now - 3600000 * 8,
    },
    {
      id: 'not-03',
      title: 'Mathematics Practice DPP & Assignment Published',
      content: 'Class 10-A: Quadratic Equations Practice Sheet 04 is now active. Please submit step-by-step solutions before the due date.',
      category: 'academic',
      audience: ['student', 'parent'],
      senderRole: 'teacher',
      senderName: 'Prof. Amit Verma',
      date: todayLabel(),
      createdAt: now - 3600000 * 12,
    },
  ];

  const defaultExams: ExamRecord[] = [
    {
      id: 'exam-01',
      title: 'All-India CBSE Mock Assessment 01',
      subject: 'Mathematics',
      batchName: 'Class 10 - A',
      examType: 'Mock Test',
      examDate: '15 Sep 2026',
      maxMarks: 100,
      status: 'scheduled',
      createdBy: 'Prof. Amit Verma',
      createdAt: now - 86400000 * 3,
    },
    {
      id: 'exam-02',
      title: 'Physics Term 1 Diagnostic Test',
      subject: 'Physics',
      batchName: 'Class 10 - A',
      examType: 'Unit Test',
      examDate: '24 Aug 2026',
      maxMarks: 50,
      status: 'completed',
      createdBy: 'Dr. Anjali Deshmukh',
      createdAt: now - 86400000 * 7,
      studentName: 'Aarav Sharma',
      marksObtained: 47,
      percentile: 96.5,
      rankInBatch: 1,
    },
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultAttendance: AttendanceSessionRecord[] = [
    {
      id: `att-${(teacherBatches[0]?.id || '')}-${todayStr}-p1`,
      batchId: (teacherBatches[0]?.id || ''),
      batchName: 'Class 10 - A',
      date: todayStr,
      periodId: 'p1',
      periodName: 'Period 1',
      markedBy: 'Meera Iyer',
      markedAt: now - 7200000,
      records: students.map((s, idx) => ({
        studentId: s.id,
        studentName: s.name,
        rollNumber: s.rollNumber,
        status: idx === 4 ? 'absent' : idx === 6 ? 'late' : 'present',
        remarks: idx === 4 ? 'Informed leave' : idx === 6 ? 'Arrived 10 min late' : 'Attended',
      })),
    },
  ];

  const defaultAlerts: ParentAlert[] = [
    {
      id: `alert-init-1`,
      type: 'attendance',
      studentName: 'Aarav Sharma',
      title: 'Marked Present',
      message: 'Aarav Sharma was marked PRESENT in Period 1 (Mathematics) today.',
      tone: 'success',
      date: todayStr,
      source: 'Meera Iyer',
      read: false,
      createdAt: now - 7200000,
    },
    {
      id: `alert-init-2`,
      type: 'result',
      studentName: 'Aarav Sharma',
      title: 'Result published · Physics Term 1 Diagnostic Test',
      message: 'Aarav scored 47/50 (94%) in Physics Term 1 Diagnostic Test.',
      tone: 'success',
      date: todayLabel(),
      source: 'Dr. Anjali Deshmukh',
      read: false,
      createdAt: now - 86400000,
    },
    {
      id: `alert-init-3`,
      type: 'assignment',
      studentName: 'Aarav Sharma',
      title: 'Digital Consent Required',
      message: 'Digital consent form for "Annual STEM & Robotics Exhibition Excursion" requires your e-signature.',
      tone: 'info',
      date: todayLabel(),
      source: 'Dr. Meenakshi Sundaram',
      read: false,
      createdAt: now - 86400000 * 2,
    },
  ];

  return {
    ptmBookings: [],
    assignments: [],
    submissions: [],
    parentAlerts: defaultAlerts,
    notices: defaultNotices,
    exams: defaultExams,
    consentForms: defaultConsentForms,
    feeInvoices: [],
    attendanceSessions: defaultAttendance,
    leaveRequests: [],
  };
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
        const base = seed();
        state = {
          ptmBookings: parsed.ptmBookings && Array.isArray(parsed.ptmBookings) && parsed.ptmBookings.length > 0 ? parsed.ptmBookings : base.ptmBookings,
          assignments: parsed.assignments && Array.isArray(parsed.assignments) && parsed.assignments.length > 0 ? parsed.assignments : base.assignments,
          submissions: parsed.submissions && Array.isArray(parsed.submissions) ? parsed.submissions : base.submissions,
          parentAlerts: parsed.parentAlerts && Array.isArray(parsed.parentAlerts) && parsed.parentAlerts.length > 0 ? parsed.parentAlerts.slice(0, MAX_PARENT_ALERTS) : base.parentAlerts,
          notices: parsed.notices && Array.isArray(parsed.notices) && parsed.notices.length > 0 ? parsed.notices : base.notices,
          exams: parsed.exams && Array.isArray(parsed.exams) && parsed.exams.length > 0 ? parsed.exams : base.exams,
          consentForms: parsed.consentForms && Array.isArray(parsed.consentForms) && parsed.consentForms.length > 0 ? parsed.consentForms : base.consentForms,
          feeInvoices: parsed.feeInvoices && Array.isArray(parsed.feeInvoices) ? parsed.feeInvoices : base.feeInvoices,
          attendanceSessions: parsed.attendanceSessions && Array.isArray(parsed.attendanceSessions) && parsed.attendanceSessions.length > 0 ? parsed.attendanceSessions : base.attendanceSessions,
          leaveRequests: parsed.leaveRequests && Array.isArray(parsed.leaveRequests) ? parsed.leaveRequests : base.leaveRequests,
        };
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

/** Teacher creates and shares a new assignment / DPP to a batch */
export function addAssignment(input: Omit<AssignmentRecord, 'id' | 'createdAt' | 'status'> & { id?: string }): AssignmentRecord {
  const assignment: AssignmentRecord = {
    ...input,
    id: input.id || `asg-${Date.now()}`,
    status: 'pending',
    createdAt: Date.now(),
  };

  // Broadcast a notice to students and parents
  const now = Date.now();
  const notice: NoticeMessage = {
    id: `notice-asg-${now}`,
    title: `New Assignment: ${assignment.title}`,
    content: `${assignment.teacherName || 'Faculty'} has published a new ${assignment.category?.toUpperCase() || 'Assignment'} in ${assignment.subject} for ${assignment.batchName}. Due date: ${assignment.dueDate} (Max Marks: ${assignment.maxMarks}).`,
    category: 'academic',
    audience: ['student', 'parent'],
    senderRole: 'teacher',
    senderName: assignment.teacherName || 'Prof. Amit Verma',
    date: todayLabel(),
    createdAt: now,
  };

  setState({
    assignments: [assignment, ...state.assignments],
    notices: [notice, ...state.notices],
  });

  return assignment;
}

/** Teacher deletes an assignment */
export function deleteAssignment(id: string) {
  setState({
    assignments: state.assignments.filter((a) => a.id !== id),
    submissions: state.submissions.filter((s) => s.assignmentId !== id),
  });
}

/** Teacher sends a reminder to students with pending submissions */
export function sendAssignmentReminder(assignmentId: string): number {
  const assignment = state.assignments.find((a) => a.id === assignmentId);
  if (!assignment) return 0;

  const submittedNames = new Set(
    state.submissions.filter((s) => s.assignmentId === assignmentId).map((s) => s.studentName),
  );

  const now = Date.now();
  const reminderNotice: NoticeMessage = {
    id: `notice-remind-${now}`,
    title: `⚠️ Submission Reminder: ${assignment.title}`,
    content: `Reminder from ${assignment.teacherName || 'Faculty'}: The assignment "${assignment.title}" in ${assignment.subject} is due on ${assignment.dueDate}. Please upload your completed solutions soon.`,
    category: 'urgent',
    audience: ['student'],
    senderRole: 'teacher',
    senderName: assignment.teacherName || 'Prof. Amit Verma',
    date: todayLabel(),
    createdAt: now,
  };

  setState({
    notices: [reminderNotice, ...state.notices],
  });

  return submittedNames.size;
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

const MAX_PARENT_ALERTS = 10;

function pushAlerts(alerts: ParentAlert[]) {
  // FIFO Queue: Keep up to 10 alerts for multi-child households
  const combined = [...alerts, ...state.parentAlerts].slice(0, MAX_PARENT_ALERTS);
  setState({ parentAlerts: combined });
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
    s.id === id ? { ...s, status: 'graded' as const, obtainedMarks, feedback, gradedAt: Date.now() } : s,
  );
  setState({ submissions });
  if (sub) {
    pushAlerts([resultAlert(sub.studentName, sub.title, obtainedMarks, sub.maxMarks, 'Prof. Amit Verma')]);
  }
}

/** Direct grading for any student (submitted or offline notebook check) */
export function gradeStudentAssignment(input: {
  assignmentId: string;
  assignmentTitle: string;
  subject: string;
  batchName: string;
  maxMarks: number;
  studentName: string;
  obtainedMarks: number;
  feedback: string;
  teacherName?: string;
}) {
  const existingSub = state.submissions.find(
    (s) => s.assignmentId === input.assignmentId && s.studentName === input.studentName,
  );

  let updatedSubmissions: Submission[];
  if (existingSub) {
    updatedSubmissions = state.submissions.map((s) =>
      s.id === existingSub.id
        ? {
            ...s,
            status: 'graded' as const,
            obtainedMarks: input.obtainedMarks,
            feedback: input.feedback,
            gradedAt: Date.now(),
            gradedBy: input.teacherName || 'Faculty',
          }
        : s,
    );
  } else {
    const newSub: Submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      assignmentId: input.assignmentId,
      studentName: input.studentName,
      title: input.assignmentTitle,
      subject: input.subject,
      batchName: input.batchName,
      maxMarks: input.maxMarks,
      status: 'graded',
      obtainedMarks: input.obtainedMarks,
      feedback: input.feedback,
      fileName: 'Classroom Notebook Evaluation',
      fileSize: 'Physical Note',
      submittedAt: Date.now(),
      gradedAt: Date.now(),
      gradedBy: input.teacherName || 'Faculty',
    };
    updatedSubmissions = [newSub, ...state.submissions];
  }

  const alert: ParentAlert = resultAlert(
    input.studentName,
    input.assignmentTitle,
    input.obtainedMarks,
    input.maxMarks,
    input.teacherName || 'Faculty',
  );

  setState({ submissions: updatedSubmissions });
  pushAlerts([alert]);
}

/** Send targeted reminder to a specific student and parent */
export function sendStudentReminder(assignmentId: string, studentName: string): boolean {
  const assignment = state.assignments.find((a) => a.id === assignmentId);
  if (!assignment) return false;

  const now = Date.now();
  const reminderNotice: NoticeMessage = {
    id: `notice-remind-${now}-${Math.random().toString(36).substring(2, 6)}`,
    title: `⚠️ Submission Pending: ${assignment.title}`,
    content: `Dear ${studentName}, your assignment "${assignment.title}" in ${assignment.subject} is pending submission. Due date: ${assignment.dueDate}. Please upload or submit your work to ${assignment.teacherName || 'Faculty'}.`,
    category: 'urgent',
    audience: ['student', 'parent'],
    senderRole: 'teacher',
    senderName: assignment.teacherName || 'Prof. Amit Verma',
    date: todayLabel(),
    createdAt: now,
  };

  const parentAlert: ParentAlert = {
    id: `alert-remind-${now}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'assignment',
    studentName,
    title: `Pending Homework Alert`,
    message: `${studentName} has a pending assignment "${assignment.title}" due on ${assignment.dueDate}.`,
    tone: 'warning',
    date: todayLabel(),
    source: assignment.teacherName || 'Faculty',
    read: false,
    createdAt: now,
  };

  setState({
    notices: [reminderNotice, ...state.notices],
  });
  pushAlerts([parentAlert]);

  return true;
}

function attendanceMessage(name: string, status: 'present' | 'absent' | 'late' | 'medical', period: string, batchName: string) {
  const first = name.split(' ')[0];
  if (status === 'absent') return `${first} was marked ABSENT for ${period} in ${batchName} today. Please contact the school if this is unexpected.`;
  if (status === 'late') return `${first} arrived LATE for ${period} in ${batchName} today.`;
  if (status === 'medical') return `${first} was recorded on Medical Leave for ${period} in ${batchName} today.`;
  return `${first} was marked PRESENT for ${period} in ${batchName} today.`;
}

/** Teacher saves attendance session → updates reactive attendanceSessions and dispatches parent alerts. */
export function saveAttendanceSession(session: Omit<AttendanceSessionRecord, 'id' | 'markedAt'>): AttendanceSessionRecord {
  const id = `att-${session.batchId}-${session.date}-${session.periodId}`;
  const now = Date.now();
  const newSession: AttendanceSessionRecord = {
    ...session,
    id,
    markedAt: now,
  };

  // Replace any existing session for same batch+date+period
  const filtered = state.attendanceSessions.filter(
    (s) => !(s.batchId === session.batchId && s.date === session.date && s.periodId === session.periodId),
  );

  const updatedSessions = [newSession, ...filtered];

  // Dispatch real-time alerts for all students (prioritize absent and late alerts, but include present confirmations)
  const alertRecords: ParentAlert[] = session.records.map((r, idx) => {
    const tone: ParentAlert['tone'] = r.status === 'absent' ? 'danger' : r.status === 'late' ? 'warning' : r.status === 'medical' ? 'info' : 'success';
    return {
      id: `alert-att-${now}-${idx}`,
      type: 'attendance' as const,
      studentName: r.studentName,
      title: `Marked ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`,
      message: `${r.studentName} was marked ${r.status.toUpperCase()} in ${session.periodName} (${session.batchName}) on ${session.date}.${r.remarks ? ` Note: ${r.remarks}` : ''}`,
      tone,
      date: session.date,
      source: session.markedBy,
      read: false,
      createdAt: now,
    };
  });

  setState({ attendanceSessions: updatedSessions });
  if (alertRecords.length > 0) {
    pushAlerts(alertRecords);
  }

  return newSession;
}

/** Teacher submits attendance → a parent alert per student. */
export function recordAttendance(input: {
  batchName: string;
  markedBy: string;
  period: string;
  date: string;
  records: { studentName: string; status: 'present' | 'absent' | 'late' | 'medical' }[];
}): ParentAlert[] {
  const now = Date.now();
  const alerts: ParentAlert[] = input.records.map((r, i) => ({
    id: `att-${now}-${i}`,
    type: 'attendance',
    studentName: r.studentName,
    title: `Marked ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`,
    message: attendanceMessage(r.studentName, r.status, input.period, input.batchName),
    tone: r.status === 'absent' ? 'danger' : r.status === 'late' ? 'warning' : r.status === 'medical' ? 'info' : 'success',
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

/** Teacher publishes gradebook marks → updates exams list with results and alerts parents. */
export function recordResults(input: {
  assessmentTitle: string;
  maxMarks: number;
  markedBy: string;
  results: { studentName: string; obtainedMarks: number; percentile?: number; rankInBatch?: number }[];
}): ParentAlert[] {
  const now = Date.now();
  
  // Sort results by obtained marks descending to compute ranks and percentiles
  const sorted = [...input.results].sort((a, b) => b.obtainedMarks - a.obtainedMarks);
  const total = sorted.length || 1;

  // Update existing exam or add completed exam record
  const existingExam = state.exams.find((e) => e.title.toLowerCase() === input.assessmentTitle.toLowerCase());
  let updatedExams = [...state.exams];

  if (existingExam) {
    updatedExams = updatedExams.map((e) => {
      if (e.id === existingExam.id) {
        const topResult = sorted[0];
        return {
          ...e,
          status: 'completed' as const,
          maxMarks: input.maxMarks,
          marksObtained: topResult?.obtainedMarks,
          percentile: 95.0,
          rankInBatch: 1,
        };
      }
      return e;
    });
  } else {
    updatedExams.unshift({
      id: `exam-res-${now}`,
      title: input.assessmentTitle,
      subject: 'Academic Assessment',
      batchName: 'Class 10 - A',
      examType: 'Unit Test',
      examDate: todayLabel(),
      maxMarks: input.maxMarks,
      status: 'completed',
      createdBy: input.markedBy,
      createdAt: now,
      marksObtained: sorted[0]?.obtainedMarks,
      percentile: 95.0,
      rankInBatch: 1,
    });
  }

  // Create Parent Alerts
  const alerts: ParentAlert[] = sorted.map((r, i) => {
    const rank = i + 1;
    const pct = input.maxMarks > 0 ? Math.round((r.obtainedMarks / input.maxMarks) * 100) : 0;
    const percentile = Number((((total - rank + 1) / total) * 100).toFixed(1));
    return {
      id: `res-${now}-${i}`,
      type: 'result',
      studentName: r.studentName,
      title: `Result published · ${input.assessmentTitle}`,
      message: `${r.studentName.split(' ')[0]} scored ${r.obtainedMarks}/${input.maxMarks} (${pct}%, Rank #${rank}) in ${input.assessmentTitle}.`,
      tone: pct >= 75 ? 'success' : pct >= 40 ? 'info' : 'warning',
      date: todayLabel(),
      source: input.markedBy,
      read: false,
      createdAt: now,
    };
  });

  // Also publish a notice to students and parents
  const notice: NoticeMessage = {
    id: `notice-res-${now}`,
    title: `📊 Results Published: ${input.assessmentTitle}`,
    content: `Results for ${input.assessmentTitle} (Max ${input.maxMarks} Marks) have been evaluated by ${input.markedBy} and published to student scorecards.`,
    category: 'exam',
    audience: ['student', 'parent'],
    senderRole: 'teacher',
    senderName: input.markedBy,
    date: todayLabel(),
    createdAt: now,
  };

  setState({
    exams: updatedExams,
    notices: [notice, ...state.notices],
  });
  pushAlerts(alerts);
  return alerts;
}

/** Teacher schedules a new exam → appears in exam history for staff, students & parents. */
export function addExam(input: {
  id?: string;
  title: string;
  subject: string;
  batchName: string;
  examType: string;
  examDate: string;
  maxMarks: number;
  createdBy: string;
}): ExamRecord {
  const { id, ...rest } = input;
  const exam: ExamRecord = {
    ...rest,
    id: id || `exam-${Date.now()}`,
    status: 'scheduled',
    createdAt: Date.now(),
  };

  // Notify parents of students in this batch (parent dashboard alert feed).
  const now = Date.now();
  // No demo fallback — an unloaded student list means the demo consent forms
// / attendance / exam alerts start with no target audience, and the store
// backfills responses when the Supabase sync completes and re-seeds.
const students = allStudentsInSchool;
  const examAlerts: ParentAlert[] = students
    .filter((s) => !exam.batchName || s.batchName === exam.batchName || s.batchName.includes(exam.batchName))
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
  // When marking as read, remove all read alerts from queue so the widget clears
  setState({
    parentAlerts: state.parentAlerts.filter((a) =>
      studentNames ? !studentNames.some((n) => n.toLowerCase() === a.studentName.toLowerCase()) : false,
    ),
  });
}

export function clearSingleParentAlert(alertId: string) {
  setState({
    parentAlerts: state.parentAlerts.filter((a) => a.id !== alertId),
  });
}

/** Create and dispatch a new Digital Consent form to batch or all school */
export function createConsentForm(input: {
  id?: string;
  title: string;
  description: string;
  category: DigitalConsentForm['category'];
  targetType: DigitalConsentForm['targetType'];
  targetBatchIds: string[];
  targetBatchNames: string[];
  authorRole: 'teacher' | 'principal';
  authorName: string;
  eventDate?: string;
  deadline: string;
  instructions?: string;
}): DigitalConsentForm {
  const formId = input.id || `consent-${Date.now()}`;
  const now = Date.now();

  const allStudents = allStudentsInSchool;

  // Find target students
  let targetStudents: Student[] = [];
  if (input.targetType === 'all_school') {
    targetStudents = allStudents;
  } else {
    input.targetBatchIds.forEach((bId) => {
      const bStudents = studentsByBatch[bId] || allStudents.filter((s) => s.batchId === bId || s.batchName.includes(bId));
      if (bStudents && bStudents.length > 0) {
        targetStudents.push(...bStudents);
      }
    });
    if (targetStudents.length === 0) {
      targetStudents = allStudents;
    }
  }

  // Deduplicate target students
  const uniqueStudents = Array.from(new Map(targetStudents.map((s) => [s.id || s.name, s])).values());

  const initialResponses: ConsentResponse[] = uniqueStudents.map((s) => ({
    studentId: s.id,
    studentName: s.name,
    rollNumber: s.rollNumber,
    batchName: s.batchName,
    parentName: s.parentName,
    parentPhone: s.parentPhone,
    parentEmail: s.parentEmail,
    status: 'pending',
  }));

  const form: DigitalConsentForm = {
    id: formId,
    title: input.title,
    description: input.description,
    category: input.category,
    targetType: input.targetType,
    targetBatchIds: input.targetBatchIds,
    targetBatchNames: input.targetBatchNames,
    authorRole: input.authorRole,
    authorName: input.authorName,
    eventDate: input.eventDate,
    deadline: input.deadline,
    instructions: input.instructions,
    createdAt: now,
    responses: initialResponses,
  };

  // Broadcast notice and parent alert
  const notice: NoticeMessage = {
    id: `notice-consent-${now}`,
    title: `📋 Digital Consent Required: ${input.title}`,
    content: `${input.authorName} has issued a digital consent form for "${input.title}". Please review details and sign digitally by ${input.deadline}.`,
    category: 'general',
    audience: ['parent'],
    senderRole: input.authorRole,
    senderName: input.authorName,
    date: todayLabel(),
    createdAt: now,
  };

  // Notify parents of target students
  const alerts: ParentAlert[] = uniqueStudents.map((s, idx) => ({
    id: `alert-consent-${now}-${idx}`,
    type: 'assignment',
    studentName: s.name,
    title: 'Digital Consent Required',
    message: `Digital consent form for "${input.title}" requires your e-signature by ${input.deadline}.`,
    tone: 'info',
    date: todayLabel(),
    source: input.authorName,
    read: false,
    createdAt: now,
  }));

  setState({
    consentForms: [form, ...state.consentForms.filter((f) => f.id !== form.id)],
    notices: [notice, ...state.notices],
  });
  pushAlerts(alerts);

  return form;
}

/** Parent signs a digital consent form with full name & relation */
export function signConsentForm(
  formId: string,
  studentName: string,
  parentFullName: string,
  parentRelation: string = 'Father',
  emergencyPhone?: string,
): boolean {
  const form = state.consentForms.find((f) => f.id === formId);
  if (!form) return false;

  const now = Date.now();
  const trimmedName = parentFullName.trim();
  const stdNameNorm = studentName.toLowerCase().trim();

  const updatedForms = state.consentForms.map((f) => {
    if (f.id !== formId) return f;
    const existing = f.responses.some((r) => r.studentName.toLowerCase().trim() === stdNameNorm);
    let updatedResponses: ConsentResponse[];

    if (existing) {
      updatedResponses = f.responses.map((r) => {
        if (r.studentName.toLowerCase().trim() === stdNameNorm) {
          return {
            ...r,
            status: 'signed' as const,
            signedAt: now,
            signedByName: trimmedName,
            parentName: trimmedName || r.parentName,
            parentRelation,
            parentPhone: emergencyPhone?.trim() || r.parentPhone,
          };
        }
        return r;
      });
    } else {
      updatedResponses = [
        ...f.responses,
        {
          studentId: `std-${stdNameNorm}`,
          studentName,
          rollNumber: '1',
          batchName: 'Class 10 - A',
          parentName: trimmedName,
          status: 'signed',
          signedAt: now,
          signedByName: trimmedName,
          parentRelation,
          parentPhone: emergencyPhone?.trim() || '',
        },
      ];
    }
    return { ...f, responses: updatedResponses };
  });

  setState({ consentForms: updatedForms });
  return true;
}

/** Parent declines a digital consent form */
export function declineConsentForm(formId: string, studentName: string, declineReason?: string): boolean {
  const form = state.consentForms.find((f) => f.id === formId);
  if (!form) return false;

  const stdNameNorm = studentName.toLowerCase().trim();
  const updatedForms = state.consentForms.map((f) => {
    if (f.id !== formId) return f;
    const existing = f.responses.some((r) => r.studentName.toLowerCase().trim() === stdNameNorm);
    let updatedResponses: ConsentResponse[];

    if (existing) {
      updatedResponses = f.responses.map((r) => {
        if (r.studentName.toLowerCase().trim() === stdNameNorm) {
          return {
            ...r,
            status: 'declined' as const,
            declineReason: declineReason || 'Parent opted out.',
          };
        }
        return r;
      });
    } else {
      updatedResponses = [
        ...f.responses,
        {
          studentId: `std-${stdNameNorm}`,
          studentName,
          rollNumber: '1',
          batchName: 'Class 10 - A',
          parentName: 'Parent',
          parentPhone: '+91 98765 43210',
          status: 'declined',
          declineReason: declineReason || 'Parent opted out.',
        },
      ];
    }
    return { ...f, responses: updatedResponses };
  });

  setState({ consentForms: updatedForms });
  return true;
}

/** Send reminder to pending parents for a consent form */
export function sendConsentReminder(formId: string, targetStudentName?: string): number {
  const form = state.consentForms.find((f) => f.id === formId);
  if (!form) return 0;

  const now = Date.now();
  const pendingResponses = form.responses.filter(
    (r) => r.status === 'pending' && (!targetStudentName || r.studentName === targetStudentName),
  );

  if (pendingResponses.length === 0) return 0;

  const reminderNotice: NoticeMessage = {
    id: `notice-consent-remind-${now}`,
    title: `⏰ Urgent Reminder: E-Consent Pending for ${form.title}`,
    content: `Gentle reminder to review and digitally sign the e-consent form for "${form.title}" before the deadline ${form.deadline}.`,
    category: 'urgent',
    audience: ['parent'],
    senderRole: form.authorRole,
    senderName: form.authorName,
    date: todayLabel(),
    createdAt: now,
  };

  const parentAlerts: ParentAlert[] = pendingResponses.slice(0, 2).map((r, i) => ({
    id: `alert-remind-consent-${now}-${i}`,
    type: 'assignment',
    studentName: r.studentName,
    title: 'Action Required: E-Consent Pending',
    message: `Please sign consent for "${form.title}" due by ${form.deadline}.`,
    tone: 'warning',
    date: todayLabel(),
    source: form.authorName,
    read: false,
    createdAt: now,
  }));

  setState({
    notices: [reminderNotice, ...state.notices],
  });
  pushAlerts(parentAlerts);

  return pendingResponses.length;
}

/** Delete a consent form */
export function deleteConsentForm(formId: string) {
  setState({
    consentForms: state.consentForms.filter((f) => f.id !== formId),
  });
}

/** Pay a fee invoice with receipt & alert dispatch */
export function payFeeInvoice(invoiceId: string, method: string): FeeInvoiceRecord | null {
  const inv = state.feeInvoices.find((i) => i.id === invoiceId);
  if (!inv) return null;

  const now = Date.now();
  const dateStr = new Date(now).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date(now).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const txnId = `TXN-${method.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const receiptNum = `MPS-REC-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  const updatedInvoices = state.feeInvoices.map((i) => {
    if (i.id === invoiceId) {
      return {
        ...i,
        status: 'paid' as const,
        paidOn: `${dateStr}, ${timeStr}`,
        paidAt: now,
        paymentMethod: method,
        transactionId: txnId,
        receiptNumber: receiptNum,
      };
    }
    return i;
  });

  const alert: ParentAlert = {
    id: `alert-fee-${now}`,
    type: 'result',
    studentName: inv.studentName,
    title: 'Fee Payment Received',
    message: `Payment of ₹${inv.amount.toLocaleString('en-IN')} for "${inv.title}" verified via ${method}. Receipt #${receiptNum} generated.`,
    tone: 'success',
    date: todayLabel(),
    source: 'Accounts & Fee Office',
    read: false,
    createdAt: now,
  };

  setState({ feeInvoices: updatedInvoices });
  pushAlerts([alert]);

  return updatedInvoices.find((i) => i.id === invoiceId) || null;
}

// Fee data is owned entirely by Supabase (EDUOS-125/129): fee_invoices is the
// ledger of record, collect_fee_payment() settles atomically, and
// issue_term_invoices() opens new installments. No fixtures are generated
// client-side — a locally-invented invoice id could never be settled by the
// database and would silently fail at payment time.

/**
 * Finance office nudges a guardian about an unpaid balance — lands in the
 * Parent portal's notification feed.
 */
export function sendFeeReminder(input: {
  studentName: string;
  dueAmount: number;
  dueDate?: string;
  overdue?: boolean;
}): void {
  const now = Date.now();
  pushAlerts([
    {
      id: `alert-fee-reminder-${now}`,
      type: 'fee',
      studentName: input.studentName,
      title: input.overdue ? 'Fee Payment Overdue' : 'Fee Payment Reminder',
      message: `A balance of ₹${input.dueAmount.toLocaleString('en-IN')} is ${
        input.overdue ? 'overdue' : 'outstanding'
      } for ${input.studentName}${input.dueDate ? ` (due ${input.dueDate})` : ''}. Kindly pay via the Fees section or the school counter to avoid late charges.`,
      tone: input.overdue ? 'danger' : 'warning',
      date: todayLabel(),
      source: 'Accounts & Fee Office',
      read: false,
      createdAt: now,
    },
  ]);
}

/** Teacher applies for leave → lands in Principal's approval queue */
export function applyForLeave(input: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt'>): LeaveRequest {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const newLeave: LeaveRequest = {
    ...input,
    id: `leave-${Date.now()}`,
    status: 'pending',
    appliedAt: `${dateStr} ${timeStr}`,
  };

  const updatedLeaves = [newLeave, ...state.leaveRequests];

  // Also post an institutional notice for administration
  const notice: NoticeMessage = {
    id: `notice-leave-${Date.now()}`,
    title: `Staff Leave Application: ${input.employeeName}`,
    content: `${input.employeeName} (${input.designation}) has applied for ${input.leaveType} from ${input.startDate} to ${input.endDate}. Reason: ${input.reason}`,
    category: 'urgent',
    audience: ['teacher'],
    senderRole: 'teacher',
    senderName: input.employeeName,
    date: todayLabel(),
    createdAt: Date.now(),
  };

  setState({
    leaveRequests: updatedLeaves,
    notices: [notice, ...state.notices],
  });

  return newLeave;
}

/** Principal approves or rejects a staff leave request */
export function updateLeaveStatus(
  leaveId: string,
  status: 'approved' | 'rejected',
  comment?: string,
  reviewedBy: string = 'Dr. Rameshwar Nath (Principal)',
): boolean {
  const target = state.leaveRequests.find((l) => l.id === leaveId);
  if (!target) return false;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const updatedLeaves = state.leaveRequests.map((l) => {
    if (l.id === leaveId) {
      return {
        ...l,
        status,
        reviewedBy,
        reviewedAt: dateStr,
        reviewComment: comment?.trim() || (status === 'approved' ? 'Leave authorized by Principal.' : 'Declined as per academic scheduling.'),
      };
    }
    return l;
  });

  setState({ leaveRequests: updatedLeaves });
  return true;
}

/* ------------------------------ Supabase live sync ------------------------------ */

export async function syncStoreWithSupabase() {
  if (!isSupabaseConfigured()) return;

  try {
    const [noticesRes, asgRes, examsRes, leavesRes] = await Promise.all([
      authClient
        .from('notices')
        .select(`
          id, tenant_id, title, content, category, target_role, priority, created_at,
          user_profiles:created_by (first_name, last_name, role)
        `)
        .order('created_at', { ascending: false }),
      authClient
        .from('assignments')
        .select(`
          id, tenant_id, batch_id, subject_id, teacher_id, title, description, due_date, max_marks, created_at,
          subjects:subject_id (name),
          batches:batch_id (name),
          user_profiles:teacher_id (first_name, last_name)
        `)
        .order('created_at', { ascending: false }),
      authClient
        .from('exams')
        .select(`
          id, tenant_id, batch_id, title, exam_type, total_marks, duration_minutes, exam_date,
          batches:batch_id (name)
        `)
        .order('exam_date', { ascending: false }),
      authClient
        .from('leave_requests')
        .select(`
          id, tenant_id, employee_id, leave_type, start_date, end_date, reason, status, created_at,
          user_profiles:employee_id (id, first_name, last_name, email, role)
        `)
        .order('created_at', { ascending: false }),
    ]);

    const updates: Partial<AppState> = {};

    if (noticesRes.data && noticesRes.data.length > 0) {
      updates.notices = noticesRes.data.map((n: any) => {
        const creator = n.user_profiles;
        const senderName = creator ? `${creator.first_name} ${creator.last_name}`.trim() : 'Principal';
        const aud: NoticeAudience[] = n.target_role === 'all'
          ? ['student', 'parent', 'teacher']
          : [n.target_role as NoticeAudience];
        return {
          id: n.id,
          title: n.title,
          content: n.content,
          category: (n.category as any) || 'general',
          audience: aud,
          senderRole: (creator?.role as any) || 'principal',
          senderName,
          date: new Date(n.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          createdAt: new Date(n.created_at).getTime(),
        };
      });
    }

    if (asgRes.data && asgRes.data.length > 0) {
      updates.assignments = asgRes.data.map((a: any) => {
        const t = a.user_profiles;
        const teacherName = t ? `${t.first_name} ${t.last_name}`.trim() : 'Meera Iyer';
        return {
          id: a.id,
          title: a.title,
          subject: a.subjects?.name || 'English Literature',
          batchName: a.batches?.name || 'Class 10 - A',
          dueDate: new Date(a.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          maxMarks: a.max_marks || 50,
          description: a.description || '',
          category: 'homework',
          status: 'pending',
          teacherName,
          createdAt: new Date(a.created_at).getTime(),
        };
      });
    }

    if (examsRes.data && examsRes.data.length > 0) {
      updates.exams = examsRes.data.map((e: any) => ({
        id: e.id,
        title: e.title,
        subject: e.title.includes('Math') ? 'Mathematics' : e.title.includes('Science') ? 'Science' : 'CBSE',
        batchName: e.batches?.name || 'Class 10 - A',
        examType: e.exam_type || 'mid_term',
        examDate: new Date(e.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        maxMarks: e.total_marks || 80,
        status: 'scheduled',
        createdBy: 'Examination Controller',
        createdAt: Date.now(),
      }));
    }

    if (leavesRes.data && leavesRes.data.length > 0) {
      updates.leaveRequests = leavesRes.data.map((l: any) => {
        const emp = l.user_profiles;
        const empName = emp ? `${emp.first_name} ${emp.last_name}`.trim() : 'Faculty Member';
        return {
          id: l.id,
          employeeId: l.employee_id,
          employeeName: empName,
          designation: 'Senior Faculty',
          leaveType: l.leave_type || 'Casual Leave',
          startDate: l.start_date,
          endDate: l.end_date,
          daysCount: 1,
          reason: l.reason || '',
          status: l.status || 'pending',
          appliedAt: new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          balanceRemaining: 12,
        };
      });
    }

    if (Object.keys(updates).length > 0) {
      setState(updates);
    }
  } catch (err) {
    console.warn('Failed to sync store with Supabase:', err);
  }
}

/* ------------------------------ hook ------------------------------ */

export function useAppStore(): AppState {
  const [snapshot, setSnapshot] = useState<AppState>(state);
  useEffect(() => {
    hydrate();
    void syncStoreWithSupabase();
    const l = (s: AppState) => setSnapshot(s);
    listeners.push(l);
    setSnapshot(state); // pick up any state hydrated before this effect ran
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);
  return snapshot;
}
