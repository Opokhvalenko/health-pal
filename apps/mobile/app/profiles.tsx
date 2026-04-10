import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import type { ProfileRole } from '../src/db';
import { profileService } from '../src/db';
import { useAppStore } from '../src/stores';

const COLOR_OPTIONS = [
  '#4A9B8E',
  '#6C8EBF',
  '#E8A87C',
  '#C38BD2',
  '#85C88A',
  '#F0A4A4',
  '#F6C065',
  '#7BA7C9',
  '#B0B0B0',
  '#A0785A',
];
const ROLE_OPTIONS: ProfileRole[] = ['self', 'caregiver', 'patient'];

export default function ProfilesScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const profiles = useAppStore((s) => s.profiles);
  const setProfiles = useAppStore((s) => s.setProfiles);
  const activeProfile = useAppStore((s) => s.activeProfile);
  const setActiveProfile = useAppStore((s) => s.setActiveProfile);
  const removeProfileFromStore = useAppStore((s) => s.removeProfile);
  const updateProfileInStore = useAppStore((s) => s.updateProfile);
  const addProfileToStore = useAppStore((s) => s.addProfile);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<ProfileRole>('patient');
  const [formEmoji, setFormEmoji] = useState('#4A9B8E');

  const loadProfiles = useCallback(async (): Promise<void> => {
    const rows = await profileService.getAll();
    setProfiles(
      rows.map((r) => ({ id: r.id, name: r.name, role: r.role, avatarEmoji: r.avatarEmoji })),
    );
  }, [setProfiles]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const resetForm = (): void => {
    setFormName('');
    setFormRole('patient');
    setFormEmoji('#4A9B8E');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async (): Promise<void> => {
    if (!formName.trim()) return;

    if (editingId) {
      await profileService.update(editingId, {
        name: formName,
        role: formRole,
        avatarEmoji: formEmoji,
      });
      updateProfileInStore(editingId, {
        name: formName.trim(),
        role: formRole,
        avatarEmoji: formEmoji,
      });
      if (activeProfile?.id === editingId) {
        setActiveProfile({
          id: editingId,
          name: formName.trim(),
          role: formRole,
          avatarEmoji: formEmoji,
        });
      }
    } else {
      const row = await profileService.create({
        name: formName,
        role: formRole,
        avatarEmoji: formEmoji,
      });
      addProfileToStore({
        id: row.id,
        name: row.name,
        role: row.role,
        avatarEmoji: row.avatarEmoji,
      });
    }
    resetForm();
  };

  const handleEdit = (profile: {
    id: string;
    name: string;
    role: ProfileRole;
    avatarEmoji: string;
  }): void => {
    setEditingId(profile.id);
    setFormName(profile.name);
    setFormRole(profile.role);
    setFormEmoji(profile.avatarEmoji);
    setShowForm(true);
  };

  const handleDelete = (id: string): void => {
    if (activeProfile?.id === id && profiles.length === 1) {
      Alert.alert(t('profiles.deleteProfile'), t('profiles.cannotDeleteLast'));
      return;
    }

    Alert.alert(t('profiles.deleteProfile'), t('profiles.deleteConfirm'), [
      { text: t('profiles.cancel'), style: 'cancel' },
      {
        text: t('profiles.delete'),
        style: 'destructive',
        onPress: async () => {
          await profileService.remove(id);
          removeProfileFromStore(id);
          resetForm();

          if (activeProfile?.id === id) {
            const remaining = profiles.filter((p) => p.id !== id);
            if (remaining[0]) {
              setActiveProfile(remaining[0]);
            }
          }
        },
      },
    ]);
  };

  const handleSwitch = async (profile: {
    id: string;
    name: string;
    role: ProfileRole;
    avatarEmoji: string;
  }): Promise<void> => {
    await profileService.setActive(profile.id);
    setActiveProfile(profile);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>‹ {t('common.back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('profiles.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {profiles.map((profile) => (
          <Pressable
            key={profile.id}
            style={[
              styles.profileCard,
              activeProfile?.id === profile.id && styles.profileCardActive,
            ]}
            onPress={() => handleSwitch(profile)}
            onLongPress={() => handleEdit(profile)}
          >
            <View style={[styles.profileAvatar, { backgroundColor: profile.avatarEmoji }]}>
              <Text style={styles.profileInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileRole}>{t(`profiles.roles.${profile.role}`)}</Text>
            </View>
            {activeProfile?.id === profile.id && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{t('profiles.active')}</Text>
              </View>
            )}
          </Pressable>
        ))}

        {profiles.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('profiles.noProfiles')}</Text>
          </View>
        )}

        {/* Add / Edit form */}
        {showForm ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {editingId ? t('profiles.editProfile') : t('profiles.addProfile')}
            </Text>

            <TextInput
              style={styles.input}
              value={formName}
              onChangeText={setFormName}
              placeholder={t('profiles.namePlaceholder')}
              placeholderTextColor="#B0B0B0"
            />

            {/* Role selector */}
            <Text style={styles.formLabel}>{t('profiles.role')}</Text>
            <View style={styles.chipRow}>
              {ROLE_OPTIONS.map((role) => (
                <Pressable
                  key={role}
                  style={[styles.chip, formRole === role && styles.chipSelected]}
                  onPress={() => setFormRole(role)}
                >
                  <Text style={[styles.chipText, formRole === role && styles.chipTextSelected]}>
                    {t(`profiles.roles.${role}`)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Color selector */}
            <Text style={styles.formLabel}>{t('profiles.emoji')}</Text>
            <View style={styles.emojiRow}>
              {COLOR_OPTIONS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    formEmoji === color && styles.colorSelected,
                  ]}
                  onPress={() => setFormEmoji(color)}
                />
              ))}
            </View>

            <View style={styles.formActions}>
              <Pressable style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelText}>{t('profiles.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, !formName.trim() && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!formName.trim()}
              >
                <Text style={styles.saveText}>{t('profiles.save')}</Text>
              </Pressable>
            </View>

            {editingId && (
              <Pressable
                style={styles.deleteButton}
                onPress={() => {
                  handleDelete(editingId);
                }}
              >
                <Text style={styles.deleteText}>{t('profiles.delete')}</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <Pressable style={styles.addButton} onPress={() => setShowForm(true)}>
            <Text style={styles.addButtonText}>+ {t('profiles.addProfile')}</Text>
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
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileCardActive: {
    borderColor: theme.colors.primary,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  profileInitial: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  profileRole: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textOnPrimary,
    fontWeight: theme.fontWeight.semibold,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
  addButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  form: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  formTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  formLabel: {
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
  chipRow: {
    flexDirection: 'row',
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
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: theme.colors.text,
    borderWidth: 3,
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
  deleteButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.semibold,
  },
}));
