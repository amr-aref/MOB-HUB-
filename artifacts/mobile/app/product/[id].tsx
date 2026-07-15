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
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useGetProduct, useGetStore, useGetProducts, useCreateConversation } from '@workspace/api-client-react';
import { useDeviceId } from '@/hooks/useDeviceId';
import RatingStars from '@/components/RatingStars';
import { useLayout } from '@/hooks/useLayout';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, isRTL, language } = useLanguage();
  const { toggleFavoriteProduct, isProductFavorite } = useFavorites();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();

  const { data: product, isLoading: productLoading } = useGetProduct(id!);
  const { data: store } = useGetStore(product?.storeId ?? '', {
    query: { enabled: !!product?.storeId, queryKey: ['getStore', product?.storeId ?? ''] },
  });
  const { data: relatedProductsData = [] } = useGetProducts(
    { category: product?.category ?? '', excludeId: id },
    { query: { enabled: !!product?.category, queryKey: ['getProducts', product?.category ?? ''] } },
  );

  // Hooks must be called unconditionally — before any early return
  const deviceId = useDeviceId();
  const { mutate: createConversation, isPending: creatingConv } = useCreateConversation({
    mutation: {
      onSuccess: (conv) => router.push(`/messages/${conv.id}` as any),
    },
  });

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState(0);
  const [selectedRam, setSelectedRam] = useState(0);

  if (productLoading || !product) return null;

  const relatedProducts = relatedProductsData.slice(0, 4);

  const topInset = isTablet ? 24 : (Platform.OS === 'web' ? 67 : insets.top);
  const bottomInset = isTablet ? 0 : (Platform.OS === 'web' ? 34 : 0);

  const isFav = isProductFavorite(product.id);
  const name = language === 'ar' ? product.nameAr : product.nameEn;
  const description = language === 'ar' ? product.descriptionAr : product.descriptionEn;
  const warranty = language === 'ar' ? product.warrantyAr : product.warranty;

  const displayPrice = product.discountPrice ?? product.price;
  const discountPct = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  // product is guaranteed non-null here (guarded above). Function declarations
  // are hoisted so TypeScript can't track the narrowing — use product! throughout.
  function handleFavorite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavoriteProduct(product!.id);
  }

  function handleContact(storeOverride?: any) {
    const targetStore = storeOverride ?? store;
    if (!targetStore) return;
    const num = targetStore.whatsapp.replace('+', '');
    const msg = encodeURIComponent(
      language === 'ar'
        ? `مرحباً، أنا مهتم بـ: ${product!.nameAr}`
        : `Hello, I'm interested in: ${product!.nameEn}`,
    );
    Linking.openURL(`https://wa.me/${num}?text=${msg}`);
  }

  function handleMessageAboutProduct() {
    if (!deviceId || !store) return;
    createConversation({
      data: {
        buyerId: deviceId,
        storeId: store!.id,
        productId: product!.id,
        productNameAr: product!.nameAr,
        productNameEn: product!.nameEn,
      },
    });
  }

  function handleCall(storeOverride?: any) {
    const targetStore = storeOverride ?? store;
    if (!targetStore) return;
    Linking.openURL(`tel:${targetStore.phone}`);
  }

  // Mock color names
  const colorNames = ['أسود فانتوم', 'فضي جليدي', 'أزرق سماوي', 'أخضر غابة'];
  const colorNamesEn = ['Phantom Black', 'Glacier Silver', 'Sky Blue', 'Forest Green'];

  const specItems = [
    { icon: 'phone-portrait', label: language === 'ar' ? 'الشاشة' : 'Display', value: '6.8", QHD+, 144Hz, 2600 nits', expandable: true },
    { icon: 'hardware-chip', label: language === 'ar' ? 'المعالج' : 'Processor', value: product.brand === 'Apple' ? 'Apple A18 Pro' : 'Snapdragon 8 Gen 4', expandable: true },
    { icon: 'server', label: language === 'ar' ? 'الذاكرة' : 'RAM', value: product.ram?.join(' / ') ?? '8GB', expandable: true },
    { icon: 'camera', label: language === 'ar' ? 'الكاميرا' : 'Camera', value: '200MP Wide, 50MP UW, 12MP Telephoto', expandable: true },
    { icon: 'battery-full', label: language === 'ar' ? 'البطارية' : 'Battery', value: '5500mAh, 120W, 50W Wireless', expandable: true },
    { icon: 'shield-checkmark', label: language === 'ar' ? 'الأمان' : 'Security', value: 'Under-display fingerprint, Face ID', expandable: true },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          { paddingBottom: bottomInset + 100 },
          isTablet && styles.tabletScrollContent
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={isTablet ? [styles.tabletRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }] : undefined}>
          
          <View style={isTablet ? { width: '40%' } : undefined}>
            {/* Hero */}
            <View style={[styles.hero, { paddingTop: topInset + 8, backgroundColor: product.imageColor + '12' }, isTablet && styles.tabletHero]}>
              {/* Top bar */}
              <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Pressable onPress={() => router.back()} style={styles.circleBtn}>
                  <Ionicons
                    name={isRTL ? 'chevron-forward' : 'chevron-back'}
                    size={22}
                    color={colors.light.foreground}
                  />
                </Pressable>
                <View style={[styles.topBtnGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Pressable onPress={handleFavorite} style={styles.circleBtn}>
                    <Ionicons
                      name={isFav ? 'heart' : 'heart-outline'}
                      size={20}
                      color={isFav ? colors.light.destructive : colors.light.foreground}
                    />
                  </Pressable>
                  <Pressable style={styles.circleBtn}>
                    <Ionicons name="share-outline" size={20} color={colors.light.foreground} />
                  </Pressable>
                  <Pressable style={styles.circleBtn}>
                    <Ionicons name="swap-horizontal-outline" size={20} color={colors.light.foreground} />
                  </Pressable>
                </View>
              </View>

              {/* Product visual */}
              <View style={styles.productVisual}>
                <View style={[styles.phoneMockupLarge, { borderColor: product.imageColor + '50', backgroundColor: product.imageColor + '20' }]}>
                  <View style={[styles.phoneMockupScreen, { backgroundColor: product.imageColor + '30' }]} />
                  <View style={[styles.phoneMockupSpeaker, { backgroundColor: product.imageColor + '50' }]} />
                  <View style={[styles.phoneMockupHome, { backgroundColor: product.imageColor + '35' }]} />
                </View>
                <Pressable style={styles.badge360}>
                  <Text style={styles.badge360Text}>360°</Text>
                </Pressable>
              </View>

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
                          selectedColor === idx && styles.colorCircleSelected,
                        ]}
                      >
                        <View style={[styles.colorInner, { backgroundColor: color }]} />
                      </View>
                      <Text style={[styles.colorLabel, selectedColor === idx && styles.colorLabelActive]}>
                        {language === 'ar'
                          ? (colorNames[idx] ?? color)
                          : (colorNamesEn[idx] ?? color)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={isTablet ? { width: '60%' } : undefined}>
            {/* Info */}
            <View style={[styles.infoSection, isTablet && { marginTop: 0, marginHorizontal: 0 }]}>
              {/* Badges row */}
              <View style={[styles.badgeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {product.isNew && (
                  <View style={styles.pillBadge}>
                    <Text style={styles.pillBadgeText}>NEW</Text>
                  </View>
                )}
                {product.isBestSeller && (
                  <View style={[styles.pillBadge, { backgroundColor: colors.light.warningLight }]}>
                    <Ionicons name="star" size={10} color={colors.light.warning} />
                    <Text style={[styles.pillBadgeText, { color: colors.light.warning }]}>
                      {language === 'ar' ? 'الأكثر مبيعاً' : 'Best Seller'}
                    </Text>
                  </View>
                )}
                <View style={[styles.pillBadge, { backgroundColor: product.inStock ? colors.light.successLight : '#FEE2E2' }]}>
                  <View style={[styles.stockDot, { backgroundColor: product.inStock ? colors.light.success : colors.light.destructive }]} />
                  <Text style={[styles.pillBadgeText, { color: product.inStock ? colors.light.success : colors.light.destructive }]}>
                    {product.inStock ? t('inStock') : t('outOfStock')}
                  </Text>
                </View>
              </View>

              {/* Name + store */}
              <Text style={[styles.productName, { textAlign: isRTL ? 'right' : 'left' }]}>{name}</Text>
              {store && (
                <Pressable
                  style={[styles.storeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  onPress={() => router.push(`/store/${store.id}`)}
                >
                  <View style={[styles.storeLogo, { backgroundColor: store.logoColor }]}>
                    <Text style={styles.storeLogoText}>{store.logoInitial}</Text>
                  </View>
                  <Text style={styles.storeName}>{language === 'ar' ? store.nameAr : store.nameEn}</Text>
                  {store.isVerified && (
                    <Ionicons name="checkmark-circle" size={14} color={colors.light.primary} />
                  )}
                  <Ionicons
                    name={isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={14}
                    color={colors.light.mutedForeground}
                  />
                </Pressable>
              )}

              {/* Rating */}
              <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 4 }]}>
                <RatingStars rating={product.rating} reviewsCount={product.reviewsCount} size={14} />
              </View>

              {/* Price */}
              <View style={[styles.priceBlock, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View>
                  <Text style={[styles.priceLbl, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {language === 'ar' ? 'السعر الحالي' : 'Current Price'}
                  </Text>
                  <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'baseline', gap: 8 }]}>
                    <Text style={styles.price}>{displayPrice.toLocaleString()}</Text>
                    <Text style={styles.currency}>{t('egp')}</Text>
                    {product.discountPrice && (
                      <Text style={styles.oldPrice}>{product.price.toLocaleString()}</Text>
                    )}
                  </View>
                </View>
                {discountPct > 0 && (
                  <View style={styles.discountTag}>
                    <Text style={styles.discountTagText}>{discountPct}% {t('discount')}</Text>
                  </View>
                )}
              </View>

              {/* Delivery info */}
              <View style={[styles.deliveryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <DeliveryChip icon="cube-outline" label={language === 'ar' ? 'متاح' : 'IN STOCK'} color={colors.light.success} />
                <DeliveryChip icon="car-outline" label={language === 'ar' ? 'توصيل مجاني' : 'FREE Delivery'} color={colors.light.primary} />
                <DeliveryChip icon="shield-checkmark-outline" label={language === 'ar' ? 'ضمان ٢ سنة' : '2-YEAR GLOBAL'} color={colors.light.warning} />
              </View>
            </View>

            {/* Storage selector */}
            {product.storage && product.storage.length > 0 && (
              <View style={[styles.selectorSection, isTablet && { marginHorizontal: 0 }]}>
                <Text style={[styles.selectorTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t('storage')}
                </Text>
                <View style={[styles.pillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {product.storage.map((val, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => { Haptics.selectionAsync(); setSelectedStorage(idx); }}
                      style={[styles.pill, selectedStorage === idx && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, selectedStorage === idx && styles.pillTextActive]}>
                        {val}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* RAM selector */}
            {product.ram && product.ram.length > 1 && (
              <View style={[styles.selectorSection, isTablet && { marginHorizontal: 0 }]}>
                <Text style={[styles.selectorTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t('ram')}
                </Text>
                <View style={[styles.pillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {product.ram.map((val, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => { Haptics.selectionAsync(); setSelectedRam(idx); }}
                      style={[styles.pill, selectedRam === idx && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, selectedRam === idx && styles.pillTextActive]}>
                        {val}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Specifications accordion */}
        <View style={styles.specsCard}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('specifications')}
          </Text>
          {specItems.map((spec, idx) => (
            <View key={idx} style={[styles.specItem, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.6)' : 'transparent' }]}>
              <View style={styles.specItemIcon}>
                <Ionicons name={spec.icon as any} size={16} color={colors.light.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.specItemLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{spec.label}</Text>
                <Text style={[styles.specItemValue, { textAlign: isRTL ? 'right' : 'left' }]}>{spec.value}</Text>
              </View>
              <Ionicons name="chevron-down" size={16} color={colors.light.mutedForeground} />
            </View>
          ))}
        </View>

        {/* Cross-store price comparison */}
        <View style={styles.storesPriceCard}>
          <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'السعر في المتاجر' : 'Compare All Stores'}
            </Text>
          </View>
          {/* Note: mock data generation here handles mapping stores. In a real app we would use data */}
          {[1,2,3].map((_, idx) => {
            const price = Math.round(displayPrice * (1 + idx * 0.04 - 0.01));
            const isLowest = idx === 0;
            return (
              <View key={idx} style={[styles.storeRow2, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.storeLogo2, { backgroundColor: colors.light.primary }]}>
                  <Text style={styles.storeLogoText2}>S</Text>
                </View>
                <View style={{ flex: 1, marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }}>
                  <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}>
                    <Text style={[styles.storeRowName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                      Store {idx + 1}
                    </Text>
                  </View>
                  <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }]}>
                    <Ionicons name="location-outline" size={11} color={colors.light.mutedForeground} />
                    <Text style={styles.storeRowCity}>Cairo</Text>
                    {isLowest && (
                      <View style={styles.bestPricePill}>
                        <Text style={styles.bestPricePillText}>
                          {language === 'ar' ? 'أقل سعر' : 'Best Price'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}>
                  <Text style={[styles.storeRowPrice, isLowest && { color: colors.light.success }]}>
                    {price.toLocaleString()} {t('egp')}
                  </Text>
                </View>
                <View style={[styles.storeRowBtns, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Pressable style={styles.miniBtn} onPress={() => handleCall()}>
                    <Ionicons name="call" size={14} color={colors.light.success} />
                    <Text style={[styles.miniBtnText, { color: colors.light.success }]}>
                      {language === 'ar' ? 'اتصل' : 'Call'}
                    </Text>
                  </Pressable>
                  <Pressable style={[styles.miniBtn, { borderColor: '#25D366' }]} onPress={() => handleContact()}>
                    <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                    <Text style={[styles.miniBtnText, { color: '#25D366' }]}>WA</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        {/* Description */}
        {description && (
          <View style={styles.descCard}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('description')}
            </Text>
            <Text style={[styles.descText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {description}
            </Text>
          </View>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'منتجات مشابهة' : 'Related Products'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingRight: 16 }}
            >
              {relatedProducts.map((rp) => (
                <Pressable
                  key={rp.id}
                  style={styles.relatedCard}
                  onPress={() => router.push(`/product/${rp.id}`)}
                >
                  <View style={[styles.relatedImage, { backgroundColor: rp.imageColor + '20' }]}>
                    <Ionicons name="phone-portrait" size={24} color={rp.imageColor} />
                  </View>
                  <View style={styles.relatedInfo}>
                    <Text style={styles.relatedBrand}>{rp.brand}</Text>
                    <Text style={styles.relatedName} numberOfLines={2}>
                      {language === 'ar' ? rp.nameAr : rp.nameEn}
                    </Text>
                    <Text style={styles.relatedPrice}>
                      {(rp.discountPrice ?? rp.price).toLocaleString()} {t('egp')}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 12 }]}>
        <Pressable onPress={handleFavorite} style={[styles.bottomFavBtn, isFav && styles.bottomFavBtnActive]}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={22}
            color={isFav ? colors.light.destructive : colors.light.mutedForeground}
          />
        </Pressable>
        <Pressable style={styles.reserveBtnBottom} onPress={() => handleContact()}>
          <Ionicons name="bookmark-outline" size={18} color="#fff" />
          <Text style={styles.reserveBtnTextBottom}>
            {language === 'ar' ? 'احجز الآن' : 'RESERVE NOW'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.cartBtn, creatingConv && { opacity: 0.6 }]}
          onPress={handleMessageAboutProduct}
          disabled={creatingConv || !deviceId || !store}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'اسأل عن المنتج' : 'Ask about product'}
        >
          <Ionicons name="chatbubble-outline" size={22} color={colors.light.primary} />
        </Pressable>
      </View>
    </View>
  );
}

function DeliveryChip({ icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <View style={[styles.deliveryChip, { borderColor: color + '30', backgroundColor: color + '12' }]}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.deliveryChipText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { flex: 1 },

  tabletScrollContent: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
    padding: 24,
  },
  tabletRow: {
    gap: 24,
  },
  tabletHero: {
    borderRadius: colors.radiusLg,
  },

  // Hero
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topBtnGroup: { gap: 8 },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(15,23,42,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  productVisual: {
    alignItems: 'center',
    marginVertical: 12,
    position: 'relative',
  },
  phoneMockupLarge: {
    width: 140,
    height: 220,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    padding: 10,
    gap: 8,
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  phoneMockupScreen: { flex: 1, width: '100%', borderRadius: 14 },
  phoneMockupSpeaker: { width: 36, height: 5, borderRadius: 3 },
  phoneMockupHome: { width: 30, height: 30, borderRadius: 15 },
  badge360: {
    position: 'absolute',
    bottom: 0,
    right: 60,
    backgroundColor: 'rgba(37,99,235,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.light.primary + '30',
  },
  badge360Text: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.light.primary },
  colorsRow: {
    gap: 12,
    marginTop: 12,
    justifyContent: 'center',
  },
  colorSwatch: { alignItems: 'center', gap: 5 },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderColor: '#FF8A3D',
  },
  colorInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorLabel: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    textAlign: 'center',
    maxWidth: 52,
  },
  colorLabelActive: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
  },

  // Info
  infoSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: colors.radiusLg,
    padding: 16,
    shadowColor: 'rgba(15,23,42,0.07)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    gap: 10,
  },
  badgeRow: { gap: 6, flexWrap: 'wrap' },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.light.primaryLight,
  },
  pillBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.primary,
  },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  productName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    lineHeight: 28,
  },
  storeRow: {
    alignItems: 'center',
    gap: 6,
  },
  storeLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  storeName: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground, flex: 1 },
  priceBlock: { alignItems: 'flex-start', gap: 12 },
  priceLbl: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
  price: { fontSize: 32, fontFamily: 'Inter_800ExtraBold', color: '#2B2B2E' },
  currency: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground },
  oldPrice: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    textDecorationLine: 'line-through',
  },
  discountTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.light.destructive,
    borderRadius: 8,
  },
  discountTagText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  deliveryRow: { gap: 6, flexWrap: 'wrap' },
  deliveryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  deliveryChipText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },

  // Selector
  selectorSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: colors.radiusLg,
    padding: 14,
    shadowColor: 'rgba(15,23,42,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  selectorTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    marginBottom: 10,
  },
  pillsRow: { gap: 8, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  pillActive: {
    backgroundColor: '#2B2B2E',
    borderColor: '#2B2B2E',
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
  },
  pillTextActive: { color: '#fff' },

  // Specs card
  specsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: colors.radiusLg,
    padding: 16,
    shadowColor: 'rgba(15,23,42,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    marginBottom: 12,
  },
  specItem: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  specItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specItemLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
  },
  specItemValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
    marginTop: 1,
  },

  // Store prices
  storesPriceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: colors.radiusLg,
    padding: 16,
    shadowColor: 'rgba(15,23,42,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  cardHeaderRow: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  storeRow2: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.4)',
    gap: 8,
  },
  storeLogo2: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoText2: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  storeRowName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
    flexShrink: 1,
  },
  storeRowCity: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
  bestPricePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.light.successLight,
    borderRadius: 6,
  },
  bestPricePillText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: colors.light.success },
  storeRowPrice: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  storeRowBtns: { gap: 6 },
  miniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.light.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 54,
  },
  miniBtnText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  // Desc
  descCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: colors.radiusLg,
    padding: 16,
    shadowColor: 'rgba(15,23,42,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  descText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.secondaryForeground,
    lineHeight: 22,
  },

  // Related
  relatedSection: {
    marginTop: 20,
    paddingLeft: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    marginBottom: 12,
  },
  relatedCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: colors.radiusMd,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    alignItems: 'center',
  },
  relatedImage: {
    width: 80,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  relatedInfo: { alignItems: 'center', width: '100%' },
  relatedBrand: { fontSize: 10, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground },
  relatedName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground, textAlign: 'center', height: 32 },
  relatedPrice: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.light.primary, marginTop: 4 },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomFavBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomFavBtnActive: {
    backgroundColor: '#FEE2E2',
  },
  reserveBtnBottom: {
    flex: 1,
    height: 52,
    backgroundColor: '#2B2B2E',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reserveBtnTextBottom: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  cartBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
