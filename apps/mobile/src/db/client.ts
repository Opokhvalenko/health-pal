import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

export const DB_NAME = 'healthpal.db';

let _expoDb: SQLiteDatabase | null = null;
let _drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

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

function getDrizzle(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_drizzleDb) {
    _drizzleDb = drizzle(getExpoDb(), { schema });
  }
  return _drizzleDb;
}

/**
 * Shared Drizzle ORM instance backed by a lazy singleton SQLite connection.
 * Safe to import at module top-level — actual DB open is deferred to first use.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDrizzle(), prop, receiver);
  },
});

export type Database = ReturnType<typeof drizzle<typeof schema>>;
