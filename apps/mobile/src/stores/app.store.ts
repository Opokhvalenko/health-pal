import { create } from 'zustand';
import { mmkv } from './mmkv';

interface Profile {
  readonly id: string;
  readonly name: string;
  readonly role: 'self' | 'caregiver' | 'patient';
}

interface AppState {
  // Auth / onboarding
  isOnboardingDone: boolean;
  completeOnboarding: () => void;

  // Active profile
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile) => void;

  // Calm mode
  calmMode: boolean;
  toggleCalmMode: () => void;

  // Locale
  locale: string;
  setLocale: (locale: string) => void;

  // Theme
  theme: 'light' | 'dark' | 'calm' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'calm' | 'system') => void;

  // Hydrate from MMKV on app start
  hydrate: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnboardingDone: false,
  activeProfile: null,
  calmMode: false,
  locale: 'en',
  theme: 'system',

  completeOnboarding: () => {
    mmkv.setOnboardingDone(true);
    set({ isOnboardingDone: true });
  },

  setActiveProfile: (profile) => {
    mmkv.setActiveProfileId(profile.id);
    set({ activeProfile: profile });
  },

  toggleCalmMode: () => {
    set((state) => {
      const next = !state.calmMode;
      mmkv.setCalmMode(next);
      return { calmMode: next };
    });
  },

  setLocale: (locale) => {
    mmkv.setLocale(locale);
    set({ locale });
  },

  setTheme: (theme) => {
    mmkv.setTheme(theme);
    set({ theme });
  },

  hydrate: () => {
    set({
      isOnboardingDone: mmkv.isOnboardingDone(),
      calmMode: mmkv.isCalmMode(),
      locale: mmkv.getLocale(),
      theme: mmkv.getTheme(),
    });
  },
}));
