'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  cn — tiny class combiner                                           */
/* ------------------------------------------------------------------ */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ */
/*  PageHeader — title + subtitle + optional actions                  */
/* ------------------------------------------------------------------ */
export const PageHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, actions, className }) => (
  <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
    <div className="min-w-0">
      <h2 className="text-title text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-body text-text-secondary">{subtitle}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Card + SectionCard                                                 */
/* ------------------------------------------------------------------ */
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }> = ({
  interactive,
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      'rounded-lg border border-border bg-surface shadow-sm',
      interactive && 'cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-border-strong',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);

export const SectionCard: React.FC<{
  title?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  bodyClassName?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ title, icon, action, bodyClassName, className, children }) => (
  <Card className={cn('flex flex-col', className)}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-text-tertiary">{icon}</span>}
          <h3 className="text-section text-foreground truncate">{title}</h3>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    )}
    <div className={cn('p-5', bodyClassName)}>{children}</div>
  </Card>
);

/* ------------------------------------------------------------------ */
/*  StatCard — KPI tile with optional trend                           */
/* ------------------------------------------------------------------ */
type Tone = 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'neutral';

const toneIconBg: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  destructive: 'bg-destructive-soft text-destructive',
  info: 'bg-info-soft text-info',
  neutral: 'bg-muted text-text-secondary',
};

export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  hint?: React.ReactNode;
  trend?: { value: string; direction: 'up' | 'down' | 'flat' };
  onClick?: () => void;
}> = ({ label, value, icon, tone = 'primary', hint, trend, onClick }) => (
  <Card
    interactive={!!onClick}
    onClick={onClick}
    className="p-5"
  >
    <div className="flex items-start justify-between">
      <span className="eyebrow">{label}</span>
      {icon && (
        <span className={cn('grid h-8 w-8 place-items-center rounded-md', toneIconBg[tone])}>{icon}</span>
      )}
    </div>
    <div className="mt-3 flex items-baseline gap-2">
      <span className="text-[1.75rem] font-semibold leading-none tracking-tight text-foreground">{value}</span>
      {trend && (
        <span
          className={cn(
            'inline-flex items-center gap-0.5 text-micro font-semibold',
            trend.direction === 'up' && 'text-success',
            trend.direction === 'down' && 'text-destructive',
            trend.direction === 'flat' && 'text-text-tertiary',
          )}
        >
          {trend.direction === 'up' && <ArrowUpRight size={13} />}
          {trend.direction === 'down' && <ArrowDownRight size={13} />}
          {trend.value}
        </span>
      )}
    </div>
    {hint && <div className="mt-1.5 text-micro text-text-tertiary">{hint}</div>}
  </Card>
);

/* ------------------------------------------------------------------ */
/*  Badge — semantic status pill                                      */
/* ------------------------------------------------------------------ */
export const Badge: React.FC<{
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';
  className?: string;
  children: React.ReactNode;
}> = ({ tone = 'neutral', className, children }) => (
  <span className={cn('badge', `badge-${tone}`, className)}>{children}</span>
);

/* ------------------------------------------------------------------ */
/*  ProgressBar                                                        */
/* ------------------------------------------------------------------ */
export const ProgressBar: React.FC<{ value: number; tone?: Tone; className?: string }> = ({
  value,
  tone = 'primary',
  className,
}) => {
  const bar: Record<Tone, string> = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    info: 'bg-info',
    neutral: 'bg-text-tertiary',
  };
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', bar[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  EmptyState                                                         */
/* ------------------------------------------------------------------ */
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
    {icon && (
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-muted text-text-tertiary">{icon}</div>
    )}
    <h3 className="text-section text-foreground">{title}</h3>
    {description && <p className="mt-1.5 max-w-sm text-body text-text-secondary">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('skeleton', className)} />
);

export const SkeletonCard: React.FC = () => (
  <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="mt-4 h-8 w-32" />
    <Skeleton className="mt-3 h-3 w-40" />
  </div>
);
