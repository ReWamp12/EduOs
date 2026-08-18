'use client';

import React from 'react';
import { mockNotices } from '@/lib/mockData';
import { BellRing, Calendar, Tag, AlertCircle } from 'lucide-react';

export const StudentNotices: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Circulars &amp; Official Notices</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Official Broadcasts from Academic Directorate &amp; Principal&apos;s Office
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {mockNotices.map((n) => (
          <div
            key={n.id}
            className="glass-card"
            style={{
              padding: '22px 26px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderLeft: n.category === 'urgent' ? '4px solid #EF4444' : n.category === 'exam' ? '4px solid #4F46E5' : '4px solid #06B6D4',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${n.category === 'urgent' ? 'badge-danger' : n.category === 'exam' ? 'badge-primary' : 'badge-success'}`}>
                  {n.category.toUpperCase()}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{n.title}</h3>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> {n.date}
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {n.content}
            </p>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Issued by: <strong style={{ color: 'var(--text-primary)' }}>{n.author}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
