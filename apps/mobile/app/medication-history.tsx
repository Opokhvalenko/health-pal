import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { ChangesMap, MedicationChangeRow, MedicationRow } from '../src/db';
import { medicationChangeService, medicationService } from '../src/db';
import { useAppStore } from '../src/stores';

export default function MedicationHistoryScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { medId } = useLocalSearchParams<{ medId: string }>();
  const activeProfile = useAppStore((s) => s.activeProfile);

  const [medication, setMedication] = useState<MedicationRow | null>(null);
  const [changes, setChanges] = useState<MedicationChangeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    if (!medId || !activeProfile) return;
    const allMeds = await medicationService.getAllForProfile(activeProfile.id);
    const found = allMeds.find((m) => m.medication.id === medId);
    if (found) setMedication(found.medication);

    const history = await medicationChangeService.getForMedication(medId);
    setChanges(history);
    setLoading(false);
  }, [medId, activeProfile]);

  useEffect(() => {
    load();
  }, [load]);

  const insets = useSafeAreaInsets();

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
        <Text style={styles.title}>{t('medicationHistory.title')}</Text>
        {medication && <Text style={styles.subtitle}>{medication.name}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? null : changes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('medicationHistory.empty')}</Text>
            <Text style={styles.emptyHint}>{t('medicationHistory.emptyHint')}</Text>
          </View>
        ) : (
          changes.map((change) => <ChangeCard key={change.id} change={change} t={t} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ChangeCard({
  change,
  t,
}: {
  change: MedicationChangeRow;
  t: (key: string) => string;
}): React.JSX.Element {
  const date = new Date(change.changedAt);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{dateStr}</Text>
        <Text style={styles.cardTime}>{timeStr}</Text>
      </View>
      {change.reason && (
        <View style={styles.reasonRow}>
          <Text style={styles.reasonLabel}>{t('medicationHistory.reason')}</Text>
          <Text style={styles.reasonText}>{change.reason}</Text>
        </View>
      )}
      <View style={styles.changesList}>{renderChanges(change.changes, t)}</View>
    </View>
  );
}

function renderChanges(
  changes: ChangesMap,
  t: (key: string, opts?: Record<string, unknown>) => string,
): React.JSX.Element[] {
  // Pull intervalHours from this change set (if present) so we can substitute {{hours}}
  const fromHours = (changes.intervalHours?.from as number | null | undefined) ?? undefined;
  const toHours = (changes.intervalHours?.to as number | null | undefined) ?? undefined;

  return Object.entries(changes).map(([field, change]) => {
    const fieldLabel = t(`medicationHistory.fields.${field}`) || field;
    const fromText = formatValue(field, change.from, t, fromHours);
    const toText = formatValue(field, change.to, t, toHours);
    return (
      <View key={field} style={styles.changeRow}>
        <Text style={styles.fieldLabel}>{fieldLabel}</Text>
        <View style={styles.fromTo}>
          <Text style={styles.fromText}>{fromText}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.toText}>{toText}</Text>
        </View>
      </View>
    );
  });
}

function formatValue(
  field: string,
  value: unknown,
  t: (key: string, opts?: Record<string, unknown>) => string,
  hours?: number | null,
): string {
  if (value === null || value === undefined) return '—';
  if (field === 'scheduleType' && typeof value === 'string') {
    if (value === 'every_x_hours') {
      return t('medications.scheduleTypes.every_x_hours', { hours: hours ?? '?' });
    }
    return t(`medications.scheduleTypes.${value}`);
  }
  if (Array.isArray(value)) return value.length === 0 ? '—' : value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
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
    paddingBottom: theme.spacing.xxl,
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
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  cardDate: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  cardTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  reasonRow: {
    marginBottom: theme.spacing.sm,
  },
  reasonLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reasonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontStyle: 'italic',
    marginTop: 2,
  },
  changesList: {
    gap: theme.spacing.xs,
  },
  changeRow: {
    paddingVertical: theme.spacing.xs,
  },
  fieldLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: 2,
  },
  fromTo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  fromText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  arrow: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  toText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
}));
