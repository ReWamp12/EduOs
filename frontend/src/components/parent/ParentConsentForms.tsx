'use client';

import React, { useState } from 'react';
import { mockConsentForms } from '@/lib/mockData';
import { FileCheck2, ShieldCheck, Check, Clock, AlertCircle, Sparkles } from 'lucide-react';

interface ConsentFormItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  date?: string;
  deadline?: string;
  signedOn?: string;
}

export const ParentConsentForms: React.FC = () => {
  const [forms, setForms] = useState<ConsentFormItem[]>(mockConsentForms);
  const [signedMessage, setSignedMessage] = useState<string | null>(null);

  const handleSign = (id: string) => {
    setForms((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'signed', signedOn: 'Today, 03:32 PM' } : f))
    );
    setSignedMessage('Digital consent signed with cryptographic timestamp and logged in legal audit registry.');
    setTimeout(() => setSignedMessage(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Legally Versioned Digital Consent Forms</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Field Trips, Emergency Medical Care &amp; Social Media Photo Authorizations
          </p>
        </div>
      </div>

      {signedMessage && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          borderRadius: 'var(--radius-sm)',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
        }}>
          <Check size={18} /> {signedMessage}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {forms.map((form) => (
          <div
            key={form.id}
            className="glass-card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              borderLeft: form.status === 'signed' ? '4px solid #10B981' : '4px solid #EF4444',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-primary">{form.category}</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{form.title}</h3>
                </div>
                {form.date && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Scheduled Date: {form.date} &bull; Deadline to Sign: <strong style={{ color: '#F59E0B' }}>{form.deadline}</strong>
                  </div>
                )}
              </div>

              <div>
                {form.status === 'signed' ? (
                  <span className="badge badge-success" style={{ padding: '6px 12px' }}>
                    <ShieldCheck size={14} /> Signed on {form.signedOn}
                  </span>
                ) : (
                  <span className="badge badge-danger" style={{ padding: '6px 12px' }}>
                    <Clock size={14} /> Action Required
                  </span>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {form.description}
            </p>

            {form.category === 'Child Safety & Photo Consent' && (
              <div style={{
                background: 'rgba(79, 70, 229, 0.08)',
                border: '1px solid rgba(79, 70, 229, 0.25)',
                borderRadius: '6px',
                padding: '10px 14px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}>
                <strong style={{ color: '#818CF8' }}>System Guardrail Note:</strong> This consent directly controls whether the institute&apos;s marketing and social media teams are permitted to publish photographs featuring your child.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              {form.status === 'pending' && (
                <button
                  onClick={() => handleSign(form.id)}
                  className="btn-primary"
                  style={{ fontSize: '0.85rem', background: '#10B981' }}
                >
                  <Check size={16} /> I Authorize &amp; Digitally Sign
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
