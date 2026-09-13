import { Student, TimetableSlot, Batch } from './types';
import { authClient } from './auth/client';
import { isSupabaseConfigured } from './supabase';

/**
 * batchData is the client-side cache of what `syncBatchDataFromSupabase()`
 * fetches. It starts EMPTY on purpose — the previous version shipped a
 * 30-student "Class 10 - A" seed as a fallback for every read, which meant a
 * failed Supabase call, a stale mount before the sync resolved, or an
 * unauthenticated view all rendered the same fake Delhi roster and their real
 * parent phone/email placeholders in production UI. That's not a fallback,
 * that's a data leak of seeded fixtures.
 *
 * Callers must handle "not yet loaded" explicitly (loading state or empty).
 * `getStudentsForBatch()` / `getTimetableForBatch()` return `[]` for an
 * unknown batch instead of a demo roster; `getBatchById()` returns
 * `undefined` instead of the fake Class 10 batch.
 */

/**
 * Empty by default. Gets replaced by the first Supabase sync via
 * `syncBatchDataFromSupabase()` — kept mutable (`let`) so a re-sync updates
 * this reference in place, matching the pattern the rest of the app was
 * already reading.
 */
export let allStudentsInSchool: Student[] = [];

/** Batches in the school. Empty until Supabase resolves. */
export let teacherBatches: Batch[] = [];

/**
 * Roster per batch id — Supabase sync fills it. A missing key means "not
 * loaded yet", NOT "no students in that batch".
 */
export const studentsByBatch: Record<string, Student[]> = {};

/**
 * Timetable per batch id — same rule as `studentsByBatch`.
 */
export const timetableByBatch: Record<string, TimetableSlot[]> = {};

/**
 * Look up students for a batch id. Returns `[]` (never a demo roster) when
 * either the id is missing or the sync hasn't happened yet.
 */
export function getStudentsForBatch(batchId: string | null | undefined): Student[] {
  if (!batchId) return [];
  return studentsByBatch[batchId] || [];
}

/** Legacy alias — some callers imported the arrow-style name. */
export const studentsForBatch = getStudentsForBatch;

/**
 * Look up timetable for a batch id. Returns `[]` for the same reasons as
 * `getStudentsForBatch`.
 */
export function getTimetableForBatch(batchId: string | null | undefined): TimetableSlot[] {
  if (!batchId) return [];
  return timetableByBatch[batchId] || [];
}

/** Legacy alias. */
export const timetableForBatch = getTimetableForBatch;

/**
 * Look up batch metadata by id — `undefined` for an unknown id, so callers
 * render a "batch not found" state instead of Class 10 - A's fake mentor.
 */
export function getBatchById(batchId: string | null | undefined): Batch | undefined {
  if (!batchId) return undefined;
  return teacherBatches.find((b) => b.id === batchId || b.code === batchId);
}

/**
 * Fetch batches, students and timetables from Supabase and replace the
 * client-side cache. Called once at app boot (`store.ts::useSyncedBatchData`)
 * plus wherever a role change needs a re-read.
 *
 * Returns whatever was in the cache — empty if the call failed. The caller
 * decides whether an empty result means "still loading" (first call) or
 * "genuinely no data" (call succeeded, table empty).
 */
export async function syncBatchDataFromSupabase(): Promise<{ batches: Batch[]; students: Student[] }> {
  if (!isSupabaseConfigured()) {
    return { batches: teacherBatches, students: allStudentsInSchool };
  }

  try {
    const { data: batchesData } = await authClient
      .from('batches')
      .select(`
        id, name, code, target_exam, academic_year, room_number, capacity,
        user_profiles:mentor_teacher_id (first_name, last_name)
      `);

    const { data: studentsData } = await authClient
      .from('students')
      .select(`
        id, user_id, tenant_id, batch_id, roll_number, admission_number, dob, gender,
        parent_name, parent_phone, parent_email, blood_group, qr_code_id,
        batches:batch_id (id, name, target_exam),
        user_profiles:user_id (id, first_name, last_name, email, avatar_url),
        tenants:tenant_id (name)
      `)
      .order('roll_number', { ascending: true });

    const { data: timetableData } = await authClient
      .from('timetables')
      .select(`
        id, tenant_id, batch_id, subject_id, teacher_id, day_of_week, period_number, start_time, end_time, room_number, type,
        subjects:subject_id (id, name, color),
        batches:batch_id (id, name),
        user_profiles:teacher_id (first_name, last_name)
      `)
      .order('day_of_week', { ascending: true })
      .order('period_number', { ascending: true });

    if (batchesData) {
      teacherBatches = batchesData.map((b: any) => ({
        id: b.id,
        name: b.name,
        // Trimmed defaults: no fake mentor name, no invented room. The UI is
        // now free to render "—" for a genuinely missing field rather than
        // "Meera Iyer / Room 101" for every batch.
        code: b.code || '',
        targetExam: b.target_exam || '',
        gradeLevel: '',
        roomNumber: b.room_number || '',
        mentorTeacherName: b.user_profiles
          ? `${b.user_profiles.first_name || ''} ${b.user_profiles.last_name || ''}`.trim()
          : '',
        studentCount: studentsData ? studentsData.filter((s: any) => s.batch_id === b.id).length : 0,
        capacity: b.capacity || 0,
      }));
    }

    if (timetableData) {
      // Reset the cache so a stale row from a previous sync can't stay behind
      // (a deleted timetable slot would silently keep appearing otherwise).
      for (const k of Object.keys(timetableByBatch)) delete timetableByBatch[k];

      const formatTimeStr = (t: string) => {
        if (!t) return '';
        if (t.includes('AM') || t.includes('PM')) return t;
        const parts = t.split(':');
        if (parts.length >= 2) {
          let h = parseInt(parts[0], 10);
          const m = parts[1];
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
        }
        return t;
      };

      timetableData.forEach((row: any) => {
        if (!timetableByBatch[row.batch_id]) {
          timetableByBatch[row.batch_id] = [];
        }
        timetableByBatch[row.batch_id].push({
          id: row.id,
          tenantId: row.tenant_id,
          batchId: row.batch_id,
          batchName: row.batches?.name || '',
          subjectId: row.subject_id,
          subjectName: row.subjects?.name || '',
          subjectColor: row.subjects?.color || '#2563EB',
          teacherId: row.teacher_id,
          teacherName: row.user_profiles
            ? `${row.user_profiles.first_name || ''} ${row.user_profiles.last_name || ''}`.trim()
            : '',
          roomNumber: row.room_number || '',
          dayOfWeek: row.day_of_week,
          periodNumber: row.period_number,
          startTime: formatTimeStr(row.start_time),
          endTime: formatTimeStr(row.end_time),
          type: (row.type as any) || 'lecture',
        });
      });
    }

    if (studentsData) {
      allStudentsInSchool = studentsData.map((s: any, idx: number) => {
        const prof = s.user_profiles;
        const batch = s.batches;
        const name = prof ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim() : `Student ${idx + 1}`;
        return {
          id: s.id,
          userId: s.user_id,
          name,
          email: prof?.email || '',
          rollNumber: s.roll_number || '',
          admissionNumber: s.admission_number || '',
          batchId: s.batch_id || '',
          batchName: batch?.name || '',
          targetExam: batch?.target_exam || '',
          attendancePct: null,
          rankInBatch: null,
          // These used to be filled with placeholder "Parent / +91-9810111000".
          // A missing parent phone is now honestly missing, so the UI shows
          // "—" instead of a fake contact number that could confuse staff.
          parentName: s.parent_name || '',
          parentPhone: s.parent_phone || '',
          parentEmail: s.parent_email || '',
          bloodGroup: s.blood_group || '',
          dob: s.dob || '',
          gender: s.gender || '',
          qrCodeId: s.qr_code_id || s.id,
          avatarUrl: prof?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          tenantName: s.tenants?.name || '',
        };
      });

      // Reset per-batch buckets so a deleted student can't linger.
      for (const k of Object.keys(studentsByBatch)) delete studentsByBatch[k];
      for (const s of allStudentsInSchool) {
        if (!s.batchId) continue;
        if (!studentsByBatch[s.batchId]) studentsByBatch[s.batchId] = [];
        studentsByBatch[s.batchId].push(s);
      }
    }

    return { batches: teacherBatches, students: allStudentsInSchool };
  } catch (err) {
    console.warn('Failed to sync batch data from Supabase:', err);
    return { batches: teacherBatches, students: allStudentsInSchool };
  }
}
