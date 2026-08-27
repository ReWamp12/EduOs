'use client';

import React, { useState, useEffect } from 'react';
import { Card, StatCard, SectionCard, Badge, Skeleton, EmptyState } from '@/components/ui';
import { Building2, Users, CreditCard, Activity, ShieldCheck, Sliders, Plus, GraduationCap } from 'lucide-react';
import { dataService } from '@/lib/dataService';

export const AdminOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalTenants: number;
    activeStudents: number;
    totalTeachers: number;
    totalUsers: number;
    tenants: Array<{
      id: string;
      name: string;
      subdomain: string;
      type: string;
      students: number;
      branches: number;
      status: string;
      mrr: string;
    }>;
  }>({
    totalTenants: 0,
    activeStudents: 0,
    totalTeachers: 0,
    totalUsers: 0,
    tenants: [],
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const overview = await dataService.getPlatformOverview();
        if (active && overview) {
          setStats(overview);
        }
      } catch (err) {
        console.error('Error loading platform stats:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-title text-foreground">Super Admin Control Tower</h2>
            <Badge tone="warning">Master Platform View</Badge>
          </div>
          <p className="mt-1 text-body text-text-secondary">
            Live multi-tenant PostgreSQL registry · RLS tenant isolation · Real-time Supabase telemetry
          </p>
        </div>
        <button onClick={() => onNavigate('tenants')} className="btn-primary shrink-0">
          <Plus size={16} /> Onboard tenant
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Institutions"
          value={
            loading ? (
              '…'
            ) : (
              <>
                {stats.totalTenants}
                <span className="text-base font-medium text-text-tertiary"> schools</span>
              </>
            )
          }
          tone="warning"
          icon={<Building2 size={16} />}
          hint="PostgreSQL RLS isolated"
        />
        <StatCard
          label="Active Enrolled Students"
          value={loading ? '…' : stats.activeStudents.toLocaleString()}
          tone="primary"
          icon={<GraduationCap size={16} />}
          hint="Live roster records in Supabase"
        />
        <StatCard
          label="Faculty & User Profiles"
          value={loading ? '…' : `${stats.totalUsers} profiles`}
          tone="success"
          icon={<Users size={16} />}
          hint={`${stats.totalTeachers} teachers across institutions`}
        />
        <StatCard
          label="Database Status"
          value="Healthy"
          tone="info"
          icon={<Activity size={16} />}
          hint="PostgreSQL 15 & Supabase GoTrue Auth"
        />
      </div>

      {/* Tenant directory */}
      <SectionCard
        title="Live Provisioned Institutions"
        action={
          <Badge tone="primary">
            <ShieldCheck size={12} /> Supabase PostgreSQL · RLS Scoped
          </Badge>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : stats.tenants.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              No institutions provisioned yet in the database.
            </div>
          ) : (
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Board / Affiliation</th>
                  <th className="text-right">Students</th>
                  <th className="text-right">Branches</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.tenants.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="font-semibold text-foreground">{t.name}</div>
                      <div className="mt-0.5 text-micro text-text-tertiary">
                        <code className="text-primary font-mono">{t.subdomain}</code>
                      </div>
                    </td>
                    <td className="text-text-secondary">{t.type}</td>
                    <td className="text-right font-medium text-foreground">
                      {t.students.toLocaleString()}
                    </td>
                    <td className="text-right font-medium text-foreground">{t.branches}</td>
                    <td>
                      <Badge tone="success">{t.status}</Badge>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => onNavigate('branding_studio')}
                        className="btn-secondary ml-auto px-3 py-1.5 text-micro"
                      >
                        <Sliders size={13} /> Configure
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SectionCard>
    </div>
  );
};
