'use client';

import React, { useState } from 'react';
import { mockFeeInvoices } from '@/lib/mockData';
import { Card, SectionCard, StatCard, Badge, PageHeader, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  CreditCard,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Smartphone,
  CheckCircle2,
  X,
  IndianRupee,
  Receipt,
} from 'lucide-react';

interface FeeInvoiceItem {
  id: string;
  title: string;
  amount: number;
  dueDate?: string;
  status: string;
  paidOn?: string;
  transactionId?: string;
  receiptUrl?: string;
  studentName: string;
  breakdown?: { head: string; amount: number }[];
}

type PayMethod = 'UPI' | 'Card' | 'Net Banking';

export const ParentFees: React.FC = () => {
  const [invoices, setInvoices] = useState<FeeInvoiceItem[]>(mockFeeInvoices);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [method, setMethod] = useState<PayMethod>('UPI');
  const [processing, setProcessing] = useState(false);
  const [receiptReady, setReceiptReady] = useState<Record<string, boolean>>({});

  const totalDue = invoices
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  const paidCount = invoices.filter((i) => i.status === 'paid').length;

  const openConfirm = (id: string) => {
    setPayingId(id);
    setMethod('UPI');
  };

  const confirmPayment = (inv: FeeInvoiceItem) => {
    setProcessing(true);
    const receiptId = `APX-REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const txnId = `TXN-${method === 'UPI' ? 'UPI' : method === 'Card' ? 'CARD' : 'NB'}-${Math.floor(
      10000000 + Math.random() * 90000000,
    )}`;

    // Simulate gateway round-trip
    setTimeout(() => {
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === inv.id
            ? {
                ...i,
                status: 'paid',
                paidOn: 'Today, 03:30 PM',
                transactionId: txnId,
                receiptUrl: `/receipts/${receiptId}.pdf`,
              }
            : i,
        ),
      );
      setReceiptReady((r) => ({ ...r, [inv.id]: true }));
      setProcessing(false);
      setPayingId(null);
      toast('Payment successful', 'success', `Receipt ${receiptId} · ₹${inv.amount.toLocaleString('en-IN')} paid via ${method}`);
    }, 900);
  };

  const downloadReceipt = (inv: FeeInvoiceItem) => {
    toast('Receipt downloading', 'info', `${inv.transactionId ?? 'Official receipt'} · PDF generated for ${inv.studentName}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fees & invoices"
        subtitle={
          <>
            Student <span className="font-semibold text-foreground">Aarav Sharma</span> · Class 11 — JEE Advanced Alpha
          </>
        }
      />

      {/* Summary tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total amount due"
          value={totalDue > 0 ? `₹${totalDue.toLocaleString('en-IN')}` : '₹0'}
          icon={<IndianRupee size={16} />}
          tone={totalDue > 0 ? 'warning' : 'success'}
          hint={totalDue > 0 ? 'Across open invoices' : 'No pending dues'}
        />
        <StatCard
          label="Invoices cleared"
          value={paidCount}
          icon={<CheckCircle2 size={16} />}
          tone="success"
          hint={`of ${invoices.length} issued this year`}
        />
        <StatCard
          label="Payment security"
          value="PCI-DSS"
          icon={<ShieldCheck size={16} />}
          tone="info"
          hint="UPI · Card · Net Banking"
        />
      </div>

      {/* Invoices */}
      <div className="flex flex-col gap-4">
        {invoices.map((inv) => {
          const isPaid = inv.status === 'paid';
          const isExpanded = expandedId === inv.id;
          const isConfirming = payingId === inv.id;
          const showReceipt = isPaid && (receiptReady[inv.id] || !!inv.receiptUrl);

          return (
            <Card key={inv.id} className="overflow-hidden">
              {/* Accent rail + header */}
              <div className="flex">
                <span className={cn('w-1 shrink-0', isPaid ? 'bg-success' : 'bg-warning')} />
                <div className="flex-1 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={isPaid ? 'success' : 'warning'}>
                          {isPaid ? 'Paid & cleared' : 'Due / unpaid'}
                        </Badge>
                        <h3 className="text-section text-foreground">{inv.title}</h3>
                      </div>
                      <div className="mt-1.5 text-meta text-text-secondary">
                        {isPaid ? (
                          <>
                            Paid on <span className="font-semibold text-foreground">{inv.paidOn}</span> · Txn{' '}
                            <span className="font-mono text-text-secondary">{inv.transactionId}</span>
                          </>
                        ) : (
                          <>
                            Due by <span className="font-semibold text-warning">{inv.dueDate}</span> · 0% late-fee grace active
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <div className={cn('text-2xl font-semibold', isPaid ? 'text-success' : 'text-warning')}>
                        ₹{inv.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-micro text-text-tertiary">{inv.studentName}</div>
                    </div>
                  </div>

                  {/* Breakdown (expandable) */}
                  {inv.breakdown && inv.breakdown.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                        className="inline-flex items-center gap-1.5 text-meta font-medium text-primary hover:text-primary-hover"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        {isExpanded ? 'Hide fee breakdown' : 'View fee breakdown'}
                      </button>
                      {isExpanded && (
                        <div className="mt-3 overflow-hidden rounded-md border border-border bg-surface-muted">
                          {inv.breakdown.map((item, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                'flex items-center justify-between px-4 py-2.5 text-meta',
                                idx !== inv.breakdown!.length - 1 && 'border-b border-border',
                              )}
                            >
                              <span className="text-text-secondary">{item.head}</span>
                              <span className="font-semibold text-foreground">₹{item.amount.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between bg-muted px-4 py-2.5 text-meta font-semibold">
                            <span className="text-foreground">Total payable</span>
                            <span className="text-foreground">₹{inv.amount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline confirm panel */}
                  {isConfirming && !isPaid && (
                    <div className="mt-4 rounded-lg border border-primary/25 bg-primary-soft p-4 animate-fade-in">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={18} className="text-primary" />
                          <span className="text-meta font-semibold text-foreground">Confirm secure payment</span>
                        </div>
                        <button
                          onClick={() => setPayingId(null)}
                          className="grid h-6 w-6 place-items-center rounded-md text-text-tertiary hover:bg-surface"
                          aria-label="Cancel"
                          disabled={processing}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="eyebrow">Payable amount</span>
                        <span className="text-lg font-semibold text-foreground">
                          ₹{inv.amount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="mt-3">
                        <span className="eyebrow">Payment method</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(['UPI', 'Card', 'Net Banking'] as PayMethod[]).map((m) => (
                            <button
                              key={m}
                              onClick={() => setMethod(m)}
                              disabled={processing}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-meta font-medium transition-colors',
                                method === m
                                  ? 'border-primary bg-surface text-primary shadow-xs'
                                  : 'border-border bg-surface text-text-secondary hover:border-border-strong',
                              )}
                            >
                              <Smartphone size={14} /> {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <button onClick={() => setPayingId(null)} className="btn-secondary" disabled={processing}>
                          Cancel
                        </button>
                        <button onClick={() => confirmPayment(inv)} className="btn-primary" disabled={processing}>
                          {processing ? 'Processing…' : `Confirm & pay ₹${inv.amount.toLocaleString('en-IN')}`}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {isPaid ? (
                      <button onClick={() => downloadReceipt(inv)} className="btn-secondary">
                        <Download size={16} /> Download receipt
                      </button>
                    ) : (
                      !isConfirming && (
                        <button onClick={() => openConfirm(inv.id)} className="btn-primary">
                          <CreditCard size={16} /> Pay now
                        </button>
                      )
                    )}
                    {showReceipt && !isPaid && (
                      <button onClick={() => downloadReceipt(inv)} className="btn-secondary">
                        <Receipt size={16} /> Download receipt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
