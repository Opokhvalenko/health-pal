import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// --- Profiles ---

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role', { enum: ['self', 'caregiver', 'patient'] }).notNull(),
  avatarEmoji: text('avatar_emoji').default('🧑'),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// --- Medications ---

export const medications = sqliteTable('medications', {
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profiles.id),
  name: text('name').notNull(),
  dosageValue: real('dosage_value').notNull(),
  dosageUnit: text('dosage_unit').notNull(), // mg, ml, tablet, capsule, etc.
  category: text('category', { enum: ['routine', 'as_needed'] })
    .notNull()
    .default('routine'),
  notes: text('notes'),
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// --- Schedules ---

export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey(),
  medicationId: text('medication_id')
    .notNull()
    .references(() => medications.id),
  type: text('type', {
    enum: [
      'once_daily',
      'twice_daily',
      'three_times_daily',
      'every_x_hours',
      'custom_times',
      'as_needed',
    ],
  }).notNull(),
  /** JSON array of "HH:mm" strings */
  times: text('times').notNull().default('[]'),
  intervalHours: integer('interval_hours'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  paused: integer('paused', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// --- Dose Events ---

export const doseEvents = sqliteTable('dose_events', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id')
    .notNull()
    .references(() => schedules.id),
  profileId: text('profile_id')
    .notNull()
    .references(() => profiles.id),
  scheduledAt: text('scheduled_at').notNull(),
  status: text('status', { enum: ['taken', 'skipped', 'missed', 'snoozed'] }).notNull(),
  recordedAt: text('recorded_at').notNull(),
});

// --- Symptom Logs ---

export const symptomLogs = sqliteTable('symptom_logs', {
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profiles.id),
  name: text('name').notNull(),
  severity: integer('severity').notNull(), // 1-10
  note: text('note'),
  loggedAt: text('logged_at').notNull(),
});

// --- Sync Queue (for R2) ---

export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  operation: text('operation', { enum: ['create', 'update', 'delete'] }).notNull(),
  payload: text('payload'), // JSON
  createdAt: text('created_at').notNull(),
  synced: integer('synced', { mode: 'boolean' }).default(false),
});
