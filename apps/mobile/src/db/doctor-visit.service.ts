import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from './client';
import { generateId, nowISO } from './helpers';
import { doctorVisits } from './schema';

/** Snapshot of a symptom captured at visit prep time. */
export interface SymptomSnapshot {
  readonly name: string;
  readonly severity: number;
  readonly loggedAt: string;
}

export interface DoctorVisitRow {
  readonly id: string;
  readonly profileId: string;
  readonly doctorName: string;
  readonly specialty: string | null;
  readonly visitDate: string;
  readonly reason: string | null;
  readonly recommendations: string | null;
  readonly prescriptions: string | null;
  readonly symptomsSnapshot: SymptomSnapshot[];
  readonly nextVisitDate: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateDoctorVisitInput {
  readonly profileId: string;
  readonly doctorName: string;
  readonly specialty?: string;
  readonly visitDate: string;
  readonly reason?: string;
  readonly recommendations?: string;
  readonly prescriptions?: string;
  readonly symptomsSnapshot?: SymptomSnapshot[];
  readonly nextVisitDate?: string;
  readonly notes?: string;
}

export interface UpdateDoctorVisitInput {
  readonly doctorName?: string;
  readonly specialty?: string | null;
  readonly visitDate?: string;
  readonly reason?: string | null;
  readonly recommendations?: string | null;
  readonly prescriptions?: string | null;
  readonly symptomsSnapshot?: SymptomSnapshot[];
  readonly nextVisitDate?: string | null;
  readonly notes?: string | null;
}

export const doctorVisitService = {
  async create(input: CreateDoctorVisitInput): Promise<DoctorVisitRow> {
    const now = nowISO();
    const id = generateId();
    const values = {
      id,
      profileId: input.profileId,
      doctorName: input.doctorName.trim(),
      specialty: input.specialty?.trim() ?? null,
      visitDate: input.visitDate,
      reason: input.reason?.trim() ?? null,
      recommendations: input.recommendations?.trim() ?? null,
      prescriptions: input.prescriptions?.trim() ?? null,
      symptomsSnapshot: input.symptomsSnapshot ? JSON.stringify(input.symptomsSnapshot) : null,
      nextVisitDate: input.nextVisitDate ?? null,
      notes: input.notes?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(doctorVisits).values(values);
    return normalizeRow(values);
  },

  async update(id: string, input: UpdateDoctorVisitInput): Promise<void> {
    const now = nowISO();
    const values: Record<string, unknown> = { updatedAt: now };
    if (input.doctorName !== undefined) values.doctorName = input.doctorName.trim();
    if (input.specialty !== undefined)
      values.specialty = input.specialty === null ? null : input.specialty.trim();
    if (input.visitDate !== undefined) values.visitDate = input.visitDate;
    if (input.reason !== undefined)
      values.reason = input.reason === null ? null : input.reason.trim();
    if (input.recommendations !== undefined)
      values.recommendations = input.recommendations === null ? null : input.recommendations.trim();
    if (input.prescriptions !== undefined)
      values.prescriptions = input.prescriptions === null ? null : input.prescriptions.trim();
    if (input.symptomsSnapshot !== undefined)
      values.symptomsSnapshot = JSON.stringify(input.symptomsSnapshot);
    if (input.nextVisitDate !== undefined) values.nextVisitDate = input.nextVisitDate;
    if (input.notes !== undefined) values.notes = input.notes === null ? null : input.notes.trim();
    await db.update(doctorVisits).set(values).where(eq(doctorVisits.id, id));
  },

  async getForProfile(profileId: string): Promise<DoctorVisitRow[]> {
    const rows = await db
      .select()
      .from(doctorVisits)
      .where(eq(doctorVisits.profileId, profileId))
      .orderBy(desc(doctorVisits.visitDate));
    return rows.map(normalizeRow);
  },

  async getById(id: string): Promise<DoctorVisitRow | undefined> {
    const rows = await db.select().from(doctorVisits).where(eq(doctorVisits.id, id)).limit(1);
    const row = rows[0];
    return row ? normalizeRow(row) : undefined;
  },

  async getUpcoming(profileId: string): Promise<DoctorVisitRow | null> {
    const today = new Date().toISOString().split('T')[0] ?? '';
    const rows = await db
      .select()
      .from(doctorVisits)
      .where(and(eq(doctorVisits.profileId, profileId), gte(doctorVisits.nextVisitDate, today)))
      .orderBy(doctorVisits.nextVisitDate)
      .limit(1);
    const row = rows[0];
    return row ? normalizeRow(row) : null;
  },

  async remove(id: string): Promise<void> {
    await db.delete(doctorVisits).where(eq(doctorVisits.id, id));
  },
} as const;

function normalizeRow(row: {
  id: string;
  profileId: string;
  doctorName: string;
  specialty: string | null;
  visitDate: string;
  reason: string | null;
  recommendations: string | null;
  prescriptions: string | null;
  symptomsSnapshot: string | null;
  nextVisitDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}): DoctorVisitRow {
  let symptoms: SymptomSnapshot[] = [];
  if (row.symptomsSnapshot) {
    try {
      const parsed = JSON.parse(row.symptomsSnapshot);
      if (Array.isArray(parsed)) {
        symptoms = parsed as SymptomSnapshot[];
      }
    } catch {
      symptoms = [];
    }
  }
  return {
    id: row.id,
    profileId: row.profileId,
    doctorName: row.doctorName,
    specialty: row.specialty,
    visitDate: row.visitDate,
    reason: row.reason,
    recommendations: row.recommendations,
    prescriptions: row.prescriptions,
    symptomsSnapshot: symptoms,
    nextVisitDate: row.nextVisitDate,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
