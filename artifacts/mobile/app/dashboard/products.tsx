import React, { useState, useEffect } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { getFontFamily } from '@/constants/fonts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/hooks/useLayout';
import { products, stores } from '@/data/mockData';
import { AnimatedPressable } from '@/components/admin/AdminComponents';
import { AnimatedCounter } from '@/components/admin/AnimatedCounter';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { useNotifications } from '@/hooks/useNotifications';

const STORE = stores[0];

const CATEGORIES = [
  { id: 'all', labelAr: 'كل المنتجات', labelEn: 'All Products', count: 342, icon: 'grid-outline' },
  { id: 'smartphones', labelAr: 'هواتف ذكية', labelEn: 'Smartphones', count: 185, icon: 'phone-portrait-outline' },
  { id: 'tablets', labelAr: 'تابلت', labelEn: 'Tablets', count: 42, icon: 'tablet-portrait-outline' },
  { id: 'accessories', labelAr: 'إكسسوارات', labelEn: 'Accessories', count: 115, icon: 'headset-outline' },
];

const ANALYTICS = [
  { labelAr: 'إجمالي المنتجات', labelEn: 'Total Products', value: 342, icon: 'cube', color: '#3E8BFF' },
  { labelAr: 'نشط للبيع', labelEn: 'Active', value: 298, icon: 'checkmark-circle', color: '#2FBE5C' },
  { labelAr: 'مسودة', labelEn: 'Drafts', value: 15, icon: 'document-text', color: '#FFC94A' },
  { labelAr: 'نفذت الكمية', labelEn: 'Out of Stock', value: 29, icon: 'alert-circle', color: '#FF4D4D' },
];

export default function ProductsScreen() {
  const { isRTL, language } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const isAr = language === 'ar';

  const fontFamilyRTL = {
    regular: getFontFamily(isRTL, 'regular'),
    medium: getFontFamily(isRTL, 'medium'),
    semiBold: getFontFamily(isRTL, 'semiBold'),
    bold: getFontFamily(isRTL, 'bold'),
  };

  const fontFamilyLTR = {
    regular: getFontFamily(false, 'regular'),
    medium: getFontFamily(false, 'medium'),
    semiBold: getFontFamily(false, 'semiBold'),
    bold: getFontFamily(false, 'bold'),
  };

  const storeProducts = products.filter((p) => p.storeId === STORE.id);
  // Notification identity from session (not mock storeId). Backend uses req.user.sub.
  const { unreadCount } = useNotifications(user?.id);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <View style={isTablet ? styles.tabletInner : undefined}>
          <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }]}>
            <AnimatedPressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.light.foreground} />
            </AnimatedPressable>
            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={[styles.overline, { fontFamily: fontFamilyLTR.semiBold, letterSpacing: 1 }]}>
                PRODUCT MANAGEMENT STUDIO
              </Text>
              <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }]}>
                <View style={[styles.storeAvatar, { backgroundColor: STORE.logoColor }]}>
                  <Text style={[styles.storeAvatarText, { fontFamily: fontFamilyLTR.bold }]}>{STORE.logoInitial}</Text>
                </View>
                <Text style={[styles.storeName, { fontFamily: fontFamilyRTL.bold }]}>
                  {isAr ? STORE.nameAr : STORE.nameEn}
                </Text>
              </View>
            </View>
            <AnimatedPressable
              style={styles.iconBtn}
              onPress={() =>
                router.push({
                  pathname: '/notifications',
                  params: user?.id ? { userId: user.id } : {},
                })
              }
            >
              <Ionicons name="notifications-outline" size={22} color={colors.light.foreground} />
              {unreadCount > 0 && <View style={styles.notifDot} />}
            </AnimatedPressable>
          </View>

          <View style={[styles.searchContainer, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 16 }]}>
            <Ionicons name="search" size={20} color={colors.light.mutedForeground} style={{ marginHorizontal: 12 }} />
            <TextInput
              style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.regular }]}
              placeholder={isAr ? 'بحث، تصوير، أو صوت...' : 'Search, scan, or voice...'}
              placeholderTextColor={colors.light.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <AnimatedPressable style={styles.searchIconBtn}>
              <Ionicons name="mic-outline" size={20} color={colors.light.foreground} />
            </AnimatedPressable>
            <AnimatedPressable style={styles.searchIconBtn}>
              <Ionicons name="scan-outline" size={20} color={colors.light.foreground} />
            </AnimatedPressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 100, alignItems: isTablet ? 'center' : undefined }}
      >
        <View style={isTablet ? styles.tabletInner : { width: '100%' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.categoriesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            {CATEGORIES.map((cat) => (
              <AnimatedPressable
                key={cat.id}
                style={[styles.categoryPill, activeCategory === cat.id && styles.categoryPillActive]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={18}
                  color={activeCategory === cat.id ? '#FFF' : colors.light.foreground}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    activeCategory === cat.id && styles.categoryPillTextActive,
                    { fontFamily: fontFamilyRTL.medium },
                  ]}
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </Text>
                <View style={[styles.categoryCount, activeCategory === cat.id && styles.categoryCountActive]}>
                  <Text
                    style={[
                      styles.categoryCountText,
                      activeCategory === cat.id && styles.categoryCountTextActive,
                      { fontFamily: fontFamilyLTR.medium },
                    ]}
                  >
                    {cat.count}
                  </Text>
                </View>
              </AnimatedPressable>
            ))}
          </ScrollView>

          <View
            style={[
              styles.productsGrid,
              isTablet && { flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap' },
            ]}
          >
            {storeProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                isRTL={isRTL}
                isAr={isAr}
                fontFamilyLTR={fontFamilyLTR}
                fontFamilyRTL={fontFamilyRTL}
                delay={idx * 100}
                isTablet={isTablet}
              />
            ))}
          </View>

          <View style={[styles.analyticsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {ANALYTICS.map((stat, idx) => (
              <View key={idx} style={styles.miniStatCard}>
                <View style={[styles.miniStatIcon, { backgroundColor: stat.color + '1A' }]}>
                  <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                </View>
                <AnimatedCounter style={[styles.miniStatValue, { fontFamily: fontFamilyLTR.bold }]} value={stat.value} />
                <Text style={[styles.miniStatLabel, { fontFamily: fontFamilyRTL.medium }]} numberOfLines={1}>
                  {isAr ? stat.labelAr : stat.labelEn}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <AnimatedPressable
        style={[styles.fab, isRTL ? { left: 24 } : { right: 24 }]}
        onPress={() => router.push('/dashboard/add-product')}
      >
        {isRTL && (
          <Text style={[styles.fabText, { fontFamily: fontFamilyRTL.bold }]}>
            {language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
          </Text>
        )}
        <View style={styles.fabIcon}>
          <Ionicons name="add" size={24} color="#fff" />
        </View>
        {!isRTL && (
          <Text style={[styles.fabText, { fontFamily: fontFamilyRTL.bold }]}>
            {language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
          </Text>
        )}
      </AnimatedPressable>
    </View>
  );
}

function ProductCard({ product, isRTL, isAr, fontFamilyLTR, fontFamilyRTL, delay, isTablet }: any) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.bezier(0.22, 1, 0.36, 1) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.bezier(0.22, 1, 0.36, 1) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const name = isAr ? product.nameAr : product.nameEn;

  return (
    <Animated.View style={[styles.productCard, isTablet && styles.productCardTablet, animatedStyle]}>
      <View style={styles.cardInner}>
        <View style={styles.productImageContainer}>
          <View style={[styles.productImage, { backgroundColor: product.imageColor + '10' }]}>
            <Ionicons name="phone-portrait" size={40} color={product.imageColor} />
          </View>
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productBrand, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyLTR.semiBold }]}>
            {product.brand}
          </Text>
          <Text
            style={[styles.productName, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.bold }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.productPrice, { fontFamily: fontFamilyLTR.bold }]}>
              ${(product.discountPrice || product.price) / 100}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    backgroundColor: colors.light.background,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
  },
  headerRow: { gap: 12 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overline: { fontSize: 10, color: colors.light.mutedForeground, marginBottom: 2 },
  storeAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  storeAvatarText: { fontSize: 12, color: '#fff' },
  storeName: { fontSize: 16, color: colors.light.foreground },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.light.destructive,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 999,
    height: 48,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  searchInput: { flex: 1, height: '100%', fontSize: 14, color: colors.light.foreground },
  searchIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  categoriesRow: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 12 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 999,
  },
  categoryPillActive: { backgroundColor: colors.light.btnPrimaryBg },
  categoryPillText: { fontSize: 14, color: colors.light.foreground },
  categoryPillTextActive: { color: '#fff' },
  categoryCount: { backgroundColor: colors.light.muted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  categoryCountActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  categoryCountText: { fontSize: 10, color: colors.light.foreground },
  categoryCountTextActive: { color: '#fff' },
  productsGrid: { paddingHorizontal: 20, gap: 12 },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  productCardTablet: { width: '48%' },
  cardInner: {},
  productImageContainer: { height: 120 },
  productImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  productInfo: { padding: 12 },
  productBrand: { fontSize: 11, color: colors.light.mutedForeground },
  productName: { fontSize: 14, color: colors.light.foreground, marginTop: 2 },
  priceRow: { marginTop: 8 },
  productPrice: { fontSize: 16, color: colors.light.foreground },
  analyticsGrid: { paddingHorizontal: 20, paddingTop: 16, gap: 10, flexWrap: 'wrap' },
  miniStatCard: {
    flex: 1,
    minWidth: 70,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  miniStatIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  miniStatValue: { fontSize: 18, color: colors.light.foreground },
  miniStatLabel: { fontSize: 10, color: colors.light.mutedForeground, marginTop: 2 },
  fab: {
    position: 'absolute',
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.primary,
    borderRadius: 28,
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 10,
    gap: 12,
  },
  fabText: { color: '#fff', fontSize: 15 },
  fabIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletInner: { width: '100%', maxWidth: 760, alignSelf: 'center' },
});
