'use client';

import React, { useState, useMemo } from 'react';
import { mockBatches, mockTenant } from '@/lib/mockData';
import { allStudentsInSchool } from '@/lib/batchData';
import {
  useAppStore,
  createConsentForm,
  sendConsentReminder,
  deleteConsentForm,
  DigitalConsentForm,
  ConsentResponse,
} from '@/lib/store';
import { PageHeader, Card, StatCard, Badge, ProgressBar, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  FileSignature,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Send,
  Bell,
  Search,
  Filter,
  FileSpreadsheet,
  Trash2,
  ChevronDown,
  ChevronUp,
  CalendarClock,
  Sparkles,
  Phone,
  ShieldCheck,
  Building2,
  Layers,
  Printer,
} from 'lucide-react';

const CATEGORY_OPTIONS: { id: DigitalConsentForm['category']; label: string; tone: 'primary' | 'info' | 'warning' | 'neutral' }[] = [
  { id: 'Excursion & Field Visit', label: 'Excursion & Field Visit', tone: 'primary' },
  { id: 'Academic Remedial', label: 'Academic Remedial / Extra Class', tone: 'warning' },
  { id: 'Medical & Health Camp', label: 'Medical & Health Checkup', tone: 'info' },
  { id: 'Sports & Tournaments', label: 'Sports & Tournaments', tone: 'primary' },
  { id: 'Media & Photography', label: 'Media & Photography Release', tone: 'neutral' },
  { id: 'General Authorization', label: 'General School Authorization', tone: 'neutral' },
];

const PRINCIPAL_PRESETS = [
  {
    title: 'Annual Comprehensive Health, Vision & Dental Checkup Camp 2026',
    category: 'Medical & Health Camp' as const,
    desc: 'Mandatory annual medical screening conducted by Fortis Healthcare pediatric team in accordance with CBSE Health & Wellness manual.',
    instructions: '1. Digital health card and ophthalmology report will be uploaded to parent portal.\n2. Please mention any ongoing medications or spectacle prescriptions in consent remarks.',
  },
  {
    title: 'CBSE Candidate List of Candidates (LOC) Final Verification Consent',
    category: 'General Authorization' as const,
    desc: 'Mandatory parental verification of student name, date of birth, and subject choices for CBSE Board Examination registration.',
    instructions: '1. Cross-verify Aadhaar details against school record.\n2. Any correction request must be reported within 48 hours.',
  },
  {
    title: 'Annual Inter-Branch Heritage Excursion & Science City Tour',
    category: 'Excursion & Field Visit' as const,
    desc: 'All-campus educational tour to National Science City & Heritage Museum for Class 9 & 10 students.',
    instructions: '1. School uniform and ID card mandatory.\n2. AC luxury coaches accompanied by senior faculty and school medical nurse.',
  },
];

export const PrincipalConsentForms: React.FC = () => {
  const { consentForms } = useAppStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');

  // Form Creation State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DigitalConsentForm['category']>('Medical & Health Camp');
  const [formTargetScope, setFormTargetScope] = useState<'all_school' | 'batch'>('all_school');
  const [formTargetBatchId, setFormTargetBatchId] = useState<string>(mockBatches[0].id);
  const [formEventDate, setFormEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [formDeadline, setFormDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  });
  const [formDescription, setFormDescription] = useState('');
  const [formInstructions, setFormInstructions] = useState('');

  // Filtered forms
  const filteredForms = useMemo(() => {
    return consentForms.filter((f) => {
      const matchSearch =
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.authorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || f.category === categoryFilter;
      const matchSection =
        sectionFilter === 'all' ||
        f.targetType === 'all_school' ||
        (f.targetBatchIds && f.targetBatchIds.includes(sectionFilter));
      return matchSearch && matchCat && matchSection;
    });
  }, [consentForms, searchQuery, categoryFilter, sectionFilter]);

  // Overall institutional statistics
  const totalCirculars = consentForms.length;
  const allResponses = useMemo(() => {
    const list: ConsentResponse[] = [];
    consentForms.forEach((f) => list.push(...f.responses));
    return list;
  }, [consentForms]);

  const totalSigned = allResponses.filter((r) => r.status === 'signed').length;
  const totalPending = allResponses.filter((r) => r.status === 'pending').length;
  const overallRate = allResponses.length > 0 ? Math.round((totalSigned / allResponses.length) * 100) : 0;

  // Preset apply
  const handleApplyPreset = (preset: typeof PRINCIPAL_PRESETS[0]) => {
    setFormTitle(preset.title);
    setFormCategory(preset.category);
    setFormDescription(preset.desc);
    setFormInstructions(preset.instructions);
    toast('Template applied', 'info', `Loaded template: ${preset.title}`);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast('Title required', 'warning', 'Please enter a title for the circular.');
      return;
    }

    const isAll = formTargetScope === 'all_school';
    const targetBatch = mockBatches.find((b) => b.id === formTargetBatchId) || mockBatches[0];

    createConsentForm({
      title: formTitle.trim(),
      description: formDescription.trim() || 'Institutional authorization circular for parents.',
      category: formCategory,
      targetType: isAll ? 'all_school' : 'batch',
      targetBatchIds: isAll ? mockBatches.map((b) => b.id) : [targetBatch.id],
      targetBatchNames: isAll ? ['All School Sections (Class 9 & 10)'] : [targetBatch.name],
      authorRole: 'principal',
      authorName: `Dr. Rameshwar Nath (${mockTenant.name} Principal)`,
      eventDate: formEventDate,
      deadline: formDeadline,
      instructions: formInstructions.trim() || 'Please submit digital consent via the parent portal prior to the deadline.',
    });

    toast('Institutional Consent Circular Published', 'success', `"${formTitle}" broadcast to parent accounts.`);
    setShowCreateModal(false);

    // Reset
    setFormTitle('');
    setFormDescription('');
    setFormInstructions('');
  };

  const handleRemindAllMissing = (formId: string, formTitle: string) => {
    const count = sendConsentReminder(formId);
    toast('Reminders Dispatched', 'success', `Broadcast alert for "${formTitle}" to ${count} pending parent(s).`);
  };

  const handleRemindSingleStudent = (formId: string, studentName: string) => {
    sendConsentReminder(formId, studentName);
    toast('Reminder Dispatched', 'success', `E-Consent reminder alert sent to ${studentName}'s guardians.`);
  };

  const handleDelete = (formId: string, formTitle: string) => {
    if (window.confirm(`Are you sure you want to remove consent circular "${formTitle}"?`)) {
      deleteConsentForm(formId);
      toast('Circular removed', 'info');
      if (expandedFormId === formId) setExpandedFormId(null);
    }
  };

  const handleExportCSV = (form: DigitalConsentForm) => {
    try {
      const headers = ['Roll Number', 'Student Name', 'Class / Section', 'Guardian Name', 'Guardian Phone', 'Status', 'Signed Timestamp', 'Decline Reason'];
      const rows = form.responses.map((r: ConsentResponse) => [
        `"${r.rollNumber}"`,
        `"${r.studentName}"`,
        `"${r.batchName}"`,
        `"${r.parentName}"`,
        `"${r.parentPhone}"`,
        `"${r.status.toUpperCase()}"`,
        `"${r.signedAt ? new Date(r.signedAt).toLocaleString('en-IN') : 'N/A'}"`,
        `"${r.declineReason || ''}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `EduOS_School_Consent_${form.title.replace(/[^a-z0-9]/gi, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Compliance Matrix Exported', 'success', `Downloaded consent response matrix for ${form.responses.length} students.`);
    } catch {
      toast('Export Error', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Institutional Digital Consent Hub"
        subtitle={`All-School Digital Consent Circulars, Parent E-Signatures & Field Trip Registry for ${mockTenant.name}`}
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary gap-2"
            id="btn-principal-create-consent"
          >
            <PlusCircle size={16} /> Dispatch School-Wide Consent Circular
          </button>
        }
      />

      {/* Global Institutional KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Active Consent Circulars"
          value={totalCirculars}
          tone="primary"
          icon={<FileSignature size={16} />}
          hint="Across all 4 active CBSE sections"
        />
        <StatCard
          label="Total Signed Consents"
          value={<>{totalSigned}<span className="text-base font-medium text-text-tertiary"> / {allResponses.length || '—'}</span></>}
          tone="success"
          icon={<ShieldCheck size={16} />}
          hint="Digitally verified with audit stamp"
        />
        <StatCard
          label="Pending Parent Signatures"
          value={totalPending}
          tone={totalPending > 0 ? 'warning' : 'success'}
          icon={<Clock size={16} />}
          hint={totalPending > 0 ? `${totalPending} parents awaiting sign-off` : 'All parents consented'}
        />
        <StatCard
          label="School Compliance Rate"
          value={<>{overallRate}<span className="text-base font-medium text-text-tertiary">%</span></>}
          tone="info"
          icon={<Building2 size={16} />}
          hint="Target: >90% before event date"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search circulars by title, author, or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 py-1.5 text-meta"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-micro text-text-tertiary">Section:</span>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="input py-1 text-meta sm:w-44"
            >
              <option value="all">All Classes</option>
              {mockBatches.map((b) => (
                <option key={b.id} value={b.id}>{b.name.split(' — ')[0]}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-micro text-text-tertiary">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input py-1 text-meta sm:w-48"
            >
              <option value="all">All Categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Consent Circulars List */}
      {filteredForms.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-surface p-8 text-center shadow-xs">
          <EmptyState
            icon={<FileSignature size={28} />}
            title="No digital consent circulars found"
            description="Create an institutional consent circular for medical camps, CBSE LOC verification, or campus excursions."
            action={
              <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-2">
                <PlusCircle size={16} /> Create Consent Circular
              </button>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredForms.map((form) => {
            const isExpanded = expandedFormId === form.id;
            const formResponses = form.responses;
            const formSigned = formResponses.filter((r) => r.status === 'signed').length;
            const formDeclined = formResponses.filter((r) => r.status === 'declined').length;
            const formPending = formResponses.filter((r) => r.status === 'pending').length;
            const formTotal = formResponses.length || 1;
            const formPct = Math.round((formSigned / formTotal) * 100);

            const catConfig = CATEGORY_OPTIONS.find((c) => c.id === form.category) || CATEGORY_OPTIONS[0];

            return (
              <div
                key={form.id}
                className={cn(
                  'flex flex-col gap-4 rounded-2xl border bg-surface p-5 transition-all shadow-xs',
                  isExpanded ? 'border-primary/50 shadow-md ring-1 ring-primary/20' : 'border-border/80 hover:border-border-strong',
                )}
              >
                {/* Form Header */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={catConfig.tone}>{form.category}</Badge>
                      <Badge tone="primary">
                        {form.targetType === 'all_school' ? 'All School Sections' : form.targetBatchNames?.join(', ') || 'Batch'}
                      </Badge>
                      <span className="text-micro text-text-tertiary">
                        Issuer: <strong className="text-foreground">{form.authorName}</strong>
                      </span>
                      {form.eventDate && (
                        <span className="inline-flex items-center gap-1 text-micro text-text-tertiary">
                          <CalendarClock size={12} /> Event: <strong className="text-foreground">{form.eventDate}</strong>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-micro text-text-tertiary">
                        <Clock size={12} /> Deadline: <strong className="text-foreground">{form.deadline}</strong>
                      </span>
                    </div>

                    <h3 className="mt-2 text-section font-semibold text-foreground">{form.title}</h3>
                    <p className="mt-1 text-meta text-text-secondary">{form.description}</p>

                    {form.instructions && (
                      <div className="mt-2.5 rounded-lg border border-border/80 bg-surface-muted/60 p-2.5 text-micro text-text-secondary">
                        <span className="font-semibold text-foreground">Guidelines: </span>
                        {form.instructions}
                      </div>
                    )}
                  </div>

                  {/* Turnout Progress Pill */}
                  <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-surface-muted/60 p-3.5 lg:w-64">
                    <div className="flex items-center justify-between text-micro">
                      <span className="font-semibold text-foreground">Parent Response</span>
                      <span className="font-medium text-text-secondary">{formSigned}/{formTotal} ({formPct}%)</span>
                    </div>
                    <ProgressBar value={formPct} tone={formPct >= 80 ? 'success' : formPct >= 40 ? 'primary' : 'warning'} />
                    <div className="flex items-center justify-between text-micro text-text-tertiary">
                      <span>{formPending} pending</span>
                      {formDeclined > 0 && <span className="text-destructive">{formDeclined} declined</span>}
                      <span>{formSigned} signed</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setExpandedFormId(isExpanded ? null : form.id)}
                      className={cn(
                        'py-1.5 px-3.5 text-meta font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all shadow-2xs',
                        isExpanded
                          ? 'bg-primary text-white'
                          : 'bg-primary-soft text-primary hover:bg-primary-soft/80',
                      )}
                    >
                      <Users size={14} />
                      {isExpanded ? 'Hide All-Campus Response Roster' : `View Full Response Roster (${formSigned}/${formTotal})`}
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {formPending > 0 && (
                      <button
                        onClick={() => handleRemindAllMissing(form.id, form.title)}
                        className="btn-secondary py-1.5 px-3 text-meta"
                        title="Broadcast alert to all pending parents across campus"
                      >
                        <Bell size={13} /> Broadcast Reminder ({formPending})
                      </button>
                    )}

                    <button
                      onClick={() => handleExportCSV(form)}
                      className="btn-secondary py-1.5 px-3 text-meta"
                      title="Download sign-off records as CSV"
                    >
                      <FileSpreadsheet size={13} /> Export CSV Audit
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(form.id, form.title)}
                    className="inline-flex items-center gap-1 text-micro text-text-tertiary hover:text-destructive transition-colors p-1"
                    title="Delete circular"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>

                {/* Expandable Response Matrix */}
                {isExpanded && (
                  <div className="mt-2 flex flex-col gap-3 rounded-xl border border-border/80 bg-surface-muted/40 p-4 animate-fade-in">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3">
                      <div>
                        <h4 className="text-meta font-semibold text-foreground">All-Campus Digital Consent Register</h4>
                        <p className="text-micro text-text-tertiary">Verified digital signatures across sections</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="success">{formSigned} Signed</Badge>
                        <Badge tone="warning">{formPending} Pending</Badge>
                        {formDeclined > 0 && <Badge tone="danger">{formDeclined} Declined</Badge>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {form.responses.map((resp) => {
                        const isSigned = resp.status === 'signed';
                        const isDeclined = resp.status === 'declined';

                        return (
                          <div
                            key={`${form.id}-${resp.studentId}`}
                            className={cn(
                              'flex flex-col gap-2 rounded-xl border bg-surface p-3 transition-all sm:flex-row sm:items-center sm:justify-between shadow-2xs',
                              isSigned
                                ? 'border-border/80'
                                : isDeclined
                                ? 'border-destructive/30 bg-destructive-soft/10'
                                : 'border-warning/30 bg-warning-soft/10',
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="shrink-0 rounded-md bg-surface-muted border border-border/80 px-2 py-0.5 text-micro font-mono font-bold text-foreground">
                                {resp.rollNumber || 'Roll -'}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-meta font-semibold text-foreground">{resp.studentName}</div>
                                <div className="text-micro text-text-tertiary truncate">
                                  {resp.batchName.split(' — ')[0]} · Parent: <strong className="text-text-secondary">{resp.signedByName || resp.parentName}</strong>
                                  {resp.parentRelation && <span className="text-text-tertiary"> ({resp.parentRelation})</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isSigned ? (
                                <Badge tone="success" className="gap-1">
                                  <ShieldCheck size={12} /> Signed
                                </Badge>
                              ) : isDeclined ? (
                                <Badge tone="danger" className="gap-1">
                                  <X size={12} /> Declined
                                </Badge>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <Badge tone="warning" className="gap-1">
                                    <Clock size={12} /> Pending
                                  </Badge>
                                  <button
                                    onClick={() => handleRemindSingleStudent(form.id, resp.studentName)}
                                    className="btn-secondary py-0.5 px-1.5 text-micro"
                                    title="Send reminder to parent"
                                  >
                                    <Bell size={11} /> Remind
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE SCHOOL-WIDE CONSENT CIRCULAR */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-border bg-surface-muted px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <FileSignature size={20} />
                </span>
                <div>
                  <h3 className="text-section font-semibold text-foreground">Create Institutional Consent Circular</h3>
                  <p className="text-micro text-text-tertiary">Broadcast digital authorization forms to parents of {mockTenant.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCreateSubmit} id="principal-consent-form" className="flex flex-1 flex-col overflow-y-auto p-6 gap-4 min-h-0">
              {/* Presets */}
              <div>
                <div className="text-micro font-medium text-text-tertiary mb-1.5 flex items-center gap-1">
                  <Sparkles size={13} className="text-primary" /> Quick templates for Principal:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRINCIPAL_PRESETS.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(tmpl)}
                      className="rounded-md border border-border bg-surface-muted px-2.5 py-1 text-micro text-text-secondary hover:border-primary hover:text-primary transition-colors text-left"
                    >
                      + {tmpl.title.split(' ')[0]} {tmpl.title.split(' ')[1]} ({tmpl.category})
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Scope */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="principal-target-scope">Target Audience Scope *</label>
                  <select
                    id="principal-target-scope"
                    value={formTargetScope}
                    onChange={(e) => setFormTargetScope(e.target.value as any)}
                    className="input"
                  >
                    <option value="all_school">All School Sections (All Class 9 & 10)</option>
                    <option value="batch">Specific Class / Section</option>
                  </select>
                </div>

                {formTargetScope === 'batch' && (
                  <div>
                    <label className="label" htmlFor="principal-target-batch">Select Target Section *</label>
                    <select
                      id="principal-target-batch"
                      value={formTargetBatchId}
                      onChange={(e) => setFormTargetBatchId(e.target.value)}
                      className="input"
                    >
                      {mockBatches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name.split(' — ')[0]}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="label" htmlFor="principal-category">Circular Category *</label>
                  <select
                    id="principal-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="input"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="principal-title">Circular & Consent Title *</label>
                <input
                  id="principal-title"
                  type="text"
                  required
                  placeholder="e.g. Annual Comprehensive Health, Vision & Dental Checkup Camp 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="principal-event-date">Scheduled Activity / Camp Date</label>
                  <input
                    id="principal-event-date"
                    type="date"
                    value={formEventDate}
                    onChange={(e) => setFormEventDate(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="principal-deadline">Parent Sign Deadline *</label>
                  <input
                    id="principal-deadline"
                    type="date"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="principal-desc">Description & Purpose</label>
                <textarea
                  id="principal-desc"
                  rows={2}
                  placeholder="Provide background, legal mandate, venue, transport or healthcare details…"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label" htmlFor="principal-instructions">Statutory Guidelines & Parent Instructions</label>
                <textarea
                  id="principal-instructions"
                  rows={2}
                  placeholder="e.g. Digital health card and ophthalmology report will be uploaded to parent portal. Please mention any ongoing medications."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="input"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-end gap-3 border-t border-border bg-surface-muted px-6 py-3.5">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="principal-consent-form"
                className="btn-primary"
              >
                <Send size={16} /> Broadcast Consent Circular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
