import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'healthpal-preferences' });

const KEYS = {
  ONBOARDING_DONE: 'onboarding_done',
  ACTIVE_PROFILE_ID: 'active_profile_id',
  LOCALE: 'locale',
  THEME: 'theme',
  CALM_MODE: 'calm_mode',
} as const;

export const mmkv = {
  // Onboarding
  isOnboardingDone: (): boolean => storage.getBoolean(KEYS.ONBOARDING_DONE) ?? false,
  setOnboardingDone: (value: boolean): void => storage.set(KEYS.ONBOARDING_DONE, value),

  // Active profile
  getActiveProfileId: (): string | undefined => storage.getString(KEYS.ACTIVE_PROFILE_ID),
  setActiveProfileId: (id: string): void => storage.set(KEYS.ACTIVE_PROFILE_ID, id),

  // Locale
  getLocale: (): string => storage.getString(KEYS.LOCALE) ?? 'en',
  setLocale: (locale: string): void => storage.set(KEYS.LOCALE, locale),

  // Theme
  getTheme: (): 'light' | 'dark' | 'calm' | 'system' => {
    const value = storage.getString(KEYS.THEME);
    if (value === 'light' || value === 'dark' || value === 'calm') return value;
    return 'system';
  },
  setTheme: (theme: 'light' | 'dark' | 'calm' | 'system'): void => storage.set(KEYS.THEME, theme),

  // Calm mode
  isCalmMode: (): boolean => storage.getBoolean(KEYS.CALM_MODE) ?? false,
  setCalmMode: (value: boolean): void => storage.set(KEYS.CALM_MODE, value),
} as const;
