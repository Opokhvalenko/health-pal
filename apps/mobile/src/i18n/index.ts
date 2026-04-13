import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { mmkv } from '../stores/mmkv';
import en from './locales/en.json';
import uk from './locales/uk.json';

const SUPPORTED_LOCALES = ['en', 'uk'] as const;

const resources = {
  en: { translation: en },
  uk: { translation: uk },
} as const;

function detectLocale(): string {
  // 1. User saved preference
  const saved = mmkv.getSavedLocale();
  if (saved) return saved;

  // 2. Device language
  const deviceLocales = getLocales();
  for (const locale of deviceLocales) {
    const lang = locale.languageCode;
    if (lang && (SUPPORTED_LOCALES as readonly string[]).includes(lang)) {
      return lang;
    }
    // ru → uk fallback (many Ukrainian phones have Russian set)
    if (lang === 'ru') return 'uk';
  }

  // 3. Default
  return 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectLocale(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
