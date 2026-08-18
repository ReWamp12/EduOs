'use client';

import React, { useState } from 'react';
import { mockLeaveRequests } from '@/lib/mockData';
import { Check, X, Clock, Calendar, UserCheck, CheckCircle2 } from 'lucide-react';

export const PrincipalApprovals: React.FC = () => {
  const [requests, setRequests] = useState(mockLeaveRequests);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: action } : req))
    );
    setActionMessage(`Leave request has been ${action} and logged in the statutory audit register.`);
    setTimeout(() => setActionMessage(null), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Staff Leave Approvals Queue</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Executive Authority Sign-off for Teaching &amp; Non-Teaching Staff
          </p>
        </div>
      </div>

      {actionMessage && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          borderRadius: 'var(--radius-sm)',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600,
        }}>
          <CheckCircle2 size={18} /> {actionMessage}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {requests.map((req) => (
          <div
            key={req.id}
            className="glass-card"
            style={{
              padding: '22px 26px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{req.employeeName}</h3>
                <span className="badge badge-primary">{req.designation}</span>
                <span className={`badge ${req.status === 'approved' ? 'badge-success' : req.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                  {req.status.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '18px', marginTop: '6px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> Duration: <strong style={{ color: '#fff' }}>{req.startDate} to {req.endDate}</strong>
                </span>
                <span>Type: <strong>{req.leaveType}</strong></span>
                <span>Applied: {req.appliedAt}</span>
              </div>

              <div style={{ marginTop: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <strong>Reason:</strong> {req.reason}
              </div>
            </div>

            {req.status === 'pending' ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleAction(req.id, 'approved')}
                  className="btn-primary"
                  style={{ background: '#10B981', fontSize: '0.82rem', padding: '8px 14px' }}
                >
                  <Check size={16} /> Approve
                </button>
                <button
                  onClick={() => handleAction(req.id, 'rejected')}
                  className="btn-secondary"
                  style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)', fontSize: '0.82rem', padding: '8px 14px' }}
                >
                  <X size={16} /> Reject
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: req.status === 'approved' ? '#10B981' : '#EF4444' }}>
                Decision Logged
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
