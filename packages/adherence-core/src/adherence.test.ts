import { describe, expect, it } from 'vitest';
import { computeAdherence, computeStreak, computeTodayState } from './adherence';
import type { DoseEvent } from './types';

const now = new Date('2026-04-10T12:00:00');

function makeDoseEvent(overrides: Partial<DoseEvent> & { scheduledAt: Date }): DoseEvent {
  return {
    id: 'de-1',
    scheduleId: 'sched-1',
    status: 'taken',
    recordedAt: new Date(),
    ...overrides,
  };
}

describe('computeAdherence', () => {
  it('returns zero for empty events', () => {
    const result = computeAdherence([], '7d', now);
    expect(result.adherencePercent).toBe(0);
    expect(result.totalScheduled).toBe(0);
  });

  it('computes 100% when all taken', () => {
    const events: DoseEvent[] = [
      makeDoseEvent({ id: '1', scheduledAt: new Date('2026-04-09T09:00:00'), status: 'taken' }),
      makeDoseEvent({ id: '2', scheduledAt: new Date('2026-04-09T21:00:00'), status: 'taken' }),
    ];
    const result = computeAdherence(events, '7d', now);
    expect(result.adherencePercent).toBe(100);
    expect(result.taken).toBe(2);
  });

  it('computes 50% when half taken', () => {
    const events: DoseEvent[] = [
      makeDoseEvent({ id: '1', scheduledAt: new Date('2026-04-09T09:00:00'), status: 'taken' }),
      makeDoseEvent({ id: '2', scheduledAt: new Date('2026-04-09T21:00:00'), status: 'missed' }),
    ];
    const result = computeAdherence(events, '7d', now);
    expect(result.adherencePercent).toBe(50);
  });

  it('counts skipped and snoozed separately', () => {
    const events: DoseEvent[] = [
      makeDoseEvent({ id: '1', scheduledAt: new Date('2026-04-09T09:00:00'), status: 'taken' }),
      makeDoseEvent({ id: '2', scheduledAt: new Date('2026-04-09T14:00:00'), status: 'skipped' }),
      makeDoseEvent({ id: '3', scheduledAt: new Date('2026-04-09T21:00:00'), status: 'snoozed' }),
      makeDoseEvent({ id: '4', scheduledAt: new Date('2026-04-08T09:00:00'), status: 'missed' }),
    ];
    const result = computeAdherence(events, '7d', now);
    expect(result.taken).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.snoozed).toBe(1);
    expect(result.missed).toBe(1);
    expect(result.adherencePercent).toBe(25);
  });

  it('filters by 7d period', () => {
    const events: DoseEvent[] = [
      makeDoseEvent({ id: '1', scheduledAt: new Date('2026-04-09T09:00:00'), status: 'taken' }),
      makeDoseEvent({ id: '2', scheduledAt: new Date('2026-03-01T09:00:00'), status: 'missed' }),
    ];
    const result = computeAdherence(events, '7d', now);
    expect(result.totalScheduled).toBe(1);
    expect(result.adherencePercent).toBe(100);
  });

  it('includes all events for "all" period', () => {
    const events: DoseEvent[] = [
      makeDoseEvent({ id: '1', scheduledAt: new Date('2026-04-09T09:00:00'), status: 'taken' }),
      makeDoseEvent({ id: '2', scheduledAt: new Date('2026-01-01T09:00:00'), status: 'missed' }),
    ];
    const result = computeAdherence(events, 'all', now);
    expect(result.totalScheduled).toBe(2);
    expect(result.adherencePercent).toBe(50);
  });
});

describe('computeStreak', () => {
  it('returns zero for empty events', () => {
    const result = computeStreak([], now);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it('counts consecutive days with all taken', () => {
    const events: DoseEvent[] = [
      makeDoseEvent({ id: '1', scheduledAt: new Date('2026-04-08T09:00:00'), status: 'taken' }),
      makeDoseEvent({ id: '2', scheduledAt: new Date('2026-04-09T09:00:00'), status: 'taken' }),
      makeDoseEvent({ id: '3', scheduledAt: new Date('2026-04-10T09:00:00'), status: 'taken' }),
    ];
    const result = computeStreak(events, now);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('breaks streak on missed dose', () => {
    const events: DoseEvent[] = [
      makeDoseEvent({ id: '1', scheduledAt: new Date('2026-04-08T09:00:00'), status: 'taken' }),
      makeDoseEvent({ id: '2', scheduledAt: new Date('2026-04-09T09:00:00'), status: 'missed' }),
      makeDoseEvent({ id: '3', scheduledAt: new Date('2026-04-10T09:00:00'), status: 'taken' }),
    ];
    const result = computeStreak(events, now);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('handles multiple doses per day', () => {
    const events: DoseEvent[] = [
      makeDoseEvent({ id: '1', scheduledAt: new Date('2026-04-10T09:00:00'), status: 'taken' }),
      makeDoseEvent({ id: '2', scheduledAt: new Date('2026-04-10T21:00:00'), status: 'taken' }),
    ];
    const result = computeStreak(events, now);
    expect(result.currentStreak).toBe(1);
  });

  it('breaks streak if any dose in a day is not taken', () => {
    const events: DoseEvent[] = [
      makeDoseEvent({ id: '1', scheduledAt: new Date('2026-04-10T09:00:00'), status: 'taken' }),
      makeDoseEvent({ id: '2', scheduledAt: new Date('2026-04-10T21:00:00'), status: 'skipped' }),
    ];
    const result = computeStreak(events, now);
    expect(result.currentStreak).toBe(0);
  });
});

describe('computeTodayState', () => {
  it('returns empty state when no events', () => {
    const result = computeTodayState([], [], now);
    expect(result.totalToday).toBe(0);
    expect(result.completedToday).toBe(0);
    expect(result.nextDose).toBeNull();
  });

  it('counts completed doses today', () => {
    const events: DoseEvent[] = [
      makeDoseEvent({ id: '1', scheduledAt: new Date('2026-04-10T09:00:00'), status: 'taken' }),
      makeDoseEvent({ id: '2', scheduledAt: new Date('2026-04-10T14:00:00'), status: 'skipped' }),
    ];
    const scheduledTimes = [
      new Date('2026-04-10T09:00:00'),
      new Date('2026-04-10T14:00:00'),
      new Date('2026-04-10T21:00:00'),
    ];
    const result = computeTodayState(events, scheduledTimes, now);
    expect(result.totalToday).toBe(3);
    expect(result.completedToday).toBe(2);
  });

  it('finds next dose after current time', () => {
    const scheduledTimes = [
      new Date('2026-04-10T09:00:00'),
      new Date('2026-04-10T14:00:00'),
      new Date('2026-04-10T21:00:00'),
    ];
    const result = computeTodayState([], scheduledTimes, now);
    expect(result.nextDose?.getHours()).toBe(14);
  });

  it('returns null nextDose when all doses passed', () => {
    const lateNow = new Date('2026-04-10T23:00:00');
    const scheduledTimes = [new Date('2026-04-10T09:00:00'), new Date('2026-04-10T14:00:00')];
    const result = computeTodayState([], scheduledTimes, lateNow);
    expect(result.nextDose).toBeNull();
  });
});
