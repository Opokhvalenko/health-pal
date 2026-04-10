# ADR-004: Unistyles 3 for Theming

## Status
Accepted

## Context
The app requires three visual themes (light, dark, calm) with runtime switching. Calm Mode is a core product feature, not just a cosmetic preference. NativeWind (Tailwind CSS for RN) was considered but lacks runtime theme objects for dynamic switching.

## Decision
Use react-native-unistyles v3 with three themes defined as typed objects. Themes share design tokens (spacing, radius, fontSize, fontWeight) and differ in color palettes. Calm Mode switches the Unistyles runtime theme to `calm`.

## Consequences
- **Positive:** Type-safe theme access in `StyleSheet.create((theme) => ...)`
- **Positive:** Runtime theme switching without re-render tree rebuild
- **Positive:** Adaptive themes (system light/dark) work out of the box
- **Positive:** Calm theme has muted colors, zero shadow, softer contrasts
- **Negative:** Unistyles is less mainstream than StyleSheet or NativeWind
