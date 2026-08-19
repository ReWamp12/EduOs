'use client';

import React from 'react';
import { useAppStore, markParentAlertsRead, ParentAlert } from '@/lib/store';
import { mockParentChildren } from '@/lib/mockData';
import { SectionCard, Badge, EmptyState } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { BellRing, CheckCheck, UserX, UserCheck, Clock, Award, CalendarClock } from 'lucide-react';

const childNames = mockParentChildren.map((c) => c.name);

const iconFor = (a: ParentAlert) => {
  if (a.type === 'result') return <Award size={15} />;
  if (a.type === 'exam') return <CalendarClock size={15} />;
  if (a.tone === 'danger') return <UserX size={15} />;
  if (a.tone === 'warning') return <Clock size={15} />;
  return <UserCheck size={15} />;
};

const badgeLabel = (a: ParentAlert) =>
  a.type === 'result' ? 'Result' : a.type === 'exam' ? 'Exam' : a.title.replace('Marked ', '');

const iconBg = (tone: ParentAlert['tone']) =>
  tone === 'danger'
    ? 'bg-destructive-soft text-destructive'
    : tone === 'warning'
    ? 'bg-warning-soft text-warning'
    : tone === 'info'
    ? 'bg-info-soft text-info'
    : 'bg-success-soft text-success';

const timeAgo = (ts: number) => {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
};

export const ParentAttendanceAlerts: React.FC = () => {
  const { parentAlerts } = useAppStore();
  const alerts = parentAlerts.filter((a) => childNames.includes(a.studentName)).slice(0, 8);
  const unread = alerts.filter((a) => !a.read).length;

  const handleMarkRead = () => {
    markParentAlertsRead(childNames);
    toast('Alerts marked read', 'info');
  };

  return (
    <SectionCard
      title="Alerts & notifications"
      icon={<BellRing size={18} />}
      action={
        <div className="flex items-center gap-2">
          {unread > 0 && <Badge tone="danger">{unread} new</Badge>}
          {alerts.length > 0 && (
            <button onClick={handleMarkRead} className="btn-tertiary px-2 py-1 text-micro">
              <CheckCheck size={14} /> Mark read
            </button>
          )}
        </div>
      }
      bodyClassName="p-0"
    >
      {alerts.length === 0 ? (
        <EmptyState
          icon={<BellRing size={22} />}
          title="No alerts yet"
          description="When a teacher marks attendance or publishes marks for your child, real-time notifications appear here."
        />
      ) : (
        <ul className="divide-y divide-border">
          {alerts.map((a) => (
            <li
              key={a.id}
              className={a.read ? 'px-5 py-3.5' : 'border-l-2 border-l-primary bg-primary-soft/40 px-5 py-3.5'}
            >
              <div className="flex items-start gap-3">
                <span className={'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md ' + iconBg(a.tone)}>
                  {iconFor(a)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-meta font-semibold text-foreground">{a.studentName}</span>
                    <Badge tone={a.type === 'attendance' ? (a.tone as 'success' | 'warning' | 'danger') : 'info'}>
                      {badgeLabel(a)}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-micro text-text-secondary">{a.message}</p>
                  <p className="mt-0.5 text-micro text-text-tertiary">
                    {a.date} · {a.source} · {timeAgo(a.createdAt)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
};
