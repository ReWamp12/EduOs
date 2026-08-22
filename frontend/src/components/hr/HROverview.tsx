'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Briefcase,
  ShieldCheck,
  Award,
  AlertCircle,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Card, SectionCard, StatCard, Badge, ProgressBar, cn } from '@/components/ui';
import { dataService } from '@/lib/dataService';
import { toast } from '@/components/ui/toast';

interface HROverviewProps {
  onNavigate: (tabId: string) => void;
}

export const HROverview: React.FC<HROverviewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await dataService.getHROverview();
      setData(res);
    } catch (e) {
      console.error(e);
      toast('Failed to load HR metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-text-secondary text-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading overview...</span>
        </div>
      </div>
    );
  }

  const { metrics, criticalAlerts, recentApplicants } = data;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Staff & Faculty Management</h1>
          <p className="text-xs text-text-secondary mt-1">
            Recruitment pipeline, staff service records, background verification, and annual CPD training.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('service_books')}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            Service Books
          </button>
          <button
            onClick={() => onNavigate('ats')}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus size={14} /> Post Vacancy
          </button>
        </div>
      </div>

      {/* Critical Alert (if any) */}
      {criticalAlerts && criticalAlerts.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Action Required: Police Verification Grace Window</span>
              <p className="text-text-secondary mt-0.5">{criticalAlerts[0].message}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('police_gate')}
            className="shrink-0 text-primary font-medium hover:underline inline-flex items-center gap-0.5"
          >
            Review <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* 4 Minimal Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          interactive
          onClick={() => onNavigate('service_books')}
          className="p-4 bg-surface hover:border-border-strong transition-all"
        >
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Total Staff</span>
          <div className="mt-2 text-2xl font-bold text-foreground">{metrics.totalStaff}</div>
          <p className="mt-1 text-[11px] text-text-secondary">
            {metrics.teachingStaffCount} Teaching • {metrics.nonTeachingStaffCount} Support
          </p>
        </Card>

        <Card
          interactive
          onClick={() => onNavigate('ats')}
          className="p-4 bg-surface hover:border-border-strong transition-all"
        >
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Open Positions</span>
          <div className="mt-2 text-2xl font-bold text-foreground">{metrics.openPositions}</div>
          <p className="mt-1 text-[11px] text-text-secondary">{metrics.activeApplicants} active applicants</p>
        </Card>

        <Card
          interactive
          onClick={() => onNavigate('police_gate')}
          className="p-4 bg-surface hover:border-border-strong transition-all"
        >
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Police Verification</span>
          <div className="mt-2 text-2xl font-bold text-foreground">{metrics.policeVerificationCompliancePct}%</div>
          <p className="mt-1 text-[11px] text-text-secondary">
            {metrics.verifiedStaffCount}/{metrics.totalStaff} cleared
          </p>
        </Card>

        <Card
          interactive
          onClick={() => onNavigate('service_books')}
          className="p-4 bg-surface hover:border-border-strong transition-all"
        >
          <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Service Books</span>
          <div className="mt-2 text-2xl font-bold text-foreground">{metrics.totalStaff} Active</div>
          <p className="mt-1 text-[11px] text-text-secondary">100% Digital Service Books on file</p>
        </Card>
      </div>

      {/* Clean 2-Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applicants */}
        <div className="rounded-lg border border-border bg-surface overflow-hidden shadow-xs">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Active Candidates</h2>
            <button
              onClick={() => onNavigate('ats')}
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              Open ATS <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-border">
            {recentApplicants.map((app: any) => (
              <div key={app.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-foreground truncate">{app.fullName}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-text-secondary capitalize">
                      {app.stage.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-tertiary truncate mt-0.5">
                    {app.jobTitle} • {app.experienceYears} yrs exp
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('ats')}
                  className="shrink-0 rounded border border-border px-2.5 py-1 text-xs text-foreground hover:bg-muted"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Compliance Snapshot */}
        <div className="rounded-lg border border-border bg-surface overflow-hidden shadow-xs">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Staff Compliance Overview</h2>
            <button
              onClick={() => onNavigate('service_books')}
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              All Records <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-border text-xs">
            <div className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div>
                <span className="font-medium text-foreground block">Prof. Amit Verma</span>
                <span className="text-[11px] text-text-tertiary">Senior Faculty (HOD Science)</span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} /> Police Verified
                </span>
                <span className="text-[10px] text-text-tertiary block mt-0.5">Service Book: Confirmed</span>
              </div>
            </div>

            <div className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div>
                <span className="font-medium text-foreground block">Sunita Rao</span>
                <span className="text-[11px] text-text-tertiary">Primary Academic Coordinator</span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} /> Police Verified
                </span>
                <span className="text-[10px] text-text-tertiary block mt-0.5">Service Book: Confirmed</span>
              </div>
            </div>

            <div className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div>
                <span className="font-medium text-foreground block">Vikramaditya Bose</span>
                <span className="text-[11px] text-text-tertiary">TGT Computer Science & AI</span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  <Clock size={12} /> Grace Period (3 days left)
                </span>
                <span className="text-[10px] text-text-tertiary block mt-0.5">Service Book: Probationary</span>
              </div>
            </div>

            <div className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div>
                <span className="font-medium text-foreground block">Mohd. Imran Khan</span>
                <span className="text-[11px] text-text-tertiary">PET & Swimming Coach</span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                  <AlertCircle size={12} /> Grace Expired (Restricted)
                </span>
                <span className="text-[10px] text-text-tertiary block mt-0.5">Service Book: Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
