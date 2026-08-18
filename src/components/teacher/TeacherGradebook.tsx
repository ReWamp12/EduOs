'use client';

import React, { useState } from 'react';
import { mockStudentsInBatch } from '@/lib/mockData';
import { ClipboardList, ShieldCheck, Check, Send, Sparkles, Download, Lock, Unlock } from 'lucide-react';

export const TeacherGradebook: React.FC = () => {
  const [isPublished, setIsPublished] = useState(false);
  const [scores, setScores] = useState<Record<string, { physics: number; chemistry: number; maths: number }>>({
    'std-aarav-01': { physics: 84, chemistry: 76, maths: 88 },
    'std-02': { physics: 68, chemistry: 72, maths: 65 },
    'std-03': { physics: 92, chemistry: 90, maths: 94 },
    'std-04': { physics: 52, chemistry: 58, maths: 48 },
    'std-05': { physics: 78, chemistry: 80, maths: 75 },
  });

  const handleScoreChange = (id: string, subject: 'physics' | 'chemistry' | 'maths', val: number) => {
    setScores((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [subject]: val,
      },
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Gradebook &amp; Result Publishing Gate</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            All-India Mock Test 03 &bull; Class 11 - JEE Advanced Alpha &bull; Total Marks: 360 (PCM)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={() => setIsPublished(!isPublished)}
            className="btn-primary"
            style={{
              fontSize: '0.85rem',
              background: isPublished ? 'linear-gradient(135deg, #10B981, #06B6D4)' : 'linear-gradient(135deg, #F59E0B, #EF4444)',
            }}
          >
            {isPublished ? <Unlock size={16} /> : <Lock size={16} />}
            {isPublished ? 'Grades Published to Parents' : 'Publish to Student & Parent Portals'}
          </button>
        </div>
      </div>

      {/* Security Gate Notice */}
      <div style={{
        padding: '14px 18px',
        background: isPublished ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        border: `1px solid ${isPublished ? '#10B981' : '#F59E0B'}`,
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '0.88rem',
      }}>
        <ShieldCheck size={20} color={isPublished ? '#10B981' : '#F59E0B'} />
        <div>
          <strong style={{ color: isPublished ? '#34D399' : '#FBBF24' }}>
            {isPublished ? 'Gate Status: LIVE & VISIBLE' : 'Gate Status: DRAFT & LOCKED'}
          </strong>
          <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
            {isPublished
              ? 'Results are visible to students & parents with AI test diagnostic analysis enabled.'
              : 'Grades are locked for faculty review. Click Publish when finalized.'}
          </span>
        </div>
      </div>

      {/* Grade Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>STUDENT</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>ROLL</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>PHYSICS (/120)</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>CHEMISTRY (/120)</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>MATHS (/120)</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>TOTAL SCORE (/360)</th>
            </tr>
          </thead>
          <tbody>
            {mockStudentsInBatch.map((student) => {
              const currentScore = scores[student.id] || { physics: 70, chemistry: 70, maths: 70 };
              const total = currentScore.physics + currentScore.chemistry + currentScore.maths;
              const pct = ((total / 360) * 100).toFixed(1);

              return (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={student.avatarUrl}
                      alt={student.name}
                      style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{student.name}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{student.rollNumber}</td>
                  
                  {/* Physics input */}
                  <td style={{ padding: '14px 16px' }}>
                    <input
                      type="number"
                      value={currentScore.physics}
                      onChange={(e) => handleScoreChange(student.id, 'physics', Number(e.target.value))}
                      style={{
                        width: '70px',
                        padding: '6px 10px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    />
                  </td>

                  {/* Chemistry input */}
                  <td style={{ padding: '14px 16px' }}>
                    <input
                      type="number"
                      value={currentScore.chemistry}
                      onChange={(e) => handleScoreChange(student.id, 'chemistry', Number(e.target.value))}
                      style={{
                        width: '70px',
                        padding: '6px 10px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    />
                  </td>

                  {/* Maths input */}
                  <td style={{ padding: '14px 16px' }}>
                    <input
                      type="number"
                      value={currentScore.maths}
                      onChange={(e) => handleScoreChange(student.id, 'maths', Number(e.target.value))}
                      style={{
                        width: '70px',
                        padding: '6px 10px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    />
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent)' }}>
                      {total}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      ({pct}%)
                    </span>
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
