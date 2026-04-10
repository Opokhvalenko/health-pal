import { StyleSheet } from 'react-native-unistyles';
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

StyleSheet.configure({
  themes,
  settings: {
    adaptiveThemes: true,
  },
});
