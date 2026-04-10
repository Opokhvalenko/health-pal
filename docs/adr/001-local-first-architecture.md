# ADR-001: Local-First Architecture

## Status
Accepted

## Context
Health data is sensitive. Most medication apps store it on third-party servers, requiring account creation and internet connectivity. Users managing medications for elderly relatives may have limited connectivity or technical expertise.

## Decision
HealthPal is local-first. The device database (SQLite) is the single source of truth. The app works fully without an account or internet connection. Cloud sync is optional and planned for a future release.

## Consequences
- **Positive:** Privacy by default, instant startup, works offline, no server costs for MVP
- **Positive:** No account creation friction — onboarding completes in under a minute
- **Negative:** No cross-device sync in R1
- **Negative:** Data loss if device is lost (mitigated by future encrypted cloud backup)
