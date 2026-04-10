/**
 * Sentry configuration.
 *
 * DSN is read from EXPO_PUBLIC_SENTRY_DSN env var. When empty, Sentry
 * initializes in no-op mode (events are silently dropped). This lets the
 * app run safely without a real Sentry account during development.
 *
 * To enable in production:
 * 1. Create a Sentry project at https://sentry.io
 * 2. Set EXPO_PUBLIC_SENTRY_DSN in EAS secrets or .env
 * 3. (Optional) Set SENTRY_AUTH_TOKEN for source map uploads via EAS Build
 */
export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

/** Whether Sentry is configured with a real DSN. */
export const SENTRY_ENABLED = SENTRY_DSN.length > 0;

/** Sample rate for performance traces (0..1). 0.2 = 20%. */
export const SENTRY_TRACES_SAMPLE_RATE = 0.2;
