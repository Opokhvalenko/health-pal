# ADR-003: Extract Domain Logic into Pure TypeScript Packages

## Status
Accepted

## Context
Schedule computation and adherence calculation are core business logic. Testing them inside a React Native app requires an emulator or device. Coupling domain logic to UI makes it harder to verify correctness.

## Decision
Extract two pure TypeScript packages with zero React Native dependencies:
- `@health-pal/schedule-engine` — computes next dose occurrences
- `@health-pal/adherence-core` — computes adherence percentage, streaks, today state

Both packages are tested with Vitest and run in plain Node.js.

## Consequences
- **Positive:** 26 tests run in <200ms without any emulator
- **Positive:** Packages are independently publishable and reusable
- **Positive:** Clear boundary between domain logic and UI
- **Positive:** Easy to mock in UI tests
- **Negative:** Monorepo setup adds slight complexity (npm workspaces)
