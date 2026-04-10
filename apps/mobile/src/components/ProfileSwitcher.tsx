import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { ProfileRole } from '../db';
import { profileService } from '../db';
import { useAppStore } from '../stores';

export function ProfileSwitcher(): React.JSX.Element {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const activeProfile = useAppStore((s) => s.activeProfile);
  const profiles = useAppStore((s) => s.profiles);
  const setActiveProfile = useAppStore((s) => s.setActiveProfile);

  const handleSwitch = useCallback(
    async (profile: {
      id: string;
      name: string;
      role: ProfileRole;
      avatarEmoji: string;
    }): Promise<void> => {
      await profileService.setActive(profile.id);
      setActiveProfile(profile);
      setModalVisible(false);
    },
    [setActiveProfile],
  );

  if (!activeProfile) return <View />;

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t('profiles.title')}: ${activeProfile.name}`}
        accessibilityHint={t('profiles.title')}
      >
        <Text style={styles.emoji} importantForAccessibility="no">
          {activeProfile.avatarEmoji}
        </Text>
        <Text style={styles.name} numberOfLines={1}>
          {activeProfile.name}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <View style={styles.dropdown}>
            {profiles.map((profile) => (
              <Pressable
                key={profile.id}
                style={[
                  styles.dropdownItem,
                  activeProfile.id === profile.id && styles.dropdownItemActive,
                ]}
                onPress={() => handleSwitch(profile)}
              >
                <Text style={styles.dropdownEmoji}>{profile.avatarEmoji}</Text>
                <View style={styles.dropdownInfo}>
                  <Text style={styles.dropdownName}>{profile.name}</Text>
                  <Text style={styles.dropdownRole}>{t(`profiles.roles.${profile.role}`)}</Text>
                </View>
                {activeProfile.id === profile.id && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  emoji: {
    fontSize: 20,
  },
  name: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    maxWidth: 120,
  },
  arrow: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
  },
  dropdown: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    gap: theme.spacing.md,
  },
  dropdownItemActive: {
    backgroundColor: theme.colors.surfaceSecondary,
  },
  dropdownEmoji: {
    fontSize: 28,
  },
  dropdownInfo: {
    flex: 1,
  },
  dropdownName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  dropdownRole: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  checkmark: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
}));
