'use client';

import React, { useState } from 'react';
import { mockParentChildren, mockTenant } from '@/lib/mockData';
import { useAppStore, payFeeInvoice, FeeInvoiceRecord } from '@/lib/store';
import { Card, SectionCard, StatCard, Badge, PageHeader, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import confetti from 'canvas-confetti';
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
  Printer,
  Calendar,
  Building2,
  Lock,
  Sparkles,
  History,
  AlertCircle,
  FileCheck,
  Check,
} from 'lucide-react';

type PayMethod = 'UPI' | 'Card' | 'Net Banking';

export const ParentFees: React.FC = () => {
  const { feeInvoices } = useAppStore();
  const activeChild = mockParentChildren[0]; // Aarav Sharma by default
  const [selectedChildId, setSelectedChildId] = useState(activeChild.id);
  const currentChild = mockParentChildren.find((c) => c.id === selectedChildId) || activeChild;

  // Filter invoices for current selected child
  const childInvoices = feeInvoices.filter(
    (i) => i.studentName.toLowerCase().trim() === currentChild.name.toLowerCase().trim(),
  );

  const pendingInvoices = childInvoices.filter((i) => i.status !== 'paid');
  const paidInvoices = childInvoices.filter((i) => i.status === 'paid');

  const totalDue = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<FeeInvoiceRecord | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PayMethod>('UPI');
  const [upiId, setUpiId] = useState('rajesh.sharma@okhdfcbank');
  const [isProcessing, setIsProcessing] = useState(false);

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<FeeInvoiceRecord | null>(null);

  const handleOpenPay = (inv: FeeInvoiceRecord) => {
    setPayingInvoice(inv);
    setSelectedMethod('UPI');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    setIsProcessing(true);
    const chosenMethod = selectedMethod === 'UPI' ? `UPI (${upiId.split('@')[1] || 'BHIM'})` : selectedMethod;

    setTimeout(() => {
      const paidResult = payFeeInvoice(payingInvoice.id, chosenMethod);
      setIsProcessing(false);
      setPayingInvoice(null);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      toast(
        'Payment Successful!',
        'success',
        `₹${payingInvoice.amount.toLocaleString('en-IN')} paid for "${payingInvoice.title}". Receipt #${paidResult?.receiptNumber || 'REC-2026'} generated.`,
      );
    }, 900);
  };

  const handleDownloadReceipt = (inv: FeeInvoiceRecord) => {
    toast(
      'Receipt Downloaded',
      'success',
      `Official Fee Receipt ${inv.receiptNumber || inv.invoiceNumber} for ${inv.studentName} downloaded.`,
    );
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Multi-Child Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Fees & Payment Receipts"
          subtitle={
            <>
              Academic Session 2026-27 · Student:{' '}
              <span className="font-semibold text-foreground">{currentChild.name}</span> ({currentChild.grade.split(' - ')[0]})
            </>
          }
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

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Outstanding Dues"
          value={totalDue > 0 ? `₹${totalDue.toLocaleString('en-IN')}` : '₹0'}
          icon={<IndianRupee size={16} />}
          tone={totalDue > 0 ? 'warning' : 'success'}
          hint={totalDue > 0 ? `${pendingInvoices.length} pending invoice(s)` : 'All dues fully cleared'}
        />
        <StatCard
          label="Total Cleared & Paid"
          value={`₹${totalPaid.toLocaleString('en-IN')}`}
          icon={<CheckCircle2 size={16} />}
          tone="success"
          hint={`${paidInvoices.length} cleared receipt(s)`}
        />
        <StatCard
          label="Payment Gateway"
          value="PCI-DSS v4.0"
          icon={<ShieldCheck size={16} />}
          tone="info"
          hint="256-bit SSL · Instant Settlement"
        />
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PENDING DUES & OUTSTANDING INVOICES */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            <h3 className="text-section font-semibold text-foreground">Current Dues & Invoices</h3>
          </div>
          {totalDue === 0 && (
            <Badge tone="success" className="gap-1">
              <Check size={13} /> Zero Outstanding Balance
            </Badge>
          )}
        </div>

        {pendingInvoices.length === 0 ? (
          <div className="rounded-2xl border border-success/30 bg-success-soft/20 p-6 text-center shadow-xs">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success text-white mb-2 shadow-sm">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-meta font-bold text-foreground">All Dues Cleared for {currentChild.name}!</h4>
            <p className="mt-1 text-micro text-text-secondary max-w-md mx-auto">
              There are no pending invoices or outstanding balances for the current term. All previous receipts are archived below.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingInvoices.map((inv) => {
              const isExpanded = expandedId === inv.id;

              return (
                <Card key={inv.id} className="overflow-hidden rounded-2xl border border-warning/40 shadow-xs">
                  <div className="flex">
                    <span className="w-1.5 shrink-0 bg-warning" />
                    <div className="flex-1 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="warning">Due / Unpaid</Badge>
                            <span className="text-micro font-mono text-text-tertiary">{inv.invoiceNumber}</span>
                            <h3 className="text-section font-semibold text-foreground">{inv.title}</h3>
                          </div>
                          <div className="mt-1.5 text-meta text-text-secondary">
                            Due by <span className="font-semibold text-warning">{inv.dueDate}</span> · 0% Late-fee grace period active
                          </div>
                        </div>
                        <div className="shrink-0 sm:text-right">
                          <div className="text-2xl font-bold text-warning">
                            ₹{inv.amount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-micro text-text-tertiary">{inv.studentName} · {inv.studentRoll}</div>
                        </div>
                      </div>

                      {/* Expandable Breakdown */}
                      {inv.breakdown && inv.breakdown.length > 0 && (
                        <div className="mt-4">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                            className="inline-flex items-center gap-1.5 text-meta font-medium text-primary hover:underline"
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            {isExpanded ? 'Hide Fee Breakdown' : 'View Itemized Breakdown'}
                          </button>
                          {isExpanded && (
                            <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface-muted/60">
                              {inv.breakdown.map((item, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    'flex items-center justify-between px-4 py-2.5 text-meta',
                                    idx !== inv.breakdown.length - 1 && 'border-b border-border',
                                  )}
                                >
                                  <span className="text-text-secondary">{item.head}</span>
                                  <span className="font-semibold text-foreground">₹{item.amount.toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                              <div className="flex items-center justify-between bg-muted/80 px-4 py-2.5 text-meta font-bold">
                                <span className="text-foreground">Total Payable Amount</span>
                                <span className="text-foreground">₹{inv.amount.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-4 flex flex-wrap justify-end gap-2.5 pt-2 border-t border-border/60">
                        <button
                          onClick={() => handleOpenPay(inv)}
                          className="btn-primary gap-1.5 shadow-sm"
                        >
                          <CreditCard size={16} /> Pay Online Now (₹{inv.amount.toLocaleString('en-IN')})
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: FEE PAYMENT HISTORY & CLEARED RECEIPTS */}
      {/* ========================================================================= */}
      <SectionCard
        title="Fee Payment History & Cleared Receipts"
        icon={<History size={18} />}
        action={
          <span className="text-micro font-medium text-text-tertiary">
            {paidInvoices.length} Verified Payment(s)
          </span>
        }
      >
        {paidInvoices.length === 0 ? (
          <div className="p-6 text-center text-text-tertiary text-meta">
            No cleared payment receipts found for {currentChild.name}.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {paidInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface p-4 transition-all hover:border-border-strong sm:flex-row sm:items-center sm:justify-between shadow-2xs"
              >
                {/* Left details */}
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-success-soft text-success">
                    <Receipt size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-meta font-semibold text-foreground">{inv.title}</h4>
                      <Badge tone="success" className="gap-1">
                        <CheckCircle2 size={12} /> Paid & Cleared
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-micro text-text-tertiary">
                      <span>Receipt: <strong className="font-mono text-text-secondary">{inv.receiptNumber || 'MPS-REC-2026'}</strong></span>
                      <span>·</span>
                      <span>Paid on: <strong className="text-foreground">{inv.paidOn || 'Recently'}</strong></span>
                      {inv.paymentMethod && (
                        <>
                          <span>·</span>
                          <span>Via: <strong className="text-text-secondary">{inv.paymentMethod}</strong></span>
                        </>
                      )}
                      {inv.transactionId && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-text-tertiary">{inv.transactionId}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Amount & Receipt Action */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-bold text-success">
                      ₹{inv.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-micro text-text-tertiary">Official GST Cleared</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingReceipt(inv)}
                      className="btn-secondary gap-1 text-meta py-1.5"
                    >
                      <Receipt size={14} className="text-primary" /> View Receipt
                    </button>
                    <button
                      onClick={() => handleDownloadReceipt(inv)}
                      className="btn-secondary p-2 text-text-secondary hover:text-foreground"
                      title="Download PDF Receipt"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ========================================================================= */}
      {/* MODAL 1: PAYMENT GATEWAY CHECKOUT */}
      {/* ========================================================================= */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-border bg-surface-muted px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
                  <CreditCard size={18} />
                </span>
                <div>
                  <h3 className="text-section font-semibold text-foreground">EduOS Secure Fee Checkout</h3>
                  <p className="text-micro text-text-tertiary">256-bit Bank Grade Encrypted Gateway</p>
                </div>
              </div>
              <button
                onClick={() => setPayingInvoice(null)}
                disabled={isProcessing}
                className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmPayment} className="flex flex-1 flex-col overflow-y-auto p-6 gap-4 min-h-0">
              {/* Invoice Summary */}
              <div className="rounded-xl border border-border bg-surface-muted/60 p-4 flex flex-col gap-2">
                <span className="text-micro font-mono text-text-tertiary">{payingInvoice.invoiceNumber}</span>
                <h4 className="text-meta font-bold text-foreground">{payingInvoice.title}</h4>
                <div className="flex items-center justify-between pt-2 border-t border-border/80">
                  <span className="text-meta text-text-secondary">Payable for {payingInvoice.studentName}:</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{payingInvoice.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="label">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'Card', 'Net Banking'] as PayMethod[]).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setSelectedMethod(m)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-meta font-medium transition-all',
                        selectedMethod === m
                          ? 'border-primary bg-primary-soft text-primary shadow-2xs font-semibold'
                          : 'border-border bg-surface text-text-secondary hover:bg-muted',
                      )}
                    >
                      {m === 'UPI' && <Smartphone size={18} />}
                      {m === 'Card' && <CreditCard size={18} />}
                      {m === 'Net Banking' && <Building2 size={18} />}
                      <span>{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Method Specific Fields */}
              {selectedMethod === 'UPI' && (
                <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
                  <div>
                    <label className="label" htmlFor="upi-vpa">Virtual Payment Address (VPA / UPI ID)</label>
                    <input
                      id="upi-vpa"
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@okhdfcbank"
                      className="input font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between text-micro text-text-tertiary">
                    <span>Supported: Google Pay, PhonePe, Paytm, BHIM</span>
                    <Badge tone="success">Verified VPA</Badge>
                  </div>
                </div>
              )}

              {selectedMethod === 'Card' && (
                <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
                  <div>
                    <label className="label">Card Number</label>
                    <input
                      type="text"
                      defaultValue="4532 •••• •••• 8819"
                      className="input font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Expiry Date</label>
                      <input type="text" defaultValue="08/29" className="input font-mono" />
                    </div>
                    <div>
                      <label className="label">CVV</label>
                      <input type="password" defaultValue="•••" className="input font-mono" />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'Net Banking' && (
                <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-2">
                  <label className="label">Select Popular Bank</label>
                  <select className="input">
                    <option>HDFC Bank (Instant ECS)</option>
                    <option>State Bank of India (SBI)</option>
                    <option>ICICI Bank Corporate/Retail</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              {/* Security Seal */}
              <div className="flex items-center gap-2 text-micro text-text-tertiary px-1">
                <Lock size={13} className="text-success" />
                RBI & CBSE compliant direct nodal settlement to <strong>Modern Public School Society</strong>.
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  disabled={isProcessing}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary gap-1.5"
                >
                  <ShieldCheck size={16} />
                  {isProcessing ? 'Authorizing Payment…' : `Pay ₹${payingInvoice.amount.toLocaleString('en-IN')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: OFFICIAL PRINTABLE FEE RECEIPT */}
      {/* ========================================================================= */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in">
            {/* Modal Actions Bar */}
            <div className="shrink-0 flex items-center justify-between border-b border-border bg-surface-muted px-6 py-3.5">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-success" />
                <span className="text-meta font-semibold text-foreground">Official Fee Receipt</span>
                <Badge tone="success">Verified & Cleared</Badge>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="btn-secondary gap-1.5 text-meta py-1.5"
                >
                  <Printer size={15} /> Print Receipt
                </button>
                <button
                  onClick={() => handleDownloadReceipt(viewingReceipt)}
                  className="btn-primary gap-1.5 text-meta py-1.5"
                >
                  <Download size={15} /> Download PDF
                </button>
                <button
                  onClick={() => setViewingReceipt(null)}
                  className="grid h-8 w-8 place-items-center rounded-md text-text-tertiary hover:bg-muted hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Receipt Body (Printable Paper Layout) */}
            <div className="flex-1 overflow-y-auto p-8 bg-surface space-y-6">
              {/* School Header */}
              <div className="text-center border-b border-border pb-5">
                <div className="text-lg font-bold text-foreground uppercase tracking-wide">
                  {mockTenant.name}
                </div>
                <div className="text-micro text-text-secondary mt-0.5">
                  CBSE Affiliation No. 1030492 · School Code: 20491
                </div>
                <div className="text-micro text-text-tertiary">
                  Main Senior Wing Campus, Institutional Area, New Delhi - 110058
                </div>
                <div className="mt-3 inline-block rounded-md bg-muted px-3 py-1 text-meta font-bold text-foreground uppercase tracking-wider">
                  Official Student Fee Receipt
                </div>
              </div>

              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-surface-muted/40 p-4 text-meta">
                <div>
                  <span className="text-micro text-text-tertiary block">Student Name</span>
                  <strong className="text-foreground">{viewingReceipt.studentName}</strong>
                </div>
                <div>
                  <span className="text-micro text-text-tertiary block">Roll Number / Class</span>
                  <strong className="text-foreground">{viewingReceipt.studentRoll || 'CBSE-10A-04'} · {viewingReceipt.batchName || 'Class 10-A'}</strong>
                </div>
                <div>
                  <span className="text-micro text-text-tertiary block">Receipt Number</span>
                  <strong className="font-mono text-primary">{viewingReceipt.receiptNumber || 'MPS-REC-2026-44102'}</strong>
                </div>
                <div>
                  <span className="text-micro text-text-tertiary block">Payment Date & Time</span>
                  <strong className="text-foreground">{viewingReceipt.paidOn || '05 Apr 2026, 11:30 AM'}</strong>
                </div>
                <div>
                  <span className="text-micro text-text-tertiary block">Transaction Reference</span>
                  <span className="font-mono text-micro text-text-secondary">{viewingReceipt.transactionId || 'TXN-UPI-9921402847'}</span>
                </div>
                <div>
                  <span className="text-micro text-text-tertiary block">Payment Mode</span>
                  <strong className="text-foreground">{viewingReceipt.paymentMethod || 'UPI Instant Pay'}</strong>
                </div>
              </div>

              {/* Itemized Heads Table */}
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left text-meta">
                  <thead className="border-b border-border bg-surface-muted text-micro font-semibold uppercase text-text-tertiary">
                    <tr>
                      <th className="px-4 py-2.5">Particulars / Fee Head</th>
                      <th className="px-4 py-2.5 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {viewingReceipt.breakdown?.map((head, idx) => (
                      <tr key={idx} className="hover:bg-muted/40">
                        <td className="px-4 py-3 text-text-secondary">{head.head}</td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          ₹{head.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/80 font-bold">
                      <td className="px-4 py-3 text-foreground">Total Amount Paid</td>
                      <td className="px-4 py-3 text-right text-lg text-success">
                        ₹{viewingReceipt.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature & Stamp Footer */}
              <div className="flex items-end justify-between pt-6 border-t border-dashed border-border">
                <div className="text-micro text-text-tertiary">
                  <div>* Computer generated digital e-receipt. No physical signature required.</div>
                  <div>* Fees once paid are non-refundable as per CBSE institutional bye-laws.</div>
                </div>

                <div className="text-center">
                  <div className="inline-block rounded-lg border border-success/40 bg-success-soft/30 px-3 py-1.5 text-micro font-bold text-success uppercase tracking-wider mb-1">
                    ✓ Accounts Cleared & Stamped
                  </div>
                  <div className="text-micro text-text-tertiary">Accounts Officer, MPS Society</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
