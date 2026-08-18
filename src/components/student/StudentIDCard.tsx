'use client';

import React from 'react';
import { mockCurrentStudent, mockTenant } from '@/lib/mockData';
import { QrCode, ShieldCheck, Download, Share2, Sparkles } from 'lucide-react';

export const StudentIDCard: React.FC = () => {
  const student = mockCurrentStudent;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', padding: '10px 0' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Institutional Digital QR Identity Card</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Official Student Identity for Campus Gate Entry, Library &amp; Exam Halls
        </p>
      </div>

      {/* Holographic ID Card */}
      <div
        className="holo-card"
        style={{
          width: '380px',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          color: '#fff',
        }}
      >
        {/* Header: Logo & Institution */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
            }}>
              A
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                {mockTenant.name}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Academic Session 2026-2027
              </div>
            </div>
          </div>
          <ShieldCheck size={22} color="#34D399" />
        </div>

        {/* Student Photo & Details */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <img
            src={student.avatarUrl}
            alt={student.name}
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '14px',
              objectFit: 'cover',
              border: '2px solid #818CF8',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
            }}
          />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{student.name}</h3>
            <div style={{ fontSize: '0.8rem', color: '#818CF8', fontWeight: 600, marginTop: '2px' }}>
              {student.batchName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '4px' }}>
              Roll: <strong style={{ color: '#fff' }}>{student.rollNumber}</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              Adm No: {student.admissionNumber}
            </div>
          </div>
        </div>

        {/* Metadata Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '12px',
          borderRadius: '10px',
          fontSize: '0.76rem',
        }}>
          <div>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Blood Group:</span>
            <div style={{ fontWeight: 700, color: '#fff' }}>O+ Positive</div>
          </div>
          <div>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Emergency Contact:</span>
            <div style={{ fontWeight: 700, color: '#fff' }}>{student.parentPhone}</div>
          </div>
        </div>

        {/* QR Code Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px dashed rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          padding: '10px 14px',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} /> Dynamic Auth QR
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
              Valid for Gate &amp; Exam Terminal
            </div>
          </div>

          <div style={{
            background: '#fff',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <QrCode size={44} color="#000" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn-primary" style={{ fontSize: '0.85rem' }}>
          <Download size={16} /> Save to Wallet / PDF
        </button>
        <button className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          <Share2 size={16} /> Share Digital Pass
        </button>
      </div>
    </div>
  );
};
