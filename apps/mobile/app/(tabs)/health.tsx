import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

interface HealthItemProps {
  readonly label: string;
  readonly onPress: () => void;
}

function HealthItem({ label, onPress }: HealthItemProps): React.JSX.Element {
  return (
    <Pressable style={styles.item} onPress={onPress} accessibilityRole="button">
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.chevron} importantForAccessibility="no">
        ›
      </Text>
    </Pressable>
  );
}

export default function HealthScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('health.title')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('health.tracking')}</Text>
          <HealthItem label={t('symptoms.title')} onPress={() => router.push('/symptoms')} />
          <HealthItem label={t('vitals.title')} onPress={() => router.push('/vitals')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('health.medical')}</Text>
          <HealthItem
            label={t('doctorVisits.title')}
            onPress={() => router.push('/doctor-visits')}
          />
          <HealthItem
            label={t('treatmentCourses.title')}
            onPress={() => router.push('/treatment-courses')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('health.reports')}</Text>
          <HealthItem label={t('report.title')} onPress={() => router.push('/report')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
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
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  item: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  itemLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  chevron: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textMuted,
  },
}));
