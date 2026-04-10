import type { AdherencePeriod, DoseEvent } from '@health-pal/adherence-core';
import { computeAdherence, computeStreak } from '@health-pal/adherence-core';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { doseEventService } from '../../src/db';
import { useAppStore } from '../../src/stores';

export default function AdherenceScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const calmMode = useAppStore((s) => s.calmMode);
  const [period, setPeriod] = useState<AdherencePeriod>('7d');
  const [events, setEvents] = useState<DoseEvent[]>([]);

  const loadEvents = useCallback(async (): Promise<void> => {
    if (!activeProfile) return;
    const rows = await doseEventService.getForProfile(activeProfile.id);
    const mapped: DoseEvent[] = rows.map((r) => ({
      id: r.id,
      scheduleId: r.scheduleId,
      scheduledAt: new Date(r.scheduledAt),
      status: r.status,
      recordedAt: new Date(r.recordedAt),
    }));
    setEvents(mapped);
  }, [activeProfile]);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents]),
  );

  if (events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('adherence.title')}</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>{t('adherence.empty')}</Text>
          <Text style={styles.emptyHint}>{t('adherence.emptyHint')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const now = new Date();
  const summary = computeAdherence(events, period, now);
  const streak = computeStreak(events, now);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('adherence.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Period Tabs */}
        <View style={styles.periodRow}>
          {(['7d', '30d', 'all'] as const).map((p) => (
            <Pressable
              key={p}
              style={[styles.periodTab, period === p && styles.periodTabActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {t(`adherence.period${p === '7d' ? '7d' : p === '30d' ? '30d' : 'All'}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Big Percentage */}
        <View style={styles.percentCard}>
          <Text style={styles.percentValue}>{summary.adherencePercent}%</Text>
          <Text style={styles.percentLabel}>{t('adherence.taken')}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatBox label={t('adherence.scheduled')} value={summary.totalScheduled} />
          <StatBox label={t('adherence.taken')} value={summary.taken} color="success" />
          {!calmMode && (
            <>
              <StatBox label={t('adherence.skipped')} value={summary.skipped} color="warning" />
              <StatBox label={t('adherence.missed')} value={summary.missed} color="error" />
            </>
          )}
          <StatBox label={t('adherence.snoozed')} value={summary.snoozed} />
        </View>

        {/* Streak */}
        <View style={styles.streakCard}>
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>{streak.currentStreak}</Text>
            <Text style={styles.streakLabel}>{t('adherence.streak')}</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>{streak.longestStreak}</Text>
            <Text style={styles.streakLabel}>{t('adherence.longestStreak')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: 'success' | 'warning' | 'error';
}): React.JSX.Element {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, color && styles[`stat_${color}`]]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    padding: 2,
    marginBottom: theme.spacing.lg,
  },
  periodTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.medium,
  },
  periodTextActive: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  percentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  percentValue: {
    fontSize: 56,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  percentLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    minWidth: '47%',
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  stat_success: {
    color: theme.colors.success,
  },
  stat_warning: {
    color: theme.colors.warning,
  },
  stat_error: {
    color: theme.colors.error,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  streakCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakValue: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  streakLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
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
