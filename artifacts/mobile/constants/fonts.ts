/**
 * Typography tokens for MOB HUB.
 *
 * Arabic UI text must use IBM Plex Sans Arabic (soft, rounded terminals —
 * never a sharp/traditional Arabic typeface). English text and all numerals
 * / prices / currency (which stay LTR even inside an RTL layout) use Inter.
 *
 * Usage in a component:
 *   const { isRTL } = useLanguage();
 *   const fonts = isRTL ? arabicFonts : latinFonts;
 *   <Text style={{ fontFamily: fonts.bold }}>...</Text>
 *
 * Numbers/prices should always use `latinFonts` regardless of language.
 */

export const arabicFonts = {
  light: 'IBMPlexSansArabic_300Light',
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semiBold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
};

export const latinFonts = {
  light: 'Inter_400Regular',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

/** Pick the right font family for the given language + weight. */
export function getFontFamily(isRTL: boolean, weight: keyof typeof latinFonts = 'regular') {
  return isRTL ? arabicFonts[weight] : latinFonts[weight];
}
