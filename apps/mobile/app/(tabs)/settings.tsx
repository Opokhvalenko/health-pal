import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

export default function SettingsScreen(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>{t('settings.calmMode')}</Text>
          <Text style={styles.itemValue}>{t('settings.off')}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>{t('settings.language')}</Text>
          <Text style={styles.itemValue}>{t('settings.english')}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>{t('settings.theme')}</Text>
          <Text style={styles.itemValue}>{t('settings.system')}</Text>
        </View>
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
  itemLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  itemValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
}));
