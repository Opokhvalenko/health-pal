import { eq } from 'drizzle-orm';
import { db } from './client';
import { generateId, nowISO } from './helpers';
import { profiles } from './schema';

export type ProfileRole = 'self' | 'caregiver' | 'patient';

export interface ProfileRow {
  readonly id: string;
  readonly name: string;
  readonly role: ProfileRole;
  readonly avatarEmoji: string;
  readonly isActive: boolean;
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
      avatarEmoji: input.avatarEmoji ?? '🧑',
      isActive: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(profiles).values(values);
    return normalizeRow({ ...values, isActive: false });
  },

  async update(id: string, input: UpdateProfileInput): Promise<void> {
    const now = nowISO();
    const values: Record<string, unknown> = { updatedAt: now };
    if (input.name !== undefined) values.name = input.name.trim();
    if (input.role !== undefined) values.role = input.role;
    if (input.avatarEmoji !== undefined) values.avatarEmoji = input.avatarEmoji;
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

function normalizeRow(row: {
  id: string;
  name: string;
  role: string;
  avatarEmoji: string | null;
  isActive: boolean | null;
  createdAt: string;
  updatedAt: string;
}): ProfileRow {
  return {
    id: row.id,
    name: row.name,
    role: row.role as ProfileRole,
    avatarEmoji: row.avatarEmoji ?? '🧑',
    isActive: row.isActive ?? false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
