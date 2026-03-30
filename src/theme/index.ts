import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../config/constants';
import { FONTS } from '../config/fonts';

export interface Theme {
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
    brown: string;
    brownLight: string;
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
  fonts: typeof FONTS;
  spacing: typeof SPACING;
  fontSizes: typeof FONT_SIZES;
  borderRadius: typeof BORDER_RADIUS;
}

export const theme: Theme = {
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
    brown: COLORS.brown,
    brownLight: COLORS.brownLight,
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
  fonts: FONTS,
  spacing: SPACING,
  fontSizes: FONT_SIZES,
  borderRadius: BORDER_RADIUS,
};
