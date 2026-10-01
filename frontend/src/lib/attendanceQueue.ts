import { dataService } from './dataService';

/**
 * Offline queue for attendance submissions. A submission made without
 * connectivity (or rejected by the server) is kept in localStorage and
 * re-sent when the browser comes back online. One entry per
 * (batch, date, period): a newer submission replaces the older one.
 */

export interface QueuedAttendance {
  batchId: string;
  date: string;
  periodNumber: number;
  callerId?: string;
  records: Array<{ studentId: string; status: string; isExcusedMedical?: boolean; remarks?: string }>;
}

const STORAGE_KEY = 'eduos_attendance_queue';

const entryKey = (e: Pick<QueuedAttendance, 'batchId' | 'date' | 'periodNumber'>) =>
  `${e.batchId}_${e.date}_${e.periodNumber}`;

export function readAttendanceQueue(): QueuedAttendance[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedAttendance[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function enqueueAttendance(entry: QueuedAttendance): void {
  const rest = readAttendanceQueue().filter((e) => entryKey(e) !== entryKey(entry));
  writeQueue([...rest, entry]);
}

/** Sends every queued submission; returns how many reached the server. Failures stay queued. */
export async function flushAttendanceQueue(): Promise<number> {
  const remaining: QueuedAttendance[] = [];
  let synced = 0;

  for (const entry of readAttendanceQueue()) {
    const res = await dataService.markAttendance(entry.batchId, entry.records, {
      date: entry.date,
      periodNumber: entry.periodNumber,
      callerId: entry.callerId,
      callerRole: 'teacher',
    });
    if (res.synced) synced++;
    else remaining.push(entry);
  }

  writeQueue(remaining);
  return synced;
}
