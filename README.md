# HealthPal

**Calm. Local. Yours.**

A local-first medication companion built with React Native and Expo. HealthPal helps patients and caregivers manage medications, track adherence, and log symptoms — all without requiring an account or internet connection.

## Why HealthPal?

Most medication apps make three mistakes:

1. They create anxiety with red overdue counters and alarming language
2. They force account creation before the user can do anything useful
3. They assume the user is the patient, while in reality it is often a caregiver managing medications for someone else

HealthPal intentionally goes the other way:

| Standard approach | HealthPal |
|---|---|
| Anxiety UX ("8 OVERDUE!") | Calm UX, neutral copy, focus on next action |
| Forced registration | No-account first run |
| Patient-only mental model | Caregiver-first, with Big Button view for patient |
| Cloud-first | Local-first, device DB is source of truth |

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Expo SDK 54 + React Native 0.81 + React 19.1 |
| Routing | Expo Router 6 (file-based) |
| Language | TypeScript strict, `noUncheckedIndexedAccess` |
| Local DB | expo-sqlite + Drizzle ORM |
| Fast KV | react-native-mmkv (preferences only) |
| State | Zustand 5 (session state) |
| Styling | Unistyles 3 (light / dark / calm themes) |
| i18n | i18next (English + Ukrainian) |
| Lint | Biome 2 |
| CI | GitHub Actions (lint, tests, typecheck) |
| Hooks | Husky (pre-commit: lint-staged, pre-push: tests) |

## Architecture

```
apps/mobile/              Expo app (Expo Router)
packages/schedule-engine/  Pure TS — computes next dose occurrences
packages/adherence-core/   Pure TS — computes adherence %, streaks, today state
```

### Key Principles

1. **SQLite is the source of truth** — domain data lives in SQLite, not in state managers
2. **MMKV is for tiny preferences** — theme, locale, onboarding flag, calm mode
3. **Domain logic is extracted** — two pure TypeScript packages with zero RN dependencies and full test coverage
4. **Calm UX** — no aggressive counters, neutral copy, optional Calm Mode hides stress-inducing elements

### Data Flow

```
UI (Expo Router + Unistyles)
  │ useTodayDoses hook
  ▼
Domain Layer
  ├─ schedule-engine  (pure TS, 11 tests)
  ├─ adherence-core   (pure TS, 15 tests)
  └─ services (profile, medication, dose-event, symptom)
  │ Drizzle ORM queries
  ▼
expo-sqlite (source of truth)

MMKV (parallel): theme, locale, active profile, calm mode, onboarding flag
```

## Features

### Profiles & Caregiver Mode
- Multiple profiles: self, caregiver, patient
- Profile switcher in header
- **Big Button view** — simplified patient mode with one large "Take" button
- **Caregiver dashboard** — today's plan, next medication, recent doses

### Medications
- CRUD with categories (routine / as needed)
- Schedule types: once daily, twice daily, three times daily, every X hours, custom times, as needed
- Time chip picker with native DateTimePicker
- 8 dosage units (mg, ml, tablet, capsule, drop, puff, patch, injection)

### Dose Tracking
- Today screen with upcoming and completed doses
- Take / Skip / Snooze actions per dose
- Progress counter ("3 of 5 done")
- Schedule engine computes today's occurrences automatically

### Adherence Dashboard
- Period tabs: 7 days / 30 days / all time
- Big percentage display
- Stats grid: scheduled, taken, skipped, missed, snoozed
- Current streak and longest streak
- Calm mode hides skipped/missed counters

### Calm Mode
- Hides anxiety-inducing overdue counters
- Removes aggressive warning styling
- Switches to calm theme (muted, warm colors)
- Focus on next action, not guilt

### Symptoms
- Log symptom with severity 1-10 visual picker
- Notes and timestamp
- Recent symptoms list with color-coded severity badges

### Doctor Report
- Generates local A4 PDF via expo-print
- Includes: active medications, adherence summary, dose history, symptoms
- Shareable via expo-sharing — no internet required

### Accessibility
- Screen reader labels on all interactive elements
- `accessibilityRole`, `accessibilityLabel`, `accessibilityHint`
- Decorative elements hidden from screen readers
- Large tap targets
- Loading states with progress indicators

### i18n
- English and Ukrainian
- Language toggle in settings
- All UI text externalized — no hardcoded strings

## Database Schema

6 tables: `profiles`, `medications`, `schedules`, `dose_events`, `symptom_logs`, `sync_queue`

Indexes on all foreign keys. Migrations run on app start.

## Getting Started

### Prerequisites

- Node.js 20+
- Expo CLI (`npx expo`)
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation

```bash
git clone https://github.com/Opokhvalenko/health-pal.git
cd health-pal
npm install
```

### Development

```bash
# Start Expo dev server
npm run mobile

# Run domain package tests
npm run test:engine
npm run test:adherence

# Lint
npm run lint

# Format
npm run format
```

### Project Structure

```
health-pal/
├── apps/
│   └── mobile/
│       ├── app/              # Expo Router screens
│       │   ├── (tabs)/       # Tab screens (Today, Meds, Adherence, Settings)
│       │   ├── onboarding/   # Onboarding flow (3 screens)
│       │   ├── profiles.tsx   # Profile management
│       │   ├── medication-form.tsx
│       │   ├── symptoms.tsx
│       │   └── report.tsx
│       └── src/
│           ├── components/    # Reusable components
│           ├── db/            # SQLite schema, services, migrations
│           ├── hooks/         # Custom hooks (useTodayDoses)
│           ├── i18n/          # Translations (en, uk)
│           ├── services/      # Report generation
│           ├── stores/        # Zustand + MMKV
│           └── theme/         # Unistyles themes + tokens
├── packages/
│   ├── schedule-engine/       # Pure TS, 11 tests
│   └── adherence-core/        # Pure TS, 15 tests
├── .github/workflows/ci.yml   # GitHub Actions CI
└── biome.json                 # Biome config
```

## Testing

- **26 tests** across two domain packages
- `schedule-engine`: once daily, twice daily, every X hours, custom times, paused, end dates, as needed
- `adherence-core`: adherence %, streaks, today state, period filters, edge cases

```bash
npm run test:packages
```

## License

MIT
