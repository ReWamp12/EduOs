'use client';

import React from 'react';
import { mockCurrentStudent } from '@/lib/mockData';
import { CalendarCheck, ShieldCheck, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export const StudentAttendance: React.FC = () => {
  const student = mockCurrentStudent;

  const subjectAttendance = [
    { subject: 'Physics (Mechanics & Rotational)', attended: 28, total: 29, pct: 96.5, color: '#4F46E5' },
    { subject: 'Mathematics (Calculus & Functions)', attended: 27, total: 29, pct: 93.1, color: '#10B981' },
    { subject: 'Physical Chemistry (Thermodynamics)', attended: 25, total: 28, pct: 89.2, color: '#06B6D4' },
    { subject: 'Organic Chemistry (Mechanisms)', attended: 22, total: 24, pct: 91.6, color: '#F59E0B' },
    { subject: 'JEE Advanced Problem Solving Lab', attended: 14, total: 14, pct: 100.0, color: '#8B5CF6' },
  ];

  // Calendar dates for current month simulation
  const daysInMonth = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    // Simulate absences on 7th and 21st
    const isAbsent = day === 7 || day === 21;
    const isSunday = day % 7 === 0;
    return {
      day,
      status: isSunday ? 'holiday' : isAbsent ? 'absent' : 'present',
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Attendance Analytics</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Batch: {student.batchName} &bull; Roll: {student.rollNumber}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            <ShieldCheck size={16} /> Exam Eligible (94.2% &gt; 75%)
          </span>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>OVERALL ATTENDANCE</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10B981', marginTop: '6px' }}>
            94.2%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            116 of 124 total lectures attended
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>PRESENT SESSIONS</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            116
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Full day credit recorded
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>ABSENT SESSIONS</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#EF4444', marginTop: '6px' }}>
            8
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Alerts delivered to parent phone
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>ALLOWED LEAVES REMAINING</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#F59E0B', marginTop: '6px' }}>
            23
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Before falling below 75% threshold
          </div>
        </div>
      </div>

      {/* Main Grid: Subject Breakdown + Monthly Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Subject Breakdown */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '18px' }}>
            Subject-Wise Attendance Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {subjectAttendance.map((item, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.subject}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>
                    {item.attended}/{item.total} ({item.pct}%)
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{
                  height: '8px',
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${item.pct}%`,
                    background: item.color,
                    borderRadius: '4px',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Attendance Calendar */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>August 2026 Register</h3>
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981' }}>
                <CheckCircle size={12} /> Present
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444' }}>
                <XCircle size={12} /> Absent
              </span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            textAlign: 'center',
          }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', paddingBottom: '6px' }}>
                {day}
              </div>
            ))}

            {daysInMonth.map((d) => {
              const bg =
                d.status === 'present'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : d.status === 'absent'
                  ? 'rgba(239, 68, 68, 0.25)'
                  : 'rgba(255, 255, 255, 0.03)';
              const border =
                d.status === 'present'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : d.status === 'absent'
                  ? 'rgba(239, 68, 68, 0.5)'
                  : 'transparent';
              const color =
                d.status === 'present'
                  ? '#34D399'
                  : d.status === 'absent'
                  ? '#F87171'
                  : 'var(--text-muted)';

              return (
                <div
                  key={d.day}
                  style={{
                    padding: '8px 0',
                    borderRadius: '6px',
                    background: bg,
                    border: `1px solid ${border}`,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: color,
                  }}
                >
                  {d.day}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
