'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTenant } from '@/lib/useTenant';
import { dataService } from '@/lib/dataService';
import { ReportCardData, ReportTerm, Student } from '@/lib/types';
import { cbseGrade, computeCBSEScholasticMark } from '@/lib/cbseGrading';
import { formatPct, NO_VALUE } from '@/lib/format';
import { Award, CheckCircle2, Printer, X, QrCode, ShieldCheck, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui';
import { ReportCardEditor } from './ReportCardEditor';

interface ReportCardProps {
  student: Student;
  batchName: string;
  academicYear?: string;
  isPrincipalSigned?: boolean;
  onClose: () => void;
}

const TERM_LABEL: Record<ReportTerm, string> = { term1: 'Term 1', term2: 'Term 2' };

const GRADE_LABEL: Record<string, string> = { A: 'A (Outstanding)', B: 'B (Very Good)', C: 'C (Fair)' };

export const ReportCardGeneratorModal: React.FC<ReportCardProps> = ({
  student,
  batchName,
  academicYear = '2026-2027',
  isPrincipalSigned = false,
  onClose,
}) => {
  const { tenant } = useTenant();
  const [term, setTerm] = useState<ReportTerm>('term1');
  const [data, setData] = useState<ReportCardData | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let active = true;
    setData(null);
    dataService.getReportCardData(student.id, academicYear, term).then((d) => {
      if (active) setData(d);
    });
    return () => {
      active = false;
    };
  }, [student.id, academicYear, term]);

  const subjects = useMemo(
    () =>
      (data?.assessments ?? []).map((a) => ({
        ...a,
        result: computeCBSEScholasticMark({
          periodicTests: a.periodicTests,
          portfolio: a.portfolio,
          subjectEnrichment: a.subjectEnrichment,
          termExamMarks: a.termExamMarks,
        }),
      })),
    [data],
  );

  const totalObtained = subjects.reduce((sum, s) => sum + s.result.grandTotal, 0);
  const maxTotal = subjects.length * 100;
  const overallPercentage = maxTotal ? (totalObtained / maxTotal) * 100 : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-border bg-surface shadow-2xl my-8 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="text-primary" size={20} />
            <h3 className="font-bold text-foreground text-sm sm:text-base">CBSE Report Card</h3>
            <Badge tone={isPrincipalSigned ? 'success' : 'neutral'} className="ml-2">
              <CheckCircle2 size={12} className="mr-1" />
              {isPrincipalSigned ? 'Results published' : 'Draft / Provisional'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Term"
              className="input py-1.5 text-xs"
              value={term}
              onChange={(e) => setTerm(e.target.value as ReportTerm)}
            >
              {(Object.keys(TERM_LABEL) as ReportTerm[]).map((t) => (
                <option key={t} value={t}>{TERM_LABEL[t]}</option>
              ))}
            </select>
            <button
              onClick={() => setEditing((v) => !v)}
              className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs"
              disabled={!data}
            >
              <Pencil size={14} /> {editing ? 'View' : 'Enter marks'}
            </button>
            <button
              onClick={() => window.print()}
              className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs shadow-xs"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-lg text-text-tertiary hover:bg-muted"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {!data ? (
          <div className="p-10 text-center text-sm text-text-secondary">Loading report card…</div>
        ) : editing ? (
          <ReportCardEditor
            student={student}
            academicYear={academicYear}
            term={term}
            data={data}
            onSaved={(saved) => {
              setData(saved);
              setEditing(false);
            }}
          />
        ) : (
          <div className="p-6 sm:p-10 bg-white text-slate-900 font-sans print:p-0">
            <div className="border-b-2 border-slate-900 pb-5 text-center">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                {tenant?.name || student.tenantName || 'Institution'}
              </h1>
              <div className="inline-block mt-3 bg-slate-900 text-white font-bold text-xs uppercase px-4 py-1 rounded-full tracking-wider">
                Continuous and Comprehensive Evaluation (CCE) Report Card · {TERM_LABEL[term]} · {academicYear}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <Detail label="Student Name" value={student.name} />
              <Detail label="Class / Roll Number" value={`${batchName} · ${student.rollNumber || NO_VALUE}`} />
              <Detail label="Admission Number" value={student.admissionNumber || NO_VALUE} mono />
              <Detail label="Parent / Guardian" value={student.parentName || NO_VALUE} />
              <Detail label="Date of Birth" value={student.dob || NO_VALUE} />
              <Detail label="Attendance" value={formatPct(student.attendancePct)} />
            </div>

            <div className="space-y-2 mb-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                Part 1: Scholastic Areas (8-point scale)
              </h4>
              {subjects.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-500">No marks entered for this term yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-300">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-[10px]">
                      <tr>
                        <th className="p-2 border-r border-slate-300">Code</th>
                        <th className="p-2 border-r border-slate-300">Subject</th>
                        <th className="p-2 border-r border-slate-300 text-center">Term Exam (80)</th>
                        <th className="p-2 border-r border-slate-300 text-center">Internal (20)</th>
                        <th className="p-2 border-r border-slate-300 text-center">Total (100)</th>
                        <th className="p-2 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {subjects.map((s) => (
                        <tr key={s.subjectId}>
                          <td className="p-2 font-mono text-slate-500 border-r border-slate-200">{s.subjectCode}</td>
                          <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{s.subjectName}</td>
                          <td className="p-2 text-center font-mono border-r border-slate-200">{s.result.termExamMarks}</td>
                          <td className="p-2 text-center font-mono border-r border-slate-200">{s.result.internalTotal}</td>
                          <td className="p-2 text-center font-bold font-mono border-r border-slate-200">{s.result.grandTotal}</td>
                          <td className="p-2 text-center font-bold text-indigo-700">{s.result.grade}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold">
                        <td colSpan={4} className="p-2 text-right uppercase text-[11px] text-slate-700">
                          Aggregate &amp; Overall Percentage:
                        </td>
                        <td className="p-2 text-center font-mono text-sm">
                          {totalObtained} / {maxTotal}
                        </td>
                        <td className="p-2 text-center text-sm font-black">
                          {formatPct(overallPercentage)} ({overallPercentage === null ? NO_VALUE : cbseGrade(overallPercentage)})
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                Part 2: Co-Scholastic Areas (grades A–C)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <Detail label="Work Education" value={GRADE_LABEL[data.coScholastic.workEducation] ?? NO_VALUE} boxed />
                <Detail label="Art Education" value={GRADE_LABEL[data.coScholastic.artEducation] ?? NO_VALUE} boxed />
                <Detail
                  label="Health & Physical Education"
                  value={GRADE_LABEL[data.coScholastic.healthPhysicalEducation] ?? NO_VALUE}
                  boxed
                />
                <Detail label="Discipline" value={GRADE_LABEL[data.coScholastic.discipline] ?? NO_VALUE} boxed />
              </div>
            </div>

            {data.coScholastic.remarks && (
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs mb-8">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Class Teacher Remarks</span>
                <p className="text-slate-800 italic mt-0.5">{data.coScholastic.remarks}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-10 border-t-2 border-slate-900 items-end text-center text-xs">
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 uppercase text-[10px]">
                Class Teacher Signature
              </div>
              <div className="flex flex-col items-center">
                <QrCode size={26} className="text-slate-600" />
                <span className="text-[9px] text-slate-500 font-mono">Generated via EduOS</span>
              </div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 uppercase text-[10px] flex items-center justify-center gap-1">
                <ShieldCheck size={13} /> Principal
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Detail: React.FC<{ label: string; value: string; mono?: boolean; boxed?: boolean }> = ({
  label,
  value,
  mono,
  boxed,
}) => (
  <div className={boxed ? 'p-2.5 rounded border border-slate-200 bg-slate-50' : undefined}>
    <span className="text-slate-500 block text-[10px] font-bold uppercase">{label}</span>
    <strong className={`text-slate-900 text-sm ${mono ? 'font-mono' : ''}`}>{value}</strong>
  </div>
);
