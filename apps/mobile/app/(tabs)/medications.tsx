import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInRight, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { MedicationsSkeleton } from '../../src/components/skeletons/MedicationsSkeleton';
import type { MedicationWithSchedule, TreatmentCourseRow } from '../../src/db';
import { medicationService, treatmentCourseService } from '../../src/db';
import { useAppStore } from '../../src/stores';

export default function MedicationsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const [meds, setMeds] = useState<MedicationWithSchedule[]>([]);
  const [courses, setCourses] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadMeds = useCallback(async (): Promise<void> => {
    if (!activeProfile) return;
    const [result, allCourses] = await Promise.all([
      medicationService.getAllForProfile(activeProfile.id),
      treatmentCourseService.getForProfile(activeProfile.id),
    ]);
    setMeds(result);
    setCourses(new Map(allCourses.map((c) => [c.id, c.title])));
    setLoading(false);
  }, [activeProfile]);

  useFocusEffect(
    useCallback(() => {
      loadMeds();
    }, [loadMeds]),
  );

  if (loading) return <MedicationsSkeleton />;

  const routineMeds = meds.filter((m) => m.medication.category === 'routine');
  const asNeededMeds = meds.filter((m) => m.medication.category === 'as_needed');

  if (meds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('medications.title')}</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="medical-outline" size={48} color="#8AADA5" />
          <Text style={styles.emptyText}>{t('medications.empty')}</Text>
          <Text style={styles.emptyHint}>{t('medications.emptyHint')}</Text>
        </View>
        <Pressable
          style={styles.fab}
          onPress={() => router.push('/medication-form')}
          accessibilityRole="button"
          accessibilityLabel={t('medications.addMedication')}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('medications.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {routineMeds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('medications.routine')}</Text>
            {routineMeds.map((item, index) => (
              <Animated.View
                key={item.medication.id}
                entering={FadeInRight.delay(index * 50).springify()}
                layout={LinearTransition.springify()}
              >
                <MedicationCard
                  item={item}
                  t={t}
                  courseName={courses.get(item.medication.courseId ?? '') ?? null}
                />
              </Animated.View>
            ))}
          </View>
        )}

        {asNeededMeds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('medications.asNeeded')}</Text>
            {asNeededMeds.map((item, index) => (
              <Animated.View
                key={item.medication.id}
                entering={FadeInRight.delay(index * 50).springify()}
                layout={LinearTransition.springify()}
              >
                <MedicationCard
                  item={item}
                  t={t}
                  courseName={courses.get(item.medication.courseId ?? '') ?? null}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/medication-form')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function MedicationCard({
  item,
  t,
  courseName,
}: {
  item: MedicationWithSchedule;
  t: (key: string) => string;
  courseName: string | null;
}): React.JSX.Element {
  const { medication, schedule } = item;

  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({ pathname: '/medication-form', params: { medId: medication.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={`${medication.name}, ${medication.dosageValue} ${t(`medications.units.${medication.dosageUnit}`)}`}
      accessibilityHint={t('medications.editMedication')}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{medication.name}</Text>
        <Text style={styles.cardDosage}>
          {medication.dosageValue} {t(`medications.units.${medication.dosageUnit}`)}
        </Text>
      </View>
      {courseName && (
        <View style={styles.cardCourseBadge}>
          <Text style={styles.cardCourseText}>{courseName}</Text>
        </View>
      )}
      {schedule && (
        <View style={styles.cardSchedule}>
          <Text style={styles.cardScheduleType}>
            {schedule.type === 'every_x_hours'
              ? (t('medications.scheduleTypes.every_x_hours') as string).replace(
                  '{{hours}}',
                  String(schedule.intervalHours ?? ''),
                )
              : t(`medications.scheduleTypes.${schedule.type}`)}
          </Text>
          {schedule.times.length > 0 && (
            <View style={styles.cardTimes}>
              {schedule.times.map((time) => (
                <View key={time} style={styles.cardTimeChip}>
                  <Text style={styles.cardTimeText}>{time}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      {medication.notes && <Text style={styles.cardNotes}>{medication.notes}</Text>}
    </Pressable>
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
    paddingBottom: 100,
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
    marginBottom: theme.spacing.xs,
  },
  cardName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  cardDosage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.sm,
  },
  cardSchedule: {
    marginTop: theme.spacing.xs,
  },
  cardScheduleType: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  cardTimes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  cardTimeChip: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  cardTimeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  cardCourseBadge: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
  },
  cardCourseText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  cardNotes: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
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
