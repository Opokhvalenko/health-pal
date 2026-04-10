import { StyleSheet } from 'react-native-unistyles';
import { mmkv } from '../stores/mmkv';
import { calmTheme, darkTheme, lightTheme } from './themes';

const themes = {
  light: lightTheme,
  dark: darkTheme,
  calm: calmTheme,
};

type AppThemes = typeof themes;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
}

const savedTheme = mmkv.getTheme();
const isCalmMode = mmkv.isCalmMode();
const initial = isCalmMode ? 'calm' : savedTheme;

StyleSheet.configure({
  themes,
  settings: {
    initialTheme: initial,
  },
});
