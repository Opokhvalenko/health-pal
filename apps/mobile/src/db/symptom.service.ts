import { desc, eq } from 'drizzle-orm';
import { db } from './client';
import { generateId, nowISO } from './helpers';
import { symptomLogs } from './schema';

export interface SymptomRow {
  readonly id: string;
  readonly profileId: string;
  readonly name: string;
  readonly severity: number;
  readonly note: string | null;
  readonly loggedAt: string;
}

export interface CreateSymptomInput {
  readonly profileId: string;
  readonly name: string;
  readonly severity: number;
  readonly note?: string;
}

export const symptomService = {
  async create(input: CreateSymptomInput): Promise<SymptomRow> {
    const id = generateId();
    const loggedAt = nowISO();
    const values = {
      id,
      profileId: input.profileId,
      name: input.name.trim(),
      severity: input.severity,
      note: input.note?.trim() ?? null,
      loggedAt,
    };
    await db.insert(symptomLogs).values(values);
    return values;
  },

  async getForProfile(profileId: string, limit = 50): Promise<SymptomRow[]> {
    const rows = await db
      .select()
      .from(symptomLogs)
      .where(eq(symptomLogs.profileId, profileId))
      .orderBy(desc(symptomLogs.loggedAt))
      .limit(limit);
    return rows.map(normalizeRow);
  },

  async remove(id: string): Promise<void> {
    await db.delete(symptomLogs).where(eq(symptomLogs.id, id));
  },
} as const;

function normalizeRow(row: {
  id: string;
  profileId: string;
  name: string;
  severity: number;
  note: string | null;
  loggedAt: string;
}): SymptomRow {
  return {
    id: row.id,
    profileId: row.profileId,
    name: row.name,
    severity: row.severity,
    note: row.note,
    loggedAt: row.loggedAt,
  };
}
