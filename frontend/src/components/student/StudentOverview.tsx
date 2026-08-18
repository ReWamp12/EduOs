'use client';

import React, { useState, useEffect } from 'react';
import { dataService } from '@/lib/dataService';
import { Student } from '@/lib/types';
import { mockAssignments, mockExamResults, mockTimetable } from '@/lib/mockData';
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Flame, 
  BookOpen, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Award
} from 'lucide-react';

export const StudentOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    dataService.getStudentOverview('s-1').then((res) => {
      if (active) {
        setStudent(res);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  if (loading || !student) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'var(--text-secondary)' }}>
        Loading student profile data from isolated database schema...
      </div>
    );
  }

  const pendingAssignments = mockAssignments.filter((a) => a.status === 'pending');
  const latestExam = mockExamResults[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(6, 182, 212, 0.15))',
        border: '1px solid rgba(79, 70, 229, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <img
            src={student.avatarUrl}
            alt={student.name}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              objectFit: 'cover',
              border: '3px solid #4F46E5',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Welcome back, {student.name}!</h2>
              <span className="badge badge-warning" style={{ gap: '4px' }}>
                <Flame size={12} fill="#F59E0B" /> 14 Day Study Streak
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>
              {student.batchName} &bull; Roll: <strong style={{ color: '#fff' }}>{student.rollNumber}</strong> &bull; Target: <strong style={{ color: 'var(--accent)' }}>{student.targetExam}</strong>
            </p>
          </div>
        </div>

        <button 
          onClick={() => onNavigate('id_card')}
          className="btn-primary" 
          style={{ fontSize: '0.85rem' }}
        >
          <Award size={16} /> View Digital ID
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        {/* Attendance Metric */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ATTENDANCE RATE</span>
            <CheckCircle2 size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#10B981' }}>
            {student.attendancePct}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Eligible for JEE Board Exam (&gt;75% required)
          </div>
        </div>

        {/* Batch Rank Metric */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>BATCH STANDING</span>
            <Trophy size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#F59E0B' }}>
            Rank #{student.rankInBatch} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 38</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Top 8% in All-India Mock Tests
          </div>
        </div>

        {/* Pending Assignments Metric */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>PENDING HOMEWORK</span>
            <BookOpen size={18} color="#06B6D4" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#06B6D4' }}>
            {pendingAssignments.length} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>DPP due</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Physics Work-Energy due tomorrow
          </div>
        </div>

        {/* Next Exam Metric */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>NEXT MOCK TEST</span>
            <Calendar size={18} color="#818CF8" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '10px', color: '#818CF8' }}>
            This Sunday, 09:00 AM
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            All-India CBT Mock Test 04
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Timetable + AI Performance Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Today's Timetable */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="#4F46E5" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Today&apos;s Lecture Schedule</h3>
            </div>
            <span className="badge badge-primary">Monday Timetable</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mockTimetable.map((slot, index) => (
              <div
                key={slot.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: index === 0 ? 'rgba(79, 70, 229, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  border: index === 0 ? '1px solid rgba(79, 70, 229, 0.4)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: slot.subjectColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#fff',
                  }}>
                    P{slot.periodNumber}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {slot.subjectName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Faculty: {slot.teacherName} &bull; {slot.roomNumber}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {slot.startTime} - {slot.endTime}
                  </div>
                  {index === 0 && (
                    <span className="badge badge-success" style={{ fontSize: '0.65rem', marginTop: '4px' }}>
                      Live Next
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Performance Card */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#F59E0B" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI Diagnostic Summary</h3>
          </div>

          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FBBF24', marginBottom: '6px' }}>
              Latest Mock Test: {latestExam.examTitle}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              &ldquo;{latestExam.mistakeSummary}&rdquo;
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Action Areas for this week:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {latestExam.weakTopics.map((topic, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <AlertCircle size={14} color="#EF4444" />
                  {topic}
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onNavigate('exams')}
            className="btn-secondary" 
            style={{ width: '100%', marginTop: 'auto', fontSize: '0.85rem' }}
          >
            Detailed Scorecard & AI Review <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
