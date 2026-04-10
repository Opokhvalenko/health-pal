# ADR-007: npm Workspaces Monorepo

## Status
Accepted

## Context
The project has a mobile app and two domain packages. Managing them as separate repositories adds overhead for versioning and testing. A monorepo allows shared tooling and atomic commits.

## Decision
Use npm workspaces with the following structure:
```
apps/mobile/          — Expo app
packages/schedule-engine/  — pure TS
packages/adherence-core/   — pure TS
```

Root-level scripts orchestrate lint, format, and test across all packages. Husky runs lint-staged on pre-commit and domain tests on pre-push.

## Consequences
- **Positive:** Single `npm install`, single CI pipeline, atomic commits
- **Positive:** Path aliases (`@health-pal/schedule-engine`) work via TypeScript paths + npm workspaces
- **Positive:** Shared Biome config at root
- **Negative:** npm workspaces are simpler than Turborepo/Nx but lack caching — acceptable at current project size
