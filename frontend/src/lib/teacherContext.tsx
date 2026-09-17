'use client';

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Batch, Student, TimetableSlot } from './types';
import { teacherBatches, studentsForBatch, timetableForBatch, syncBatchDataFromSupabase } from './batchData';
import { useAuth } from './auth/AuthProvider';

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  designation: string;
  subjects: string[];
}

export interface TeacherBatchValue {
  batchId: string;
  // Non-null by CONSTRUCTION: the provider renders a loading state instead
  // of children when the batch list is still empty, so consumers can safely
  // read `batch.name` etc. No more fake defaultTeacherBatch fallback,
  // because the render path can never reach children with a null batch.
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
  const { session } = useAuth();
  // Empty by default. Filled by syncBatchDataFromSupabase below.
  const [batches, setBatches] = useState<Batch[]>(teacherBatches);
  const [loaded, setLoaded] = useState<boolean>(() => (teacherBatches || []).length > 0);

  useEffect(() => {
    let active = true;
    syncBatchDataFromSupabase().then((res) => {
      if (active) {
        setBatches(res.batches || []);
        setLoaded(true);
      }
    }).catch(() => {
      if (active) setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const batch = batches.find((b) => b.id === batchId) ?? batches[0];
  const students = batch?.id ? studentsForBatch(batch.id) : [];

  const teacher: TeacherProfile = useMemo(() => {
    // No demo teacher fallback: an unauthenticated session renders empty
    // strings rather than "Meera Iyer" everywhere, which was hardcoded
    // faculty branding leaking into every teacher screen.
    const name = session ? `${session.firstName || ''} ${session.lastName || ''}`.trim() : '';
    return {
      id: session?.userId || '',
      name,
      email: session?.email || '',
      designation: '',
      // Subject list should come from subject_teachers assignments in a
      // follow-up; hardcoding was worse than nothing here.
      subjects: [],
    };
  }, [session]);

  // Compute dynamic subjects available in this batch and for this teacher
  const subjects = useMemo(() => {
    const slots = batch?.id ? timetableForBatch(batch.id) : [];
    const slotSubjects = (slots || []).map((s: TimetableSlot) => s.subjectName ? s.subjectName.replace(/\s*\([^)]*\)/g, '').trim() : '');
    return Array.from(new Set([...teacher.subjects, ...slotSubjects])).filter(Boolean);
  }, [batch?.id, teacher.subjects]);

  // No batch resolved yet — either the sync is still running or no batches
  // exist for this teacher. Render a small loading marker instead of
  // shipping a fake batch down to every teacher screen.
  if (!batch) {
    if (!loaded) {
      return (
        <div className="flex items-center justify-center py-16 text-sm text-text-secondary gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading your workspace…
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <p className="text-sm text-text-secondary">No batch selected or available.</p>
        <button
          onClick={() => setBatchId('')}
          className="btn-secondary py-1.5 px-3 text-xs"
        >
          Select Class
        </button>
      </div>
    );
  }

  return (
    <TeacherBatchContext.Provider value={{ batchId: batch.id, batch, students, batches, teacher, subjects, setBatchId }}>
      {children}
    </TeacherBatchContext.Provider>
  );
};
