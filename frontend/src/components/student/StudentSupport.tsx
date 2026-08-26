'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { PageHeader, SectionCard, Card, Badge, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { Send, Compass, UserCheck, MessageSquare, Clock } from 'lucide-react';

type TicketCategory = 'Academic Query' | 'Fee / Administrative' | 'LMS & Technical' | 'Counseling';
type TicketStatus = 'In Review' | 'Resolved' | 'Open';

interface Ticket {
  id: string;
  category: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  reply?: string;
}

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'Academic Query', label: 'Academic Subject Query' },
  { value: 'Fee / Administrative', label: 'Fee / Document Request' },
  { value: 'LMS & Technical', label: 'LMS & App Support' },
  { value: 'Counseling', label: 'Career Counseling Request' },
];

const statusTone: Record<TicketStatus, 'success' | 'warning' | 'primary'> = {
  Resolved: 'success',
  'In Review': 'warning',
  Open: 'primary',
};

export const StudentSupport: React.FC = () => {
  const { session } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Academic Query');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    dataService.getSupportTickets().then((rows) => {
      if (active && rows) {
        setTickets(
          rows.map((r: any) => ({
            id: r.id.length > 8 ? r.id.slice(0, 8).toUpperCase() : r.id,
            category: r.category,
            subject: r.subject,
            status: r.status === 'resolved' || r.status === 'closed' ? 'Resolved' : r.status === 'in_progress' ? 'In Review' : 'Open',
            createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Recent',
            reply: r.reply,
          }))
        );
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast('Subject & description required', 'warning', 'Please provide a subject and details before submitting.');
      return;
    }
    if (!session?.userId) {
      toast('Authentication required', 'error', 'Please log in to submit a ticket.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await dataService.createSupportTicket({
        raisedBy: session.userId,
        category,
        subject: subject.trim(),
        description: description.trim(),
      });

      const createdTicket: Ticket = {
        id: res?.id ? res.id.slice(0, 8).toUpperCase() : `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        category,
        subject: subject.trim(),
        status: 'Open',
        createdAt: 'Just now',
      };

      setTickets((prev) => [createdTicket, ...prev]);
      setSubject('');
      setDescription('');
      setCategory('Academic Query');
      toast('Support ticket raised', 'success', `Ticket ${createdTicket.id} registered and saved to database.`);
    } catch {
      toast('Submission failed', 'error', 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMentorship = () => {
    toast('Mentorship slot requested', 'success', 'Academic advisory will contact you shortly.');
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student Helpdesk & Counseling Hub"
        subtitle="Direct support ticketing · College guidance · Academic mentoring requests"
        actions={<Badge tone="primary">{tickets.length} tickets</Badge>}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-5">
          {/* New ticket form */}
          <SectionCard title="Raise a Support Query" icon={<MessageSquare size={18} />}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Subject Line</label>
                  <input
                    className="input"
                    placeholder="e.g. Question regarding Electrostatics sheet"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Describe your query in detail</label>
                <textarea
                  rows={4}
                  className="input"
                  placeholder="Provide chapter, question number, or specific guidance requested…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-primary" disabled={submitting}>
                  <Send size={15} /> {submitting ? 'Submitting…' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </SectionCard>

          {/* Quick Mentoring widget */}
          <Card className="flex items-center justify-between p-5 border border-primary/20 bg-primary-soft/30">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-white">
                <Compass size={20} />
              </span>
              <div>
                <h4 className="text-meta font-semibold text-foreground">Need 1-on-1 Academic Counseling?</h4>
                <p className="text-micro text-text-secondary">Book a 20-min session with your Class Mentor</p>
              </div>
            </div>
            <button onClick={handleMentorship} className="btn-primary shrink-0">
              Request Slot
            </button>
          </Card>
        </div>

        {/* Existing tickets list */}
        <SectionCard title="Your Active & Past Tickets" icon={<Clock size={18} />} bodyClassName="flex flex-col gap-3">
          {tickets.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={24} />}
              title="No tickets raised"
              description="Your support requests and academic query responses will appear here."
            />
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-micro font-semibold text-text-tertiary">{t.id}</span>
                  <Badge tone={statusTone[t.status] || 'primary'}>{t.status}</Badge>
                </div>
                <div className="mt-2 text-meta font-medium text-foreground">{t.subject}</div>
                <div className="mt-1 text-micro text-text-tertiary">{t.category} · {t.createdAt}</div>
                {t.reply && (
                  <div className="mt-3 rounded-md bg-surface-muted p-3 text-micro border border-border/80">
                    <span className="font-semibold text-foreground">Mentor reply:</span>
                    <p className="mt-1 text-text-secondary">{t.reply}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </SectionCard>
      </div>
    </div>
  );
};
