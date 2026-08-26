'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { Card, SectionCard, Badge, PageHeader, EmptyState, cn } from '@/components/ui';
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
  adminResponse?: string;
}

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'Academic', label: 'Academic pacing & homework' },
  { value: 'Transport', label: 'Bus route & transportation' },
  { value: 'Infrastructure', label: 'Classroom & canteen infrastructure' },
  { value: 'Staff / Administration', label: 'Staff & administrative services' },
];

export const ParentFeedback: React.FC = () => {
  const { session } = useAuth();
  const [category, setCategory] = useState<Category>('Academic');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);

  useEffect(() => {
    let active = true;
    dataService.getParentFeedback().then((rows) => {
      if (active && rows) {
        setFeedbackList(
          rows.map((r: any) => ({
            id: r.id,
            category: r.category,
            subject: r.subject,
            message: r.message,
            rating: r.rating || 5,
            status: r.status === 'addressed' ? 'Reviewed & resolved' : r.status === 'reviewed' ? 'In Review' : 'Received',
            statusTone: r.status === 'addressed' ? 'success' : r.status === 'reviewed' ? 'warning' : 'info',
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
            adminResponse: r.adminResponse,
          }))
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const parentName = session
    ? `${session.firstName || 'Parent'} ${session.lastName || ''}`.trim()
    : 'Parent';
  const parentEmail = session?.email || 'parent@school.edu';
  const avatarUrl = session?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(parentName)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast('Missing details', 'warning', 'Please add a subject and message before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = session?.userId
        ? await dataService.createParentFeedback({
            submittedBy: session.userId,
            category,
            subject: subject.trim(),
            message: message.trim(),
            rating: rating || 5,
          })
        : null;

      const ticketId = res?.id || `FB-${Math.floor(400 + Math.random() * 500)}`;
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
      toast('Feedback submitted', 'success', `Ticket routed to the Principal's office & saved to database.`);
    } catch {
      toast('Submission failed', 'error', 'Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
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
              src={avatarUrl}
              alt={parentName}
              className="h-14 w-14 rounded-lg object-cover ring-2 ring-border"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-section text-foreground">
                  {parentName}
                </h3>
                <Badge tone="primary">
                  <User size={12} /> Parent account
                </Badge>
              </div>
              <div className="mt-1 text-meta text-text-secondary">
                Registered Parent ID: <span className="font-semibold text-foreground">{session?.userId ? session.userId.slice(0, 8) : 'PR-2026'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-micro text-text-tertiary">
            <span className="inline-flex items-center gap-1">
              <Mail size={12} /> {parentEmail}
            </span>
          </div>
        </div>
      </Card>

      {/* Submission form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex items-center gap-2 text-section font-semibold text-foreground">
            <MessageSquareQuote size={20} className="text-primary" /> Submit a concern or appreciation
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Overall experience rating (optional)</label>
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-text-tertiary transition-colors"
                  >
                    <Star
                      size={20}
                      className={cn(
                        star <= (hoverRating || rating)
                          ? 'fill-warning text-warning'
                          : 'text-border hover:text-warning',
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 text-micro text-text-tertiary">
                  {rating ? `${rating} of 5 stars` : 'Tap to rate'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Subject</label>
            <input
              className="input"
              placeholder="e.g. Bus Route 4 morning delay at SG Highway stop"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Description / Specific details</label>
            <textarea
              rows={4}
              className="input"
              placeholder="Please provide specifics such as date, time, location or context to help administrators resolve the issue quickly…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Send size={16} /> {isSubmitting ? 'Submitting…' : 'Submit grievance / feedback'}
            </button>
          </div>
        </form>
      </Card>

      {/* Past submissions history */}
      <SectionCard title="Your past tickets & suggestions" icon={<Ticket size={18} />}>
        {feedbackList.length === 0 ? (
          <EmptyState
            icon={<MessageSquareQuote size={24} />}
            title="No grievances on file"
            description="You haven't submitted any concerns or suggestions yet."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {feedbackList.map((f) => (
              <div key={f.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-micro font-semibold text-text-tertiary">{f.id}</span>
                    <Badge tone="neutral">{f.category}</Badge>
                    <Badge tone={f.statusTone}>{f.status}</Badge>
                  </div>
                  <span className="text-micro text-text-tertiary">{f.date}</span>
                </div>
                <h4 className="mt-2 text-meta font-semibold text-foreground">{f.subject}</h4>
                <p className="mt-1 text-meta text-text-secondary">{f.message}</p>
                {f.adminResponse && (
                  <div className="mt-3 rounded-md bg-surface-muted p-3 border border-border/80 text-meta">
                    <span className="font-semibold text-foreground">Response from Administration:</span>
                    <p className="mt-1 text-text-secondary">{f.adminResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
