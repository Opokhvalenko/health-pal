import { and, desc, eq } from 'drizzle-orm';
import { db } from './client';
import { generateId, nowISO } from './helpers';
import { vitals } from './schema';

export type VitalType =
  | 'blood_pressure'
  | 'glucose'
  | 'temperature'
  | 'weight'
  | 'heart_rate'
  | 'oxygen';

/** Default unit for each vital type. */
export const VITAL_DEFAULT_UNIT: Record<VitalType, string> = {
  blood_pressure: 'mmHg',
  glucose: 'mg/dL',
  temperature: '°C',
  weight: 'kg',
  heart_rate: 'bpm',
  oxygen: '%',
};

export interface VitalRow {
  readonly id: string;
  readonly profileId: string;
  readonly type: VitalType;
  readonly valueNumeric: number;
  readonly valueSecondary: number | null;
  readonly unit: string;
  readonly notes: string | null;
  readonly recordedAt: string;
}

export interface CreateVitalInput {
  readonly profileId: string;
  readonly type: VitalType;
  readonly valueNumeric: number;
  readonly valueSecondary?: number;
  readonly unit?: string;
  readonly notes?: string;
  readonly recordedAt?: string;
}

export const vitalService = {
  async create(input: CreateVitalInput): Promise<VitalRow> {
    const id = generateId();
    const recordedAt = input.recordedAt ?? nowISO();
    const unit = input.unit ?? VITAL_DEFAULT_UNIT[input.type];
    const values = {
      id,
      profileId: input.profileId,
      type: input.type,
      valueNumeric: input.valueNumeric,
      valueSecondary: input.valueSecondary ?? null,
      unit,
      notes: input.notes ?? null,
      recordedAt,
    };
    await db.insert(vitals).values(values);
    return values;
  },

  async getForProfile(profileId: string, limit = 200): Promise<VitalRow[]> {
    const rows = await db
      .select()
      .from(vitals)
      .where(eq(vitals.profileId, profileId))
      .orderBy(desc(vitals.recordedAt))
      .limit(limit);
    return rows.map(normalizeRow);
  },

  async getForProfileByType(profileId: string, type: VitalType, limit = 100): Promise<VitalRow[]> {
    const rows = await db
      .select()
      .from(vitals)
      .where(and(eq(vitals.profileId, profileId), eq(vitals.type, type)))
      .orderBy(desc(vitals.recordedAt))
      .limit(limit);
    return rows.map(normalizeRow);
  },

  async getLatestByType(profileId: string, type: VitalType): Promise<VitalRow | null> {
    const rows = await this.getForProfileByType(profileId, type, 1);
    return rows[0] ?? null;
  },

  async remove(id: string): Promise<void> {
    await db.delete(vitals).where(eq(vitals.id, id));
  },
} as const;

function normalizeRow(row: {
  id: string;
  profileId: string;
  type: string;
  valueNumeric: number;
  valueSecondary: number | null;
  unit: string;
  notes: string | null;
  recordedAt: string;
}): VitalRow {
  return {
    id: row.id,
    profileId: row.profileId,
    type: row.type as VitalType,
    valueNumeric: row.valueNumeric,
    valueSecondary: row.valueSecondary,
    unit: row.unit,
    notes: row.notes,
    recordedAt: row.recordedAt,
  };
}

/**
 * Format a vital reading as a single string.
 * BP: "120/80 mmHg", others: "70 kg".
 */
export function formatVitalValue(vital: VitalRow): string {
  if (vital.type === 'blood_pressure' && vital.valueSecondary !== null) {
    return `${vital.valueNumeric}/${vital.valueSecondary} ${vital.unit}`;
  }
  return `${vital.valueNumeric} ${vital.unit}`;
}
