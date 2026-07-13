/**
 * Liquid Glass Design System — White transparent glass aesthetic
 * Inspired by modern high-end OS glass morphism
 */

const colors = {
  light: {
    // Core surfaces
    background: '#FFFFFF',
    foreground: '#0A0A0A',
    backgroundSecondary: '#FAFAFA',

    // Legacy aliases
    text: '#0A0A0A',
    tint: '#2563EB',

    // Glass surfaces
    glass: 'rgba(255, 255, 255, 0.70)',
    glassBorder: 'rgba(255, 255, 255, 0.80)',
    glassStrong: 'rgba(255, 255, 255, 0.85)',
    glassDim: 'rgba(255, 255, 255, 0.45)',

    // Cards / elevated surfaces
    card: 'rgba(255, 255, 255, 0.75)',
    cardForeground: '#0A0A0A',

    // Primary action color — electric blue
    primary: '#2563EB',
    primaryForeground: '#FFFFFF',
    primaryLight: 'rgba(37, 99, 235, 0.12)',
    primaryMid: 'rgba(37, 99, 235, 0.20)',

    // Secondary
    secondary: 'rgba(248, 250, 252, 0.90)',
    secondaryForeground: '#1A1A1A',

    // Muted
    muted: '#F1F5F9',
    mutedForeground: '#64748B',

    // Accent highlights
    accent: 'rgba(37, 99, 235, 0.08)',
    accentForeground: '#2563EB',

    // Semantic
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.12)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.12)',

    // Borders
    border: 'rgba(226, 232, 240, 0.80)',
    input: 'rgba(226, 232, 240, 0.90)',

    // Shadows
    shadow: 'rgba(15, 23, 42, 0.08)',
    shadowMid: 'rgba(15, 23, 42, 0.14)',
    shadowStrong: 'rgba(15, 23, 42, 0.22)',

    // Star rating
    star: '#F59E0B',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.35)',
  },

  radius: 16,
  radiusSm: 10,
  radiusMd: 14,
  radiusLg: 20,
  radiusXl: 28,
  radiusFull: 999,
};

export type ColorScheme = typeof colors.light;
export default colors;
