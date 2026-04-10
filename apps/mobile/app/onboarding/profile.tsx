import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { db, profiles } from '../../src/db';
import { generateId, nowISO } from '../../src/db/helpers';
import { useAppStore } from '../../src/stores';

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();
  const { role = 'self' } = useLocalSearchParams<{ role?: string }>();
  const [name, setName] = useState('');

  const createProfile = async (): Promise<void> => {
    if (name.trim().length === 0) return;

    const id = generateId();
    const now = nowISO();
    const profileRole = role === 'caregiver' ? 'caregiver' : 'self';

    await db.insert(profiles).values({
      id,
      name: name.trim(),
      role: profileRole,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    useAppStore
      .getState()
      .setActiveProfile({ id, name: name.trim(), role: profileRole, avatarEmoji: '#4A9B8E' });
    useAppStore.getState().completeOnboarding();

    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('onboarding.profile.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.profile.subtitle')}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder={t('onboarding.profile.namePlaceholder')}
        placeholderTextColor="#B0B0B0"
        value={name}
        onChangeText={setName}
        autoFocus
        maxLength={50}
      />

      <Pressable
        style={[styles.button, name.trim().length === 0 && styles.buttonDisabled]}
        onPress={() => void createProfile()}
        disabled={name.trim().length === 0}
      >
        <Text style={styles.buttonText}>{t('onboarding.profile.continue')}</Text>
      </Pressable>
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
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
}));
