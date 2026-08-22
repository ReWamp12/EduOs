'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  ClipboardCheck,
  Send,
  Eye,
  Check,
  X,
  ChevronRight,
  Mail,
  XCircle,
  FileCheck2,
  Clock,
  Sparkles,
  FileText,
  Download,
  Printer,
  ExternalLink,
} from 'lucide-react';
import { Card, Badge, cn } from '@/components/ui';
import { dataService } from '@/lib/dataService';
import { JobOpening, Applicant, ApplicantStage } from '@/lib/types';
import { mockTenant } from '@/lib/mockData';
import { toast } from '@/components/ui/toast';

const STAGES: { key: ApplicantStage; label: string }[] = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview_scheduled', label: 'Interview' },
  { key: 'offer_extended', label: 'Offer Extended' },
  { key: 'hired', label: 'Hired' },
];

type EmailModalType = 'shortlist' | 'rejection' | 'offer' | 'onboarding';

interface EmailModalState {
  isOpen: boolean;
  type: EmailModalType;
  applicant: Applicant | null;
  subject: string;
  body: string;
  interviewDate?: string;
  interviewTime?: string;
  offeredSalary?: string;
  proposedJoiningDate?: string;
}

export const HRCareersATS: React.FC = () => {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [newJobModalOpen, setNewJobModalOpen] = useState(false);
  const [scorecardModalApplicant, setScorecardModalApplicant] = useState<Applicant | null>(null);
  const [viewCandidateModal, setViewCandidateModal] = useState<Applicant | null>(null);

  // Email Notification Modal State
  const [emailModal, setEmailModal] = useState<EmailModalState>({
    isOpen: false,
    type: 'shortlist',
    applicant: null,
    subject: '',
    body: '',
    interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    interviewTime: '10:30 AM',
    offeredSalary: '₹7,50,000 P.A. (Level 8)',
    proposedJoiningDate: '2026-09-01',
  });

  const [newJobData, setNewJobData] = useState({
    title: '',
    department: 'Science & Senior Secondary',
    designationCategory: 'Teaching' as const,
    jobType: 'Full-time',
    experienceRequired: '2-5 years',
    salaryRange: '₹5,00,000 - ₹7,50,000 P.A.',
    description: '',
    requirements: '',
    location: 'Main Campus, New Delhi',
    positionsCount: 1,
    deadline: '2026-09-30',
  });

  const [scorecardForm, setScorecardForm] = useState({
    pedagogyScore: 4,
    subjectKnowledgeScore: 4,
    classroomManagementScore: 4,
    communicationScore: 4,
    recommendation: 'hire' as const,
    interviewerName: 'Principal Dr. Rajesh Iyer',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedJobs, fetchedApplicants] = await Promise.all([
        dataService.getJobs(),
        dataService.getApplicants(),
      ]);
      setJobs(fetchedJobs);
      setApplicants(fetchedApplicants);
    } catch (e) {
      console.error(e);
      toast('Failed to load recruitment data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobData.title || !newJobData.description) {
      toast('Please enter a job title and description', 'warning');
      return;
    }
    try {
      const created = await dataService.createJob(newJobData);
      setJobs([created, ...jobs]);
      setNewJobModalOpen(false);
      toast(`Vacancy "${created.title}" created`, 'success');
      setNewJobData({
        title: '',
        department: 'Science & Senior Secondary',
        designationCategory: 'Teaching',
        jobType: 'Full-time',
        experienceRequired: '2-5 years',
        salaryRange: '₹5,00,000 - ₹7,50,000 P.A.',
        description: '',
        requirements: '',
        location: 'Main Campus, New Delhi',
        positionsCount: 1,
        deadline: '2026-09-30',
      });
    } catch (e) {
      toast('Failed to create job vacancy', 'error');
    }
  };

  const handleStageChange = async (applicantId: string, newStage: ApplicantStage, extra?: any) => {
    try {
      const updated = await dataService.updateApplicantStage(applicantId, newStage, extra);
      setApplicants(applicants.map(a => (a.id === applicantId ? { ...a, stage: newStage, ...extra } : a)));
      if (newStage === 'hired') {
        toast(`Candidate ${updated.fullName} marked as Hired & Service Book created`, 'success');
      } else {
        toast(`Candidate moved to ${newStage.replace('_', ' ')}`, 'info');
      }
    } catch (e) {
      toast('Failed to update stage', 'error');
    }
  };

  const handleSubmitScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scorecardModalApplicant) return;
    try {
      const updated = await dataService.submitInterviewScorecard(scorecardModalApplicant.id, scorecardForm);
      setApplicants(prev => prev.map(a => (a.id === scorecardModalApplicant.id ? { ...a, ...updated } : a)));
      setScorecardModalApplicant(null);
      toast(`Scorecard saved (${updated?.scorecard?.overallRating || '4.0'}/5.0)`, 'success');
    } catch (e) {
      console.error('Scorecard submit error', e);
      toast('Failed to submit scorecard', 'error');
    }
  };

  // Open Email Trigger Modal
  const openEmailModal = (type: EmailModalType, applicant: Applicant) => {
    const schoolName = mockTenant.name;
    const roleTitle = applicant.jobTitle || 'Faculty Position';
    const interviewDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const joiningDate = '2026-09-01';
    const salary = applicant.offeredSalary || '₹7,50,000 P.A. (Level 8 7th CPC)';

    let subject = '';
    let body = '';

    if (type === 'shortlist') {
      subject = `Shortlisted for Demo & Interview Round: ${roleTitle} at ${schoolName}`;
      body = `Dear ${applicant.fullName},

We are pleased to inform you that your application for the position of ${roleTitle} at ${schoolName} has been shortlisted by our selection committee.

We invite you for a 30-minute Pedagogical Demo Class and Interview Round with our Academic Panel.

• Scheduled Date: ${interviewDate}
• Reporting Time: 10:30 AM IST
• Venue: Senior Academic Wing, Main Campus, ${schoolName}
• Topic of Demo: Any Senior Secondary CBSE core concept of your choice

Please confirm your availability by replying to this email. We look forward to meeting you.

Warm regards,
HR & Academic Recruitment Committee
${schoolName}`;
    } else if (type === 'rejection') {
      subject = `Application Status: ${roleTitle} at ${schoolName}`;
      body = `Dear ${applicant.fullName},

Thank you for your interest in ${schoolName} and for taking the time to apply for the position of ${roleTitle}.

Our selection committee reviewed your application and credentials with great care. While your academic qualifications and experience are commendable, we have decided to move forward with other candidates whose specific domain specialization more closely matches our immediate curriculum needs for this academic session.

We will keep your profile in our institutional talent registry for future faculty openings. We sincerely wish you the very best in your professional career.

Kind regards,
Human Resources Office
${schoolName}`;
    } else if (type === 'offer') {
      subject = `Formal Offer of Employment: ${roleTitle} - ${schoolName}`;
      body = `Dear ${applicant.fullName},

On behalf of ${schoolName}, we are delighted to extend a formal offer of appointment for the position of ${roleTitle}.

Following your outstanding performance in the demonstration and panel rounds, we are pleased to offer you the following terms:

• Designation: ${roleTitle}
• Approved Compensation (CTC): ${salary}
• Pay Scale Structure: Aligned with 7th Central Pay Commission (CPC) + DA & HRA
• Proposed Date of Joining: ${joiningDate}
• Reporting Authority: Principal / Head of Department

Please review the attached appointment terms and confirm your acceptance by signing and returning a scanned copy within 3 working days.

Congratulations and welcome to our academic family!

Warm regards,
Dr. Rajesh Iyer (Principal)
${schoolName}`;
    } else if (type === 'onboarding') {
      subject = `Offer Acceptance Confirmed & Day 1 Onboarding Instructions - ${schoolName}`;
      body = `Dear ${applicant.fullName},

We are thrilled to receive your signed acceptance for the role of ${roleTitle} at ${schoolName}!

Your onboarding is scheduled for ${joiningDate} at 08:30 AM at the Principal's Administrative Office.

Mandatory Day 1 Document Checklist for Statutory Service Book Registration:
1. Original Degree & Marksheets (10th, 12th, Graduation, B.Ed./Post-Graduation) + 2 sets of photocopies.
2. Police Verification Application Acknowledgment Receipt or Clearance Certificate.
3. Original PAN Card & Aadhaar Card.
4. Previous Institution Relieving Letter & Experience Certificates (if applicable).
5. 4 Passport-size photographs.

If you have any questions before your joining date, please contact the HR office at hr@eduos.school.

Warm regards,
HR & Faculty Onboarding Cell
${schoolName}`;
    }

    setEmailModal({
      isOpen: true,
      type,
      applicant,
      subject,
      body,
      interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      interviewTime: '10:30 AM',
      offeredSalary: salary,
      proposedJoiningDate: joiningDate,
    });
  };

  // Submit / Send Email & Advance Candidate Stage
  const handleSendEmailAndAdvance = async () => {
    if (!emailModal.applicant) return;
    const { applicant, type, offeredSalary, proposedJoiningDate } = emailModal;

    let targetStage: ApplicantStage = applicant.stage;
    let extraData: any = { emailDispatchedAt: new Date().toISOString() };

    if (type === 'shortlist') {
      targetStage = 'shortlisted';
    } else if (type === 'rejection') {
      // mark rejected
      targetStage = 'applied'; // or leave in current with rejection flag
      extraData = { isRejected: true, emailDispatchedAt: new Date().toISOString() };
    } else if (type === 'offer') {
      targetStage = 'offer_extended';
      extraData = { offeredSalary, proposedJoiningDate, emailDispatchedAt: new Date().toISOString() };
    } else if (type === 'onboarding') {
      targetStage = 'hired';
      extraData = { offeredSalary, proposedJoiningDate, emailDispatchedAt: new Date().toISOString() };
    }

    await handleStageChange(applicant.id, targetStage, extraData);
    setEmailModal(prev => ({ ...prev, isOpen: false }));
    toast(
      type === 'rejection'
        ? `Rejection notice dispatched to ${applicant.email}`
        : type === 'shortlist'
        ? `Shortlist invitation emailed to ${applicant.email}`
        : type === 'offer'
        ? `Formal Offer Letter dispatched to ${applicant.email}`
        : `Onboarding & Day 1 instructions dispatched to ${applicant.email}`,
      'success',
    );
  };

  // Open actual uploaded CV in a new window/tab safely
  const handleOpenResume = (applicant: Applicant) => {
    let resumeUrl = applicant.resumeUrl || '';

    // Check if the uploaded file dataUrl is stored in localStorage for this candidate
    if (typeof window !== 'undefined') {
      const emailKey = `eduos_resume_${applicant.email?.toLowerCase().trim()}`;
      const nameKey = `eduos_resume_${applicant.fullName?.toLowerCase().trim()}`;
      const stored =
        localStorage.getItem(emailKey) ||
        localStorage.getItem(nameKey) ||
        localStorage.getItem(`eduos_resume_${applicant.id}`);
      if (stored && stored.startsWith('data:')) {
        resumeUrl = stored;
      }
    }

    // 1. If it's a base64 data URI uploaded by the user
    if (resumeUrl && resumeUrl.startsWith('data:')) {
      try {
        const parts = resumeUrl.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'application/pdf';
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      } catch (err) {
        console.warn('Failed to convert dataUrl to blob, opening via iframe', err);
        const newWin = window.open();
        if (newWin) {
          newWin.document.write(`<iframe src="${resumeUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100vh;" allowfullscreen></iframe>`);
          newWin.document.close();
        }
        return;
      }
    }

    // 2. If it's a real live external URL (not the mock storage.eduos.io domain)
    if (
      resumeUrl &&
      resumeUrl.startsWith('http') &&
      !resumeUrl.includes('storage.eduos.io')
    ) {
      window.open(resumeUrl, '_blank');
      return;
    }

    // 3. If it's an old seed mock record without an uploaded file
    toast.info('No uploaded resume file found for this seed applicant. Please apply with a real PDF on /careers to view.');
  };

  // Filtered applicants
  const filteredApplicants = (applicants || []).filter(app => {
    if (!app || typeof app !== 'object') return false;
    const matchesJob = selectedJobId === 'all' || app.jobId === selectedJobId;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (app.fullName || '').toLowerCase().includes(q) ||
      (app.email || '').toLowerCase().includes(q) ||
      (app.jobTitle || '').toLowerCase().includes(q);
    return matchesJob && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Recruitment Pipeline & ATS</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage candidates with 1-click email dispatches (Shortlisting, Rejections, Offers & Onboarding).
          </p>
        </div>
        <button
          onClick={() => setNewJobModalOpen(true)}
          className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus size={14} /> Create Vacancy
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="filter-role" className="text-text-tertiary font-medium">Role:</label>
          <select
            id="filter-role"
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Vacancies ({(jobs || []).length})</option>
            {(jobs || []).filter(j => j && j.id).map(job => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-2.5 top-2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search candidate name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded border border-border bg-surface py-1 pl-8 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {STAGES.map(stage => {
          const stageApplicants = filteredApplicants.filter(a => a && a.stage === stage.key && !(a as any).isRejected);
          return (
            <div key={stage.key} className="rounded-lg border border-border bg-muted/20 flex flex-col min-h-[460px]">
              {/* Stage Header */}
              <div className="p-3 border-b border-border bg-surface/60 rounded-t-lg flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">{stage.label}</span>
                <span className="text-[11px] font-mono text-text-tertiary">{stageApplicants.length}</span>
              </div>

              {/* Candidate Cards */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                {stageApplicants.length === 0 ? (
                  <div className="py-12 text-center text-[11px] text-text-tertiary">No candidates</div>
                ) : (
                  stageApplicants.map(app => (
                    <div
                      key={app.id}
                      className="p-3 rounded border border-border bg-surface hover:border-border-strong transition-all shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-xs text-foreground truncate">{app.fullName}</h4>
                          <p className="text-[11px] text-text-secondary truncate mt-0.5">{app.jobTitle}</p>
                        </div>
                        {app.scorecard && (
                          <span className="shrink-0 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            ★ {app.scorecard.overallRating}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-text-tertiary space-y-0.5">
                        <div>{app.experienceYears} yrs exp • {app.highestQualification}</div>
                        <div className="truncate">{app.email}</div>
                      </div>

                      {app.offeredSalary && (
                        <div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                          Offer: {app.offeredSalary}
                        </div>
                      )}

                      {/* Action Triggers */}
                      <div className="pt-2 border-t border-border flex items-center justify-between">
                        <button
                          onClick={() => setViewCandidateModal(app)}
                          className="text-[11px] text-text-secondary hover:text-foreground font-medium"
                        >
                          Details
                        </button>

                        <div className="flex items-center gap-1">
                          {/* Rejection Quick Trigger (for any non-hired stage) */}
                          {stage.key !== 'hired' && (
                            <button
                              onClick={() => openEmailModal('rejection', app)}
                              title="Send Rejection Email"
                              className="rounded p-1 text-text-tertiary hover:text-red-600 hover:bg-red-500/10 transition-colors"
                            >
                              <XCircle size={13} />
                            </button>
                          )}

                          {/* Stage 1: Applied -> Shortlist with email */}
                          {stage.key === 'applied' && (
                            <button
                              onClick={() => openEmailModal('shortlist', app)}
                              className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 flex items-center gap-1"
                            >
                              <Mail size={10} /> Shortlist
                            </button>
                          )}

                          {/* Stage 2: Shortlisted -> Interview */}
                          {stage.key === 'shortlisted' && (
                            <button
                              onClick={() => handleStageChange(app.id, 'interview_scheduled')}
                              className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                            >
                              Schedule Demo
                            </button>
                          )}

                          {/* Stage 3: Interview Scheduled -> Scorecard & Extend Offer */}
                          {stage.key === 'interview_scheduled' && (
                            <>
                              <button
                                onClick={() => {
                                  setScorecardModalApplicant(app);
                                  if (app.scorecard) {
                                    setScorecardForm({
                                      pedagogyScore: app.scorecard.pedagogyScore,
                                      subjectKnowledgeScore: app.scorecard.subjectKnowledgeScore,
                                      classroomManagementScore: app.scorecard.classroomManagementScore,
                                      communicationScore: app.scorecard.communicationScore,
                                      recommendation: app.scorecard.recommendation as any,
                                      interviewerName: app.scorecard.interviewerName,
                                      notes: app.scorecard.notes,
                                    });
                                  }
                                }}
                                className="rounded bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground hover:bg-primary/90"
                              >
                                Scorecard
                              </button>

                              {app.scorecard && (
                                <button
                                  onClick={() => openEmailModal('offer', app)}
                                  className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 flex items-center gap-1"
                                >
                                  <Mail size={10} /> Offer
                                </button>
                              )}
                            </>
                          )}

                          {/* Stage 4: Offer Extended -> Send Onboarding / Confirm Hire */}
                          {stage.key === 'offer_extended' && (
                            <button
                              onClick={() => openEmailModal('onboarding', app)}
                              className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-emerald-700 flex items-center gap-1 shadow-xs"
                            >
                              <Check size={10} /> Onboard & Hire
                            </button>
                          )}

                          {stage.key === 'hired' && (
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle2 size={11} /> Hired
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: Email Dispatch Modal (Shortlist, Rejection, Offer, Onboard) */}
      {/* =================================================================== */}
      {emailModal.isOpen && emailModal.applicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-xl rounded-lg border border-border bg-surface p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-7 w-7 rounded grid place-items-center text-xs',
                    emailModal.type === 'shortlist'
                      ? 'bg-blue-500/10 text-blue-600'
                      : emailModal.type === 'rejection'
                      ? 'bg-red-500/10 text-red-600'
                      : emailModal.type === 'offer'
                      ? 'bg-purple-500/10 text-purple-600'
                      : 'bg-emerald-500/10 text-emerald-600',
                  )}
                >
                  <Mail size={14} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">
                    {emailModal.type === 'shortlist' && 'Send Shortlist & Demo Invitation Email'}
                    {emailModal.type === 'rejection' && 'Send Application Rejection Notice'}
                    {emailModal.type === 'offer' && 'Send Formal Offer Letter Email'}
                    {emailModal.type === 'onboarding' && 'Send Offer Acceptance & Onboarding Instructions'}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    To: <strong>{emailModal.applicant.fullName}</strong> ({emailModal.applicant.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
                className="text-text-tertiary hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Custom parameters (for offer) */}
            {emailModal.type === 'offer' && (
              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded border border-border text-xs">
                <div>
                  <label htmlFor="modal-annual-ctc" className="font-medium text-text-secondary block mb-1">Approved Annual CTC</label>
                  <input
                    id="modal-annual-ctc"
                    type="text"
                    value={emailModal.offeredSalary}
                    onChange={e => setEmailModal({ ...emailModal, offeredSalary: e.target.value })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="modal-joining-date" className="font-medium text-text-secondary block mb-1">Proposed Joining Date</label>
                  <input
                    id="modal-joining-date"
                    type="date"
                    value={emailModal.proposedJoiningDate}
                    onChange={e => setEmailModal({ ...emailModal, proposedJoiningDate: e.target.value })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Email Subject */}
            <div className="space-y-1 text-xs">
              <label htmlFor="email-subject-line" className="font-medium text-text-secondary block">Email Subject</label>
              <input
                id="email-subject-line"
                type="text"
                value={emailModal.subject}
                onChange={e => setEmailModal({ ...emailModal, subject: e.target.value })}
                className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground font-medium focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Email Body */}
            <div className="space-y-1 text-xs">
              <label htmlFor="email-body-text" className="font-medium text-text-secondary block">Email Message Body</label>
              <textarea
                id="email-body-text"
                rows={10}
                value={emailModal.body}
                onChange={e => setEmailModal({ ...emailModal, body: e.target.value })}
                className="w-full rounded border border-border bg-surface p-2.5 text-xs text-foreground font-mono leading-relaxed focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
              <span className="text-[11px] text-text-tertiary">
                Dispatches from official school email: <strong>hr@eduos.school</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
                  className="rounded border border-border px-3 py-1 text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendEmailAndAdvance}
                  className={cn(
                    'rounded px-3.5 py-1 text-xs font-medium text-white shadow-xs flex items-center gap-1.5 transition-colors',
                    emailModal.type === 'rejection' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90',
                  )}
                >
                  <Send size={12} /> Send Email & Update Stage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: Scorecard                                                  */}
      {/* =================================================================== */}
      {scorecardModalApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-semibold text-sm text-foreground">Interview Evaluation</h3>
                <p className="text-xs text-text-secondary">{scorecardModalApplicant.fullName}</p>
              </div>
              <button onClick={() => setScorecardModalApplicant(null)} className="text-text-tertiary hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitScorecard} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="scorecard-evaluator" className="font-medium text-text-secondary block mb-1">Evaluator</label>
                  <input
                    id="scorecard-evaluator"
                    type="text"
                    required
                    value={scorecardForm.interviewerName}
                    onChange={e => setScorecardForm({ ...scorecardForm, interviewerName: e.target.value })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="scorecard-recom" className="font-medium text-text-secondary block mb-1">Recommendation</label>
                  <select
                    id="scorecard-recom"
                    value={scorecardForm.recommendation}
                    onChange={e => setScorecardForm({ ...scorecardForm, recommendation: e.target.value as any })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="strong_hire">Strong Hire</option>
                    <option value="hire">Hire</option>
                    <option value="hold">Hold</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-2.5 bg-muted/30 p-3 rounded border border-border">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Pedagogy & Demo Class</span>
                  <span className="font-mono font-semibold text-foreground">{scorecardForm.pedagogyScore} / 5</span>
                </div>
                <input
                  aria-label="Pedagogy & Demo Class Score"
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={scorecardForm.pedagogyScore}
                  onChange={e => setScorecardForm({ ...scorecardForm, pedagogyScore: Number(e.target.value) })}
                  className="w-full accent-primary"
                />

                <div className="flex justify-between items-center pt-1">
                  <span className="text-text-secondary">Subject Knowledge</span>
                  <span className="font-mono font-semibold text-foreground">{scorecardForm.subjectKnowledgeScore} / 5</span>
                </div>
                <input
                  aria-label="Subject Knowledge Score"
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={scorecardForm.subjectKnowledgeScore}
                  onChange={e => setScorecardForm({ ...scorecardForm, subjectKnowledgeScore: Number(e.target.value) })}
                  className="w-full accent-primary"
                />

                <div className="flex justify-between items-center pt-1">
                  <span className="text-text-secondary">Communication Skills</span>
                  <span className="font-mono font-semibold text-foreground">{scorecardForm.communicationScore} / 5</span>
                </div>
                <input
                  aria-label="Communication Skills Score"
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={scorecardForm.communicationScore}
                  onChange={e => setScorecardForm({ ...scorecardForm, communicationScore: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label htmlFor="scorecard-notes" className="font-medium text-text-secondary block mb-1">Observation Notes</label>
                <textarea
                  id="scorecard-notes"
                  rows={2}
                  placeholder="Notes on teaching style, clarity, and board exam mastery..."
                  value={scorecardForm.notes}
                  onChange={e => setScorecardForm({ ...scorecardForm, notes: e.target.value })}
                  className="w-full rounded border border-border bg-surface p-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setScorecardModalApplicant(null)}
                  className="rounded border border-border px-3 py-1 text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded bg-primary px-3 py-1 text-primary-foreground hover:bg-primary/90">
                  Save Scorecard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: Create Vacancy                                             */}
      {/* =================================================================== */}
      {newJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-xl space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-sm text-foreground">Create Job Vacancy</h3>
              <button onClick={() => setNewJobModalOpen(false)} className="text-text-tertiary hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div>
                <label htmlFor="create-job-title" className="font-medium text-text-secondary block mb-1">Position Title *</label>
                <input
                  id="create-job-title"
                  type="text"
                  required
                  placeholder="e.g. PGT Chemistry Faculty"
                  value={newJobData.title}
                  onChange={e => setNewJobData({ ...newJobData, title: e.target.value })}
                  className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="create-job-dept" className="font-medium text-text-secondary block mb-1">Department</label>
                  <select
                    id="create-job-dept"
                    value={newJobData.department}
                    onChange={e => setNewJobData({ ...newJobData, department: e.target.value })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="Science & Senior Secondary">Science</option>
                    <option value="Mathematics & STEM">Mathematics</option>
                    <option value="Primary Wing">Primary Wing</option>
                    <option value="Languages & Humanities">Languages</option>
                    <option value="Sports & Physical Education">Sports</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="create-job-salary" className="font-medium text-text-secondary block mb-1">Salary Range</label>
                  <input
                    id="create-job-salary"
                    type="text"
                    value={newJobData.salaryRange}
                    onChange={e => setNewJobData({ ...newJobData, salaryRange: e.target.value })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="create-job-desc" className="font-medium text-text-secondary block mb-1">Description *</label>
                <textarea
                  id="create-job-desc"
                  rows={2}
                  required
                  placeholder="Responsibilities and syllabus scope..."
                  value={newJobData.description}
                  onChange={e => setNewJobData({ ...newJobData, description: e.target.value })}
                  className="w-full rounded border border-border bg-surface p-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setNewJobModalOpen(false)}
                  className="rounded border border-border px-3 py-1 text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded bg-primary px-3 py-1 text-primary-foreground hover:bg-primary/90">
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: Candidate Detail Viewer                                    */}
      {/* =================================================================== */}
      {viewCandidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="font-semibold text-sm text-foreground">{viewCandidateModal.fullName}</h3>
                <p className="text-xs text-text-secondary">{viewCandidateModal.jobTitle}</p>
              </div>
              <button onClick={() => setViewCandidateModal(null)} className="text-text-tertiary hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-muted/30 p-2.5 rounded border border-border space-y-1">
                <div><span className="text-text-tertiary">Email:</span> <span className="text-foreground font-medium">{viewCandidateModal.email}</span></div>
                <div><span className="text-text-tertiary">Phone:</span> <span className="text-foreground font-medium">{viewCandidateModal.phone}</span></div>
                <div><span className="text-text-tertiary">Qualification:</span> <span className="text-foreground font-medium">{viewCandidateModal.highestQualification}</span></div>
                <div><span className="text-text-tertiary">Experience:</span> <span className="text-foreground font-medium">{viewCandidateModal.experienceYears} Years</span></div>
                {viewCandidateModal.currentOrganization && (
                  <div><span className="text-text-tertiary">Current School:</span> <span className="text-foreground font-medium">{viewCandidateModal.currentOrganization}</span></div>
                )}
              </div>

              {/* Attached Resume / CV Box */}
              <div className="rounded border border-primary/20 bg-primary/5 p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={15} className="text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground block truncate">
                      {viewCandidateModal.resumeUrl?.includes('/')
                        ? viewCandidateModal.resumeUrl.split('/').pop()
                        : viewCandidateModal.resumeUrl || `${viewCandidateModal.fullName.replace(/\s+/g, '_')}_CV.pdf`}
                    </span>
                    <span className="text-[10px] text-text-tertiary">Attached Candidate Resume (PDF)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenResume(viewCandidateModal)}
                  className="rounded bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 flex items-center gap-1 shadow-xs"
                >
                  <ExternalLink size={12} /> View CV
                </button>
              </div>

              {viewCandidateModal.scorecard && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-amber-800 dark:text-amber-200">
                    <span>Interview Rating</span>
                    <span>{viewCandidateModal.scorecard.overallRating} / 5.0</span>
                  </div>
                  <p className="text-[11px] text-text-secondary italic">"{viewCandidateModal.scorecard.notes}"</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setViewCandidateModal(null)}
                className="rounded border border-border px-3 py-1 text-xs text-foreground hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
