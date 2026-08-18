'use client';

import React, { useState } from 'react';
import { mockProfiles, mockParentChildren, mockFeeInvoices, mockConsentForms, mockBusLiveTracking, mockParentAINarrative } from '@/lib/mockData';
import { 
  Users, 
  CreditCard, 
  Calendar, 
  Bus, 
  FileCheck2, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Clock
} from 'lucide-react';

export const ParentOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [selectedChildId, setSelectedChildId] = useState(mockParentChildren[0].id);
  const activeChild = mockParentChildren.find((c) => c.id === selectedChildId) || mockParentChildren[0];
  const pendingConsent = mockConsentForms.filter((c) => c.status === 'pending');
  const unpaidInvoice = mockFeeInvoices.find((i) => i.status === 'unpaid');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Multi-Child Switcher Banner */}
      <div className="glass-card" style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(79, 70, 229, 0.15))',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#FBBF24',
            display: 'flex',
          }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              MULTI-CHILD PARENT ACCOUNT
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              Welcome, {mockProfiles.parent.firstName} {mockProfiles.parent.lastName}
            </div>
          </div>
        </div>

        {/* Child Selector Pills */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0, 0, 0, 0.4)', padding: '4px', borderRadius: '10px' }}>
          {mockParentChildren.map((child) => {
            const isSelected = child.id === selectedChildId;
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: isSelected ? 'linear-gradient(135deg, #4F46E5, #06B6D4)' : 'transparent',
                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <img
                  src={child.avatarUrl}
                  alt={child.name}
                  style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                />
                {child.name} ({child.grade.split(' - ')[0]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Child Overview Card */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <img
            src={activeChild.avatarUrl}
            alt={activeChild.name}
            style={{ width: '60px', height: '60px', borderRadius: '14px', objectFit: 'cover', border: '2px solid #4F46E5' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{activeChild.name}</h3>
              <span className="badge badge-primary">{activeChild.grade}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Roll: <strong>{activeChild.rollNumber}</strong> &bull; Campus: {activeChild.branch} &bull; Target: <strong style={{ color: 'var(--accent)' }}>{activeChild.targetExam}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ATTENDANCE</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
              {activeChild.attendance}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>LATEST MOCK SCORE</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)', marginTop: '4px' }}>
              {activeChild.latestScore}
            </div>
          </div>
        </div>
      </div>

      {/* Action Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        {/* Fees */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: unpaidInvoice ? '4px solid #F59E0B' : '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>FEES &amp; INVOICE</span>
            <CreditCard size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '8px', color: unpaidInvoice ? '#F59E0B' : '#10B981' }}>
            {unpaidInvoice ? `₹${unpaidInvoice.amount.toLocaleString()} Due` : 'Fully Paid'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {unpaidInvoice ? `Due by ${unpaidInvoice.dueDate}` : 'Term 1 & 2 clear'}
          </div>
          {unpaidInvoice && (
            <button
              onClick={() => onNavigate('fees')}
              className="btn-primary"
              style={{ marginTop: '10px', width: '100%', fontSize: '0.8rem', padding: '6px' }}
            >
              Pay Online (UPI/Card)
            </button>
          )}
        </div>

        {/* Live Bus GPS */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #06B6D4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>BUS GPS TRACKING</span>
            <Bus size={18} color="#06B6D4" />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '8px', color: '#06B6D4' }}>
            ETA: {mockBusLiveTracking.etaMinutes} Mins
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Near: {mockBusLiveTracking.currentStop}
          </div>
          <button
            onClick={() => onNavigate('bus')}
            className="btn-secondary"
            style={{ marginTop: '10px', width: '100%', fontSize: '0.8rem', padding: '6px' }}
          >
            Live Map &amp; Logs
          </button>
        </div>

        {/* Digital Consent */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: pendingConsent.length > 0 ? '4px solid #EF4444' : '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>DIGITAL CONSENT</span>
            <FileCheck2 size={18} color="#EF4444" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '8px', color: pendingConsent.length > 0 ? '#EF4444' : '#10B981' }}>
            {pendingConsent.length} Pending
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            ISRO Educational Excursion
          </div>
          {pendingConsent.length > 0 && (
            <button
              onClick={() => onNavigate('consent')}
              className="btn-primary"
              style={{ marginTop: '10px', width: '100%', fontSize: '0.8rem', padding: '6px', background: '#EF4444' }}
            >
              Sign Consent Form
            </button>
          )}
        </div>

        {/* PTM */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #818CF8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>PTM CONSULTATION</span>
            <Calendar size={18} color="#818CF8" />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '8px', color: '#818CF8' }}>
            Slots Open
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Physics (Prof. Amit Verma)
          </div>
          <button
            onClick={() => onNavigate('ptm')}
            className="btn-secondary"
            style={{ marginTop: '10px', width: '100%', fontSize: '0.8rem', padding: '6px' }}
          >
            Book Time Slot
          </button>
        </div>
      </div>

      {/* AI Progress Narrative Preview */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#F59E0B" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI Personalized Progress Summary for Parents</h3>
          </div>
          <button
            onClick={() => onNavigate('ai_report')}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            Full Report &amp; Language Options <ChevronRight size={14} />
          </button>
        </div>

        <div style={{
          background: 'rgba(245, 158, 11, 0.06)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px 20px',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
        }}>
          &ldquo;{mockParentAINarrative.english}&rdquo;
        </div>
      </div>
    </div>
  );
};
