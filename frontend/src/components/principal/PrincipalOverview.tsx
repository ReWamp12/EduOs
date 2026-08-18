'use client';

import React from 'react';
import { mockBatches, mockLeaveRequests, mockNotices } from '@/lib/mockData';
import { 
  Building, 
  Users, 
  IndianRupee, 
  CheckCircle2, 
  ShieldAlert, 
  CalendarCheck, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileCheck2
} from 'lucide-react';

export const PrincipalOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const pendingLeaves = mockLeaveRequests.filter((l) => l.status === 'pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(79, 70, 229, 0.15))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Campus Operations Command Center</h2>
            <span className="badge badge-success">Ahmedabad Main Campus</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>
            Executive Directorate &bull; Dr. Rajesh Iyer &bull; Academic Session 2026-2027
          </p>
        </div>

        <button
          onClick={() => onNavigate('inspection_mode')}
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)', fontSize: '0.85rem' }}
        >
          <FileCheck2 size={16} /> 1-Click Board Inspection Mode
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
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>MORNING ATTENDANCE</span>
            <CalendarCheck size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#10B981' }}>
            93.8%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            103 of 110 total enrolled students present
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>STAFF ON DUTY</span>
            <Users size={18} color="#06B6D4" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#06B6D4' }}>
            18 <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 20</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            2 Faculty on approved leave
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>TODAY&apos;S FEE COLLECTIONS</span>
            <IndianRupee size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#F59E0B' }}>
            ₹2,45,000
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            14 Term installment transactions
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>PENDING APPROVALS</span>
            <CheckCircle2 size={18} color="#818CF8" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#818CF8' }}>
            {pendingLeaves.length} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Request</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Prof. Vikram Roy Casual Leave
          </div>
        </div>
      </div>

      {/* Main Grid: Batches Overview + Statutory Health Monitor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Batches Table */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Active Academic Batches</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mockBatches.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {b.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Mentor: {b.mentorTeacherName} &bull; {b.roomNumber}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#06B6D4', fontSize: '0.9rem' }}>
                    {b.studentCount} / {b.capacity} Students
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.68rem', marginTop: '2px' }}>
                    {b.targetExam}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statutory Compliance Health Box */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="#10B981" /> Statutory Compliance Pulse
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              fontSize: '0.84rem',
            }}>
              <span>Fire Safety NOC</span>
              <span className="badge badge-success">Valid (Nov 2026)</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              fontSize: '0.84rem',
            }}>
              <span>Building Stability Certificate</span>
              <span className="badge badge-success">Compliant</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              fontSize: '0.84rem',
            }}>
              <span>POCSO &amp; Child Protection Comm.</span>
              <span className="badge badge-success">Constituted</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('inspection_mode')}
            className="btn-secondary"
            style={{ marginTop: 'auto', width: '100%', fontSize: '0.85rem' }}
          >
            Launch Inspection Dossier <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
