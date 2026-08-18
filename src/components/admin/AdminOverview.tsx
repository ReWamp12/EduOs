'use client';

import React from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Activity, 
  ExternalLink, 
  ShieldCheck, 
  Sliders,
  Plus
} from 'lucide-react';

export const AdminOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const tenantsList = [
    {
      id: 't-1',
      name: 'Apex Institute of Science',
      subdomain: 'apex.eduos.app',
      type: 'Coaching Institute',
      plan: 'Pro Tier (AI Intelligence)',
      students: 1200,
      status: 'Active',
      mrr: '₹45,000/mo',
      branches: 2,
    },
    {
      id: 't-2',
      name: 'Greenwood World School',
      subdomain: 'greenwood.eduos.app',
      type: 'K-12 School (CBSE)',
      plan: 'Enterprise (Compliance + Transport)',
      students: 2400,
      status: 'Active',
      mrr: '₹85,000/mo',
      branches: 3,
    },
    {
      id: 't-3',
      name: 'Target Medical Academy',
      subdomain: 'targetmedical.eduos.app',
      type: 'Coaching (NEET)',
      plan: 'Pro Tier',
      students: 850,
      status: 'Active',
      mrr: '₹35,000/mo',
      branches: 1,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(79, 70, 229, 0.15))',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Developer &amp; Super Admin Control Tower</h2>
            <span className="badge badge-warning">Master Platform View</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>
            Global Multi-Tenant Registry &bull; PostgreSQL RLS Kernel Isolation &bull; EduOS v1.0
          </p>
        </div>

        <button
          onClick={() => onNavigate('tenants')}
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #4F46E5)', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> Onboard New Tenant
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>TOTAL INSTITUTIONS</span>
            <Building2 size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#F59E0B' }}>
            12 <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Tenants</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            100% PostgreSQL RLS Isolated
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ACTIVE STUDENTS</span>
            <Users size={18} color="#4F46E5" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#818CF8' }}>
            8,420
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across all tenant databases
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>MONTHLY PLATFORM MRR</span>
            <CreditCard size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#10B981' }}>
            ₹8,40,000
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            SaaS subscription billing
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>SYSTEM HEALTH</span>
            <Activity size={18} color="#06B6D4" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#06B6D4' }}>
            99.98%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            All Redis event queues healthy
          </div>
        </div>
      </div>

      {/* Tenant Directory */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Provisioned Tenant Directory</h3>
          <span className="badge badge-primary">Shared DB &bull; Schema Isolated</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tenantsList.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{t.name}</div>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{t.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Subdomain: <code style={{ color: 'var(--primary)' }}>{t.subdomain}</code> &bull; Type: {t.type} &bull; {t.branches} Branches
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{t.students} Students</div>
                  <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>{t.mrr}</div>
                </div>

                <button
                  onClick={() => onNavigate('branding_studio')}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                >
                  <Sliders size={14} /> Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
