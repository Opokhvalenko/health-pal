export type DoseStatus = 'taken' | 'skipped' | 'missed' | 'snoozed';

export interface DoseEvent {
  readonly id: string;
  readonly scheduleId: string;
  readonly scheduledAt: Date;
  readonly status: DoseStatus;
  readonly recordedAt: Date;
}

export interface AdherenceSummary {
  readonly totalScheduled: number;
  readonly taken: number;
  readonly skipped: number;
  readonly missed: number;
  readonly snoozed: number;
  readonly adherencePercent: number;
}

export interface StreakInfo {
  readonly currentStreak: number;
  readonly longestStreak: number;
}

export interface TodayState {
  readonly totalToday: number;
  readonly completedToday: number;
  readonly nextDose: Date | null;
}

export type AdherencePeriod = '7d' | '30d' | 'all';
