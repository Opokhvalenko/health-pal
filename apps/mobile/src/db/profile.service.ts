import { eq } from 'drizzle-orm';
import { db } from './client';
import { generateId, nowISO } from './helpers';
import { profiles } from './schema';

export type ProfileRole = 'self' | 'caregiver' | 'patient';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';

export interface ProfileRow {
  readonly id: string;
  readonly name: string;
  readonly role: ProfileRole;
  readonly avatarEmoji: string;
  readonly isActive: boolean;
  // Health basics (P1)
  readonly dateOfBirth: string | null;
  readonly weightKg: number | null;
  readonly heightCm: number | null;
  readonly bloodType: BloodType | null;
  readonly allergies: string[];
  readonly chronicConditions: string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateProfileInput {
  readonly name: string;
  readonly role: ProfileRole;
  readonly avatarEmoji?: string;
}

export interface UpdateProfileInput {
  readonly name?: string;
  readonly role?: ProfileRole;
  readonly avatarEmoji?: string;
  readonly dateOfBirth?: string | null;
  readonly weightKg?: number | null;
  readonly heightCm?: number | null;
  readonly bloodType?: BloodType | null;
  readonly allergies?: string[];
  readonly chronicConditions?: string[];
}

export const profileService = {
  async getAll(): Promise<ProfileRow[]> {
    const rows = await db.select().from(profiles).all();
    return rows.map(normalizeRow);
  },

  async getById(id: string): Promise<ProfileRow | undefined> {
    const rows = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    const row = rows[0];
    return row ? normalizeRow(row) : undefined;
  },

  async getActive(): Promise<ProfileRow | undefined> {
    const rows = await db.select().from(profiles).where(eq(profiles.isActive, true)).limit(1);
    const row = rows[0];
    return row ? normalizeRow(row) : undefined;
  },

  async create(input: CreateProfileInput): Promise<ProfileRow> {
    const now = nowISO();
    const id = generateId();
    const values = {
      id,
      name: input.name.trim(),
      role: input.role,
      avatarEmoji: input.avatarEmoji ?? '#4A9B8E',
      isActive: false,
      dateOfBirth: null,
      weightKg: null,
      heightCm: null,
      bloodType: null,
      allergies: null,
      chronicConditions: null,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(profiles).values(values);
    return normalizeRow(values);
  },

  async update(id: string, input: UpdateProfileInput): Promise<void> {
    const now = nowISO();
    const values: Record<string, unknown> = { updatedAt: now };
    if (input.name !== undefined) values.name = input.name.trim();
    if (input.role !== undefined) values.role = input.role;
    if (input.avatarEmoji !== undefined) values.avatarEmoji = input.avatarEmoji;
    if (input.dateOfBirth !== undefined) values.dateOfBirth = input.dateOfBirth;
    if (input.weightKg !== undefined) values.weightKg = input.weightKg;
    if (input.heightCm !== undefined) values.heightCm = input.heightCm;
    if (input.bloodType !== undefined) values.bloodType = input.bloodType;
    if (input.allergies !== undefined) values.allergies = JSON.stringify(input.allergies);
    if (input.chronicConditions !== undefined) {
      values.chronicConditions = JSON.stringify(input.chronicConditions);
    }
    await db.update(profiles).set(values).where(eq(profiles.id, id));
  },

  async remove(id: string): Promise<void> {
    await db.delete(profiles).where(eq(profiles.id, id));
  },

  async setActive(id: string): Promise<void> {
    const now = nowISO();
    // Deactivate all
    await db.update(profiles).set({ isActive: false, updatedAt: now });
    // Activate selected
    await db.update(profiles).set({ isActive: true, updatedAt: now }).where(eq(profiles.id, id));
  },
} as const;

function parseStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function normalizeRow(row: {
  id: string;
  name: string;
  role: string;
  avatarEmoji: string | null;
  isActive: boolean | null;
  dateOfBirth?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  bloodType?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  createdAt: string;
  updatedAt: string;
}): ProfileRow {
  return {
    id: row.id,
    name: row.name,
    role: row.role as ProfileRole,
    avatarEmoji: row.avatarEmoji ?? '#4A9B8E',
    isActive: row.isActive ?? false,
    dateOfBirth: row.dateOfBirth ?? null,
    weightKg: row.weightKg ?? null,
    heightCm: row.heightCm ?? null,
    bloodType: (row.bloodType as BloodType | null) ?? null,
    allergies: parseStringArray(row.allergies ?? null),
    chronicConditions: parseStringArray(row.chronicConditions ?? null),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Calculate age from date of birth ISO string (YYYY-MM-DD).
 * Returns null if dateOfBirth is missing or invalid.
 */
export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}
