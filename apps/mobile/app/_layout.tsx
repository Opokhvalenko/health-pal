import '../src/i18n';
import '../src/theme/unistyles';
import { Stack } from 'expo-router';
import { openDatabaseSync } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { runMigrations } from '../src/db/migrations';
import { useAppStore } from '../src/stores';

export default function RootLayout(): React.JSX.Element | null {
  const [dbReady, setDbReady] = useState(false);
  const hydrate = useAppStore((s) => s.hydrate);
  const isOnboardingDone = useAppStore((s) => s.isOnboardingDone);

  useEffect(() => {
    const expoDb = openDatabaseSync('healthpal.db');
    runMigrations(expoDb);
    hydrate();
    setDbReady(true);
  }, [hydrate]);

  if (!dbReady) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {isOnboardingDone ? <Stack.Screen name="(tabs)" /> : <Stack.Screen name="onboarding" />}
      </Stack>
    </SafeAreaProvider>
  );
}
