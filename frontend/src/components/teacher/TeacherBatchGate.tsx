'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { teacherBatches, studentsForBatch, syncBatchDataFromSupabase } from '@/lib/batchData';
import { Batch } from '@/lib/types';
import { Card, Badge } from '@/components/ui';
import { GraduationCap, Users, ArrowRight, LayoutGrid, CalendarOff, Loader2, RefreshCw, Star } from 'lucide-react';

export const TeacherBatchGate: React.FC<{ onSelect: (batchId: string) => void }> = ({ onSelect }) => {
  const { session } = useAuth();
  const [batches, setBatches] = useState<Batch[]>(() => teacherBatches || []);
  const [loading, setLoading] = useState<boolean>(() => (teacherBatches || []).length === 0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await syncBatchDataFromSupabase();
      const loadedBatches = res.batches || [];
      setBatches(loadedBatches);
      
      // If there is only one batch available, automatically select it
      if (loadedBatches.length === 1) {
        onSelect(loadedBatches[0].id);
      }
    } catch (err) {
      console.error('Failed to load teacher batches:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onSelect]);

  useEffect(() => {
    let active = true;
    loadData();
    return () => {
      active = false;
    };
  }, [loadData]);

  // Check if a batch is mentored by the logged in teacher
  const isMyMentoredBatch = (b: Batch) => {
    if (!session) return false;
    if (b.mentorTeacherId && b.mentorTeacherId === session.userId) return true;
    if (session.lastName && b.mentorTeacherName?.toLowerCase().includes(session.lastName.toLowerCase())) {
      return true;
    }
    return false;
  };

  // Sort batches: teacher's mentored batch first
  const sortedBatches = [...batches].sort((a, b) => {
    const aMentor = isMyMentoredBatch(a) ? 1 : 0;
    const bMentor = isMyMentoredBatch(b) ? 1 : 0;
    return bMentor - aMentor;
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-4">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary shadow-xs">
          <LayoutGrid size={22} />
        </div>
        <h2 className="text-title font-bold text-foreground">
          Welcome, {session?.firstName || 'Faculty'} {session?.lastName || ''}
        </h2>
        <p className="mt-1.5 text-body text-text-secondary">
          Select the class you're working with. Your attendance, gradebook, exams and roster will be scoped to it.
        </p>
      </div>

      {loading ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Loader2 size={36} className="animate-spin text-primary mb-3" />
          <h3 className="text-section font-semibold text-foreground">Loading Your Classes</h3>
          <p className="mt-1 text-meta text-text-secondary">
            Fetching assigned academic batches and rosters from institution records…
          </p>
        </Card>
      ) : batches.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-10 text-center">
          <CalendarOff size={36} className="text-text-tertiary mb-3 opacity-50" />
          <h3 className="text-section font-semibold text-foreground">No Batches Assigned</h3>
          <p className="mt-1 text-body text-text-secondary max-w-md">
            No academic batches or student rosters have been assigned to your
            faculty profile yet. Ask your principal or academic admin to
            assign you to a class.
          </p>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50 transition"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Checking Records…' : 'Check Records Again'}
          </button>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-meta font-medium text-text-secondary">
              Available Classes ({batches.length})
            </span>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-micro font-medium text-text-secondary hover:text-primary transition"
              title="Refresh batches"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sortedBatches.map((b) => {
              const count = studentsForBatch(b.id).length || b.studentCount || 0;
              const isMentor = isMyMentoredBatch(b);

              return (
                <Card
                  key={b.id}
                  interactive
                  onClick={() => onSelect(b.id)}
                  className={`group relative flex flex-col gap-3.5 p-5 transition-all duration-150 hover:shadow-md cursor-pointer ${
                    isMentor ? 'border-primary/40 bg-primary-soft/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
                      <GraduationCap size={20} />
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isMentor && (
                        <Badge tone="primary" className="gap-1 font-semibold">
                          <Star size={11} className="fill-primary" /> Class Mentor
                        </Badge>
                      )}
                      <Badge tone="neutral">{b.code}</Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-section font-bold text-foreground group-hover:text-primary transition-colors">
                      {b.name}
                    </h3>
                    <p className="mt-0.5 text-micro text-text-tertiary">
                      Target · {b.targetExam || 'General Curriculum'}
                      {b.mentorTeacherName && !isMentor && (
                        <span> · Mentor: {b.mentorTeacherName}</span>
                      )}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-border/80 pt-3">
                    <span className="inline-flex items-center gap-1.5 text-meta text-text-secondary">
                      <Users size={14} /> {count} students {b.roomNumber ? `· ${b.roomNumber}` : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 text-meta font-semibold text-primary opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                      Select Class <ArrowRight size={14} />
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
