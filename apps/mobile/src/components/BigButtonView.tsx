import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { doseEventService } from '../db';
import { useTodayDoses } from '../hooks/useTodayDoses';
import { useAppStore } from '../stores';

export function BigButtonView(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const { doses, reload } = useTodayDoses(activeProfile?.id);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const nextPending = doses.find((d) => d.status === 'pending');

  const handleTake = async (): Promise<void> => {
    if (!nextPending || !activeProfile) return;
    await doseEventService.logDose({
      scheduleId: nextPending.scheduleId,
      profileId: activeProfile.id,
      scheduledAt: nextPending.scheduledAt.toISOString(),
      status: 'taken',
    });
    await reload();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.profileEmoji}>{activeProfile?.avatarEmoji ?? '🧑'}</Text>
        <Text style={styles.profileName}>{activeProfile?.name}</Text>
      </View>

      <View style={styles.center}>
        {nextPending ? (
          <>
            <Pressable style={styles.bigButton} onPress={() => void handleTake()}>
              <Text style={styles.bigButtonText}>{t('bigButton.takeNow')}</Text>
            </Pressable>
            <Text style={styles.medName}>{nextPending.medicationName}</Text>
            <Text style={styles.medTime}>
              {nextPending.dosageValue} {nextPending.dosageUnit} — {nextPending.timeStr}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.nothingEmoji}>🌿</Text>
            <Text style={styles.nothingText}>{t('bigButton.nothingNow')}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  profileEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  profileName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  bigButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  bigButtonText: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textOnPrimary,
  },
  medName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
  },
  medTime: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  nothingEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  nothingText: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.medium,
  },
}));
