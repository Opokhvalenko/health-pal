import { and, eq } from 'drizzle-orm';
import { db } from './client';
import { generateId, nowISO } from './helpers';
import { medications, schedules } from './schema';

export type MedicationCategory = 'routine' | 'as_needed';
export type ScheduleType =
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'every_x_hours'
  | 'custom_times'
  | 'as_needed';

export interface MedicationRow {
  readonly id: string;
  readonly profileId: string;
  readonly name: string;
  readonly dosageValue: number;
  readonly dosageUnit: string;
  readonly category: MedicationCategory;
  readonly notes: string | null;
  readonly isArchived: boolean;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ScheduleRow {
  readonly id: string;
  readonly medicationId: string;
  readonly type: ScheduleType;
  readonly times: string[];
  readonly intervalHours: number | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly paused: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MedicationWithSchedule {
  readonly medication: MedicationRow;
  readonly schedule: ScheduleRow | null;
}

export interface CreateMedicationInput {
  readonly profileId: string;
  readonly name: string;
  readonly dosageValue: number;
  readonly dosageUnit: string;
  readonly category: MedicationCategory;
  readonly notes?: string;
  readonly scheduleType: ScheduleType;
  readonly times: string[];
  readonly intervalHours?: number;
  readonly startDate: string;
  readonly endDate?: string;
}

export interface UpdateMedicationInput {
  readonly name?: string;
  readonly dosageValue?: number;
  readonly dosageUnit?: string;
  readonly category?: MedicationCategory;
  readonly notes?: string | null;
  readonly scheduleType?: ScheduleType;
  readonly times?: string[];
  readonly intervalHours?: number | null;
  readonly endDate?: string | null;
}

export const medicationService = {
  async getAllForProfile(profileId: string): Promise<MedicationWithSchedule[]> {
    const meds = await db
      .select()
      .from(medications)
      .where(and(eq(medications.profileId, profileId), eq(medications.isArchived, false)))
      .all();

    const result: MedicationWithSchedule[] = [];
    for (const med of meds) {
      const scheduleRows = await db
        .select()
        .from(schedules)
        .where(eq(schedules.medicationId, med.id))
        .limit(1);
      result.push({
        medication: normalizeMed(med),
        schedule: scheduleRows[0] ? normalizeSchedule(scheduleRows[0]) : null,
      });
    }
    return result;
  },

  async create(input: CreateMedicationInput): Promise<MedicationWithSchedule> {
    const now = nowISO();
    const medId = generateId();
    const schedId = generateId();

    await db.insert(medications).values({
      id: medId,
      profileId: input.profileId,
      name: input.name.trim(),
      dosageValue: input.dosageValue,
      dosageUnit: input.dosageUnit,
      category: input.category,
      notes: input.notes ?? null,
      isArchived: false,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(schedules).values({
      id: schedId,
      medicationId: medId,
      type: input.scheduleType,
      times: JSON.stringify(input.times),
      intervalHours: input.intervalHours ?? null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      paused: false,
      createdAt: now,
      updatedAt: now,
    });

    return {
      medication: {
        id: medId,
        profileId: input.profileId,
        name: input.name.trim(),
        dosageValue: input.dosageValue,
        dosageUnit: input.dosageUnit,
        category: input.category,
        notes: input.notes ?? null,
        isArchived: false,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
      schedule: {
        id: schedId,
        medicationId: medId,
        type: input.scheduleType,
        times: input.times,
        intervalHours: input.intervalHours ?? null,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        paused: false,
        createdAt: now,
        updatedAt: now,
      },
    };
  },

  async update(medId: string, input: UpdateMedicationInput): Promise<void> {
    const now = nowISO();

    // Update medication fields
    const medValues: Record<string, unknown> = { updatedAt: now };
    if (input.name !== undefined) medValues.name = input.name.trim();
    if (input.dosageValue !== undefined) medValues.dosageValue = input.dosageValue;
    if (input.dosageUnit !== undefined) medValues.dosageUnit = input.dosageUnit;
    if (input.category !== undefined) medValues.category = input.category;
    if (input.notes !== undefined) medValues.notes = input.notes;
    await db.update(medications).set(medValues).where(eq(medications.id, medId));

    // Update schedule if any schedule fields changed
    const hasScheduleChanges =
      input.scheduleType !== undefined ||
      input.times !== undefined ||
      input.intervalHours !== undefined ||
      input.endDate !== undefined;

    if (hasScheduleChanges) {
      const schedValues: Record<string, unknown> = { updatedAt: now };
      if (input.scheduleType !== undefined) schedValues.type = input.scheduleType;
      if (input.times !== undefined) schedValues.times = JSON.stringify(input.times);
      if (input.intervalHours !== undefined) schedValues.intervalHours = input.intervalHours;
      if (input.endDate !== undefined) schedValues.endDate = input.endDate;
      await db.update(schedules).set(schedValues).where(eq(schedules.medicationId, medId));
    }
  },

  async archive(medId: string): Promise<void> {
    const now = nowISO();
    await db
      .update(medications)
      .set({ isArchived: true, updatedAt: now })
      .where(eq(medications.id, medId));
  },

  async remove(medId: string): Promise<void> {
    await db.delete(schedules).where(eq(schedules.medicationId, medId));
    await db.delete(medications).where(eq(medications.id, medId));
  },
} as const;

function normalizeMed(row: {
  id: string;
  profileId: string;
  name: string;
  dosageValue: number;
  dosageUnit: string;
  category: string | null;
  notes: string | null;
  isArchived: boolean | null;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
}): MedicationRow {
  return {
    id: row.id,
    profileId: row.profileId,
    name: row.name,
    dosageValue: row.dosageValue,
    dosageUnit: row.dosageUnit,
    category: (row.category as MedicationCategory) ?? 'routine',
    notes: row.notes,
    isArchived: row.isArchived ?? false,
    sortOrder: row.sortOrder ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeSchedule(row: {
  id: string;
  medicationId: string;
  type: string;
  times: string;
  intervalHours: number | null;
  startDate: string;
  endDate: string | null;
  paused: boolean | null;
  createdAt: string;
  updatedAt: string;
}): ScheduleRow {
  let parsedTimes: string[] = [];
  try {
    parsedTimes = JSON.parse(row.times) as string[];
  } catch {
    parsedTimes = [];
  }
  return {
    id: row.id,
    medicationId: row.medicationId,
    type: row.type as ScheduleType,
    times: parsedTimes,
    intervalHours: row.intervalHours,
    startDate: row.startDate,
    endDate: row.endDate,
    paused: row.paused ?? false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
