'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Card, ProgressBar, cn } from '@/components/ui';
import { dataService } from '@/lib/dataService';
import { EmployeeRecord, TrainingRecord } from '@/lib/types';
import { toast } from '@/components/ui/toast';

export const HRTeacherCPDRegister: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logForm, setLogForm] = useState({
    employeeId: '',
    trainingTitle: '',
    providerAgency: 'CBSE Sahodaya',
    category: 'pedagogy' as const,
    durationHours: 6.0,
    startDate: '2026-08-15',
    endDate: '2026-08-15',
    academicYear: '2026-2027',
    mode: 'offline_workshop' as const,
    certificateUrl: 'https://storage.eduos.io/certs/new_training_cert.pdf',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [emps, records] = await Promise.all([
        dataService.getEmployees(),
        dataService.getTrainingRecords(),
      ]);
      setEmployees(emps);
      setTrainingRecords(records);
      const teachingEmps = emps.filter(e => e.employeeType === 'teaching');
      if (teachingEmps.length > 0) {
        setLogForm(prev => ({ ...prev, employeeId: teachingEmps[0].id }));
      }
    } catch (e) {
      console.error(e);
      toast('Failed to load training register', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.trainingTitle || !logForm.employeeId) {
      toast('Please enter training title and select faculty', 'warning');
      return;
    }

    try {
      const newRecord = await dataService.addTrainingRecord(logForm);
      setTrainingRecords([newRecord, ...trainingRecords]);
      setEmployees(
        employees.map(emp =>
          emp.id === logForm.employeeId
            ? { ...emp, cpdHoursCompleted: (emp.cpdHoursCompleted || 0) + Number(logForm.durationHours) }
            : emp,
        ),
      );
      setLogModalOpen(false);
      toast(`Logged ${logForm.durationHours} hours of CPD training`, 'success');
      setLogForm({
        employeeId: logForm.employeeId,
        trainingTitle: '',
        providerAgency: 'CBSE Sahodaya',
        category: 'pedagogy',
        durationHours: 6.0,
        startDate: '2026-08-15',
        endDate: '2026-08-15',
        academicYear: '2026-2027',
        mode: 'offline_workshop',
        certificateUrl: 'https://storage.eduos.io/certs/new_training_cert.pdf',
      });
    } catch (e) {
      toast('Failed to log training', 'error');
    }
  };

  const teachingEmployees = employees.filter(e => e.employeeType === 'teaching');

  const filteredRecords = trainingRecords.filter(t => {
    const matchesEmp = selectedEmployeeId === 'all' || t.employeeId === selectedEmployeeId;
    const matchesSearch =
      t.trainingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.providerAgency.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEmp && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">CBSE 50-Hour CPD Register</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Faculty continuous professional development tracking (50 hours annual statutory target under NEP 2020).
          </p>
        </div>
        <button
          onClick={() => setLogModalOpen(true)}
          className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus size={14} /> Log Workshop
        </button>
      </div>

      {/* Faculty CPD Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {teachingEmployees.map(emp => {
          const completed = emp.cpdHoursCompleted || 0;
          const target = 50;
          const pct = Math.min(100, Math.round((completed / target) * 100));
          const isComplete = completed >= target;

          return (
            <div
              key={emp.id}
              className="p-3.5 rounded-lg border border-border bg-surface shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs text-foreground truncate">{emp.fullName}</h4>
                  <p className="text-[11px] text-text-tertiary truncate">{emp.designation}</p>
                </div>
                {isComplete && (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-0.5">
                    <CheckCircle2 size={12} /> Done
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-secondary">Progress</span>
                  <span className="font-mono font-medium text-foreground">{completed} / {target} hrs ({pct}%)</span>
                </div>
                <ProgressBar value={pct} tone={isComplete ? 'success' : 'primary'} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="faculty-filter" className="text-text-tertiary font-medium">Faculty:</label>
          <select
            id="faculty-filter"
            value={selectedEmployeeId}
            onChange={e => setSelectedEmployeeId(e.target.value)}
            className="rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Faculty ({trainingRecords.length} records)</option>
            {teachingEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-2.5 top-2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search training topic..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded border border-border bg-surface py-1 pl-8 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 border-b border-border text-text-secondary">
            <tr>
              <th className="p-3 font-medium">Faculty Member</th>
              <th className="p-3 font-medium">Training Workshop</th>
              <th className="p-3 font-medium">Provider</th>
              <th className="p-3 font-medium">Hours</th>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRecords.map(t => {
              const emp = employees.find(e => e.id === t.employeeId);
              return (
                <tr key={t.id} className="hover:bg-muted/20">
                  <td className="p-3 font-medium text-foreground">
                    {emp?.fullName || 'Faculty'}
                  </td>

                  <td className="p-3 text-foreground font-medium">
                    {t.trainingTitle}
                  </td>

                  <td className="p-3 text-text-secondary">
                    {t.providerAgency}
                  </td>

                  <td className="p-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    +{t.durationHours} hrs
                  </td>

                  <td className="p-3 text-text-secondary font-mono text-[11px]">
                    {t.startDate}
                  </td>

                  <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                    Verified
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {logModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-sm text-foreground">Log CPD Workshop</h3>
              <button onClick={() => setLogModalOpen(false)} className="text-text-tertiary hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddTraining} className="space-y-3 text-xs">
              <div>
                <label htmlFor="log-faculty" className="font-medium text-text-secondary block mb-1">Faculty Member *</label>
                <select
                  id="log-faculty"
                  required
                  value={logForm.employeeId}
                  onChange={e => setLogForm({ ...logForm, employeeId: e.target.value })}
                  className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                >
                  {teachingEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="log-workshop-title" className="font-medium text-text-secondary block mb-1">Workshop Title *</label>
                <input
                  id="log-workshop-title"
                  type="text"
                  required
                  placeholder="e.g. CBSE Sahodaya: NEP 2020 Pedagogical Assessment"
                  value={logForm.trainingTitle}
                  onChange={e => setLogForm({ ...logForm, trainingTitle: e.target.value })}
                  className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="log-provider" className="font-medium text-text-secondary block mb-1">Provider Agency</label>
                  <select
                    id="log-provider"
                    value={logForm.providerAgency}
                    onChange={e => setLogForm({ ...logForm, providerAgency: e.target.value })}
                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="CBSE Sahodaya Complex">CBSE Sahodaya</option>
                    <option value="NCERT NISHTHA (DIKSHA)">NCERT NISHTHA</option>
                    <option value="In-House Pedagogy">In-House</option>
                    <option value="State DIET / SCERT">State DIET</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="log-cpd-hours" className="font-medium text-text-secondary block mb-1">Hours Earned</label>
                  <input
                    id="log-cpd-hours"
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    required
                    value={logForm.durationHours}
                    onChange={e => setLogForm({ ...logForm, durationHours: Number(e.target.value) })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="log-workshop-date" className="font-medium text-text-secondary block mb-1">Date</label>
                <input
                  id="log-workshop-date"
                  type="date"
                  required
                  value={logForm.startDate}
                  onChange={e => setLogForm({ ...logForm, startDate: e.target.value, endDate: e.target.value })}
                  className="w-full rounded border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setLogModalOpen(false)}
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
