// PrivateCharterX Pay - Theme Constants
// Design: Dark theme with chrome/silver gradient accent

export const COLORS = {
  // Primary
  background: '#0A0A0F',
  backgroundSecondary: '#12121A',

  // Chrome/Silver Gradient (for balance card)
  gradientStart: '#E8E8EC',
  gradientMiddle: '#C4C4CC',
  gradientEnd: '#A8A8B0',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textDark: '#1C1C1E',

  // Accent
  accent: '#8B5CF6', // Purple
  accentLight: '#A78BFA',

  // Status
  positive: '#34C759',
  negative: '#FF3B30',

  // UI Elements
  cardBackground: '#1C1C1E',
  cardBorder: '#2C2C2E',
  divider: '#38383A',

  // Floating elements
  floatingBar: 'rgba(28, 28, 30, 0.95)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
};
