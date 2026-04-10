import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { BigButtonView } from '../../src/components/BigButtonView';
import { CaregiverDashboard } from '../../src/components/CaregiverDashboard';
import { LoadingView } from '../../src/components/LoadingView';
import { ProfileSwitcher } from '../../src/components/ProfileSwitcher';
import { doseEventService } from '../../src/db';
import type { TodayDose } from '../../src/hooks/useTodayDoses';
import { useTodayDoses } from '../../src/hooks/useTodayDoses';
import { useAppStore } from '../../src/stores';

export default function TodayScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const calmMode = useAppStore((s) => s.calmMode);
  const role = activeProfile?.role;
  const { doses, loading, reload } = useTodayDoses(activeProfile?.id);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (loading) return <LoadingView />;

  if (role === 'patient') {
    return <BigButtonView />;
  }

  if (role === 'caregiver') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{t('today.greeting')}</Text>
              <Text style={styles.title}>{t('today.title')}</Text>
            </View>
            <ProfileSwitcher />
          </View>
        </View>
        <CaregiverDashboard />
      </SafeAreaView>
    );
  }

  const now = new Date();
  const pendingDoses = doses.filter((d) => d.status === 'pending');
  const completedDoses = doses.filter((d) => d.status !== 'pending');
  const doneCount = completedDoses.length;
  const totalCount = doses.length;

  const handleAction = async (
    dose: TodayDose,
    action: 'taken' | 'skipped' | 'snoozed',
  ): Promise<void> => {
    if (!activeProfile) return;

    if (dose.eventId) {
      await doseEventService.updateStatus(dose.eventId, action);
    } else {
      await doseEventService.logDose({
        scheduleId: dose.scheduleId,
        profileId: activeProfile.id,
        scheduledAt: dose.scheduledAt.toISOString(),
        status: action,
      });
    }
    await reload();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{t('today.greeting')}</Text>
            <Text style={styles.title}>{t('today.title')}</Text>
          </View>
          <ProfileSwitcher />
        </View>
        {totalCount > 0 && (
          <Text style={styles.progress}>
            {t('dose.todayProgress', { done: doneCount, total: totalCount })}
          </Text>
        )}
      </View>

      {doses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌿</Text>
          <Text style={styles.emptyText}>{t('today.empty')}</Text>
          <Text style={styles.emptyHint}>{t('today.emptyHint')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {pendingDoses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('dose.upcoming')}</Text>
              {pendingDoses.map((dose) => (
                <DoseCard
                  key={`${dose.scheduleId}-${dose.timeStr}`}
                  dose={dose}
                  now={now}
                  calmMode={calmMode}
                  t={t}
                  onAction={handleAction}
                />
              ))}
            </View>
          )}

          {completedDoses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('dose.completed')}</Text>
              {completedDoses.map((dose) => (
                <View key={`${dose.scheduleId}-${dose.timeStr}`} style={styles.completedCard}>
                  <View style={styles.completedInfo}>
                    <Text style={styles.completedName}>{dose.medicationName}</Text>
                    <Text style={styles.completedTime}>{dose.timeStr}</Text>
                  </View>
                  <Text style={styles.completedStatus}>{t(`dose.${dose.status}`)}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DoseCard({
  dose,
  now,
  calmMode,
  t,
  onAction,
}: {
  dose: TodayDose;
  now: Date;
  calmMode: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
  onAction: (dose: TodayDose, action: 'taken' | 'skipped' | 'snoozed') => Promise<void>;
}): React.JSX.Element {
  const isDue = dose.scheduledAt <= now;

  return (
    <View
      style={[styles.doseCard, isDue && !calmMode && styles.doseCardDue]}
      accessible
      accessibilityLabel={`${dose.medicationName}, ${dose.dosageValue} ${dose.dosageUnit}, ${isDue ? t('dose.dueNow') : dose.timeStr}`}
    >
      <View style={styles.doseInfo}>
        <Text style={styles.doseName}>{dose.medicationName}</Text>
        <Text style={styles.doseDosage}>
          {dose.dosageValue} {dose.dosageUnit}
        </Text>
        <Text style={[styles.doseTime, isDue && !calmMode && styles.doseTimeDue]}>
          {isDue ? t('dose.dueNow') : t('dose.scheduled', { time: dose.timeStr })}
        </Text>
      </View>
      <View style={styles.doseActions}>
        <Pressable
          style={styles.takeButton}
          onPress={() => void onAction(dose, 'taken')}
          accessibilityRole="button"
          accessibilityLabel={`${t('dose.take')} ${dose.medicationName}`}
        >
          <Text style={styles.takeText}>{t('dose.take')}</Text>
        </Pressable>
        <View style={styles.secondaryActions}>
          <Pressable
            style={styles.skipButton}
            onPress={() => void onAction(dose, 'skipped')}
            accessibilityRole="button"
            accessibilityLabel={`${t('dose.skip')} ${dose.medicationName}`}
          >
            <Text style={styles.skipText}>{t('dose.skip')}</Text>
          </Pressable>
          <Pressable
            style={styles.skipButton}
            onPress={() => void onAction(dose, 'snoozed')}
            accessibilityRole="button"
            accessibilityLabel={`${t('dose.snooze')} ${dose.medicationName}`}
          >
            <Text style={styles.skipText}>{t('dose.snooze')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  progress: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    marginTop: theme.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  doseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  doseCardDue: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  doseInfo: {
    marginBottom: theme.spacing.md,
  },
  doseName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  doseDosage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  doseTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  doseTimeDue: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  doseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  takeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  takeText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textOnPrimary,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  skipButton: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  skipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  completedCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    opacity: 0.7,
  },
  completedInfo: {
    flex: 1,
  },
  completedName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  completedTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  completedStatus: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.semibold,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
}));
