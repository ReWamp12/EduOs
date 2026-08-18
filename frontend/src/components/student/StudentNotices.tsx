'use client';

import React, { useEffect, useState } from 'react';
import { dataService } from '@/lib/dataService';
import { Calendar } from 'lucide-react';

export const StudentNotices: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await dataService.getNotices();
      setNotices(data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Retrieving circular boards...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Circulars &amp; Official Notices</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Official Broadcasts from Academic Directorate &amp; Principal&apos;s Office
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {notices.map((n) => {
          const category = n.category || 'academic';
          return (
            <div
              key={n.id}
              className="glass-card"
              style={{
                padding: '22px 26px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                borderLeft: category === 'urgent' || category === 'emergency' ? '4px solid #EF4444' : category === 'exam' ? '4px solid #4F46E5' : '4px solid #06B6D4',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${category === 'urgent' || category === 'emergency' ? 'badge-danger' : category === 'exam' ? 'badge-primary' : 'badge-success'}`}>
                    {category.toUpperCase()}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{n.title}</h3>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> {new Date(n.createdAt || n.created_at).toLocaleDateString()}
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {n.content}
              </p>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Issued by: <strong style={{ color: 'var(--text-primary)' }}>{n.author || 'Academic Administration'}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
