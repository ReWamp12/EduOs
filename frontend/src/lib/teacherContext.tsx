'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { Batch, Student, TimetableSlot } from './types';
import { teacherBatches, studentsForBatch, timetableForBatch, defaultTeacherBatch } from './batchData';
import { mockProfiles } from './mockData';

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  designation: string;
  subjects: string[];
}

export interface TeacherBatchValue {
  batchId: string;
  batch: Batch;
  students: Student[];
  batches: Batch[];
  teacher: TeacherProfile;
  subjects: string[];
  setBatchId: (id: string) => void;
}

const TeacherBatchContext = createContext<TeacherBatchValue | null>(null);

export const useTeacherBatch = (): TeacherBatchValue => {
  const ctx = useContext(TeacherBatchContext);
  if (!ctx) throw new Error('useTeacherBatch must be used within a TeacherBatchProvider');
  return ctx;
};

export const TeacherBatchProvider: React.FC<{
  batchId: string;
  setBatchId: (id: string) => void;
  children: React.ReactNode;
}> = ({ batchId, setBatchId, children }) => {
  const batches = teacherBatches || [];
  const batch = batches.find((b) => b.id === batchId) ?? batches[0] ?? defaultTeacherBatch;
  const students = batch?.id ? studentsForBatch(batch.id) : [];

  const teacher: TeacherProfile = useMemo(() => {
    const t = mockProfiles.teacher;
    return {
      id: t?.id || 'teacher-0',
      name: t ? `${t.firstName} ${t.lastName}`.trim() : 'Teacher',
      email: t?.email || '',
      designation: 'Faculty Educator',
      subjects: ['Mathematics', 'Science', 'English'],
    };
  }, []);

  // Compute dynamic subjects available in this batch and for this teacher
  const subjects = useMemo(() => {
    const slots = batch?.id ? timetableForBatch(batch.id) : [];
    const slotSubjects = (slots || []).map((s: TimetableSlot) => s.subjectName ? s.subjectName.replace(/\s*\([^)]*\)/g, '').trim() : '');
    return Array.from(new Set([...teacher.subjects, ...slotSubjects])).filter(Boolean);
  }, [batch?.id, teacher.subjects]);

  return (
    <TeacherBatchContext.Provider value={{ batchId: batch?.id || '', batch, students, batches, teacher, subjects, setBatchId }}>
      {children}
    </TeacherBatchContext.Provider>
  );
};
