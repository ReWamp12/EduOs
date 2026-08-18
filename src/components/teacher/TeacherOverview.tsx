'use client';

import React from 'react';
import { mockProfiles, mockBatches, mockTimetable } from '@/lib/mockData';
import { 
  Users, 
  CalendarCheck2, 
  Sparkles, 
  ClipboardList, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  GraduationCap
} from 'lucide-react';

export const TeacherOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const teacher = mockProfiles.teacher;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(79, 70, 229, 0.15))',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <img
            src={teacher.avatarUrl}
            alt={teacher.firstName}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              objectFit: 'cover',
              border: '3px solid #06B6D4',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Welcome, {teacher.firstName} {teacher.lastName}!</h2>
              <span className="badge badge-primary">Senior Physics Faculty</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>
              Mentor &bull; <strong style={{ color: '#fff' }}>Class 11 - JEE Advanced Alpha</strong> &bull; Department of Physical Sciences
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('ai_question_studio')}
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #06B6D4, #4F46E5)', fontSize: '0.85rem' }}
        >
          <Sparkles size={16} /> Open AI Question Studio
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
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ASSIGNED BATCHES</span>
            <GraduationCap size={18} color="#06B6D4" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#06B6D4' }}>
            2 <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Batches</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            80 Total Enrolled Aspirants
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>TODAY&apos;S LECTURES</span>
            <Clock size={18} color="#4F46E5" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#818CF8' }}>
            3 <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Periods</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Period 1 (08:30 AM) in Hall 101
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ATTENDANCE STATUS</span>
            <CalendarCheck2 size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '12px', color: '#F59E0B' }}>
            Pending Check
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            JEE-11A Period 1 not submitted
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>BATCH AVG SCORE</span>
            <ClipboardList size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#10B981' }}>
            68.4%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            +3.2% vs previous unit test
          </div>
        </div>
      </div>

      {/* Main Sections: Quick Actions + AI Assistant Alert */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Today's Teaching Schedule */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Today&apos;s Assigned Classes</h3>
            <span className="badge badge-primary">Monday</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'rgba(79, 70, 229, 0.12)',
              border: '1px solid rgba(79, 70, 229, 0.4)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                  Class 11 - JEE Advanced Alpha (P1)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Physics: Rotational Dynamics &bull; Hall 101 &bull; 08:30 AM - 10:00 AM
                </div>
              </div>
              <button 
                onClick={() => onNavigate('attendance')}
                className="btn-primary" 
                style={{ fontSize: '0.8rem', padding: '8px 14px' }}
              >
                Mark Attendance
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Class 11 - JEE Advanced Alpha (P4)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Problem Solving Clinic &bull; Lab 2 &bull; 02:15 PM - 03:45 PM
                </div>
              </div>
              <span className="badge badge-primary">Scheduled</span>
            </div>
          </div>
        </div>

        {/* AI Teacher Assistant Insight Box */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#06B6D4" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI Classroom Diagnostic</h3>
          </div>

          <div style={{
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            lineHeight: 1.5,
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#06B6D4', marginBottom: '6px' }}>
              Attention Flag: JEE Batch 11A
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              &ldquo;23 students scored below 50% on Moment of Inertia integration problems in Test 03. 14 students show calculation slips rather than conceptual failure.&rdquo;
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <strong>Recommendation:</strong> Allocate 15 mins in Period 1 for step-by-step perpendicular axis theorem derivation before starting Rolling Friction.
          </div>

          <button
            onClick={() => onNavigate('ai_question_studio')}
            className="btn-secondary"
            style={{ width: '100%', marginTop: 'auto', fontSize: '0.85rem' }}
          >
            Generate Practice Worksheet <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
