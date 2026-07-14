/**
 * MOB HUB Design System — Soft Minimal / Warm Neumorphism
 * Warm cream backgrounds, soft white cards, diffuse shadows, orange accent.
 */

const colors = {
  light: {
    // Backgrounds
    background: '#F7F3EC',
    backgroundGradientTop: '#FBF8F2',
    backgroundGradientBottom: '#F5EFE4',
    backgroundAccentWarm: '#FDECD8',
    backgroundHeroPurpleStart: '#C9C6F5',
    backgroundHeroPurpleMid: '#8FA7EE',
    backgroundHeroPurpleEnd: '#6B7FE0',
    foreground: '#1B1B1D',
    backgroundSecondary: '#FBFAF7',

    // Legacy aliases (kept for existing component compatibility)
    text: '#1B1B1D',
    tint: '#FF8A3D',

    // Glass system
    glass: 'rgba(255, 255, 255, 0.82)',
    glassBorder: 'rgba(255, 255, 255, 0.10)',
    glassMid: 'rgba(255, 255, 255, 0.12)',
    glassStrong: 'rgba(255, 255, 255, 0.18)',
    glassDark: 'rgba(0, 0, 0, 0.04)',
    glassDim: 'rgba(255, 255, 255, 0.45)',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardSoft: '#FBFAF7',
    cardForeground: '#1B1B1D',

    // Primary action color — warm orange (CTAs, badges, active icons)
    primary: '#FF8A3D',
    primaryForeground: '#FFFFFF',
    primaryLight: '#FDEEDD',
    primaryMid: 'rgba(255, 138, 61, 0.20)',

    // Secondary
    secondary: 'rgba(253, 236, 216, 0.60)',
    secondaryForeground: '#1B1B1D',

    // Muted / secondary text
    muted: '#F5EFE4',
    mutedForeground: '#8A8782',
    textTertiary: '#B8B4AC',

    // Accent highlights
    accent: '#FDEEDD',
    accentForeground: '#FF8A3D',

    // Semantic
    destructive: '#FF4D4D',
    destructiveForeground: '#FFFFFF',
    success: '#2FBE5C',
    successLight: '#E3F8E9',
    warning: '#FF8A3D',
    warningLight: '#FDEEDD',

    // Verified / info
    verifiedBlue: '#3E8BFF',

    // Borders
    border: '#ECE6D9',
    input: '#ECE6D9',

    // Shadows (diffuse, warm-toned — never cold gray)
    shadowXs: { shadowColor: '#1E190F', shadowOffset: {width:0,height:1}, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
    shadowSm: { shadowColor: '#1E190F', shadowOffset: {width:0,height:2}, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    shadowMd: { shadowColor: '#1E190F', shadowOffset: {width:0,height:4}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    shadowLg: { shadowColor: '#1E190F', shadowOffset: {width:0,height:8}, shadowOpacity: 0.10, shadowRadius: 24, elevation: 8 },
    shadow: 'rgba(30, 25, 15, 0.06)',
    shadowMid: 'rgba(30, 25, 15, 0.10)',
    shadowStrong: 'rgba(30, 25, 15, 0.16)',
    shadowFabGlow: 'rgba(255, 138, 61, 0.35)',

    // Star rating
    star: '#FFC94A',

    // Buttons
    btnPrimaryBg: '#2B2B2E',
    btnPrimaryText: '#FFFFFF',
    btnMutedBg: '#D9C3AE',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.35)',
  },

  radius: 14,
  radiusSm: 10,
  radiusMd: 14,
  radiusLg: 20,
  radiusXl: 28,
  radiusFull: 999,
};

export type ColorScheme = typeof colors.light;
export default colors;
