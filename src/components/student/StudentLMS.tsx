'use client';

import React, { useState } from 'react';
import { mockLMSLessons } from '@/lib/mockData';
import { PlayCircle, FileText, CheckCircle2, Download, BookOpen, Clock, Sparkles } from 'lucide-react';

export const StudentLMS: React.FC = () => {
  const [selectedLesson, setSelectedLesson] = useState(mockLMSLessons[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>LMS Digital Classroom</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Curriculum Lectures, Daily Practice Problems (DPP) &amp; Chapter Notes
          </p>
        </div>
        <span className="badge badge-primary">
          <BookOpen size={14} /> JEE Advanced Masterclass
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
        {/* Main Content Player / Viewer */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Simulated Video Player Screen */}
          <div style={{
            width: '100%',
            height: '320px',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
            border: '1px solid rgba(79, 70, 229, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
          }}>
            <PlayCircle size={64} color="#818CF8" style={{ cursor: 'pointer', filter: 'drop-shadow(0 4px 12px rgba(79,70,229,0.6))' }} />
            <div style={{ marginTop: '14px', fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
              {selectedLesson.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Duration: {selectedLesson.durationMinutes} Mins &bull; Faculty: Prof. Amit Verma
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <div>
              <span className="badge badge-primary">{selectedLesson.chapter}</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '8px' }}>
                {selectedLesson.title}
              </h3>
            </div>
            <button className="btn-primary" style={{ fontSize: '0.85rem' }}>
              <Download size={15} /> Download DPP PDF
            </button>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: '#fff' }}>Lecture Objectives:</strong>
            <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
              <li>Calculate torque about an instantaneous axis of rotation.</li>
              <li>Analyze pure rolling conditions with variable external friction.</li>
              <li>Conservation of angular momentum in inelastic rotational collisions.</li>
            </ul>
          </div>
        </div>

        {/* Playlist & Modules */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Course Modules &amp; DPPs</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mockLMSLessons.map((lesson) => {
              const isSelected = selectedLesson.id === lesson.id;
              return (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid #4F46E5' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {lesson.contentType === 'video' ? (
                      <PlayCircle size={18} color="#818CF8" />
                    ) : (
                      <FileText size={18} color="#06B6D4" />
                    )}
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {lesson.title.length > 34 ? lesson.title.substring(0, 34) + '...' : lesson.title}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {lesson.durationMinutes} mins &bull; {lesson.contentType.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {lesson.completed ? (
                    <CheckCircle2 size={18} color="#10B981" />
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Pending
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
