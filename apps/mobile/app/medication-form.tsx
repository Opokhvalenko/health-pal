import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { MedicationCategory, ScheduleType } from '../src/db';
import { medicationService } from '../src/db';
import { useAppStore } from '../src/stores';

const DOSAGE_UNITS = ['mg', 'ml', 'tablet', 'capsule', 'drop', 'puff', 'patch', 'injection'];
const SCHEDULE_TYPES: ScheduleType[] = [
  'once_daily',
  'twice_daily',
  'three_times_daily',
  'every_x_hours',
  'custom_times',
  'as_needed',
];

const DEFAULT_TIMES: Record<string, string[]> = {
  once_daily: ['08:00'],
  twice_daily: ['08:00', '20:00'],
  three_times_daily: ['08:00', '14:00', '20:00'],
  every_x_hours: [],
  custom_times: [],
  as_needed: [],
};

export default function MedicationFormScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { medId } = useLocalSearchParams<{ medId?: string }>();
  const activeProfile = useAppStore((s) => s.activeProfile);

  const [name, setName] = useState('');
  const [dosageValue, setDosageValue] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [category, setCategory] = useState<MedicationCategory>('routine');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('once_daily');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [intervalHours, setIntervalHours] = useState('8');
  const [notes, setNotes] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);

  const isEditing = Boolean(medId);

  const loadMedication = useCallback(async (): Promise<void> => {
    if (!medId || !activeProfile) return;
    const all = await medicationService.getAllForProfile(activeProfile.id);
    const found = all.find((m) => m.medication.id === medId);
    if (!found) return;
    const { medication, schedule } = found;
    setName(medication.name);
    setDosageValue(String(medication.dosageValue));
    setDosageUnit(medication.dosageUnit);
    setCategory(medication.category);
    setNotes(medication.notes ?? '');
    if (schedule) {
      setScheduleType(schedule.type);
      setTimes(schedule.times);
      if (schedule.intervalHours) setIntervalHours(String(schedule.intervalHours));
    }
  }, [medId, activeProfile]);

  useEffect(() => {
    loadMedication();
  }, [loadMedication]);

  const handleScheduleTypeChange = (type: ScheduleType): void => {
    setScheduleType(type);
    const defaults = DEFAULT_TIMES[type];
    if (defaults) setTimes(defaults);
  };

  const handleTimeChange = (_event: unknown, date?: Date): void => {
    setShowTimePicker(Platform.OS === 'ios');
    if (!date) return;
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    if (editingTimeIndex !== null) {
      setTimes((prev) => prev.map((t, i) => (i === editingTimeIndex ? timeStr : t)));
      setEditingTimeIndex(null);
    } else {
      setTimes((prev) => [...prev, timeStr].sort());
    }
  };

  const handleRemoveTime = (index: number): void => {
    setTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (): Promise<void> => {
    if (!name.trim() || !dosageValue || !activeProfile) return;

    const today = new Date().toISOString().split('T')[0] ?? '';

    if (isEditing && medId) {
      await medicationService.update(medId, {
        name,
        dosageValue: Number(dosageValue),
        dosageUnit,
        category,
        notes: notes || null,
        scheduleType,
        times,
        intervalHours: scheduleType === 'every_x_hours' ? Number(intervalHours) : null,
      });
    } else {
      await medicationService.create({
        profileId: activeProfile.id,
        name,
        dosageValue: Number(dosageValue),
        dosageUnit,
        category,
        scheduleType,
        times,
        intervalHours: scheduleType === 'every_x_hours' ? Number(intervalHours) : undefined,
        startDate: today,
      });
    }
    router.back();
  };

  const handleArchive = (): void => {
    if (!medId) return;
    Alert.alert(t('medications.archive'), t('medications.archiveConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('medications.archive'),
        onPress: async () => {
          await medicationService.archive(medId);
          router.back();
        },
      },
    ]);
  };

  const showTimeChips = scheduleType !== 'as_needed' && scheduleType !== 'every_x_hours';
  const canSave = name.trim().length > 0 && Number(dosageValue) > 0;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Text style={styles.backButton}>‹ {t('common.back')}</Text>
          </Pressable>
          <Text style={styles.title}>
            {isEditing ? t('medications.editMedication') : t('medications.addMedication')}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Name */}
          <Text style={styles.label}>{t('medications.name')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('medications.namePlaceholder')}
            placeholderTextColor="#B0B0B0"
          />

          {/* Dosage */}
          <Text style={styles.label}>{t('medications.dosage')}</Text>
          <View style={styles.dosageRow}>
            <TextInput
              style={[styles.input, styles.dosageInput]}
              value={dosageValue}
              onChangeText={setDosageValue}
              placeholder={t('medications.dosageValue')}
              placeholderTextColor="#B0B0B0"
              keyboardType="numeric"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
              <View style={styles.chipRow}>
                {DOSAGE_UNITS.map((unit) => (
                  <Pressable
                    key={unit}
                    style={[styles.chip, dosageUnit === unit && styles.chipSelected]}
                    onPress={() => setDosageUnit(unit)}
                  >
                    <Text style={[styles.chipText, dosageUnit === unit && styles.chipTextSelected]}>
                      {t(`medications.units.${unit}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Category */}
          <Text style={styles.label}>{t('medications.category')}</Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.chip, category === 'routine' && styles.chipSelected]}
              onPress={() => setCategory('routine')}
            >
              <Text style={[styles.chipText, category === 'routine' && styles.chipTextSelected]}>
                {t('medications.routine')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.chip, category === 'as_needed' && styles.chipSelected]}
              onPress={() => setCategory('as_needed')}
            >
              <Text style={[styles.chipText, category === 'as_needed' && styles.chipTextSelected]}>
                {t('medications.asNeeded')}
              </Text>
            </Pressable>
          </View>

          {/* Schedule Type */}
          <Text style={styles.label}>{t('medications.scheduleType')}</Text>
          <View style={styles.chipWrap}>
            {SCHEDULE_TYPES.map((type) => (
              <Pressable
                key={type}
                style={[styles.chip, scheduleType === type && styles.chipSelected]}
                onPress={() => handleScheduleTypeChange(type)}
              >
                <Text style={[styles.chipText, scheduleType === type && styles.chipTextSelected]}>
                  {t(`medications.scheduleTypes.${type}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Interval hours (for every_x_hours) */}
          {scheduleType === 'every_x_hours' && (
            <>
              <Text style={styles.label}>{t('medications.intervalHours')}</Text>
              <TextInput
                style={[styles.input, styles.smallInput]}
                value={intervalHours}
                onChangeText={setIntervalHours}
                keyboardType="numeric"
                maxLength={2}
              />
            </>
          )}

          {/* Time Chips */}
          {showTimeChips && (
            <>
              <Text style={styles.label}>{t('medications.times')}</Text>
              <View style={styles.timeChipsContainer}>
                {times.map((time, index) => (
                  <View key={time} style={styles.timeChip}>
                    <Pressable
                      onPress={() => {
                        setEditingTimeIndex(index);
                        setShowTimePicker(true);
                      }}
                    >
                      <Text style={styles.timeChipText}>{time}</Text>
                    </Pressable>
                    {times.length > 1 && (
                      <Pressable
                        onPress={() => handleRemoveTime(index)}
                        style={styles.timeChipRemove}
                      >
                        <Text style={styles.timeChipRemoveText}>×</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
                {scheduleType === 'custom_times' && (
                  <Pressable
                    style={styles.addTimeButton}
                    onPress={() => {
                      setEditingTimeIndex(null);
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={styles.addTimeText}>+ {t('medications.addTime')}</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}

          {showTimePicker && (
            <DateTimePicker
              mode="time"
              is24Hour
              value={(() => {
                const d = new Date();
                if (editingTimeIndex !== null) {
                  const existing = times[editingTimeIndex];
                  if (existing) {
                    const [h, m] = existing.split(':').map(Number);
                    if (h !== undefined && m !== undefined) d.setHours(h, m, 0, 0);
                  }
                }
                return d;
              })()}
              onChange={handleTimeChange}
            />
          )}

          {/* Notes */}
          <Text style={styles.label}>{t('medications.notes')}</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('medications.notesPlaceholder')}
            placeholderTextColor="#B0B0B0"
            multiline
            numberOfLines={3}
          />

          {/* Save */}
          <Pressable
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={() => void handleSave()}
            disabled={!canSave}
          >
            <Text style={styles.saveText}>{t('medications.save')}</Text>
          </Pressable>

          {/* Archive (edit only) */}
          {isEditing && (
            <Pressable style={styles.archiveButton} onPress={handleArchive}>
              <Text style={styles.archiveText}>{t('medications.archive')}</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
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
    paddingBottom: theme.spacing.xxl,
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
  dosageRow: {
    gap: theme.spacing.sm,
  },
  dosageInput: {
    marginBottom: theme.spacing.sm,
  },
  unitScroll: {
    flexGrow: 0,
  },
  smallInput: {
    width: 80,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
  timeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  timeChipText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  timeChipRemove: {
    marginLeft: theme.spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeChipRemoveText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.bold,
  },
  addTimeButton: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  addTimeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
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
  archiveButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  archiveText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.warning,
    fontWeight: theme.fontWeight.semibold,
  },
}));
