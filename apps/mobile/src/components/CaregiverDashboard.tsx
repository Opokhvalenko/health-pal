import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { doseEventService } from '../db';
import { useTodayDoses } from '../hooks/useTodayDoses';
import { useAppStore } from '../stores';

export function CaregiverDashboard(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const { doses, reload } = useTodayDoses(activeProfile?.id);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const pendingDoses = doses.filter((d) => d.status === 'pending');
  const completedDoses = doses.filter((d) => d.status !== 'pending');
  const nextDose = pendingDoses[0];

  const handleTake = async (): Promise<void> => {
    if (!nextDose || !activeProfile) return;
    await doseEventService.logDose({
      scheduleId: nextDose.scheduleId,
      profileId: activeProfile.id,
      scheduledAt: nextDose.scheduledAt.toISOString(),
      status: 'taken',
    });
    await reload();
  };

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
        {pendingDoses.length > 0 ? (
          pendingDoses.map((dose) => (
            <View key={`${dose.scheduleId}-${dose.timeStr}`} style={styles.doseRow}>
              <Text style={styles.doseTime}>{dose.timeStr}</Text>
              <Text style={styles.doseName}>{dose.medicationName}</Text>
              <Text style={styles.doseDosage}>
                {dose.dosageValue} {dose.dosageUnit}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.cardEmpty}>
            {completedDoses.length > 0 ? t('caregiver.allDone') : t('caregiver.nothingScheduled')}
          </Text>
        )}
      </View>

      {/* Next Medication */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('caregiver.nextMedication')}</Text>
        {nextDose ? (
          <View style={styles.nextDoseContainer}>
            <View style={styles.nextDoseInfo}>
              <Text style={styles.nextDoseName}>{nextDose.medicationName}</Text>
              <Text style={styles.nextDoseTime}>
                {nextDose.timeStr} — {nextDose.dosageValue} {nextDose.dosageUnit}
              </Text>
            </View>
            <Pressable style={styles.takeButton} onPress={() => void handleTake()}>
              <Text style={styles.takeText}>{t('dose.take')}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.cardEmpty}>{t('caregiver.allDone')}</Text>
        )}
      </View>

      {/* Recent Doses */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('caregiver.recentDoses')}</Text>
        {completedDoses.length > 0 ? (
          completedDoses.slice(0, 5).map((dose) => (
            <View key={`${dose.scheduleId}-${dose.timeStr}`} style={styles.recentRow}>
              <Text style={styles.recentName}>{dose.medicationName}</Text>
              <Text style={styles.recentStatus}>{t(`dose.${dose.status}`)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.cardEmpty}>{t('caregiver.nothingScheduled')}</Text>
        )}
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
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  doseTime: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
    width: 50,
  },
  doseName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    flex: 1,
  },
  doseDosage: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  nextDoseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextDoseInfo: {
    flex: 1,
  },
  nextDoseName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  nextDoseTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  takeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginLeft: theme.spacing.md,
  },
  takeText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textOnPrimary,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  recentName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  recentStatus: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.semibold,
  },
}));
