'use client';

import React, { useState } from 'react';
import { mockProfiles } from '@/lib/mockData';
import { Card, SectionCard, Badge, PageHeader, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { MessageSquareQuote, Send, Star, Mail, Phone, User, Ticket } from 'lucide-react';

type Category = 'Academic' | 'Transport' | 'Infrastructure' | 'Staff / Administration';

interface FeedbackEntry {
  id: string;
  category: string;
  subject: string;
  message: string;
  rating: number;
  status: string;
  statusTone: 'success' | 'warning' | 'info' | 'primary' | 'neutral';
  date: string;
}

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'Academic', label: 'Academic pacing & homework' },
  { value: 'Transport', label: 'Bus route & transportation' },
  { value: 'Infrastructure', label: 'Classroom & canteen infrastructure' },
  { value: 'Staff / Administration', label: 'Staff & administrative services' },
];

export const ParentFeedback: React.FC = () => {
  const parent = mockProfiles.parent;

  const [category, setCategory] = useState<Category>('Academic');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([
    {
      id: 'FB-401',
      category: 'Transport',
      subject: 'Morning pickup delay',
      message: 'Morning Route 4 pickup arrived 10 minutes late near the SG Highway stop.',
      rating: 3,
      status: 'Reviewed & resolved',
      statusTone: 'success',
      date: 'Aug 14, 2026',
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast('Missing details', 'warning', 'Please add a subject and message before submitting');
      return;
    }
    const ticketId = `FB-${Math.floor(400 + Math.random() * 500)}`;
    const entry: FeedbackEntry = {
      id: ticketId,
      category,
      subject: subject.trim(),
      message: message.trim(),
      rating,
      status: 'Received',
      statusTone: 'info',
      date: 'Just now',
    };
    setFeedbackList((prev) => [entry, ...prev]);
    setSubject('');
    setMessage('');
    setRating(0);
    setCategory('Academic');
    toast('Feedback submitted', 'success', `Ticket ${ticketId} routed to the Principal's office`);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Feedback & grievance desk"
        subtitle="Share suggestions or concerns directly with school leadership and track their status"
      />

      {/* Parent profile summary */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={parent.avatarUrl}
              alt={`${parent.firstName} ${parent.lastName}`}
              className="h-14 w-14 rounded-lg object-cover ring-2 ring-border"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-section text-foreground">
                  {parent.firstName} {parent.lastName}
                </h3>
                <Badge tone="primary">
                  <User size={12} /> Parent account
                </Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-text-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={13} className="text-text-tertiary" /> {parent.email}
                </span>
                {parent.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={13} className="text-text-tertiary" /> {parent.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="sm:text-right">
            <div className="eyebrow">Open tickets</div>
            <div className="mt-1 text-2xl font-semibold text-foreground">
              {feedbackList.filter((f) => f.statusTone !== 'success').length}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Submit form */}
        <SectionCard title="Submit feedback / grievance" icon={<MessageSquareQuote size={18} />}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label" htmlFor="fb-category">
                Category
              </label>
              <select
                id="fb-category"
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="fb-subject">
                Subject
              </label>
              <input
                id="fb-subject"
                className="input"
                placeholder="Brief summary of your feedback"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="fb-message">
                Message
              </label>
              <textarea
                id="fb-message"
                className="input resize-none"
                rows={4}
                placeholder="Describe your suggestion or concern in detail…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Overall experience (optional)</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star === rating ? 0 : star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="rounded-md p-0.5 text-text-tertiary transition-colors"
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star size={22} className={cn(active ? 'fill-warning text-warning' : 'text-text-disabled')} />
                    </button>
                  );
                })}
                {rating > 0 && <span className="ml-1 text-meta text-text-secondary">{rating}/5</span>}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary">
                <Send size={15} /> Submit feedback
              </button>
            </div>
          </form>
        </SectionCard>

        {/* Tracked history */}
        <SectionCard title="Your submissions" icon={<Ticket size={18} />}>
          <div className="flex flex-col gap-3">
            {feedbackList.map((item) => (
              <div key={item.id} className="rounded-md border border-border bg-surface-muted p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{item.category}</Badge>
                    <span className="font-mono text-micro text-text-tertiary">{item.id}</span>
                  </div>
                  <Badge tone={item.statusTone}>{item.status}</Badge>
                </div>
                <div className="mt-2 text-meta font-semibold text-foreground">{item.subject}</div>
                <p className="mt-1 text-meta leading-relaxed text-text-secondary">{item.message}</p>
                <div className="mt-2 flex items-center justify-between text-micro text-text-tertiary">
                  <span>{item.date}</span>
                  {item.rating > 0 && (
                    <span className="inline-flex items-center gap-0.5">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} size={12} className="fill-warning text-warning" />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};
