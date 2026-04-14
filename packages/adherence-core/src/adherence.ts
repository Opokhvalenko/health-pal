import type {
  AdherencePeriod,
  AdherenceSummary,
  CalendarData,
  CalendarDay,
  DayStatus,
  DoseEvent,
  StreakInfo,
  TodayState,
} from './types';

/**
 * Computes adherence summary for a given period.
 * Pure function — no side effects.
 */
export function computeAdherence(
  events: readonly DoseEvent[],
  period: AdherencePeriod,
  now: Date = new Date(),
): AdherenceSummary {
  const filtered = filterByPeriod(events, period, now);

  const taken = filtered.filter((e) => e.status === 'taken').length;
  const skipped = filtered.filter((e) => e.status === 'skipped').length;
  const missed = filtered.filter((e) => e.status === 'missed').length;
  const snoozed = filtered.filter((e) => e.status === 'snoozed').length;
  const totalScheduled = filtered.length;

  const actionable = totalScheduled - snoozed;
  const adherencePercent = actionable === 0 ? 0 : Math.round((taken / actionable) * 100);

  return { totalScheduled, taken, skipped, missed, snoozed, adherencePercent };
}

/**
 * Computes current and longest streak of consecutive days with all doses taken.
 */
export function computeStreak(events: readonly DoseEvent[], now: Date = new Date()): StreakInfo {
  if (events.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Group events by date string
  const byDate = new Map<string, DoseEvent[]>();
  for (const event of events) {
    const key = toDateKey(event.scheduledAt);
    const existing = byDate.get(key) ?? [];
    existing.push(event);
    byDate.set(key, existing);
  }

  // Sort dates
  const sortedDates = [...byDate.keys()].sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (const dateKey of sortedDates) {
    const dayEvents = byDate.get(dateKey);
    if (!dayEvents) continue;
    const allTaken = dayEvents.every((e) => e.status === 'taken');

    if (allTaken) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Current streak: count backwards from today
  const todayKey = toDateKey(now);
  const todayIndex = sortedDates.indexOf(todayKey);

  if (todayIndex >= 0) {
    currentStreak = 0;
    for (let i = todayIndex; i >= 0; i--) {
      const dateKey = sortedDates[i];
      if (!dateKey) break;
      const dayEvents = byDate.get(dateKey);
      if (!dayEvents) break;
      if (dayEvents.every((e) => e.status === 'taken')) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
}

/**
 * Computes today's state: how many doses done, how many left, next dose time.
 */
export function computeTodayState(
  events: readonly DoseEvent[],
  scheduledTimes: readonly Date[],
  now: Date = new Date(),
): TodayState {
  const todayKey = toDateKey(now);

  const todayEvents = events.filter((e) => toDateKey(e.scheduledAt) === todayKey);

  const completedToday = todayEvents.filter(
    (e) => e.status === 'taken' || e.status === 'skipped',
  ).length;

  const todayScheduled = scheduledTimes.filter((t) => toDateKey(t) === todayKey);

  const nextDose = todayScheduled.find((t) => t > now) ?? null;

  return {
    totalToday: todayScheduled.length,
    completedToday,
    nextDose,
  };
}

/**
 * Computes calendar grid data for the adherence heatmap.
 * Returns exactly `weeks * 7` days, ending on the Sunday of the week containing `now`.
 * The grid is aligned so day-of-week (Mon..Sun) maps to row index 0..6.
 */
export function computeCalendarData(
  events: readonly DoseEvent[],
  weeks: number,
  now: Date = new Date(),
): CalendarData {
  const totalDays = weeks * 7;
  const todayKey = toDateKey(now);

  // Group events by date
  const byDate = new Map<string, DoseEvent[]>();
  for (const event of events) {
    const key = toDateKey(event.scheduledAt);
    const existing = byDate.get(key) ?? [];
    existing.push(event);
    byDate.set(key, existing);
  }

  // End range on the Sunday of the week containing `now` (Mon-first week).
  // JS getDay(): Sun=0..Sat=6 → normalize to Mon=0..Sun=6, then pad to Sunday.
  const monFirstDow = (now.getDay() + 6) % 7;
  const endSunday = new Date(now);
  endSunday.setDate(now.getDate() + (6 - monFirstDow));

  const days: CalendarDay[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date(endSunday);
    date.setDate(endSunday.getDate() - i);
    const key = toDateKey(date);
    const dayEvents = byDate.get(key);

    let status: DayStatus;
    let taken = 0;
    let total = 0;

    if (key > todayKey) {
      status = 'future';
    } else if (!dayEvents || dayEvents.length === 0) {
      status = 'none';
    } else {
      total = dayEvents.length;
      taken = dayEvents.filter((e) => e.status === 'taken').length;

      if (taken === total) {
        status = 'full';
      } else if (taken > 0) {
        status = 'partial';
      } else {
        status = 'missed';
      }
    }

    days.push({ date: key, status, taken, total });
  }

  return { days, weeks };
}

function filterByPeriod(
  events: readonly DoseEvent[],
  period: AdherencePeriod,
  now: Date,
): readonly DoseEvent[] {
  if (period === 'all') return events;

  const days = period === '7d' ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);

  return events.filter((e) => e.scheduledAt >= cutoff);
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
