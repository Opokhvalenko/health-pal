import { Ionicons } from '@expo/vector-icons';
import { printToFileAsync } from 'expo-print';
import { router } from 'expo-router';
import { shareAsync } from 'expo-sharing';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { buildReportHtml, gatherReportData } from '../src/services/report.service';
import { useAppStore } from '../src/stores';

export default function ReportScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (): Promise<void> => {
    if (!activeProfile) return;
    setGenerating(true);

    const data = await gatherReportData(activeProfile.id, activeProfile.name);
    const html = buildReportHtml(data);

    const { uri } = await printToFileAsync({ html, base64: false });
    setGenerating(false);

    await shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>‹ {t('common.back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('report.title')}</Text>
      </View>

      <View style={styles.content}>
        <Ionicons name="document-text-outline" size={64} color="#8AADA5" />
        <Text style={styles.description}>{t('report.description')}</Text>

        <Pressable
          style={[styles.generateButton, generating && styles.generateButtonDisabled]}
          onPress={() => void handleGenerate()}
          disabled={generating}
        >
          <Text style={styles.generateText}>
            {generating ? t('report.generating') : t('report.generate')}
          </Text>
        </Pressable>
      </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 100,
  },
  emoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  generateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textOnPrimary,
  },
}));
