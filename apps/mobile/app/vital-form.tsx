import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { VitalType } from '../src/db';
import { VITAL_DEFAULT_UNIT, vitalService } from '../src/db';
import { safeAsync } from '../src/helpers/safeAsync';
import { useAppStore } from '../src/stores';

const VITAL_TYPES: VitalType[] = [
  'blood_pressure',
  'glucose',
  'temperature',
  'weight',
  'heart_rate',
  'oxygen',
];

export default function VitalFormScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);

  const [type, setType] = useState<VitalType>('blood_pressure');
  const [value, setValue] = useState('');
  const [valueSecondary, setValueSecondary] = useState('');
  const [pulse, setPulse] = useState('');
  const [notes, setNotes] = useState('');

  const isBP = type === 'blood_pressure';
  const unit = VITAL_DEFAULT_UNIT[type];

  const canSave =
    Number(value) > 0 && (!isBP || Number(valueSecondary) > 0) && activeProfile !== null;

  const handleSave = async (): Promise<void> => {
    if (!activeProfile || !canSave) return;
    await safeAsync(async () => {
      const recordedAt = new Date().toISOString();

      await vitalService.create({
        profileId: activeProfile.id,
        type,
        valueNumeric: Number(value),
        valueSecondary: isBP ? Number(valueSecondary) : undefined,
        unit,
        notes: notes.trim() || undefined,
        recordedAt,
      });

      // Auto-create paired heart_rate reading when measuring BP with pulse
      if (isBP && Number(pulse) > 0) {
        await vitalService.create({
          profileId: activeProfile.id,
          type: 'heart_rate',
          valueNumeric: Number(pulse),
          unit: VITAL_DEFAULT_UNIT.heart_rate,
          recordedAt,
        });
      }

      router.back();
    }, t('common.error'));
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
        <Text style={styles.title}>{t('vitals.add')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>{t('vitals.type')}</Text>
        <View style={styles.chipWrap}>
          {VITAL_TYPES.map((vt) => (
            <Pressable
              key={vt}
              style={[styles.chip, type === vt && styles.chipSelected]}
              onPress={() => setType(vt)}
            >
              <Text style={[styles.chipText, type === vt && styles.chipTextSelected]}>
                {t(`vitals.types.${vt}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>
          {isBP ? t('vitals.systolic') : t('vitals.value')} ({unit})
        </Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder={isBP ? '120' : t('vitals.valuePlaceholder')}
          placeholderTextColor="#B0B0B0"
          keyboardType="numeric"
        />

        {isBP && (
          <>
            <Text style={styles.label}>
              {t('vitals.diastolic')} ({unit})
            </Text>
            <TextInput
              style={styles.input}
              value={valueSecondary}
              onChangeText={setValueSecondary}
              placeholder="80"
              placeholderTextColor="#B0B0B0"
              keyboardType="numeric"
            />

            <Text style={styles.label}>
              {t('vitals.pulse')} ({VITAL_DEFAULT_UNIT.heart_rate})
            </Text>
            <Text style={styles.hint}>{t('vitals.pulseHint')}</Text>
            <TextInput
              style={styles.input}
              value={pulse}
              onChangeText={setPulse}
              placeholder="72"
              placeholderTextColor="#B0B0B0"
              keyboardType="numeric"
            />
          </>
        )}

        <Text style={styles.label}>{t('vitals.notes')}</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('vitals.notesPlaceholder')}
          placeholderTextColor="#B0B0B0"
          multiline
          numberOfLines={3}
        />

        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={() => void handleSave()}
          disabled={!canSave}
        >
          <Text style={styles.saveText}>{t('vitals.save')}</Text>
        </Pressable>
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
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
    marginTop: -theme.spacing.xs,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: theme.colors.textOnPrimary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textOnPrimary,
    fontWeight: theme.fontWeight.bold,
  },
}));
