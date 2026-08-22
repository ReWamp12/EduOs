'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  MapPin,
  Clock,
  Building,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  X,
  ChevronRight,
  Send,
  Upload,
  Search,
} from 'lucide-react';
import { Card, Badge, cn } from '@/components/ui';
import { JobOpening } from '@/lib/types';
import { mockTenant } from '@/lib/mockData';
import { toast } from '@/components/ui/toast';

interface PublicCareersModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobOpening[];
}

export const PublicCareersModal: React.FC<PublicCareersModalProps> = ({ isOpen, onClose, jobs }) => {
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [applyModalJob, setApplyModalJob] = useState<JobOpening | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [applicantForm, setApplicantForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    highestQualification: 'M.Sc. Physics + B.Ed.',
    experienceYears: 3,
    currentOrganization: '',
    coverLetter: '',
  });

  if (!isOpen) return null;

  const publishedJobs = jobs.filter(j => j.status === 'published');
  const filteredJobs = publishedJobs.filter(j => {
    const matchesDept = departmentFilter === 'all' || j.department === departmentFilter;
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      toast.success('Application submitted successfully! Our HR team will contact you.');
      setApplyModalJob(null);
      setFormSubmitted(false);
      setApplicantForm({
        fullName: '',
        email: '',
        phone: '',
        highestQualification: 'M.Sc. Physics + B.Ed.',
        experienceYears: 3,
        currentOrganization: '',
        coverLetter: '',
      });
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-md p-2 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-5xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Public Header Banner */}
        <div className="relative bg-gradient-to-r from-blue-700 via-primary to-indigo-800 text-white p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 backdrop-blur-md text-white font-black text-xl border border-white/20">
              {mockTenant.name.charAt(0)}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold text-white/90">
                <Sparkles size={12} /> Official Institutional Career Portal
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">{mockTenant.name} Careers</h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl mt-2">
            Join our dedicated academic faculty and institutional staff. We offer 7th CPC aligned pay scales, continuous professional development (CPD), and a modern digital classroom ecosystem.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setDepartmentFilter('all')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                departmentFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-surface text-text-secondary hover:bg-muted',
              )}
            >
              All Openings ({publishedJobs.length})
            </button>
            <button
              onClick={() => setDepartmentFilter('Science & Senior Secondary')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                departmentFilter === 'Science & Senior Secondary'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-surface text-text-secondary hover:bg-muted',
              )}
            >
              Senior Secondary
            </button>
            <button
              onClick={() => setDepartmentFilter('Mathematics & STEM')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                departmentFilter === 'Mathematics & STEM'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-surface text-text-secondary hover:bg-muted',
              )}
            >
              Mathematics & STEM
            </button>
            <button
              onClick={() => setDepartmentFilter('Primary Wing')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                departmentFilter === 'Primary Wing'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-surface text-text-secondary hover:bg-muted',
              )}
            >
              Primary Wing
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-2.5 top-2.5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search faculty role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Jobs List Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="py-16 text-center text-text-tertiary">No matching positions found.</div>
          ) : (
            filteredJobs.map(job => (
              <div
                key={job.id}
                className="rounded-xl border border-border bg-surface p-5 shadow-sm hover:border-primary/50 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-foreground">{job.title}</h3>
                      <Badge tone="primary">{job.designationCategory}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mt-1.5">
                      <span className="flex items-center gap-1">
                        <Building size={13} className="text-text-tertiary" /> {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-text-tertiary" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-text-tertiary" /> {job.experienceRequired}
                      </span>
                      {job.salaryRange && (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {job.salaryRange}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setApplyModalJob(job)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Apply Now <ChevronRight size={14} />
                  </button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">{job.description}</p>

                {job.requirements && (
                  <div className="rounded-lg bg-muted/40 p-3 text-xs text-text-secondary">
                    <strong className="text-foreground">Mandatory Qualifications:</strong> {job.requirements}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Embedded Application Modal */}
      {applyModalJob && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">Application: {applyModalJob.title}</h3>
                <p className="text-xs text-text-secondary mt-0.5">{mockTenant.name} • {applyModalJob.department}</p>
              </div>
              <button onClick={() => setApplyModalJob(null)} className="text-text-tertiary hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-text-secondary block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sunita Sharma"
                  value={applicantForm.fullName}
                  onChange={e => setApplicantForm({ ...applicantForm, fullName: e.target.value })}
                  className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-text-secondary block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={applicantForm.email}
                    onChange={e => setApplicantForm({ ...applicantForm, email: e.target.value })}
                    className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-secondary block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={applicantForm.phone}
                    onChange={e => setApplicantForm({ ...applicantForm, phone: e.target.value })}
                    className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-text-secondary block mb-1">Highest Qualification *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M.Sc. Physics + B.Ed."
                    value={applicantForm.highestQualification}
                    onChange={e => setApplicantForm({ ...applicantForm, highestQualification: e.target.value })}
                    className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-secondary block mb-1">Teaching Experience (Years) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={applicantForm.experienceYears}
                    onChange={e => setApplicantForm({ ...applicantForm, experienceYears: Number(e.target.value) })}
                    className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1">Current Institution / School</label>
                <input
                  type="text"
                  placeholder="e.g. DPS R.K. Puram"
                  value={applicantForm.currentOrganization}
                  onChange={e => setApplicantForm({ ...applicantForm, currentOrganization: e.target.value })}
                  className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1">Upload Resume / CV (PDF) *</label>
                <div className="rounded-lg border-2 border-dashed border-border p-3 text-center cursor-pointer hover:border-primary/50">
                  <Upload size={18} className="mx-auto text-text-tertiary mb-1" />
                  <span className="text-[11px] text-text-secondary">Click to attach CV (PDF up to 10MB)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setApplyModalJob(null)}
                  className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitted}
                  className="rounded-lg bg-primary px-4 py-1.5 font-medium text-primary-foreground hover:bg-primary/90 shadow-sm flex items-center gap-1.5"
                >
                  <Send size={13} /> {formSubmitted ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
