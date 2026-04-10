# ADR-006: Caregiver-First Product Model

## Status
Accepted

## Context
Most medication apps assume the user is the patient. In reality, a significant portion of users are caregivers — adult children managing medications for aging parents, spouses helping partners, or parents managing children's medications.

## Decision
HealthPal supports three profile roles: `self`, `caregiver`, and `patient`. Each role gets a different UI experience:
- **Self** — standard Today view with dose cards and actions
- **Caregiver** — dashboard with today's plan, next medication, and recent doses for the person they care for
- **Patient** — simplified Big Button view with one large "Take" button and minimal information

Profile switching is built into the header for quick access.

## Consequences
- **Positive:** Caregivers can manage multiple patients from one device
- **Positive:** Patient mode reduces cognitive load for users who find complex UIs overwhelming
- **Positive:** Profile switcher makes multi-person management seamless
- **Negative:** Additional UI complexity to maintain three different views
