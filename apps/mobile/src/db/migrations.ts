import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Run manual migrations. Drizzle Kit generates SQL files,
 * but for expo-sqlite we run them manually on app start.
 */
export function runMigrations(db: SQLiteDatabase): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('self', 'caregiver', 'patient')),
      avatar_emoji TEXT DEFAULT '🧑',
      is_active INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL REFERENCES profiles(id),
      name TEXT NOT NULL,
      dosage_value REAL NOT NULL,
      dosage_unit TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'routine' CHECK (category IN ('routine', 'as_needed')),
      notes TEXT,
      is_archived INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY NOT NULL,
      medication_id TEXT NOT NULL REFERENCES medications(id),
      type TEXT NOT NULL CHECK (type IN ('once_daily', 'twice_daily', 'three_times_daily', 'every_x_hours', 'custom_times', 'as_needed')),
      times TEXT NOT NULL DEFAULT '[]',
      interval_hours INTEGER,
      start_date TEXT NOT NULL,
      end_date TEXT,
      paused INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dose_events (
      id TEXT PRIMARY KEY NOT NULL,
      schedule_id TEXT NOT NULL REFERENCES schedules(id),
      profile_id TEXT NOT NULL REFERENCES profiles(id),
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('taken', 'skipped', 'missed', 'snoozed')),
      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS symptom_logs (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL REFERENCES profiles(id),
      name TEXT NOT NULL,
      severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 10),
      note TEXT,
      logged_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
      payload TEXT,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS medication_changes (
      id TEXT PRIMARY KEY NOT NULL,
      medication_id TEXT NOT NULL REFERENCES medications(id),
      changed_at TEXT NOT NULL,
      reason TEXT,
      changes TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS doctor_visits (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL REFERENCES profiles(id),
      doctor_name TEXT NOT NULL,
      specialty TEXT,
      visit_date TEXT NOT NULL,
      reason TEXT,
      recommendations TEXT,
      prescriptions TEXT,
      symptoms_snapshot TEXT,
      next_visit_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vitals (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL REFERENCES profiles(id),
      type TEXT NOT NULL CHECK (type IN ('blood_pressure', 'glucose', 'temperature', 'weight', 'heart_rate', 'oxygen')),
      value_numeric REAL NOT NULL,
      value_secondary REAL,
      unit TEXT NOT NULL,
      notes TEXT,
      recorded_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_medications_profile ON medications(profile_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_medication ON schedules(medication_id);
    CREATE INDEX IF NOT EXISTS idx_dose_events_schedule ON dose_events(schedule_id);
    CREATE INDEX IF NOT EXISTS idx_dose_events_profile ON dose_events(profile_id);
    CREATE INDEX IF NOT EXISTS idx_symptom_logs_profile ON symptom_logs(profile_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
    CREATE INDEX IF NOT EXISTS idx_medication_changes_medication ON medication_changes(medication_id);
    CREATE INDEX IF NOT EXISTS idx_vitals_profile ON vitals(profile_id);
    CREATE INDEX IF NOT EXISTS idx_vitals_profile_type ON vitals(profile_id, type);
    CREATE INDEX IF NOT EXISTS idx_doctor_visits_profile ON doctor_visits(profile_id);
    CREATE INDEX IF NOT EXISTS idx_doctor_visits_date ON doctor_visits(visit_date);
  `);

  // P1: Profile health basics — additive columns (idempotent via try/catch)
  addColumnIfMissing(db, 'profiles', 'date_of_birth', 'TEXT');
  addColumnIfMissing(db, 'profiles', 'weight_kg', 'REAL');
  addColumnIfMissing(db, 'profiles', 'height_cm', 'REAL');
  addColumnIfMissing(db, 'profiles', 'blood_type', 'TEXT');
  addColumnIfMissing(db, 'profiles', 'allergies', 'TEXT');
  addColumnIfMissing(db, 'profiles', 'chronic_conditions', 'TEXT');
}

/**
 * Add a column if it doesn't already exist. SQLite has no
 * IF NOT EXISTS for ALTER TABLE ADD COLUMN, so we check first.
 */
function addColumnIfMissing(db: SQLiteDatabase, table: string, column: string, type: string): void {
  const result = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table});`);
  const exists = result.some((col) => col.name === column);
  if (!exists) {
    db.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
  }
}
