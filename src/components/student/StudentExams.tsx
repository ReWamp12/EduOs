'use client';

import React from 'react';
import { mockExamResults } from '@/lib/mockData';
import { Trophy, Award, Sparkles, AlertCircle, CheckCircle2, TrendingUp, Download } from 'lucide-react';

export const StudentExams: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Exams &amp; AI Diagnostic Scorecards</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            All-India Mock Test Performance, Percentiles &amp; Mistake Classifications
          </p>
        </div>
        <button className="btn-primary" style={{ fontSize: '0.85rem' }}>
          <Download size={16} /> Cumulative Transcript PDF
        </button>
      </div>

      {mockExamResults.map((exam) => (
        <div key={exam.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="badge badge-primary">{exam.subject}</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '6px' }}>{exam.examTitle}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Conducted on: {exam.examDate} &bull; CBT Examination Mode
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>
                {exam.marksObtained} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>/ {exam.totalMarks}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <span className="badge badge-success">
                  <TrendingUp size={12} /> {exam.percentile}%ile
                </span>
                <span className="badge badge-warning">
                  <Trophy size={12} /> Batch Rank #{exam.rankInBatch}
                </span>
              </div>
            </div>
          </div>

          {/* AI Diagnostic Insight Box */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(245, 158, 11, 0.08))',
            border: '1px solid rgba(79, 70, 229, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24', fontWeight: 700, fontSize: '0.9rem' }}>
              <Sparkles size={18} /> AI Test Analysis &amp; Mistake Pattern Detection:
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {exam.mistakeSummary}
            </p>
          </div>

          {/* Weak Topics Tagging */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Detected Revision Areas:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {exam.weakTopics.map((topic, index) => (
                <span key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}>
                  <AlertCircle size={14} /> {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
