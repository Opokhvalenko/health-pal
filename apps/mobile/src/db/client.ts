import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

export const DB_NAME = 'healthpal.db';

let _expoDb: SQLiteDatabase | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Returns the shared SQLite database handle.
 * Lazily opened on first call — avoids NullPointerException on Android
 * when native modules aren't ready at import time.
 */
export function getExpoDb(): SQLiteDatabase {
  if (!_expoDb) {
    _expoDb = openDatabaseSync(DB_NAME);
  }
  return _expoDb;
}

/**
 * Shared Drizzle ORM instance. Uses the same native connection as getExpoDb().
 */
export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) {
    _db = drizzle(getExpoDb(), { schema });
  }
  return _db;
}

/** @deprecated Use getDb() — kept for backward compatibility during migration */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type Database = ReturnType<typeof drizzle<typeof schema>>;
