import { ThemeOptions } from '@mui/material';

export interface ThemeConfig {
  id: string;
  name: string;
  palette: ThemeOptions['palette'];
}

export const themes: ThemeConfig[] = [
  {
    id: 'teal-orange',
    name: 'Teal & Orange',
    palette: {
      mode: 'light',
      primary: {
        main: '#0D9488',
        light: '#14B8A6',
        dark: '#0F766E',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#F97316',
        light: '#FB923C',
        dark: '#EA580C',
      },
      success: {
        main: '#22C55E',
        light: '#4ADE80',
        dark: '#16A34A',
      },
      error: {
        main: '#EF4444',
        light: '#F87171',
        dark: '#DC2626',
      },
      warning: {
        main: '#EAB308',
        light: '#FACC15',
        dark: '#CA8A04',
      },
      info: {
        main: '#3B82F6',
        light: '#60A5FA',
        dark: '#2563EB',
      },
      background: {
        default: '#FAFAFA',
        paper: '#FFFFFF',
      },
    },
  },
  {
    id: 'modern-finance',
    name: 'Modern Finance',
    palette: {
      mode: 'light',
      primary: {
        main: '#2563EB',
        light: '#3B82F6',
        dark: '#1D4ED8',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#0891B2',
        light: '#22D3EE',
        dark: '#0E7490',
      },
      success: {
        main: '#16A34A',
        light: '#22C55E',
        dark: '#15803D',
      },
      error: {
        main: '#DC2626',
        light: '#EF4444',
        dark: '#B91C1C',
      },
      warning: {
        main: '#F59E0B',
        light: '#FBBF24',
        dark: '#D97706',
      },
      info: {
        main: '#0EA5E9',
        light: '#38BDF8',
        dark: '#0284C7',
      },
      background: {
        default: '#F9FAFB',
        paper: '#FFFFFF',
      },
    },
  },
  {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    palette: {
      mode: 'light',
      primary: {
        main: '#10B981',
        light: '#34D399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#6366F1',
        light: '#818CF8',
        dark: '#4F46E5',
      },
      success: {
        main: '#22C55E',
        light: '#4ADE80',
        dark: '#16A34A',
      },
      error: {
        main: '#EF4444',
        light: '#F87171',
        dark: '#DC2626',
      },
      warning: {
        main: '#FBBF24',
        light: '#FCD34D',
        dark: '#F59E0B',
      },
      info: {
        main: '#3B82F6',
        light: '#60A5FA',
        dark: '#2563EB',
      },
      background: {
        default: '#F9FAFB',
        paper: '#FFFFFF',
      },
    },
  },
  {
    id: 'slate-purple',
    name: 'Slate & Purple',
    palette: {
      mode: 'light',
      primary: {
        main: '#7C3AED',
        light: '#8B5CF6',
        dark: '#6D28D9',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#EC4899',
        light: '#F472B6',
        dark: '#DB2777',
      },
      success: {
        main: '#10B981',
        light: '#34D399',
        dark: '#059669',
      },
      error: {
        main: '#F43F5E',
        light: '#FB7185',
        dark: '#E11D48',
      },
      warning: {
        main: '#F97316',
        light: '#FB923C',
        dark: '#EA580C',
      },
      info: {
        main: '#3B82F6',
        light: '#60A5FA',
        dark: '#2563EB',
      },
      background: {
        default: '#F8FAFC',
        paper: '#FFFFFF',
      },
    },
  },
  {
    id: 'classic-navy',
    name: 'Classic Navy',
    palette: {
      mode: 'light',
      primary: {
        main: '#1E3A5F',
        light: '#2D4A6F',
        dark: '#152A45',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#C9A227',
        light: '#D4B54A',
        dark: '#A8871E',
      },
      success: {
        main: '#2E7D32',
        light: '#4CAF50',
        dark: '#1B5E20',
      },
      error: {
        main: '#C62828',
        light: '#EF5350',
        dark: '#B71C1C',
      },
      warning: {
        main: '#F9A825',
        light: '#FBC02D',
        dark: '#F57F17',
      },
      info: {
        main: '#1976D2',
        light: '#42A5F5',
        dark: '#1565C0',
      },
      background: {
        default: '#FAFAFA',
        paper: '#FFFFFF',
      },
    },
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    palette: {
      mode: 'dark',
      primary: {
        main: '#60A5FA',
        light: '#93C5FD',
        dark: '#3B82F6',
        contrastText: '#000000',
      },
      secondary: {
        main: '#A78BFA',
        light: '#C4B5FD',
        dark: '#8B5CF6',
      },
      success: {
        main: '#4ADE80',
        light: '#86EFAC',
        dark: '#22C55E',
      },
      error: {
        main: '#F87171',
        light: '#FCA5A5',
        dark: '#EF4444',
      },
      warning: {
        main: '#FBBF24',
        light: '#FCD34D',
        dark: '#F59E0B',
      },
      info: {
        main: '#38BDF8',
        light: '#7DD3FC',
        dark: '#0EA5E9',
      },
      background: {
        default: '#0F172A',
        paper: '#1E293B',
      },
    },
  },
];

export const getThemeById = (id: string): ThemeConfig => {
  const found = themes.find((t) => t.id === id);
  if (found) return found;
  // Default to first theme (always exists)
  return themes[0] as ThemeConfig;
};
