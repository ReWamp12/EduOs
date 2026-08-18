'use client';

import React from 'react';
import { ShieldCheck, Download, FileCheck, CheckCircle2, Building, ExternalLink } from 'lucide-react';

export const PrincipalInspection: React.FC = () => {
  const inspectionChecklist = [
    {
      code: 'REG-01',
      title: 'Admission & Withdrawal Master Register',
      authority: 'Board Affiliation Bye-Laws',
      status: 'Audited & Digital Sign Complete',
      validity: 'Current 2026-2027',
      isCompliant: true,
    },
    {
      code: 'REG-02',
      title: 'Daily Signed Attendance Registers (Period-Wise)',
      authority: 'Exam Eligibility Statutory Order',
      status: 'Synchronized Real-Time (93.8% avg)',
      validity: 'Daily Logged',
      isCompliant: true,
    },
    {
      code: 'SAF-01',
      title: 'Fire Safety No Objection Certificate (NOC)',
      authority: 'State Fire & Disaster Management Dept',
      status: 'Certificate #FIRE-AMD-2025-994',
      validity: 'Valid till 30 Nov 2026',
      isCompliant: true,
    },
    {
      code: 'SAF-02',
      title: 'Building Structural Stability Certificate',
      authority: 'Municipal Structural Engineer Authority',
      status: 'Certified Earthquake Resistant Zone 3',
      validity: 'Valid till 31 Mar 2028',
      isCompliant: true,
    },
    {
      code: 'HR-01',
      title: 'Staff Service Books & Police Verification',
      authority: 'Child Safeguarding Directives',
      status: '100% Faculty Police Verification on File',
      validity: 'Annual Check Complete',
      isCompliant: true,
    },
    {
      code: 'POCSO-01',
      title: 'Child Protection & Internal Complaints Committee',
      authority: 'POCSO Act 2012 / POSH Act 2013',
      status: '5-Member Committee Constituted with NGO Rep',
      validity: 'Tenure active till 2027',
      isCompliant: true,
    },
    {
      code: 'PUB-01',
      title: 'Mandatory Public Disclosure Webpage',
      authority: 'CBSE / Board Mandatory Disclosure Standard',
      status: 'Live on apex.eduos.app/disclosure',
      validity: 'Real-time sync',
      isCompliant: true,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} color="#10B981" /> One-Click Board &amp; Statutory Inspection Mode
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Instant consolidated legal dossiers, mandatory registers, NOCs &amp; compliance certificates
          </p>
        </div>

        <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)', fontSize: '0.85rem' }}>
          <Download size={16} /> Export Inspector Dossier (PDF)
        </button>
      </div>

      {/* Compliance Health Score Banner */}
      <div style={{
        padding: '20px 24px',
        background: 'rgba(16, 185, 129, 0.12)',
        border: '1px solid #10B981',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.2rem',
          }}>
            100%
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34D399' }}>
              Institution is Fully Inspection Ready
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              All 7 mandatory legal registers, safety NOCs, and committee mandates are verified and active.
            </p>
          </div>
        </div>

        <span className="badge badge-success" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          Green Status &bull; Zero Violations
        </span>
      </div>

      {/* Register List */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)' }}>MANDATORY REGISTER / NOC</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>STATUTORY AUTHORITY</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>VERIFICATION AUDIT STATUS</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>VALIDITY</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>EVIDENCE</th>
            </tr>
          </thead>
          <tbody>
            {inspectionChecklist.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Code: {item.code}</div>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{item.authority}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399', fontWeight: 600 }}>
                    <CheckCircle2 size={15} /> {item.status}
                  </span>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {item.validity}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                    <FileCheck size={14} /> View File
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
