/**
 * CBSE Class IX–X scholastic computation: 80-mark term exam + 20-mark internal
 * assessment (best-two periodic tests scaled to 10, notebook/portfolio 5,
 * subject enrichment 5).
 */

export interface TermGradeInputs {
  /** Each out of 20. */
  periodicTests: number[];
  portfolio: number;
  subjectEnrichment: number;
  termExamMarks: number;
}

export interface TermGradeResult {
  periodicScaled: number;
  internalTotal: number;
  termExamMarks: number;
  grandTotal: number;
  grade: string;
}

export type CoScholasticGrade = 'A' | 'B' | 'C';

const GRADE_SCALE: ReadonlyArray<{ min: number; grade: string }> = [
  { min: 91, grade: 'A1' },
  { min: 81, grade: 'A2' },
  { min: 71, grade: 'B1' },
  { min: 61, grade: 'B2' },
  { min: 51, grade: 'C1' },
  { min: 41, grade: 'C2' },
  { min: 33, grade: 'D' },
];

/** CBSE 8-point scale, applied to a mark out of 100. */
export function cbseGrade(percentage: number): string {
  return GRADE_SCALE.find((band) => percentage >= band.min)?.grade ?? 'E';
}

export function computeCBSEScholasticMark(inputs: TermGradeInputs): TermGradeResult {
  const bestTwo = [...inputs.periodicTests].sort((a, b) => b - a).slice(0, 2);
  const periodicAvg = bestTwo.length ? bestTwo.reduce((sum, m) => sum + m, 0) / bestTwo.length : 0;
  const periodicScaled = (periodicAvg / 20) * 10;

  const internalTotal =
    periodicScaled + inputs.portfolio + inputs.subjectEnrichment;
  const grandTotal = Math.round(internalTotal + inputs.termExamMarks);

  return {
    periodicScaled: Number(periodicScaled.toFixed(1)),
    internalTotal: Number(internalTotal.toFixed(1)),
    termExamMarks: inputs.termExamMarks,
    grandTotal,
    grade: cbseGrade(grandTotal),
  };
}
