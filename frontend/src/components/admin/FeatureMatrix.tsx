'use client';

import React, { useState } from 'react';
import { Sliders, Check, Sparkles, Shield, Bus, Home, BookOpen, IndianRupee } from 'lucide-react';

export const FeatureMatrix: React.FC = () => {
  const [features, setFeatures] = useState<Record<string, boolean>>({
    lms: true,
    attendance: true,
    exams: true,
    finance: true,
    ai_intelligence: true,
    transport_gps: false,
    hostel: false,
    statutory_compliance: true,
    social_media: true,
    alumni: false,
  });

  const toggle = (key: string) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const featureList = [
    { key: 'lms', label: 'LMS & Video Lessons', desc: 'Host video lectures, DPPs, and chapter notes', icon: <BookOpen size={18} color="#4F46E5" /> },
    { key: 'attendance', label: 'Digital Attendance & QR', desc: 'Period attendance with instant parent alerts', icon: <Check size={18} color="#10B981" /> },
    { key: 'exams', label: 'CBT Exam Engine & Gradebook', desc: 'Mock tests, scorecards, and report card publishing gate', icon: <Sparkles size={18} color="#06B6D4" /> },
    { key: 'finance', label: 'Finance, Fees & POS Cashier', desc: 'Installment invoicing, UPI checkout, and receipts', icon: <IndianRupee size={18} color="#F59E0B" /> },
    { key: 'ai_intelligence', label: 'AI Intelligence Tier', desc: 'Question paper generator, mistake diagnosis, management NLP', icon: <Sparkles size={18} color="#8B5CF6" /> },
    { key: 'transport_gps', label: 'Transport & GPS Tracking', desc: 'Bus route optimization and driver license alerts', icon: <Bus size={18} color="#EF4444" /> },
    { key: 'hostel', label: 'Hostel & Mess Management', desc: 'Bed allocation and resident gate-pass consent', icon: <Home size={18} color="#EC4899" /> },
    { key: 'statutory_compliance', label: 'Statutory Compliance Engine', desc: 'UDISE+ export, CBSE/RTE registers, POCSO vaults', icon: <Shield size={18} color="#14B8A6" /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Feature Flag &amp; Module Matrix</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Tenant: <strong style={{ color: '#fff' }}>Apex Institute of Science</strong> &bull; Pro Tier Subscription
          </p>
        </div>

        <button className="btn-primary" style={{ fontSize: '0.85rem' }}>
          <Check size={16} /> Save Feature Preset
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
      }}>
        {featureList.map((f) => {
          const isEnabled = features[f.key];
          return (
            <div
              key={f.key}
              onClick={() => toggle(f.key)}
              className="glass-card glass-card-interactive"
              style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderColor: isEnabled ? 'rgba(79, 70, 229, 0.4)' : 'var(--border-subtle)',
                background: isEnabled ? 'rgba(79, 70, 229, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {f.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: isEnabled ? '#fff' : 'var(--text-secondary)' }}>
                    {f.label}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    {f.desc}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <div style={{
                width: '42px',
                height: '24px',
                borderRadius: '12px',
                background: isEnabled ? '#4F46E5' : 'rgba(255, 255, 255, 0.1)',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isEnabled ? 'flex-end' : 'flex-start',
                transition: 'all 0.2s ease',
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
