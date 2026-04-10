import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { medicationService } from '../src/db';
import { scheduleAllNotifications } from '../src/services/notification.service';
import { useAppStore } from '../src/stores';
import {
  DOSAGE_UNITS,
  type MedicationFormData,
  medicationSchema,
  SCHEDULE_TYPES,
} from '../src/validation/medication.schema';

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
  const isEditing = Boolean(medId);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: '',
      dosageValue: undefined,
      dosageUnit: 'mg',
      category: 'routine',
      scheduleType: 'once_daily',
      times: ['08:00'],
      intervalHours: 8,
      notes: '',
    },
    mode: 'onChange',
  });

  const scheduleType = watch('scheduleType');
  const times = watch('times');
  const dosageUnit = watch('dosageUnit');
  const category = watch('category');
  const intervalHours = watch('intervalHours');

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);

  const loadMedication = useCallback(async (): Promise<void> => {
    if (!medId || !activeProfile) return;
    const all = await medicationService.getAllForProfile(activeProfile.id);
    const found = all.find((m) => m.medication.id === medId);
    if (!found) return;
    const { medication, schedule } = found;
    reset({
      name: medication.name,
      dosageValue: medication.dosageValue,
      dosageUnit: medication.dosageUnit as MedicationFormData['dosageUnit'],
      category: medication.category as MedicationFormData['category'],
      scheduleType: (schedule?.type as MedicationFormData['scheduleType']) ?? 'once_daily',
      times: schedule?.times ?? ['08:00'],
      intervalHours: schedule?.intervalHours ?? 8,
      notes: medication.notes ?? '',
    });
  }, [medId, activeProfile, reset]);

  useEffect(() => {
    loadMedication();
  }, [loadMedication]);

  const handleScheduleTypeChange = (type: MedicationFormData['scheduleType']): void => {
    setValue('scheduleType', type, { shouldValidate: true });
    const defaults = DEFAULT_TIMES[type];
    if (defaults) setValue('times', defaults);
  };

  const [pendingTime, setPendingTime] = useState<Date | null>(null);

  const handleTimeChange = (_event: unknown, date?: Date): void => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (!date) return;

    if (Platform.OS === 'ios') {
      // On iOS, just store pending value — apply on "Done"
      setPendingTime(date);
      return;
    }

    // Android: apply immediately
    applyTime(date);
  };

  const applyTime = (date: Date): void => {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    if (editingTimeIndex !== null) {
      const updated = times.map((t, i) => (i === editingTimeIndex ? timeStr : t));
      setValue('times', updated);
    } else {
      setValue('times', [...times, timeStr].sort());
    }
  };

  const handleTimePickerDone = (): void => {
    if (pendingTime) {
      applyTime(pendingTime);
    }
    setPendingTime(null);
    setEditingTimeIndex(null);
    setShowTimePicker(false);
  };

  const handleRemoveTime = (index: number): void => {
    setValue(
      'times',
      times.filter((_, i) => i !== index),
    );
  };

  const onSubmit = async (data: MedicationFormData): Promise<void> => {
    if (!activeProfile) return;

    const today = new Date().toISOString().split('T')[0] ?? '';

    if (isEditing && medId) {
      await medicationService.update(medId, {
        name: data.name,
        dosageValue: data.dosageValue,
        dosageUnit: data.dosageUnit,
        category: data.category,
        notes: data.notes || null,
        scheduleType: data.scheduleType,
        times: data.times,
        intervalHours: data.scheduleType === 'every_x_hours' ? data.intervalHours : null,
      });
    } else {
      await medicationService.create({
        profileId: activeProfile.id,
        name: data.name,
        dosageValue: data.dosageValue,
        dosageUnit: data.dosageUnit,
        category: data.category,
        scheduleType: data.scheduleType,
        times: data.times,
        intervalHours: data.scheduleType === 'every_x_hours' ? data.intervalHours : undefined,
        startDate: today,
        notes: data.notes || undefined,
      });
    }

    // Reschedule all notifications after medication change
    const allMeds = await medicationService.getAllForProfile(activeProfile.id);
    await scheduleAllNotifications(allMeds, activeProfile.id);

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
          if (activeProfile) {
            const allMeds = await medicationService.getAllForProfile(activeProfile.id);
            await scheduleAllNotifications(allMeds, activeProfile.id);
          }
          router.back();
        },
      },
    ]);
  };

  const showTimeChips = scheduleType !== 'as_needed' && scheduleType !== 'every_x_hours';

  return (
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
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t('medications.namePlaceholder')}
              placeholderTextColor="#B0B0B0"
            />
          )}
        />
        {errors.name && <Text style={styles.errorText}>{t(errors.name.message ?? '')}</Text>}

        {/* Dosage */}
        <Text style={styles.label}>{t('medications.dosage')}</Text>
        <View style={styles.dosageRow}>
          <Controller
            control={control}
            name="dosageValue"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.dosageInput, errors.dosageValue && styles.inputError]}
                value={value !== undefined ? String(value) : ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t('medications.dosageValue')}
                placeholderTextColor="#B0B0B0"
                keyboardType="numeric"
              />
            )}
          />
          {errors.dosageValue && (
            <Text style={styles.errorText}>{t(errors.dosageValue.message ?? '')}</Text>
          )}
          <View style={styles.chipRow}>
            {DOSAGE_UNITS.map((unit) => (
              <Pressable
                key={unit}
                style={[styles.chip, dosageUnit === unit && styles.chipSelected]}
                onPress={() => setValue('dosageUnit', unit, { shouldValidate: true })}
              >
                <Text style={[styles.chipText, dosageUnit === unit && styles.chipTextSelected]}>
                  {t(`medications.units.${unit}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Category */}
        <Text style={styles.label}>{t('medications.category')}</Text>
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, category === 'routine' && styles.chipSelected]}
            onPress={() => setValue('category', 'routine', { shouldValidate: true })}
          >
            <Text style={[styles.chipText, category === 'routine' && styles.chipTextSelected]}>
              {t('medications.routine')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.chip, category === 'as_needed' && styles.chipSelected]}
            onPress={() => setValue('category', 'as_needed', { shouldValidate: true })}
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
                {type === 'every_x_hours'
                  ? t('medications.scheduleTypes.every_x_hours', { hours: intervalHours ?? 8 })
                  : t(`medications.scheduleTypes.${type}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Interval hours (for every_x_hours) */}
        {scheduleType === 'every_x_hours' && (
          <>
            <Text style={styles.label}>{t('medications.intervalHours')}</Text>
            <Controller
              control={control}
              name="intervalHours"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    styles.smallInput,
                    errors.intervalHours && styles.inputError,
                  ]}
                  value={value !== undefined ? String(value) : ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  maxLength={2}
                />
              )}
            />
            {errors.intervalHours && (
              <Text style={styles.errorText}>{t(errors.intervalHours.message ?? '')}</Text>
            )}
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
          <View style={styles.pickerContainer}>
            <DateTimePicker
              mode="time"
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              value={(() => {
                if (pendingTime) return pendingTime;
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
            {Platform.OS === 'ios' && (
              <Pressable style={styles.pickerDoneButton} onPress={handleTimePickerDone}>
                <Text style={styles.pickerDoneText}>{t('common.confirm')}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Notes */}
        <Text style={styles.label}>{t('medications.notes')}</Text>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t('medications.notesPlaceholder')}
              placeholderTextColor="#B0B0B0"
              multiline
              numberOfLines={3}
            />
          )}
        />

        {/* Save */}
        <Pressable
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          onPress={handleSubmit((data) => void onSubmit(data))}
          disabled={!isValid}
        >
          <Text style={styles.saveText}>{t('medications.save')}</Text>
        </Pressable>

        {isEditing && (
          <Pressable style={styles.archiveButton} onPress={handleArchive}>
            <Text style={styles.archiveText}>{t('medications.archive')}</Text>
          </Pressable>
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
  inputError: {
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
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
    flexWrap: 'wrap',
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
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  pickerDoneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  pickerDoneText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textOnPrimary,
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
