'use client';

import React, { useState } from 'react';
import { Student } from '@/lib/types';
import { mockTenant } from '@/lib/mockData';
import { useAppStore } from '@/lib/store';
import { Badge, ProgressBar, Card, SectionCard, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  X,
  IdCard,
  QrCode,
  ShieldCheck,
  Download,
  Printer,
  Sparkles,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Calendar,
  HeartPulse,
  Award,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  CreditCard,
  BookOpen,
} from 'lucide-react';

interface Props {
  student: Student | null;
  onClose: () => void;
  viewerRole: 'teacher' | 'principal';
}

export const StudentProfileDetailModal: React.FC<Props> = ({ student, onClose, viewerRole }) => {
  if (!student) return null;

  const { submissions, assignments } = useAppStore();
  const [activeTab, setActiveTab] = useState<'id_card' | 'academic' | 'parent' | 'personal'>('id_card');
  const [showQr, setShowQr] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Student submissions & performance metrics
  const studentSubs = submissions.filter((s) => s.studentName === student.name || s.studentId === student.id);
  const gradedSubs = studentSubs.filter((s) => s.status === 'graded');
  const batchAssignments = assignments.filter((a) => !a.batchName || a.batchName === student.batchName);

  const avgHomeworkScore = gradedSubs.length
    ? Math.round(gradedSubs.reduce((acc, curr) => acc + ((curr.obtainedMarks || 0) / curr.maxMarks) * 100, 0) / gradedSubs.length)
    : 88;

  const handleDownloadId = async () => {
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 600));
    setDownloading(false);
    toast('Digital ID Exported', 'success', `Saved ID card for ${student.name} as PDF.`);
  };

  const handlePrint = () => {
    toast('Print Queue', 'info', `Printing Digital Identity Card for ${student.name}.`);
  };

  const handleContactAction = (channel: 'call' | 'whatsapp' | 'email') => {
    if (channel === 'call') {
      toast('Calling Parent', 'info', `Dialing ${student.parentPhone} (${student.parentName})`);
    } else if (channel === 'whatsapp') {
      toast('WhatsApp Channel', 'success', `Opening chat with ${student.parentName} (${student.parentPhone})`);
    } else {
      toast('Email Drafted', 'info', `Composing email to ${student.parentEmail || 'guardian@gmail.com'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in">
        {/* Modal Topbar */}
        <div className="flex items-center justify-between border-b border-border bg-surface-muted px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src={student.avatarUrl}
              alt={student.name}
              className="h-11 w-11 rounded-lg object-cover ring-2 ring-primary/20 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-section font-bold text-foreground">{student.name}</h3>
                <Badge tone="primary">{student.batchName.split(' - ')[0]}</Badge>
                <Badge tone="success"><ShieldCheck size={12} /> Active Student</Badge>
              </div>
              <p className="text-micro text-text-tertiary">
                Roll: <strong className="text-foreground">{student.rollNumber}</strong> · Adm No: <strong className="text-foreground">{student.admissionNumber}</strong> · {viewerRole === 'principal' ? 'Institution Roster' : 'Class Roster'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary hover:bg-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-surface px-6">
          <div className="flex gap-2">
            {[
              { id: 'id_card', label: 'Digital Identity Card', icon: <IdCard size={15} /> },
              { id: 'academic', label: 'Academic Standing', icon: <GraduationCap size={15} /> },
              { id: 'parent', label: 'Parent & Guardian Info', icon: <Phone size={15} /> },
              { id: 'personal', label: 'Personal & Records', icon: <HeartPulse size={15} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 border-b-2 py-3 px-3.5 text-meta font-medium transition-all',
                  activeTab === tab.id
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-text-secondary hover:text-foreground',
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface">
          {/* ========================================================================= */}
          {/* TAB 1: DIGITAL HOLOGRAPHIC ID CARD */}
          {/* ========================================================================= */}
          {activeTab === 'id_card' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
              {/* Holographic ID Pass Container */}
              <div className="flex flex-col items-center gap-4">
                <div
                  className="holo-card w-full max-w-[380px] rounded-[20px] p-6 shadow-2xl"
                  style={{ color: '#fff' }}
                >
                  {/* Card Header */}
                  <div
                    className="flex items-center justify-between pb-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="grid h-8 w-8 place-items-center rounded-lg text-base font-extrabold"
                        style={{ background: 'linear-gradient(135deg, #4F46E5, #06B6D4)' }}
                      >
                        M
                      </div>
                      <div>
                        <div className="text-sm font-extrabold tracking-tight">{mockTenant.name}</div>
                        <div className="text-[0.68rem]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          CBSE Affiliation No. 1030492 · 2026–27
                        </div>
                      </div>
                    </div>
                    <ShieldCheck size={22} color="#34D399" />
                  </div>

                  {/* Photo & Identity Details */}
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
                        {student.batchName.split(' - ')[0]}
                      </div>
                      <div className="mt-1 text-[0.75rem]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        Roll: <strong style={{ color: '#fff' }}>{student.rollNumber}</strong>
                      </div>
                      <div className="text-[0.75rem]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        Adm No: <strong>{student.admissionNumber}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Bar */}
                  <div
                    className="mt-4 grid grid-cols-2 gap-2 rounded-[10px] p-3 text-[0.76rem]"
                    style={{ background: 'rgba(0,0,0,0.3)' }}
                  >
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>Blood Group:</span>
                      <div className="font-bold" style={{ color: '#fff' }}>
                        {student.bloodGroup || 'O+ Positive'}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>Emergency Contact:</span>
                      <div className="font-bold truncate" style={{ color: '#fff' }}>
                        {student.parentPhone}
                      </div>
                    </div>
                  </div>

                  {/* QR Authentication Box */}
                  <div
                    className="mt-4 flex items-center justify-between rounded-[12px] p-2.5 px-3.5"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.25)' }}
                  >
                    <div>
                      <div className="flex items-center gap-1 text-[0.75rem] font-bold" style={{ color: '#34D399' }}>
                        <Sparkles size={12} /> Live RFID / Dynamic QR
                      </div>
                      <div className="mt-0.5 text-[0.68rem]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {showQr ? student.qrCodeId : 'Tap “Reveal QR” to scan'}
                      </div>
                    </div>
                    <div className="grid h-[54px] w-[54px] place-items-center rounded-lg bg-white shadow-xs">
                      {showQr ? (
                        <QrCode size={42} color="#000" />
                      ) : (
                        <QrCode size={42} color="#000" style={{ filter: 'blur(3px)', opacity: 0.5 }} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="flex flex-wrap justify-center gap-2">
                  <button className="btn-primary py-1.5 text-meta" onClick={handleDownloadId} disabled={downloading}>
                    <Download size={15} /> {downloading ? 'Saving…' : 'Download Pass'}
                  </button>
                  <button className="btn-secondary py-1.5 text-meta" onClick={handlePrint}>
                    <Printer size={15} /> Print Card
                  </button>
                  <button className="btn-secondary py-1.5 text-meta" onClick={() => setShowQr((v) => !v)}>
                    <QrCode size={15} /> {showQr ? 'Hide QR' : 'Reveal QR'}
                  </button>
                </div>
              </div>

              {/* ID Metadata Breakdown Panel */}
              <div className="flex flex-col gap-4">
                <Card className="p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-section font-semibold text-foreground border-b border-border pb-3">
                    <ShieldCheck size={18} className="text-primary" />
                    <span>Official Identity Verification Dossier</span>
                  </div>

                  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 text-meta">
                    <div>
                      <dt className="eyebrow">Student Full Name</dt>
                      <dd className="mt-0.5 font-semibold text-foreground">{student.name}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow">Institutional Roll Number</dt>
                      <dd className="mt-0.5 font-semibold text-foreground">{student.rollNumber}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow">CBSE Admission Number</dt>
                      <dd className="mt-0.5 font-semibold text-foreground">{student.admissionNumber}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow">Allocated Class & Section</dt>
                      <dd className="mt-0.5 font-semibold text-foreground">{student.batchName}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow">Target Board Examination</dt>
                      <dd className="mt-0.5 font-semibold text-primary">{student.targetExam}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow">Digital QR ID Identifier</dt>
                      <dd className="mt-0.5 font-mono text-micro text-text-secondary">{student.qrCodeId}</dd>
                    </div>
                  </dl>

                  <div className="mt-2 rounded-lg border border-success/20 bg-success-soft p-4">
                    <div className="flex items-center gap-2 text-micro font-semibold uppercase tracking-wide text-success">
                      <CheckCircle2 size={15} /> Gate & Exam Terminal Clearance
                    </div>
                    <p className="mt-1 text-meta text-text-secondary">
                      This digital credential is authenticated for automated RFID turnstile entry, smart library borrowing, and CBSE board examination hall biometric check-in.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ACADEMIC STANDING & PERFORMANCE */}
          {/* ========================================================================= */}
          {activeTab === 'academic' && (
            <div className="flex flex-col gap-5">
              {/* Academic KPI Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Card className="p-4">
                  <div className="eyebrow">Attendance Rate</div>
                  <div className="mt-2 text-2xl font-bold text-foreground">{student.attendancePct}%</div>
                  <Badge tone={student.attendancePct >= 75 ? 'success' : 'warning'} className="mt-1">
                    {student.attendancePct >= 75 ? 'Board Eligible' : 'At Risk (<75%)'}
                  </Badge>
                </Card>

                <Card className="p-4">
                  <div className="eyebrow">Batch Standing</div>
                  <div className="mt-2 text-2xl font-bold text-foreground">Rank #{student.rankInBatch}</div>
                  <span className="text-micro text-text-tertiary">Top 5% in Kalam Section</span>
                </Card>

                <Card className="p-4">
                  <div className="eyebrow">Homework Turn-In</div>
                  <div className="mt-2 text-2xl font-bold text-foreground">{studentSubs.length}/{batchAssignments.length}</div>
                  <span className="text-micro text-text-tertiary">{gradedSubs.length} graded & verified</span>
                </Card>

                <Card className="p-4">
                  <div className="eyebrow">Avg Assignment Score</div>
                  <div className="mt-2 text-2xl font-bold text-foreground">{avgHomeworkScore}%</div>
                  <Badge tone="success" className="mt-1">Grade A+</Badge>
                </Card>
              </div>

              {/* Attendance Bar */}
              <SectionCard
                title="Attendance & Mandatory Board Eligibility"
                icon={<Clock size={18} />}
                bodyClassName="flex flex-col gap-3"
              >
                <div className="flex items-center justify-between text-meta">
                  <span className="font-semibold text-foreground">Cumulative Term Attendance: {student.attendancePct}%</span>
                  <span className="text-text-tertiary">CBSE Minimum Requirement: 75%</span>
                </div>
                <ProgressBar
                  value={student.attendancePct}
                  tone={student.attendancePct >= 85 ? 'success' : student.attendancePct >= 75 ? 'primary' : 'warning'}
                />
                <p className="text-micro text-text-secondary">
                  Student has fulfilled 168 of 180 required classroom sessions. Fully cleared for practical labs and final board examinations.
                </p>
              </SectionCard>

              {/* Submitted Homework Activity */}
              <SectionCard
                title="Recent Coursework & Evaluations"
                icon={<BookOpen size={18} />}
                bodyClassName="p-0"
              >
                {studentSubs.length === 0 ? (
                  <div className="p-6 text-center text-text-secondary text-meta">No assignments submitted yet.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {studentSubs.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-4">
                        <div>
                          <div className="font-semibold text-foreground">{sub.title}</div>
                          <div className="text-micro text-text-tertiary mt-0.5">
                            {sub.subject} · Max {sub.maxMarks} marks {sub.feedback ? `· Feedback: "${sub.feedback}"` : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          {sub.status === 'graded' ? (
                            <Badge tone="success">
                              Score {sub.obtainedMarks}/{sub.maxMarks} ({Math.round(((sub.obtainedMarks || 0) / sub.maxMarks) * 100)}%)
                            </Badge>
                          ) : (
                            <Badge tone="info">Under Faculty Review</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PARENT & GUARDIAN CONTACT */}
          {/* ========================================================================= */}
          {activeTab === 'parent' && (
            <div className="flex flex-col gap-5">
              <Card className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck size={18} className="text-primary" />
                    <h4 className="text-section font-semibold text-foreground">Registered Parent / Primary Guardian</h4>
                  </div>
                  <Badge tone="success">Verified Primary Contact</Badge>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-muted p-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary font-bold">
                      {student.parentName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-section font-semibold text-foreground">{student.parentName}</div>
                      <div className="text-meta text-text-secondary">Relation: {student.parentRelation || 'Guardian'}</div>
                      <div className="text-micro text-text-tertiary mt-1">Authorized for digital consent & PTM approvals</div>
                    </div>
                  </div>

                  {/* Direct Contact Actions */}
                  <div className="flex flex-col gap-2 justify-center">
                    <div className="text-micro font-semibold text-text-tertiary">Quick Direct Communication:</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleContactAction('call')}
                        className="btn-primary py-1.5 text-meta"
                      >
                        <Phone size={14} /> Call ({student.parentPhone})
                      </button>
                      <button
                        onClick={() => handleContactAction('whatsapp')}
                        className="btn-secondary py-1.5 text-meta text-success"
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </button>
                      <button
                        onClick={() => handleContactAction('email')}
                        className="btn-secondary py-1.5 text-meta"
                      >
                        <Mail size={14} /> Email Guardian
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Detailed Contact Directory */}
              <SectionCard title="Contact & Address Information" icon={<MapPin size={18} />} bodyClassName="p-0">
                <dl className="divide-y divide-border">
                  <div className="grid grid-cols-3 p-4 text-meta">
                    <dt className="font-medium text-text-tertiary">Primary Phone Number</dt>
                    <dd className="col-span-2 font-semibold text-foreground">{student.parentPhone}</dd>
                  </div>
                  <div className="grid grid-cols-3 p-4 text-meta">
                    <dt className="font-medium text-text-tertiary">Registered Email</dt>
                    <dd className="col-span-2 text-primary">{student.parentEmail || `${student.name.toLowerCase().replace(/\s+/g, '.')}.parent@gmail.com`}</dd>
                  </div>
                  <div className="grid grid-cols-3 p-4 text-meta">
                    <dt className="font-medium text-text-tertiary">Emergency Contact Line</dt>
                    <dd className="col-span-2 font-semibold text-destructive">{student.emergencyContact || student.parentPhone}</dd>
                  </div>
                  <div className="grid grid-cols-3 p-4 text-meta">
                    <dt className="font-medium text-text-tertiary">Residential Address</dt>
                    <dd className="col-span-2 text-text-secondary">{student.address || 'Flat 402, Block C, Pushp Vihar, New Delhi - 110017'}</dd>
                  </div>
                </dl>
              </SectionCard>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PERSONAL & ADMINISTRATIVE RECORDS */}
          {/* ========================================================================= */}
          {activeTab === 'personal' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <SectionCard title="Biographical & Medical Profile" icon={<HeartPulse size={18} />} bodyClassName="p-0">
                  <dl className="divide-y divide-border text-meta">
                    <div className="flex justify-between p-3.5">
                      <dt className="text-text-tertiary">Date of Birth</dt>
                      <dd className="font-semibold text-foreground">{student.dob || '14 May 2010'} (Age 16)</dd>
                    </div>
                    <div className="flex justify-between p-3.5">
                      <dt className="text-text-tertiary">Gender</dt>
                      <dd className="font-semibold text-foreground">{student.gender || 'Male'}</dd>
                    </div>
                    <div className="flex justify-between p-3.5">
                      <dt className="text-text-tertiary">Blood Group</dt>
                      <dd className="font-bold text-destructive">{student.bloodGroup || 'O+ Positive'}</dd>
                    </div>
                    <div className="flex justify-between p-3.5">
                      <dt className="text-text-tertiary">Medical Flags / Notes</dt>
                      <dd className="font-medium text-foreground">{student.medicalNotes || 'No known chronic allergies.'}</dd>
                    </div>
                  </dl>
                </SectionCard>

                <SectionCard title="Fee Status & Compliance" icon={<CreditCard size={18} />} bodyClassName="p-0">
                  <dl className="divide-y divide-border text-meta">
                    <div className="flex justify-between p-3.5">
                      <dt className="text-text-tertiary">Term Fee Status</dt>
                      <dd>
                        <Badge tone={student.feeStatus === 'paid' ? 'success' : student.feeStatus === 'partial' ? 'warning' : 'danger'}>
                          {student.feeStatus === 'paid' ? 'Fully Paid' : student.feeStatus === 'partial' ? 'Term 2 Pending' : 'Due'}
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between p-3.5">
                      <dt className="text-text-tertiary">CBSE Board Registration</dt>
                      <dd className="font-semibold text-success">Verified & Linked</dd>
                    </div>
                    <div className="flex justify-between p-3.5">
                      <dt className="text-text-tertiary">Aadhaar Authentication</dt>
                      <dd className="font-semibold text-success">Biometrics Verified</dd>
                    </div>
                    <div className="flex justify-between p-3.5">
                      <dt className="text-text-tertiary">Digital Parent Consent</dt>
                      <dd className="font-semibold text-foreground">Signed for 2026-27</dd>
                    </div>
                  </dl>
                </SectionCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
