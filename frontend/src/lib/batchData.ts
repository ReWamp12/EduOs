import { Student, TimetableSlot, Batch } from './types';
import { mockBatches } from './mockData';

/** Roster per batch id (empty). */
export const studentsByBatch: Record<string, Student[]> = {};

/** All students across all classes (empty). */
export const allStudentsInSchool: Student[] = [];

/** Batches this teacher teaches (empty). */
export const teacherBatches: Batch[] = mockBatches;

/** Default active batch (null/empty). */
export const defaultTeacherBatch: Batch = {
  id: '',
  name: 'No Active Batch Assigned',
  code: 'N/A',
  targetExam: 'N/A',
  gradeLevel: 'N/A',
  roomNumber: 'N/A',
  mentorTeacherName: '',
  studentCount: 0,
  capacity: 0,
};

/** Timetable per batch (empty). */
export const timetableByBatch: Record<string, TimetableSlot[]> = {};

/** Look up students for a batch id. */
export function getStudentsForBatch(batchId: string | null | undefined): Student[] {
  if (!batchId) return [];
  return studentsByBatch[batchId] || [];
}

export const studentsForBatch = getStudentsForBatch;

/** Look up timetable for a batch id. */
export function getTimetableForBatch(batchId: string | null | undefined): TimetableSlot[] {
  if (!batchId) return [];
  return timetableByBatch[batchId] || [];
}

export const timetableForBatch = getTimetableForBatch;

/** Look up batch metadata by id. */
export function getBatchById(batchId: string | null | undefined): Batch | undefined {
  if (!batchId) return undefined;
  return teacherBatches.find((b) => b.id === batchId);
}
