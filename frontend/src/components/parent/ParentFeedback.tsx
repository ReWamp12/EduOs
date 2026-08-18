'use client';

import React, { useState } from 'react';
import { HeartPulse, MessageSquareQuote, Check, AlertTriangle, Send, PhoneCall, ShieldAlert, FileText } from 'lucide-react';

export const ParentFeedback: React.FC = () => {
  const [medicalInfo, setMedicalInfo] = useState({
    bloodGroup: 'B+',
    allergies: 'Peanuts, Dust (Mild Asthma)',
    emergencyContactName: 'Rajesh Sharma (Father)',
    emergencyPhone: '+91 98765 43210',
    doctorName: 'Dr. K. Patel (Pediatrician)',
    doctorPhone: '+91 98222 11000',
    specialInstructions: 'Carries inhaler in school bag. Allowed to take emergency dose if shortness of breath.',
  });

  const [feedbackCategory, setFeedbackCategory] = useState<'Infrastructure' | 'Academic' | 'Transport' | 'Staff / Administration'>('Academic');
  const [feedbackText, setFeedbackText] = useState('');
  const [medicalSaved, setMedicalSaved] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const [feedbackList, setFeedbackList] = useState([
    {
      id: 'FB-401',
      category: 'Transport',
      text: 'Morning Route 4 pickup arrived 10 mins late near SG Highway stop.',
      status: 'Reviewed & Resolved',
      resolution: 'Transport manager rerouted bus to bypass road construction. Timing restored.',
      date: 'Aug 14, 2026',
    },
  ]);

  const handleMedicalSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMedicalSaved(true);
    setTimeout(() => setMedicalSaved(false), 3500);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setFeedbackList([
      {
        id: `FB-${Math.floor(400 + Math.random() * 500)}`,
        category: feedbackCategory,
        text: feedbackText,
        status: 'Under Investigation',
        resolution: 'Assigned to School Administration for review.',
        date: 'Just now',
      },
      ...feedbackList,
    ]);

    setFeedbackText('');
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HeartPulse size={26} color="#EF4444" /> Emergency Medical Profile &amp; Feedback Desk
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Safeguarding health records &bull; Direct parental feedback and grievance submission
          </p>
        </div>
      </div>

      {medicalSaved && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          borderRadius: 'var(--radius-sm)',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
        }}>
          <Check size={18} /> Student medical profile and emergency contacts updated in campus infirmary registry.
        </div>
      )}

      {feedbackSent && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          borderRadius: 'var(--radius-sm)',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
        }}>
          <Check size={18} /> Feedback submitted. A tracking ticket has been routed to the Principal&apos;s office.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Medical & Emergency Profile Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ShieldAlert size={20} color="#EF4444" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Duty-of-Care Health &amp; Emergency Record</h3>
          </div>

          <form onSubmit={handleMedicalSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>BLOOD GROUP</label>
                <input
                  type="text"
                  value={medicalInfo.bloodGroup}
                  onChange={(e) => setMedicalInfo({ ...medicalInfo, bloodGroup: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '4px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>EMERGENCY PHONE</label>
                <input
                  type="text"
                  value={medicalInfo.emergencyPhone}
                  onChange={(e) => setMedicalInfo({ ...medicalInfo, emergencyPhone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '4px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>KNOWN ALLERGIES / CONDITIONS</label>
              <input
                type="text"
                value={medicalInfo.allergies}
                onChange={(e) => setMedicalInfo({ ...medicalInfo, allergies: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '4px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>SPECIAL INSTRUCTIONS FOR INFIRMARY / TEACHERS</label>
              <textarea
                rows={2}
                value={medicalInfo.specialInstructions}
                onChange={(e) => setMedicalInfo({ ...medicalInfo, specialInstructions: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '4px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  resize: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ alignSelf: 'flex-start', fontSize: '0.85rem', background: '#EF4444' }}
            >
              <Check size={16} /> Save Emergency Profile
            </button>
          </form>
        </div>

        {/* Feedback / Complaint Submission & Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <MessageSquareQuote size={20} color="#F59E0B" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Submit Feedback / Grievance</h3>
            </div>

            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOPIC</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '4px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                >
                  <option value="Academic">Academic Pacing &amp; Homework</option>
                  <option value="Transport">Bus Route &amp; Transportation</option>
                  <option value="Infrastructure">Classroom &amp; Canteen Infrastructure</option>
                  <option value="Staff / Administration">Staff &amp; Administrative Services</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>FEEDBACK DETAILS</label>
                <textarea
                  rows={2}
                  placeholder="Enter your suggestion or concern..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '4px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem',
                    resize: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ alignSelf: 'flex-start', fontSize: '0.85rem' }}
              >
                <Send size={15} /> Send to Leadership
              </button>
            </form>
          </div>

          {/* Feedback History */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Previous Submissions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {feedbackList.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span style={{ color: 'var(--accent)' }}>{item.category}</span>
                    <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>{item.status}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#fff', marginTop: '4px' }}>{item.text}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Resolution: {item.resolution}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
