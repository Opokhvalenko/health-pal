# ADR-005: Calm UX Philosophy

## Status
Accepted

## Context
A UX audit of competing medication apps revealed anxiety-inducing patterns: red "OVERDUE" badges, aggressive warning language, and guilt-focused copy. These patterns are especially harmful for elderly patients and caregivers already under stress.

## Decision
HealthPal adopts a Calm UX philosophy:
- No red overdue counters in default mode
- Neutral, encouraging copy ("Today's Plan" instead of "8 doses overdue!")
- Optional **Calm Mode** that hides skipped/missed counters entirely
- Focus on the next action, not past failures
- Warm, muted color palette (beige backgrounds, teal accents)

## Consequences
- **Positive:** Reduces anxiety for patients and caregivers
- **Positive:** Differentiates the product from competitors
- **Positive:** Calm Mode is a toggleable feature, not forced
- **Negative:** Some users may want aggressive reminders — addressed by making Calm Mode optional
