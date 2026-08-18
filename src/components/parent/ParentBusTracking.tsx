'use client';

import React from 'react';
import { mockBusLiveTracking } from '@/lib/mockData';
import { Bus, MapPin, Phone, ShieldCheck, CheckCircle2, Navigation, Clock } from 'lucide-react';

export const ParentBusTracking: React.FC = () => {
  const bus = mockBusLiveTracking;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bus size={24} color="#06B6D4" /> Live GPS Bus Tracking &amp; RFID Boarding Logs
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {bus.routeNumber} &bull; Vehicle: <strong style={{ color: '#fff' }}>{bus.vehicleNumber}</strong>
          </p>
        </div>
        <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
          Live Satellite GPS Active
        </span>
      </div>

      {/* Live Map Screen Simulation */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          height: '280px',
          width: '100%',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
        }}>
          <Navigation size={48} color="#06B6D4" style={{ filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.8))' }} />
          <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '12px', color: '#fff' }}>
            ETA to Campus: {bus.etaMinutes} Minutes
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Current Speed: <strong style={{ color: '#34D399' }}>{bus.speedKmH} km/h</strong> &bull; Location: {bus.currentStop}
          </div>
        </div>

        {/* Driver Details & Vehicle Safety */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>DESIGNATED DRIVER</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{bus.driverName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Police Background Check: <strong style={{ color: '#10B981' }}>Verified</strong>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>VEHICLE SAFETY COMPLIANCE</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Speed Governor Installed &bull; CCTV Active &bull; Female Attendant on Route
            </div>
          </div>
        </div>

        {/* RFID Boarding History */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>
            Today&apos;s RFID Boarding &amp; Departure Events
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bus.rfidLogs.map((log, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#10B981" />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{log.event}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: {log.location}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#06B6D4' }}>{log.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
