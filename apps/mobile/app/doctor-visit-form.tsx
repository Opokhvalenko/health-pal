import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { SymptomSnapshot } from '../src/db';
import { doctorVisitService, symptomService } from '../src/db';
import { safeAsync } from '../src/helpers/safeAsync';
import { useAppStore } from '../src/stores';

const SYMPTOM_LOOKBACK_DAYS = 30;

export default function DoctorVisitFormScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { visitId } = useLocalSearchParams<{ visitId?: string }>();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const insets = useSafeAreaInsets();

  const isEditing = Boolean(visitId);

  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [visitDate, setVisitDate] = useState<string>(
    () => new Date().toISOString().split('T')[0] ?? '',
  );
  const [showVisitDatePicker, setShowVisitDatePicker] = useState(false);
  const [reason, setReason] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [prescriptions, setPrescriptions] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState<string | null>(null);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [recentSymptoms, setRecentSymptoms] = useState<SymptomSnapshot[]>([]);
  const [snapshotSaved, setSnapshotSaved] = useState<SymptomSnapshot[] | null>(null);

  // Load visit (if editing) and recent symptoms
  const load = useCallback(async (): Promise<void> => {
    if (!activeProfile) return;
    await safeAsync(async () => {
      // Load recent symptoms (last 30 days) for prep
      const allSymptoms = await symptomService.getForProfile(activeProfile.id, 100);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - SYMPTOM_LOOKBACK_DAYS);
      const recent: SymptomSnapshot[] = allSymptoms
        .filter((s) => new Date(s.loggedAt) >= cutoff)
        .map((s) => ({ name: s.name, severity: s.severity, loggedAt: s.loggedAt }));
      setRecentSymptoms(recent);

      // Load existing visit if editing
      if (visitId) {
        const visit = await doctorVisitService.getById(visitId);
        if (visit) {
          setDoctorName(visit.doctorName);
          setSpecialty(visit.specialty ?? '');
          setVisitDate(visit.visitDate);
          setReason(visit.reason ?? '');
          setRecommendations(visit.recommendations ?? '');
          setPrescriptions(visit.prescriptions ?? '');
          setNextVisitDate(visit.nextVisitDate);
          setNotes(visit.notes ?? '');
          setSnapshotSaved(visit.symptomsSnapshot);
        }
      }
    }, t('common.error'));
  }, [activeProfile, visitId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (): Promise<void> => {
    if (!activeProfile || !doctorName.trim() || !visitDate) return;
    await safeAsync(async () => {
      // Use saved snapshot when editing, otherwise capture current recent symptoms
      const snapshot = snapshotSaved ?? recentSymptoms;

      if (isEditing && visitId) {
        await doctorVisitService.update(visitId, {
          doctorName,
          specialty: specialty.trim() || null,
          visitDate,
          reason: reason.trim() || null,
          recommendations: recommendations.trim() || null,
          prescriptions: prescriptions.trim() || null,
          nextVisitDate: nextVisitDate ?? null,
          notes: notes.trim() || null,
          symptomsSnapshot: snapshot,
        });
      } else {
        await doctorVisitService.create({
          profileId: activeProfile.id,
          doctorName,
          specialty: specialty.trim() || undefined,
          visitDate,
          reason: reason.trim() || undefined,
          recommendations: recommendations.trim() || undefined,
          prescriptions: prescriptions.trim() || undefined,
          nextVisitDate: nextVisitDate ?? undefined,
          notes: notes.trim() || undefined,
          symptomsSnapshot: snapshot,
        });
      }
      router.back();
    }, t('common.error'));
  };

  const handleDelete = (): void => {
    if (!visitId) return;
    Alert.alert(t('doctorVisits.deleteTitle'), t('doctorVisits.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('doctorVisits.delete'),
        style: 'destructive',
        onPress: () =>
          void safeAsync(async () => {
            await doctorVisitService.remove(visitId);
            router.back();
          }, t('common.error')),
      },
    ]);
  };

  const onVisitDateChange = (_event: unknown, date?: Date): void => {
    setShowVisitDatePicker(Platform.OS === 'ios');
    if (date) {
      setVisitDate(date.toISOString().split('T')[0] ?? '');
    }
  };

  const onNextDateChange = (_event: unknown, date?: Date): void => {
    setShowNextDatePicker(Platform.OS === 'ios');
    if (date) {
      setNextVisitDate(date.toISOString().split('T')[0] ?? '');
    }
  };

  const canSave = doctorName.trim().length > 0 && visitDate.length > 0;
  const symptomsToShow = snapshotSaved ?? recentSymptoms;

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
        <Text style={styles.title}>
          {isEditing ? t('doctorVisits.editTitle') : t('doctorVisits.addTitle')}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Doctor name */}
          <Text style={styles.label}>{t('doctorVisits.doctorName')}</Text>
          <TextInput
            style={styles.input}
            value={doctorName}
            onChangeText={setDoctorName}
            placeholder={t('doctorVisits.doctorNamePlaceholder')}
            placeholderTextColor="#B0B0B0"
          />

          {/* Specialty */}
          <Text style={styles.label}>{t('doctorVisits.specialty')}</Text>
          <TextInput
            style={styles.input}
            value={specialty}
            onChangeText={setSpecialty}
            placeholder={t('doctorVisits.specialtyPlaceholder')}
            placeholderTextColor="#B0B0B0"
          />

          {/* Visit date */}
          <Text style={styles.label}>{t('doctorVisits.visitDate')}</Text>
          <Pressable style={styles.input} onPress={() => setShowVisitDatePicker(true)}>
            <Text style={styles.inputText}>{visitDate}</Text>
          </Pressable>
          {showVisitDatePicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                value={new Date(visitDate)}
                onChange={onVisitDateChange}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  style={styles.pickerDoneButton}
                  onPress={() => setShowVisitDatePicker(false)}
                >
                  <Text style={styles.pickerDoneText}>{t('common.confirm')}</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Reason */}
          <Text style={styles.label}>{t('doctorVisits.reason')}</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={reason}
            onChangeText={setReason}
            placeholder={t('doctorVisits.reasonPlaceholder')}
            placeholderTextColor="#B0B0B0"
            multiline
          />

          {/* Pre-visit prep: recent symptoms */}
          <Text style={styles.label}>{t('doctorVisits.recentSymptoms')}</Text>
          <Text style={styles.hint}>{t('doctorVisits.recentSymptomsHint')}</Text>
          <View style={styles.symptomBox}>
            {symptomsToShow.length === 0 ? (
              <Text style={styles.symptomEmpty}>{t('doctorVisits.noRecentSymptoms')}</Text>
            ) : (
              symptomsToShow.map((s) => (
                <View key={`${s.name}-${s.loggedAt}`} style={styles.symptomRow}>
                  <Text style={styles.symptomName}>{s.name}</Text>
                  <View style={styles.symptomMeta}>
                    <Text style={styles.symptomSeverity}>{s.severity}/10</Text>
                    <Text style={styles.symptomDate}>
                      {new Date(s.loggedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Recommendations */}
          <Text style={styles.label}>{t('doctorVisits.recommendations')}</Text>
          <Text style={styles.hint}>{t('doctorVisits.recommendationsHint')}</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={recommendations}
            onChangeText={setRecommendations}
            placeholder={t('doctorVisits.recommendationsPlaceholder')}
            placeholderTextColor="#B0B0B0"
            multiline
            numberOfLines={4}
          />

          {/* Prescriptions */}
          <Text style={styles.label}>{t('doctorVisits.prescriptions')}</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={prescriptions}
            onChangeText={setPrescriptions}
            placeholder={t('doctorVisits.prescriptionsPlaceholder')}
            placeholderTextColor="#B0B0B0"
            multiline
            numberOfLines={3}
          />

          {/* Next visit date */}
          <Text style={styles.label}>{t('doctorVisits.nextVisitDate')}</Text>
          <View style={styles.row}>
            <Pressable
              style={[styles.input, styles.flex1]}
              onPress={() => setShowNextDatePicker(true)}
            >
              <Text style={[styles.inputText, !nextVisitDate && styles.inputPlaceholder]}>
                {nextVisitDate ?? t('doctorVisits.nextVisitPlaceholder')}
              </Text>
            </Pressable>
            {nextVisitDate && (
              <Pressable
                style={styles.clearButton}
                onPress={() => setNextVisitDate(null)}
                accessibilityLabel={t('common.cancel')}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </Pressable>
            )}
          </View>
          {showNextDatePicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                value={nextVisitDate ? new Date(nextVisitDate) : new Date()}
                minimumDate={new Date()}
                onChange={onNextDateChange}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  style={styles.pickerDoneButton}
                  onPress={() => setShowNextDatePicker(false)}
                >
                  <Text style={styles.pickerDoneText}>{t('common.confirm')}</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Notes */}
          <Text style={styles.label}>{t('doctorVisits.notes')}</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('doctorVisits.notesPlaceholder')}
            placeholderTextColor="#B0B0B0"
            multiline
            numberOfLines={3}
          />

          <Pressable
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={() => void handleSave()}
            disabled={!canSave}
          >
            <Text style={styles.saveText}>{t('doctorVisits.save')}</Text>
          </Pressable>

          {isEditing && (
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteText}>{t('doctorVisits.delete')}</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
    marginTop: -theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  inputText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  inputPlaceholder: {
    color: '#B0B0B0',
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
  symptomBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  symptomEmpty: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  symptomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  symptomName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    flex: 1,
  },
  symptomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  symptomSeverity: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  symptomDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
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
  deleteButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  deleteText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.semibold,
  },
}));
