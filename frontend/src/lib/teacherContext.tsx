'use client';

import React, { createContext, useContext } from 'react';
import { Batch, Student } from './types';
import { teacherBatches, studentsForBatch } from './batchData';

export interface TeacherBatchValue {
  batchId: string;
  batch: Batch;
  students: Student[];
  batches: Batch[];
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
  const batches = teacherBatches;
  const batch = batches.find((b) => b.id === batchId) ?? batches[0];
  const students = studentsForBatch(batch.id);

  return (
    <TeacherBatchContext.Provider value={{ batchId: batch.id, batch, students, batches, setBatchId }}>
      {children}
    </TeacherBatchContext.Provider>
  );
};
