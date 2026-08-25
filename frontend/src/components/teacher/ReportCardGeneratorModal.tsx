'use client';

import React, { useRef } from 'react';
import { mockTenant } from '@/lib/mockData';
import { Student } from '@/lib/types';
import {
  Award,
  CheckCircle2,
  Printer,
  X,
  QrCode,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Badge, cn } from '@/components/ui';
import { toast } from '@/components/ui/toast';

interface ScholasticSubject {
  code: string;
  name: string;
  theoryMarks: number;
  internalMarks: number;
  totalMarks: number;
  grade: string;
}

interface ReportCardProps {
  student: Student;
  examTitle: string;
  batchName: string;
  academicYear?: string;
  isPrincipalSigned?: boolean;
  onClose: () => void;
}

const SAMPLE_SUBJECTS: ScholasticSubject[] = [
  { code: '041', name: 'Mathematics (Standard)', theoryMarks: 72, internalMarks: 19, totalMarks: 91, grade: 'A1' },
  { code: '086', name: 'Science (Physics, Chem, Bio)', theoryMarks: 68, internalMarks: 18, totalMarks: 86, grade: 'A2' },
  { code: '087', name: 'Social Science (Hist, Civ, Geo, Eco)', theoryMarks: 70, internalMarks: 19, totalMarks: 89, grade: 'A1' },
  { code: '184', name: 'English Language & Literature', theoryMarks: 74, internalMarks: 20, totalMarks: 94, grade: 'A1' },
  { code: '002', name: 'Hindi Course - A / Sanskrit', theoryMarks: 71, internalMarks: 18, totalMarks: 89, grade: 'A1' },
  { code: '402', name: 'Information Technology (Skill Subject)', theoryMarks: 48, internalMarks: 49, totalMarks: 97, grade: 'A1' },
];

export const ReportCardGeneratorModal: React.FC<ReportCardProps> = ({
  student,
  examTitle,
  batchName,
  academicYear = '2026-2027',
  isPrincipalSigned = true,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const totalObtained = SAMPLE_SUBJECTS.reduce((sum, s) => sum + s.totalMarks, 0);
  const maxTotal = SAMPLE_SUBJECTS.length * 100;
  const overallPercentage = ((totalObtained / maxTotal) * 100).toFixed(1);

  const handlePrint = () => {
    window.print();
    toast('Print layout launched', 'info', `Report card for ${student.name}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-border bg-surface shadow-2xl my-8 overflow-hidden">
        {/* Modal Action Bar */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="text-primary" size={20} />
            <h3 className="font-bold text-foreground text-sm sm:text-base">
              CBSE Official Academic Transcript & Report Card
            </h3>
            <Badge tone="success" className="ml-2">
              <CheckCircle2 size={12} className="mr-1" />
              {isPrincipalSigned ? 'Principal Signed & Verified' : 'Draft / Provisional'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs shadow-xs"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-text-tertiary hover:bg-muted"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Transcript Document Container */}
        <div ref={printRef} className="p-6 sm:p-10 bg-white text-slate-900 font-sans print:p-0">
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-5 text-center relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-left text-[11px] font-semibold text-slate-600 space-y-0.5">
                <div>CBSE Affiliation No: <strong className="text-slate-900">2130842</strong></div>
                <div>School Code: <strong className="text-slate-900">60391</strong></div>
              </div>
              <div className="h-16 w-16 rounded-xl bg-gradient-to-tr from-indigo-700 to-cyan-600 text-white font-black text-2xl grid place-items-center shadow-md">
                {mockTenant.name.charAt(0)}
              </div>
              <div className="text-right text-[11px] font-semibold text-slate-600 space-y-0.5">
                <div>UDISE+ Code: <strong className="text-slate-900">09150102408</strong></div>
                <div>Session: <strong className="text-slate-900">{academicYear}</strong></div>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              {mockTenant.name}
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Senior Secondary Co-Educational Institution · Affiliated to Central Board of Secondary Education, New Delhi
            </p>
            <div className="inline-block mt-3 bg-slate-900 text-white font-bold text-xs uppercase px-4 py-1 rounded-full tracking-wider">
              Continuous and Comprehensive Evaluation (CCE) Report Card · Class X
            </div>
          </div>

          {/* Student Demographics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Student Name</span>
              <strong className="text-slate-900 text-sm">{student.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Roll Number / Section</span>
              <strong className="text-slate-900 text-sm">{student.rollNumber || '10-A-14'} ({batchName})</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Admission Number</span>
              <strong className="text-slate-900 text-sm font-mono">{student.admissionNumber || 'ADM-2024-0492'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">APAAR National ID</span>
              <strong className="text-slate-900 text-sm font-mono">9284-1029-4821</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Mother's Name</span>
              <strong className="text-slate-900">Mrs. Sunita Sharma</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Father's Name</span>
              <strong className="text-slate-900">Mr. Rajesh Sharma</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Date of Birth</span>
              <strong className="text-slate-900">14-04-2010</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Attendance Rate</span>
              <strong className="text-emerald-700 font-bold">{student.attendancePct || 94.8}% (182/192 Days)</strong>
            </div>
          </div>

          {/* Part 1: Scholastic Domain Table */}
          <div className="space-y-2 mb-5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              Part 1: Scholastic Areas (Graded on 8-point scale)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Code</th>
                    <th className="p-2 border-r border-slate-300">Subject Title</th>
                    <th className="p-2 border-r border-slate-300 text-center">Theory (80)</th>
                    <th className="p-2 border-r border-slate-300 text-center">IA / Practical (20)</th>
                    <th className="p-2 border-r border-slate-300 text-center">Total (100)</th>
                    <th className="p-2 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {SAMPLE_SUBJECTS.map((sub) => (
                    <tr key={sub.code} className="hover:bg-slate-50">
                      <td className="p-2 font-mono text-slate-500 border-r border-slate-200">{sub.code}</td>
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{sub.name}</td>
                      <td className="p-2 text-center font-mono border-r border-slate-200">{sub.theoryMarks}</td>
                      <td className="p-2 text-center font-mono border-r border-slate-200">{sub.internalMarks}</td>
                      <td className="p-2 text-center font-bold font-mono text-slate-900 border-r border-slate-200">
                        {sub.totalMarks}
                      </td>
                      <td className="p-2 text-center font-bold text-indigo-700">{sub.grade}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={4} className="p-2 text-right uppercase text-[11px] text-slate-700">
                      Grand Aggregate Total &amp; Overall Percentage:
                    </td>
                    <td className="p-2 text-center font-mono text-slate-900 text-sm">
                      {totalObtained} / {maxTotal}
                    </td>
                    <td className="p-2 text-center text-emerald-700 text-sm font-black">
                      {overallPercentage}% (A1)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Part 2: Co-Scholastic Domain Table */}
          <div className="space-y-2 mb-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              Part 2: Co-Scholastic Activities &amp; Discipline (Graded on 5-point scale A-E)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                <span className="text-[10px] text-slate-500 block">Work Education</span>
                <strong className="text-slate-900">Grade A (Outstanding)</strong>
              </div>
              <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                <span className="text-[10px] text-slate-500 block">Art Education</span>
                <strong className="text-slate-900">Grade A (Outstanding)</strong>
              </div>
              <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                <span className="text-[10px] text-slate-500 block">Health &amp; Physical Education</span>
                <strong className="text-slate-900">Grade A (Exemplary Fitness)</strong>
              </div>
              <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                <span className="text-[10px] text-slate-500 block">Discipline &amp; Conduct</span>
                <strong className="text-slate-900">Grade A (Exemplary)</strong>
              </div>
            </div>
          </div>

          {/* Remarks and Signatures */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs mb-8">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Class Teacher Remarks</span>
            <p className="text-slate-800 italic mt-0.5">
              "Aarav displays remarkable analytical acuity in Mathematics and Sciences. Active contributor in laboratory sessions and inter-house debates. Promoted to Senior Secondary with Distinction."
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-slate-900 items-end text-center text-xs">
            <div>
              <div className="font-serif italic text-slate-700 text-sm mb-1">Amit Verma</div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 uppercase text-[10px]">
                Class Teacher Signature
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="h-10 w-10 border border-slate-300 rounded grid place-items-center text-slate-600 mb-1">
                <QrCode size={26} />
              </div>
              <span className="text-[9px] text-slate-500 font-mono">Digitally Verified via EduOS</span>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1 text-emerald-800 font-bold mb-1">
                <ShieldCheck size={16} />
                <span className="font-serif italic text-sm">Dr. Meenakshi Joshi</span>
              </div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 uppercase text-[10px]">
                Principal / Head of Institution
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
