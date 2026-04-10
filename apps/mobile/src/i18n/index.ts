import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { mmkv } from '../stores/mmkv';
import en from './locales/en.json';
import uk from './locales/uk.json';

const resources = {
  en: { translation: en },
  uk: { translation: uk },
} as const;

const savedLocale = mmkv.getLocale();

i18n.use(initReactI18next).init({
  resources,
  lng: savedLocale,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
