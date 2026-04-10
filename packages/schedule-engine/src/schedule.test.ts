import { describe, expect, it } from 'vitest';
import { computeNextOccurrences } from './schedule';
import type { ComputeOptions, Schedule } from './types';

const baseOptions: ComputeOptions = {
  from: new Date('2026-04-10T08:00:00'),
  count: 3,
  timezone: 'Europe/Kyiv',
};

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: 'test-1',
    type: 'once_daily',
    times: ['09:00'],
    startDate: '2026-04-01T00:00:00',
    paused: false,
    ...overrides,
  };
}

describe('computeNextOccurrences', () => {
  it('returns empty array for paused schedule', () => {
    const schedule = makeSchedule({ paused: true });
    const result = computeNextOccurrences(schedule, baseOptions);
    expect(result).toEqual([]);
  });

  it('returns empty array for as_needed schedule', () => {
    const schedule = makeSchedule({ type: 'as_needed' });
    const result = computeNextOccurrences(schedule, baseOptions);
    expect(result).toEqual([]);
  });

  it('computes next occurrence for once_daily', () => {
    const schedule = makeSchedule({ times: ['09:00'] });
    const result = computeNextOccurrences(schedule, { ...baseOptions, count: 1 });

    expect(result).toHaveLength(1);
    expect(result[0]?.scheduledAt.getHours()).toBe(9);
    expect(result[0]?.scheduledAt.getMinutes()).toBe(0);
  });

  it('computes multiple occurrences for once_daily', () => {
    const schedule = makeSchedule({ times: ['09:00'] });
    const result = computeNextOccurrences(schedule, baseOptions);

    expect(result).toHaveLength(3);
    // Each occurrence should be on consecutive days
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1]?.scheduledAt;
      const curr = result[i]?.scheduledAt;
      if (!prev || !curr) throw new Error('missing occurrence');
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(1);
    }
  });

  it('computes occurrences for twice_daily', () => {
    const schedule = makeSchedule({ type: 'twice_daily', times: ['08:00', '20:00'] });
    const options: ComputeOptions = {
      from: new Date('2026-04-10T07:00:00'),
      count: 4,
      timezone: 'Europe/Kyiv',
    };
    const result = computeNextOccurrences(schedule, options);

    expect(result).toHaveLength(4);
    expect(result[0]?.scheduledAt.getHours()).toBe(8);
    expect(result[1]?.scheduledAt.getHours()).toBe(20);
  });

  it('computes occurrences for every_x_hours', () => {
    const schedule = makeSchedule({
      type: 'every_x_hours',
      times: [],
      intervalHours: 8,
    });
    const options: ComputeOptions = {
      from: new Date('2026-04-10T07:00:00'),
      count: 3,
      timezone: 'Europe/Kyiv',
    };
    const result = computeNextOccurrences(schedule, options);

    expect(result).toHaveLength(3);
    expect(result[0]?.scheduledAt.getHours()).toBe(8);
    expect(result[1]?.scheduledAt.getHours()).toBe(16);
    expect(result[2]?.scheduledAt.getHours()).toBe(0);
  });

  it('respects end date', () => {
    const schedule = makeSchedule({
      times: ['09:00'],
      endDate: '2026-04-11T23:59:59',
    });
    const result = computeNextOccurrences(schedule, { ...baseOptions, count: 10 });

    expect(result).toHaveLength(2); // Apr 10 and Apr 11
  });

  it('returns empty when from is after end date', () => {
    const schedule = makeSchedule({
      times: ['09:00'],
      endDate: '2026-04-09T23:59:59',
    });
    const result = computeNextOccurrences(schedule, baseOptions);
    expect(result).toEqual([]);
  });

  it('skips times before from', () => {
    const schedule = makeSchedule({ times: ['07:00', '12:00', '20:00'] });
    const options: ComputeOptions = {
      from: new Date('2026-04-10T10:00:00'),
      count: 2,
      timezone: 'Europe/Kyiv',
    };
    const result = computeNextOccurrences(schedule, options);

    expect(result[0]?.scheduledAt.getHours()).toBe(12);
    expect(result[1]?.scheduledAt.getHours()).toBe(20);
  });

  it('skips times before start date', () => {
    const schedule = makeSchedule({
      times: ['09:00'],
      startDate: '2026-04-12T00:00:00',
    });
    const result = computeNextOccurrences(schedule, baseOptions);

    expect(result).toHaveLength(3);
    expect(result[0]?.scheduledAt.getDate()).toBe(12);
  });

  it('attaches schedule ID to each occurrence', () => {
    const schedule = makeSchedule({ id: 'med-abc' });
    const result = computeNextOccurrences(schedule, { ...baseOptions, count: 1 });

    expect(result[0]?.scheduleId).toBe('med-abc');
  });
});
