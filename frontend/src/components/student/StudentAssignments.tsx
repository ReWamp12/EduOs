'use client';

import React, { useEffect, useState } from 'react';
import { dataService } from '@/lib/dataService';
import { FileText, Clock, CheckCircle2, Upload, AlertCircle, Check } from 'lucide-react';

export const StudentAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitSuccessId, setSubmitSuccessId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const data = await dataService.getAssignments('b-1');
      setAssignments(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleUpload = async (assignmentId: string) => {
    // Send simulated homework upload parameters to NestJS backend
    await dataService.submitAssignment({
      assignmentId,
      studentId: 's-1',
      submissionUrl: `https://supabase-storage.co/submissions/std-1-asg-${assignmentId}.pdf`,
    });

    // Update frontend state
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, status: 'submitted' } : a)),
    );

    setSubmitSuccessId(assignmentId);
    setTimeout(() => setSubmitSuccessId(null), 3000);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading assignment sheets...
      </div>
    );
  }

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
        {assignments.map((a) => {
          const status = a.status || 'pending';
          return (
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
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-primary">{a.subjectName || 'General'}</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{a.title}</h3>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
                  {a.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> Due: <strong style={{ color: status === 'pending' ? '#F59E0B' : 'var(--text-primary)' }}>{new Date(a.dueDate).toLocaleDateString()}</strong>
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

                {submitSuccessId === a.id && (
                  <div style={{ color: '#34D399', fontSize: '0.8rem', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} /> Assignment submission uploaded successfully to Supabase storage buckets!
                  </div>
                )}
              </div>

              <div style={{ marginLeft: '20px' }}>
                {status === 'pending' ? (
                  <button onClick={() => handleUpload(a.id)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                    <Upload size={16} /> Submit Solution
                  </button>
                ) : status === 'submitted' ? (
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
          );
        })}
      </div>
    </div>
  );
};
