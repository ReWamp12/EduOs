import { Injectable, Logger } from '@nestjs/common';

export interface FacultySlot {
  teacherId: string;
  teacherName: string;
  subject: string;
  batchId: string;
  batchName: string;
  dayOfWeek: number;
  periodNumber: number;
  roomNumber: string;
}

export interface SubstitutionSuggestion {
  teacherId: string;
  teacherName: string;
  specialization: string;
  freePeriod: boolean;
  score: number; // match rating based on subject affinity and weekly workload
  reason: string;
}

@Injectable()
export class TimetableSolverService {
  private readonly logger = new Logger(TimetableSolverService.name);

  /**
   * Validates a weekly schedule to ensure no teacher or room double-bookings exist.
   */
  validateSchedule(slots: FacultySlot[]): { isValid: boolean; clashes: string[] } {
    const clashes: string[] = [];
    const teacherMap = new Map<string, string>(); // `day-period-teacherId` -> slot info
    const roomMap = new Map<string, string>();    // `day-period-roomNumber` -> slot info

    for (const slot of slots) {
      const teacherKey = `${slot.dayOfWeek}-${slot.periodNumber}-${slot.teacherId}`;
      const roomKey = `${slot.dayOfWeek}-${slot.periodNumber}-${slot.roomNumber}`;

      if (teacherMap.has(teacherKey)) {
        clashes.push(
          `Teacher Clash: ${slot.teacherName} is double-booked on Day ${slot.dayOfWeek}, Period ${slot.periodNumber} (${slot.batchName} vs ${teacherMap.get(teacherKey)})`,
        );
      } else {
        teacherMap.set(teacherKey, slot.batchName);
      }

      if (slot.roomNumber && roomMap.has(roomKey)) {
        clashes.push(
          `Room Clash: ${slot.roomNumber} is occupied by multiple batches on Day ${slot.dayOfWeek}, Period ${slot.periodNumber}`,
        );
      } else if (slot.roomNumber) {
        roomMap.set(roomKey, slot.batchName);
      }
    }

    return {
      isValid: clashes.length === 0,
      clashes,
    };
  }

  /**
   * Suggests best-match substitute teachers when a staff member applies for leave.
   */
  suggestSubstitutes(
    absentTeacherSubject: string,
    dayOfWeek: number,
    periodNumber: number,
    allFaculty: Array<{
      id: string;
      name: string;
      specialization: string;
      occupiedSlots: Array<{ dayOfWeek: number; periodNumber: number }>;
    }>,
  ): SubstitutionSuggestion[] {
    const suggestions: SubstitutionSuggestion[] = [];

    for (const teacher of allFaculty) {
      const isBusy = teacher.occupiedSlots.some(
        (s) => s.dayOfWeek === dayOfWeek && s.periodNumber === periodNumber,
      );

      let score = 0;
      let reason = 'Available during period';

      if (isBusy) {
        continue; // Teacher has an active lecture in another classroom
      }

      // Subject alignment bonus
      if (
        teacher.specialization.toLowerCase().includes(absentTeacherSubject.toLowerCase()) ||
        absentTeacherSubject.toLowerCase().includes(teacher.specialization.toLowerCase())
      ) {
        score += 50;
        reason = `Subject specialist in ${teacher.specialization} & free period`;
      } else {
        score += 20;
        reason = `General faculty (${teacher.specialization}) available for revision/invigilation`;
      }

      suggestions.push({
        teacherId: teacher.id,
        teacherName: teacher.name,
        specialization: teacher.specialization,
        freePeriod: !isBusy,
        score,
        reason,
      });
    }

    return suggestions.sort((a, b) => b.score - a.score);
  }
}
