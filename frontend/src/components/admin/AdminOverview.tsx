'use client';

import React from 'react';
import { Card, StatCard, SectionCard, Badge } from '@/components/ui';
import { Building2, Users, CreditCard, Activity, ShieldCheck, Sliders, Plus } from 'lucide-react';

export const AdminOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const tenantsList = [
    { id: 't-1', name: 'Apex Institute of Science', subdomain: 'apex.eduos.app', type: 'Coaching Institute', students: 1200, status: 'Active', mrr: '₹45,000/mo', branches: 2 },
    { id: 't-2', name: 'Greenwood World School', subdomain: 'greenwood.eduos.app', type: 'K-12 School (CBSE)', students: 2400, status: 'Active', mrr: '₹85,000/mo', branches: 3 },
    { id: 't-3', name: 'Target Medical Academy', subdomain: 'targetmedical.eduos.app', type: 'Coaching (NEET)', students: 850, status: 'Active', mrr: '₹35,000/mo', branches: 1 },
  ];

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
            Global multi-tenant registry · PostgreSQL RLS isolation · EduOS v1.0
          </p>
        </div>
        <button onClick={() => onNavigate('tenants')} className="btn-primary shrink-0">
          <Plus size={16} /> Onboard tenant
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Institutions" value={<>12<span className="text-base font-medium text-text-tertiary"> tenants</span></>} tone="warning" icon={<Building2 size={16} />} hint="100% RLS isolated" />
        <StatCard label="Active Students" value="8,420" tone="primary" icon={<Users size={16} />} trend={{ value: '+4.2%', direction: 'up' }} hint="Across all tenant databases" />
        <StatCard label="Platform MRR" value="₹8.40L" tone="success" icon={<CreditCard size={16} />} trend={{ value: '+6.1%', direction: 'up' }} hint="SaaS subscription billing" />
        <StatCard label="System Health" value="99.98%" tone="info" icon={<Activity size={16} />} hint="All Redis event queues healthy" />
      </div>

      {/* Tenant directory */}
      <SectionCard
        title="Provisioned Tenant Directory"
        action={
          <Badge tone="primary">
            <ShieldCheck size={12} /> Shared DB · Schema isolated
          </Badge>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Type</th>
                <th className="text-right">Students</th>
                <th className="text-right">MRR</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenantsList.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="font-semibold text-foreground">{t.name}</div>
                    <div className="mt-0.5 text-micro text-text-tertiary">
                      <code className="text-primary">{t.subdomain}</code> · {t.branches} branches
                    </div>
                  </td>
                  <td className="text-text-secondary">{t.type}</td>
                  <td className="text-right font-medium text-foreground">{t.students.toLocaleString()}</td>
                  <td className="text-right font-semibold text-success">{t.mrr}</td>
                  <td><Badge tone="success">{t.status}</Badge></td>
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
        </div>
      </SectionCard>
    </div>
  );
};
