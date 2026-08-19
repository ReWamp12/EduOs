'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Sparkles,
  Shield,
  Bus,
  Home,
  BookOpen,
  IndianRupee,
  Users,
  GraduationCap,
  ClipboardList,
  FileText,
  Library,
  Share2,
  Brain,
  Save,
} from 'lucide-react';
import { PageHeader, SectionCard, Badge, Skeleton, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { dataService } from '@/lib/dataService';
import { Tenant } from '@/lib/types';

interface ModuleDef {
  key: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const MODULES: ModuleDef[] = [
  { key: 'academics', label: 'Academics & Timetable', desc: 'Batches, subjects, and period scheduling', icon: <GraduationCap size={16} /> },
  { key: 'attendance', label: 'Digital Attendance & QR', desc: 'Period attendance with instant parent alerts', icon: <ClipboardList size={16} /> },
  { key: 'exams', label: 'CBT Exam Engine & Gradebook', desc: 'Mock tests, scorecards, report card gate', icon: <FileText size={16} /> },
  { key: 'lms', label: 'LMS & Video Lessons', desc: 'Video lectures, DPPs, and chapter notes', icon: <BookOpen size={16} /> },
  { key: 'finance', label: 'Finance, Fees & POS', desc: 'Installment invoicing, UPI checkout, receipts', icon: <IndianRupee size={16} /> },
  { key: 'hr', label: 'HR & Payroll', desc: 'Staff records, leave, and PF/ESI remittance', icon: <Users size={16} /> },
  { key: 'admissions', label: 'Admissions & CRM', desc: 'Enquiry pipeline and enrolment workflows', icon: <ClipboardList size={16} /> },
  { key: 'transport', label: 'Transport & GPS Tracking', desc: 'Bus route optimization and driver alerts', icon: <Bus size={16} /> },
  { key: 'hostel', label: 'Hostel & Mess Management', desc: 'Bed allocation and gate-pass consent', icon: <Home size={16} /> },
  { key: 'library', label: 'Library & Inventory', desc: 'Cataloguing, issue/return, and stock', icon: <Library size={16} /> },
  { key: 'compliance', label: 'Statutory Compliance Engine', desc: 'UDISE+ export, CBSE/RTE, POCSO vaults', icon: <Shield size={16} /> },
  { key: 'social', label: 'Social Media Studio', desc: 'Achievement highlights and campaigns', icon: <Share2 size={16} /> },
  { key: 'ai', label: 'AI Intelligence Tier', desc: 'Paper generator, mistake diagnosis, NLP', icon: <Brain size={16} /> },
];

type Flags = Record<string, boolean>;

const PRESETS: Record<'starter' | 'pro' | 'enterprise', string[]> = {
  starter: ['academics', 'attendance', 'exams', 'finance'],
  pro: ['academics', 'attendance', 'exams', 'lms', 'finance', 'hr', 'admissions', 'compliance', 'social', 'ai'],
  enterprise: MODULES.map((m) => m.key),
};

function presetFlags(preset: keyof typeof PRESETS): Flags {
  const on = new Set(PRESETS[preset]);
  return Object.fromEntries(MODULES.map((m) => [m.key, on.has(m.key)]));
}

export const FeatureMatrix: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [byTenant, setByTenant] = useState<Record<string, Flags>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await dataService.getTenants();
        if (!active) return;
        setTenants(rows);
        const seed: Record<string, Flags> = {};
        rows.forEach((t, i) => {
          seed[t.id] = presetFlags(i === 0 ? 'pro' : 'starter');
        });
        setByTenant(seed);
        setSelectedId(rows[0]?.id ?? '');
      } catch (e) {
        console.error(e);
        toast('Could not load tenants', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const flags: Flags = byTenant[selectedId] ?? {};
  const enabledCount = useMemo(() => Object.values(flags).filter(Boolean).length, [flags]);
  const selectedTenant = tenants.find((t) => t.id === selectedId);

  const toggle = (key: string) => {
    setByTenant((prev) => ({
      ...prev,
      [selectedId]: { ...prev[selectedId], [key]: !prev[selectedId]?.[key] },
    }));
  };

  const applyPreset = (preset: keyof typeof PRESETS) => {
    setByTenant((prev) => ({ ...prev, [selectedId]: presetFlags(preset) }));
    toast(`${preset[0].toUpperCase()}${preset.slice(1)} plan applied`, 'info', selectedTenant?.name);
  };

  const handleSave = () => {
    toast('Feature flags saved', 'success', `${enabledCount} modules active for ${selectedTenant?.name ?? 'tenant'}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Feature Flag & Module Matrix" subtitle="Toggle platform modules per tenant." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-3 h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Feature Flag & Module Matrix"
        subtitle="Enable or disable platform modules per tenant. Changes apply optimistically — save to persist."
        actions={
          <button className="btn-primary" onClick={handleSave}>
            <Save size={16} /> Save configuration
          </button>
        }
      />

      {/* Tenant selector + plan presets */}
      <SectionCard title="Configuration scope" icon={<Sparkles size={16} />}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <label htmlFor="fm-tenant" className="label">
              Tenant
            </label>
            <select
              id="fm-tenant"
              className="input"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="label mb-0">Plan presets</span>
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn-secondary px-3 py-1.5 text-micro" onClick={() => applyPreset('starter')}>
                Starter
              </button>
              <button className="btn-secondary px-3 py-1.5 text-micro" onClick={() => applyPreset('pro')}>
                Pro
              </button>
              <button className="btn-secondary px-3 py-1.5 text-micro" onClick={() => applyPreset('enterprise')}>
                Enterprise
              </button>
              <Badge tone="primary">{enabledCount} / {MODULES.length} enabled</Badge>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Module toggle grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((m) => {
          const on = !!flags[m.key];
          return (
            <button
              key={m.key}
              type="button"
              role="switch"
              aria-checked={on}
              onClick={() => toggle(m.key)}
              className={cn(
                'flex items-start justify-between gap-3 rounded-lg border bg-surface p-4 text-left shadow-sm transition-all hover:shadow-md',
                on ? 'border-primary/40 bg-primary-soft' : 'border-border',
              )}
            >
              <div className="flex min-w-0 gap-3">
                <span
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-md',
                    on ? 'bg-primary text-white' : 'bg-muted text-text-tertiary',
                  )}
                >
                  {m.icon}
                </span>
                <div className="min-w-0">
                  <h4 className={cn('text-meta font-semibold', on ? 'text-foreground' : 'text-text-secondary')}>
                    {m.label}
                  </h4>
                  <p className="mt-0.5 text-micro text-text-tertiary">{m.desc}</p>
                </div>
              </div>

              {/* Toggle switch */}
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
                  on ? 'justify-end bg-primary' : 'justify-start bg-muted',
                )}
                aria-hidden
              >
                <span className="grid h-4 w-4 place-items-center rounded-full bg-white shadow-sm">
                  {on && <Check size={10} className="text-primary" />}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
