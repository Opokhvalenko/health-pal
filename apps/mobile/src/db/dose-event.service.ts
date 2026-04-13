import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from './client';
import { generateId, nowISO } from './helpers';
import { doseEvents } from './schema';

export type DoseStatus = 'taken' | 'skipped' | 'missed' | 'snoozed';

export interface DoseEventRow {
  readonly id: string;
  readonly scheduleId: string;
  readonly profileId: string;
  readonly scheduledAt: string;
  readonly status: DoseStatus;
  readonly recordedAt: string;
}

export interface LogDoseInput {
  readonly scheduleId: string;
  readonly profileId: string;
  readonly scheduledAt: string;
  readonly status: DoseStatus;
}

export const doseEventService = {
  async logDose(input: LogDoseInput): Promise<DoseEventRow> {
    // Check if event already exists for this schedule+time (prevent duplicates)
    const existing = await db
      .select()
      .from(doseEvents)
      .where(
        and(
          eq(doseEvents.scheduleId, input.scheduleId),
          eq(doseEvents.scheduledAt, input.scheduledAt),
        ),
      )
      .limit(1);

    if (existing[0]) {
      // Update status instead of creating duplicate
      const recordedAt = nowISO();
      await db
        .update(doseEvents)
        .set({ status: input.status, recordedAt })
        .where(eq(doseEvents.id, existing[0].id));
      return normalizeRow({ ...existing[0], status: input.status, recordedAt });
    }

    const id = generateId();
    const recordedAt = nowISO();
    const values = {
      id,
      scheduleId: input.scheduleId,
      profileId: input.profileId,
      scheduledAt: input.scheduledAt,
      status: input.status,
      recordedAt,
    };
    await db.insert(doseEvents).values(values);
    return values;
  },

  async getForProfile(profileId: string, limit = 100): Promise<DoseEventRow[]> {
    const rows = await db
      .select()
      .from(doseEvents)
      .where(eq(doseEvents.profileId, profileId))
      .orderBy(desc(doseEvents.scheduledAt))
      .limit(limit);
    return rows.map(normalizeRow);
  },

  async getForSchedule(scheduleId: string): Promise<DoseEventRow[]> {
    const rows = await db
      .select()
      .from(doseEvents)
      .where(eq(doseEvents.scheduleId, scheduleId))
      .orderBy(desc(doseEvents.scheduledAt));
    return rows.map(normalizeRow);
  },

  async getForProfileToday(profileId: string): Promise<DoseEventRow[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const rows = await db
      .select()
      .from(doseEvents)
      .where(
        and(
          eq(doseEvents.profileId, profileId),
          gte(doseEvents.scheduledAt, todayStart.toISOString()),
          lte(doseEvents.scheduledAt, todayEnd.toISOString()),
        ),
      )
      .orderBy(desc(doseEvents.scheduledAt));

    return rows.map(normalizeRow);
  },

  async updateStatus(eventId: string, status: DoseStatus): Promise<void> {
    await db
      .update(doseEvents)
      .set({ status, recordedAt: nowISO() })
      .where(eq(doseEvents.id, eventId));
  },
} as const;

function normalizeRow(row: {
  id: string;
  scheduleId: string;
  profileId: string;
  scheduledAt: string;
  status: string;
  recordedAt: string;
}): DoseEventRow {
  return {
    id: row.id,
    scheduleId: row.scheduleId,
    profileId: row.profileId,
    scheduledAt: row.scheduledAt,
    status: row.status as DoseStatus,
    recordedAt: row.recordedAt,
  };
}
