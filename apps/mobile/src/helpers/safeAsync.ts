import * as Sentry from '@sentry/react-native';
import { Alert } from 'react-native';

/**
 * Wraps an async function with try/catch.
 * On error: shows Alert with error message and reports to Sentry.
 * Prevents silent failures on Android.
 */
export async function safeAsync(fn: () => Promise<void>, errorTitle = 'Error'): Promise<void> {
  try {
    await fn();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    Sentry.captureException(err);
    Alert.alert(errorTitle, message);
  }
}
