import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'healthpal-preferences' });

const KEYS = {
  ONBOARDING_DONE: 'onboarding_done',
  ACTIVE_PROFILE_ID: 'active_profile_id',
  LOCALE: 'locale',
  THEME: 'theme',
  CALM_MODE: 'calm_mode',
  // Morning takeout reminder (P6)
  MORNING_REMINDER_ENABLED: 'morning_reminder_enabled',
  MORNING_REMINDER_TIME: 'morning_reminder_time', // "HH:mm"
  MORNING_WORK_HOURS_START: 'morning_work_hours_start', // "HH:mm"
  MORNING_WORK_HOURS_END: 'morning_work_hours_end', // "HH:mm"
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
  getTheme: (): 'light' | 'dark' | 'calm' => {
    const value = storage.getString(KEYS.THEME);
    if (value === 'light' || value === 'dark' || value === 'calm') return value;
    return 'light';
  },
  setTheme: (theme: 'light' | 'dark' | 'calm'): void => storage.set(KEYS.THEME, theme),

  // Calm mode
  isCalmMode: (): boolean => storage.getBoolean(KEYS.CALM_MODE) ?? false,
  setCalmMode: (value: boolean): void => storage.set(KEYS.CALM_MODE, value),

  // Morning takeout reminder (P6)
  isMorningReminderEnabled: (): boolean =>
    storage.getBoolean(KEYS.MORNING_REMINDER_ENABLED) ?? false,
  setMorningReminderEnabled: (value: boolean): void =>
    storage.set(KEYS.MORNING_REMINDER_ENABLED, value),
  getMorningReminderTime: (): string => storage.getString(KEYS.MORNING_REMINDER_TIME) ?? '07:00',
  setMorningReminderTime: (time: string): void => storage.set(KEYS.MORNING_REMINDER_TIME, time),
  getMorningWorkHoursStart: (): string =>
    storage.getString(KEYS.MORNING_WORK_HOURS_START) ?? '07:00',
  setMorningWorkHoursStart: (time: string): void =>
    storage.set(KEYS.MORNING_WORK_HOURS_START, time),
  getMorningWorkHoursEnd: (): string => storage.getString(KEYS.MORNING_WORK_HOURS_END) ?? '22:00',
  setMorningWorkHoursEnd: (time: string): void => storage.set(KEYS.MORNING_WORK_HOURS_END, time),
} as const;
