import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { BigButtonView } from '../../src/components/BigButtonView';
import { CaregiverDashboard } from '../../src/components/CaregiverDashboard';
import { ProfileSwitcher } from '../../src/components/ProfileSwitcher';
import { useAppStore } from '../../src/stores';

export default function TodayScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const activeProfile = useAppStore((s) => s.activeProfile);
  const role = activeProfile?.role;

  // Patient role → Big Button view
  if (role === 'patient') {
    return <BigButtonView />;
  }

  // Caregiver role → Caregiver dashboard
  if (role === 'caregiver') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{t('today.greeting')}</Text>
              <Text style={styles.title}>{t('today.title')}</Text>
            </View>
            <ProfileSwitcher />
          </View>
        </View>
        <CaregiverDashboard />
      </SafeAreaView>
    );
  }

  // Self role → standard Today view
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{t('today.greeting')}</Text>
            <Text style={styles.title}>{t('today.title')}</Text>
          </View>
          <ProfileSwitcher />
        </View>
      </View>

      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🌿</Text>
        <Text style={styles.emptyText}>{t('today.empty')}</Text>
        <Text style={styles.emptyHint}>{t('today.emptyHint')}</Text>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
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
