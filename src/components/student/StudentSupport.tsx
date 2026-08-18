'use client';

import React, { useState } from 'react';
import { HelpCircle, Send, CheckCircle2, Compass, BookOpen, UserCheck, MessageSquare, Clock } from 'lucide-react';

interface Ticket {
  id: string;
  category: 'Academic Query' | 'Fee / Administrative' | 'LMS & Technical' | 'Counseling';
  subject: string;
  status: 'In Review' | 'Resolved' | 'Open';
  createdAt: string;
  reply?: string;
}

export const StudentSupport: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TCK-1092',
      category: 'Academic Query',
      subject: 'Clarification regarding Rotational Motion integration formulas',
      status: 'Resolved',
      createdAt: '2 days ago',
      reply: 'Prof. Amit Verma uploaded a step-by-step PDF handout to the LMS Classroom.',
    },
    {
      id: 'TCK-1099',
      category: 'Fee / Administrative',
      subject: 'Request for Bonafide Certificate for National Scholarship Portal',
      status: 'In Review',
      createdAt: 'Yesterday',
      reply: 'Front office is processing your document. It will appear in your Digital Wallet within 24h.',
    },
  ]);

  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<'Academic Query' | 'Fee / Administrative' | 'LMS & Technical' | 'Counseling'>('Academic Query');
  const [newDescription, setNewDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    const createdTicket: Ticket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      category: newCategory,
      subject: newSubject,
      status: 'Open',
      createdAt: 'Just now',
    };

    setTickets([createdTicket, ...tickets]);
    setNewSubject('');
    setNewDescription('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={26} color="#818CF8" /> Student Helpdesk &amp; Career Counseling Hub
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Direct support ticketing &bull; College guidance &bull; Academic mentoring requests
          </p>
        </div>
      </div>

      {submitted && (
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
          <CheckCircle2 size={18} /> Your support ticket has been submitted to the academic mentors!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Support Tickets & New Ticket Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* New Ticket Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="var(--primary)" /> Raise a Support Query
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>CATEGORY</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
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
                    <option value="Academic Query">Academic Subject Query</option>
                    <option value="Fee / Administrative">Fee / Document Request</option>
                    <option value="LMS & Technical">LMS &amp; App Support</option>
                    <option value="Counseling">Career Counseling Request</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>BRIEF SUBJECT</label>
                  <input
                    type="text"
                    placeholder="e.g. Need extra practice problems"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
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
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>DETAILS / EXPLANATION</label>
                <textarea
                  rows={3}
                  placeholder="Describe your doubt or request..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
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
                <Send size={15} /> Submit Query
              </button>
            </form>
          </div>

          {/* Ticket History */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px' }}>Recent Tickets &amp; Responses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tickets.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{t.subject}</span>
                    <span className={`badge ${t.status === 'Resolved' ? 'badge-success' : t.status === 'In Review' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                      {t.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>ID: {t.id}</span>
                    <span>&bull;</span>
                    <span>{t.category}</span>
                    <span>&bull;</span>
                    <span>{t.createdAt}</span>
                  </div>

                  {t.reply && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px 12px',
                      background: 'rgba(79, 70, 229, 0.1)',
                      borderLeft: '3px solid var(--primary)',
                      borderRadius: '4px',
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                    }}>
                      <strong style={{ color: '#fff' }}>Mentor Response:</strong> {t.reply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Career & Counseling Hub Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={22} color="#F59E0B" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Career &amp; College Advisory Hub</h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Explore stream roadmaps, cutoff benchmarks for Top Tier Engineering &amp; Medical colleges, and mentorship sessions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                padding: '12px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>JEE Advanced 2026 Strategy Guide</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Target Rank: Under 1,000 for IIT Bombay/Delhi CS &amp; Electrical
                </div>
              </div>

              <div style={{
                padding: '12px',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: '8px',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>NEET 2026 AIIMS Cutoff Matrix</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Physics &amp; Biology score threshold analysis
                </div>
              </div>
            </div>

            <button
              onClick={() => alert('Counseling request submitted. Dr. Meera from student advisory will contact you.')}
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.85rem', marginTop: '6px' }}
            >
              <UserCheck size={16} /> Request 1-on-1 Mentorship Slot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
