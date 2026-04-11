import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { BloodType, ProfileRow } from '../src/db';
import { profileService } from '../src/db';

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];

export default function ProfileHealthScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bloodType, setBloodType] = useState<BloodType | null>(null);
  const [allergiesText, setAllergiesText] = useState('');
  const [conditionsText, setConditionsText] = useState('');

  const load = useCallback(async (): Promise<void> => {
    if (!profileId) return;
    const row = await profileService.getById(profileId);
    if (!row) return;
    setProfile(row);
    setDateOfBirth(row.dateOfBirth);
    setWeight(row.weightKg !== null ? String(row.weightKg) : '');
    setHeight(row.heightCm !== null ? String(row.heightCm) : '');
    setBloodType(row.bloodType);
    setAllergiesText(row.allergies.join(', '));
    setConditionsText(row.chronicConditions.join(', '));
  }, [profileId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDateChange = (_event: unknown, date?: Date): void => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (!date) return;
    const iso = date.toISOString().split('T')[0] ?? null;
    setDateOfBirth(iso);
  };

  const parseList = (text: string): string[] =>
    text
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  const handleSave = async (): Promise<void> => {
    if (!profileId) return;
    const weightNum = weight ? Number(weight) : null;
    const heightNum = height ? Number(height) : null;

    await profileService.update(profileId, {
      dateOfBirth,
      weightKg: weightNum !== null && !Number.isNaN(weightNum) ? weightNum : null,
      heightCm: heightNum !== null && !Number.isNaN(heightNum) ? heightNum : null,
      bloodType,
      allergies: parseList(allergiesText),
      chronicConditions: parseList(conditionsText),
    });

    router.back();
  };

  const insets = useSafeAreaInsets();

  if (!profile) {
    return <SafeAreaView style={styles.container} />;
  }

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
        <Text style={styles.title}>{t('profileHealth.title')}</Text>
        <Text style={styles.subtitle}>{profile.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Date of birth */}
        <Text style={styles.label}>{t('profileHealth.dateOfBirth')}</Text>
        <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.inputText, !dateOfBirth && styles.inputPlaceholder]}>
            {dateOfBirth ?? t('profileHealth.dateOfBirthPlaceholder')}
          </Text>
        </Pressable>
        {showDatePicker && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              value={dateOfBirth ? new Date(dateOfBirth) : new Date(1990, 0, 1)}
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
            {Platform.OS === 'ios' && (
              <Pressable style={styles.pickerDoneButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerDoneText}>{t('common.confirm')}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Weight */}
        <Text style={styles.label}>{t('profileHealth.weight')}</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          placeholder={t('profileHealth.weightPlaceholder')}
          placeholderTextColor="#B0B0B0"
          keyboardType="numeric"
        />

        {/* Height */}
        <Text style={styles.label}>{t('profileHealth.height')}</Text>
        <TextInput
          style={styles.input}
          value={height}
          onChangeText={setHeight}
          placeholder={t('profileHealth.heightPlaceholder')}
          placeholderTextColor="#B0B0B0"
          keyboardType="numeric"
        />

        {/* Blood type */}
        <Text style={styles.label}>{t('profileHealth.bloodType')}</Text>
        <View style={styles.chipWrap}>
          {BLOOD_TYPES.map((type) => (
            <Pressable
              key={type}
              style={[styles.chip, bloodType === type && styles.chipSelected]}
              onPress={() => setBloodType(type)}
            >
              <Text style={[styles.chipText, bloodType === type && styles.chipTextSelected]}>
                {type === 'unknown' ? t('profileHealth.bloodTypeUnknown') : type}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Allergies */}
        <Text style={styles.label}>{t('profileHealth.allergies')}</Text>
        <Text style={styles.hint}>{t('profileHealth.commaSeparated')}</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={allergiesText}
          onChangeText={setAllergiesText}
          placeholder={t('profileHealth.allergiesPlaceholder')}
          placeholderTextColor="#B0B0B0"
          multiline
          numberOfLines={2}
        />

        {/* Chronic conditions */}
        <Text style={styles.label}>{t('profileHealth.chronicConditions')}</Text>
        <Text style={styles.hint}>{t('profileHealth.commaSeparated')}</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={conditionsText}
          onChangeText={setConditionsText}
          placeholder={t('profileHealth.chronicConditionsPlaceholder')}
          placeholderTextColor="#B0B0B0"
          multiline
          numberOfLines={3}
        />

        {/* Save */}
        <Pressable style={styles.saveButton} onPress={() => void handleSave()}>
          <Text style={styles.saveText}>{t('profileHealth.save')}</Text>
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
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
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
  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
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
  saveText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textOnPrimary,
    fontWeight: theme.fontWeight.bold,
  },
}));
