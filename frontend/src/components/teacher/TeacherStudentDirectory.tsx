'use client';

import React, { useState, useMemo } from 'react';
import { useTeacherBatch } from '@/lib/teacherContext';
import { Student } from '@/lib/types';
import { PageHeader, SectionCard, StatCard, Card, Badge, EmptyState, cn } from '@/components/ui';
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
  Eye,
  CheckCircle2,
} from 'lucide-react';

export const TeacherStudentDirectory: React.FC = () => {
  const { batch, students, batches } = useTeacherBatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'regular' | 'risk'>('all');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const matchSearch =
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.parentPhone.includes(searchQuery);

      const matchAttendance =
        attendanceFilter === 'all' ||
        (attendanceFilter === 'regular' && st.attendancePct >= 85) ||
        (attendanceFilter === 'risk' && st.attendancePct < 75);

      return matchSearch && matchAttendance;
    });
  }, [students, searchQuery, attendanceFilter]);

  const atRiskCount = students.filter((s) => s.attendancePct < 75).length;
  const avgAttendance = students.length
    ? (students.reduce((acc, curr) => acc + curr.attendancePct, 0) / students.length).toFixed(1)
    : '0';

  const handlePrintBatchIds = () => {
    toast('Print Queue Prepared', 'info', `Sending ${students.length} student ID cards for ${batch.name} to printer.`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Student Profiles & Digital ID Directory"
        subtitle={`Class Roster for ${batch.name} (${students.length} students enrolled)`}
        actions={
          <button onClick={handlePrintBatchIds} className="btn-secondary">
            <Printer size={15} /> Print Batch ID Cards
          </button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Enrolled in Class"
          value={students.length}
          tone="primary"
          icon={<Users size={16} />}
          hint={`${batch.name.split(' - ')[0]}`}
        />
        <StatCard
          label="Class Avg Attendance"
          value={<>{avgAttendance}<span className="text-base font-medium text-text-tertiary">%</span></>}
          tone="success"
          icon={<Clock size={16} />}
          hint="Board threshold: >75%"
        />
        <StatCard
          label="Attendance Watchlist"
          value={atRiskCount}
          tone={atRiskCount > 0 ? 'warning' : 'success'}
          icon={<ShieldCheck size={16} />}
          hint={atRiskCount > 0 ? `${atRiskCount} students <75% attendance` : 'All students board eligible'}
        />
        <StatCard
          label="Assigned Classes"
          value={batches.length}
          tone="info"
          icon={<Award size={16} />}
          hint="Use class switcher to toggle"
        />
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by student name, roll number, admission ID, or parent name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-micro text-text-tertiary inline-flex items-center gap-1">
              <Filter size={13} /> Filter:
            </span>
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value as any)}
              className="input py-1.5 text-meta sm:w-44"
            >
              <option value="all">All Students ({students.length})</option>
              <option value="regular">Regular ({'>'}85%)</option>
              <option value="risk">At Risk ({'<'}75%)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Student Cards Roster */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full">
            <SectionCard bodyClassName="p-0">
              <EmptyState
                icon={<Users size={28} />}
                title="No students match your search"
                description="Try clearing search filters to see all enrolled students in this class."
              />
            </SectionCard>
          </div>
        ) : (
          filteredStudents.map((st) => (
            <Card
              key={st.id}
              className="flex flex-col justify-between p-5 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div>
                {/* Student Top Row */}
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
                    <div className="text-micro text-text-tertiary">
                      Roll: <strong className="text-foreground">{st.rollNumber}</strong> · Adm: {st.admissionNumber}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-micro text-primary font-medium">
                      <Award size={12} /> Rank #{st.rankInBatch} in Section
                    </div>
                  </div>
                </div>

                {/* Parent & Emergency Contact Summary */}
                <div className="mt-4 rounded-lg border border-border bg-surface-muted p-3 text-micro flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="font-semibold text-foreground">Guardian:</span>
                    <span className="truncate max-w-[150px]">{st.parentName}</span>
                  </div>
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="font-semibold text-foreground">Contact:</span>
                    <a
                      href={`tel:${st.parentPhone}`}
                      className="text-primary hover:underline font-mono"
                    >
                      {st.parentPhone}
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="font-semibold text-foreground">Blood Group:</span>
                    <span className="font-bold text-destructive">{st.bloodGroup || 'O+'}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-micro text-text-tertiary">
                  ID: <span className="font-mono">{st.qrCodeId.slice(0, 14)}…</span>
                </span>
                <button
                  onClick={() => setSelectedStudentForModal(st)}
                  className="btn-primary py-1.5 px-3 text-micro"
                >
                  <IdCard size={14} /> 360° Profile & Digital ID
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 360° Profile & Digital ID Modal */}
      <StudentProfileDetailModal
        student={selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        viewerRole="teacher"
      />
    </div>
  );
};
