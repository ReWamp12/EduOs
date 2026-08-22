'use client';

import React, { useState } from 'react';
import { UserRole } from '@/lib/types';
import { mockProfiles } from '@/lib/mockData';
import { useAppStore, sendNotice, NoticeAudience, NoticeMessage } from '@/lib/store';
import { PageHeader, SectionCard, Card, Badge, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { Send, Megaphone, Inbox, Users, GraduationCap, UserRound, ChevronRight } from 'lucide-react';

const AUDIENCE_LABEL: Record<NoticeAudience, string> = {
  teacher: 'Teachers',
  student: 'Students',
  parent: 'Parents',
};

const AUDIENCE_ICON: Record<NoticeAudience, React.ReactNode> = {
  teacher: <Users size={14} />,
  student: <GraduationCap size={14} />,
  parent: <UserRound size={14} />,
};

const CATEGORY_TONE: Record<NoticeMessage['category'], 'primary' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  academic: 'primary',
  exam: 'info',
  event: 'neutral',
  urgent: 'danger',
  general: 'neutral',
};

const CATEGORIES: NoticeMessage['category'][] = ['general', 'academic', 'exam', 'event', 'urgent'];

// Which audiences each sender role may target.
const ALLOWED: Partial<Record<UserRole, NoticeAudience[]>> = {
  principal: ['teacher', 'student', 'parent'],
  teacher: ['student', 'parent'],
};

export const NoticeBoard: React.FC<{ role: UserRole }> = ({ role }) => {
  const { notices } = useAppStore();
  const canCompose = role === 'principal' || role === 'teacher';
  const allowed = ALLOWED[role] ?? [];

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoticeMessage['category']>('general');
  const [audience, setAudience] = useState<Set<NoticeAudience>>(new Set(allowed));
  const [filter, setFilter] = useState<'all' | NoticeMessage['category']>('all');

  // Inbox: notices addressed to this role (or, for staff, ones they sent). Principal oversees all.
  const inbox = notices.filter((n) => {
    if (role === 'principal' || role === 'super_admin') return true;
    return n.audience.includes(role as NoticeAudience) || n.senderRole === role;
  });
  const visible = filter === 'all' ? inbox : inbox.filter((n) => n.category === filter);

  const toggleAudience = (a: NoticeAudience) => {
    setAudience((prev) => {
      const next = new Set(prev);
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });
  };

  const handleSend = () => {
    if (!title.trim() || !content.trim()) {
      toast('Add a title and message', 'info');
      return;
    }
    if (audience.size === 0) {
      toast('Select at least one audience', 'info');
      return;
    }
    const list = Array.from(audience);
    sendNotice({
      title: title.trim(),
      content: content.trim(),
      category,
      audience: list,
      senderRole: role as 'principal' | 'teacher',
      senderName: mockProfiles[role] ? `${mockProfiles[role].firstName} ${mockProfiles[role].lastName}`.trim() || 'Staff' : 'Staff',
    });
    toast('Notice broadcast', 'success', `Sent to ${list.map((a) => AUDIENCE_LABEL[a]).join(', ')}`);
    setTitle('');
    setContent('');
    setAudience(new Set(allowed));
    setCategory('general');
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={canCompose ? 'Notices & circulars' : 'Circulars & notices'}
        subtitle={
          canCompose
            ? 'Broadcast announcements to your audiences and review the school notice board.'
            : 'Announcements and circulars addressed to you.'
        }
        actions={<Badge tone="primary">{inbox.length} in inbox</Badge>}
      />

      <div className={cn('grid grid-cols-1 gap-5', canCompose && 'lg:grid-cols-[1fr_1.4fr]')}>
        {/* Compose */}
        {canCompose && (
          <SectionCard title="Compose notice" icon={<Megaphone size={18} />} bodyClassName="flex flex-col gap-4">
            <div>
              <label className="label" htmlFor="notice-title">Title</label>
              <input
                id="notice-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. PTM rescheduled to Saturday"
              />
            </div>

            <div>
              <label className="label" htmlFor="notice-body">Message</label>
              <textarea
                id="notice-body"
                className="input min-h-[104px] resize-y"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the announcement…"
              />
            </div>

            <div>
              <label className="label" htmlFor="notice-cat">Category</label>
              <select id="notice-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value as NoticeMessage['category'])}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="label">Send to</div>
              <div className="flex flex-wrap gap-2">
                {allowed.map((a) => {
                  const on = audience.has(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAudience(a)}
                      aria-pressed={on}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-meta font-medium transition-colors',
                        on
                          ? 'border-primary bg-primary-soft text-primary'
                          : 'border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-muted',
                      )}
                    >
                      {AUDIENCE_ICON[a]} {AUDIENCE_LABEL[a]}
                    </button>
                  );
                })}
                {allowed.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setAudience(new Set(allowed))}
                    className="btn-tertiary px-2.5 py-1.5 text-micro"
                  >
                    Select all
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-micro text-text-tertiary">
                {role === 'principal'
                  ? 'Principals can address teachers, students and parents.'
                  : 'Teachers can address students and parents.'}
              </p>
            </div>

            <button onClick={handleSend} className="btn-primary self-start">
              <Send size={16} /> Broadcast notice
            </button>
          </SectionCard>
        )}

        {/* Inbox */}
        <div className="flex flex-col gap-4">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {(['all', ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-micro font-medium capitalize transition-colors',
                  filter === c
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-muted',
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <SectionCard bodyClassName="p-0">
              <EmptyState
                icon={<Inbox size={22} />}
                title="No notices here yet"
                description={
                  canCompose
                    ? 'Broadcast your first notice using the composer, or switch category filters.'
                    : 'Circulars addressed to you will appear here as staff publish them.'
                }
              />
            </SectionCard>
          ) : (
            visible.map((n) => (
              <Card key={n.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={CATEGORY_TONE[n.category]}>{n.category}</Badge>
                    {n.senderRole === 'teacher' && <Badge tone="neutral">Faculty</Badge>}
                  </div>
                  <span className="text-micro text-text-tertiary">{n.date}</span>
                </div>
                <h3 className="mt-2.5 text-section text-foreground">{n.title}</h3>
                <p className="mt-1.5 text-body leading-relaxed text-text-secondary">{n.content}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3">
                  <span className="inline-flex items-center gap-1.5 text-micro text-text-tertiary">
                    <ChevronRight size={13} /> From <span className="font-semibold text-text-secondary">{n.senderName}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-micro text-text-tertiary">
                    To{' '}
                    <span className="font-medium text-text-secondary">
                      {n.audience.map((a) => AUDIENCE_LABEL[a]).join(' · ')}
                    </span>
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
