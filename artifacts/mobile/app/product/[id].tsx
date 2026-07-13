import React, { useState, useRef, useEffect } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring, interpolate, Extrapolate, withTiming } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { products, stores } from '@/data/mockData';
import RatingStars from '@/components/RatingStars';
import ProductCard from '@/components/ProductCard';
import { getFontFamily } from '@/constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, isRTL, language } = useLanguage();
  const { toggleFavoriteProduct, isProductFavorite } = useFavorites();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const product = products.find((p) => p.id === id) || products[0]; // fallback to first product if not found

  const store = stores.find((s) => s.id === product.storeId);
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const fontFamBold = getFontFamily(isRTL, 'bold');
  const fontFamSemi = getFontFamily(isRTL, 'semiBold');
  const fontFamReg = getFontFamily(isRTL, 'regular');
  const latinBold = getFontFamily(false, 'bold');
  const latinReg = getFontFamily(false, 'regular');

  const isFav = isProductFavorite(product.id);
  const name = language === 'ar' ? product.nameAr : product.nameEn;
  const description = language === 'ar' ? product.descriptionAr : product.descriptionEn;

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState(0);
  const [selectedRam, setSelectedRam] = useState(0);

  const displayPrice = product.discountPrice ?? product.price;
  const discountPct = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const scrollX = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  function handleFavorite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavoriteProduct(product.id);
  }

  function handleContact(storeOverride?: typeof stores[0]) {
    const targetStore = storeOverride ?? store;
    if (!targetStore) return;
    const num = targetStore.whatsapp.replace('+', '');
    const msg = encodeURIComponent(
      language === 'ar'
        ? `مرحباً، أنا مهتم بـ: ${product.nameAr}`
        : `Hello, I'm interested in: ${product.nameEn}`,
    );
    Linking.openURL(`https://wa.me/${num}?text=${msg}`);
  }

  function handleCall(storeOverride?: typeof stores[0]) {
    const targetStore = storeOverride ?? store;
    if (!targetStore) return;
    Linking.openURL(`tel:${targetStore.phone}`);
  }

  const colorNames = ['أسود فانتوم', 'فضي جليدي', 'أزرق سماوي', 'أخضر غابة'];
  const colorNamesEn = ['Phantom Black', 'Glacier Silver', 'Sky Blue', 'Forest Green'];

  const specItems = [
    { icon: 'phone-portrait', label: language === 'ar' ? 'الشاشة' : 'Display', value: '6.8", QHD+, 144Hz, 2600 nits' },
    { icon: 'hardware-chip', label: language === 'ar' ? 'المعالج' : 'Processor', value: product.brand === 'Apple' ? 'Apple A18 Pro' : 'Snapdragon 8 Gen 4' },
    { icon: 'server', label: language === 'ar' ? 'الذاكرة' : 'RAM', value: product.ram?.join(' / ') ?? '8GB' },
    { icon: 'camera', label: language === 'ar' ? 'الكاميرا' : 'Camera', value: '200MP Wide, 50MP UW, 12MP Telephoto' },
    { icon: 'battery-full', label: language === 'ar' ? 'البطارية' : 'Battery', value: '5500mAh, 120W, 50W Wireless' },
    { icon: 'shield-checkmark', label: language === 'ar' ? 'الأمان' : 'Security', value: 'Under-display fingerprint, Face ID' },
  ];

  const mockImages = [1, 2, 3]; // Mock multiple images for carousel

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View style={[styles.hero, { paddingTop: topInset + 8, backgroundColor: product.imageColor + '15' }]}>
          {/* Top bar */}
          <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={() => router.back()} style={styles.circleBtn}>
              <Ionicons
                name={isRTL ? 'chevron-forward' : 'chevron-back'}
                size={24}
                color={colors.light.foreground}
              />
            </Pressable>
            <View style={[styles.topBtnGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Pressable onPress={handleFavorite} style={styles.circleBtn}>
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFav ? colors.light.destructive : colors.light.foreground}
                />
              </Pressable>
              <Pressable style={styles.circleBtn}>
                <Ionicons name="share-outline" size={22} color={colors.light.foreground} />
              </Pressable>
              <Pressable style={styles.circleBtn}>
                <Ionicons name="swap-horizontal-outline" size={22} color={colors.light.foreground} />
              </Pressable>
            </View>
          </View>

          {/* Product visual Carousel */}
          <View style={styles.productVisualContainer}>
             <Animated.ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                bounces={true} // Rubber-band effect
                overScrollMode="always"
             >
                {mockImages.map((_, index) => {
                  return (
                    <View key={index} style={[styles.carouselItem, { width: SCREEN_WIDTH }]}>
                      <View style={[styles.phoneMockupLarge, { borderColor: product.imageColor + '40', backgroundColor: product.imageColor + '10' }]}>
                        <View style={[styles.phoneMockupScreen, { backgroundColor: product.imageColor + '20' }]} />
                        <View style={[styles.phoneMockupSpeaker, { backgroundColor: product.imageColor + '40' }]} />
                        <View style={[styles.phoneMockupHome, { backgroundColor: product.imageColor + '30' }]} />
                      </View>
                    </View>
                  )
                })}
             </Animated.ScrollView>
             
             {/* Pagination Dots */}
             <View style={styles.paginationContainer}>
               {mockImages.map((_, i) => {
                 const dotStyle = useAnimatedStyle(() => {
                   const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
                   const width = interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolate.CLAMP);
                   const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolate.CLAMP);
                   return { width, opacity };
                 });
                 return <Animated.View key={i} style={[styles.paginationDot, dotStyle, { backgroundColor: colors.light.primary }]} />;
               })}
             </View>

            <Pressable style={styles.badge360}>
              <Text style={[styles.badge360Text, { fontFamily: latinBold }]}>360°</Text>
            </Pressable>
          </View>

        </Animated.View>

        {/* Info Area (pulls up over the hero slightly) */}
        <Animated.View entering={FadeInUp.delay(100).springify().stiffness(300).damping(28)} style={styles.infoSection}>
          
          {/* Color swatches */}
          {product.colors && product.colors.length > 0 && (
            <View style={[styles.colorsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {product.colors.map((color, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => { Haptics.selectionAsync(); setSelectedColor(idx); }}
                  style={styles.colorSwatch}
                >
                  <View
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      selectedColor === idx && styles.colorCircleSelected,
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          )}

          {/* Badges row */}
          <View style={[styles.badgeRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 16 }]}>
            {product.isNew && (
              <View style={styles.pillBadge}>
                <Text style={[styles.pillBadgeText, { fontFamily: latinBold }]}>NEW</Text>
              </View>
            )}
            {product.isBestSeller && (
              <View style={[styles.pillBadge, { backgroundColor: colors.light.warningLight }]}>
                <Ionicons name="star" size={12} color={colors.light.warning} />
                <Text style={[styles.pillBadgeText, { color: colors.light.warning, fontFamily: fontFamSemi }]}>
                  {language === 'ar' ? 'الأكثر مبيعاً' : 'Best Seller'}
                </Text>
              </View>
            )}
            <View style={[styles.pillBadge, { backgroundColor: product.inStock ? colors.light.successLight : '#FEE2E2' }]}>
              <View style={[styles.stockDot, { backgroundColor: product.inStock ? colors.light.success : colors.light.destructive }]} />
              <Text style={[styles.pillBadgeText, { color: product.inStock ? colors.light.success : colors.light.destructive, fontFamily: fontFamSemi }]}>
                {product.inStock ? t('inStock') : t('outOfStock')}
              </Text>
            </View>
          </View>

          {/* Name + store */}
          <Text style={[styles.productName, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>{name}</Text>
          {store && (
            <Pressable
              style={[styles.storeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => router.push(`/store/${store.id}`)}
            >
              <View style={[styles.storeLogo, { backgroundColor: store.logoColor }]}>
                <Text style={[styles.storeLogoText, { fontFamily: latinBold }]}>{store.logoInitial}</Text>
              </View>
              <Text style={[styles.storeName, { fontFamily: fontFamSemi }]}>{language === 'ar' ? store.nameAr : store.nameEn}</Text>
              {store.isVerified && (
                <View style={styles.verifiedStoreBadge}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={16}
                color={colors.light.mutedForeground}
              />
            </Pressable>
          )}

          {/* Rating */}
          <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', marginVertical: 8 }]}>
            <RatingStars rating={product.rating} reviewsCount={product.reviewsCount} size={16} />
          </View>

          {/* Price */}
          <View style={[styles.priceBlock, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View>
              <Text style={[styles.priceLbl, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamReg }]}>
                {language === 'ar' ? 'السعر الحالي' : 'Current Price'}
              </Text>
              <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'baseline', gap: 8 }]}>
                <Text style={[styles.price, { fontFamily: latinBold }]}>{displayPrice.toLocaleString()}</Text>
                <Text style={[styles.currency, { fontFamily: fontFamSemi }]}>{t('egp')}</Text>
                {product.discountPrice && (
                  <Text style={[styles.oldPrice, { fontFamily: latinReg }]}>{product.price.toLocaleString()}</Text>
                )}
              </View>
            </View>
            {discountPct > 0 && (
              <View style={styles.discountTag}>
                <Text style={[styles.discountTagText, { fontFamily: fontFamBold }]}>{discountPct}% {t('discount')}</Text>
              </View>
            )}
          </View>

          {/* Delivery info */}
          <View style={[styles.deliveryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <DeliveryChip icon="cube" label={language === 'ar' ? 'متاح' : 'IN STOCK'} color={colors.light.success} isRTL={isRTL} fontFam={fontFamSemi} />
            <DeliveryChip icon="car" label={language === 'ar' ? 'توصيل مجاني' : 'FREE Delivery'} color={colors.light.primary} isRTL={isRTL} fontFam={fontFamSemi} />
            <DeliveryChip icon="shield-checkmark" label={language === 'ar' ? 'ضمان سنتين' : '2-YEAR WARRANTY'} color={colors.light.warning} isRTL={isRTL} fontFam={fontFamSemi} />
          </View>
        </Animated.View>

        {/* Variant Selectors */}
        <Animated.View entering={FadeInUp.delay(150).springify().stiffness(300).damping(28)} style={styles.selectorsWrapper}>
          {/* Storage selector */}
          {product.storage && product.storage.length > 0 && (
            <View style={styles.selectorSection}>
              <Text style={[styles.selectorTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
                {t('storage')}
              </Text>
              <View style={[styles.pillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {product.storage.map((val, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => { Haptics.selectionAsync(); setSelectedStorage(idx); }}
                    style={[styles.pill, selectedStorage === idx && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, selectedStorage === idx && styles.pillTextActive, { fontFamily: latinBold }]}>
                      {val}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* RAM selector */}
          {product.ram && product.ram.length > 1 && (
            <View style={styles.selectorSection}>
              <Text style={[styles.selectorTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
                {t('ram')}
              </Text>
              <View style={[styles.pillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {product.ram.map((val, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => { Haptics.selectionAsync(); setSelectedRam(idx); }}
                    style={[styles.pill, selectedRam === idx && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, selectedRam === idx && styles.pillTextActive, { fontFamily: latinBold }]}>
                      {val}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </Animated.View>

        {/* Specifications accordion */}
        <Animated.View entering={FadeInUp.delay(200).springify().stiffness(300).damping(28)} style={styles.specsCard}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
            {t('specifications')}
          </Text>
          {specItems.map((spec, idx) => (
            <View key={idx} style={[styles.specItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.specItemIcon}>
                <Ionicons name={spec.icon as any} size={20} color={colors.light.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.specItemLabel, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamSemi }]}>{spec.label}</Text>
                <Text style={[styles.specItemValue, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>{spec.value}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.light.mutedForeground} />
            </View>
          ))}
          
          <View style={styles.bestForCard}>
             <View style={[styles.bestForHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Ionicons name="thumbs-up" size={20} color="#D97706" />
                <Text style={[styles.bestForTitle, { fontFamily: fontFamBold, textAlign: isRTL ? 'right' : 'left' }]}>
                   {language === 'ar' ? 'الخلاصة:' : 'Best For...'}
                </Text>
             </View>
             <Text style={[styles.bestForText, { fontFamily: fontFamReg, textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'ممتاز للتصوير الليلي والألعاب بفضل المعالج القوي والبطارية الضخمة.' : 'Excellent for night photography and gaming thanks to the powerful processor and huge battery.'}
             </Text>
          </View>
        </Animated.View>

        {/* Cross-store price comparison */}
        <Animated.View entering={FadeInUp.delay(250).springify().stiffness(300).damping(28)} style={styles.storesPriceCard}>
          <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
              {language === 'ar' ? 'مقارنة الأسعار' : 'Price Comparison'}
            </Text>
          </View>
          {stores.slice(0, 3).map((s, idx) => {
            const price = Math.round(displayPrice * (1 + idx * 0.04 - 0.01));
            const isLowest = idx === 0;
            const stName = language === 'ar' ? s.nameAr : s.nameEn;
            return (
              <View key={s.id} style={[styles.storeRow2, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.storeLogo2, { backgroundColor: s.logoColor }]}>
                  <Text style={[styles.storeLogoText2, { fontFamily: latinBold }]}>{s.logoInitial}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                  <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }]}>
                    <Text style={[styles.storeRowName, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamSemi }]} numberOfLines={1}>
                      {stName}
                    </Text>
                    {s.isVerified && <View style={styles.verifiedStoreBadgeSmall}><Ionicons name="checkmark" size={8} color="#fff" /></View>}
                  </View>
                  <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginTop: 4 }]}>
                    <RatingStars rating={s.rating} showCount={false} size={10} />
                    <Text style={[styles.storeRowCity, { fontFamily: fontFamReg }]}>
                      {language === 'ar' ? s.governorate : s.city}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                  <Text style={[styles.storeRowPrice, { fontFamily: latinBold }, isLowest && { color: colors.light.success }]}>
                    {price.toLocaleString()}
                  </Text>
                  {isLowest && (
                    <View style={styles.bestPricePill}>
                      <Text style={[styles.bestPricePillText, { fontFamily: fontFamSemi }]}>
                        {language === 'ar' ? 'أقل سعر' : 'Best Price'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300).springify().stiffness(300).damping(28)} style={styles.relatedSection}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold, marginHorizontal: 16 }]}>
              {language === 'ar' ? 'منتجات مشابهة' : 'Related Products'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingTop: 16 }}
            >
              {relatedProducts.map((rp) => (
                <ProductCard
                  key={rp.id}
                  product={rp}
                  onPress={() => router.push(`/product/${rp.id}`)}
                  width={160}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <Animated.View entering={FadeInDown.delay(400).springify()} style={[styles.bottomBar, { paddingBottom: bottomInset + 16, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable onPress={handleFavorite} style={[styles.bottomFavBtn, isFav && styles.bottomFavBtnActive]}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={24}
            color={isFav ? colors.light.destructive : colors.light.mutedForeground}
          />
        </Pressable>
        <Pressable style={styles.reserveBtnBtn} onPress={() => handleContact()}>
          <Ionicons name="bookmark" size={20} color={colors.light.btnPrimaryText} />
          <Text style={[styles.reserveBtnTextText, { fontFamily: fontFamBold }]}>
            {language === 'ar' ? 'احجز الآن' : 'RESERVE NOW'}
          </Text>
        </Pressable>
        <Pressable style={styles.cartBtn}>
          <Ionicons name="share-social-outline" size={24} color={colors.light.foreground} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

function DeliveryChip({ icon, label, color, isRTL, fontFam }: { icon: any; label: string; color: string, isRTL: boolean, fontFam: string }) {
  return (
    <View style={[styles.deliveryChip, { borderColor: color + '25', backgroundColor: color + '10', flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.deliveryChipText, { color, fontFamily: fontFam }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  scroll: { flex: 1 },

  hero: {
    paddingBottom: 40, // extra padding to allow infoSection to overlap
  },
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
    zIndex: 10,
  },
  topBtnGroup: { gap: 12 },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  productVisualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 320,
  },
  carouselItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneMockupLarge: {
    width: 160,
    height: 260,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    padding: 12,
    gap: 8,
    shadowColor: colors.light.shadowStrong,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 8,
  },
  phoneMockupScreen: { flex: 1, width: '100%', borderRadius: 16 },
  phoneMockupSpeaker: { width: 40, height: 6, borderRadius: 3 },
  phoneMockupHome: { width: 36, height: 36, borderRadius: 18 },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  badge360: {
    position: 'absolute',
    top: 20,
    right: 32,
    backgroundColor: colors.light.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  badge360Text: { fontSize: 13, color: colors.light.foreground },
  
  infoSection: {
    backgroundColor: colors.light.card,
    borderTopLeftRadius: colors.radiusXl,
    borderTopRightRadius: colors.radiusXl,
    marginTop: -30,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  colorsRow: {
    gap: 16,
    justifyContent: 'center',
  },
  colorSwatch: { alignItems: 'center' },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: colors.light.foreground,
    transform: [{ scale: 1.1 }],
  },
  
  badgeRow: { gap: 8, flexWrap: 'wrap' },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.light.primaryLight,
  },
  pillBadgeText: {
    fontSize: 12,
    color: colors.light.primary,
  },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  
  productName: {
    fontSize: 26,
    color: colors.light.foreground,
    lineHeight: 34,
    marginTop: 16,
  },
  storeRow: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  storeLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoText: { fontSize: 14, color: '#fff' },
  storeName: { fontSize: 15, color: colors.light.mutedForeground, flex: 1 },
  verifiedStoreBadge: {
    backgroundColor: colors.light.verifiedBlue,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  priceBlock: { alignItems: 'flex-start', gap: 16, marginVertical: 16 },
  priceLbl: { fontSize: 13, color: colors.light.mutedForeground },
  price: { fontSize: 32, color: colors.light.foreground },
  currency: { fontSize: 16, color: colors.light.mutedForeground },
  oldPrice: {
    fontSize: 18,
    color: colors.light.textTertiary,
    textDecorationLine: 'line-through',
  },
  discountTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.light.destructive,
    borderRadius: 12,
  },
  discountTagText: { fontSize: 14, color: '#fff' },
  
  deliveryRow: { gap: 8, flexWrap: 'wrap' },
  deliveryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  deliveryChipText: { fontSize: 12 },

  selectorsWrapper: {
    gap: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  selectorSection: {
    backgroundColor: colors.light.card,
    borderRadius: colors.radiusLg,
    padding: 16,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  selectorTitle: {
    fontSize: 16,
    color: colors.light.foreground,
    marginBottom: 12,
  },
  pillsRow: { gap: 10, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.light.border,
    backgroundColor: colors.light.cardSoft,
  },
  pillActive: {
    backgroundColor: colors.light.primaryLight,
    borderColor: colors.light.primary,
  },
  pillText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
  pillTextActive: { color: colors.light.primary },

  specsCard: {
    backgroundColor: colors.light.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: colors.radiusXl,
    padding: 20,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    color: colors.light.foreground,
    marginBottom: 16,
  },
  specItem: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  specItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specItemLabel: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    marginBottom: 4,
  },
  specItemValue: {
    fontSize: 15,
    color: colors.light.foreground,
  },
  bestForCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  bestForHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bestForTitle: {
    fontSize: 15,
    color: '#D97706',
  },
  bestForText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },

  storesPriceCard: {
    backgroundColor: colors.light.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: colors.radiusXl,
    padding: 20,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeaderRow: { marginBottom: 16 },
  storeRow2: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    gap: 12,
  },
  storeLogo2: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoText2: { fontSize: 20, color: '#fff' },
  storeRowName: {
    fontSize: 15,
    color: colors.light.foreground,
    flexShrink: 1,
  },
  verifiedStoreBadgeSmall: {
    backgroundColor: colors.light.verifiedBlue,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeRowCity: { fontSize: 13, color: colors.light.mutedForeground },
  storeRowPrice: {
    fontSize: 18,
    color: colors.light.foreground,
  },
  bestPricePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.light.successLight,
    borderRadius: 8,
    marginTop: 6,
  },
  bestPricePillText: { fontSize: 11, color: colors.light.success },

  relatedSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    color: colors.light.foreground,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.light.card,
    paddingTop: 16,
    paddingHorizontal: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    shadowColor: colors.light.shadowStrong,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
    alignItems: 'center',
  },
  bottomFavBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.light.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  bottomFavBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.light.destructive,
  },
  reserveBtnBtn: {
    flex: 1,
    backgroundColor: colors.light.btnPrimaryBg,
    height: 56,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reserveBtnTextText: {
    fontSize: 16,
    color: colors.light.btnPrimaryText,
  },
  cartBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.light.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
  },
});
