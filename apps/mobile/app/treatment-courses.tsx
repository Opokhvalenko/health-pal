import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { TreatmentCourseRow } from '../src/db';
import { treatmentCourseService } from '../src/db';
import { useAppStore } from '../src/stores';

export default function TreatmentCoursesScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const [courses, setCourses] = useState<TreatmentCourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const load = useCallback(async (): Promise<void> => {
    if (!activeProfile) return;
    const list = await treatmentCourseService.getForProfile(activeProfile.id);
    setCourses(list);
    setLoading(false);
  }, [activeProfile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const active = courses.filter((c) => c.endDate === null);
  const completed = courses.filter((c) => c.endDate !== null);

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
        <Text style={styles.title}>{t('treatmentCourses.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? null : (
          <>
            {active.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t('treatmentCourses.active')}</Text>
                {active.map((course) => (
                  <CourseCard key={course.id} course={course} t={t} highlight />
                ))}
              </>
            )}

            {completed.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
                  {t('treatmentCourses.completed')}
                </Text>
                {completed.map((course) => (
                  <CourseCard key={course.id} course={course} t={t} highlight={false} />
                ))}
              </>
            )}

            {courses.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{t('treatmentCourses.empty')}</Text>
                <Text style={styles.emptyHint}>{t('treatmentCourses.emptyHint')}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/treatment-course-form')}
        accessibilityRole="button"
        accessibilityLabel={t('treatmentCourses.add')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function CourseCard({
  course,
  t,
  highlight,
}: {
  course: TreatmentCourseRow;
  t: (key: string) => string;
  highlight: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      style={[styles.card, highlight && styles.cardActive]}
      onPress={() =>
        router.push({
          pathname: '/treatment-course-form',
          params: { courseId: course.id },
        })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{course.title}</Text>
        {highlight && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{t('treatmentCourses.active')}</Text>
          </View>
        )}
      </View>
      {course.reason && <Text style={styles.cardReason}>{course.reason}</Text>}
      <Text style={styles.cardDates}>
        {course.startDate}
        {course.endDate ? ` → ${course.endDate}` : ` → ${t('treatmentCourses.ongoing')}`}
      </Text>
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
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  sectionTitleSpaced: {
    marginTop: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  cardActive: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textOnPrimary,
    fontWeight: theme.fontWeight.semibold,
  },
  cardReason: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  cardDates: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
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
