'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Printer,
  Plus,
  CheckCircle2,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Card, SectionCard, Badge, cn } from '@/components/ui';
import { dataService } from '@/lib/dataService';
import { EmployeeRecord } from '@/lib/types';
import { mockTenant } from '@/lib/mockData';
import { toast } from '@/components/ui/toast';

export const HRServiceBooks: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [pdfPreviewEmployee, setPdfPreviewEmployee] = useState<EmployeeRecord | null>(null);
  const [incrementModalEmployee, setIncrementModalEmployee] = useState<EmployeeRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [incrementForm, setIncrementForm] = useState({
    effectiveDate: '2026-07-01',
    basicPay: 55200,
    gradePay: 5400,
    daHraAllowances: 38640,
    remarks: 'Annual increment (3% revision)',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await dataService.getEmployees();
      setEmployees(data);
      if (data.length > 0) {
        setSelectedEmployee(data[0]);
      }
    } catch (e) {
      console.error(e);
      toast('Failed to load employee records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncrement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incrementModalEmployee) return;

    try {
      const updated = await dataService.addScaleIncrement(incrementModalEmployee.id, incrementForm);
      setEmployees(employees.map(emp => (emp.id === incrementModalEmployee.id ? updated : emp)));
      if (selectedEmployee?.id === incrementModalEmployee.id) {
        setSelectedEmployee(updated);
      }
      setIncrementModalEmployee(null);
      toast(`Increment recorded for ${updated.fullName}`, 'success');
    } catch (e) {
      toast('Failed to record increment', 'error');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Staff Service Books</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Official employment register documenting appointment terms, verified degrees, and pay scale progression.
          </p>
        </div>
        {selectedEmployee && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIncrementModalEmployee(selectedEmployee)}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <Plus size={13} /> Add Increment
            </button>
            <button
              onClick={() => setPdfPreviewEmployee(selectedEmployee)}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer size={13} /> Form Service Book (PDF)
            </button>
          </div>
        )}
      </div>

      {/* Main Split-View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Directory List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-text-tertiary" />
              <input
                type="text"
                placeholder="Filter staff..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Departments</option>
              <option value="Science & Senior Secondary">Science</option>
              <option value="Primary Wing">Primary Wing</option>
              <option value="Computer Science & AI">Computer Science</option>
              <option value="Sports & Physical Education">Sports</option>
              <option value="Transport & Safety">Transport</option>
            </select>
          </div>

          <div className="rounded-lg border border-border bg-surface divide-y divide-border overflow-hidden shadow-xs max-h-[calc(100vh-280px)] overflow-y-auto">
            {filteredEmployees.map(emp => {
              const isSelected = selectedEmployee?.id === emp.id;
              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={cn(
                    'p-3 cursor-pointer transition-colors flex items-center justify-between hover:bg-muted/40',
                    isSelected && 'bg-primary/5 border-l-2 border-primary',
                  )}
                >
                  <div className="min-w-0">
                    <h4 className="font-medium text-xs text-foreground truncate">{emp.fullName}</h4>
                    <p className="text-[11px] text-text-tertiary truncate">{emp.designation}</p>
                  </div>
                  <span className="font-mono text-[10px] text-text-tertiary shrink-0">{emp.employeeCode}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Record (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedEmployee && selectedEmployee.serviceBook ? (
            <>
              {/* Profile Card */}
              <div className="rounded-lg border border-border bg-surface p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">{selectedEmployee.fullName}</h2>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-text-secondary">
                        {selectedEmployee.employeeCode}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {selectedEmployee.designation} • {selectedEmployee.department}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={13} /> Active Service Record
                  </span>
                </div>

                {/* Identifiers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/20 p-3 rounded">
                  <div>
                    <span className="text-[10px] text-text-tertiary block">Date of Joining</span>
                    <span className="font-medium text-foreground">{selectedEmployee.dateOfJoining}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-tertiary block">Order Number</span>
                    <span className="font-mono text-foreground">{selectedEmployee.serviceBook.appointmentOrderNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-tertiary block">Provident Fund (UAN)</span>
                    <span className="font-mono text-foreground">{selectedEmployee.serviceBook.providentFundUan || 'Under Process'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-tertiary block">Leave Balance</span>
                    <span className="font-medium text-foreground">
                      CL: {selectedEmployee.serviceBook.casualLeaveBalance} | EL: {selectedEmployee.serviceBook.earnedLeaveBalance}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Degrees */}
              <div className="rounded-lg border border-border bg-surface p-4 shadow-xs space-y-3">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Verified Qualifications
                </h3>
                <div className="divide-y divide-border text-xs">
                  {selectedEmployee.serviceBook.qualificationsList.map((q, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-foreground block">{q.degree}</span>
                        <span className="text-[11px] text-text-tertiary">
                          {q.institution} • {q.yearOfPassing} ({q.percentageOrGrade})
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Verified</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pay Scale & Increments */}
              <div className="rounded-lg border border-border bg-surface p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Pay Scale & Increments History
                  </h3>
                  <button
                    onClick={() => setIncrementModalEmployee(selectedEmployee)}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    + Add Increment
                  </button>
                </div>

                <div className="border border-border rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border text-text-secondary">
                      <tr>
                        <th className="p-2.5 font-medium">Effective Date</th>
                        <th className="p-2.5 font-medium">Basic Pay</th>
                        <th className="p-2.5 font-medium">DA + HRA</th>
                        <th className="p-2.5 font-medium">Total Gross</th>
                        <th className="p-2.5 font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedEmployee.serviceBook.scaleHistory.map(scale => (
                        <tr key={scale.id}>
                          <td className="p-2.5 font-medium text-foreground">{scale.effectiveDate}</td>
                          <td className="p-2.5 font-mono">₹{scale.basicPay.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 font-mono">₹{scale.daHraAllowances.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            ₹{scale.grossPay.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-[11px] text-text-tertiary">{scale.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-text-tertiary">Select an employee.</div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: Form Service Book Preview                                  */}
      {/* =================================================================== */}
      {pdfPreviewEmployee && pdfPreviewEmployee.serviceBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-white text-slate-900 shadow-2xl p-6 space-y-5 max-h-[95vh] overflow-y-auto">
            {/* Header Controls */}
            <div className="flex items-center justify-between border-b pb-3 text-xs">
              <span className="font-semibold text-slate-500 uppercase">Form Service Book Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded bg-slate-900 px-3 py-1 text-xs text-white hover:bg-slate-800"
                >
                  Print
                </button>
                <button
                  onClick={() => setPdfPreviewEmployee(null)}
                  className="rounded border border-slate-300 p-1 text-slate-600 hover:bg-slate-100"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* School Header */}
            <div className="text-center border-b pb-4">
              <h2 className="text-lg font-bold text-slate-900 uppercase">{mockTenant.name}</h2>
              <p className="text-xs text-slate-600">CBSE Affiliation No. 1030492 • New Delhi</p>
              <div className="inline-block border border-slate-900 text-slate-900 font-semibold text-xs px-3 py-0.5 mt-2 uppercase">
                Staff Service Book Record
              </div>
            </div>

            {/* Part I */}
            <div className="space-y-1.5 text-xs">
              <h3 className="font-bold text-slate-800 uppercase border-b pb-1">1. Employee Particulars</h3>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-500">Name:</span> <strong>{pdfPreviewEmployee.fullName}</strong></div>
                <div><span className="text-slate-500">Employee Code:</span> <strong>{pdfPreviewEmployee.employeeCode}</strong></div>
                <div><span className="text-slate-500">Designation:</span> <strong>{pdfPreviewEmployee.designation}</strong></div>
                <div><span className="text-slate-500">Date of Joining:</span> <strong>{pdfPreviewEmployee.dateOfJoining}</strong></div>
                <div><span className="text-slate-500">Sanction Order:</span> <strong>{pdfPreviewEmployee.serviceBook.appointmentOrderNumber}</strong></div>
                <div><span className="text-slate-500">Police Verification:</span> <strong className="text-emerald-700 uppercase">Cleared</strong></div>
              </div>
            </div>

            {/* Part II */}
            <div className="space-y-1.5 text-xs">
              <h3 className="font-bold text-slate-800 uppercase border-b pb-1">2. Verified Qualifications</h3>
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-50 border-b font-medium text-slate-600">
                  <tr>
                    <th className="p-2">Degree / Exam</th>
                    <th className="p-2">Board / University</th>
                    <th className="p-2">Year</th>
                    <th className="p-2">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pdfPreviewEmployee.serviceBook.qualificationsList.map((q, i) => (
                    <tr key={i}>
                      <td className="p-2 font-medium">{q.degree}</td>
                      <td className="p-2">{q.institution}</td>
                      <td className="p-2">{q.yearOfPassing}</td>
                      <td className="p-2">{q.percentageOrGrade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Part III */}
            <div className="space-y-1.5 text-xs">
              <h3 className="font-bold text-slate-800 uppercase border-b pb-1">3. Pay Progression Ledger</h3>
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-50 border-b font-medium text-slate-600">
                  <tr>
                    <th className="p-2">Effective Date</th>
                    <th className="p-2">Basic Pay</th>
                    <th className="p-2">DA + HRA</th>
                    <th className="p-2">Total Gross</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pdfPreviewEmployee.serviceBook.scaleHistory.map((s, i) => (
                    <tr key={i}>
                      <td className="p-2 font-mono">{s.effectiveDate}</td>
                      <td className="p-2 font-mono">₹{s.basicPay.toLocaleString('en-IN')}</td>
                      <td className="p-2 font-mono">₹{s.daHraAllowances.toLocaleString('en-IN')}</td>
                      <td className="p-2 font-mono font-bold">₹{s.grossPay.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="pt-4 flex justify-between items-end text-xs text-slate-600 border-t">
              <div>[Institutional Seal]</div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">Dr. Rajesh Iyer</p>
                <p className="text-[11px]">Principal & Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: Add Increment                                              */}
      {/* =================================================================== */}
      {incrementModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-sm text-foreground">Record Pay Revision / Increment</h3>
              <button onClick={() => setIncrementModalEmployee(null)} className="text-text-tertiary hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddIncrement} className="space-y-3 text-xs">
              <div>
                <span className="text-text-secondary">Staff Member:</span>
                <p className="font-semibold text-foreground">{incrementModalEmployee.fullName}</p>
              </div>

              <div>
                <label htmlFor="inc-effective-date" className="font-medium text-text-secondary block mb-1">Effective Date</label>
                <input
                  id="inc-effective-date"
                  type="date"
                  required
                  value={incrementForm.effectiveDate}
                  onChange={e => setIncrementForm({ ...incrementForm, effectiveDate: e.target.value })}
                  className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inc-basic-pay" className="font-medium text-text-secondary block mb-1">Basic Pay (₹)</label>
                  <input
                    id="inc-basic-pay"
                    type="number"
                    required
                    value={incrementForm.basicPay}
                    onChange={e => setIncrementForm({ ...incrementForm, basicPay: Number(e.target.value) })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="inc-da-hra" className="font-medium text-text-secondary block mb-1">DA + HRA (₹)</label>
                  <input
                    id="inc-da-hra"
                    type="number"
                    required
                    value={incrementForm.daHraAllowances}
                    onChange={e => setIncrementForm({ ...incrementForm, daHraAllowances: Number(e.target.value) })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inc-remarks" className="font-medium text-text-secondary block mb-1">Remarks</label>
                <input
                  id="inc-remarks"
                  type="text"
                  required
                  value={incrementForm.remarks}
                  onChange={e => setIncrementForm({ ...incrementForm, remarks: e.target.value })}
                  className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIncrementModalEmployee(null)}
                  className="rounded border border-border px-3 py-1 text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded bg-primary px-3 py-1 text-primary-foreground hover:bg-primary/90">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
