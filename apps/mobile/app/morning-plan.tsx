import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { MedicationWithSchedule } from '../src/db';
import { medicationService } from '../src/db';
import { safeAsync } from '../src/helpers/safeAsync';
import { useAppStore } from '../src/stores';
import { mmkv } from '../src/stores/mmkv';

interface PlannedDose {
  readonly id: string;
  readonly medicationName: string;
  readonly dosageValue: number;
  readonly dosageUnit: string;
  readonly time: string;
}

export default function MorningPlanScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const insets = useSafeAreaInsets();
  const [doses, setDoses] = useState<PlannedDose[]>([]);
  const [packed, setPacked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    if (!activeProfile) return;
    await safeAsync(async () => {
      const meds = await medicationService.getAllForProfile(activeProfile.id);
      const start = mmkv.getMorningWorkHoursStart();
      const end = mmkv.getMorningWorkHoursEnd();

      const result: PlannedDose[] = [];
      for (const { medication, schedule } of meds) {
        if (!schedule || schedule.type === 'as_needed' || schedule.paused) continue;
        if (medication.isArchived) continue;

        for (const time of schedule.times) {
          if (time >= start && time <= end) {
            result.push({
              id: `${medication.id}-${time}`,
              medicationName: medication.name,
              dosageValue: medication.dosageValue,
              dosageUnit: medication.dosageUnit,
              time,
            });
          }
        }
      }

      result.sort((a, b) => a.time.localeCompare(b.time));
      setDoses(result);
    }, t('common.error'));
    setLoading(false);
  }, [activeProfile, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const togglePacked = (id: string): void => {
    setPacked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allPacked = doses.length > 0 && doses.every((d) => packed.has(d.id));

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
        <Text style={styles.title}>{t('morningPlan.title')}</Text>
        <Text style={styles.subtitle}>{t('morningPlan.subtitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? null : doses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('morningPlan.empty')}</Text>
            <Text style={styles.emptyHint}>{t('morningPlan.emptyHint')}</Text>
          </View>
        ) : (
          <>
            {doses.map((dose) => {
              const isPacked = packed.has(dose.id);
              return (
                <Pressable
                  key={dose.id}
                  style={[styles.row, isPacked && styles.rowPacked]}
                  onPress={() => togglePacked(dose.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isPacked }}
                >
                  <View style={[styles.checkbox, isPacked && styles.checkboxChecked]}>
                    {isPacked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowName, isPacked && styles.rowNamePacked]}>
                      {dose.medicationName}
                    </Text>
                    <Text style={styles.rowDosage}>
                      {dose.dosageValue} {t(`medications.units.${dose.dosageUnit}`)} — {dose.time}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            {allPacked && (
              <View style={styles.allPackedBanner}>
                <Text style={styles.allPackedText}>{t('morningPlan.allPacked')}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
    paddingBottom: theme.spacing.md,
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
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  rowPacked: {
    opacity: 0.6,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  rowNamePacked: {
    textDecorationLine: 'line-through',
  },
  rowDosage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  allPackedBanner: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  allPackedText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textOnPrimary,
  },
}));
