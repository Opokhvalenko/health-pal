import { fontSize, fontWeight, radius, spacing } from './tokens';

const shared = { spacing, radius, fontSize, fontWeight };

export const lightTheme = {
  ...shared,
  colors: {
    background: '#F5F0EB',
    surface: '#FFFFFF',
    surfaceSecondary: '#F0EBE5',
    primary: '#4A9B8E',
    primaryPressed: '#3D8275',
    text: '#2D2D2D',
    textSecondary: '#5A5A5A',
    textMuted: '#7A7A7A',
    textOnPrimary: '#FFFFFF',
    placeholder: '#B0B0B0',
    border: '#E8E8E8',
    shadow: '#000000',
    success: '#4A9B8E',
    warning: '#D4A04A',
    error: '#C25B5B',
    tabActive: '#4A9B8E',
    tabInactive: '#B0B0B0',
  },
} as const;

export const darkTheme = {
  ...shared,
  colors: {
    background: '#1A1A1A',
    surface: '#2A2A2A',
    surfaceSecondary: '#333333',
    primary: '#5BB8A9',
    primaryPressed: '#4A9B8E',
    text: '#E8E8E8',
    textSecondary: '#B0B0B0',
    textMuted: '#8A8A8A',
    textOnPrimary: '#1A1A1A',
    placeholder: '#666666',
    border: '#3A3A3A',
    shadow: '#000000',
    success: '#5BB8A9',
    warning: '#E0B85C',
    error: '#D46B6B',
    tabActive: '#5BB8A9',
    tabInactive: '#666666',
  },
} as const;

export const calmTheme = {
  ...shared,
  colors: {
    background: '#FAF8F5',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F2EE',
    primary: '#8AADA5',
    primaryPressed: '#7A9D95',
    text: '#4A4A4A',
    textSecondary: '#7A7A7A',
    textMuted: '#A0A0A0',
    textOnPrimary: '#FFFFFF',
    placeholder: '#C0C0C0',
    border: '#E8E5E0',
    shadow: '#00000000',
    success: '#8AADA5',
    warning: '#C8B07A',
    error: '#C0908A',
    tabActive: '#8AADA5',
    tabInactive: '#C0C0C0',
  },
} as const;

export type AppTheme = typeof lightTheme;
