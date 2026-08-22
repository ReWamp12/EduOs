'use client';

import React, { useState } from 'react';
import {
  mockProfiles,
  mockParentChildren,
} from '@/lib/mockData';
import { useAppStore } from '@/lib/store';
import { Card, Badge } from '@/components/ui';
import { ParentAttendanceAlerts } from './ParentAttendanceAlerts';
import {
  CreditCard,
  Calendar,
  FileCheck2,
} from 'lucide-react';

export const ParentOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { feeInvoices, consentForms } = useAppStore();
  const [selectedChildId, setSelectedChildId] = useState(mockParentChildren[0]?.id || 'child-1');
  const activeChild = mockParentChildren.find((c) => c.id === selectedChildId) || mockParentChildren[0];

  const childInvoices = feeInvoices.filter(
    (i) => i.studentName.toLowerCase().trim() === activeChild.name.toLowerCase().trim(),
  );
  const unpaidInvoice = childInvoices.find((i) => i.status !== 'paid');

  const pendingConsent = consentForms.filter((f) =>
    f.responses.some(
      (r) =>
        r.studentName.toLowerCase().trim() === activeChild.name.toLowerCase().trim() &&
        r.status === 'pending',
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header + child switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="eyebrow">Multi-child parent account</div>
          <h2 className="mt-1 text-title text-foreground">
            Welcome, {mockProfiles.parent.firstName} {mockProfiles.parent.lastName}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface p-1 shadow-xs">
          {mockParentChildren.map((child) => {
            const isSelected = child.id === selectedChildId;
            const firstName = child.name?.split(' ')[0] || child.name;
            const gradeLabel = child.grade?.split(' - ')[0] || child.batchName?.split(' — ')[0] || 'Class 10';
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={[
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-meta transition-colors',
                  isSelected ? 'bg-primary-soft font-semibold text-primary' : 'font-medium text-text-secondary hover:bg-muted',
                ].join(' ')}
              >
                <img src={child.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                {firstName} · {gradeLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active child summary */}
      {activeChild && (
        <Card className="p-5 rounded-2xl border border-border shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={activeChild.avatarUrl}
                alt={activeChild.name}
                className="h-14 w-14 rounded-xl object-cover ring-2 ring-border"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-section font-semibold text-foreground">{activeChild.name}</h3>
                  <Badge tone="primary">{activeChild.grade || activeChild.batchName}</Badge>
                </div>
                <div className="mt-1 text-meta text-text-secondary">
                  Roll <span className="font-semibold text-foreground">{activeChild.rollNumber}</span> · {activeChild.branch || 'Senior Wing'} · Target{' '}
                  <span className="font-semibold text-primary">{activeChild.targetExam}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-8 sm:text-right">
              <div>
                <div className="eyebrow">Attendance</div>
                <div className="mt-1 text-2xl font-semibold text-success">
                  {activeChild.attendance ?? activeChild.attendancePct ?? 94.6}%
                </div>
              </div>
              <div>
                <div className="eyebrow">Latest mock score</div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {activeChild.latestScore || '74/80 (92.5%)'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Real-time attendance alerts from teachers */}
      <ParentAttendanceAlerts />

      {/* Action metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Fees */}
        <Card className="flex flex-col p-5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-start justify-between">
            <span className="eyebrow">Fees & invoice</span>
            <span className="grid h-8 w-8 place-items-center rounded-md bg-warning-soft text-warning">
              <CreditCard size={16} />
            </span>
          </div>
          <div className={`mt-3 text-xl font-semibold ${unpaidInvoice ? 'text-warning' : 'text-success'}`}>
            {unpaidInvoice ? `₹${unpaidInvoice.amount.toLocaleString()} due` : 'Fully paid'}
          </div>
          <div className="mt-1 text-micro text-text-tertiary">
            {unpaidInvoice ? `Due by ${unpaidInvoice.dueDate}` : 'Term 1 & 2 clear'}
          </div>
          {unpaidInvoice ? (
            <button onClick={() => onNavigate('fees')} className="btn-primary mt-4 w-full">
              Pay online
            </button>
          ) : (
            <button onClick={() => onNavigate('fees')} className="btn-secondary mt-4 w-full">
              View Receipts
            </button>
          )}
        </Card>

        {/* Consent */}
        <Card className="flex flex-col p-5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-start justify-between">
            <span className="eyebrow">Digital Consent</span>
            <span className={`grid h-8 w-8 place-items-center rounded-md ${pendingConsent.length ? 'bg-destructive-soft text-destructive' : 'bg-success-soft text-success'}`}>
              <FileCheck2 size={16} />
            </span>
          </div>
          <div className={`mt-3 text-xl font-semibold ${pendingConsent.length ? 'text-destructive' : 'text-success'}`}>
            {pendingConsent.length} pending
          </div>
          <div className="mt-1 text-micro text-text-tertiary">Field trips & school authorizations</div>
          <button onClick={() => onNavigate('consent')} className="btn-secondary mt-4 w-full">
            Review & Sign
          </button>
        </Card>

        {/* PTM */}
        <Card className="flex flex-col p-5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-start justify-between">
            <span className="eyebrow">PTM Consultation</span>
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary-soft text-primary">
              <Calendar size={16} />
            </span>
          </div>
          <div className="mt-3 text-xl font-semibold text-foreground">Slots Open</div>
          <div className="mt-1 text-micro text-text-tertiary">Physics · Prof. Amit Verma</div>
          <button onClick={() => onNavigate('ptm')} className="btn-secondary mt-4 w-full">
            Book Time Slot
          </button>
        </Card>
      </div>
    </div>
  );
};
