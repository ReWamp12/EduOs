import { Student, TimetableSlot, Batch } from './types';
import { mockBatches, mockStudentsInBatch, mockTimetable } from './mockData';

/**
 * Per-batch data for the teacher workspace. Each class the teacher teaches has its
 * own distinct roster (and timetable), so selecting a batch scopes the whole
 * teacher experience to genuinely different students, attendance and results.
 */

const avatar = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

const mk = (
  batchId: string,
  batchName: string,
  targetExam: string,
  n: number,
  name: string,
  roll: string,
  attendancePct: number,
  rankInBatch: number,
  parentName: string,
): Student => ({
  id: `${batchId}-s${n}`,
  userId: `${batchId}-u${n}`,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@apexacademy.in`,
  rollNumber: roll,
  admissionNumber: `ADM-${roll.replace(/\D/g, '').slice(-4)}`,
  batchId,
  batchName,
  targetExam,
  attendancePct,
  rankInBatch,
  parentName,
  parentPhone: '+91 98xxx xxxxx',
  qrCodeId: `APX-QR-${roll}`,
  avatarUrl: avatar(name),
});

// Class 12 — NEET Medical Champions
const neetRoster: Student[] = [
  mk('batch-neet-12b', 'Class 12 - NEET Medical Champions', 'NEET UG 2026', 1, 'Ishaan Nair', 'APX-12B-201', 96.1, 1, 'Suresh Nair'),
  mk('batch-neet-12b', 'Class 12 - NEET Medical Champions', 'NEET UG 2026', 2, 'Meera Krishnan', 'APX-12B-202', 93.4, 2, 'Latha Krishnan'),
  mk('batch-neet-12b', 'Class 12 - NEET Medical Champions', 'NEET UG 2026', 3, 'Aditya Menon', 'APX-12B-203', 88.7, 5, 'Prakash Menon'),
  mk('batch-neet-12b', 'Class 12 - NEET Medical Champions', 'NEET UG 2026', 4, 'Sneha Pillai', 'APX-12B-204', 91.2, 3, 'Rajan Pillai'),
  mk('batch-neet-12b', 'Class 12 - NEET Medical Champions', 'NEET UG 2026', 5, 'Rahul Nambiar', 'APX-12B-205', 79.5, 12, 'Gopal Nambiar'),
];

// Class 10 — Olympiad & Foundation
const foundationRoster: Student[] = [
  mk('batch-found-10', 'Class 10 - Olympiad & Foundation', 'NTSE / Olympiads', 1, 'Vivaan Joshi', 'APX-10F-101', 97.3, 1, 'Nikhil Joshi'),
  mk('batch-found-10', 'Class 10 - Olympiad & Foundation', 'NTSE / Olympiads', 2, 'Diya Kulkarni', 'APX-10F-102', 94.8, 2, 'Sameer Kulkarni'),
  mk('batch-found-10', 'Class 10 - Olympiad & Foundation', 'NTSE / Olympiads', 3, 'Arjun Patil', 'APX-10F-103', 85.6, 8, 'Mahesh Patil'),
  mk('batch-found-10', 'Class 10 - Olympiad & Foundation', 'NTSE / Olympiads', 4, 'Riya Shah', 'APX-10F-104', 90.1, 4, 'Kalpesh Shah'),
  mk('batch-found-10', 'Class 10 - Olympiad & Foundation', 'NTSE / Olympiads', 5, 'Kabir Desai', 'APX-10F-105', 82.0, 10, 'Hardik Desai'),
];

/** Roster per batch id. JEE-11A reuses the primary demo roster (so student/parent personas align). */
export const studentsByBatch: Record<string, Student[]> = {
  'batch-jee-11a': mockStudentsInBatch,
  'batch-neet-12b': neetRoster,
  'batch-found-10': foundationRoster,
};

/** Batches this teacher (Prof. Amit Verma) teaches. */
export const teacherBatches: Batch[] = mockBatches;

export const studentsForBatch = (batchId: string): Student[] => studentsByBatch[batchId] ?? [];

// ---- Per-batch timetable ----
const slot = (
  batchId: string,
  period: number,
  start: string,
  end: string,
  subject: string,
  color: string,
  room: string,
): TimetableSlot => ({
  id: `${batchId}-tt-${period}`,
  dayOfWeek: 1,
  periodNumber: period,
  startTime: start,
  endTime: end,
  subjectName: subject,
  subjectColor: color,
  teacherName: 'Prof. Amit Verma',
  roomNumber: room,
  batchId,
});

const timetableByBatchMap: Record<string, TimetableSlot[]> = {
  'batch-jee-11a': mockTimetable,
  'batch-neet-12b': [
    slot('batch-neet-12b', 1, '08:30 AM', '10:00 AM', 'Physics (Modern Physics)', '#4F46E5', 'Hall 204'),
    slot('batch-neet-12b', 2, '10:15 AM', '11:45 AM', 'Biology (Human Physiology)', '#10B981', 'Hall 204'),
    slot('batch-neet-12b', 3, '12:30 PM', '02:00 PM', 'Organic Chemistry (NEET)', '#06B6D4', 'Lab 3'),
  ],
  'batch-found-10': [
    slot('batch-found-10', 1, '09:00 AM', '10:15 AM', 'Science (Foundation Physics)', '#4F46E5', 'Room 302'),
    slot('batch-found-10', 2, '10:30 AM', '11:45 AM', 'Mathematics (Olympiad)', '#F59E0B', 'Room 302'),
    slot('batch-found-10', 3, '12:15 PM', '01:30 PM', 'Mental Ability & Reasoning', '#8B5CF6', 'Room 305'),
  ],
};

export const timetableForBatch = (batchId: string): TimetableSlot[] => timetableByBatchMap[batchId] ?? [];
