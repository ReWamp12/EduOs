'use client';

import React, { useState } from 'react';
import { mockPTMSlots } from '@/lib/mockData';
import { Calendar, Video, MapPin, Check, Clock } from 'lucide-react';

export const ParentPTM: React.FC = () => {
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);

  const handleBook = (slot: string, teacher: string) => {
    setBookedSlot(`Confirmed appointment with ${teacher} at ${slot}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Parent-Teacher Meeting (PTM) Scheduler</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Schedule 1-on-1 consultations with faculty mentors (In-Person or Video Call)
        </p>
      </div>

      {bookedSlot && (
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
          <Check size={18} /> {bookedSlot}. Calendar invite &amp; video link dispatched.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {mockPTMSlots.map((ptm) => (
          <div key={ptm.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span className="badge badge-primary">{ptm.subject}</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '6px' }}>{ptm.teacherName}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Video size={13} /> {ptm.mode}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Available Saturday Slots:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ptm.availableSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleBook(slot, ptm.teacherName)}
                    className="btn-secondary"
                    style={{
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="var(--primary)" /> {slot}
                    </span>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      Book Slot
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
