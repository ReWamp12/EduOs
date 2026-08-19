'use client';

import React from 'react';
import { teacherBatches, studentsForBatch } from '@/lib/batchData';
import { mockProfiles } from '@/lib/mockData';
import { Card, Badge } from '@/components/ui';
import { GraduationCap, Users, ArrowRight, LayoutGrid } from 'lucide-react';

export const TeacherBatchGate: React.FC<{ onSelect: (batchId: string) => void }> = ({ onSelect }) => {
  const teacher = mockProfiles.teacher;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-4">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
          <LayoutGrid size={22} />
        </div>
        <h2 className="text-title text-foreground">Welcome, {teacher.firstName} {teacher.lastName}</h2>
        <p className="mt-1.5 text-body text-text-secondary">
          Select the class you're working with. Your attendance, gradebook, exams and roster will be scoped to it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {teacherBatches.map((b) => {
          const count = studentsForBatch(b.id).length;
          return (
            <Card
              key={b.id}
              interactive
              onClick={() => onSelect(b.id)}
              className="group flex flex-col gap-3 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-primary-soft text-primary">
                  <GraduationCap size={18} />
                </span>
                <Badge tone="neutral">{b.code}</Badge>
              </div>
              <div>
                <h3 className="text-section text-foreground">{b.name}</h3>
                <p className="mt-0.5 text-micro text-text-tertiary">Target · {b.targetExam}</p>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                <span className="inline-flex items-center gap-1.5 text-meta text-text-secondary">
                  <Users size={14} /> {count} students · {b.roomNumber}
                </span>
                <span className="inline-flex items-center gap-1 text-meta font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Open <ArrowRight size={14} />
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
