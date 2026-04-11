import { desc, eq } from 'drizzle-orm';
import { db } from './client';
import { generateId, nowISO } from './helpers';
import { medicationChanges } from './schema';

/** A single field change: from old value to new value. */
export interface FieldChange<T = unknown> {
  readonly from: T;
  readonly to: T;
}

/** Map of field name → change. Stored as JSON in the DB. */
export type ChangesMap = Readonly<Record<string, FieldChange>>;

export interface MedicationChangeRow {
  readonly id: string;
  readonly medicationId: string;
  readonly changedAt: string;
  readonly reason: string | null;
  readonly changes: ChangesMap;
}

export interface LogChangeInput {
  readonly medicationId: string;
  readonly changes: ChangesMap;
  readonly reason?: string;
}

export const medicationChangeService = {
  async log(input: LogChangeInput): Promise<MedicationChangeRow | null> {
    // Don't log empty change sets
    if (Object.keys(input.changes).length === 0) return null;

    const id = generateId();
    const changedAt = nowISO();
    const values = {
      id,
      medicationId: input.medicationId,
      changedAt,
      reason: input.reason ?? null,
      changes: JSON.stringify(input.changes),
    };
    await db.insert(medicationChanges).values(values);
    return {
      id,
      medicationId: input.medicationId,
      changedAt,
      reason: input.reason ?? null,
      changes: input.changes,
    };
  },

  async getForMedication(medicationId: string): Promise<MedicationChangeRow[]> {
    const rows = await db
      .select()
      .from(medicationChanges)
      .where(eq(medicationChanges.medicationId, medicationId))
      .orderBy(desc(medicationChanges.changedAt));
    return rows.map(normalizeRow);
  },
} as const;

function normalizeRow(row: {
  id: string;
  medicationId: string;
  changedAt: string;
  reason: string | null;
  changes: string;
}): MedicationChangeRow {
  let parsed: ChangesMap = {};
  try {
    const json = JSON.parse(row.changes);
    if (json && typeof json === 'object') {
      parsed = json as ChangesMap;
    }
  } catch {
    parsed = {};
  }
  return {
    id: row.id,
    medicationId: row.medicationId,
    changedAt: row.changedAt,
    reason: row.reason,
    changes: parsed,
  };
}

/**
 * Compute a diff between two snapshots, returning only fields that differ.
 * Used by medicationService.update() to generate change history entries.
 */
export function computeChangesDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): ChangesMap {
  const result: Record<string, FieldChange> = {};
  for (const key of Object.keys(after)) {
    const fromValue = before[key];
    const toValue = after[key];
    if (!isEqual(fromValue, toValue)) {
      result[key] = { from: fromValue, to: toValue };
    }
  }
  return result;
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => isEqual(v, b[i]));
  }
  return false;
}
