'use client';

import React, { useState } from 'react';
import { mockParentChildren } from '@/lib/mockData';
import { useAppStore, signConsentForm, declineConsentForm, DigitalConsentForm, ConsentResponse } from '@/lib/store';
import { Card, StatCard, Badge, PageHeader, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  FileCheck2,
  ShieldCheck,
  Clock,
  Check,
  X,
  CalendarClock,
  FileSignature,
  Building2,
  AlertCircle,
  Sparkles,
  Phone,
  UserCheck,
  Lock,
} from 'lucide-react';

const CONSENT_VERSION = 'v2.4';

export const ParentConsentForms: React.FC = () => {
  const { consentForms } = useAppStore();
  const activeChild = mockParentChildren[0]; // Aarav Sharma by default
  const [selectedChildId, setSelectedChildId] = useState(activeChild.id);
  const currentChild = mockParentChildren.find((c) => c.id === selectedChildId) || activeChild;

  // E-Signature Modal State
  const [signingModalForm, setSigningModalForm] = useState<DigitalConsentForm | null>(null);
  const [parentFullName, setParentFullName] = useState('Mr. Rajesh Kumar Sharma');
  const [parentRelation, setParentRelation] = useState<'Father' | 'Mother' | 'Legal Guardian'>('Father');
  const [parentEmergencyPhone, setParentEmergencyPhone] = useState('+91 98111 22334');
  const [declarationAgreed, setDeclarationAgreed] = useState(false);
  const [isSubmittingSignature, setIsSubmittingSignature] = useState(false);

  // Derive status of each consent form for the current selected child
  const formsWithChildStatus = consentForms.map((form) => {
    const childResponse = form.responses.find(
      (r) => r.studentName.toLowerCase().trim() === currentChild.name.toLowerCase().trim(),
    );
    const status: 'signed' | 'declined' | 'pending' = childResponse ? childResponse.status : 'pending';
    const signedOn = childResponse?.signedAt
      ? new Date(childResponse.signedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : undefined;
    const signedByName = childResponse?.signedByName || childResponse?.parentName;
    const relation = childResponse?.parentRelation || (childResponse?.parentName?.startsWith('Mrs') ? 'Mother' : 'Father');

    return {
      ...form,
      childStatus: status,
      signedOn,
      signedByName,
      relation,
      declineReason: childResponse?.declineReason,
    };
  });

  const pendingCount = formsWithChildStatus.filter((f) => f.childStatus === 'pending').length;
  const signedCount = formsWithChildStatus.filter((f) => f.childStatus === 'signed').length;
  const declinedCount = formsWithChildStatus.filter((f) => f.childStatus === 'declined').length;

  const handleOpenSignModal = (form: DigitalConsentForm) => {
    setSigningModalForm(form);
    setDeclarationAgreed(false);
    // Default full name prefill if empty
    if (!parentFullName.trim()) {
      setParentFullName('Mr. Rajesh Kumar Sharma');
    }
  };

  const handleConfirmSignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingModalForm) return;

    if (!parentFullName.trim() || parentFullName.trim().length < 3) {
      toast('Full Name Required', 'warning', 'Please enter your complete legal name to sign the e-consent.');
      return;
    }

    if (!declarationAgreed) {
      toast('Declaration Required', 'warning', 'Please check the legal authorization declaration checkbox.');
      return;
    }

    setIsSubmittingSignature(true);
    try {
      signConsentForm(
        signingModalForm.id,
        currentChild.name,
        parentFullName.trim(),
        parentRelation,
        parentEmergencyPhone.trim(),
      );

      toast(
        'Digital Consent Signed',
        'success',
        `"${signingModalForm.title}" signed by ${parentFullName.trim()} (${parentRelation}). Cryptographic audit log updated.`,
      );

      setSigningModalForm(null);
    } catch {
      toast('Error', 'error', 'Could not record digital consent. Please try again.');
    } finally {
      setIsSubmittingSignature(false);
    }
  };

  const handleDecline = (form: DigitalConsentForm) => {
    const reason = window.prompt('Optional: Please provide reason for opting out / declining consent:', 'Schedule conflict / personal preference');
    declineConsentForm(form.id, currentChild.name, reason || 'Parent opted out.');
    toast('Consent Declined', 'warning', `Decision logged for ${currentChild.name}. School faculty notified.`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Digital Consent Forms"
          subtitle="Legally versioned e-consent for field trips, medical care, remedial classes & media authorizations"
        />

        {/* Multi-child switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-border/80 bg-surface p-1.5 shadow-2xs">
          <span className="text-micro font-medium text-text-tertiary px-2">Child:</span>
          {mockParentChildren.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChildId(ch.id)}
              className={cn(
                'rounded-lg px-3 py-1 text-meta font-medium transition-colors',
                selectedChildId === ch.id
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-text-secondary hover:bg-muted',
              )}
            >
              {ch.name.split(' ')[0]} ({ch.grade.split(' - ')[0]})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting your action"
          value={pendingCount}
          icon={<Clock size={16} />}
          tone={pendingCount > 0 ? 'destructive' : 'success'}
          hint={pendingCount > 0 ? `Please review for ${currentChild.name.split(' ')[0]}` : 'All caught up'}
        />
        <StatCard label="Signed & Authorized" value={signedCount} icon={<ShieldCheck size={16} />} tone="success" hint="E-Consent on legal record" />
        <StatCard
          label="Declined"
          value={declinedCount}
          icon={<X size={16} />}
          tone="neutral"
          hint="Recorded objections"
        />
      </div>

      {formsWithChildStatus.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-surface p-8 text-center shadow-xs">
          <EmptyState
            icon={<FileSignature size={28} />}
            title="No consent forms active"
            description="When teachers or the principal issue field trip or activity circulars, they will appear here for e-signature."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {formsWithChildStatus.map((form) => {
            const isSigned = form.childStatus === 'signed';
            const isDeclined = form.childStatus === 'declined';
            const isPending = form.childStatus === 'pending';
            const rail = isSigned ? 'bg-success' : isDeclined ? 'bg-text-tertiary' : 'bg-destructive';

            return (
              <Card key={form.id} className="overflow-hidden rounded-2xl border border-border/80 shadow-xs">
                <div className="flex">
                  <span className={cn('w-1.5 shrink-0', rail)} />
                  <div className="flex-1 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="primary">{form.category}</Badge>
                          <Badge tone="neutral">{form.authorName}</Badge>
                          <h3 className="text-section font-semibold text-foreground">{form.title}</h3>
                        </div>
                        {(form.eventDate || form.deadline) && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 text-meta text-text-secondary">
                            <CalendarClock size={14} className="text-text-tertiary" />
                            {form.eventDate && (
                              <>
                                Scheduled: <span className="font-semibold text-foreground">{form.eventDate}</span>
                              </>
                            )}
                            {form.deadline && (
                              <>
                                {' '}· Sign by: <span className="font-semibold text-warning">{form.deadline}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        {isSigned && (
                          <Badge tone="success" className="gap-1">
                            <ShieldCheck size={13} /> Signed {form.signedOn || 'Verified'}
                          </Badge>
                        )}
                        {isDeclined && (
                          <Badge tone="neutral" className="gap-1">
                            <X size={13} /> Declined {form.signedOn || 'Today'}
                          </Badge>
                        )}
                        {isPending && (
                          <Badge tone="danger" className="gap-1">
                            <Clock size={13} /> Action required
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-body leading-relaxed text-text-secondary">{form.description}</p>

                    {form.instructions && (
                      <div className="mt-3 rounded-lg border border-border/80 bg-surface-muted/60 p-3 text-micro text-text-secondary">
                        <span className="font-semibold text-foreground">Guidelines & Details: </span>
                        {form.instructions}
                      </div>
                    )}

                    {/* Legally significant confirmation block */}
                    {(isSigned || isDeclined) && (
                      <div
                        className={cn(
                          'mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-meta',
                          isSigned
                            ? 'border-success/30 bg-success-soft/30 text-success-foreground'
                            : 'border-border bg-surface-muted text-text-secondary',
                        )}
                      >
                        <FileSignature size={18} className="mt-0.5 shrink-0 text-success" />
                        <div>
                          <div className="font-semibold">
                            {isSigned
                              ? `Digitally Authorized by ${form.signedByName || 'Parent'} (${form.relation || 'Guardian'})`
                              : 'Consent Form Declined'} · {CONSENT_VERSION}
                          </div>
                          <div className="mt-0.5 text-micro">
                            Recorded {form.signedOn || 'Today'} against legal parent account for <strong>{currentChild.name}</strong>. Legally binding e-consent archived in the institutional compliance registry.
                          </div>
                        </div>
                      </div>
                    )}

                    {isPending && (
                      <div className="mt-4 flex flex-wrap justify-end gap-2.5 pt-2 border-t border-border/60">
                        <button onClick={() => handleDecline(form)} className="btn-secondary">
                          <X size={16} /> Decline with Note
                        </button>
                        <button
                          onClick={() => handleOpenSignModal(form)}
                          className="btn-primary gap-1.5"
                        >
                          <FileSignature size={16} /> Review & Digitally Sign
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 text-micro text-text-tertiary">
        <FileCheck2 size={13} />
        Consent decisions are cryptographically timestamped ({CONSENT_VERSION}) and legally binding under the CBSE school digital-consent policy.
      </div>

      {/* ========================================================================= */}
      {/* MODAL: PARENT DIGITAL E-SIGNATURE (REQUIRES FULL LEGAL NAME) */}
      {/* ========================================================================= */}
      {signingModalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-border bg-surface-muted px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <FileSignature size={20} />
                </span>
                <div>
                  <h3 className="text-section font-semibold text-foreground">Digital E-Signature Authorization</h3>
                  <p className="text-micro text-text-tertiary">CBSE E-Consent Policy · Version {CONSENT_VERSION}</p>
                </div>
              </div>
              <button
                onClick={() => setSigningModalForm(null)}
                className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmSignature} id="parent-esign-form" className="flex flex-1 flex-col overflow-y-auto p-6 gap-4 min-h-0">
              {/* Activity Summary Box */}
              <div className="rounded-xl border border-border/80 bg-surface-muted/60 p-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="primary">{signingModalForm.category}</Badge>
                  <span className="text-micro text-text-tertiary">Issued by {signingModalForm.authorName}</span>
                </div>
                <h4 className="text-meta font-bold text-foreground">{signingModalForm.title}</h4>
                <p className="text-micro text-text-secondary">{signingModalForm.description}</p>
                {signingModalForm.eventDate && (
                  <div className="text-micro text-text-tertiary">
                    Event Date: <strong className="text-foreground">{signingModalForm.eventDate}</strong> · Deadline: <strong className="text-warning">{signingModalForm.deadline}</strong>
                  </div>
                )}
              </div>

              {/* Student Identity Confirmation */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-meta">
                <div className="flex items-center gap-2.5">
                  <UserCheck size={16} className="text-primary" />
                  <span>Student: <strong className="text-foreground">{currentChild.name}</strong></span>
                </div>
                <span className="text-micro text-text-tertiary">{currentChild.grade.split(' - ')[0]} · {currentChild.rollNumber}</span>
              </div>

              {/* Parent Full Legal Name Input */}
              <div>
                <label className="label flex items-center justify-between" htmlFor="parent-full-name">
                  <span>Parent / Legal Guardian Full Legal Name *</span>
                  <span className="text-micro text-primary font-normal">Must match official record</span>
                </label>
                <input
                  id="parent-full-name"
                  type="text"
                  required
                  autoFocus
                  placeholder="Enter your complete legal full name (e.g. Rajesh Kumar Sharma)"
                  value={parentFullName}
                  onChange={(e) => setParentFullName(e.target.value)}
                  className="input py-2 font-semibold text-foreground"
                />
                <p className="mt-1 text-micro text-text-tertiary">
                  Please type your full first and last name. This will be permanently recorded in the legal audit log.
                </p>
              </div>

              {/* Relationship & Contact */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="parent-relation">Relationship to Student *</label>
                  <select
                    id="parent-relation"
                    value={parentRelation}
                    onChange={(e) => setParentRelation(e.target.value as any)}
                    className="input"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Legal Guardian">Legal Guardian</option>
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor="parent-phone">Emergency Contact Phone *</label>
                  <input
                    id="parent-phone"
                    type="tel"
                    required
                    value={parentEmergencyPhone}
                    onChange={(e) => setParentEmergencyPhone(e.target.value)}
                    className="input font-mono"
                  />
                </div>
              </div>

              {/* Legal Declaration Checkbox */}
              <div className="rounded-xl border border-primary/30 bg-primary-soft/20 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={declarationAgreed}
                    onChange={(e) => setDeclarationAgreed(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="text-meta text-foreground">
                    <span className="font-semibold block mb-0.5">Statutory Authorization Declaration</span>
                    <p className="text-micro text-text-secondary leading-relaxed">
                      I, <strong className="text-foreground">{parentFullName || '[Your Full Name]'}</strong>, hereby authorize <strong>{currentChild.name}</strong> to participate in this activity. I confirm that I have reviewed all guidelines and instructions. I acknowledge that entering my full legal name above serves as a legally binding cryptographic digital e-signature ({CONSENT_VERSION}).
                    </p>
                  </div>
                </label>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="shrink-0 flex items-center justify-between border-t border-border bg-surface-muted px-6 py-3.5">
              <div className="flex items-center gap-1.5 text-micro text-text-tertiary">
                <Lock size={12} className="text-success" /> 256-bit Encrypted Audit Stamp
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSigningModalForm(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="parent-esign-form"
                  disabled={!parentFullName.trim() || !declarationAgreed || isSubmittingSignature}
                  className="btn-primary gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck size={16} />
                  {isSubmittingSignature ? 'Signing...' : 'Confirm Digital E-Signature'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
