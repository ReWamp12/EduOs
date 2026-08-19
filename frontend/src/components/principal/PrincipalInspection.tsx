'use client';

import React, { useMemo, useState } from 'react';
import {
  PageHeader,
  SectionCard,
  StatCard,
  Card,
  Badge,
  ProgressBar,
  EmptyState,
  cn,
} from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  ShieldCheck,
  Download,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Search,
} from 'lucide-react';

type ComplianceStatus = 'compliant' | 'expiring' | 'missing';

interface ChecklistItem {
  code: string;
  title: string;
  authority: string;
  detail: string;
  validity: string;
  status: ComplianceStatus;
  verified: boolean;
}

type StatusFilter = 'all' | ComplianceStatus;

const INITIAL_ITEMS: ChecklistItem[] = [
  {
    code: 'REG-01',
    title: 'Admission & Withdrawal Master Register',
    authority: 'Board Affiliation Bye-Laws',
    detail: 'Audited & digital sign complete',
    validity: 'Current 2026-2027',
    status: 'compliant',
    verified: true,
  },
  {
    code: 'REG-02',
    title: 'Daily Signed Attendance Registers (Period-Wise)',
    authority: 'Exam Eligibility Statutory Order',
    detail: 'Synchronized real-time · 93.8% avg',
    validity: 'Daily logged',
    status: 'compliant',
    verified: true,
  },
  {
    code: 'SAF-01',
    title: 'Fire Safety No Objection Certificate (NOC)',
    authority: 'State Fire & Disaster Management Dept',
    detail: 'Certificate #FIRE-AMD-2025-994',
    validity: 'Valid till 30 Nov 2026',
    status: 'expiring',
    verified: false,
  },
  {
    code: 'SAF-02',
    title: 'Building Structural Stability Certificate',
    authority: 'Municipal Structural Engineer Authority',
    detail: 'Certified earthquake resistant · Zone 3',
    validity: 'Valid till 31 Mar 2028',
    status: 'compliant',
    verified: true,
  },
  {
    code: 'HR-01',
    title: 'Staff Service Books & Police Verification',
    authority: 'Child Safeguarding Directives',
    detail: '100% faculty police verification on file',
    validity: 'Annual check complete',
    status: 'compliant',
    verified: true,
  },
  {
    code: 'POCSO-01',
    title: 'Child Protection & Internal Complaints Committee',
    authority: 'POCSO Act 2012 / POSH Act 2013',
    detail: '5-member committee constituted with NGO rep',
    validity: 'Tenure active till 2027',
    status: 'compliant',
    verified: true,
  },
  {
    code: 'FEE-01',
    title: 'Fee Receipt & Collection Ledger',
    authority: 'State Fee Regulation Committee',
    detail: 'Digitally reconciled · GST compliant',
    validity: 'FY 2026-2027',
    status: 'compliant',
    verified: false,
  },
  {
    code: 'PUB-01',
    title: 'Mandatory Public Disclosure Webpage',
    authority: 'Board Mandatory Disclosure Standard',
    detail: 'Live on apex.eduos.app/disclosure',
    validity: 'Real-time sync',
    status: 'compliant',
    verified: true,
  },
  {
    code: 'SAF-03',
    title: 'Annual Safety & Infrastructure Audit',
    authority: 'District Education Safety Cell',
    detail: 'Audit report pending re-inspection upload',
    validity: 'Last filed 12 Jul 2025',
    status: 'missing',
    verified: false,
  },
];

const statusMeta: Record<
  ComplianceStatus,
  { label: string; tone: 'success' | 'warning' | 'danger'; icon: React.ReactNode; weight: number }
> = {
  compliant: { label: 'Compliant', tone: 'success', icon: <CheckCircle2 size={15} />, weight: 1 },
  expiring: { label: 'Expiring', tone: 'warning', icon: <AlertTriangle size={15} />, weight: 0.5 },
  missing: { label: 'Missing', tone: 'danger', icon: <XCircle size={15} />, weight: 0 },
};

export const PrincipalInspection: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_ITEMS);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [generating, setGenerating] = useState(false);

  const stats = useMemo(() => {
    const compliant = items.filter((i) => i.status === 'compliant').length;
    const expiring = items.filter((i) => i.status === 'expiring').length;
    const missing = items.filter((i) => i.status === 'missing').length;
    const score = items.length
      ? Math.round(
          (items.reduce((sum, i) => sum + statusMeta[i.status].weight, 0) / items.length) * 100,
        )
      : 0;
    return { compliant, expiring, missing, score };
  }, [items]);

  const readinessTone: 'success' | 'warning' | 'destructive' =
    stats.score >= 90 ? 'success' : stats.score >= 70 ? 'warning' : 'destructive';

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.status === filter)),
    [items, filter],
  );

  const toggleVerified = (code: string) =>
    setItems((prev) =>
      prev.map((i) => (i.code === code ? { ...i, verified: !i.verified } : i)),
    );

  const handleGenerate = async () => {
    setGenerating(true);
    if (stats.missing > 0 || stats.expiring > 0) {
      toast(
        'Compiling dossier with open items',
        'warning',
        `${stats.missing} missing · ${stats.expiring} expiring flagged for review.`,
      );
    }
    await new Promise((res) => setTimeout(res, 1400));
    setGenerating(false);
    toast(
      'Inspection dossier generated',
      'success',
      `${items.length} statutory records compiled · readiness ${stats.score}%`,
    );
  };

  const filters: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All records', count: items.length },
    { key: 'compliant', label: 'Compliant', count: stats.compliant },
    { key: 'expiring', label: 'Expiring', count: stats.expiring },
    { key: 'missing', label: 'Missing', count: stats.missing },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            <ShieldCheck size={24} className="text-success" />
            Board Inspection Mode
          </span>
        }
        subtitle="Consolidated statutory dossier — mandatory registers, NOCs & compliance certificates"
        actions={
          <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Download size={16} /> Generate inspection dossier
              </>
            )}
          </button>
        }
      />

      {/* Readiness banner */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'grid h-14 w-14 shrink-0 place-items-center rounded-lg text-lg font-bold',
                readinessTone === 'success' && 'bg-success-soft text-success',
                readinessTone === 'warning' && 'bg-warning-soft text-warning',
                readinessTone === 'destructive' && 'bg-destructive-soft text-destructive',
              )}
            >
              {stats.score}%
            </div>
            <div className="min-w-0">
              <h3 className="text-section text-foreground">
                {stats.score >= 90
                  ? 'Institution is inspection ready'
                  : stats.score >= 70
                    ? 'Inspection ready with open items'
                    : 'Action required before inspection'}
              </h3>
              <p className="mt-1 text-meta text-text-secondary">
                {stats.compliant} compliant · {stats.expiring} expiring · {stats.missing} missing across{' '}
                {items.length} statutory records.
              </p>
            </div>
          </div>
          <Badge tone={readinessTone === 'destructive' ? 'danger' : readinessTone}>
            {stats.missing === 0 && stats.expiring === 0
              ? 'Zero violations'
              : `${stats.missing + stats.expiring} to review`}
          </Badge>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-micro text-text-tertiary">
            <span className="eyebrow">Overall readiness</span>
            <span className="font-semibold text-foreground">{stats.score}%</span>
          </div>
          <ProgressBar value={stats.score} tone={readinessTone} />
        </div>
      </Card>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Compliant"
          value={stats.compliant}
          tone="success"
          icon={<CheckCircle2 size={16} />}
          hint="Verified & active"
        />
        <StatCard
          label="Expiring Soon"
          value={stats.expiring}
          tone="warning"
          icon={<AlertTriangle size={16} />}
          hint="Renewal window open"
        />
        <StatCard
          label="Missing / Overdue"
          value={stats.missing}
          tone="destructive"
          icon={<XCircle size={16} />}
          hint="Needs immediate action"
        />
      </div>

      <SectionCard
        title="Statutory Records & Evidence"
        icon={<FileCheck size={18} />}
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-micro font-semibold transition-colors',
                  filter === f.key
                    ? 'bg-primary text-white'
                    : 'bg-surface-muted text-text-secondary hover:bg-muted',
                )}
              >
                {f.label}
                <span className={cn('ml-1', filter === f.key ? 'text-white/80' : 'text-text-tertiary')}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        }
        bodyClassName="flex flex-col gap-3"
      >
        {visible.length === 0 ? (
          <EmptyState
            icon={<Search size={22} />}
            title="No records in this view"
            description="Switch filters to see other statutory records."
            action={
              <button className="btn-secondary" onClick={() => setFilter('all')}>
                View all records
              </button>
            }
          />
        ) : (
          visible.map((item) => {
            const meta = statusMeta[item.status];
            return (
              <div
                key={item.code}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-meta font-semibold text-foreground">{item.title}</span>
                    <Badge tone={meta.tone}>
                      <span className="inline-flex items-center gap-1">
                        {meta.icon} {meta.label}
                      </span>
                    </Badge>
                    {item.verified && <Badge tone="info">Verified</Badge>}
                  </div>
                  <div className="mt-1 text-micro text-text-tertiary">
                    {item.code} · {item.authority}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-text-secondary">
                    <span>{item.detail}</span>
                    <span className="text-text-tertiary">{item.validity}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-micro font-semibold text-text-secondary">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--primary)]"
                      checked={item.verified}
                      onChange={() => toggleVerified(item.code)}
                    />
                    Verified
                  </label>
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      toast('Evidence file opened', 'info', `${item.code} · ${item.title}`)
                    }
                  >
                    <FileCheck size={14} /> View evidence
                  </button>
                </div>
              </div>
            );
          })
        )}
      </SectionCard>
    </div>
  );
};
