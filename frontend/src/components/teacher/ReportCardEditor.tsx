'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { dataService } from '@/lib/dataService';
import { CoScholasticRecord, ReportCardData, ReportTerm, Student, TermAssessment } from '@/lib/types';
import { toast } from '@/components/ui/toast';

interface Props {
  student: Student;
  academicYear: string;
  term: ReportTerm;
  data: ReportCardData;
  onSaved: (data: ReportCardData) => void;
}

type FieldKey = 'pt1' | 'pt2' | 'pt3' | 'portfolio' | 'enrichment' | 'termExam';
type DraftRow = Record<FieldKey, string>;

const FIELDS: { key: FieldKey; label: string; max: number }[] = [
  { key: 'pt1', label: 'PT 1 (20)', max: 20 },
  { key: 'pt2', label: 'PT 2 (20)', max: 20 },
  { key: 'pt3', label: 'PT 3 (20)', max: 20 },
  { key: 'portfolio', label: 'Notebook (5)', max: 5 },
  { key: 'enrichment', label: 'SEA (5)', max: 5 },
  { key: 'termExam', label: 'Term Exam (80)', max: 80 },
];

const CO_SCHOLASTIC_FIELDS: { key: keyof Omit<CoScholasticRecord, 'remarks'>; label: string }[] = [
  { key: 'workEducation', label: 'Work Education' },
  { key: 'artEducation', label: 'Art Education' },
  { key: 'healthPhysicalEducation', label: 'Health & Physical Education' },
  { key: 'discipline', label: 'Discipline' },
];

const toDraft = (a?: TermAssessment): DraftRow => ({
  pt1: a?.periodicTests[0]?.toString() ?? '',
  pt2: a?.periodicTests[1]?.toString() ?? '',
  pt3: a?.periodicTests[2]?.toString() ?? '',
  portfolio: a ? a.portfolio.toString() : '',
  enrichment: a ? a.subjectEnrichment.toString() : '',
  termExam: a ? a.termExamMarks.toString() : '',
});

const isBlank = (row: DraftRow) => Object.values(row).every((v) => v === '');

export const ReportCardEditor: React.FC<Props> = ({ student, academicYear, term, data, onSaved }) => {
  const { session } = useAuth();
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string }[]>([]);
  const [rows, setRows] = useState<Record<string, DraftRow>>({});
  const [coScholastic, setCoScholastic] = useState<CoScholasticRecord>(data.coScholastic);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dataService.getSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    setRows(Object.fromEntries(data.assessments.map((a) => [a.subjectId, toDraft(a)])));
    setCoScholastic(data.coScholastic);
  }, [data]);

  const setCell = (subjectId: string, key: FieldKey, value: string) =>
    setRows((prev) => ({ ...prev, [subjectId]: { ...(prev[subjectId] ?? toDraft()), [key]: value } }));

  const handleSave = async () => {
    if (!session) return;
    const assessments: TermAssessment[] = [];

    for (const subject of subjects) {
      const row = rows[subject.id];
      if (!row || isBlank(row)) continue;
      const outOfRange = FIELDS.find(({ key, max }) => Number(row[key] || 0) < 0 || Number(row[key] || 0) > max);
      if (outOfRange) {
        toast('Marks out of range', 'warning', `${subject.name}: ${outOfRange.label} must be within its maximum.`);
        return;
      }
      assessments.push({
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
        periodicTests: [row.pt1, row.pt2, row.pt3].filter((v) => v !== '').map(Number),
        portfolio: Number(row.portfolio || 0),
        subjectEnrichment: Number(row.enrichment || 0),
        termExamMarks: Number(row.termExam || 0),
      });
    }

    const next: ReportCardData = { assessments, coScholastic };
    setSaving(true);
    const ok = await dataService.saveReportCardData({
      tenantId: session.tenantId,
      userId: session.userId,
      studentId: student.id,
      academicYear,
      term,
      data: next,
    });
    setSaving(false);
    if (!ok) {
      toast('Could not save', 'error', 'Report card marks were not saved. Please try again.');
      return;
    }
    toast('Report card saved', 'success', `${student.name} · ${term === 'term1' ? 'Term 1' : 'Term 2'}`);
    onSaved(next);
  };

  return (
    <div className="flex flex-col gap-5 p-6 print:hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-text-secondary">
            <tr>
              <th className="p-2">Subject</th>
              {FIELDS.map((f) => (
                <th key={f.key} className="p-2 text-center">{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td className="p-2 font-semibold text-foreground">{subject.name}</td>
                {FIELDS.map((f) => (
                  <td key={f.key} className="p-1.5">
                    <input
                      type="number"
                      min={0}
                      max={f.max}
                      step="0.5"
                      aria-label={`${subject.name} ${f.label}`}
                      className="input w-20 py-1 text-center"
                      value={rows[subject.id]?.[f.key] ?? ''}
                      onChange={(e) => setCell(subject.id, f.key, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {CO_SCHOLASTIC_FIELDS.map(({ key, label }) => (
          <label key={key} className="flex flex-col gap-1.5">
            <span className="label">{label}</span>
            <select
              className="input"
              value={coScholastic[key]}
              onChange={(e) => setCoScholastic((prev) => ({ ...prev, [key]: e.target.value }))}
            >
              <option value="">—</option>
              {['A', 'B', 'C'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="label">Class teacher remarks</span>
        <textarea
          className="input min-h-[72px]"
          value={coScholastic.remarks}
          onChange={(e) => setCoScholastic((prev) => ({ ...prev, remarks: e.target.value }))}
        />
      </label>

      <div>
        <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save report card'}
        </button>
      </div>
    </div>
  );
};
