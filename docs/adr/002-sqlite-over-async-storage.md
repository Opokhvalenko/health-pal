# ADR-002: SQLite + Drizzle ORM over AsyncStorage

## Status
Accepted

## Context
The app manages relational data: profiles → medications → schedules → dose events. We need joins, aggregations, foreign keys, and indexes. AsyncStorage and MMKV are key-value stores — they cannot express these relationships efficiently.

## Decision
Use expo-sqlite with Drizzle ORM as the primary data store. MMKV is reserved for tiny preferences only (theme, locale, onboarding flag, calm mode, active profile ID).

## Consequences
- **Positive:** Type-safe queries via Drizzle, foreign key integrity, indexes on all FKs
- **Positive:** Reactive UI possible via Drizzle's `useLiveQuery`
- **Positive:** Clear separation: SQLite = domain data, MMKV = UI preferences
- **Negative:** Slightly more complex setup than simple key-value storage
