'use client';

import React, { useState } from 'react';
import { PageHeader, SectionCard, Card, Badge, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { Send, Compass, UserCheck, MessageSquare, Clock } from 'lucide-react';

type TicketCategory = 'Academic Query' | 'Fee / Administrative' | 'LMS & Technical' | 'Counseling';
type TicketStatus = 'In Review' | 'Resolved' | 'Open';

interface Ticket {
  id: string;
  category: TicketCategory;
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
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TCK-1092',
      category: 'Academic Query',
      subject: 'Clarification regarding Rotational Motion integration formulas',
      status: 'Resolved',
      createdAt: '2 days ago',
      reply: 'Prof. Amit Verma uploaded a step-by-step PDF handout to the LMS Classroom.',
    },
    {
      id: 'TCK-1099',
      category: 'Fee / Administrative',
      subject: 'Request for Bonafide Certificate for National Scholarship Portal',
      status: 'In Review',
      createdAt: 'Yesterday',
      reply: 'Front office is processing your document. It will appear in your Digital Wallet within 24h.',
    },
  ]);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Academic Query');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast('Subject required', 'warning', 'Please add a brief subject before submitting.');
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    const createdTicket: Ticket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      subject: subject.trim(),
      status: 'Open',
      createdAt: 'Just now',
    };

    setTickets((prev) => [createdTicket, ...prev]);
    setSubject('');
    setDescription('');
    setCategory('Academic Query');
    setSubmitting(false);
    toast('Support ticket raised', 'success', `${createdTicket.id} sent to the academic mentors.`);
  };

  const handleMentorship = () => {
    toast('Mentorship slot requested', 'success', 'Dr. Meera from student advisory will contact you shortly.');
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
                <div className="flex flex-col gap-1.5">
                  <label className="label" htmlFor="ticket-category">
                    Category
                  </label>
                  <select
                    id="ticket-category"
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

                <div className="flex flex-col gap-1.5">
                  <label className="label" htmlFor="ticket-subject">
                    Brief subject
                  </label>
                  <input
                    id="ticket-subject"
                    className="input"
                    type="text"
                    placeholder="e.g. Need extra practice problems"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="label" htmlFor="ticket-description">
                  Details / explanation
                </label>
                <textarea
                  id="ticket-description"
                  className="input resize-none"
                  rows={3}
                  placeholder="Describe your doubt or request…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary self-start" disabled={submitting}>
                <Send size={15} /> {submitting ? 'Submitting…' : 'Submit Query'}
              </button>
            </form>
          </SectionCard>

          {/* Ticket history */}
          <SectionCard title="Recent Tickets & Responses" icon={<Clock size={18} />} bodyClassName="flex flex-col gap-3">
            {tickets.map((t) => (
              <Card key={t.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-meta font-semibold text-foreground">{t.subject}</span>
                  <Badge tone={statusTone[t.status]}>{t.status}</Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-micro text-text-tertiary">
                  <span>ID: {t.id}</span>
                  <span>·</span>
                  <span>{t.category}</span>
                  <span>·</span>
                  <span>{t.createdAt}</span>
                </div>
                {t.reply && (
                  <div className="mt-3 rounded-md border-l-2 border-primary bg-primary-soft px-3.5 py-2.5">
                    <p className="text-micro text-text-secondary">
                      <span className="font-semibold text-foreground">Mentor response: </span>
                      {t.reply}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </SectionCard>
        </div>

        {/* Career hub */}
        <SectionCard title="Career & College Advisory" icon={<Compass size={18} />} bodyClassName="flex flex-col gap-4">
          <p className="text-meta text-text-secondary">
            Explore stream roadmaps, cutoff benchmarks for top-tier engineering & medical colleges, and mentorship
            sessions.
          </p>

          {[
            {
              tone: 'warning' as const,
              title: 'JEE Advanced 2026 Strategy Guide',
              desc: 'Target rank under 1,000 for IIT Bombay/Delhi CS & Electrical',
            },
            {
              tone: 'info' as const,
              title: 'NEET 2026 AIIMS Cutoff Matrix',
              desc: 'Physics & Biology score threshold analysis',
            },
          ].map((item) => (
            <div
              key={item.title}
              className={cn(
                'rounded-md border p-3.5',
                item.tone === 'warning' ? 'border-warning/20 bg-warning-soft' : 'border-info/20 bg-info-soft',
              )}
            >
              <div className="text-meta font-semibold text-foreground">{item.title}</div>
              <div className="mt-1 text-micro text-text-secondary">{item.desc}</div>
            </div>
          ))}

          <button className="btn-secondary mt-auto w-full" onClick={handleMentorship}>
            <UserCheck size={16} /> Request 1-on-1 Mentorship Slot
          </button>
        </SectionCard>
      </div>
    </div>
  );
};
