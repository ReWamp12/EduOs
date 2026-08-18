'use client';

import React from 'react';
import { mockAssignments } from '@/lib/mockData';
import { FileText, Clock, CheckCircle2, Upload, AlertCircle } from 'lucide-react';

export const StudentAssignments: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Daily Practice Problems (DPP) &amp; Assignments</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Class 11 - JEE Advanced Alpha Problem Sets
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {mockAssignments.map((a) => (
          <div
            key={a.id}
            className="glass-card"
            style={{
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-primary">{a.subject}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{a.title}</h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> Due: <strong style={{ color: a.status === 'pending' ? '#F59E0B' : 'var(--text-primary)' }}>{a.dueDate}</strong>
                </span>
                <span>Max Marks: {a.maxMarks}</span>
                {a.obtainedMarks !== undefined && (
                  <span style={{ color: '#10B981', fontWeight: 700 }}>
                    Score: {a.obtainedMarks}/{a.maxMarks}
                  </span>
                )}
              </div>

              {a.feedback && (
                <div style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  borderLeft: '2px solid #10B981',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                }}>
                  <strong>Faculty Feedback:</strong> {a.feedback}
                </div>
              )}
            </div>

            <div>
              {a.status === 'pending' ? (
                <button className="btn-primary" style={{ fontSize: '0.85rem' }}>
                  <Upload size={16} /> Submit Solution
                </button>
              ) : a.status === 'submitted' ? (
                <span className="badge badge-warning" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                  <Clock size={14} /> Under Review
                </span>
              ) : (
                <span className="badge badge-success" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                  <CheckCircle2 size={14} /> Graded
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
