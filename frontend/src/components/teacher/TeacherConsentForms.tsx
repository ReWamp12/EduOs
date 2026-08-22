'use client';

import React, { useState, useMemo } from 'react';
import { useTeacherBatch } from '@/lib/teacherContext';
import {
  useAppStore,
  createConsentForm,
  sendConsentReminder,
  deleteConsentForm,
  DigitalConsentForm,
  ConsentResponse,
} from '@/lib/store';
import { PageHeader, Card, Badge, ProgressBar, EmptyState, cn } from '@/components/ui';
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
  Printer,
  ShieldCheck,
  Compass,
} from 'lucide-react';

const CATEGORY_OPTIONS: { id: DigitalConsentForm['category']; label: string; tone: 'primary' | 'info' | 'warning' | 'neutral' }[] = [
  { id: 'Excursion & Field Visit', label: 'Excursion & Field Visit', tone: 'primary' },
  { id: 'Academic Remedial', label: 'Academic Remedial / Extra Class', tone: 'warning' },
  { id: 'Medical & Health Camp', label: 'Medical & Health Checkup', tone: 'info' },
  { id: 'Sports & Tournaments', label: 'Sports & Tournaments', tone: 'primary' },
  { id: 'Media & Photography', label: 'Media & Photography Release', tone: 'neutral' },
  { id: 'General Authorization', label: 'General School Authorization', tone: 'neutral' },
];

const PRESET_TEMPLATES = [
  {
    title: 'Consent for CBSE Science Exhibition & Planetarium Field Trip',
    category: 'Excursion & Field Visit' as const,
    desc: 'Guided experiential learning visit for Class 10 science students to National Science Centre & Nehru Planetarium.',
    instructions: '1. Full school uniform with ID cards mandatory.\n2. AC Bus departs campus at 08:30 AM.\n3. Packed refreshments provided.',
  },
  {
    title: 'Consent for Pre-Board Doubt Remedial Classes (3:00 PM to 4:30 PM)',
    category: 'Academic Remedial' as const,
    desc: 'Targeted revision sessions for Mathematics & Science board preparation focusing on Section D proving questions.',
    instructions: '1. Special evening bus transport provided on designated routes.\n2. Light snacks will be provided prior to class.',
  },
  {
    title: 'Consent for Inter-School Zonal Sports Tournament & Travel',
    category: 'Sports & Tournaments' as const,
    desc: 'Authorization for student to represent Modern Public School in CBSE Zonal Athletic & Football Meet.',
    instructions: '1. Sports kit and medical kit provided by physical education department.\n2. Coach will accompany team on bus.',
  },
];

export const TeacherConsentForms: React.FC = () => {
  const { batch, batches, students, teacher } = useTeacherBatch();
  const { consentForms } = useAppStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Create Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DigitalConsentForm['category']>('Excursion & Field Visit');
  const [formTargetBatchId, setFormTargetBatchId] = useState<string>(() => batch.id);
  const [formEventDate, setFormEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [formDeadline, setFormDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  });
  const [formDescription, setFormDescription] = useState('');
  const [formInstructions, setFormInstructions] = useState('');

  const batchShortName = batch?.name ? batch.name.split(' — ')[0].split(' - ')[0] : 'Class';

  // Scoped consent forms: matches active batch or all_school
  const batchConsentForms = useMemo(() => {
    return (consentForms || []).filter((f) => {
      if (f.targetType === 'all_school') return true;
      if (batch?.id && f.targetBatchIds && f.targetBatchIds.includes(batch.id)) return true;
      if (batchShortName && f.targetBatchNames && f.targetBatchNames.some((b) => b.includes(batchShortName))) return true;
      return false;
    });
  }, [consentForms, batch?.id, batchShortName]);

  // Filtered
  const filteredForms = useMemo(() => {
    return batchConsentForms.filter((f) => {
      const matchSearch =
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || f.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [batchConsentForms, searchQuery, categoryFilter]);

  // Metrics
  const totalForms = batchConsentForms.length;
  const allResponsesInBatch = useMemo(() => {
    const responses: ConsentResponse[] = [];
    batchConsentForms.forEach((f) => {
      const batchResp = (f.responses || []).filter((r) => (batchShortName && r.batchName.includes(batchShortName)) || f.targetType === 'all_school');
      responses.push(...batchResp);
    });
    return responses;
  }, [batchConsentForms, batchShortName]);

  const signedCount = allResponsesInBatch.filter((r) => r.status === 'signed').length;
  const pendingCount = allResponsesInBatch.filter((r) => r.status === 'pending').length;
  const overallRate = allResponsesInBatch.length > 0 ? Math.round((signedCount / allResponsesInBatch.length) * 100) : 0;

  // Handlers
  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setFormTitle(preset.title);
    setFormCategory(preset.category);
    setFormDescription(preset.desc);
    setFormInstructions(preset.instructions);
    toast('Template applied', 'info', `Loaded template for ${preset.category}`);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast('Title required', 'warning', 'Please enter a title for the consent form.');
      return;
    }

    const selectedBatch = batches.find((b) => b.id === formTargetBatchId) || batch;

    createConsentForm({
      title: formTitle.trim(),
      description: formDescription.trim() || 'Parent authorization requested for school activity.',
      category: formCategory,
      targetType: 'batch',
      targetBatchIds: selectedBatch?.id ? [selectedBatch.id] : [],
      targetBatchNames: selectedBatch?.name ? [selectedBatch.name] : [],
      authorRole: 'teacher',
      authorName: teacher.name,
      eventDate: formEventDate,
      deadline: formDeadline,
      instructions: formInstructions.trim() || 'Please submit digital consent via the parent portal prior to the deadline.',
    });

    toast('Consent Form Dispatched', 'success', `"${formTitle}" published to parents of ${selectedBatch?.name ? selectedBatch.name.split(' — ')[0] : 'class'}.`);
    setShowCreateModal(false);

    // Reset
    setFormTitle('');
    setFormDescription('');
    setFormInstructions('');
  };

  const handleRemindAllMissing = (formId: string, formTitle: string) => {
    const count = sendConsentReminder(formId);
    toast('Reminders Sent', 'success', `Broadcast signature reminder for "${formTitle}" to ${count} pending parent(s).`);
  };

  const handleRemindSingleStudent = (formId: string, studentName: string) => {
    sendConsentReminder(formId, studentName);
    toast('Reminder Sent', 'success', `E-Consent reminder alert dispatched to ${studentName}'s parents.`);
  };

  const handleDelete = (formId: string, formTitle: string) => {
    if (window.confirm(`Are you sure you want to delete consent form "${formTitle}"?`)) {
      deleteConsentForm(formId);
      toast('Consent form removed', 'info');
      if (expandedFormId === formId) setExpandedFormId(null);
    }
  };

  const handleExportCSV = (form: DigitalConsentForm) => {
    try {
      const headers = ['Roll Number', 'Student Name', 'Class', 'Guardian Name', 'Guardian Phone', 'Consent Status', 'Signed Timestamp', 'Decline Reason'];
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
      link.setAttribute('download', `EduOS_Consent_${form.title.replace(/[^a-z0-9]/gi, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Sign-off CSV Exported', 'success', `Downloaded consent response matrix for ${form.responses.length} students.`);
    } catch {
      toast('Export Failed', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-title font-semibold text-foreground">Digital Consent & Field Trips</h1>
          <p className="text-meta text-text-secondary">
            Create, distribute, and track legally timestamped digital parent e-signatures for {batchShortName}.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary shrink-0 self-start sm:self-auto gap-2"
          id="btn-dispatch-consent"
        >
          <PlusCircle size={16} /> Dispatch New Consent Form
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
          <div className="text-micro font-medium text-text-tertiary">Active Consent Forms</div>
          <div className="mt-1 text-title font-bold text-foreground">{totalForms}</div>
          <div className="mt-1 text-micro text-text-tertiary">{batchShortName}</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
          <div className="text-micro font-medium text-text-tertiary">Signed by Parents</div>
          <div className="mt-1 text-title font-bold text-success">{signedCount}</div>
          <div className="mt-1 text-micro text-text-tertiary">Consents recorded</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
          <div className="text-micro font-medium text-text-tertiary">Awaiting Action</div>
          <div className="mt-1 text-title font-bold text-warning">{pendingCount}</div>
          <div className="mt-1 text-micro text-text-tertiary">Pending e-signature</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
          <div className="text-micro font-medium text-text-tertiary">Overall Turnout</div>
          <div className="mt-1 text-title font-bold text-primary">{overallRate}%</div>
          <div className="mt-1 text-micro text-text-tertiary">Response rate</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search consent circulars by title or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 py-1.5 text-meta"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-micro text-text-tertiary inline-flex items-center gap-1">
            <Filter size={13} /> Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input py-1 text-meta sm:w-52"
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Consent Forms List */}
      {filteredForms.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-surface p-8 text-center shadow-xs">
          <EmptyState
            icon={<FileSignature size={28} />}
            title="No digital consent forms found"
            description="Create and dispatch your first e-consent circular for field trips, remedial classes, or extracurricular tours."
            action={
              <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-2">
                <PlusCircle size={16} /> Dispatch Consent Form
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
                {/* Form Card Header */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={catConfig.tone}>{form.category}</Badge>
                      <Badge tone="neutral">{form.authorName}</Badge>
                      {form.eventDate && (
                        <span className="inline-flex items-center gap-1 text-micro text-text-tertiary">
                          <CalendarClock size={12} /> Scheduled: <strong className="text-foreground">{form.eventDate}</strong>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-micro text-text-tertiary">
                        <Clock size={12} /> Sign by: <strong className="text-foreground">{form.deadline}</strong>
                      </span>
                    </div>

                    <h3 className="mt-2 text-section font-semibold text-foreground">{form.title}</h3>
                    <p className="mt-1 text-meta text-text-secondary">{form.description}</p>

                    {form.instructions && (
                      <div className="mt-2.5 rounded-lg border border-border/80 bg-surface-muted/60 p-2.5 text-micro text-text-secondary">
                        <span className="font-semibold text-foreground">Instructions: </span>
                        {form.instructions}
                      </div>
                    )}
                  </div>

                  {/* Turnout Progress Pill */}
                  <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-surface-muted/60 p-3.5 lg:w-64">
                    <div className="flex items-center justify-between text-micro">
                      <span className="font-semibold text-foreground">Parent Signatures</span>
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
                      {isExpanded ? 'Hide Parent Response Roster' : `View Parent Response Roster (${formSigned}/${formTotal})`}
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {formPending > 0 && (
                      <button
                        onClick={() => handleRemindAllMissing(form.id, form.title)}
                        className="btn-secondary py-1.5 px-3 text-meta"
                        title="Send urgent notification to all pending parents"
                      >
                        <Bell size={13} /> Remind Missing ({formPending})
                      </button>
                    )}

                    <button
                      onClick={() => handleExportCSV(form)}
                      className="btn-secondary py-1.5 px-3 text-meta"
                      title="Export live sign-off record as CSV"
                    >
                      <FileSpreadsheet size={13} /> Export CSV
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(form.id, form.title)}
                    className="inline-flex items-center gap-1 text-micro text-text-tertiary hover:text-destructive transition-colors p-1"
                    title="Delete consent form"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>

                {/* Expandable Parent Response Matrix Roster */}
                {isExpanded && (
                  <div className="mt-2 flex flex-col gap-3 rounded-xl border border-border/80 bg-surface-muted/40 p-4 animate-fade-in">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3">
                      <div>
                        <h4 className="text-meta font-semibold text-foreground">Class Parent Response Matrix</h4>
                        <p className="text-micro text-text-tertiary">Real-time audit log of digital consent signatures and timestamps</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-micro text-text-tertiary">Status:</span>
                        <Badge tone="success">{formSigned} Signed</Badge>
                        <Badge tone="warning">{formPending} Pending</Badge>
                        {formDeclined > 0 && <Badge tone="danger">{formDeclined} Declined</Badge>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {form.responses.map((resp) => {
                        const isSigned = resp.status === 'signed';
                        const isDeclined = resp.status === 'declined';
                        const isPending = resp.status === 'pending';

                        return (
                          <div
                            key={resp.studentId}
                            className={cn(
                              'flex flex-col gap-2 rounded-xl border bg-surface p-3 transition-all sm:flex-row sm:items-center sm:justify-between shadow-2xs',
                              isSigned
                                ? 'border-border/80'
                                : isDeclined
                                ? 'border-destructive/30 bg-destructive-soft/10'
                                : 'border-warning/30 bg-warning-soft/10',
                            )}
                          >
                            {/* Student & Guardian */}
                            <div className="flex items-center gap-3 min-w-[240px]">
                              <span className="shrink-0 rounded-md bg-surface-muted border border-border/80 px-2 py-1 text-micro font-mono font-bold text-foreground">
                                {resp.rollNumber || 'Roll -'}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-meta font-semibold text-foreground">{resp.studentName}</div>
                                <div className="text-micro text-text-tertiary flex items-center gap-1.5">
                                  <span>
                                    Parent: <strong className="text-text-secondary">{resp.signedByName || resp.parentName}</strong>
                                    {resp.parentRelation && <span className="text-text-tertiary"> ({resp.parentRelation})</span>}
                                  </span>
                                  {resp.parentPhone && (
                                    <span className="inline-flex items-center gap-0.5 font-mono">
                                      · <Phone size={10} /> {resp.parentPhone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Response Status */}
                            <div className="flex items-center gap-3">
                              {isSigned ? (
                                <div className="flex flex-col items-end">
                                  <Badge tone="success" className="gap-1">
                                    <ShieldCheck size={12} /> Digitally Signed
                                  </Badge>
                                  <span className="text-micro text-text-tertiary mt-0.5">
                                    {resp.signedAt ? new Date(resp.signedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                                  </span>
                                </div>
                              ) : isDeclined ? (
                                <div className="flex flex-col items-end">
                                  <Badge tone="danger" className="gap-1">
                                    <X size={12} /> Consent Declined
                                  </Badge>
                                  {resp.declineReason && (
                                    <span className="text-micro text-text-tertiary italic mt-0.5">
                                      &ldquo;{resp.declineReason}&rdquo;
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Badge tone="warning" className="gap-1">
                                    <Clock size={12} /> Pending Signature
                                  </Badge>
                                  <button
                                    onClick={() => handleRemindSingleStudent(form.id, resp.studentName)}
                                    className="btn-secondary py-1 px-2 text-micro"
                                    title="Send reminder alert"
                                  >
                                    <Bell size={12} /> Remind
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
      {/* MODAL: DISPATCH NEW CONSENT FORM */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-border bg-surface-muted px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <FileSignature size={20} />
                </span>
                <div>
                  <h3 className="text-section font-semibold text-foreground">Dispatch Digital Consent Circular</h3>
                  <p className="text-micro text-text-tertiary">Create legal e-consent form for parents of {batchShortName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} id="create-consent-form" className="flex flex-1 flex-col overflow-y-auto p-6 gap-4 min-h-0">
              {/* Quick Template Chips */}
              <div>
                <div className="text-micro font-medium text-text-tertiary mb-1.5 flex items-center gap-1">
                  <Sparkles size={13} className="text-primary" /> Load quick preset template:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(tmpl)}
                      className="rounded-md border border-border bg-surface-muted px-2.5 py-1 text-micro text-text-secondary hover:border-primary hover:text-primary transition-colors text-left"
                    >
                      + {tmpl.title.split(' ')[2]} {tmpl.title.split(' ')[3]} ({tmpl.category})
                    </button>
                  ))}
                </div>
              </div>

              {/* Class & Author Banner */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="consent-batch">Target Class / Section *</label>
                  <select
                    id="consent-batch"
                    value={formTargetBatchId}
                    onChange={(e) => setFormTargetBatchId(e.target.value)}
                    className="input"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name ? b.name.split(' — ')[0] : 'Class'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor="consent-category">Activity Category *</label>
                  <select
                    id="consent-category"
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
                <label className="label" htmlFor="consent-title">Consent Form Title *</label>
                <input
                  id="consent-title"
                  type="text"
                  required
                  placeholder="e.g. Consent for CBSE Science Exhibition Field Visit to National Science Centre"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="consent-event-date">Scheduled Activity / Tour Date</label>
                  <input
                    id="consent-event-date"
                    type="date"
                    value={formEventDate}
                    onChange={(e) => setFormEventDate(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="consent-deadline">Signature Due Deadline *</label>
                  <input
                    id="consent-deadline"
                    type="date"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="consent-desc">Detailed Description & Objectives</label>
                <textarea
                  id="consent-desc"
                  rows={2}
                  placeholder="Outline purpose of activity, venue, learning objectives, and transport details…"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label" htmlFor="consent-instructions">Special Instructions & Guidelines for Parents</label>
                <textarea
                  id="consent-instructions"
                  rows={2}
                  placeholder="e.g. 1. Students must wear full school uniform with ID cards. 2. AC Bus departs campus at 08:30 AM. 3. Packed lunch provided."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="input"
                />
              </div>
            </form>

            {/* Modal Footer */}
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
                form="create-consent-form"
                className="btn-primary"
              >
                <Send size={16} /> Publish & Dispatch to Parents
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
