/**
 * EDUOS-108 — display helpers for values that may genuinely be absent.
 *
 * The audit found the same pattern in a dozen places: a metric that the
 * database has no answer for was rendered as a plausible number instead of as
 * "unknown". `student.attendancePct || 94.8`, `activeChild.attendance ??
 * activeChild.attendancePct ?? 94.6`, `Rank #{rank} / 38` — all of these read
 * as real institutional figures.
 *
 * Absent is not zero: a student with no register entries has not attended 0%
 * of class, and a student who has sat no exam is not ranked last. These
 * helpers keep that distinction visible in the UI.
 */

/** The single em-dash used across the product for "no value". */
export const NO_VALUE = '—';

/** `94.2` → "94.2%" · `null` → "—" */
export function formatPct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return NO_VALUE;
  return `${Number(value).toFixed(digits)}%`;
}

/** `4` → "Rank #4" · `null` → "Unranked" */
export function formatRank(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Unranked';
  return `Rank #${value}`;
}

/**
 * Threshold comparisons that must not fire on missing data. A student with no
 * attendance record is not "At Risk (<75%)" — we simply do not know yet, and
 * flagging them would put an unearned warning on a real child's profile.
 */
export function meetsThreshold(
  value: number | null | undefined,
  threshold: number,
): boolean | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return value >= threshold;
}

/** Average that ignores absent values rather than counting them as zero. */
export function averageOf(values: Array<number | null | undefined>): number | null {
  const present = values.filter(
    (v): v is number => v !== null && v !== undefined && !Number.isNaN(v),
  );
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0) / present.length;
}
