import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import type { ProductDto } from '@workspace/api-client-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getFontFamily } from '@/constants/fonts';

interface ProductCardProps {
  product: ProductDto;
  onPress: () => void;
  width?: number;
  reservationStatus?: string;
}

// Only show a badge for active/positive states — not cancelled/declined/expired
const RESERVATION_CARD_BADGE: Record<string, { bg: string; fg: string; ar: string; en: string }> = {
  pending:   { bg: '#FEF3C7', fg: '#D97706', ar: 'قيد الانتظار', en: 'Pending' },
  confirmed: { bg: '#D1FAE5', fg: '#059669', ar: 'محجوز',         en: 'Reserved' },
  completed: { bg: '#EFF6FF', fg: '#2563EB', ar: 'مكتمل',         en: 'Completed' },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProductCard({ product, onPress, width = 170, reservationStatus }: ProductCardProps) {
  const { toggleFavoriteProduct, isProductFavorite } = useFavorites();
  const { language, isRTL, t } = useLanguage();
  const isFav = isProductFavorite(product.id);

  const name = language === 'ar' ? product.nameAr : product.nameEn;
  const discountPct = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const fontFamBold = getFontFamily(isRTL, 'bold');
  const fontFamReg = getFontFamily(isRTL, 'regular');
  const latinBold = getFontFamily(false, 'bold');
  const latinReg = getFontFamily(false, 'regular');

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.97, { stiffness: 300, damping: 28 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { stiffness: 300, damping: 28 });
  }

  function handlePress() {
    Haptics.selectionAsync();
    onPress();
  }

  function handleFavorite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavoriteProduct(product.id);
  }

  const displayPrice = product.discountPrice ?? product.price;

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[styles.card, { width }, animatedStyle]}
    >
      <View style={[styles.inner, { width }]}>
        <View style={[styles.imageArea, { backgroundColor: product.imageColor + '15' }]}>
          <View style={[styles.phoneMockup, { borderColor: product.imageColor + '40' }]}>
            <View style={[styles.phoneScreen, { backgroundColor: product.imageColor + '20' }]} />
            <View style={[styles.phoneSpeaker, { backgroundColor: product.imageColor + '40' }]} />
          </View>

          <View style={[styles.badges, isRTL ? { right: 8 } : { left: 8 }]}>
            {product.isNew && (
              <View style={styles.newBadge}>
                <Text style={[styles.badgeText, { fontFamily: latinBold }]}>NEW</Text>
              </View>
            )}
            {discountPct > 0 && (
              <View style={styles.discountBadge}>
                <Text style={[styles.badgeText, { fontFamily: latinBold }]}>-{discountPct}%</Text>
              </View>
            )}
          </View>

          <Pressable onPress={handleFavorite} style={[styles.favButton, isRTL ? { left: 8 } : { right: 8 }]} hitSlop={8}>
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={18}
              color={isFav ? colors.light.destructive : colors.light.mutedForeground}
            />
          </Pressable>
          {reservationStatus && RESERVATION_CARD_BADGE[reservationStatus] && (
            <View style={styles.reservedBadgeWrap}>
              <View style={[styles.reservedBadge, { backgroundColor: RESERVATION_CARD_BADGE[reservationStatus].bg }]}>
                <Text style={[styles.reservedBadgeText, { color: RESERVATION_CARD_BADGE[reservationStatus].fg }]}>
                  {language === 'ar' ? RESERVATION_CARD_BADGE[reservationStatus].ar : RESERVATION_CARD_BADGE[reservationStatus].en}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text
            style={[styles.name, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}
            numberOfLines={2}
          >
            {name}
          </Text>
          <Text style={[styles.brand, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamReg }]}>{product.brand}</Text>

          <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.price, { fontFamily: latinBold }]}>
              {displayPrice.toLocaleString()} {t('egp')}
            </Text>
            {product.discountPrice && (
              <Text style={[styles.originalPrice, { fontFamily: latinReg }]}>
                {product.price.toLocaleString()}
              </Text>
            )}
          </View>

          <View style={[styles.stockRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.stockDot, { backgroundColor: product.inStock ? colors.light.success : colors.light.destructive }]} />
            <Text style={[styles.stockText, { color: product.inStock ? colors.light.success : colors.light.destructive, fontFamily: fontFamReg }]}>
              {product.inStock ? t('inStock') : t('outOfStock')}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#1E190F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  inner: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageArea: {
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: colors.light.cardSoft,
  },
  phoneMockup: {
    width: 64,
    height: 110,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 6,
    gap: 4,
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    borderRadius: 6,
  },
  phoneSpeaker: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },
  badges: {
    position: 'absolute',
    top: 8,
    gap: 4,
  },
  newBadge: {
    backgroundColor: colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountBadge: {
    backgroundColor: colors.light.destructive,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  favButton: {
    position: 'absolute',
    top: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  info: { padding: 12, gap: 4 },
  name: {
    fontSize: 14,
    color: colors.light.foreground,
    lineHeight: 20,
  },
  brand: { fontSize: 12, color: colors.light.mutedForeground },
  priceRow: { alignItems: 'center', gap: 6, marginTop: 4 },
  price: { fontSize: 17, fontWeight: '700', color: colors.light.foreground, letterSpacing: -0.2 },
  originalPrice: {
    fontSize: 12,
    color: colors.light.textTertiary,
    textDecorationLine: 'line-through',
  },
  stockRow: { alignItems: 'center', gap: 6, marginTop: 4 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: 11 },
  reservedBadgeWrap: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  reservedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reservedBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
});
