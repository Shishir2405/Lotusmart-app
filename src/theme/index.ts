import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../config/constants';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    secondaryDark: string;
    secondaryLight: string;
    accent: string;
    accentDark: string;
    accentLight: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  spacing: typeof SPACING;
  fontSizes: typeof FONT_SIZES;
  borderRadius: typeof BORDER_RADIUS;
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: COLORS.rose,
    primaryDark: COLORS.roseDark,
    primaryLight: COLORS.roseLight,
    secondary: COLORS.olive,
    secondaryDark: COLORS.oliveDark,
    secondaryLight: COLORS.oliveLight,
    accent: COLORS.gold,
    accentDark: COLORS.goldDark,
    accentLight: COLORS.goldLight,
    background: COLORS.background,
    surface: COLORS.surface,
    text: COLORS.textPrimary,
    textSecondary: COLORS.textSecondary,
    border: COLORS.border,
    error: COLORS.error,
    success: COLORS.success,
    warning: COLORS.warning,
    info: COLORS.info,
  },
  spacing: SPACING,
  fontSizes: FONT_SIZES,
  borderRadius: BORDER_RADIUS,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: COLORS.rose,
    primaryDark: COLORS.roseDark,
    primaryLight: '#3D1525',
    secondary: COLORS.olive,
    secondaryDark: COLORS.oliveDark,
    secondaryLight: '#1E2A14',
    accent: COLORS.gold,
    accentDark: COLORS.goldDark,
    accentLight: '#2A2518',
    background: COLORS.backgroundDark,
    surface: COLORS.surfaceDark,
    text: COLORS.textPrimaryDark,
    textSecondary: COLORS.textSecondaryDark,
    border: COLORS.borderDark,
    error: COLORS.error,
    success: COLORS.success,
    warning: COLORS.warning,
    info: COLORS.info,
  },
  spacing: SPACING,
  fontSizes: FONT_SIZES,
  borderRadius: BORDER_RADIUS,
};
