import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { VitalRow, VitalType } from '../src/db';
import { formatVitalValue, vitalService } from '../src/db';
import { useAppStore } from '../src/stores';

const VITAL_TYPES: VitalType[] = [
  'blood_pressure',
  'glucose',
  'temperature',
  'weight',
  'heart_rate',
  'oxygen',
];

export default function VitalsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const [vitalsByType, setVitalsByType] = useState<Map<VitalType, VitalRow[]>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    if (!activeProfile) return;
    const all = await vitalService.getForProfile(activeProfile.id);
    const grouped = new Map<VitalType, VitalRow[]>();
    for (const v of all) {
      const list = grouped.get(v.type) ?? [];
      list.push(v);
      grouped.set(v.type, list);
    }
    setVitalsByType(grouped);
    setLoading(false);
  }, [activeProfile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = async (id: string): Promise<void> => {
    await vitalService.remove(id);
    await load();
  };

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
        <Text style={styles.title}>{t('vitals.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? null : (
          <>
            {VITAL_TYPES.map((type) => {
              const list = vitalsByType.get(type) ?? [];
              const latest = list[0];
              return (
                <View key={type} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t(`vitals.types.${type}`)}</Text>
                    {latest && <Text style={styles.sectionLatest}>{formatVitalValue(latest)}</Text>}
                  </View>
                  {list.length === 0 ? (
                    <Text style={styles.emptyHint}>{t('vitals.noReadings')}</Text>
                  ) : (
                    list.slice(0, 5).map((vital) => (
                      <View key={vital.id} style={styles.readingRow}>
                        <View style={styles.readingInfo}>
                          <Text style={styles.readingValue}>{formatVitalValue(vital)}</Text>
                          <Text style={styles.readingDate}>
                            {new Date(vital.recordedAt).toLocaleString()}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => void handleDelete(vital.id)}
                          accessibilityRole="button"
                          accessibilityLabel={t('vitals.delete')}
                          hitSlop={8}
                        >
                          <Text style={styles.deleteText}>✕</Text>
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/vital-form')}
        accessibilityRole="button"
        accessibilityLabel={t('vitals.add')}
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
    paddingTop: theme.spacing.md,
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
  section: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  sectionLatest: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  emptyHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  readingInfo: {
    flex: 1,
  },
  readingValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  readingDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  deleteText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.error,
    paddingHorizontal: theme.spacing.sm,
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
