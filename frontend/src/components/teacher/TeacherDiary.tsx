'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTeacherBatch } from '@/lib/teacherContext';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { DiaryEntry } from '@/lib/types';
import { PageHeader, Card } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { DiaryFeed } from '@/components/common/DiaryFeed';

const todayIso = () => new Date().toISOString().split('T')[0];

export const TeacherDiary: React.FC = () => {
  const { batch } = useTeacherBatch();
  const { session } = useAuth();
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(todayIso);
  const [classwork, setClasswork] = useState('');
  const [homework, setHomework] = useState('');

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setEntries(await dataService.getDiaryEntries(batch.id));
    setLoading(false);
  }, [batch.id]);

  useEffect(() => {
    dataService.getSubjects().then((subs) => {
      setSubjects(subs);
      setSubjectId((prev) => prev || subs[0]?.id || '');
    });
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Editing an existing (subject, day) entry prefills the form instead of starting blank.
  useEffect(() => {
    const existing = entries.find((e) => e.subjectId === subjectId && e.date === date);
    setClasswork(existing?.classwork || '');
    setHomework(existing?.homework || '');
  }, [entries, subjectId, date]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !subjectId || !classwork.trim()) return;
    setSaving(true);
    const ok = await dataService.saveDiaryEntry({
      tenantId: session.tenantId,
      teacherId: session.userId,
      batchId: batch.id,
      subjectId,
      date,
      classwork: classwork.trim(),
      homework: homework.trim(),
    });
    setSaving(false);
    if (!ok) {
      toast('Could not save diary', 'error', 'Please try again.');
      return;
    }
    toast('Diary published', 'success', `${batch.name} parents can now see this update.`);
    await loadEntries();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Daily Diary" subtitle={`Post what was taught and what is due for ${batch.name}.`} />

      <Card className="p-5">
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="label">Subject</span>
            <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Date</span>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="label">Classwork covered</span>
            <textarea
              className="input min-h-[88px]"
              value={classwork}
              onChange={(e) => setClasswork(e.target.value)}
              placeholder="NCERT Chapter 4, page 42 — questions 1–4 solved on board."
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="label">Homework due tomorrow</span>
            <textarea
              className="input min-h-[88px]"
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              placeholder="Exercise 4.1 questions 5–10 in homework notebook."
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={saving || !classwork.trim()}>
              {saving ? 'Publishing…' : 'Publish to parents'}
            </button>
          </div>
        </form>
      </Card>

      <DiaryFeed entries={entries} loading={loading} />
    </div>
  );
};
