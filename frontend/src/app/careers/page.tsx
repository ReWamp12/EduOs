'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Building,
  MapPin,
  Clock,
  Search,
  ArrowLeft,
  CheckCircle2,
  X,
  ChevronRight,
  Send,
  Upload,
  FileText,
  Trash2,
  Mail,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { JobOpening } from '@/lib/types';
import { mockTenant } from '@/lib/mockData';
import { dataService } from '@/lib/dataService';
import { Toaster, toast } from '@/components/ui/toast';

interface SubmissionSuccessData {
  referenceNumber: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  appliedDate: string;
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [applyModalJob, setApplyModalJob] = useState<JobOpening | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<SubmissionSuccessData | null>(null);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  // Resume File State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl?: string;
    rawFile?: File;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [applicantForm, setApplicantForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    highestQualification: 'M.Sc. Physics + B.Ed.',
    experienceYears: 3,
    currentOrganization: '',
    coverLetter: '',
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await dataService.getJobs();
      setJobs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const publishedJobs = jobs.filter(j => j.status === 'published');
  const filteredJobs = publishedJobs.filter(j => {
    const matchesDept = departmentFilter === 'all' || j.department === departmentFilter;
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    const sizeInKb = (file.size / 1024).toFixed(0);
    const sizeStr = Number(sizeInKb) > 1024 ? `${(Number(sizeInKb) / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAttachedFile({
        name: file.name,
        size: sizeStr,
        type: file.type || 'application/pdf',
        dataUrl,
        rawFile: file,
      });
      toast.success(`Attached ${file.name}`);
    } catch (err) {
      toast.error('Failed to read selected file');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalJob) return;

    if (!attachedFile) {
      toast.error('Please attach your CV / Resume (PDF format)');
      return;
    }

    setFormSubmitted(true);
    try {
      const refNum = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const email = applicantForm.email.trim();
      const name = applicantForm.fullName.trim();
      const jobTitle = applyModalJob.title;
      const dept = applyModalJob.department;

      // Ensure dataUrl is present
      let resumeUrl = attachedFile.dataUrl;
      if (!resumeUrl && attachedFile.rawFile) {
        resumeUrl = await readFileAsDataUrl(attachedFile.rawFile);
      }
      if (!resumeUrl) {
        resumeUrl = attachedFile.name;
      }

      if (typeof window !== 'undefined' && resumeUrl.startsWith('data:')) {
        try {
          localStorage.setItem(`eduos_resume_${email.toLowerCase()}`, resumeUrl);
          localStorage.setItem(`eduos_resume_${name.toLowerCase()}`, resumeUrl);
          localStorage.setItem(`eduos_resume_name_${email.toLowerCase()}`, attachedFile.name);
        } catch (err) {
          console.warn('Storage quota notice', err);
        }
      }

      await dataService.submitPublicApplication({
        jobId: applyModalJob.id,
        jobTitle: applyModalJob.title,
        resumeUrl,
        ...applicantForm,
      });

      setSubmissionSuccess({
        referenceNumber: refNum,
        candidateName: name,
        candidateEmail: email,
        jobTitle,
        department: dept,
        appliedDate: new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });

      setApplyModalJob(null);
      setAttachedFile(null);
      setApplicantForm({
        fullName: '',
        email: '',
        phone: '',
        highestQualification: 'M.Sc. Physics + B.Ed.',
        experienceYears: 3,
        currentOrganization: '',
        coverLetter: '',
      });
      toast.success(`Application received! Confirmation email sent to ${email}`);
    } catch (e: any) {
      const msg = e?.message || 'Failed to submit application. Please try again.';
      toast.error(msg);
    } finally {
      setFormSubmitted(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded bg-primary text-primary-foreground font-bold text-xs grid place-items-center">
              {mockTenant.name.charAt(0)}
            </div>
            <span className="font-semibold text-xs text-foreground">{mockTenant.name} Careers</span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft size={12} /> Return to Portal
          </Link>
        </div>
      </header>

      {/* Clean Minimal Hero Header */}
      <section className="border-b border-border bg-surface py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Current Vacancies at {mockTenant.name}
          </h1>
          <p className="text-xs text-text-secondary">
            Join our academic faculty and school staff. Select a position below to review requirements and submit your application.
          </p>
        </div>
      </section>

      {/* Success Notification with Email Confirmation Banner */}
      {submissionSuccess && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 w-full animate-fade-in">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm">
                  Application Submitted Successfully!
                </h4>
                <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Thank you, <strong>{submissionSuccess.candidateName}</strong>. Your Reference ID is{' '}
                  <span className="font-mono font-bold text-foreground">{submissionSuccess.referenceNumber}</span>.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-200 mt-1 font-medium">
                  <Mail size={12} /> A confirmation email has been dispatched to <u>{submissionSuccess.candidateEmail}</u>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setEmailPreviewOpen(true)}
                className="rounded border border-emerald-600/30 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center gap-1 shadow-xs"
              >
                <Mail size={12} /> View Confirmation Email
              </button>
              <button
                onClick={() => setSubmissionSuccess(null)}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 p-1"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Positions Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-5">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setDepartmentFilter('all')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                departmentFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-surface text-text-secondary hover:bg-muted'
              }`}
            >
              All Openings ({publishedJobs.length})
            </button>
            <button
              onClick={() => setDepartmentFilter('Science & Senior Secondary')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                departmentFilter === 'Science & Senior Secondary'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-surface text-text-secondary hover:bg-muted'
              }`}
            >
              Science
            </button>
            <button
              onClick={() => setDepartmentFilter('Mathematics & STEM')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                departmentFilter === 'Mathematics & STEM'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-surface text-text-secondary hover:bg-muted'
              }`}
            >
              Mathematics
            </button>
            <button
              onClick={() => setDepartmentFilter('Primary Wing')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                departmentFilter === 'Primary Wing'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-surface text-text-secondary hover:bg-muted'
              }`}
            >
              Primary Wing
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search size={13} className="absolute left-2.5 top-2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search vacancies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded border border-border bg-surface py-1 pl-8 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-text-tertiary">Loading vacancies...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-16 text-center text-xs text-text-tertiary">No matching positions found.</div>
        ) : (
          <div className="space-y-3.5">
            {filteredJobs.map(job => (
              <div
                key={job.id}
                className="rounded-lg border border-border bg-surface p-4 shadow-xs hover:border-border-strong transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground">{job.title}</h3>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-text-secondary">
                        {job.designationCategory}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mt-1">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Building size={12} className="text-text-tertiary" /> {job.department}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <MapPin size={12} className="text-text-tertiary" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock size={12} className="text-text-tertiary" /> {job.experienceRequired}
                      </span>
                      {job.salaryRange && (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400 text-[11px]">
                          {job.salaryRange}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setApplyModalJob(job);
                      setAttachedFile(null);
                    }}
                    className="shrink-0 inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                  >
                    Apply <ChevronRight size={12} />
                  </button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">{job.description}</p>

                {job.requirements && (
                  <div className="rounded bg-muted/30 p-2.5 text-xs text-text-secondary border border-border">
                    <strong className="text-foreground">Qualifications:</strong> {job.requirements}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Embedded Application Modal */}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-xl space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  Apply: {applyModalJob.title}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {applyModalJob.department}
                </p>
              </div>
              <button
                onClick={() => setApplyModalJob(null)}
                className="text-text-tertiary hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-3 text-xs">
              <div>
                <label htmlFor="careers-full-name" className="font-medium text-text-secondary block mb-1">
                  Full Legal Name *
                </label>
                <input
                  id="careers-full-name"
                  type="text"
                  required
                  placeholder="e.g. Dr. Sunita Sharma"
                  value={applicantForm.fullName}
                  onChange={e => setApplicantForm({ ...applicantForm, fullName: e.target.value })}
                  className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="careers-email" className="font-medium text-text-secondary block mb-1">
                    Email Address *
                  </label>
                  <input
                    id="careers-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={applicantForm.email}
                    onChange={e => setApplicantForm({ ...applicantForm, email: e.target.value })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="careers-phone" className="font-medium text-text-secondary block mb-1">
                    Phone Number *
                  </label>
                  <input
                    id="careers-phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={applicantForm.phone}
                    onChange={e => setApplicantForm({ ...applicantForm, phone: e.target.value })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="careers-qual" className="font-medium text-text-secondary block mb-1">
                    Highest Qualification *
                  </label>
                  <input
                    id="careers-qual"
                    type="text"
                    required
                    placeholder="e.g. M.Sc. + B.Ed."
                    value={applicantForm.highestQualification}
                    onChange={e => setApplicantForm({ ...applicantForm, highestQualification: e.target.value })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="careers-exp" className="font-medium text-text-secondary block mb-1">
                    Experience (Years) *
                  </label>
                  <input
                    id="careers-exp"
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={applicantForm.experienceYears}
                    onChange={e => setApplicantForm({ ...applicantForm, experienceYears: Number(e.target.value) })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="careers-school" className="font-medium text-text-secondary block mb-1">
                  Current Institution / School
                </label>
                <input
                  id="careers-school"
                  type="text"
                  placeholder="e.g. DPS R.K. Puram"
                  value={applicantForm.currentOrganization}
                  onChange={e => setApplicantForm({ ...applicantForm, currentOrganization: e.target.value })}
                  className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Real Interactive File Upload */}
              <div>
                <label className="font-medium text-text-secondary block mb-1">
                  Attach CV / Resume (PDF / Word) *
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />

                {!attachedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`rounded border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/60 hover:bg-muted/30'
                    }`}
                  >
                    <Upload size={18} className="mx-auto text-text-tertiary mb-1" />
                    <span className="text-xs font-medium text-foreground block">
                      Click to browse or drag & drop CV
                    </span>
                    <span className="text-[10px] text-text-tertiary mt-0.5 block">
                      PDF, DOCX up to 10MB
                    </span>
                  </div>
                ) : (
                  <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-foreground block truncate">
                          {attachedFile.name}
                        </span>
                        <span className="text-[10px] text-text-tertiary">
                          {attachedFile.size} • Ready for upload
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="p-1 text-text-tertiary hover:text-red-600 rounded transition-colors"
                      title="Remove file"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setApplyModalJob(null)}
                  className="rounded border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitted}
                  className="rounded bg-primary px-3.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
                >
                  <Send size={12} /> {formSubmitted ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Acknowledgment Email Preview Modal */}
      {emailPreviewOpen && submissionSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded bg-blue-600/10 text-blue-600 grid place-items-center">
                  <Mail size={15} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Dispatched Application Acknowledgment Email</h3>
                  <span className="text-[11px] text-slate-500">Sent to applicant's inbox</span>
                </div>
              </div>
              <button
                onClick={() => setEmailPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div><span className="text-slate-500 dark:text-slate-400">From:</span> <strong>HR & Academic Recruitment ({mockTenant.name} &lt;hr@eduos.school&gt;)</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400">To:</span> <strong>{submissionSuccess.candidateName} &lt;{submissionSuccess.candidateEmail}&gt;</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400">Subject:</span> <strong className="text-blue-600 dark:text-blue-400">Application Received: {submissionSuccess.jobTitle} (Ref: {submissionSuccess.referenceNumber})</strong></div>
              <div><span className="text-slate-500 dark:text-slate-400">Date:</span> <span>{submissionSuccess.appliedDate}</span></div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-3 font-sans leading-relaxed text-slate-800 dark:text-slate-200">
              <p>Dear <strong>{submissionSuccess.candidateName}</strong>,</p>
              <p>
                Thank you for applying for the position of <strong>{submissionSuccess.jobTitle}</strong> ({submissionSuccess.department}) at <strong>{mockTenant.name}</strong>.
              </p>
              <div className="p-3 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-200 space-y-1">
                <div>Application Reference ID: <strong className="font-mono text-sm">{submissionSuccess.referenceNumber}</strong></div>
                <div className="text-[11px] text-blue-800 dark:text-blue-300">Status: Under Academic Committee Screening</div>
              </div>
              <p>
                We have received your profile and attached CV. Our Selection Committee reviews applications based on NCTE/CBSE qualification criteria. If shortlisted, our HR office will contact you with your demo schedule.
              </p>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Office of Human Resources & Faculty Recruitment</p>
                <p>{mockTenant.name}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEmailPreviewOpen(false)}
                className="rounded bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 text-center text-[11px] text-text-tertiary bg-surface">
        <p>© 2026 {mockTenant.name}. All rights reserved.</p>
      </footer>

      <Toaster />
    </div>
  );
}
