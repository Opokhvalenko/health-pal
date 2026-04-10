export type ScheduleType =
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'every_x_hours'
  | 'custom_times'
  | 'as_needed';

export interface Schedule {
  readonly id: string;
  readonly type: ScheduleType;
  /** Times in "HH:mm" format */
  readonly times: readonly string[];
  /** Interval in hours (only for 'every_x_hours') */
  readonly intervalHours?: number;
  /** ISO date string — schedule start */
  readonly startDate: string;
  /** ISO date string — optional end */
  readonly endDate?: string;
  /** Whether the schedule is currently paused */
  readonly paused: boolean;
}

export interface Occurrence {
  readonly scheduledAt: Date;
  readonly scheduleId: string;
}

export interface ComputeOptions {
  /** Reference point for computing next occurrences */
  readonly from: Date;
  /** How many upcoming occurrences to return */
  readonly count: number;
  /** IANA timezone (e.g. "Europe/Kyiv") */
  readonly timezone: string;
}
