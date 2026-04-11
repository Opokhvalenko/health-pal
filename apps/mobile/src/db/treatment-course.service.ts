import { desc, eq } from 'drizzle-orm';
import { db } from './client';
import { generateId, nowISO } from './helpers';
import { treatmentCourses } from './schema';

export interface TreatmentCourseRow {
  readonly id: string;
  readonly profileId: string;
  readonly title: string;
  readonly reason: string | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateTreatmentCourseInput {
  readonly profileId: string;
  readonly title: string;
  readonly reason?: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly notes?: string;
}

export interface UpdateTreatmentCourseInput {
  readonly title?: string;
  readonly reason?: string | null;
  readonly startDate?: string;
  readonly endDate?: string | null;
  readonly notes?: string | null;
}

export const treatmentCourseService = {
  async create(input: CreateTreatmentCourseInput): Promise<TreatmentCourseRow> {
    const now = nowISO();
    const id = generateId();
    const values = {
      id,
      profileId: input.profileId,
      title: input.title.trim(),
      reason: input.reason?.trim() ?? null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      notes: input.notes?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(treatmentCourses).values(values);
    return values;
  },

  async update(id: string, input: UpdateTreatmentCourseInput): Promise<void> {
    const now = nowISO();
    const values: Record<string, unknown> = { updatedAt: now };
    if (input.title !== undefined) values.title = input.title.trim();
    if (input.reason !== undefined)
      values.reason = input.reason === null ? null : input.reason.trim();
    if (input.startDate !== undefined) values.startDate = input.startDate;
    if (input.endDate !== undefined) values.endDate = input.endDate;
    if (input.notes !== undefined) values.notes = input.notes === null ? null : input.notes.trim();
    await db.update(treatmentCourses).set(values).where(eq(treatmentCourses.id, id));
  },

  async getForProfile(profileId: string): Promise<TreatmentCourseRow[]> {
    const rows = await db
      .select()
      .from(treatmentCourses)
      .where(eq(treatmentCourses.profileId, profileId))
      .orderBy(desc(treatmentCourses.startDate));
    return rows.map(normalizeRow);
  },

  async getActive(profileId: string): Promise<TreatmentCourseRow[]> {
    const rows = await db
      .select()
      .from(treatmentCourses)
      .where(eq(treatmentCourses.profileId, profileId))
      .orderBy(desc(treatmentCourses.startDate));
    return rows.filter((r) => r.endDate === null).map(normalizeRow);
  },

  async getById(id: string): Promise<TreatmentCourseRow | undefined> {
    const rows = await db
      .select()
      .from(treatmentCourses)
      .where(eq(treatmentCourses.id, id))
      .limit(1);
    const row = rows[0];
    return row ? normalizeRow(row) : undefined;
  },

  async remove(id: string): Promise<void> {
    await db.delete(treatmentCourses).where(eq(treatmentCourses.id, id));
  },

  async complete(id: string, endDate: string): Promise<void> {
    const now = nowISO();
    await db
      .update(treatmentCourses)
      .set({ endDate, updatedAt: now })
      .where(eq(treatmentCourses.id, id));
  },
} as const;

function normalizeRow(row: {
  id: string;
  profileId: string;
  title: string;
  reason: string | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}): TreatmentCourseRow {
  return {
    id: row.id,
    profileId: row.profileId,
    title: row.title,
    reason: row.reason,
    startDate: row.startDate,
    endDate: row.endDate,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
