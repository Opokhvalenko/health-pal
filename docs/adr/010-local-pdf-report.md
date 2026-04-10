# ADR-010: Local PDF Report Generation

## Status
Accepted

## Context
Patients need to share medication and adherence data with doctors. Cloud-based solutions require accounts and internet. QR-based handoff is planned for R2 but adds complexity.

## Decision
R1 generates PDF reports locally using `expo-print` (HTML → PDF) and shares them via `expo-sharing`. The report includes: active medications, 30-day adherence summary, recent dose history, and recent symptoms.

The report is styled with inline CSS to match the app's visual identity (teal accents, warm beige backgrounds).

## Consequences
- **Positive:** Works fully offline — no server needed
- **Positive:** Standard PDF format — doctors can view on any device
- **Positive:** expo-print and expo-sharing are well-maintained Expo modules
- **Negative:** HTML-to-PDF rendering may vary slightly across platforms
- **Negative:** No interactive elements — static snapshot only
