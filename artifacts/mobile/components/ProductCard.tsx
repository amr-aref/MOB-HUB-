import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { Product } from '@/data/mockData';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  width?: number;
}

export default function ProductCard({ product, onPress, width = 170 }: ProductCardProps) {
  const { toggleFavoriteProduct, isProductFavorite } = useFavorites();
  const { language, isRTL, t } = useLanguage();
  const isFav = isProductFavorite(product.id);

  const name = language === 'ar' ? product.nameAr : product.nameEn;
  const discountPct = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  function handleFavorite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavoriteProduct(product.id);
  }

  const displayPrice = product.discountPrice ?? product.price;

  const Inner = (
    <View style={[styles.inner, { width }]}>
      {/* Product visual */}
      <View style={[styles.imageArea, { backgroundColor: product.imageColor + '18' }]}>
        <View style={[styles.phoneMockup, { borderColor: product.imageColor + '44' }]}>
          <View style={[styles.phoneScreen, { backgroundColor: product.imageColor + '22' }]} />
          <View style={[styles.phoneSpeaker, { backgroundColor: product.imageColor + '44' }]} />
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          {product.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
          {discountPct > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.badgeText}>-{discountPct}%</Text>
            </View>
          )}
        </View>

        {/* Favorite button */}
        <Pressable onPress={handleFavorite} style={styles.favButton} hitSlop={8}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={18}
            color={isFav ? colors.light.destructive : colors.light.mutedForeground}
          />
        </Pressable>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={[styles.name, { textAlign: isRTL ? 'right' : 'left' }]}
          numberOfLines={2}
        >
          {name}
        </Text>
        <Text style={[styles.brand, { textAlign: isRTL ? 'right' : 'left' }]}>{product.brand}</Text>

        <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.price}>
            {displayPrice.toLocaleString()} {t('egp')}
          </Text>
          {product.discountPrice && (
            <Text style={styles.originalPrice}>
              {product.price.toLocaleString()}
            </Text>
          )}
        </View>

        {/* Stock */}
        <View style={[styles.stockRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.stockDot, { backgroundColor: product.inStock ? colors.light.success : colors.light.destructive }]} />
          <Text style={[styles.stockText, { color: product.inStock ? colors.light.success : colors.light.destructive }]}>
            {product.inStock ? t('inStock') : t('outOfStock')}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={50} tint="light" style={[styles.blur, { width }]}>
          {Inner}
        </BlurView>
      ) : (
        Inner
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: colors.radiusLg,
    overflow: 'hidden',
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  blur: {
    overflow: 'hidden',
    borderRadius: colors.radiusLg,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  inner: {
    backgroundColor: 'rgba(255,255,255,0.80)',
    borderWidth: 1,
    borderColor: colors.light.glassBorder,
    borderRadius: colors.radiusLg,
    overflow: 'hidden',
  },
  imageArea: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  phoneMockup: {
    width: 64,
    height: 110,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
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
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  badges: {
    position: 'absolute',
    top: 8,
    left: 8,
    gap: 4,
  },
  newBadge: {
    backgroundColor: colors.light.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadge: {
    backgroundColor: colors.light.destructive,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  favButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.90)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  info: { padding: 10, gap: 4 },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.light.foreground,
    lineHeight: 18,
  },
  brand: { fontSize: 11, color: colors.light.mutedForeground },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  price: { fontSize: 15, fontWeight: '700', color: colors.light.primary },
  originalPrice: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textDecorationLine: 'line-through',
  },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: 11, fontWeight: '500' },
});
