'use client';

import React, { useState } from 'react';
import { mockStudentsInBatch } from '@/lib/mockData';
import { Check, X, Clock, Send, Users, Sparkles, CheckCheck } from 'lucide-react';

export const TeacherAttendance: React.FC = () => {
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({
    'std-aarav-01': 'present',
    'std-02': 'present',
    'std-03': 'present',
    'std-04': 'absent',
    'std-05': 'present',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleStatus = (id: string, status: 'present' | 'absent' | 'late') => {
    setAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const markAllPresent = () => {
    const updated: Record<string, 'present' | 'absent' | 'late'> = {};
    mockStudentsInBatch.forEach((s) => {
      updated[s.id] = 'present';
    });
    setAttendance(updated);
  };

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length;
  const lateCount = Object.values(attendance).filter((s) => s === 'late').length;

  const handleSubmit = () => {
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Period Attendance Marking</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Class 11 - JEE Advanced Alpha &bull; Period 1 (Physics Mechanics) &bull; Hall 101
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={markAllPresent} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <CheckCheck size={16} /> Mark All Present
          </button>
          <button onClick={handleSubmit} className="btn-primary" style={{ fontSize: '0.85rem' }}>
            <Send size={16} /> Submit &amp; Alert Parents
          </button>
        </div>
      </div>

      {/* Submission Success Toast */}
      {isSubmitted && (
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
          animation: 'fadeIn 0.3s ease',
        }}>
          <Check size={20} />
          Attendance marked successfully! Domain event <code>attendance.marked</code> emitted &bull; {absentCount} WhatsApp parent absence notifications dispatched.
        </div>
      )}

      {/* Live Counter Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL ENROLLED</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {mockStudentsInBatch.length}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34D399' }}>PRESENT TODAY</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
            {presentCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F87171' }}>ABSENT (ALERTS FIRED)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>
            {absentCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FBBF24' }}>LATE CHECK-IN</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
            {lateCount}
          </div>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>STUDENT</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>ROLL NUMBER</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>HISTORICAL ATTENDANCE</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>PARENT CONTACT</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>STATUS TOGGLE</th>
            </tr>
          </thead>
          <tbody>
            {mockStudentsInBatch.map((student) => {
              const currentStatus = attendance[student.id] || 'present';
              return (
                <tr
                  key={student.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: currentStatus === 'absent' ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <td style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={student.avatarUrl}
                      alt={student.name}
                      style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{student.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Rank #{student.rankInBatch}</div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{student.rollNumber}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontWeight: 700,
                      color: student.attendancePct >= 90 ? '#10B981' : student.attendancePct >= 75 ? '#F59E0B' : '#EF4444',
                    }}>
                      {student.attendancePct}%
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {student.parentPhone}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', padding: '3px', gap: '4px' }}>
                      <button
                        onClick={() => toggleStatus(student.id, 'present')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: currentStatus === 'present' ? '#10B981' : 'transparent',
                          color: currentStatus === 'present' ? '#fff' : 'var(--text-muted)',
                        }}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => toggleStatus(student.id, 'absent')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: currentStatus === 'absent' ? '#EF4444' : 'transparent',
                          color: currentStatus === 'absent' ? '#fff' : 'var(--text-muted)',
                        }}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => toggleStatus(student.id, 'late')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: currentStatus === 'late' ? '#F59E0B' : 'transparent',
                          color: currentStatus === 'late' ? '#fff' : 'var(--text-muted)',
                        }}
                      >
                        Late
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
