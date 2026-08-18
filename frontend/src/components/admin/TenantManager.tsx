'use client';

import React, { useState } from 'react';
import { Building2, Plus, Check, Sliders, ShieldCheck } from 'lucide-react';
import { dataService } from '@/lib/dataService';

export const TenantManager: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    type: 'coaching',
    plan: 'pro',
    adminEmail: '',
  });
  const [created, setCreated] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await dataService.createTenant({
        name: formData.name,
        subdomain: formData.subdomain,
        institutionType: formData.type as any,
        primaryColor: '#4F46E5',
        secondaryColor: '#06B6D4',
        accentColor: '#F59E0B',
      });
      setCreated(true);
      setFormData({ name: '', subdomain: '', type: 'coaching', plan: 'pro', adminEmail: '' });
      setTimeout(() => setCreated(false), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Tenant Onboarding Wizard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Provision an isolated multi-tenant institution database with automated RLS policies
          </p>
        </div>
      </div>

      {created && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          borderRadius: 'var(--radius-sm)',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600,
        }}>
          <Check size={20} />
          Tenant provisioned successfully! Dedicated database schema, RLS policies, and subdomain identifier are active in the RLS kernel.
        </div>
      )}

      <div className="glass-card" style={{ padding: '32px', maxWidth: '720px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>INSTITUTION NAME</label>
            <input
              type="text"
              placeholder="e.g. Target Medical Academy"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                marginTop: '6px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>SUBDOMAIN IDENTIFIER</label>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px' }}>
              <input
                type="text"
                placeholder="targetmedical"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                }}
              />
              <span style={{
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                borderLeft: 'none',
                borderTopRightRadius: '8px',
                borderBottomRightRadius: '8px',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}>
                .eduos.app
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>INSTITUTION TYPE</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  marginTop: '6px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                }}
              >
                <option value="coaching">Coaching Institute (JEE/NEET)</option>
                <option value="school">K-12 School (CBSE/ICSE/State)</option>
                <option value="college">Degree College</option>
                <option value="university">University</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>SUBSCRIPTION PLAN</label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  marginTop: '6px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                }}
              >
                <option value="starter">Starter (Up to 500 Students)</option>
                <option value="pro">Pro Tier (Up to 2,000 + AI)</option>
                <option value="enterprise">Enterprise (Unlimited + Custom Domain)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>PRIMARY PRINCIPAL / ADMIN EMAIL</label>
            <input
              type="email"
              placeholder="director@targetmedical.in"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                marginTop: '6px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!formData.name || !formData.subdomain || saving}
            className="btn-primary"
            style={{
              marginTop: '12px',
              padding: '14px',
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #F59E0B, #4F46E5)',
            }}
          >
            <Building2 size={18} /> {saving ? 'Deploying PostgreSQL RLS Schema...' : 'Complete Onboarding & Deploy Database'}
          </button>
        </div>
      </div>
    </div>
  );
};
