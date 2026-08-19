'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Plus, ShieldCheck, Sliders, X, Power, PlayCircle } from 'lucide-react';
import {
  PageHeader,
  SectionCard,
  Badge,
  Skeleton,
  EmptyState,
  cn,
} from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { dataService } from '@/lib/dataService';
import { Tenant } from '@/lib/types';

type TenantStatus = 'active' | 'suspended';
type TenantRow = Tenant & { status: TenantStatus };

const INSTITUTION_LABELS: Record<Tenant['institutionType'], string> = {
  coaching: 'Coaching Institute',
  school: 'K-12 School',
  college: 'Degree College',
  university: 'University',
};

const emptyForm = {
  name: '',
  subdomain: '',
  type: 'coaching' as Tenant['institutionType'],
  primaryColor: '#4F46E5',
  secondaryColor: '#06B6D4',
  accentColor: '#F59E0B',
};

export const TenantManager: React.FC = () => {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await dataService.getTenants();
        if (!active) return;
        setTenants(rows.map((t) => ({ ...t, status: 'active' as TenantStatus })));
      } catch (e) {
        console.error(e);
        toast('Could not load tenants', 'error', 'Falling back to offline registry');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subdomain.trim()) return;
    setSaving(true);
    try {
      const created = await dataService.createTenant({
        name: form.name.trim(),
        subdomain: form.subdomain.trim(),
        institutionType: form.type,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        accentColor: form.accentColor,
      });
      setTenants((prev) => [{ ...created, status: 'active' }, ...prev]);
      toast('Tenant provisioned', 'success', created.name);
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast('Provisioning failed', 'error', 'Please retry');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next: TenantStatus = t.status === 'active' ? 'suspended' : 'active';
        toast(
          next === 'active' ? 'Tenant activated' : 'Tenant suspended',
          next === 'active' ? 'success' : 'warning',
          t.name,
        );
        return { ...t, status: next };
      }),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tenant Onboarding & Registry"
        subtitle="Provision isolated multi-tenant institutions with automated RLS policies and white-label branding."
        actions={
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Close' : 'Onboard tenant'}
          </button>
        }
      />

      {/* Onboarding form panel */}
      {showForm && (
        <SectionCard
          title="Provision new institution"
          icon={<Building2 size={16} />}
          className="animate-fade-in"
        >
          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tn-name" className="label">
                  Institution name
                </label>
                <input
                  id="tn-name"
                  className="input"
                  placeholder="e.g. Target Medical Academy"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label htmlFor="tn-subdomain" className="label">
                  Subdomain identifier
                </label>
                <div className="flex items-center">
                  <input
                    id="tn-subdomain"
                    className="input rounded-r-none"
                    placeholder="targetmedical"
                    value={form.subdomain}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    required
                  />
                  <span className="inline-flex h-[38px] items-center rounded-r-md border border-l-0 border-border-strong bg-muted px-3 text-meta text-text-tertiary">
                    .eduos.app
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="tn-type" className="label">
                Institution type
              </label>
              <select
                id="tn-type"
                className="input"
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as Tenant['institutionType'] })
                }
              >
                <option value="coaching">Coaching Institute (JEE/NEET)</option>
                <option value="school">K-12 School (CBSE/ICSE/State)</option>
                <option value="college">Degree College</option>
                <option value="university">University</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {([
                ['Primary color', 'primaryColor'],
                ['Secondary color', 'secondaryColor'],
                ['Accent color', 'accentColor'],
              ] as const).map(([labelText, key]) => (
                <div key={key}>
                  <label htmlFor={`tn-${key}`} className="label">
                    {labelText}
                  </label>
                  <div className="flex items-center gap-2 rounded-md border border-border-strong bg-surface px-2 py-1.5">
                    <input
                      id={`tn-${key}`}
                      type="color"
                      className="h-8 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                    <code className="text-meta text-text-secondary">{form[key]}</code>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!form.name.trim() || !form.subdomain.trim() || saving}
              >
                <Building2 size={16} />
                {saving ? 'Provisioning…' : 'Provision tenant'}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* Tenant registry table */}
      <SectionCard
        title="Provisioned tenant directory"
        action={
          <Badge tone="primary">
            <ShieldCheck size={12} /> Shared DB · Schema isolated
          </Badge>
        }
        bodyClassName="p-0"
      >
        {loading ? (
          <div className="flex flex-col gap-3 p-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="mt-2 h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : tenants.length === 0 ? (
          <EmptyState
            icon={<Building2 size={22} />}
            title="No tenants provisioned"
            description="Onboard your first institution to spin up an isolated database schema."
            action={
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> Onboard tenant
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[760px]">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Subdomain</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-micro font-bold text-white"
                          style={{
                            background: `linear-gradient(135deg, ${t.primaryColor}, ${t.secondaryColor})`,
                          }}
                          aria-hidden
                        >
                          {t.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-semibold text-foreground">{t.name}</span>
                      </div>
                    </td>
                    <td>
                      <code className="text-primary">{t.subdomain}.eduos.app</code>
                    </td>
                    <td className="text-text-secondary">
                      {INSTITUTION_LABELS[t.institutionType]}
                    </td>
                    <td>
                      <Badge tone={t.status === 'active' ? 'success' : 'warning'}>
                        {t.status === 'active' ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(t.id)}
                          className={cn(
                            'px-3 py-1.5 text-micro',
                            t.status === 'active' ? 'btn-secondary' : 'btn-primary',
                          )}
                        >
                          {t.status === 'active' ? (
                            <>
                              <Power size={13} /> Suspend
                            </>
                          ) : (
                            <>
                              <PlayCircle size={13} /> Activate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => toast('Opening branding studio', 'info', t.name)}
                          className="btn-tertiary px-2.5 py-1.5 text-micro"
                        >
                          <Sliders size={13} /> Configure
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};
