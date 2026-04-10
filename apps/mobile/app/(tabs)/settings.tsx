import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { useAppStore } from '../../src/stores';

export default function SettingsScreen(): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const calmMode = useAppStore((s) => s.calmMode);
  const toggleCalmMode = useAppStore((s) => s.toggleCalmMode);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);

  const handleCalmToggle = (): void => {
    const next = !calmMode;
    if (next) {
      UnistylesRuntime.setTheme('calm');
    } else {
      UnistylesRuntime.setTheme(theme === 'dark' ? 'dark' : 'light');
    }
    toggleCalmMode();
  };

  const handleThemeCycle = (): void => {
    const next = theme === 'dark' ? 'light' : 'dark';
    UnistylesRuntime.setTheme(next);
    setTheme(next);
  };

  const handleLanguageToggle = (): void => {
    const next = locale === 'en' ? 'uk' : 'en';
    setLocale(next);
    i18n.changeLanguage(next);
  };

  const themeLabel = (): string => {
    if (calmMode) return t('settings.calm');
    if (theme === 'dark') return t('settings.dark');
    return t('settings.light');
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title')}</Text>
        </View>

        {/* Profiles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.profiles')}</Text>
          <Pressable
            style={styles.item}
            onPress={() => router.push('/profiles')}
            accessibilityRole="button"
            accessibilityLabel={t('settings.manageProfiles')}
          >
            <Text style={styles.itemLabel}>{t('settings.manageProfiles')}</Text>
            <Text style={styles.chevron} importantForAccessibility="no">
              ›
            </Text>
          </Pressable>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>

          <View style={styles.item}>
            <View style={styles.itemLabelGroup}>
              <Text style={styles.itemLabel}>{t('settings.calmMode')}</Text>
              <Text style={styles.itemDescription}>{t('settings.calmModeDescription')}</Text>
            </View>
            <Switch
              value={calmMode}
              onValueChange={handleCalmToggle}
              trackColor={{ true: '#4A9B8E' }}
              accessibilityLabel={t('settings.calmMode')}
            />
          </View>

          <Pressable
            style={styles.item}
            onPress={handleThemeCycle}
            accessibilityRole="button"
            accessibilityLabel={`${t('settings.theme')}: ${themeLabel()}`}
          >
            <Text style={styles.itemLabel}>{t('settings.theme')}</Text>
            <Text style={styles.itemValue}>{themeLabel()}</Text>
          </Pressable>

          <Pressable
            style={styles.item}
            onPress={handleLanguageToggle}
            accessibilityRole="button"
            accessibilityLabel={`${t('settings.language')}: ${locale === 'en' ? 'English' : 'Українська'}`}
          >
            <Text style={styles.itemLabel}>{t('settings.language')}</Text>
            <Text style={styles.itemValue}>{locale === 'en' ? 'English' : 'Українська'}</Text>
          </Pressable>
        </View>

        {/* Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('symptoms.title')}</Text>
          <Pressable
            style={styles.item}
            onPress={() => router.push('/symptoms')}
            accessibilityRole="button"
            accessibilityLabel={t('symptoms.title')}
          >
            <Text style={styles.itemLabel}>{t('symptoms.title')}</Text>
            <Text style={styles.chevron} importantForAccessibility="no">
              ›
            </Text>
          </Pressable>
          <Pressable
            style={styles.item}
            onPress={() => router.push('/report')}
            accessibilityRole="button"
            accessibilityLabel={t('report.title')}
          >
            <Text style={styles.itemLabel}>{t('report.title')}</Text>
            <Text style={styles.chevron} importantForAccessibility="no">
              ›
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  item: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  itemLabelGroup: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  itemLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  itemDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  itemValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
  chevron: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.textMuted,
  },
}));
