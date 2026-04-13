import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { SymptomRow } from '../src/db';
import { symptomService } from '../src/db';
import { safeAsync } from '../src/helpers/safeAsync';
import { useAppStore } from '../src/stores';

const SEVERITY_COLORS = [
  '#4A9B8E',
  '#5BB8A9',
  '#8AADA5',
  '#A8C76C',
  '#C8D44A',
  '#E0C840',
  '#E0A840',
  '#D48040',
  '#C06040',
  '#B04040',
];

export default function SymptomsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const [symptoms, setSymptoms] = useState<SymptomRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [severity, setSeverity] = useState(5);
  const [note, setNote] = useState('');

  const loadSymptoms = useCallback(async (): Promise<void> => {
    if (!activeProfile) return;
    await safeAsync(async () => {
      const rows = await symptomService.getForProfile(activeProfile.id);
      setSymptoms(rows);
    }, t('common.error'));
  }, [activeProfile, t]);

  useFocusEffect(
    useCallback(() => {
      loadSymptoms();
    }, [loadSymptoms]),
  );

  const handleSave = async (): Promise<void> => {
    if (!name.trim() || !activeProfile) return;
    await safeAsync(async () => {
      await symptomService.create({
        profileId: activeProfile.id,
        name: name.trim(),
        severity,
        note: note.trim() || undefined,
      });
      setName('');
      setSeverity(5);
      setNote('');
      setShowForm(false);
      await loadSymptoms();
    }, t('common.error'));
  };

  const handleDelete = (id: string): void => {
    Alert.alert(t('symptoms.delete'), t('symptoms.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('symptoms.delete'),
        style: 'destructive',
        onPress: () =>
          void safeAsync(async () => {
            await symptomService.remove(id);
            await loadSymptoms();
          }, t('common.error')),
      },
    ]);
  };

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>‹ {t('common.back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('symptoms.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {showForm ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>{t('symptoms.logSymptom')}</Text>

            <Text style={styles.label}>{t('symptoms.name')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('symptoms.namePlaceholder')}
              placeholderTextColor="#B0B0B0"
            />

            <Text style={styles.label}>
              {t('symptoms.severity')}: {severity}/10 — {t(`symptoms.severityLabels.${severity}`)}
            </Text>
            <View style={styles.severityRow}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <Pressable
                  key={n}
                  style={[
                    styles.severityDot,
                    { backgroundColor: severity >= n ? SEVERITY_COLORS[n - 1] : '#E0E0E0' },
                  ]}
                  onPress={() => setSeverity(n)}
                >
                  <Text style={styles.severityNumber}>{n}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>{t('symptoms.note')}</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder={t('symptoms.notePlaceholder')}
              placeholderTextColor="#B0B0B0"
              multiline
              numberOfLines={3}
            />

            <View style={styles.formActions}>
              <Pressable style={styles.cancelButton} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]}
                onPress={() => void handleSave()}
                disabled={!name.trim()}
              >
                <Text style={styles.saveText}>{t('symptoms.save')}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.addButton} onPress={() => setShowForm(true)}>
            <Text style={styles.addButtonText}>+ {t('symptoms.logSymptom')}</Text>
          </Pressable>
        )}

        {symptoms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('symptoms.recent')}</Text>
            {symptoms.map((symptom) => (
              <Pressable
                key={symptom.id}
                style={styles.symptomCard}
                onLongPress={() => handleDelete(symptom.id)}
              >
                <View style={styles.symptomHeader}>
                  <Text style={styles.symptomName}>{symptom.name}</Text>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: SEVERITY_COLORS[symptom.severity - 1] ?? '#999' },
                    ]}
                  >
                    <Text style={styles.severityBadgeText}>{symptom.severity}/10</Text>
                  </View>
                </View>
                {symptom.note && <Text style={styles.symptomNote}>{symptom.note}</Text>}
                <Text style={styles.symptomDate}>{formatDate(symptom.loggedAt)}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {symptoms.length === 0 && !showForm && (
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={48} color="#8AADA5" />
            <Text style={styles.emptyText}>{t('symptoms.empty')}</Text>
            <Text style={styles.emptyHint}>{t('symptoms.emptyHint')}</Text>
          </View>
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
    paddingBottom: theme.spacing.xxl,
  },
  form: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  formTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  noteInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  severityDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityNumber: {
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
    color: '#FFF',
  },
  formActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textOnPrimary,
    fontWeight: theme.fontWeight.bold,
  },
  addButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  section: {
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  symptomCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  symptomName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  severityBadge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  severityBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: '#FFF',
  },
  symptomNote: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  symptomDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
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
  },
}));
