'use client';

import React, { useState } from 'react';
import { mockCurrentStudent, mockTenant } from '@/lib/mockData';
import { PageHeader, Card, Badge } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { QrCode, ShieldCheck, Download, Printer, Sparkles, IdCard } from 'lucide-react';

export const StudentIDCard: React.FC = () => {
  const student = mockCurrentStudent;
  const [showQr, setShowQr] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 700));
    setDownloading(false);
    toast('ID card downloaded', 'success', 'Saved to your wallet as PDF.');
  };

  const handlePrint = () => {
    toast('Print dialog opened', 'info', 'Sending digital ID to printer.');
  };

  const handleToggleQr = () => {
    setShowQr((v) => !v);
    toast(showQr ? 'QR hidden' : 'QR revealed', 'info', showQr ? undefined : 'Valid for gate & exam terminal.');
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Digital QR Identity Card"
        subtitle="Official student identity for campus gate entry, library & exam halls"
        actions={
          <Badge tone="success">
            <ShieldCheck size={14} /> Verified
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        {/* Holographic ID card (intentionally dark) */}
        <div className="flex flex-col items-center gap-5">
          <div className="holo-card w-full max-w-[380px] rounded-[20px] p-6" style={{ color: '#fff' }}>
            {/* Header */}
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="grid h-8 w-8 place-items-center rounded-lg text-base font-extrabold"
                  style={{ background: 'linear-gradient(135deg, #4F46E5, #06B6D4)' }}
                >
                  A
                </div>
                <div>
                  <div className="text-sm font-extrabold tracking-tight">{mockTenant.name}</div>
                  <div className="text-[0.68rem]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Academic Session 2026-2027
                  </div>
                </div>
              </div>
              <ShieldCheck size={22} color="#34D399" />
            </div>

            {/* Photo + details */}
            <div className="mt-4 flex items-center gap-4">
              <img
                src={student.avatarUrl}
                alt={student.name}
                className="h-[84px] w-[84px] rounded-[14px] object-cover"
                style={{ border: '2px solid #818CF8', boxShadow: '0 8px 16px rgba(0,0,0,0.4)' }}
              />
              <div>
                <h3 className="text-xl font-extrabold">{student.name}</h3>
                <div className="mt-0.5 text-xs font-semibold" style={{ color: '#818CF8' }}>
                  {student.batchName}
                </div>
                <div className="mt-1 text-[0.75rem]" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Roll: <strong style={{ color: '#fff' }}>{student.rollNumber}</strong>
                </div>
                <div className="text-[0.75rem]" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Adm No: {student.admissionNumber}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div
              className="mt-4 grid grid-cols-2 gap-2 rounded-[10px] p-3 text-[0.76rem]"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              <div>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Blood Group:</span>
                <div className="font-bold" style={{ color: '#fff' }}>
                  O+ Positive
                </div>
              </div>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Emergency Contact:</span>
                <div className="font-bold" style={{ color: '#fff' }}>
                  {student.parentPhone}
                </div>
              </div>
            </div>

            {/* QR */}
            <div
              className="mt-4 flex items-center justify-between rounded-[12px] p-2.5 px-3.5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)' }}
            >
              <div>
                <div className="flex items-center gap-1 text-[0.75rem] font-bold" style={{ color: '#34D399' }}>
                  <Sparkles size={12} /> Dynamic Auth QR
                </div>
                <div className="mt-0.5 text-[0.68rem]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {showQr ? student.qrCodeId : 'Tap “Show QR” to reveal'}
                </div>
              </div>
              <div className="grid h-[56px] w-[56px] place-items-center rounded-lg bg-white">
                {showQr ? (
                  <QrCode size={44} color="#000" />
                ) : (
                  <QrCode size={44} color="#000" style={{ filter: 'blur(4px)', opacity: 0.5 }} />
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-2.5">
            <button className="btn-primary" onClick={handleDownload} disabled={downloading}>
              <Download size={16} /> {downloading ? 'Saving…' : 'Download'}
            </button>
            <button className="btn-secondary" onClick={handlePrint}>
              <Printer size={16} /> Print
            </button>
            <button className="btn-secondary" onClick={handleToggleQr}>
              <QrCode size={16} /> {showQr ? 'Hide QR' : 'Show QR'}
            </button>
          </div>
        </div>

        {/* Details panel (light) */}
        <Card className="flex flex-col gap-5 p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary-soft text-primary">
              <IdCard size={16} />
            </span>
            <h3 className="text-section text-foreground">Identity Details</h3>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Full Name', value: student.name },
              { label: 'Roll Number', value: student.rollNumber },
              { label: 'Admission Number', value: student.admissionNumber },
              { label: 'Batch', value: student.batchName },
              { label: 'Target Exam', value: student.targetExam },
              { label: 'Email', value: student.email },
              { label: 'Guardian', value: student.parentName },
              { label: 'Emergency Contact', value: student.parentPhone },
            ].map((row) => (
              <div key={row.label}>
                <dt className="eyebrow">{row.label}</dt>
                <dd className="mt-1 text-meta font-medium text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-md border border-info/20 bg-info-soft p-4">
            <div className="flex items-center gap-2 text-micro font-semibold uppercase tracking-wide text-info">
              <ShieldCheck size={14} /> Access privileges
            </div>
            <p className="mt-1.5 text-meta text-text-secondary">
              This QR grants verified access to the campus gate, library check-in and exam terminal authentication.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
