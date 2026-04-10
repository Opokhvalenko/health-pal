import '../src/i18n';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { openDatabaseSync } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorFallback } from '../src/components/ErrorFallback';
import { profileService } from '../src/db';
import { runMigrations } from '../src/db/migrations';
import { useAppStore } from '../src/stores';
import { mmkv } from '../src/stores/mmkv';

function RootLayout(): React.JSX.Element | null {
  const [dbReady, setDbReady] = useState(false);
  const hydrate = useAppStore((s) => s.hydrate);
  const setProfiles = useAppStore((s) => s.setProfiles);
  const setActiveProfile = useAppStore((s) => s.setActiveProfile);
  const isOnboardingDone = useAppStore((s) => s.isOnboardingDone);

  useEffect(() => {
    const init = async (): Promise<void> => {
      const expoDb = openDatabaseSync('healthpal.db');
      runMigrations(expoDb);
      hydrate();

      // Load profiles from SQLite
      const rows = await profileService.getAll();
      const profilesList = rows.map((r) => ({
        id: r.id,
        name: r.name,
        role: r.role,
        avatarEmoji: r.avatarEmoji,
      }));
      setProfiles(profilesList);

      // Restore active profile from MMKV
      const activeId = mmkv.getActiveProfileId();
      if (activeId) {
        const active = profilesList.find((p) => p.id === activeId);
        if (active) {
          setActiveProfile(active);
        }
      }

      setDbReady(true);
    };
    init();
  }, [hydrate, setProfiles, setActiveProfile]);

  if (!dbReady) return null;

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error as Error} resetError={resetError} />
      )}
    >
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          {isOnboardingDone ? <Stack.Screen name="(tabs)" /> : <Stack.Screen name="onboarding" />}
          <Stack.Screen name="profiles" options={{ presentation: 'modal' }} />
          <Stack.Screen name="medication-form" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="symptoms" options={{ presentation: 'modal' }} />
          <Stack.Screen name="report" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </Sentry.ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
