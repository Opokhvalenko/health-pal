import type { ComputeOptions, Occurrence, Schedule } from './types';

/**
 * Computes next N occurrences for a given schedule.
 * Pure function — no side effects, fully testable.
 */
export function computeNextOccurrences(
  schedule: Schedule,
  options: ComputeOptions,
): readonly Occurrence[] {
  if (schedule.paused) return [];
  if (schedule.type === 'as_needed') return [];

  const { from, count } = options;
  const startDate = new Date(schedule.startDate);
  const endDate = schedule.endDate ? new Date(schedule.endDate) : null;

  if (endDate && from > endDate) return [];

  const occurrences: Occurrence[] = [];
  const times =
    schedule.type === 'every_x_hours'
      ? generateIntervalTimes(schedule.intervalHours ?? 8)
      : [...schedule.times];

  // Start from the beginning of the reference day
  const currentDay = new Date(from);
  currentDay.setHours(0, 0, 0, 0);

  // Search up to 90 days ahead
  const maxDays = 90;

  for (let day = 0; day < maxDays && occurrences.length < count; day++) {
    const checkDate = new Date(currentDay);
    checkDate.setDate(checkDate.getDate() + day);

    if (endDate && checkDate > endDate) break;
    if (checkDate < startDate) {
      // Check if same day but some times are still ahead
      if (checkDate.toDateString() !== startDate.toDateString()) continue;
    }

    for (const time of times) {
      const [hours, minutes] = time.split(':').map(Number);
      if (hours === undefined || minutes === undefined) continue;

      const occurrence = new Date(checkDate);
      occurrence.setHours(hours, minutes, 0, 0);

      if (occurrence <= from) continue;
      if (occurrence < startDate) continue;
      if (endDate && occurrence > endDate) continue;

      occurrences.push({
        scheduledAt: occurrence,
        scheduleId: schedule.id,
      });

      if (occurrences.length >= count) break;
    }
  }

  return occurrences;
}

function generateIntervalTimes(intervalHours: number): string[] {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour += intervalHours) {
    times.push(`${String(hour).padStart(2, '0')}:00`);
  }
  return times;
}
