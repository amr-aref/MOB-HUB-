import React, { useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { products, stores } from '@/data/mockData';
import RatingStars from '@/components/RatingStars';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, isRTL, language } = useLanguage();
  const { toggleFavoriteProduct, isProductFavorite } = useFavorites();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const product = products.find((p) => p.id === id);
  if (!product) return null;

  const store = stores.find((s) => s.id === product.storeId);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const isFav = isProductFavorite(product.id);
  const name = language === 'ar' ? product.nameAr : product.nameEn;
  const description = language === 'ar' ? product.descriptionAr : product.descriptionEn;
  const warranty = language === 'ar' ? product.warrantyAr : product.warranty;

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState(0);
  const [selectedRam, setSelectedRam] = useState(0);

  const displayPrice = product.discountPrice ?? product.price;
  const discountPct = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  function handleFavorite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavoriteProduct(product.id);
  }

  function handleContact() {
    if (!store) return;
    const num = store.whatsapp.replace('+', '');
    const msg = encodeURIComponent(
      language === 'ar'
        ? `مرحباً، أنا مهتم بـ: ${product.nameAr}`
        : `Hello, I'm interested in: ${product.nameEn}`,
    );
    Linking.openURL(`https://wa.me/${num}?text=${msg}`);
  }

  const specs = [
    { label: t('brand'), value: product.brand },
    { label: t('model'), value: product.model },
    { label: t('condition'), value: t(product.condition as any) },
    { label: t('warranty'), value: warranty },
    ...(product.storage?.length ? [{ label: t('storage'), value: product.storage.join(' / ') }] : []),
    ...(product.ram?.length ? [{ label: t('ram'), value: product.ram.join(' / ') }] : []),
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image area */}
        <LinearGradient
          colors={[product.imageColor + '22', product.imageColor + '08', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.hero, { paddingTop: topInset + 8 }]}
        >
          {/* Back + favorite */}
          <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={() => router.back()} style={styles.circleBtn}>
              <Ionicons
                name={isRTL ? 'chevron-forward' : 'chevron-back'}
                size={22}
                color={colors.light.foreground}
              />
            </Pressable>
            <Pressable onPress={handleFavorite} style={styles.circleBtn}>
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={22}
                color={isFav ? colors.light.destructive : colors.light.foreground}
              />
            </Pressable>
          </View>

          {/* Product visual */}
          <View style={[styles.productVisual, { borderColor: product.imageColor + '30' }]}>
            <View style={[styles.phoneMockupLarge, { borderColor: product.imageColor + '50' }]}>
              <View style={[styles.phoneMockupScreen, { backgroundColor: product.imageColor + '20' }]} />
              <View style={[styles.phoneMockupSpeaker, { backgroundColor: product.imageColor + '40' }]} />
              <View style={[styles.phoneMockupHome, { backgroundColor: product.imageColor + '30' }]} />
            </View>
          </View>

          {/* Color selector */}
          {product.colors && product.colors.length > 0 && (
            <View style={[styles.colorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {product.colors.map((color, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => { Haptics.selectionAsync(); setSelectedColor(idx); }}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    selectedColor === idx && styles.colorDotSelected,
                  ]}
                />
              ))}
            </View>
          )}
        </LinearGradient>

        {/* Info card */}
        <View style={styles.infoCard}>
          {/* Badges */}
          <View style={[styles.badgeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {product.isNew && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>NEW</Text>
              </View>
            )}
            {product.isBestSeller && (
              <View style={[styles.badge, { backgroundColor: colors.light.warningLight }]}>
                <Ionicons name="star" size={10} color={colors.light.warning} />
                <Text style={[styles.badgeText, { color: colors.light.warning }]}>
                  {language === 'ar' ? 'الأكثر مبيعاً' : 'Best Seller'}
                </Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: product.inStock ? colors.light.successLight : '#FEE2E2' }]}>
              <View style={[styles.stockDot, { backgroundColor: product.inStock ? colors.light.success : colors.light.destructive }]} />
              <Text style={[styles.badgeText, { color: product.inStock ? colors.light.success : colors.light.destructive }]}>
                {product.inStock ? t('inStock') : t('outOfStock')}
              </Text>
            </View>
          </View>

          {/* Name */}
          <Text style={[styles.productName, { textAlign: isRTL ? 'right' : 'left' }]}>{name}</Text>

          {/* Rating */}
          <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <RatingStars rating={product.rating} reviewsCount={product.reviewsCount} size={14} />
          </View>

          {/* Price */}
          <View style={[styles.priceBlock, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.price}>
              {displayPrice.toLocaleString()} {t('egp')}
            </Text>
            {product.discountPrice && (
              <>
                <Text style={styles.originalPrice}>{product.price.toLocaleString()}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{discountPct}%</Text>
                </View>
              </>
            )}
          </View>

          {/* Storage selector */}
          {product.storage && product.storage.length > 1 && (
            <View style={styles.selectorBlock}>
              <Text style={[styles.selectorLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t('storage')}
              </Text>
              <View style={[styles.selectorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {product.storage.map((s, idx) => (
                  <Pressable
                    key={s}
                    onPress={() => { Haptics.selectionAsync(); setSelectedStorage(idx); }}
                    style={[styles.selectorChip, selectedStorage === idx && styles.selectorChipActive]}
                  >
                    <Text style={[styles.selectorChipText, selectedStorage === idx && styles.selectorChipTextActive]}>
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* RAM selector */}
          {product.ram && product.ram.length > 1 && (
            <View style={styles.selectorBlock}>
              <Text style={[styles.selectorLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t('ram')}
              </Text>
              <View style={[styles.selectorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {product.ram.map((r, idx) => (
                  <Pressable
                    key={r}
                    onPress={() => { Haptics.selectionAsync(); setSelectedRam(idx); }}
                    style={[styles.selectorChip, selectedRam === idx && styles.selectorChipActive]}
                  >
                    <Text style={[styles.selectorChipText, selectedRam === idx && styles.selectorChipTextActive]}>
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descBlock}>
            <Text style={[styles.blockTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('description')}
            </Text>
            <Text style={[styles.descText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {description}
            </Text>
          </View>

          {/* Specifications */}
          <View style={styles.descBlock}>
            <Text style={[styles.blockTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('specifications')}
            </Text>
            {specs.map((spec, idx) => (
              <View
                key={spec.label}
                style={[
                  styles.specRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  idx % 2 === 0 && styles.specRowAlt,
                ]}
              >
                <Text style={[styles.specLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {spec.label}
                </Text>
                <Text style={[styles.specValue, { textAlign: isRTL ? 'left' : 'right' }]}>
                  {spec.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Store info */}
          {store && (
            <Pressable
              onPress={() => router.push(`/store/${store.id}`)}
              style={[styles.storeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            >
              <View style={[styles.storeLogo, { backgroundColor: store.logoColor }]}>
                <Text style={styles.storeLogoText}>{store.logoInitial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.storeName, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? store.nameAr : store.nameEn}
                </Text>
                <RatingStars rating={store.rating} reviewsCount={store.reviewsCount} size={12} />
              </View>
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={18}
                color={colors.light.mutedForeground}
              />
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* CTA button */}
      <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, bottomInset) + 12 }]}>
        <Pressable
          onPress={handleContact}
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
        >
          <LinearGradient
            colors={['#1E40AF', '#2563EB', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.ctaBtnText}>{t('contactSeller')}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 16,
  },
  topBar: {
    width: '100%',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  productVisual: {
    width: 180,
    height: 200,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneMockupLarge: {
    width: 100,
    height: 170,
    borderRadius: 18,
    borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    padding: 8,
    gap: 6,
  },
  phoneMockupScreen: {
    flex: 1,
    width: '100%',
    borderRadius: 10,
  },
  phoneMockupSpeaker: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  phoneMockupHome: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorRow: {
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: colors.light.foreground,
    transform: [{ scale: 1.2 }],
  },
  infoCard: {
    padding: 20,
    gap: 16,
  },
  badgeRow: { gap: 8, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.light.primaryLight,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.light.primary,
  },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  productName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    lineHeight: 30,
  },
  priceBlock: { alignItems: 'center', gap: 10 },
  price: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: colors.light.primary,
  },
  originalPrice: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: colors.light.destructive,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  selectorBlock: { gap: 8 },
  selectorLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
  },
  selectorRow: { gap: 8, flexWrap: 'wrap' },
  selectorChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: colors.radiusMd,
    borderWidth: 1.5,
    borderColor: colors.light.border,
    backgroundColor: colors.light.muted,
  },
  selectorChipActive: {
    borderColor: colors.light.primary,
    backgroundColor: colors.light.primaryLight,
  },
  selectorChipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.light.foreground,
  },
  selectorChipTextActive: {
    color: colors.light.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  descBlock: {
    gap: 10,
    padding: 14,
    backgroundColor: colors.light.backgroundSecondary,
    borderRadius: colors.radiusMd,
  },
  blockTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  descText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    lineHeight: 22,
  },
  specRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specRowAlt: { backgroundColor: colors.light.muted + '60' },
  specLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
    flex: 1,
  },
  specValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
    flex: 1,
  },
  storeRow: {
    alignItems: 'center',
    padding: 14,
    borderRadius: colors.radiusMd,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: colors.light.backgroundSecondary,
    gap: 12,
  },
  storeLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoText: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  storeName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
  },
  cta: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  ctaBtn: {
    borderRadius: colors.radiusFull,
    overflow: 'hidden',
    shadowColor: colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  ctaBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
});
