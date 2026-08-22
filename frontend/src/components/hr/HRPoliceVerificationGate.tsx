'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Unlock,
  X,
} from 'lucide-react';
import { Card, cn } from '@/components/ui';
import { dataService } from '@/lib/dataService';
import { EmployeeRecord, PoliceVerificationStatus } from '@/lib/types';
import { toast } from '@/components/ui/toast';

export const HRPoliceVerificationGate: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadModalEmployee, setUploadModalEmployee] = useState<EmployeeRecord | null>(null);

  const [verifyForm, setVerifyForm] = useState({
    status: 'verified' as PoliceVerificationStatus,
    acknowledgmentNumber: 'PCC/DL-ND/2026/77102',
    verificationDate: new Date().toISOString().split('T')[0],
    docUrl: 'https://storage.eduos.io/police/verified_clearance_cert.pdf',
    isAccessRestricted: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dataService.getEmployees();
      setEmployees(data);
    } catch (e) {
      console.error(e);
      toast('Failed to load verification records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalEmployee) return;

    try {
      const updated = await dataService.updatePoliceVerification(uploadModalEmployee.id, verifyForm);
      setEmployees(employees.map(emp => (emp.id === uploadModalEmployee.id ? updated : emp)));
      setUploadModalEmployee(null);
      toast(`Verification updated for ${updated.fullName}`, 'success');
    } catch (e) {
      toast('Failed to update verification', 'error');
    }
  };

  const handleToggleGate = async (employee: EmployeeRecord) => {
    const newRestrictedState = !employee.isAccessRestricted;
    try {
      const updated = await dataService.updatePoliceVerification(employee.id, {
        status: employee.policeVerificationStatus,
        isAccessRestricted: newRestrictedState,
      });
      setEmployees(employees.map(emp => (emp.id === employee.id ? updated : emp)));
      if (newRestrictedState) {
        toast(`System access restricted for ${employee.fullName}`, 'warning');
      } else {
        toast(`System access restored for ${employee.fullName}`, 'success');
      }
    } catch (e) {
      toast('Failed to toggle access', 'error');
    }
  };

  const total = employees.length;
  const verified = employees.filter(e => e.policeVerificationStatus === 'verified').length;
  const pending = employees.filter(e => e.policeVerificationStatus === 'submitted_pending').length;
  const missing = employees.filter(e => e.policeVerificationStatus === 'missing').length;

  const filteredEmployees = employees.filter(emp => {
    const matchesStatus = statusFilter === 'all' || emp.policeVerificationStatus === statusFilter;
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Police Verification Gate</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Mandatory background check compliance with 30-day grace window tracking and system safety lockouts.
          </p>
        </div>
        <div className="text-xs text-text-secondary font-medium">
          Compliance: <strong className="text-foreground">{verified}/{total} Verified</strong> ({Math.round((verified / (total || 1)) * 100)}%)
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'border border-border bg-surface text-text-secondary hover:bg-muted',
            )}
          >
            All ({total})
          </button>
          <button
            onClick={() => setStatusFilter('verified')}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              statusFilter === 'verified' ? 'bg-emerald-600 text-white' : 'border border-border bg-surface text-text-secondary hover:bg-muted',
            )}
          >
            Verified ({verified})
          </button>
          <button
            onClick={() => setStatusFilter('submitted_pending')}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              statusFilter === 'submitted_pending' ? 'bg-amber-600 text-white' : 'border border-border bg-surface text-text-secondary hover:bg-muted',
            )}
          >
            Grace Window ({pending})
          </button>
          <button
            onClick={() => setStatusFilter('missing')}
            className={cn(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              statusFilter === 'missing' ? 'bg-red-600 text-white' : 'border border-border bg-surface text-text-secondary hover:bg-muted',
            )}
          >
            Overdue ({missing})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-2.5 top-2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search staff member..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded border border-border bg-surface py-1 pl-8 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Clean Table */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 border-b border-border text-text-secondary">
            <tr>
              <th className="p-3 font-medium">Staff Member</th>
              <th className="p-3 font-medium">Designation</th>
              <th className="p-3 font-medium">Date of Joining</th>
              <th className="p-3 font-medium">Clearance Status</th>
              <th className="p-3 font-medium">30-Day Window</th>
              <th className="p-3 font-medium">Access Lock</th>
              <th className="p-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredEmployees.map(emp => {
              const isOverdue = emp.policeVerificationStatus === 'missing' && emp.gracePeriodExpiryDate && new Date(emp.gracePeriodExpiryDate) < new Date();
              return (
                <tr key={emp.id} className={cn('hover:bg-muted/20', isOverdue && 'bg-red-500/5')}>
                  <td className="p-3">
                    <span className="font-semibold text-foreground block">{emp.fullName}</span>
                    <span className="font-mono text-[10px] text-text-tertiary">{emp.employeeCode}</span>
                  </td>

                  <td className="p-3 text-text-secondary">
                    <span>{emp.designation}</span>
                  </td>

                  <td className="p-3 font-mono text-text-secondary text-[11px]">
                    {emp.dateOfJoining}
                  </td>

                  <td className="p-3">
                    {emp.policeVerificationStatus === 'verified' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    ) : emp.policeVerificationStatus === 'submitted_pending' ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1">
                        <Clock size={12} /> In Grace
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-medium inline-flex items-center gap-1">
                        <AlertCircle size={12} /> Overdue
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-[11px] text-text-secondary font-mono">
                    {emp.policeVerificationStatus === 'verified' ? (
                      <span className="text-text-tertiary">Cleared</span>
                    ) : emp.gracePeriodExpiryDate ? (
                      <span>Exp: {emp.gracePeriodExpiryDate}</span>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => handleToggleGate(emp)}
                      className={cn(
                        'rounded px-2 py-0.5 text-[11px] font-medium transition-colors inline-flex items-center gap-1',
                        emp.isAccessRestricted
                          ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                      )}
                    >
                      {emp.isAccessRestricted ? <Lock size={11} /> : <Unlock size={11} />}
                      {emp.isAccessRestricted ? 'Restricted' : 'Normal'}
                    </button>
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setUploadModalEmployee(emp);
                        setVerifyForm({
                          status: emp.policeVerificationStatus,
                          acknowledgmentNumber: emp.policeAcknowledgmentNumber || `PCC/DL/${emp.employeeCode}`,
                          verificationDate: emp.policeVerificationDate || new Date().toISOString().split('T')[0],
                          docUrl: emp.policeDocUrl || 'https://storage.eduos.io/police/verified_clearance_cert.pdf',
                          isAccessRestricted: emp.isAccessRestricted,
                        });
                      }}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {uploadModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-sm text-foreground">Police Verification Status</h3>
              <button onClick={() => setUploadModalEmployee(null)} className="text-text-tertiary hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateVerification} className="space-y-3 text-xs">
              <div>
                <span className="text-text-secondary">Staff Member:</span>
                <p className="font-semibold text-foreground">{uploadModalEmployee.fullName}</p>
              </div>

              <div>
                <label htmlFor="pcc-status" className="font-medium text-text-secondary block mb-1">Status</label>
                <select
                  id="pcc-status"
                  value={verifyForm.status}
                  onChange={e => setVerifyForm({ ...verifyForm, status: e.target.value as any })}
                  className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                >
                  <option value="verified">Verified (Clearance Certificate Received)</option>
                  <option value="submitted_pending">Submitted - In Process (Grace Window)</option>
                  <option value="missing">Missing / Overdue</option>
                </select>
              </div>

              <div>
                <label htmlFor="pcc-ack-no" className="font-medium text-text-secondary block mb-1">Acknowledgment / Cert No.</label>
                <input
                  id="pcc-ack-no"
                  type="text"
                  required
                  value={verifyForm.acknowledgmentNumber}
                  onChange={e => setVerifyForm({ ...verifyForm, acknowledgmentNumber: e.target.value })}
                  className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label htmlFor="pcc-access-restricted" className="text-text-secondary">Restrict Unsupervised Access:</label>
                <input
                  id="pcc-access-restricted"
                  type="checkbox"
                  checked={verifyForm.isAccessRestricted}
                  onChange={e => setVerifyForm({ ...verifyForm, isAccessRestricted: e.target.checked })}
                  className="rounded border-border accent-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setUploadModalEmployee(null)}
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
