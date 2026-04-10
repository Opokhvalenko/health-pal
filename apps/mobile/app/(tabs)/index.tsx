import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { BigButtonView } from '../../src/components/BigButtonView';
import { CaregiverDashboard } from '../../src/components/CaregiverDashboard';
import { ProfileSwitcher } from '../../src/components/ProfileSwitcher';
import { ProgressRing } from '../../src/components/ProgressRing';
import { TodaySkeleton } from '../../src/components/skeletons/TodaySkeleton';
import { doseEventService, medicationService } from '../../src/db';
import { useNotifications } from '../../src/hooks/useNotifications';
import type { TodayDose } from '../../src/hooks/useTodayDoses';
import { useTodayDoses } from '../../src/hooks/useTodayDoses';
import { cancelDoseNotification, scheduleSnooze } from '../../src/services/notification.service';
import { useAppStore } from '../../src/stores';

export default function TodayScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const calmMode = useAppStore((s) => s.calmMode);
  const role = activeProfile?.role;
  const { doses, loading, reload } = useTodayDoses(activeProfile?.id);

  // Initialize notifications and handle foreground events
  useNotifications(activeProfile?.id, reload);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (loading) return <TodaySkeleton />;

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

    void Haptics.impactAsync(
      action === 'taken' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );

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

    // Cancel the notification for this dose
    // Find medicationId from medications list
    const meds = await medicationService.getAllForProfile(activeProfile.id);
    const med = meds.find((m) => m.schedule?.id === dose.scheduleId);
    if (med) {
      if (action === 'snoozed') {
        await scheduleSnooze(
          med.medication.id,
          med.medication.name,
          med.medication.dosageValue,
          med.medication.dosageUnit,
          dose.scheduleId,
          dose.scheduledAt.toISOString(),
          dose.timeStr,
        );
      }
      await cancelDoseNotification(med.medication.id, dose.timeStr);
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
          <View style={styles.progressRing}>
            <ProgressRing done={doneCount} total={totalCount} label={t('today.doses')} />
          </View>
        )}
      </View>

      {doses.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="leaf-outline" size={48} color="#8AADA5" />
          <Text style={styles.emptyText}>{t('today.empty')}</Text>
          <Text style={styles.emptyHint}>{t('today.emptyHint')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {pendingDoses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('dose.upcoming')}</Text>
              {pendingDoses.map((dose, index) => (
                <Animated.View
                  key={`${dose.scheduleId}-${dose.timeStr}`}
                  entering={FadeInDown.delay(index * 60).springify()}
                  layout={LinearTransition.springify()}
                >
                  <DoseCard
                    dose={dose}
                    now={now}
                    calmMode={calmMode}
                    t={t}
                    onAction={handleAction}
                  />
                </Animated.View>
              ))}
            </View>
          )}

          {completedDoses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('dose.completed')}</Text>
              {completedDoses.map((dose, index) => (
                <Animated.View
                  key={`${dose.scheduleId}-${dose.timeStr}`}
                  entering={FadeIn.delay(index * 40)}
                  layout={LinearTransition.springify()}
                  style={styles.completedCard}
                >
                  <View style={styles.completedInfo}>
                    <Text style={styles.completedName}>{dose.medicationName}</Text>
                    <Text style={styles.completedTime}>{dose.timeStr}</Text>
                  </View>
                  <Text
                    style={[
                      styles.completedStatus,
                      dose.status === 'skipped' && styles.completedSkipped,
                      dose.status === 'snoozed' && styles.completedSnoozed,
                    ]}
                  >
                    {t(`dose.${dose.status}`)}
                  </Text>
                </Animated.View>
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
  const takeScale = useSharedValue(1);

  const takeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: takeScale.value }],
  }));

  const handleTakePress = (): void => {
    takeScale.value = withSequence(withSpring(1.15, { damping: 8 }), withSpring(1, { damping: 8 }));
    void onAction(dose, 'taken');
  };

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
        <Animated.View style={takeAnimatedStyle}>
          <Pressable
            style={styles.takeButton}
            onPress={handleTakePress}
            accessibilityRole="button"
            accessibilityLabel={`${t('dose.take')} ${dose.medicationName}`}
          >
            <Text style={styles.takeText}>{t('dose.take')}</Text>
          </Pressable>
        </Animated.View>
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
  progressRing: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
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
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
  completedSkipped: {
    color: theme.colors.warning,
  },
  completedSnoozed: {
    color: theme.colors.textMuted,
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
