import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { DoctorVisitRow } from '../src/db';
import { doctorVisitService } from '../src/db';
import { safeAsync } from '../src/helpers/safeAsync';
import { useAppStore } from '../src/stores';

export default function DoctorVisitsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const [visits, setVisits] = useState<DoctorVisitRow[]>([]);
  const [upcoming, setUpcoming] = useState<DoctorVisitRow | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const load = useCallback(async (): Promise<void> => {
    if (!activeProfile) return;
    await safeAsync(async () => {
      const [list, next] = await Promise.all([
        doctorVisitService.getForProfile(activeProfile.id),
        doctorVisitService.getUpcoming(activeProfile.id),
      ]);
      setVisits(list);
      setUpcoming(next);
    }, t('common.error'));
    setLoading(false);
  }, [activeProfile, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={12}
        >
          <Text style={styles.backButton}>‹ {t('common.back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('doctorVisits.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? null : (
          <>
            {/* Upcoming visit highlight */}
            {upcoming && (
              <Pressable
                style={styles.upcomingCard}
                onPress={() =>
                  router.push({
                    pathname: '/doctor-visit-form',
                    params: { visitId: upcoming.id },
                  })
                }
              >
                <Text style={styles.upcomingLabel}>{t('doctorVisits.nextVisit')}</Text>
                <Text style={styles.upcomingDoctor}>{upcoming.doctorName}</Text>
                {upcoming.specialty && (
                  <Text style={styles.upcomingSpecialty}>{upcoming.specialty}</Text>
                )}
                <Text style={styles.upcomingDate}>
                  {new Date(upcoming.nextVisitDate ?? '').toLocaleDateString()}
                </Text>
              </Pressable>
            )}

            <Text style={styles.sectionTitle}>{t('doctorVisits.history')}</Text>

            {visits.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{t('doctorVisits.empty')}</Text>
                <Text style={styles.emptyHint}>{t('doctorVisits.emptyHint')}</Text>
              </View>
            ) : (
              visits.map((visit) => (
                <Pressable
                  key={visit.id}
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: '/doctor-visit-form',
                      params: { visitId: visit.id },
                    })
                  }
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardDoctor}>{visit.doctorName}</Text>
                    <Text style={styles.cardDate}>
                      {new Date(visit.visitDate).toLocaleDateString()}
                    </Text>
                  </View>
                  {visit.specialty && <Text style={styles.cardSpecialty}>{visit.specialty}</Text>}
                  {visit.reason && (
                    <Text style={styles.cardReason} numberOfLines={2}>
                      {visit.reason}
                    </Text>
                  )}
                  {visit.recommendations && (
                    <Text style={styles.cardRecommendations} numberOfLines={2}>
                      ✓ {visit.recommendations}
                    </Text>
                  )}
                </Pressable>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/doctor-visit-form')}
        accessibilityRole="button"
        accessibilityLabel={t('doctorVisits.add')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  backButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  upcomingCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  upcomingLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textOnPrimary,
    opacity: 0.85,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  upcomingDoctor: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textOnPrimary,
  },
  upcomingSpecialty: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textOnPrimary,
    opacity: 0.85,
    marginTop: 2,
  },
  upcomingDate: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textOnPrimary,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDoctor: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  cardDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.sm,
  },
  cardSpecialty: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  cardReason: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  cardRecommendations: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.success,
    marginTop: theme.spacing.xs,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
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
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: theme.colors.textOnPrimary,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 30,
  },
}));
