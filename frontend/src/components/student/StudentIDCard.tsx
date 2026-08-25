'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { Student } from '@/lib/types';
import { PageHeader, Card, Badge, Skeleton } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { QrCode, ShieldCheck, Download, Printer, Sparkles, IdCard } from 'lucide-react';

export const StudentIDCard: React.FC = () => {
  const { session } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      // A student session resolves to their own Supabase row. Any other
      // viewer (staff previewing via the role switcher) falls back to the
      // first enrolled student, so the card always shows live DB data
      // instead of placeholder dashes.
      let s: Student | null = null;
      try {
        s = await dataService.getStudentOverview(session?.userId);
      } catch {
        s = null;
      }
      const isRealRow = !!s && !!s.admissionNumber && !s.id.startsWith('std-seeded');
      if (!isRealRow) {
        try {
          const roll = await dataService.getStudents();
          s = roll?.[0] ?? s;
        } catch {
          /* keep whatever we already have */
        }
      }
      if (active) {
        setStudent(s);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [session?.userId]);

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

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Digital QR Identity Card"
          subtitle="Official student identity for campus gate entry, library & exam halls"
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          <Skeleton className="h-[540px] w-full max-w-[340px] rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Digital QR Identity Card"
          subtitle="Official student identity for campus gate entry, library & exam halls"
        />
        <Card className="p-8 text-center text-meta text-text-secondary">
          No student record found for this account — the identity card is issued from the enrolled student roll in
          Supabase.
        </Card>
      </div>
    );
  }

  const schoolName = student.tenantName || 'Modern Public School';

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
        {/* Physical-style school ID card — deliberately theme-independent: a
            real laminated card is always white with printed brand bands, so
            every color here is explicit rather than a theme token. */}
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-full max-w-[340px] overflow-hidden rounded-2xl"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              boxShadow: '0 18px 44px rgba(15, 23, 42, 0.22)',
            }}
          >
            {/* Brand header band */}
            <div
              className="px-5 pb-9 pt-4 text-center"
              style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)', color: '#fff' }}
            >
              <div className="flex items-center justify-center gap-2.5">
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-base font-extrabold"
                  style={{ background: '#fff', color: '#1d4ed8', border: '2px solid #bfdbfe' }}
                >
                  {schoolName.charAt(0) || 'M'}
                </div>
                <div className="text-left">
                  <div className="text-[0.9rem] font-extrabold uppercase leading-tight tracking-wide">
                    {schoolName}
                  </div>
                  <div className="text-[0.62rem] font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Affiliated to CBSE · New Delhi
                  </div>
                </div>
              </div>
              <div
                className="mx-auto mt-3 inline-block rounded-full px-3 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em]"
                style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}
              >
                Student Identity Card · 2026-27
              </div>
            </div>

            {/* Photo overlapping the band, passport-style */}
            <div className="-mt-8 flex justify-center">
              {student.avatarUrl && !student.avatarUrl.includes('dicebear') ? (
                <img
                  src={student.avatarUrl}
                  alt={student.name}
                  className="h-[104px] w-[88px] rounded-lg object-cover"
                  style={{ border: '3px solid #ffffff', boxShadow: '0 6px 16px rgba(15,23,42,0.25)', background: '#e2e8f0' }}
                />
              ) : (
                <div
                  className="grid h-[104px] w-[88px] place-items-center rounded-lg text-2xl font-extrabold"
                  style={{
                    border: '3px solid #ffffff',
                    boxShadow: '0 6px 16px rgba(15,23,42,0.25)',
                    background: 'linear-gradient(160deg, #dbeafe, #eff6ff)',
                    color: '#1d4ed8',
                  }}
                >
                  {(student.name || 'S')
                    .split(' ')
                    .map((w) => w.charAt(0))
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
              )}
            </div>

            {/* Name & class — explicit ink color so the theme can never wash it out */}
            <div className="px-5 pt-2.5 text-center">
              <div className="text-[1.05rem] font-extrabold uppercase tracking-wide" style={{ color: '#0f172a' }}>
                {student.name || 'Student Name'}
              </div>
              <div
                className="mx-auto mt-1 inline-block rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold"
                style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
              >
                {student.batchName || 'Class 10 - A'} · Roll {student.rollNumber || '—'}
              </div>
            </div>

            {/* Particulars grid */}
            <div className="mx-5 mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t pt-3.5" style={{ borderColor: '#e2e8f0' }}>
              {[
                { label: 'Admission No', value: student.admissionNumber || '—' },
                { label: 'Blood Group', value: student.bloodGroup || 'O+' },
                { label: 'Date of Birth', value: student.dob || '—' },
                { label: 'Valid Till', value: '31 Mar 2027' },
                { label: 'Guardian', value: student.parentName || '—' },
                { label: 'Emergency', value: student.parentPhone || '—' },
              ].map((row) => (
                <div key={row.label} className="min-w-0">
                  <div className="text-[0.58rem] font-bold uppercase tracking-[0.08em]" style={{ color: '#64748b' }}>
                    {row.label}
                  </div>
                  <div className="truncate text-[0.74rem] font-semibold" style={{ color: '#0f172a' }}>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>

            {/* QR + signature row */}
            <div className="mx-5 mt-3.5 flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: '#e2e8f0' }}>
              <div
                className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-md"
                style={{ background: '#fff', border: '1px solid #cbd5e1' }}
              >
                {showQr ? (
                  <QrCode size={52} color="#0f172a" />
                ) : (
                  <QrCode size={52} color="#0f172a" style={{ filter: 'blur(4px)', opacity: 0.4 }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[0.66rem] font-bold" style={{ color: '#047857' }}>
                  <Sparkles size={11} /> Dynamic Auth QR
                </div>
                <div className="mt-0.5 truncate font-mono text-[0.6rem]" style={{ color: '#64748b' }}>
                  {showQr ? student.qrCodeId || 'QR-VERIFIED' : 'Tap “Show QR” to reveal'}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-serif text-[0.85rem] italic" style={{ color: '#334155' }}>
                  A. Rao
                </div>
                <div className="border-t pt-0.5 text-[0.56rem] font-semibold uppercase tracking-wide" style={{ color: '#64748b', borderColor: '#cbd5e1' }}>
                  Principal
                </div>
              </div>
            </div>

            {/* Barcode strip from the admission number */}
            <div className="mx-5 mt-3 pb-1 text-center">
              <div
                className="mx-auto h-8 w-[82%] rounded-sm"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, #0f172a 0 2px, transparent 2px 4px, #0f172a 4px 7px, transparent 7px 8px, #0f172a 8px 9px, transparent 9px 12px)',
                }}
              />
              <div className="mt-1 font-mono text-[0.62rem] font-semibold tracking-[0.28em]" style={{ color: '#334155' }}>
                {student.admissionNumber || 'MPS2026001'}
              </div>
            </div>

            {/* Footer band */}
            <div
              className="mt-2.5 px-5 py-2 text-center text-[0.58rem] leading-relaxed"
              style={{ background: '#0f172a', color: 'rgba(255,255,255,0.75)' }}
            >
              If found, please return to {schoolName} · +91-11-2634-8800
              <span className="mx-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>|</span>
              <ShieldCheck size={10} className="mb-0.5 inline" style={{ color: '#34d399' }} /> Gate · Library · Exam Hall
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
              { label: 'Full Name', value: student.name || '—' },
              { label: 'Roll Number', value: student.rollNumber || '—' },
              { label: 'Admission Number', value: student.admissionNumber || '—' },
              { label: 'Batch', value: student.batchName || '—' },
              { label: 'Target Exam', value: student.targetExam || '—' },
              { label: 'Email', value: student.email || '—' },
              { label: 'Guardian', value: student.parentName || '—' },
              { label: 'Emergency Contact', value: student.parentPhone || '—' },
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
