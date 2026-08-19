import { Student, TimetableSlot, Batch } from './types';
import { mockBatches, mockStudentsInBatch, mockTimetable } from './mockData';

/**
 * Per-batch data for the teacher workspace. Each class the teacher teaches has its
 * own distinct roster and CBSE timetable, so selecting a batch scopes the whole
 * teacher experience to genuinely different students, attendance, and exam marks.
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
  email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@mpsdelhi.edu.in`,
  rollNumber: roll,
  admissionNumber: `ADM-2025-${roll.replace(/\D/g, '').slice(-4) || '100' + n}`,
  batchId,
  batchName,
  targetExam,
  attendancePct,
  rankInBatch,
  parentName,
  parentPhone: '+91 98xxx xxxxx',
  qrCodeId: `MPS-${roll}`,
  avatarUrl: avatar(name),
});

// Class 10-B — CBSE Achievers (Aryabhata Section)
const cbse10bRoster: Student[] = [
  mk('batch-cbse-10b', 'Class 10-B — CBSE Achievers (Aryabhata Section)', 'CBSE 10th Board Exam 2026', 1, 'Ishaan Nair', 'CBSE-10B-01', 96.1, 1, 'Mr. Suresh Nair'),
  mk('batch-cbse-10b', 'Class 10-B — CBSE Achievers (Aryabhata Section)', 'CBSE 10th Board Exam 2026', 2, 'Meera Krishnan', 'CBSE-10B-02', 93.4, 2, 'Mrs. Latha Krishnan'),
  mk('batch-cbse-10b', 'Class 10-B — CBSE Achievers (Aryabhata Section)', 'CBSE 10th Board Exam 2026', 3, 'Aditya Menon', 'CBSE-10B-03', 88.7, 5, 'Mr. Prakash Menon'),
  mk('batch-cbse-10b', 'Class 10-B — CBSE Achievers (Aryabhata Section)', 'CBSE 10th Board Exam 2026', 4, 'Sneha Pillai', 'CBSE-10B-04', 91.2, 3, 'Mr. Rajan Pillai'),
  mk('batch-cbse-10b', 'Class 10-B — CBSE Achievers (Aryabhata Section)', 'CBSE 10th Board Exam 2026', 5, 'Rahul Nambiar', 'CBSE-10B-05', 79.5, 12, 'Mr. Gopal Nambiar'),
];

// Class 9-A — CBSE Foundation (Ramanujan Section)
const cbse9aRoster: Student[] = [
  mk('batch-cbse-9a', 'Class 9-A — CBSE Foundation (Ramanujan Section)', 'CBSE Class 9 Annual Exam', 1, 'Vivaan Joshi', 'CBSE-9A-01', 97.3, 1, 'Mr. Nikhil Joshi'),
  mk('batch-cbse-9a', 'Class 9-A — CBSE Foundation (Ramanujan Section)', 'CBSE Class 9 Annual Exam', 2, 'Diya Kulkarni', 'CBSE-9A-02', 94.8, 2, 'Mr. Sameer Kulkarni'),
  mk('batch-cbse-9a', 'Class 9-A — CBSE Foundation (Ramanujan Section)', 'CBSE Class 9 Annual Exam', 3, 'Arjun Patil', 'CBSE-9A-03', 85.6, 8, 'Mr. Mahesh Patil'),
  mk('batch-cbse-9a', 'Class 9-A — CBSE Foundation (Ramanujan Section)', 'CBSE Class 9 Annual Exam', 4, 'Riya Shah', 'CBSE-9A-04', 90.1, 4, 'Mr. Kalpesh Shah'),
  mk('batch-cbse-9a', 'Class 9-A — CBSE Foundation (Ramanujan Section)', 'CBSE Class 9 Annual Exam', 5, 'Kabir Desai', 'CBSE-9A-05', 82.0, 10, 'Mr. Hardik Desai'),
];

// Class 9-B — CBSE Scholars (Bose Section)
const cbse9bRoster: Student[] = [
  mk('batch-cbse-9b', 'Class 9-B — CBSE Scholars (Bose Section)', 'CBSE Class 9 Annual Exam', 1, 'Pranav Agarwal', 'CBSE-9B-01', 95.0, 1, 'Mr. Manoj Agarwal'),
  mk('batch-cbse-9b', 'Class 9-B — CBSE Scholars (Bose Section)', 'CBSE Class 9 Annual Exam', 2, 'Tanvi Saxena', 'CBSE-9B-02', 92.5, 2, 'Mrs. Neha Saxena'),
  mk('batch-cbse-9b', 'Class 9-B — CBSE Scholars (Bose Section)', 'CBSE Class 9 Annual Exam', 3, 'Devansh Singhal', 'CBSE-9B-03', 87.2, 5, 'Mr. Rajesh Singhal'),
];

/** Roster per batch id. */
export const studentsByBatch: Record<string, Student[]> = {
  'batch-cbse-10a': mockStudentsInBatch,
  'batch-cbse-10b': cbse10bRoster,
  'batch-cbse-9a': cbse9aRoster,
  'batch-cbse-9b': cbse9bRoster,
};

/** Batches this teacher teaches. */
export const teacherBatches: Batch[] = mockBatches;

export const studentsForBatch = (batchId: string): Student[] => studentsByBatch[batchId] ?? mockStudentsInBatch;

// ---- Per-batch timetable helper ----
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
  teacherName: 'Prof. Amit Verma (Maths HOD)',
  roomNumber: room,
  batchId,
});

const timetableByBatchMap: Record<string, TimetableSlot[]> = {
  'batch-cbse-10a': mockTimetable,
  'batch-cbse-10b': [
    slot('batch-cbse-10b', 1, '08:00 AM', '08:45 AM', 'Science (Chemistry - Carbon Compounds)', '#0D9488', 'Chemistry Lab'),
    slot('batch-cbse-10b', 2, '08:45 AM', '09:30 AM', 'Mathematics (Triangles & Similarity)', '#2563EB', 'Room 102'),
    slot('batch-cbse-10b', 3, '09:30 AM', '10:15 AM', 'Social Science (Resources & Development)', '#EA580C', 'Room 102'),
    slot('batch-cbse-10b', 4, '10:35 AM', '11:20 AM', 'English (Footprints Without Feet)', '#7C3AED', 'Room 102'),
    slot('batch-cbse-10b', 5, '11:20 AM', '12:05 PM', 'Information Technology (AI Applications)', '#059669', 'IT Lab 1'),
    slot('batch-cbse-10b', 6, '12:05 PM', '12:50 PM', 'Physical Education / Yoga', '#D97706', 'Playground'),
  ],
  'batch-cbse-9a': [
    slot('batch-cbse-9a', 1, '08:00 AM', '08:45 AM', 'Mathematics (Number Systems & Polynomials)', '#2563EB', 'Room 201'),
    slot('batch-cbse-9a', 2, '08:45 AM', '09:30 AM', 'Science (Matter in our Surroundings)', '#0D9488', 'Science Lab 2'),
    slot('batch-cbse-9a', 3, '09:30 AM', '10:15 AM', 'Social Science (The French Revolution)', '#EA580C', 'Room 201'),
    slot('batch-cbse-9a', 4, '10:35 AM', '11:20 AM', 'English (Beehive & Moments)', '#7C3AED', 'Room 201'),
    slot('batch-cbse-9a', 5, '11:20 AM', '12:05 PM', 'Hindi Course A (Kshitij & Kritika)', '#DC2626', 'Room 201'),
  ],
  'batch-cbse-9b': [
    slot('batch-cbse-9b', 1, '08:00 AM', '08:45 AM', 'Science (Force & Laws of Motion)', '#0D9488', 'Physics Lab'),
    slot('batch-cbse-9b', 2, '08:45 AM', '09:30 AM', 'Mathematics (Lines and Angles)', '#2563EB', 'Room 202'),
    slot('batch-cbse-9b', 3, '09:30 AM', '10:15 AM', 'English (Grammar & Reported Speech)', '#7C3AED', 'Room 202'),
    slot('batch-cbse-9b', 4, '10:35 AM', '11:20 AM', 'Computer Applications / Coding', '#059669', 'IT Lab 2'),
  ],
};

export const timetableForBatch = (batchId: string): TimetableSlot[] => timetableByBatchMap[batchId] ?? mockTimetable;
