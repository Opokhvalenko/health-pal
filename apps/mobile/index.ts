import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN, SENTRY_ENABLED, SENTRY_TRACES_SAMPLE_RATE } from './src/config/sentry';

// Initialize Sentry as early as possible (before any other code loads)
// to capture early native crashes and JS errors.
Sentry.init({
  dsn: SENTRY_DSN,
  enabled: SENTRY_ENABLED && !__DEV__,
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
  // Disable native crash reporting in dev to avoid noise
  enableNativeCrashHandling: !__DEV__,
});

import './src/theme/unistyles';
import { registerBackgroundHandler } from './src/services/notification.background';
import 'expo-router/entry';

// Register Notifee background handler at top level
// (notification.background uses dynamic imports to avoid Unistyles init race)
registerBackgroundHandler();
