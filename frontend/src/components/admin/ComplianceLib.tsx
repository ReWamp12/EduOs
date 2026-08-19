'use client';

import React, { useEffect, useState } from 'react';
import {
  Scale,
  Plus,
  ChevronDown,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { Card, PageHeader, Badge, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { dataService } from '@/lib/dataService';
import { Tenant } from '@/lib/types';

type Requirement = 'mandatory' | 'optional';
type Category = 'Safety' | 'Affiliation' | 'Child Protection' | 'Labor & Tax';

interface ComplianceItem {
  id: string;
  title: string;
  requirement: Requirement;
}

interface Ruleset {
  id: string;
  code: string;
  name: string;
  authority: string;
  jurisdiction: 'National' | 'State' | 'Board';
  category: Category;
  enabled: boolean;
  items: ComplianceItem[];
}

const categoryTone: Record<Category, 'danger' | 'primary' | 'warning' | 'success'> = {
  Safety: 'danger',
  Affiliation: 'primary',
  'Child Protection': 'warning',
  'Labor & Tax': 'success',
};

const INITIAL_RULESETS: Ruleset[] = [
  {
    id: 'rs-cbse',
    code: 'CBSE-BYE-2026',
    name: 'CBSE Affiliation Bye-Laws',
    authority: 'Central Board of Secondary Education',
    jurisdiction: 'Board',
    category: 'Affiliation',
    enabled: true,
    items: [
      { id: 'ci-cbse-1', title: 'Admission & Withdrawal Master Register digital lock', requirement: 'mandatory' },
      { id: 'ci-cbse-2', title: 'Qualified teacher-pupil ratio declaration', requirement: 'mandatory' },
      { id: 'ci-cbse-3', title: 'Annual mandatory disclosure on public portal', requirement: 'optional' },
    ],
  },
  {
    id: 'rs-rte',
    code: 'RTE-2009',
    name: 'RTE Act 2009',
    authority: 'Department of School Education',
    jurisdiction: 'State',
    category: 'Affiliation',
    enabled: true,
    items: [
      { id: 'ci-rte-1', title: '25% reserved quota admission register', requirement: 'mandatory' },
      { id: 'ci-rte-2', title: 'Fee reimbursement claim filing', requirement: 'mandatory' },
    ],
  },
  {
    id: 'rs-udise',
    code: 'UDISE-PLUS',
    name: 'UDISE+ Annual Return',
    authority: 'Ministry of Education (Govt. of India)',
    jurisdiction: 'National',
    category: 'Affiliation',
    enabled: true,
    items: [
      { id: 'ci-udise-1', title: 'Annual digital data return submission', requirement: 'mandatory' },
      { id: 'ci-udise-2', title: 'APAAR / student ID synchronization', requirement: 'optional' },
    ],
  },
  {
    id: 'rs-pocso',
    code: 'POCSO-2012',
    name: 'POCSO Compliance',
    authority: 'Protection of Children from Sexual Offences Act',
    jurisdiction: 'National',
    category: 'Child Protection',
    enabled: true,
    items: [
      { id: 'ci-pocso-1', title: 'Child protection policy & display boards', requirement: 'mandatory' },
      { id: 'ci-pocso-2', title: 'Staff background verification vault', requirement: 'mandatory' },
    ],
  },
  {
    id: 'rs-posh',
    code: 'POSH-2013',
    name: 'POSH Internal Committee',
    authority: 'Prevention of Sexual Harassment Act',
    jurisdiction: 'National',
    category: 'Child Protection',
    enabled: false,
    items: [
      { id: 'ci-posh-1', title: 'Internal Complaints Committee composition', requirement: 'mandatory' },
      { id: 'ci-posh-2', title: 'Annual awareness workshop log', requirement: 'optional' },
    ],
  },
  {
    id: 'rs-ragging',
    code: 'ANTI-RAG-09',
    name: 'Anti-Ragging Regulations',
    authority: 'UGC / AICTE Anti-Ragging Cell',
    jurisdiction: 'National',
    category: 'Safety',
    enabled: true,
    items: [
      { id: 'ci-rag-1', title: 'Online anti-ragging undertaking collection', requirement: 'mandatory' },
      { id: 'ci-rag-2', title: 'Anti-ragging squad & helpline notice', requirement: 'mandatory' },
    ],
  },
  {
    id: 'rs-safety',
    code: 'STATE-SAF-01',
    name: 'State Safety Audit',
    authority: 'State Disaster Management & Fire Authority',
    jurisdiction: 'State',
    category: 'Safety',
    enabled: true,
    items: [
      { id: 'ci-saf-1', title: 'Annual fire safety NOC & equipment inspection', requirement: 'mandatory' },
      { id: 'ci-saf-2', title: 'Building structural stability certificate', requirement: 'mandatory' },
    ],
  },
];

const ItemForm: React.FC<{ onAdd: (title: string, requirement: Requirement) => void }> = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [requirement, setRequirement] = useState<Requirement>('mandatory');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), requirement);
    setTitle('');
    setRequirement('mandatory');
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        className="input flex-1"
        placeholder="New compliance item — e.g. Water hygiene certificate"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Compliance item title"
      />
      <select
        className="input sm:w-40"
        value={requirement}
        onChange={(e) => setRequirement(e.target.value as Requirement)}
        aria-label="Requirement level"
      >
        <option value="mandatory">Mandatory</option>
        <option value="optional">Optional</option>
      </select>
      <button type="submit" className="btn-secondary shrink-0 px-3 py-2 text-micro" disabled={!title.trim()}>
        <Plus size={14} /> Add item
      </button>
    </form>
  );
};

export const ComplianceLib: React.FC = () => {
  const [rulesets, setRulesets] = useState<Ruleset[]>(INITIAL_RULESETS);
  const [expanded, setExpanded] = useState<string | null>('rs-cbse');
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    let active = true;
    dataService
      .getTenants()
      .then((rows) => {
        if (active) setTenants(rows);
      })
      .catch((e) => console.error(e));
    return () => {
      active = false;
    };
  }, []);

  const toggleEnabled = (id: string) => {
    setRulesets((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const enabled = !r.enabled;
        toast(
          enabled ? 'Ruleset activated' : 'Ruleset disabled',
          enabled ? 'success' : 'warning',
          r.name,
        );
        return { ...r, enabled };
      }),
    );
  };

  const assignToTenant = (rulesetId: string, tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    const ruleset = rulesets.find((r) => r.id === rulesetId);
    if (!tenant || !ruleset) return;
    toast('Ruleset assigned', 'success', `${ruleset.name} → ${tenant.name}`);
  };

  const addItem = (rulesetId: string, title: string, requirement: Requirement) => {
    setRulesets((prev) =>
      prev.map((r) =>
        r.id === rulesetId
          ? {
              ...r,
              items: [{ id: `ci-${Date.now()}`, title, requirement }, ...r.items],
            }
          : r,
      ),
    );
    toast('Compliance item added', 'success', title);
  };

  const activeCount = rulesets.filter((r) => r.enabled).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Global Compliance Ruleset Library"
        subtitle="Central repository of statutory checklists and board affiliation standards assignable to tenants."
        actions={
          <Badge tone="primary">
            <ShieldCheck size={12} /> {activeCount} / {rulesets.length} active
          </Badge>
        }
      />

      <div className="flex flex-col gap-3">
        {rulesets.map((r) => {
          const isOpen = expanded === r.id;
          return (
            <Card key={r.id} className="overflow-hidden">
              {/* Ruleset header */}
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <button
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-expanded={isOpen}
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-md',
                      r.enabled ? 'bg-primary-soft text-primary' : 'bg-muted text-text-tertiary',
                    )}
                  >
                    <Scale size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{r.name}</span>
                      <Badge tone={categoryTone[r.category]}>{r.category}</Badge>
                      <Badge tone={r.enabled ? 'success' : 'neutral'}>
                        {r.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-micro text-text-tertiary">
                      <code className="text-primary">{r.code}</code> · {r.authority} · {r.jurisdiction}
                    </span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={cn(
                      'ml-auto shrink-0 text-text-tertiary transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>

                {/* Enable/disable toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={r.enabled}
                  aria-label={`Toggle ${r.name}`}
                  onClick={() => toggleEnabled(r.id)}
                  className={cn(
                    'flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
                    r.enabled ? 'justify-end bg-primary' : 'justify-start bg-muted',
                  )}
                >
                  <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              {/* Expanded body */}
              {isOpen && (
                <div className="border-t border-border bg-surface-muted px-5 py-4">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="eyebrow">Compliance items ({r.items.length})</span>
                    <label className="flex items-center gap-2 text-meta text-text-secondary">
                      <Building2 size={14} className="text-text-tertiary" /> Assign to tenant:
                      <select
                        className="input h-8 w-auto py-1 text-micro"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            assignToTenant(r.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        aria-label={`Assign ${r.name} to tenant`}
                      >
                        <option value="" disabled>
                          Select tenant…
                        </option>
                        {tenants.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <ul className="mb-4 flex flex-col divide-y divide-border rounded-md border border-border bg-surface">
                    {r.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <span className="text-meta text-foreground">{item.title}</span>
                        <Badge tone={item.requirement === 'mandatory' ? 'danger' : 'neutral'}>
                          {item.requirement === 'mandatory' ? 'Mandatory' : 'Optional'}
                        </Badge>
                      </li>
                    ))}
                  </ul>

                  <ItemForm onAdd={(title, req) => addItem(r.id, title, req)} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
