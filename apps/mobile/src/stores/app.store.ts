import { create } from 'zustand';
import type { ProfileRole } from '../db';
import { mmkv } from './mmkv';

export interface Profile {
  readonly id: string;
  readonly name: string;
  readonly role: ProfileRole;
  readonly avatarEmoji: string;
}

interface AppState {
  // Auth / onboarding
  isOnboardingDone: boolean;
  completeOnboarding: () => void;

  // Active profile
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile) => void;

  // All profiles (loaded from SQLite, cached in memory)
  profiles: Profile[];
  setProfiles: (profiles: Profile[]) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (id: string, patch: Partial<Omit<Profile, 'id'>>) => void;
  removeProfile: (id: string) => void;

  // Calm mode
  calmMode: boolean;
  toggleCalmMode: () => void;

  // Locale
  locale: string;
  setLocale: (locale: string) => void;

  // Theme
  theme: 'light' | 'dark' | 'calm';
  setTheme: (theme: 'light' | 'dark' | 'calm') => void;

  // Hydrate from MMKV on app start
  hydrate: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnboardingDone: false,
  activeProfile: null,
  profiles: [],
  calmMode: false,
  locale: 'en',
  theme: 'light',

  completeOnboarding: () => {
    mmkv.setOnboardingDone(true);
    set({ isOnboardingDone: true });
  },

  setActiveProfile: (profile) => {
    mmkv.setActiveProfileId(profile.id);
    set({ activeProfile: profile });
  },

  setProfiles: (profiles) => {
    set({ profiles });
  },

  addProfile: (profile) => {
    set((state) => ({ profiles: [...state.profiles, profile] }));
  },

  updateProfile: (id, patch) => {
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      activeProfile:
        state.activeProfile?.id === id ? { ...state.activeProfile, ...patch } : state.activeProfile,
    }));
  },

  removeProfile: (id) => {
    set((state) => ({
      profiles: state.profiles.filter((p) => p.id !== id),
      activeProfile: state.activeProfile?.id === id ? null : state.activeProfile,
    }));
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
