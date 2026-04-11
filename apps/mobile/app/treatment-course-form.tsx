import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { treatmentCourseService } from '../src/db';
import { useAppStore } from '../src/stores';

export default function TreatmentCourseFormScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(courseId);

  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState<string>(
    () => new Date().toISOString().split('T')[0] ?? '',
  );
  const [endDate, setEndDate] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    if (!courseId) return;
    const course = await treatmentCourseService.getById(courseId);
    if (!course) return;
    setTitle(course.title);
    setReason(course.reason ?? '');
    setStartDate(course.startDate);
    setEndDate(course.endDate);
    setNotes(course.notes ?? '');
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (): Promise<void> => {
    if (!activeProfile || !title.trim()) return;

    if (isEditing && courseId) {
      await treatmentCourseService.update(courseId, {
        title,
        reason: reason.trim() || null,
        startDate,
        endDate: endDate ?? null,
        notes: notes.trim() || null,
      });
    } else {
      await treatmentCourseService.create({
        profileId: activeProfile.id,
        title,
        reason: reason.trim() || undefined,
        startDate,
        endDate: endDate ?? undefined,
        notes: notes.trim() || undefined,
      });
    }
    router.back();
  };

  const handleComplete = async (): Promise<void> => {
    if (!courseId) return;
    const today = new Date().toISOString().split('T')[0] ?? '';
    await treatmentCourseService.complete(courseId, today);
    setEndDate(today);
  };

  const handleDelete = (): void => {
    if (!courseId) return;
    Alert.alert(t('treatmentCourses.deleteTitle'), t('treatmentCourses.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('treatmentCourses.delete'),
        style: 'destructive',
        onPress: async () => {
          await treatmentCourseService.remove(courseId);
          router.back();
        },
      },
    ]);
  };

  const onStartDateChange = (_event: unknown, date?: Date): void => {
    setShowStartPicker(Platform.OS === 'ios');
    if (date) setStartDate(date.toISOString().split('T')[0] ?? '');
  };

  const onEndDateChange = (_event: unknown, date?: Date): void => {
    setShowEndPicker(Platform.OS === 'ios');
    if (date) setEndDate(date.toISOString().split('T')[0] ?? '');
  };

  const canSave = title.trim().length > 0 && startDate.length > 0;

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
          {isEditing ? t('treatmentCourses.editTitle') : t('treatmentCourses.addTitle')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>{t('treatmentCourses.courseTitle')}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={t('treatmentCourses.titlePlaceholder')}
          placeholderTextColor="#B0B0B0"
        />

        <Text style={styles.label}>{t('treatmentCourses.reason')}</Text>
        <TextInput
          style={styles.input}
          value={reason}
          onChangeText={setReason}
          placeholder={t('treatmentCourses.reasonPlaceholder')}
          placeholderTextColor="#B0B0B0"
        />

        <Text style={styles.label}>{t('treatmentCourses.startDate')}</Text>
        <Pressable style={styles.input} onPress={() => setShowStartPicker(true)}>
          <Text style={styles.inputText}>{startDate}</Text>
        </Pressable>
        {showStartPicker && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              value={new Date(startDate)}
              onChange={onStartDateChange}
            />
            {Platform.OS === 'ios' && (
              <Pressable style={styles.pickerDoneButton} onPress={() => setShowStartPicker(false)}>
                <Text style={styles.pickerDoneText}>{t('common.confirm')}</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text style={styles.label}>{t('treatmentCourses.endDate')}</Text>
        <View style={styles.row}>
          <Pressable style={[styles.input, styles.flex1]} onPress={() => setShowEndPicker(true)}>
            <Text style={[styles.inputText, !endDate && styles.placeholder]}>
              {endDate ?? t('treatmentCourses.ongoing')}
            </Text>
          </Pressable>
          {endDate && (
            <Pressable style={styles.clearButton} onPress={() => setEndDate(null)}>
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          )}
        </View>
        {showEndPicker && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              value={endDate ? new Date(endDate) : new Date()}
              minimumDate={new Date(startDate)}
              onChange={onEndDateChange}
            />
            {Platform.OS === 'ios' && (
              <Pressable style={styles.pickerDoneButton} onPress={() => setShowEndPicker(false)}>
                <Text style={styles.pickerDoneText}>{t('common.confirm')}</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text style={styles.label}>{t('treatmentCourses.notes')}</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('treatmentCourses.notesPlaceholder')}
          placeholderTextColor="#B0B0B0"
          multiline
          numberOfLines={3}
        />

        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={() => void handleSave()}
          disabled={!canSave}
        >
          <Text style={styles.saveText}>{t('treatmentCourses.save')}</Text>
        </Pressable>

        {isEditing && endDate === null && (
          <Pressable style={styles.completeButton} onPress={() => void handleComplete()}>
            <Text style={styles.completeText}>{t('treatmentCourses.markComplete')}</Text>
          </Pressable>
        )}

        {isEditing && (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>{t('treatmentCourses.delete')}</Text>
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
  inputText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  placeholder: {
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
  completeButton: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  completeText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.semibold,
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
