'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { dataService } from '@/lib/dataService';
import { Student } from '@/lib/types';
import { sendFeeReminder, FeeInvoiceRecord } from '@/lib/store';
import { SectionCard, StatCard, Badge, EmptyState, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';
import { downloadFeeReceipt } from '@/lib/receipt';
import {
  IndianRupee,
  Users,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  GraduationCap,
  ChevronRight,
  ArrowLeft,
  X,
  Receipt,
  Phone,
  Loader2,
  BellRing,
  Database,
  Download,
  Plus,
  Trash2,
  CalendarPlus,
} from 'lucide-react';

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

type LedgerStatus = 'cleared' | 'pending' | 'overdue';

interface StudentLedger {
  student: Student;
  invoices: FeeInvoiceRecord[];
  paid: number;
  due: number;
  overdueAmount: number;
  /** Total invoiced to this student across every issued term. */
  billed: number;
  status: LedgerStatus;
}

const STATUS_META: Record<LedgerStatus, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  cleared: { label: 'Cleared', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
};

/**
 * School-wide fee collection register for the Finance office: class-level
 * roll-up → per-student paid/pending drill-down → invoice detail. Reads the
 * same fee ledger the Cashier POS and Parent portal share, so a counter
 * collection updates this register live.
 */
export const FinanceStudentFees: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  // EDUOS-129: Supabase fee_invoices is the only ledger. Nothing is generated
  // client-side, so every invoice id here is one the database can settle.
  const [dbInvoices, setDbInvoices] = useState<FeeInvoiceRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<StudentLedger | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([dataService.getStudents(), dataService.getFeeInvoices()]).then(([list, invoices]) => {
      if (!active) return;
      setStudents(list || []);
      setDbInvoices(invoices);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const activeInvoices = dbInvoices ?? [];

  // One ledger row per student, joining invoices by the store's name key.
  const ledgers = useMemo<StudentLedger[]>(() => {
    const byName = new Map<string, FeeInvoiceRecord[]>();
    for (const inv of activeInvoices) {
      const key = inv.studentName.toLowerCase().trim();
      byName.set(key, [...(byName.get(key) || []), inv]);
    }
    return students.map((s) => {
      const invoices = byName.get(s.name.toLowerCase().trim()) || [];
      const paid = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
      const overdueAmount = invoices.filter((i) => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);
      const due = invoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0);
      const status: LedgerStatus = overdueAmount > 0 ? 'overdue' : due > 0 ? 'pending' : 'cleared';
      // Billed = what this student was actually invoiced, so opening an extra
      // term immediately widens the expected total instead of skewing it.
      const billed = invoices.reduce((sum, i) => sum + i.amount, 0);
      return { student: s, invoices, paid, due, overdueAmount, billed, status };
    });
  }, [students, activeInvoices]);

  const classes = useMemo(() => {
    const grouped = new Map<string, StudentLedger[]>();
    for (const l of ledgers) {
      const cls = l.student.batchName || 'Unassigned';
      grouped.set(cls, [...(grouped.get(cls) || []), l]);
    }
    return Array.from(grouped.entries())
      .map(([name, rows]) => ({
        name,
        rows,
        collected: rows.reduce((s, r) => s + r.paid, 0),
        pending: rows.reduce((s, r) => s + r.due, 0),
        overdueCount: rows.filter((r) => r.status === 'overdue').length,
        expected: rows.reduce((s, r) => s + r.billed, 0),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ledgers]);

  const school = useMemo(
    () => ({
      collected: ledgers.reduce((s, l) => s + l.paid, 0),
      pending: ledgers.reduce((s, l) => s + l.due, 0),
      overdue: ledgers.reduce((s, l) => s + l.overdueAmount, 0),
      defaulters: ledgers.filter((l) => l.status === 'overdue').length,
      expected: ledgers.reduce((s, l) => s + l.billed, 0),
    }),
    [ledgers],
  );

  // Search cuts across the whole school; otherwise show the selected class.
  // Numeric roll sort — Supabase stores roll_number as text, so its native
  // ordering is lexicographic (1, 10, 11, …, 2, 20).
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q
      ? ledgers.filter(
          (l) => l.student.name.toLowerCase().includes(q) || l.student.rollNumber.toString().includes(q),
        )
      : selectedClass
        ? ledgers.filter((l) => (l.student.batchName || 'Unassigned') === selectedClass)
        : [];
    return rows
      .slice()
      .sort((a, b) => (parseInt(a.student.rollNumber, 10) || 0) - (parseInt(b.student.rollNumber, 10) || 0));
  }, [ledgers, search, selectedClass]);

  // ---- New term fee issuance -------------------------------------------
  const [showNewTerm, setShowNewTerm] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [termForm, setTermForm] = useState({
    batchName: '',
    termCode: 'T4',
    title: 'Term 4 Composite Fee · AY 2026-27',
    dueDate: '2027-01-15',
  });
  const [termHeads, setTermHeads] = useState<Array<{ head: string; amount: string }>>([
    { head: 'Tuition Fee', amount: '12500' },
    { head: 'Examination Fee', amount: '1200' },
  ]);

  const termTotal = termHeads.reduce((s, h) => s + (parseFloat(h.amount) || 0), 0);

  const openNewTerm = () => {
    setTermForm((f) => ({ ...f, batchName: selectedClass || classes[0]?.name || '' }));
    setShowNewTerm(true);
  };

  const issueTerm = async () => {
    const heads = termHeads
      .map((h) => ({ head: h.head.trim(), amount: parseFloat(h.amount) || 0 }))
      .filter((h) => h.head && h.amount > 0);

    if (!termForm.batchName) return toast('Select a class', 'warning');
    if (!termForm.termCode.trim()) return toast('Term code required', 'warning', 'e.g. T4');
    if (heads.length === 0) return toast('Add at least one fee head', 'warning', 'Each head needs a name and an amount above zero.');

    setIssuing(true);
    const res = await dataService.issueTermInvoices({
      batchName: termForm.batchName,
      termCode: termForm.termCode.trim(),
      title: termForm.title.trim() || `${termForm.termCode.trim()} Fee`,
      dueDate: termForm.dueDate,
      lineItems: heads,
    });
    setIssuing(false);

    if ('error' in res) {
      toast('Could not issue term fee', 'error', res.error);
      return;
    }

    const refreshed = await dataService.getFeeInvoices();
    if (refreshed) setDbInvoices(refreshed);
    setShowNewTerm(false);
    toast(
      'Term fee issued',
      'success',
      `${res.issued} invoice${res.issued === 1 ? '' : 's'} of ${fmtINR(res.totalAmount)} raised for ${termForm.batchName}` +
        (res.skipped > 0 ? ` · ${res.skipped} already billed` : ''),
    );
  };

  // Term columns are derived from the ledger, so a newly-issued term (T4, T5…)
  // gets its own column automatically.
  const termCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const inv of activeInvoices) {
      const m = inv.invoiceNumber.match(/-([A-Z0-9]+)$/);
      if (m) codes.add(m[1]);
    }
    return Array.from(codes).sort();
  }, [activeInvoices]);

  const remindGuardian = (l: StudentLedger) => {
    const nextUnpaid = l.invoices
      .filter((i) => i.status !== 'paid')
      .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))[0];
    sendFeeReminder({
      studentName: l.student.name,
      dueAmount: l.due,
      dueDate: nextUnpaid?.dueDate,
      overdue: l.status === 'overdue',
    });
    toast(
      'Fee reminder sent',
      'success',
      `${l.student.parentName || 'The guardian'} will see it in the Parent portal notifications.`,
    );
  };

  const collectionPct = school.expected > 0 ? Math.round((school.collected / school.expected) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-16 text-xs text-text-secondary">
        <Loader2 size={15} className="animate-spin" /> Loading fee register…
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* School-wide roll-up */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Fees Collected (AY 26-27)"
          value={fmtINR(school.collected)}
          icon={<CheckCircle2 size={16} />}
          tone="success"
          hint={`${collectionPct}% of ${fmtINR(school.expected)} billed`}
        />
        <StatCard
          label="Outstanding Balance"
          value={fmtINR(school.pending)}
          icon={<Clock size={16} />}
          tone="warning"
          hint="Pending + overdue terms"
        />
        <StatCard
          label="Overdue (Past Due Date)"
          value={fmtINR(school.overdue)}
          icon={<AlertTriangle size={16} />}
          tone="destructive"
          hint={`${school.defaulters} defaulter${school.defaulters === 1 ? '' : 's'} to follow up`}
        />
        <StatCard
          label="Students on Roll"
          value={ledgers.length}
          icon={<Users size={16} />}
          hint={`${classes.length} class${classes.length === 1 ? '' : 'es'}`}
        />
      </div>

      <div className="flex items-center gap-1.5 text-micro text-text-tertiary">
        <Database size={11} className={dbInvoices ? 'text-success' : 'text-destructive'} />
        {dbInvoices
          ? 'Live ledger — Supabase fee_invoices, payments via ACID collect_fee_payment()'
          : 'Ledger unavailable — could not reach Supabase fee_invoices'}
      </div>

      <SectionCard
        title={
          selectedClass && !search ? (
            <span className="flex items-center gap-2">
              <button
                onClick={() => setSelectedClass(null)}
                className="grid h-6 w-6 place-items-center rounded-md text-text-tertiary hover:bg-muted"
                aria-label="Back to all classes"
              >
                <ArrowLeft size={14} />
              </button>
              {selectedClass} — Student Fee Status
            </span>
          ) : (
            'Class-wise Fee Collection'
          )
        }
        icon={<GraduationCap size={18} />}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search student by name or roll…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-8 text-xs w-56"
              />
            </div>
            <button onClick={openNewTerm} className="btn-primary shrink-0 text-xs">
              <CalendarPlus size={14} /> New Term Fee
            </button>
          </div>
        }
        bodyClassName="space-y-4"
      >
        {/* Class cards — the whole school at a glance */}
        {!selectedClass && !search && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.map((cls) => {
              const pct = cls.expected > 0 ? Math.round((cls.collected / cls.expected) * 100) : 0;
              return (
                <button
                  key={cls.name}
                  onClick={() => setSelectedClass(cls.name)}
                  className="group rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-primary hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-foreground">{cls.name}</div>
                    <ChevronRight size={15} className="text-text-tertiary transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-0.5 text-micro text-text-tertiary">
                    {cls.rows.length} students
                    {cls.overdueCount > 0 && (
                      <span className="ml-1.5 font-semibold text-destructive">· {cls.overdueCount} overdue</span>
                    )}
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between text-xs">
                    <span className="font-bold text-success">{fmtINR(cls.collected)} in</span>
                    <span className="font-semibold text-text-secondary">{fmtINR(cls.pending)} due</span>
                  </div>
                </button>
              );
            })}
            {classes.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={<Users size={20} />}
                  title="No students found"
                  description="Seed student records first — the fee register builds itself from the student roll."
                />
              </div>
            )}
          </div>
        )}

        {/* Student rows for the selected class (or school-wide search hits) */}
        {(selectedClass || search) && (
          <div className="rounded-xl border border-border overflow-x-auto">
            <table className="data-table text-xs min-w-[720px]">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student</th>
                  {search && <th>Class</th>}
                  {termCodes.map((code) => (
                    <th key={code}>{code.replace(/^T(\d+)$/, 'Term $1')}</th>
                  ))}
                  <th className="text-right">Paid</th>
                  <th className="text-right">Due</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((l) => {
                  const meta = STATUS_META[l.status];
                  const term = (code: string) => l.invoices.find((i) => i.invoiceNumber.endsWith(`-${code}`));
                  return (
                    <tr key={l.student.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetail(l)}>
                      <td className="font-semibold">{l.student.rollNumber}</td>
                      <td>
                        <div className="font-semibold text-foreground">{l.student.name}</div>
                        <div className="text-micro text-text-tertiary">{l.student.admissionNumber}</div>
                      </td>
                      {search && <td>{l.student.batchName}</td>}
                      {termCodes.map((code) => {
                        const inv = term(code);
                        return (
                          <td key={code}>
                            {!inv ? (
                              <span className="text-text-tertiary">—</span>
                            ) : inv.status === 'paid' ? (
                              <CheckCircle2 size={15} className="text-success" />
                            ) : inv.status === 'overdue' ? (
                              <AlertTriangle size={15} className="text-destructive" />
                            ) : (
                              <Clock size={15} className="text-warning" />
                            )}
                          </td>
                        );
                      })}
                      <td className="text-right font-bold text-success">{fmtINR(l.paid)}</td>
                      <td className={cn('text-right font-bold', l.due > 0 ? 'text-destructive' : 'text-text-tertiary')}>
                        {l.due > 0 ? fmtINR(l.due) : '—'}
                      </td>
                      <td>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1 text-text-tertiary">
                          {l.due > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                remindGuardian(l);
                              }}
                              title={`Send fee reminder to ${l.student.parentName || 'guardian'}`}
                              className="grid h-7 w-7 place-items-center rounded-md text-warning hover:bg-warning-soft"
                            >
                              <BellRing size={14} />
                            </button>
                          )}
                          <ChevronRight size={14} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={termCodes.length + (search ? 7 : 6)} className="py-8 text-center text-text-tertiary">
                      No students match “{search}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* New term fee issuance modal */}
      {showNewTerm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 animate-fade-in"
          onClick={() => !issuing && setShowNewTerm(false)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-surface p-4">
              <div>
                <div className="text-sm font-bold text-foreground">Open a New Term Fee</div>
                <div className="mt-0.5 text-micro text-text-tertiary">
                  Bills every student on the selected class roll in one transaction
                </div>
              </div>
              <button
                onClick={() => setShowNewTerm(false)}
                disabled={issuing}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-text-tertiary hover:bg-muted"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="term-class">Class</label>
                  <select
                    id="term-class"
                    value={termForm.batchName}
                    onChange={(e) => setTermForm({ ...termForm, batchName: e.target.value })}
                    className="input text-xs"
                  >
                    {classes.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.rows.length} students)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="term-code">Term Code</label>
                  <input
                    id="term-code"
                    type="text"
                    placeholder="T4"
                    value={termForm.termCode}
                    onChange={(e) => setTermForm({ ...termForm, termCode: e.target.value })}
                    className="input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="term-title">Invoice Title</label>
                <input
                  id="term-title"
                  type="text"
                  value={termForm.title}
                  onChange={(e) => setTermForm({ ...termForm, title: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label" htmlFor="term-due">Due Date</label>
                <input
                  id="term-due"
                  type="date"
                  value={termForm.dueDate}
                  onChange={(e) => setTermForm({ ...termForm, dueDate: e.target.value })}
                  className="input text-xs"
                />
              </div>

              {/* Fee heads — add as many rows as the schedule needs */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="label mb-0">Fee Heads</label>
                  <button
                    onClick={() => setTermHeads([...termHeads, { head: '', amount: '' }])}
                    className="inline-flex items-center gap-1 text-micro font-semibold text-primary hover:underline"
                  >
                    <Plus size={12} /> Add head
                  </button>
                </div>
                <div className="space-y-2">
                  {termHeads.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Tuition Fee"
                        value={h.head}
                        onChange={(e) => {
                          const next = [...termHeads];
                          next[i] = { ...next[i], head: e.target.value };
                          setTermHeads(next);
                        }}
                        className="input flex-1 text-xs"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Amount"
                        value={h.amount}
                        onChange={(e) => {
                          const next = [...termHeads];
                          next[i] = { ...next[i], amount: e.target.value };
                          setTermHeads(next);
                        }}
                        className="input w-28 text-xs"
                      />
                      <button
                        onClick={() => setTermHeads(termHeads.filter((_, idx) => idx !== i))}
                        disabled={termHeads.length === 1}
                        aria-label="Remove fee head"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-text-tertiary hover:bg-muted hover:text-destructive disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                <span className="text-xs font-semibold text-text-secondary">Per-student total</span>
                <span className="text-sm font-bold text-foreground">{fmtINR(termTotal)}</span>
              </div>

              <div className="rounded-lg border border-info/20 bg-info-soft p-3 text-micro text-text-secondary">
                Issues one invoice per student on the <strong>{termForm.batchName || 'selected'}</strong> roll. Students
                already billed for this term code are skipped, so it is safe to re-run.
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewTerm(false)}
                  disabled={issuing}
                  className="btn-secondary flex-1 justify-center text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={issueTerm}
                  disabled={issuing || termTotal <= 0}
                  className="btn-primary flex-1 justify-center text-xs disabled:opacity-60"
                >
                  {issuing ? <Loader2 size={14} className="animate-spin" /> : <CalendarPlus size={14} />}
                  {issuing ? 'Issuing…' : 'Issue Term Fee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student fee detail modal */}
      {detail && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 animate-fade-in"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-surface p-4">
              <div>
                <div className="text-sm font-bold text-foreground">{detail.student.name}</div>
                <div className="mt-0.5 text-micro text-text-tertiary">
                  {detail.student.batchName} · Roll {detail.student.rollNumber} · {detail.student.admissionNumber}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-micro text-text-secondary">
                  <Phone size={11} /> {detail.student.parentName} · {detail.student.parentPhone}
                </div>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-text-tertiary hover:bg-muted"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <div className="text-micro text-text-tertiary">Total Billed</div>
                  <div className="text-sm font-bold text-foreground">{fmtINR(detail.billed)}</div>
                </div>
                <div className="rounded-lg bg-success-soft p-2.5">
                  <div className="text-micro text-text-tertiary">Paid</div>
                  <div className="text-sm font-bold text-success">{fmtINR(detail.paid)}</div>
                </div>
                <div className="rounded-lg bg-destructive-soft p-2.5">
                  <div className="text-micro text-text-tertiary">Balance Due</div>
                  <div className="text-sm font-bold text-destructive">{fmtINR(detail.due)}</div>
                </div>
              </div>

              {detail.invoices
                .slice()
                .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
                .map((inv) => (
                  <div key={inv.id} className="rounded-xl border border-border p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-foreground">{inv.title}</div>
                        <div className="mt-0.5 font-mono text-micro text-text-tertiary">{inv.invoiceNumber}</div>
                      </div>
                      <Badge tone={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}>
                        {inv.status === 'paid' ? 'Paid' : inv.status === 'overdue' ? 'Overdue' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="mt-2.5 space-y-1">
                      {inv.breakdown.map((h) => (
                        <div key={h.head} className="flex justify-between text-micro text-text-secondary">
                          <span>{h.head}</span>
                          <span className="font-medium">{fmtINR(h.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-border pt-1.5 text-xs font-bold text-foreground">
                        <span>Total</span>
                        <span>{fmtINR(inv.amount)}</span>
                      </div>
                    </div>
                    <div className="mt-2.5 text-micro text-text-tertiary">
                      {inv.status === 'paid' ? (
                        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                          <Receipt size={11} className="text-success" />
                          Receipt {inv.receiptNumber} · {inv.paymentMethod} · {inv.paidOn}
                          <button
                            onClick={() => downloadFeeReceipt(inv)}
                            className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
                          >
                            <Download size={11} /> Download PDF
                          </button>
                        </span>
                      ) : (
                        <span className={cn(inv.status === 'overdue' && 'font-semibold text-destructive')}>
                          Due {inv.dueDate}
                          {inv.status === 'overdue' && ' — past due, follow up with guardian'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              {detail.invoices.length === 0 && (
                <EmptyState
                  icon={<IndianRupee size={20} />}
                  title="No invoices raised"
                  description="This student has no fee invoices yet."
                />
              )}

              {detail.due > 0 && (
                <>
                  <button
                    onClick={() => remindGuardian(detail)}
                    className="btn-secondary w-full justify-center text-xs"
                  >
                    <BellRing size={14} /> Send Fee Reminder to {detail.student.parentName || 'Guardian'}
                  </button>
                  <div className="rounded-lg border border-info/20 bg-info-soft p-3 text-micro text-text-secondary">
                    Collect the balance at the <strong>Counter POS &amp; Invoicing</strong> tab — cash, UPI QR, cheque
                    or DD, with an instant GST receipt.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
