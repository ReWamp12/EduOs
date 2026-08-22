'use client';

import React, { useState, useMemo } from 'react';
import { mockBatches, mockTenant } from '@/lib/mockData';
import { allStudentsInSchool } from '@/lib/batchData';
import { Student } from '@/lib/types';
import { PageHeader, SectionCard, StatCard, Card, Badge, EmptyState, ProgressBar, cn } from '@/components/ui';
import { StudentProfileDetailModal } from '@/components/common/StudentProfileDetailModal';
import { toast } from '@/components/ui/toast';
import {
  Users,
  Search,
  Filter,
  IdCard,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Clock,
  Printer,
  ChevronRight,
  Download,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

export const PrincipalStudentDirectory: React.FC = () => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'risk' | 'fee_due' | 'top'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  // Filter students across the whole institution
  const filteredStudents = useMemo(() => {
    return allStudentsInSchool.filter((st) => {
      const matchBatch = selectedBatchId === 'all' || st.batchId === selectedBatchId;
      const matchGrade =
        selectedGradeFilter === 'all' ||
        (selectedGradeFilter === '10' && st.batchName.includes('Class 10')) ||
        (selectedGradeFilter === '9' && st.batchName.includes('Class 9'));

      const matchSearch =
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.parentPhone.includes(searchQuery) ||
        (st.parentEmail && st.parentEmail.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'risk' && st.attendancePct < 75) ||
        (statusFilter === 'fee_due' && st.feeStatus !== 'paid') ||
        (statusFilter === 'top' && st.rankInBatch <= 2);

      return matchBatch && matchGrade && matchSearch && matchStatus;
    });
  }, [selectedBatchId, selectedGradeFilter, searchQuery, statusFilter]);

  // Overall institutional statistics
  const totalEnrolled = allStudentsInSchool.length;
  const overallAvgAttendance = (
    allStudentsInSchool.reduce((acc, curr) => acc + curr.attendancePct, 0) / (totalEnrolled || 1)
  ).toFixed(1);

  const atRiskStudentsCount = allStudentsInSchool.filter((s) => s.attendancePct < 75).length;
  const feePendingCount = allStudentsInSchool.filter((s) => s.feeStatus !== 'paid').length;

  const handleExportCSV = () => {
    try {
      const headers = ['Roll Number', 'Name', 'Class', 'Admission No', 'Attendance %', 'Guardian Name', 'Guardian Phone', 'Guardian Email', 'Blood Group', 'Fee Status'];
      const rows = filteredStudents.map((s) => [
        `"${s.rollNumber}"`,
        `"${s.name}"`,
        `"${s.batchName}"`,
        `"${s.admissionNumber}"`,
        `"${s.attendancePct}%"`,
        `"${s.parentName}"`,
        `"${s.parentPhone}"`,
        `"${s.parentEmail || ''}"`,
        `"${s.bloodGroup || 'O+'}"`,
        `"${s.feeStatus || 'paid'}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `EduOS_Student_Roster_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Roster Downloaded', 'success', `Exported ${filteredStudents.length} student records as CSV.`);
    } catch {
      toast('Export Error', 'error', 'Could not generate CSV file.');
    }
  };

  const handlePrintAllIDs = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Institutional Student & Parent Directory"
        subtitle={`All-Campus Student Records, Parent Contacts & Digital ID Cards for ${mockTenant.name}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleExportCSV} className="btn-secondary">
              <FileSpreadsheet size={15} /> Export Roster (CSV)
            </button>
            <button onClick={handlePrintAllIDs} className="btn-primary">
              <Printer size={15} /> Print Digital ID Cards
            </button>
          </div>
        }
      />

      {/* Global Institutional KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total School Enrollment"
          value={<>{totalEnrolled}<span className="text-base font-medium text-text-tertiary"> / 160</span></>}
          tone="primary"
          icon={<Users size={16} />}
          hint="Across 4 active CBSE sections"
        />
        <StatCard
          label="School-Wide Attendance"
          value={<>{overallAvgAttendance}<span className="text-base font-medium text-text-tertiary">%</span></>}
          tone="success"
          icon={<Clock size={16} />}
          hint="CBSE Board compliance threshold: >75%"
        />
        <StatCard
          label="Board Eligibility Watchlist"
          value={atRiskStudentsCount}
          tone={atRiskStudentsCount > 0 ? 'warning' : 'success'}
          icon={<ShieldCheck size={16} />}
          hint={atRiskStudentsCount > 0 ? `${atRiskStudentsCount} students below 75% attendance` : '100% board clearance rate'}
        />
        <StatCard
          label="Fee Clearance Pipeline"
          value={<>{totalEnrolled - feePendingCount}<span className="text-base font-medium text-text-tertiary"> / {totalEnrolled}</span></>}
          tone="info"
          icon={<Award size={16} />}
          hint={`${feePendingCount} students pending Term 2 fee`}
        />
      </div>

      {/* Institutional Class Allocator & Filter Bar */}
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search across all classes by student, roll no, admission no, parent name or phone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9"
            />
          </div>

          {/* Class / Batch Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-micro text-text-tertiary">
              <Building2 size={14} /> Class:
            </div>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="input py-1.5 text-meta sm:w-52"
            >
              <option value="all">All School Classes ({totalEnrolled})</option>
              {mockBatches.map((b) => (
                <option key={b.id} value={b.id}>{b.name.split(' — ')[0]}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input py-1.5 text-meta sm:w-44"
            >
              <option value="all">All Status</option>
              <option value="top">Top Rankers (Rank 1-2)</option>
              <option value="risk">Attendance Risk ({'<'}75%)</option>
              <option value="fee_due">Fee Dues Pending</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-md border border-border bg-surface-muted p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-2.5 py-1 text-micro rounded font-medium transition-all',
                  viewMode === 'grid' ? 'bg-surface text-foreground shadow-xs font-bold' : 'text-text-secondary',
                )}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'px-2.5 py-1 text-micro rounded font-medium transition-all',
                  viewMode === 'table' ? 'bg-surface text-foreground shadow-xs font-bold' : 'text-text-secondary',
                )}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Directory Roster Container */}
      <SectionCard
        title={`Institutional Student Directory (${filteredStudents.length} students)`}
        icon={<Users size={18} />}
        action={<Badge tone="primary">{selectedBatchId === 'all' ? 'All Campuses' : 'Selected Class'}</Badge>}
        bodyClassName="p-0"
      >
        {filteredStudents.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title="No students match the criteria"
            description="Try selecting another class or clearing search filters."
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredStudents.map((st) => (
              <Card
                key={st.id}
                className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <img
                      src={st.avatarUrl}
                      alt={st.name}
                      className="h-14 w-14 rounded-xl object-cover ring-2 ring-border shadow-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="truncate text-section font-bold text-foreground">{st.name}</h4>
                        <Badge tone={st.attendancePct >= 75 ? 'success' : 'warning'} className="text-[10px] py-0.5">
                          {st.attendancePct}% Att
                        </Badge>
                      </div>
                      <div className="text-micro text-primary font-semibold truncate">
                        {st.batchName.split(' — ')[0]}
                      </div>
                      <div className="text-micro text-text-tertiary mt-0.5">
                        Roll: <strong className="text-foreground">{st.rollNumber}</strong> · Adm: {st.admissionNumber}
                      </div>
                    </div>
                  </div>

                  {/* Parent and Status Summary */}
                  <div className="mt-4 rounded-lg border border-border bg-surface-muted p-3 text-micro flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-text-secondary">
                      <span className="font-semibold text-foreground">Guardian:</span>
                      <span className="truncate max-w-[150px] font-medium">{st.parentName}</span>
                    </div>
                    <div className="flex items-center justify-between text-text-secondary">
                      <span className="font-semibold text-foreground">Phone:</span>
                      <span className="font-mono text-primary">{st.parentPhone}</span>
                    </div>
                    <div className="flex items-center justify-between text-text-secondary">
                      <span className="font-semibold text-foreground">Fee Clearance:</span>
                      <Badge tone={st.feeStatus === 'paid' ? 'success' : 'warning'} className="text-[10px] py-0.5">
                        {st.feeStatus === 'paid' ? 'Cleared' : 'Term 2 Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-micro text-text-tertiary">
                    Blood: <strong className="text-destructive">{st.bloodGroup || 'O+'}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedStudentForModal(st)}
                    className="btn-primary py-1.5 px-3 text-micro"
                  >
                    <IdCard size={14} /> 360° Profile & Digital ID
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Class & Section</th>
                  <th>Roll / Adm No</th>
                  <th>Attendance</th>
                  <th>Parent / Guardian</th>
                  <th>Contact</th>
                  <th>Fee Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={st.avatarUrl} alt={st.name} className="h-9 w-9 rounded-lg object-cover" />
                        <div>
                          <div className="font-semibold text-foreground">{st.name}</div>
                          <div className="text-micro text-text-tertiary">Blood: {st.bloodGroup || 'O+'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-medium text-foreground">{st.batchName.split(' — ')[0]}</td>
                    <td className="text-text-secondary">
                      <div>{st.rollNumber}</div>
                      <div className="text-micro text-text-tertiary">{st.admissionNumber}</div>
                    </td>
                    <td>
                      <Badge tone={st.attendancePct >= 75 ? 'success' : 'warning'}>
                        {st.attendancePct}%
                      </Badge>
                    </td>
                    <td className="font-medium text-foreground">{st.parentName}</td>
                    <td className="font-mono text-micro text-primary">{st.parentPhone}</td>
                    <td>
                      <Badge tone={st.feeStatus === 'paid' ? 'success' : 'warning'}>
                        {st.feeStatus === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedStudentForModal(st)}
                        className="btn-secondary py-1 px-2.5 text-micro"
                      >
                        <IdCard size={13} /> View 360°
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* 360° Profile & Digital ID Modal */}
      <StudentProfileDetailModal
        student={selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        viewerRole="principal"
      />
    </div>
  );
};
