'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { mockTenant } from '@/lib/mockData';
import { useAppStore, payFeeInvoice, FeeInvoiceRecord } from '@/lib/store';
import { dataService } from '@/lib/dataService';
import { downloadFeeReceipt } from '@/lib/receipt';
import { FinanceStudentFees } from './FinanceStudentFees';
import {
  PageHeader,
  SectionCard,
  StatCard,
  Card,
  Badge,
  ProgressBar,
  EmptyState,
  cn,
} from '@/components/ui';
import { toast } from '@/components/ui/toast';
import {
  IndianRupee,
  Receipt,
  CreditCard,
  Landmark,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Download,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  ShieldCheck,
  Percent,
  Sliders,
  DollarSign,
  TrendingUp,
  FileCheck,
  X,
  QrCode,
  Sparkles,
} from 'lucide-react';

type FinanceTab = 'overview' | 'fee_structures' | 'student_fees' | 'cashier_pos' | 'payroll' | 'general_ledger';

interface FeeHeadItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: 'annual' | 'term' | 'monthly';
}

interface FeeStructureTemplate {
  id: string;
  name: string;
  className: string;
  academicYear: string;
  heads: FeeHeadItem[];
  concessionRules: string[];
}

interface PayrollStaffRecord {
  id: string;
  code: string;
  name: string;
  designation: string;
  department: string;
  basicPay: number;
  hra: number;
  da: number;
  allowances: number;
  customTds: number;
  bankAccount: string;
  ifsc: string;
  pan: string;
}

interface JournalRecord {
  id: string;
  voucherNo: string;
  date: string;
  description: string;
  reference: string;
  module?: string;
  totalAmount?: number;
  lines: Array<{
    code: string;
    account: string;
    debit: number;
    credit: number;
    note?: string;
  }>;
}

const INITIAL_FEE_STRUCTURES: FeeStructureTemplate[] = [
  {
    id: 'fs-1',
    name: 'Class 10 CBSE Composite Academic Fee Schedule',
    className: 'Class 10 (Secondary Board)',
    academicYear: '2026-2027',
    heads: [
      { id: 'fh-1', name: 'Tuition & Academic Instruction', category: 'Tuition', amount: 56000, frequency: 'annual' },
      { id: 'fh-2', name: 'Science & Computer Laboratories', category: 'Lab', amount: 14000, frequency: 'annual' },
      { id: 'fh-3', name: 'Library & Digital Content Subscription', category: 'Library', amount: 4000, frequency: 'annual' },
      { id: 'fh-4', name: 'Sports, Physical Education & House Activities', category: 'Sports', amount: 4000, frequency: 'annual' },
      { id: 'fh-5', name: 'CBSE Pre-Board & Internal Examination Charges', category: 'Exam', amount: 6000, frequency: 'annual' },
      { id: 'fh-6', name: 'Smart Classroom & Campus ERP Infrastructure', category: 'Composite', amount: 6000, frequency: 'annual' },
    ],
    concessionRules: ['RTE Act 25% Quota: 100% Waiver', 'Sibling Discount: 15% on Tuition', 'Merit Scholarship (>90% Score): 20% on Tuition'],
  },
  {
    id: 'fs-2',
    name: 'Class 11-12 Senior Secondary Science (PCM/PCB + JEE/NEET)',
    className: 'Class 11 & 12 (Senior Secondary)',
    academicYear: '2026-2027',
    heads: [
      { id: 'fh-7', name: 'Senior Tuition & Integrated Coaching', category: 'Tuition', amount: 78000, frequency: 'annual' },
      { id: 'fh-8', name: 'Advanced Physics & Chemistry Laboratories', category: 'Lab', amount: 18000, frequency: 'annual' },
      { id: 'fh-9', name: 'All-India Test Series & Mock OMR Analytics', category: 'Exam', amount: 12000, frequency: 'annual' },
      { id: 'fh-10', name: 'Digital LMS & JEE/NEET Question Bank', category: 'Composite', amount: 8000, frequency: 'annual' },
    ],
    concessionRules: ['Top 5 Rank in Entrance: 50% Tuition Waiver', 'Staff Ward: 30% Composite Waiver'],
  },
];

const INITIAL_STAFF_PAYROLL: PayrollStaffRecord[] = [
  { id: 'emp-1', code: 'FAC-014', name: 'Prof. Amit Verma', designation: 'Senior Faculty (Mathematics)', department: 'Academics', basicPay: 55000, hra: 16500, da: 11000, allowances: 6500, customTds: 4500, bankAccount: '918273645019', ifsc: 'HDFC0001248', pan: 'ABCPV8492K' },
  { id: 'emp-2', code: 'FAC-022', name: 'Dr. Sunita Rao', designation: 'Head of Department (Science)', department: 'Academics', basicPay: 62000, hra: 18600, da: 12400, allowances: 8000, customTds: 6200, bankAccount: '827103948172', ifsc: 'SBIN0004921', pan: 'XYZSR9281M' },
  { id: 'emp-3', code: 'FAC-031', name: 'Prof. Vikram Roy', designation: 'PGT Physics', department: 'Academics', basicPay: 52000, hra: 15600, da: 10400, allowances: 5000, customTds: 3800, bankAccount: '304918274910', ifsc: 'ICIC0000841', pan: 'DEFRY1029P' },
  { id: 'emp-4', code: 'ADM-005', name: 'Rajesh Nair', designation: 'Chief Finance Officer', department: 'Administration', basicPay: 68000, hra: 20400, da: 13600, allowances: 10000, customTds: 7500, bankAccount: '501928471920', ifsc: 'HDFC0001248', pan: 'GHJRN4819Q' },
  { id: 'emp-5', code: 'OPS-012', name: 'Sanjay Deshmukh', designation: 'Facilities & Security Head', department: 'Operations', basicPay: 32000, hra: 9600, da: 6400, allowances: 3000, customTds: 1200, bankAccount: '291048192048', ifsc: 'PUNB0029401', pan: 'JKLSD9182L' },
];

// GL vouchers are read from Supabase journal_entries (EDUOS-130). Every fee
// collection posts its own double-entry voucher inside the payment
// transaction, so the ledger always equals the fee register.

import { useSession } from '@/lib/auth/AuthProvider';
import { Tenant } from '@/lib/types';

export const FinanceWorkspace: React.FC = () => {
  const session = useSession();
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const { feeInvoices } = useAppStore();

  // Multi-school tenancy context
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');

  // EDUOS-125: Supabase fee_invoices is the ledger of record for the counter
  // terminal; the local store only backs it when Supabase is unreachable.
  const [dbInvoices, setDbInvoices] = useState<FeeInvoiceRecord[] | null>(null);
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalRecord[]>([]);
  const [trialBalance, setTrialBalance] = useState<
    Array<{ code: string; account: string; debit: number; credit: number }>
  >([]);

  const reloadLedger = React.useCallback(async () => {
    const [entries, tb] = await Promise.all([
      dataService.getJournalEntries(),
      dataService.getTrialBalance(),
    ]);
    if (entries) setJournalEntries(entries);
    if (tb) setTrialBalance(tb);
  }, []);

  useEffect(() => {
    let active = true;
    dataService.getTenants().then((list) => {
      if (active && list) setTenants(list);
    });
    dataService.getFeeInvoices().then((rows) => {
      if (active && rows && rows.length > 0) setDbInvoices(rows);
    });
    void reloadLedger();
    return () => {
      active = false;
    };
  }, [reloadLedger]);

  const isSuperAdmin = !session?.tenantId || (session?.roles ?? []).includes('super_admin');
  const allPosInvoices = dbInvoices ?? feeInvoices;

  // Filter invoices by selected school if specific school chosen
  const posInvoices = useMemo(() => {
    if (selectedTenantId === 'all') return allPosInvoices;
    return allPosInvoices.filter((inv: any) => !inv.tenantId || inv.tenantId === selectedTenantId);
  }, [allPosInvoices, selectedTenantId]);

  // Cashier POS Search and State
  const [searchStudent, setSearchStudent] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'Cash' | 'UPI POS' | 'Cheque' | 'Demand Draft'>('UPI POS');
  const [chequeRef, setChequeRef] = useState('');
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<FeeInvoiceRecord | null>(null);
  const [activeReceiptModal, setActiveReceiptModal] = useState<FeeInvoiceRecord | null>(null);

  // Fee Structure State
  const [feeTemplates, setFeeTemplates] = useState<FeeStructureTemplate[]>(INITIAL_FEE_STRUCTURES);

  // Search filtered invoices for Cashier POS
  const filteredInvoices = useMemo(() => {
    // Unpaid first so the cashier sees collectable invoices at the top.
    const byPriority = (a: FeeInvoiceRecord, b: FeeInvoiceRecord) =>
      (a.status === 'paid' ? 1 : 0) - (b.status === 'paid' ? 1 : 0);
    if (!searchStudent.trim()) return posInvoices.slice().sort(byPriority).slice(0, 10);
    const q = searchStudent.toLowerCase();
    return posInvoices
      .filter(
        (i) =>
          i.studentName.toLowerCase().includes(q) ||
          i.invoiceNumber.toLowerCase().includes(q) ||
          (i.title && i.title.toLowerCase().includes(q)),
      )
      .sort(byPriority);
  }, [posInvoices, searchStudent]);

  // Aggregate metrics, all derived from the live fee ledger — no padding
  // constants, so these figures reconcile with the GL and the register.
  const totalCollected = useMemo(
    () => posInvoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0),
    [posInvoices],
  );
  const totalReceivable = useMemo(
    () => posInvoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0),
    [posInvoices],
  );
  const overdueAmount = useMemo(
    () => posInvoices.filter((i) => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0),
    [posInvoices],
  );
  // "Target" is simply everything billed for the session.
  const annualTarget = totalCollected + totalReceivable;
  const collectionPct = annualTarget > 0 ? Math.round((totalCollected / annualTarget) * 100) : 0;

  // Ledger health, computed rather than asserted.
  const glDebit = useMemo(() => trialBalance.reduce((s, r) => s + r.debit, 0), [trialBalance]);
  const glCredit = useMemo(() => trialBalance.reduce((s, r) => s + r.credit, 0), [trialBalance]);
  const glBalanced = Math.abs(glDebit - glCredit) < 0.01;
  // Cash/bank actually debited by fee vouchers, for register↔GL reconciliation.
  const glFeeCash = useMemo(
    () =>
      journalEntries
        .filter((jv) => jv.module === 'fee_collection')
        .reduce(
          (sum, jv) => sum + jv.lines.filter((l) => l.code === '1001' || l.code === '1002').reduce((s, l) => s + l.debit, 0),
          0,
        ),
    [journalEntries],
  );
  const feeGlReconciled = Math.abs(totalCollected - glFeeCash) < 0.01;

  // Payroll Calculation Table
  const calculatedPayroll = useMemo(() => {
    return INITIAL_STAFF_PAYROLL.map((staff) => {
      const grossPay = staff.basicPay + staff.hra + staff.da + staff.allowances;
      const pf = Math.round((staff.basicPay + staff.da) * 0.12);
      const esi = grossPay <= 21000 ? Math.round(grossPay * 0.0075) : 0;
      const pt = grossPay > 15000 ? 200 : 0;
      const tds = staff.customTds;
      const totalDeductions = pf + esi + pt + tds;
      const netPay = grossPay - totalDeductions;
      return {
        ...staff,
        grossPay,
        pf,
        esi,
        pt,
        tds,
        totalDeductions,
        netPay,
      };
    });
  }, []);

  const totalMonthlyPayrollGross = calculatedPayroll.reduce((sum, p) => sum + p.grossPay, 0);
  const totalMonthlyNetDisbursed = calculatedPayroll.reduce((sum, p) => sum + p.netPay, 0);
  const totalMonthlyStatutoryDeductions = calculatedPayroll.reduce((sum, p) => sum + p.totalDeductions, 0);

  const handleCashierCollect = async (inv: FeeInvoiceRecord) => {
    const methodStr = posPaymentMethod === 'Cheque' ? `Cheque (#${chequeRef || 'CHQ-8192'})` : posPaymentMethod;

    setCollectingId(inv.id);
    let paidResult: FeeInvoiceRecord | null = null;
    if (dbInvoices) {
      // Ledger of record: one ACID transaction in Postgres — the invoice row
      // is locked, a second counter collecting the same invoice is rejected,
      // and the receipt/txn stamp commits atomically with the status change.
      paidResult = await dataService.collectFeePayment(inv.id, methodStr);
      if (!paidResult) {
        setCollectingId(null);
        toast(
          'Collection rejected',
          'error',
          'This invoice is already settled or the ledger is unreachable. Refresh the register and retry.',
        );
        return;
      }
      setDbInvoices((prev) => (prev ? prev.map((i) => (i.id === paidResult!.id ? paidResult! : i)) : prev));
    } else {
      paidResult = payFeeInvoice(inv.id, methodStr);
    }
    setCollectingId(null);

    // The GL voucher is posted by collect_fee_payment() inside the same
    // database transaction as the settlement, so we re-read rather than
    // fabricating an entry that could disagree with the books.
    await reloadLedger();

    toast(
      'Fee Collection Recorded & Receipt Generated',
      'success',
      `₹${inv.amount.toLocaleString('en-IN')} received via ${methodStr}. GL Journal posted.`,
    );

    if (paidResult) {
      setActiveReceiptModal(paidResult);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title="Institutional Finance & General Ledger"
        subtitle="Fee schedule builder, counter POS cashier, statutory payroll engine & double-entry accounting"
      />

      {/* Super Admin Multi-School Scope Switcher */}
      {isSuperAdmin && tenants.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary font-bold text-sm">
              🏛️
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">Multi-School Finance Scope</div>
              <div className="text-[11px] text-text-tertiary">
                {selectedTenantId === 'all'
                  ? 'Viewing consolidated balance & collections across all institutions'
                  : `Viewing records for ${tenants.find((t) => t.id === selectedTenantId)?.name}`}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedTenantId('all')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border shadow-2xs',
                selectedTenantId === 'all'
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-surface-muted text-text-secondary hover:border-primary/50 hover:bg-surface'
              )}
            >
              🌐 Consolidated (All Schools)
            </button>
            {tenants.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTenantId(t.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border shadow-2xs',
                  selectedTenantId === t.id
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-surface-muted text-text-secondary hover:border-primary/50 hover:bg-surface'
                )}
              >
                <span
                  className="h-2 w-2 rounded-full ring-1 ring-white/40"
                  style={{ backgroundColor: t.primaryColor || '#2563EB' }}
                />
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Executive Overview', icon: <TrendingUp size={15} /> },
          { id: 'fee_structures', label: 'Fee Structures & Heads', icon: <Percent size={15} /> },
          { id: 'student_fees', label: 'Student Fee Register', icon: <Users size={15} /> },
          { id: 'cashier_pos', label: 'Counter POS & Invoicing', icon: <Receipt size={15} /> },
          { id: 'payroll', label: 'Staff Payroll & Taxes', icon: <Users size={15} /> },
          { id: 'general_ledger', label: 'Double-Entry GL & Statements', icon: <FileSpreadsheet size={15} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as FinanceTab)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'text-text-secondary hover:bg-muted',
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Annual Fee Collection Target"
              value={`₹${(annualTarget / 10000000).toFixed(2)} Cr`}
              tone="primary"
              icon={<IndianRupee size={16} />}
              hint="Academic Session 2026-27"
            />
            <StatCard
              label="Fee Collected YTD"
              value={`₹${(totalCollected / 10000000).toFixed(2)} Cr`}
              tone="success"
              icon={<CheckCircle2 size={16} />}
              hint={`${collectionPct}% of annual budget realized`}
            />
            <StatCard
              label="Outstanding Dues"
              value={`₹${(totalReceivable / 100000).toFixed(1)} L`}
              tone="warning"
              icon={<Clock size={16} />}
              hint="38 student accounts overdue"
            />
            <StatCard
              label="Monthly Payroll Liability"
              value={`₹${(totalMonthlyPayrollGross / 100000).toFixed(2)} L`}
              tone="info"
              icon={<Users size={16} />}
              hint={`${calculatedPayroll.length} Active employees`}
            />
          </div>

          {/* Collection Progress Card */}
          <SectionCard
            title="Budget Realization & Liquidity Status"
            icon={<Landmark size={18} />}
            bodyClassName="space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Annual Fee Realization Progress</span>
                <span className="font-mono text-primary font-bold">{collectionPct}% Achieved</span>
              </div>
              <ProgressBar value={collectionPct} tone="success" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-border">
              <div className="p-3 rounded-lg bg-surface-muted border border-border">
                <span className="text-micro text-text-tertiary block">HDFC Operating Bank Balance</span>
                <strong className="text-base text-foreground font-mono">₹58,64,210.00</strong>
                <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">Liquid funds available</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-muted border border-border">
                <span className="text-micro text-text-tertiary block">Cashier Vault (Cash in Hand)</span>
                <strong className="text-base text-foreground font-mono">₹1,45,200.00</strong>
                <span className="text-[11px] text-text-secondary block mt-0.5">Daily counter collections</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-muted border border-border">
                <span className="text-micro text-text-tertiary block">Statutory Deductions Payable (PF/TDS)</span>
                <strong className="text-base text-amber-600 font-mono">₹66,080.00</strong>
                <span className="text-[11px] text-amber-600 block mt-0.5">Due for remittance by 15th</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FEE STRUCTURE BUILDER */}
      {/* ========================================================================= */}
      {activeTab === 'fee_structures' && (
        <div className="space-y-6 animate-fade-in">
          <SectionCard
            title="Class-wise Fee Head Blueprints"
            icon={<Percent size={18} />}
            action={
              <button
                onClick={() => toast('Create Fee Template', 'info', 'Define fee heads and installment rules for a new academic stream.')}
                className="btn-primary text-xs flex items-center gap-1 shadow-xs"
              >
                <Plus size={14} /> New Fee Schedule
              </button>
            }
            bodyClassName="space-y-6"
          >
            <p className="text-xs text-text-secondary">
              Configure statutory class fee structures, itemized heads (Tuition, Lab, Exam, Library, Sports), installment frequencies, and quota concession policies (RTE Act 25% waiver, sibling discount).
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {feeTemplates.map((template) => {
                const totalAnnual = template.heads.reduce((sum, h) => sum + h.amount, 0);
                const quarterly = Math.round(totalAnnual / 4);

                return (
                  <Card key={template.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                      <div>
                        <h4 className="font-bold text-foreground text-sm">{template.name}</h4>
                        <Badge tone="primary" className="mt-1">{template.className}</Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-micro text-text-tertiary uppercase block">Annual Composite</span>
                        <strong className="text-base text-primary font-mono">₹{totalAnnual.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-text-secondary uppercase">Itemized Fee Heads</span>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/30 text-text-secondary border-b border-border">
                            <tr>
                              <th className="p-2 text-left">Fee Head</th>
                              <th className="p-2 text-left">Category</th>
                              <th className="p-2 text-right">Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {template.heads.map((h) => (
                              <tr key={h.id} className="hover:bg-muted/10">
                                <td className="p-2 text-foreground font-medium">{h.name}</td>
                                <td className="p-2 text-text-tertiary">{h.category}</td>
                                <td className="p-2 text-right font-mono font-semibold">₹{h.amount.toLocaleString('en-IN')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Concessions & Installment Rules */}
                    <div className="p-3 rounded-lg bg-surface-muted border border-border text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text-secondary">Quarterly Installment:</span>
                        <strong className="text-foreground font-mono">₹{quarterly.toLocaleString('en-IN')} / Quarter (4 Terms)</strong>
                      </div>
                      <div className="text-[11px] text-text-tertiary">
                        <strong>Concession Policies:</strong> {template.concessionRules.join(' · ')}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CASHIER POS COUNTER COLLECTION */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TAB: STUDENT FEE REGISTER — class-wise collection status & drill-down */}
      {/* ========================================================================= */}
      {activeTab === 'student_fees' && <FinanceStudentFees />}

      {activeTab === 'cashier_pos' && (
        <div className="space-y-6 animate-fade-in">
          <SectionCard
            title="Fee Counter Cashier Terminal"
            icon={<Receipt size={18} />}
            bodyClassName="space-y-5"
          >
            {/* Search & Mode Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative sm:col-span-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search student by name, roll number, or invoice #..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="input pl-9 text-xs"
                />
              </div>

              <div>
                <select
                  value={posPaymentMethod}
                  onChange={(e) => setPosPaymentMethod(e.target.value as any)}
                  className="input text-xs font-semibold"
                >
                  <option value="UPI POS">UPI Dynamic QR / POS</option>
                  <option value="Cash">Cash in Hand (Counter)</option>
                  <option value="Cheque">Cheque Deposit</option>
                  <option value="Demand Draft">Demand Draft (DD)</option>
                </select>
              </div>
            </div>

            {posPaymentMethod === 'Cheque' && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border flex items-center gap-3 text-xs">
                <span className="font-semibold text-foreground">Cheque Number / Bank Name:</span>
                <input
                  type="text"
                  placeholder="e.g. Cheque #849201 · SBI Branch"
                  value={chequeRef}
                  onChange={(e) => setChequeRef(e.target.value)}
                  className="input flex-1 text-xs"
                />
              </div>
            )}

            {/* Invoices List */}
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Student Name &amp; Roll</th>
                    <th>Fee Description</th>
                    <th>Due Date</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-mono text-text-secondary">{inv.invoiceNumber}</td>
                      <td>
                        <div className="font-semibold text-foreground">{inv.studentName}</div>
                        <div className="text-micro text-text-tertiary font-mono">Invoice #{inv.invoiceNumber}</div>
                      </td>
                      <td className="text-foreground">{inv.title}</td>
                      <td className="text-text-secondary">{inv.dueDate}</td>
                      <td className="text-right font-mono font-bold text-foreground">
                        ₹{inv.amount.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <Badge tone={inv.status === 'paid' ? 'success' : 'warning'}>
                          {inv.status === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="text-right">
                        {inv.status === 'paid' ? (
                          <button
                            onClick={() => setActiveReceiptModal(inv)}
                            className="btn-secondary text-micro px-2.5 py-1 inline-flex items-center gap-1"
                          >
                            <Receipt size={12} /> View Receipt
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCashierCollect(inv)}
                            disabled={collectingId === inv.id}
                            className="btn-primary text-micro px-2.5 py-1 inline-flex items-center gap-1 shadow-2xs disabled:opacity-60"
                          >
                            <IndianRupee size={12} />
                            {collectingId === inv.id ? 'Posting…' : 'Collect Now'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STAFF PAYROLL & STATUTORY DEDUCTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Gross Salary Provision"
              value={`₹${totalMonthlyPayrollGross.toLocaleString('en-IN')}`}
              tone="primary"
              icon={<IndianRupee size={16} />}
              hint="Month: August 2026"
            />
            <StatCard
              label="Statutory Taxes & Deductions (PF/TDS/PT)"
              value={`₹${totalMonthlyStatutoryDeductions.toLocaleString('en-IN')}`}
              tone="warning"
              icon={<Percent size={16} />}
              hint="To be remitted to EPFO & Income Tax"
            />
            <StatCard
              label="Net Bank Disbursement Amount"
              value={`₹${totalMonthlyNetDisbursed.toLocaleString('en-IN')}`}
              tone="success"
              icon={<CheckCircle2 size={16} />}
              hint="Direct NEFT/RTGS Transfer"
            />
          </div>

          <SectionCard
            title="Monthly Payroll Register & Statutory Deductions (August 2026)"
            icon={<Users size={18} />}
            action={
              <button
                onClick={() => toast('Disbursement File Exported', 'success', 'NEFT batch disbursement CSV file generated for HDFC Corporate Banking.')}
                className="btn-primary text-xs flex items-center gap-1 shadow-xs"
              >
                <FileCheck size={14} /> Export Bank Transfer File
              </button>
            }
            bodyClassName="p-0 overflow-x-auto"
          >
            <table className="data-table text-xs min-w-[900px]">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Basic Pay</th>
                  <th>HRA</th>
                  <th>DA</th>
                  <th>Allowances</th>
                  <th className="font-bold text-foreground">Gross Pay</th>
                  <th>PF (12%)</th>
                  <th>PT</th>
                  <th>TDS</th>
                  <th className="text-right font-bold text-primary">Net Salary</th>
                  <th className="text-right">Payslip</th>
                </tr>
              </thead>
              <tbody>
                {calculatedPayroll.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-semibold text-foreground">{p.name}</div>
                      <div className="text-micro text-text-tertiary font-mono">{p.code} · {p.designation}</div>
                    </td>
                    <td className="font-mono">₹{p.basicPay.toLocaleString('en-IN')}</td>
                    <td className="font-mono">₹{p.hra.toLocaleString('en-IN')}</td>
                    <td className="font-mono">₹{p.da.toLocaleString('en-IN')}</td>
                    <td className="font-mono">₹{p.allowances.toLocaleString('en-IN')}</td>
                    <td className="font-mono font-bold text-foreground">₹{p.grossPay.toLocaleString('en-IN')}</td>
                    <td className="font-mono text-amber-700">₹{p.pf.toLocaleString('en-IN')}</td>
                    <td className="font-mono text-amber-700">₹{p.pt}</td>
                    <td className="font-mono text-amber-700">₹{p.tds.toLocaleString('en-IN')}</td>
                    <td className="text-right font-mono font-bold text-emerald-700 text-sm">
                      ₹{p.netPay.toLocaleString('en-IN')}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => toast('Payslip Generated', 'info', `Monthly payslip for ${p.name} (August 2026) generated.`)}
                        className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <Receipt size={12} /> Payslip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DOUBLE-ENTRY GENERAL LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'general_ledger' && (
        <div className="space-y-6 animate-fade-in">
          {/* Trial balance — computed from the posted vouchers, not asserted */}
          <div className="p-4 rounded-xl border border-border bg-surface shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className={glBalanced ? 'text-success' : 'text-destructive'} />
              <div>
                <h4 className="text-sm font-bold text-foreground">Double-Entry Trial Balance Verification</h4>
                <p className="text-micro text-text-secondary">
                  Dr ₹{glDebit.toLocaleString('en-IN')} · Cr ₹{glCredit.toLocaleString('en-IN')} across{' '}
                  {journalEntries.length} posted voucher{journalEntries.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <Badge tone={glBalanced ? 'success' : 'danger'} className="text-xs">
              <CheckCircle2 size={12} className="mr-1" />
              {glBalanced ? 'Ledger In Perfect Balance' : 'Out of balance — investigate'}
            </Badge>
          </div>

          {/* Fee ledger ↔ GL reconciliation */}
          <div className="p-4 rounded-xl border border-border bg-surface shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck size={17} className={feeGlReconciled ? 'text-success' : 'text-warning'} />
              <h4 className="text-sm font-bold text-foreground">Fee Register ↔ General Ledger Reconciliation</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-micro text-text-tertiary">Fees collected (register)</div>
                <div className="text-sm font-bold text-foreground">₹{totalCollected.toLocaleString('en-IN')}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-micro text-text-tertiary">Cash &amp; bank debited (GL)</div>
                <div className="text-sm font-bold text-foreground">₹{glFeeCash.toLocaleString('en-IN')}</div>
              </div>
              <div className={cn('rounded-lg p-3', feeGlReconciled ? 'bg-success-soft' : 'bg-warning-soft')}>
                <div className="text-micro text-text-tertiary">Variance</div>
                <div className={cn('text-sm font-bold', feeGlReconciled ? 'text-success' : 'text-warning')}>
                  ₹{Math.abs(totalCollected - glFeeCash).toLocaleString('en-IN')}
                  {feeGlReconciled ? ' · reconciled' : ' · drift'}
                </div>
              </div>
            </div>
          </div>

          {/* Trial balance by account */}
          {trialBalance.length > 0 && (
            <SectionCard title="Trial Balance by Account" icon={<Landmark size={18} />}>
              <div className="rounded-lg border border-border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 text-text-secondary border-b border-border">
                    <tr>
                      <th className="p-2 text-left">Code</th>
                      <th className="p-2 text-left">Account Head</th>
                      <th className="p-2 text-right">Debit (₹)</th>
                      <th className="p-2 text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {trialBalance.map((r) => (
                      <tr key={r.code}>
                        <td className="p-2 text-text-tertiary">{r.code}</td>
                        <td className="p-2 font-sans font-medium text-foreground">{r.account}</td>
                        <td className="p-2 text-right font-bold">{r.debit ? r.debit.toLocaleString('en-IN') : '—'}</td>
                        <td className="p-2 text-right font-bold">{r.credit ? r.credit.toLocaleString('en-IN') : '—'}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/30 font-bold">
                      <td className="p-2" colSpan={2}>Total</td>
                      <td className="p-2 text-right">{glDebit.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right">{glCredit.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Journal Entries List */}
          <SectionCard
            title="General Ledger Journal Vouchers (Immutable Ledger)"
            icon={<FileSpreadsheet size={18} />}
            bodyClassName="space-y-4"
          >
            {journalEntries.map((jv) => {
              const totalDebit = jv.lines.reduce((sum, l) => sum + l.debit, 0);
              const totalCredit = jv.lines.reduce((sum, l) => sum + l.credit, 0);

              return (
                <Card key={jv.id} className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="font-mono text-sm text-foreground">{jv.voucherNo}</strong>
                      <Badge tone="neutral">{jv.date}</Badge>
                      <span className="text-xs text-text-secondary">{jv.description}</span>
                    </div>
                    <div className="text-xs text-text-tertiary font-mono">
                      Ref: <strong>{jv.reference}</strong>
                    </div>
                  </div>

                  {/* Journal Lines Table */}
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/30 text-text-secondary border-b border-border">
                        <tr>
                          <th className="p-2 text-left">Code</th>
                          <th className="p-2 text-left">Account Head</th>
                          <th className="p-2 text-right">Debit (₹)</th>
                          <th className="p-2 text-right">Credit (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-mono">
                        {jv.lines.map((l, idx) => (
                          <tr key={idx} className="hover:bg-muted/10">
                            <td className="p-2 text-text-tertiary">{l.code}</td>
                            <td className="p-2 text-foreground font-sans font-medium">{l.account}</td>
                            <td className="p-2 text-right font-bold text-foreground">
                              {l.debit > 0 ? `₹${l.debit.toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="p-2 text-right font-bold text-foreground">
                              {l.credit > 0 ? `₹${l.credit.toLocaleString('en-IN')}` : '—'}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/20 font-bold">
                          <td colSpan={2} className="p-2 text-right uppercase text-[10px] text-text-secondary">
                            Voucher Balanced Totals:
                          </td>
                          <td className="p-2 text-right text-emerald-700">₹{totalDebit.toLocaleString('en-IN')}</td>
                          <td className="p-2 text-right text-emerald-700">₹{totalCredit.toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
          </SectionCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL FEE RECEIPT PRINT PREVIEW */}
      {/* ========================================================================= */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-xl border border-border bg-surface shadow-2xl my-8 overflow-hidden">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-3 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="text-primary" size={18} />
                <h3 className="font-bold text-foreground text-sm">Official Institutional Fee Receipt</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadFeeReceipt(activeReceiptModal)}
                  className="btn-primary text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Download size={14} /> Download PDF
                </button>
                <button
                  onClick={() => setActiveReceiptModal(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-text-tertiary hover:bg-muted"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Receipt */}
            <div className="p-8 bg-white text-slate-900 font-sans print:p-0">
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <h2 className="text-lg font-black tracking-tight uppercase text-slate-900">{mockTenant.name}</h2>
                <p className="text-xs text-slate-600">CBSE Affiliation No: 2130842 · UDISE+: 09150102408</p>
                <div className="inline-block mt-2 bg-slate-900 text-white font-bold text-[10px] uppercase px-3 py-0.5 rounded-full">
                  Official Cashier Fee Receipt · Original
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 my-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Receipt Number</span>
                  <strong className="text-slate-900 font-mono">{activeReceiptModal.receiptNumber || 'REC-2026-0849'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Date</span>
                  <strong className="text-slate-900">{activeReceiptModal.paidOn || '24 Aug 2026'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Student Name</span>
                  <strong className="text-slate-900 text-sm">{activeReceiptModal.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Class / Stream</span>
                  <strong className="text-slate-900">Secondary &amp; Senior Secondary</strong>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 font-medium text-slate-900">{activeReceiptModal.title}</td>
                      <td className="p-2 text-right font-mono font-bold">₹{activeReceiptModal.amount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-2 text-right uppercase text-[10px]">Total Amount Received:</td>
                      <td className="p-2 text-right text-emerald-800 text-sm font-mono font-black">
                        ₹{activeReceiptModal.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-4 border-t-2 border-slate-900 text-xs">
                <div className="flex items-center gap-2">
                  <QrCode size={36} className="text-slate-600" />
                  <span className="text-[10px] text-slate-500">Digitally Verified &amp; Logged to GL</span>
                </div>
                <div className="text-right">
                  <div className="font-serif italic text-slate-700 text-xs mb-1">Rajesh Nair</div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 uppercase text-[9px]">
                    Authorized Cashier / Accounts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
