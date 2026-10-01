/** School office hours used by the query desk guardrail (Mon–Sat, 08:00–15:30 local time). */
const OPEN_MINUTES = 8 * 60;
const CLOSE_MINUTES = 15 * 60 + 30;
const SUNDAY = 0;

export function isWithinSchoolHours(at: Date = new Date()): boolean {
  if (at.getDay() === SUNDAY) return false;
  const minutes = at.getHours() * 60 + at.getMinutes();
  return minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES;
}
