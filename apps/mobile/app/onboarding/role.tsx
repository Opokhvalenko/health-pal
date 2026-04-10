import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type Role = 'self' | 'caregiver';

export default function RoleScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();

  const selectRole = (role: Role): void => {
    router.push({ pathname: '/onboarding/profile', params: { role } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('onboarding.role.title')}</Text>
      </View>

      <View style={styles.cards}>
        <Pressable style={styles.card} onPress={() => selectRole('self')}>
          <Text style={styles.cardEmoji}>🧑</Text>
          <Text style={styles.cardTitle}>{t('onboarding.role.self')}</Text>
          <Text style={styles.cardDescription}>{t('onboarding.role.selfDescription')}</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => selectRole('caregiver')}>
          <Text style={styles.cardEmoji}>🤝</Text>
          <Text style={styles.cardTitle}>{t('onboarding.role.caregiver')}</Text>
          <Text style={styles.cardDescription}>{t('onboarding.role.caregiverDescription')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 100,
  },
  header: {
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    lineHeight: 32,
  },
  cards: {
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  cardDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
}));
