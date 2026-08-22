'use client';

import { useEffect, useState } from 'react';
import { mockAssignments, mockNotices, mockExamResults, mockStudentsInBatch, mockLeaveRequests } from './mockData';
import { Assignment, AssignmentAttachment, DigitalConsentForm, ConsentResponse, Student, LeaveRequest } from './types';
import { allStudentsInSchool, studentsByBatch } from './batchData';

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
  status: 'submitted' | 'graded';
  obtainedMarks?: number;
  feedback?: string;
  fileName?: string;
  fileSize?: string;
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
  type: 'attendance' | 'result' | 'exam' | 'assignment';
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

const STORAGE_KEY = 'eduos-store-v2';

function seedFeeInvoices(): FeeInvoiceRecord[] {
  return [
    {
      id: 'inv-101',
      invoiceNumber: 'INV-2026-TERM2-1004',
      title: 'Term 2 Composite Tuition & CBSE Board Exam Fee',
      dueDate: '15 Sep 2026',
      amount: 26000,
      status: 'pending',
      studentName: 'Aarav Sharma',
      studentRoll: 'CBSE-10A-04',
      batchName: 'Class 10-A (CBSE Kalam Section)',
      breakdown: [
        { head: 'Tuition Fee (Term 2 - Class 10)', amount: 18000 },
        { head: 'CBSE Board Examination & Registration Fee', amount: 3200 },
        { head: 'Composite Science & Computer Lab Fee', amount: 4800 },
      ],
    },
    {
      id: 'inv-100',
      invoiceNumber: 'INV-2026-TERM1-1004',
      title: 'Term 1 Tuition & Annual Development Charge',
      dueDate: '10 Apr 2026',
      amount: 52000,
      status: 'paid',
      paidOn: '05 Apr 2026, 11:30 AM',
      paidAt: Date.now() - 110 * 86_400_000,
      paymentMethod: 'UPI (Google Pay)',
      transactionId: 'TXN-UPI-9921402847',
      receiptNumber: 'MPS-REC-2026-44102',
      studentName: 'Aarav Sharma',
      studentRoll: 'CBSE-10A-04',
      batchName: 'Class 10-A (CBSE Kalam Section)',
      breakdown: [
        { head: 'Tuition Fee (Term 1 - Class 10)', amount: 18000 },
        { head: 'Annual Development & Smart Class Charge', amount: 34000 },
      ],
    },
    {
      id: 'inv-099',
      invoiceNumber: 'INV-2025-ANNUAL-0881',
      title: 'Academic Session 2025-26 Annual Composite Clearance',
      dueDate: '10 Mar 2025',
      amount: 72000,
      status: 'paid',
      paidOn: '08 Mar 2025, 04:15 PM',
      paidAt: Date.now() - 365 * 86_400_000,
      paymentMethod: 'Net Banking (HDFC Bank)',
      transactionId: 'TXN-NB-7782103991',
      receiptNumber: 'MPS-REC-2025-88190',
      studentName: 'Aarav Sharma',
      studentRoll: 'CBSE-9A-04',
      batchName: 'Class 9-A',
      breakdown: [
        { head: 'Tuition Fee (Full Year Class 9)', amount: 48000 },
        { head: 'Science Lab & Library Resource Pack', amount: 24000 },
      ],
    },
    {
      id: 'inv-201',
      invoiceNumber: 'INV-2026-ANANYA-T2',
      title: 'Term 2 Foundation Tuition & Activity Fee',
      dueDate: '20 Sep 2026',
      amount: 22000,
      status: 'pending',
      studentName: 'Ananya Sharma',
      studentRoll: 'CBSE-9A-02',
      batchName: 'Class 9-A (CBSE Ramanujan Section)',
      breakdown: [
        { head: 'Tuition Fee (Term 2 - Class 9)', amount: 16000 },
        { head: 'Activity, Sports & Robotics Lab Fee', amount: 6000 },
      ],
    },
    {
      id: 'inv-200',
      invoiceNumber: 'INV-2026-ANANYA-T1',
      title: 'Term 1 Foundation Tuition & Smart Class Charge',
      dueDate: '15 Apr 2026',
      amount: 46000,
      status: 'paid',
      paidOn: '12 Apr 2026, 02:40 PM',
      paidAt: Date.now() - 100 * 86_400_000,
      paymentMethod: 'Credit Card (Visa)',
      transactionId: 'TXN-CARD-4481902231',
      receiptNumber: 'MPS-REC-2026-31902',
      studentName: 'Ananya Sharma',
      studentRoll: 'CBSE-9A-02',
      batchName: 'Class 9-A (CBSE Ramanujan Section)',
      breakdown: [
        { head: 'Tuition Fee (Term 1 - Class 9)', amount: 16000 },
        { head: 'Annual Development & Smart Class Charge', amount: 30000 },
      ],
    },
  ];
}

function seedConsentForms(): DigitalConsentForm[] {
  const std10a = mockStudentsInBatch;
  const allStudents = allStudentsInSchool;

  const responses1: ConsentResponse[] = std10a.map((s, idx) => ({
    studentId: s.id,
    studentName: s.name,
    rollNumber: s.rollNumber,
    batchName: s.batchName,
    parentName: s.parentName,
    parentPhone: s.parentPhone,
    parentEmail: s.parentEmail,
    status: s.name === 'Aarav Sharma' || idx % 2 === 0 ? 'signed' : 'pending',
    signedAt: s.name === 'Aarav Sharma' || idx % 2 === 0 ? Date.now() - 86_400_000 : undefined,
  }));

  const responses2: ConsentResponse[] = std10a.map((s, idx) => ({
    studentId: s.id,
    studentName: s.name,
    rollNumber: s.rollNumber,
    batchName: s.batchName,
    parentName: s.parentName,
    parentPhone: s.parentPhone,
    parentEmail: s.parentEmail,
    status: s.name === 'Aarav Sharma' ? 'pending' : idx === 1 ? 'signed' : 'pending',
    signedAt: idx === 1 ? Date.now() - 43_200_000 : undefined,
  }));

  const responses3: ConsentResponse[] = allStudents.map((s, idx) => ({
    studentId: s.id,
    studentName: s.name,
    rollNumber: s.rollNumber,
    batchName: s.batchName,
    parentName: s.parentName,
    parentPhone: s.parentPhone,
    parentEmail: s.parentEmail,
    status: idx % 3 === 0 ? 'signed' : 'pending',
    signedAt: idx % 3 === 0 ? Date.now() - 172_800_000 : undefined,
  }));

  return [
    {
      id: 'consent-1',
      title: 'Consent for CBSE Science Exhibition Field Visit to National Science Centre',
      description: 'Educational field visit for Class 10 science students. Includes guided workshop on Optics & Robotics at National Science Centre, Pragati Maidan.',
      category: 'Excursion & Field Visit',
      targetType: 'batch',
      targetBatchIds: ['batch-cbse-10a'],
      targetBatchNames: ['Class 10-A — CBSE Board Champions (Kalam Section)'],
      authorRole: 'teacher',
      authorName: 'Mrs. Sunita Rao (Science HOD)',
      eventDate: '2026-08-28',
      deadline: '2026-08-27',
      createdAt: Date.now() - 2 * 86_400_000,
      instructions: '1. Students must wear full school uniform with ID cards.\n2. Packed lunch and water bottle will be provided.\n3. AC Bus leaves campus at 08:30 AM sharp.',
      responses: responses1,
    },
    {
      id: 'consent-2',
      title: 'Consent for After-School Pre-Board Remedial & Doubts Classes (3:00 PM to 4:30 PM)',
      description: 'Targeted revision sessions for Mathematics & Science board preparation focusing on Section D proving questions and high-weightage topics.',
      category: 'Academic Remedial',
      targetType: 'batch',
      targetBatchIds: ['batch-cbse-10a'],
      targetBatchNames: ['Class 10-A — CBSE Board Champions (Kalam Section)'],
      authorRole: 'teacher',
      authorName: 'Prof. Amit Verma (Maths HOD)',
      eventDate: '2026-09-01',
      deadline: '2026-08-30',
      createdAt: Date.now() - 1 * 86_400_000,
      instructions: '1. Special evening bus transport provided on designated routes.\n2. Light snacks will be provided prior to class.',
      responses: responses2,
    },
    {
      id: 'consent-3',
      title: 'Annual Comprehensive Health, Vision & Dental Checkup Camp 2026',
      description: 'Mandatory annual medical screening conducted by Fortis Healthcare pediatric team in accordance with CBSE Health & Wellness manual.',
      category: 'Medical & Health Camp',
      targetType: 'all_school',
      targetBatchIds: ['batch-cbse-10a', 'batch-cbse-10b', 'batch-cbse-9a', 'batch-cbse-9b'],
      targetBatchNames: ['All School Sections (Class 9 & 10)'],
      authorRole: 'principal',
      authorName: 'Dr. Rameshwar Nath (Principal)',
      eventDate: '2026-09-08',
      deadline: '2026-09-05',
      createdAt: Date.now() - 3 * 86_400_000,
      instructions: '1. Digital health card and ophthalmology report will be uploaded to parent portal.\n2. Please mention any ongoing medications or spectacle prescriptions in consent remarks.',
      responses: responses3,
    },
  ];
}

// Deterministic seed — identical on server and first client render (no hydration
// mismatch). Seeds the two already-submitted/graded assignments so the teacher's
// queue isn't empty and the student's statuses stay consistent.
function seed(): AppState {
  const assignments: AssignmentRecord[] = mockAssignments.map((a, i) => ({
    ...a,
    createdAt: a.createdAt || (Date.now() - (i + 1) * 86_400_000),
  }));

  const submissions: Submission[] = mockAssignments
    .filter((a) => a.status !== 'pending')
    .map((a) => ({
      id: `sub-seed-${a.id}`,
      assignmentId: a.id,
      title: a.title,
      subject: a.subject,
      batchName: a.batchName,
      studentId: 'std-aarav-01',
      studentName: 'Aarav Sharma',
      studentRoll: 'CBSE-10A-04',
      studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      maxMarks: a.maxMarks,
      status: a.status === 'graded' ? 'graded' : 'submitted',
      obtainedMarks: a.obtainedMarks,
      feedback: a.feedback,
      fileName: `aarav_sharma_${a.subject.toLowerCase().replace(/[^a-z0-9]/g, '_')}_submission.pdf`,
      fileSize: '1.8 MB',
      fileUrl: `https://storage.eduos.app/submissions/std-1-${a.id}.pdf`,
      studentNotes: 'Completed all prescribed questions step-by-step.',
      submittedAt: Date.now() - 86_400_000,
      gradedAt: a.status === 'graded' ? Date.now() - 43_200_000 : undefined,
      gradedBy: a.status === 'graded' ? 'Prof. Amit Verma' : undefined,
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
    batchName: 'Class 10-A — CBSE Board Champions (Kalam Section)',
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

  return {
    ptmBookings: [],
    assignments,
    submissions,
    parentAlerts: [],
    notices,
    exams,
    consentForms: seedConsentForms(),
    feeInvoices: seedFeeInvoices(),
    attendanceSessions: [],
    leaveRequests: mockLeaveRequests,
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
        if (parsed.parentAlerts && Array.isArray(parsed.parentAlerts)) {
          parsed.parentAlerts = parsed.parentAlerts.slice(0, MAX_PARENT_ALERTS);
        }
        if (!parsed.consentForms || !Array.isArray(parsed.consentForms) || parsed.consentForms.length === 0) {
          parsed.consentForms = seedConsentForms();
        }
        if (!parsed.feeInvoices || !Array.isArray(parsed.feeInvoices) || parsed.feeInvoices.length === 0) {
          parsed.feeInvoices = seedFeeInvoices();
        }
        if (!parsed.attendanceSessions || !Array.isArray(parsed.attendanceSessions)) {
          parsed.attendanceSessions = [];
        }
        if (!parsed.leaveRequests || !Array.isArray(parsed.leaveRequests) || parsed.leaveRequests.length === 0) {
          parsed.leaveRequests = mockLeaveRequests;
        }
        // Merge over seed defaults so older persisted shapes stay valid.
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

const MAX_PARENT_ALERTS = 3;

function pushAlerts(alerts: ParentAlert[]) {
  // FIFO Queue: Keep maximum 3 alerts. If size exceeds 3, earliest/oldest is dropped.
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

function attendanceMessage(name: string, status: 'present' | 'absent' | 'late', period: string, batchName: string) {
  const first = name.split(' ')[0];
  if (status === 'absent') return `${first} was marked ABSENT for ${period} in ${batchName} today. Please contact the school if this is unexpected.`;
  if (status === 'late') return `${first} arrived LATE for ${period} in ${batchName} today.`;
  return `${first} was marked present for ${period} in ${batchName} today.`;
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

  // Dispatch real-time alerts for absent and late students
  const alertRecords: ParentAlert[] = session.records
    .filter((r) => r.status === 'absent' || r.status === 'late')
    .map((r, idx) => ({
      id: `alert-att-${now}-${idx}`,
      type: 'attendance' as const,
      studentName: r.studentName,
      title: `Marked ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`,
      message: `${r.studentName} was marked ${r.status.toUpperCase()} in ${session.periodName} (${session.batchName}) on ${session.date}.${r.remarks ? ` Note: ${r.remarks}` : ''}`,
      tone: r.status === 'absent' ? ('danger' as const) : ('warning' as const),
      date: session.date,
      source: session.markedBy,
      read: false,
      createdAt: now,
    }));

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
  // When marking as read, remove all read alerts from queue so the widget clears
  setState({
    parentAlerts: state.parentAlerts.filter((a) =>
      studentNames ? !studentNames.includes(a.studentName) : false
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
  const formId = `consent-${Date.now()}`;
  const now = Date.now();

  // Find target students
  let targetStudents: Student[] = [];
  if (input.targetType === 'all_school') {
    targetStudents = allStudentsInSchool;
  } else {
    input.targetBatchIds.forEach((bId) => {
      const bStudents = studentsByBatch[bId] || (bId === 'batch-cbse-10a' ? mockStudentsInBatch : []);
      targetStudents.push(...bStudents);
    });
  }

  // Deduplicate target students
  const uniqueStudents = Array.from(new Map(targetStudents.map((s) => [s.id, s])).values());

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

  // Notify parent of first student (or all target students)
  const alerts: ParentAlert[] = uniqueStudents.slice(0, 3).map((s, idx) => ({
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
    consentForms: [form, ...state.consentForms],
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
  const updatedForms = state.consentForms.map((f) => {
    if (f.id !== formId) return f;
    const updatedResponses = f.responses.map((r) => {
      if (r.studentName.toLowerCase().trim() === studentName.toLowerCase().trim()) {
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
    return { ...f, responses: updatedResponses };
  });

  setState({ consentForms: updatedForms });
  return true;
}

/** Parent declines a digital consent form */
export function declineConsentForm(formId: string, studentName: string, declineReason?: string): boolean {
  const form = state.consentForms.find((f) => f.id === formId);
  if (!form) return false;

  const updatedForms = state.consentForms.map((f) => {
    if (f.id !== formId) return f;
    const updatedResponses = f.responses.map((r) => {
      if (r.studentName.toLowerCase().trim() === studentName.toLowerCase().trim()) {
        return {
          ...r,
          status: 'declined' as const,
          declineReason: declineReason || 'Parent opted out.',
        };
      }
      return r;
    });
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
