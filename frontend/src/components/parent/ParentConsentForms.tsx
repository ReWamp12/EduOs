'use client';

import React, { useState } from 'react';
import { mockConsentForms } from '@/lib/mockData';
import { Card, StatCard, Badge, PageHeader, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  FileCheck2,
  ShieldCheck,
  Clock,
  Check,
  X,
  CalendarClock,
  FileSignature,
} from 'lucide-react';

interface ConsentFormItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  date?: string;
  deadline?: string;
  signedOn?: string;
}

const CONSENT_VERSION = 'v2.4';

export const ParentConsentForms: React.FC = () => {
  const [forms, setForms] = useState<ConsentFormItem[]>(mockConsentForms);

  const pendingCount = forms.filter((f) => f.status === 'pending').length;
  const signedCount = forms.filter((f) => f.status === 'signed').length;
  const declinedCount = forms.filter((f) => f.status === 'declined').length;

  const stamp = () => 'Today, 03:32 PM';

  const handleSign = (form: ConsentFormItem) => {
    setForms((prev) =>
      prev.map((f) => (f.id === form.id ? { ...f, status: 'signed', signedOn: stamp() } : f)),
    );
    toast('Consent recorded', 'success', `${form.title} · signed ${CONSENT_VERSION} with audit timestamp`);
  };

  const handleDecline = (form: ConsentFormItem) => {
    setForms((prev) =>
      prev.map((f) => (f.id === form.id ? { ...f, status: 'declined', signedOn: stamp() } : f)),
    );
    toast('Consent declined', 'warning', `${form.title} · your decision was logged ${CONSENT_VERSION}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Digital consent forms"
        subtitle="Legally versioned e-consent for field trips, medical care & media authorizations"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Awaiting your action"
          value={pendingCount}
          icon={<Clock size={16} />}
          tone={pendingCount > 0 ? 'destructive' : 'success'}
          hint={pendingCount > 0 ? 'Please review before deadline' : 'All caught up'}
        />
        <StatCard label="Signed" value={signedCount} icon={<ShieldCheck size={16} />} tone="success" hint="Consent on record" />
        <StatCard
          label="Declined"
          value={declinedCount}
          icon={<X size={16} />}
          tone="neutral"
          hint="Recorded objections"
        />
      </div>

      <div className="flex flex-col gap-4">
        {forms.map((form) => {
          const isSigned = form.status === 'signed';
          const isDeclined = form.status === 'declined';
          const isPending = form.status === 'pending';
          const rail = isSigned ? 'bg-success' : isDeclined ? 'bg-text-tertiary' : 'bg-destructive';

          return (
            <Card key={form.id} className="overflow-hidden">
              <div className="flex">
                <span className={cn('w-1 shrink-0', rail)} />
                <div className="flex-1 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="primary">{form.category}</Badge>
                        <h3 className="text-section text-foreground">{form.title}</h3>
                      </div>
                      {(form.date || form.deadline) && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-meta text-text-secondary">
                          <CalendarClock size={14} className="text-text-tertiary" />
                          {form.date && (
                            <>
                              Scheduled <span className="font-semibold text-foreground">{form.date}</span>
                            </>
                          )}
                          {form.deadline && (
                            <>
                              {' '}· sign by <span className="font-semibold text-warning">{form.deadline}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {isSigned && (
                        <Badge tone="success">
                          <ShieldCheck size={13} /> Signed {form.signedOn}
                        </Badge>
                      )}
                      {isDeclined && (
                        <Badge tone="neutral">
                          <X size={13} /> Declined {form.signedOn}
                        </Badge>
                      )}
                      {isPending && (
                        <Badge tone="danger">
                          <Clock size={13} /> Action required
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-body leading-relaxed text-text-secondary">{form.description}</p>

                  {/* Legally significant confirmation block */}
                  {(isSigned || isDeclined) && (
                    <div
                      className={cn(
                        'mt-4 flex items-start gap-2.5 rounded-md border p-3.5 text-meta',
                        isSigned
                          ? 'border-success/20 bg-success-soft text-success-foreground'
                          : 'border-border bg-surface-muted text-text-secondary',
                      )}
                    >
                      <FileSignature size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold">
                          {isSigned ? 'Digitally consented' : 'Consent declined'} · form {CONSENT_VERSION}
                        </div>
                        <div className="mt-0.5">
                          Recorded {form.signedOn} against parent account and stored in the legal audit registry. A
                          timestamped copy has been dispatched to your email.
                        </div>
                      </div>
                    </div>
                  )}

                  {isPending && (
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <button onClick={() => handleDecline(form)} className="btn-secondary">
                        <X size={16} /> Decline
                      </button>
                      <button onClick={() => handleSign(form)} className="btn-primary">
                        <Check size={16} /> Sign & consent
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-micro text-text-tertiary">
        <FileCheck2 size={13} />
        Consent decisions are cryptographically timestamped ({CONSENT_VERSION}) and legally binding under the institute
        digital-consent policy.
      </div>
    </div>
  );
};
