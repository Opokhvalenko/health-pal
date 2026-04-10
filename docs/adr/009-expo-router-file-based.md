# ADR-009: Expo Router for File-Based Navigation

## Status
Accepted

## Context
React Navigation is the standard for React Native, but Expo Router builds on top of it with file-based routing (similar to Next.js). This reduces boilerplate and makes the navigation structure visible in the file system.

## Decision
Use Expo Router 6 with file-based routing:
- `app/(tabs)/` — tab navigator with 4 tabs
- `app/onboarding/` — onboarding stack (3 screens)
- `app/profiles.tsx`, `app/medication-form.tsx`, etc. — modal screens

Conditional routing in root layout: onboarding vs tabs based on MMKV flag.

## Consequences
- **Positive:** Navigation structure is immediately visible from file tree
- **Positive:** Deep linking and universal links work by default
- **Positive:** Type-safe route params via `useLocalSearchParams`
- **Negative:** File naming conventions must be followed strictly
