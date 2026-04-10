import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useAppStore } from '../stores';

export function CaregiverDashboard(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);

  // TODO: Wire to real data in Phase 3-4 (medications, dose events)

  return (
    <View style={styles.container}>
      {activeProfile && (
        <Text style={styles.managingFor}>
          {t('caregiver.managingFor', { name: activeProfile.name })}
        </Text>
      )}

      {/* Today's Plan */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('caregiver.todaysPlan')}</Text>
        <Text style={styles.cardEmpty}>{t('caregiver.nothingScheduled')}</Text>
      </View>

      {/* Next Medication */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('caregiver.nextMedication')}</Text>
        <Text style={styles.cardEmpty}>{t('caregiver.nothingScheduled')}</Text>
      </View>

      {/* Recent Doses */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('caregiver.recentDoses')}</Text>
        <Text style={styles.cardEmpty}>{t('caregiver.allDone')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  managingFor: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  cardEmpty: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
}));
