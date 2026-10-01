'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useFamily } from '@/lib/familyContext';
import { dataService } from '@/lib/dataService';
import { isWithinSchoolHours } from '@/lib/officeHours';
import { ParentQuery, QueryCategory } from '@/lib/types';
import { PageHeader, Card, EmptyState } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { QueryCard } from '@/components/common/QueryCard';

const CATEGORIES: { id: QueryCategory; label: string }[] = [
  { id: 'academic', label: 'Academic question' },
  { id: 'attendance', label: 'Leave / attendance note' },
  { id: 'health', label: 'Health update' },
  { id: 'general', label: 'General' },
];

export const ParentQueries: React.FC = () => {
  const { session } = useAuth();
  const { activeChild } = useFamily();
  const [teachers, setTeachers] = useState<{ id: string; label: string }[]>([]);
  const [queries, setQueries] = useState<ParentQuery[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [category, setCategory] = useState<QueryCategory>('academic');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadQueries = useCallback(async () => {
    if (session) setQueries(await dataService.getQueries({ parentUserId: session.userId }));
  }, [session]);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  useEffect(() => {
    if (!activeChild?.batchId) {
      setTeachers([]);
      return;
    }
    let active = true;
    dataService.getTimetableForBatch(activeChild.batchId).then((slots) => {
      if (!active) return;
      const byTeacher = new Map<string, string>();
      slots.forEach((s) => {
        if (s.teacherId) byTeacher.set(s.teacherId, `${s.teacherName} · ${s.subjectName}`);
      });
      const list = Array.from(byTeacher, ([id, label]) => ({ id, label }));
      setTeachers(list);
      setTeacherId(list[0]?.id ?? '');
    });
    return () => {
      active = false;
    };
  }, [activeChild?.batchId]);

  const offHours = useMemo(() => !isWithinSchoolHours(), []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !activeChild || !teacherId) return;
    setSending(true);
    const ok = await dataService.createQuery({
      tenantId: session.tenantId,
      parentUserId: session.userId,
      studentId: activeChild.id,
      teacherId,
      category,
      message: message.trim(),
    });
    setSending(false);
    if (!ok) {
      toast('Could not send', 'error', 'Please try again.');
      return;
    }
    setMessage('');
    toast('Query sent', 'success', offHours ? 'The teacher will review it during school hours.' : 'The teacher has been notified.');
    loadQueries();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ask a Teacher" subtitle="Questions are answered by the teacher during school hours and kept on record." />

      <Card className="p-5">
        {offHours && (
          <p role="status" className="mb-4 rounded-md bg-warning-soft p-3 text-meta text-foreground">
            The school is currently closed. Your message will be reviewed during school hours (Mon–Sat, 8:00 AM – 3:30 PM).
          </p>
        )}
        <form onSubmit={handleSend} className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="label">Teacher</span>
            <select className="input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Category</span>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as QueryCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="label">Message</span>
            <textarea className="input min-h-[96px]" value={message} onChange={(e) => setMessage(e.target.value)} required />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={sending || !teacherId || !message.trim()}>
              {sending ? 'Sending…' : 'Send to teacher'}
            </button>
          </div>
        </form>
      </Card>

      {queries.length === 0 ? (
        <Card>
          <EmptyState icon={<MessageSquareText size={20} />} title="No queries yet" description="Your questions and the teacher replies appear here." />
        </Card>
      ) : (
        queries.map((q) => <QueryCard key={q.id} query={q} counterpart="teacher" />)
      )}
    </div>
  );
};
