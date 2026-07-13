import React, { useState, useEffect } from 'react';
import {
  Platform,
  Pressable,
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
import { products, stores } from '@/data/mockData';
import { AnimatedPressable, ChartBar } from '@/components/admin/AdminComponents';
import { AnimatedCounter } from '@/components/admin/AnimatedCounter';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, withDelay } from 'react-native-reanimated';

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
  const { t, isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
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

  const storeProducts = products.filter(p => p.storeId === STORE.id);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
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
          <AnimatedPressable style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.light.foreground} />
          </AnimatedPressable>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 16 }]}>
          <Ionicons name="search" size={20} color={colors.light.mutedForeground} style={{ marginHorizontal: 12 }} />
          <TextInput
            style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.regular }]}
            placeholder={isAr ? "بحث، تصوير، أو صوت..." : "Search, scan, or voice..."}
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

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: bottomInset + 100 }}>
        {/* Categories row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={[styles.categoriesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {CATEGORIES.map(cat => (
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
              <Text style={[
                styles.categoryPillText, 
                activeCategory === cat.id && styles.categoryPillTextActive, 
                { fontFamily: fontFamilyRTL.medium }
              ]}>
                {isAr ? cat.labelAr : cat.labelEn}
              </Text>
              <View style={[styles.categoryCount, activeCategory === cat.id && styles.categoryCountActive]}>
                <Text style={[styles.categoryCountText, activeCategory === cat.id && styles.categoryCountTextActive, { fontFamily: fontFamilyLTR.medium }]}>
                  {cat.count}
                </Text>
              </View>
            </AnimatedPressable>
          ))}
        </ScrollView>

        {/* Action Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.actionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          <AnimatedPressable style={styles.actionBtnWhite}>
            <Ionicons name="checkbox-outline" size={16} color={colors.light.foreground} />
            <Text style={[styles.actionBtnText, { fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'تحديد الكل' : 'Select All'}</Text>
          </AnimatedPressable>
          <AnimatedPressable style={styles.actionBtnWhite}>
            <Ionicons name="download-outline" size={16} color={colors.light.foreground} />
            <Text style={[styles.actionBtnText, { fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'تصدير' : 'Export'}</Text>
          </AnimatedPressable>
          <AnimatedPressable style={styles.actionBtnWhite}>
            <Ionicons name="copy-outline" size={16} color={colors.light.foreground} />
            <Text style={[styles.actionBtnText, { fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'تكرار' : 'Duplicate'}</Text>
          </AnimatedPressable>
          <AnimatedPressable style={styles.actionBtnWhite}>
            <Ionicons name="eye-off-outline" size={16} color={colors.light.foreground} />
            <Text style={[styles.actionBtnText, { fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'إخفاء' : 'Hide'}</Text>
          </AnimatedPressable>
        </ScrollView>

        {/* Products Grid */}
        <View style={styles.productsGrid}>
          {storeProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} isRTL={isRTL} isAr={isAr} fontFamilyLTR={fontFamilyLTR} fontFamilyRTL={fontFamilyRTL} delay={idx * 100} />
          ))}
        </View>

        {/* Analytics Mini Cards */}
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
              <View style={[styles.miniStatSparkline, { backgroundColor: stat.color + '33' }]} />
            </View>
          ))}
        </View>

      </ScrollView>

      {/* FAB */}
      <AnimatedPressable style={[styles.fab, isRTL ? { left: 24 } : { right: 24 }]} onPress={() => router.push('/dashboard/add-product')}>
        {isRTL && <Text style={[styles.fabText, { fontFamily: fontFamilyRTL.bold }]}>{language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}</Text>}
        <View style={styles.fabIcon}>
          <Ionicons name="add" size={24} color="#fff" />
        </View>
        {!isRTL && <Text style={[styles.fabText, { fontFamily: fontFamilyRTL.bold }]}>{language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}</Text>}
      </AnimatedPressable>
    </View>
  );
}

function ProductCard({ product, isRTL, isAr, fontFamilyLTR, fontFamilyRTL, delay }: any) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.bezier(0.22, 1, 0.36, 1) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.bezier(0.22, 1, 0.36, 1) }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  const name = isAr ? product.nameAr : product.nameEn;

  return (
    <Animated.View style={[styles.productCard, animatedStyle]}>
      <View style={styles.cardInner}>
        <View style={styles.productImageContainer}>
          <View style={[styles.productImage, { backgroundColor: product.imageColor + '10' }]}>
            <Ionicons name="phone-portrait" size={40} color={product.imageColor} />
            {product.discountPrice && (
              <View style={styles.productBadge}>
                <Text style={[styles.productBadgeText, { fontFamily: fontFamilyLTR.bold }]}>
                  -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.favoriteBtn, isRTL ? { left: 8 } : { right: 8 }]}>
             <Ionicons name="heart-outline" size={16} color={colors.light.foreground} />
          </View>
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productBrand, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyLTR.semiBold }]}>{product.brand}</Text>
          <Text style={[styles.productName, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.bold }]} numberOfLines={1}>{name}</Text>
          <Text style={[styles.productSku, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyLTR.regular }]}>SKU: {product.id.toUpperCase()}8492</Text>
          
          <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.productPrice, { fontFamily: fontFamilyLTR.bold }]}>
              ${(product.discountPrice || product.price) / 100}
            </Text>
            {product.discountPrice && (
              <Text style={[styles.productOldPrice, { fontFamily: fontFamilyLTR.regular }]}>
                ${product.price / 100}
              </Text>
            )}
          </View>

          <View style={[styles.stockRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.stockDot, { backgroundColor: product.inStock ? colors.light.success : colors.light.destructive }]} />
            <Text style={[styles.stockText, { color: product.inStock ? colors.light.success : colors.light.destructive, fontFamily: fontFamilyRTL.medium }]}>
              {product.inStock ? (isAr ? 'في المخزن' : 'In Stock') : (isAr ? 'مخزون منخفض' : 'Low Stock')}
            </Text>
            {!product.inStock && (
              <Text style={[styles.stockAlertText, { fontFamily: fontFamilyRTL.medium, marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0 }]}>
                {isAr ? 'تنبيه المخزون' : 'Stock Alert'}
              </Text>
            )}
          </View>

          <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.statItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
               <Ionicons name="eye-outline" size={12} color={colors.light.mutedForeground} />
               <Text style={[styles.statText, { fontFamily: fontFamilyLTR.medium }]}>1.2k</Text>
            </View>
            <View style={[styles.statItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
               <Ionicons name="heart-outline" size={12} color={colors.light.mutedForeground} />
               <Text style={[styles.statText, { fontFamily: fontFamilyLTR.medium }]}>340</Text>
            </View>
            <View style={[styles.statItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
               <Ionicons name="star" size={12} color={colors.light.star} />
               <Text style={[styles.statText, { fontFamily: fontFamilyLTR.medium }]}>{product.rating}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.productActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <AnimatedPressable style={styles.cardActionBtn}><Text style={[styles.cardActionText, { fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'تعديل' : 'Edit'}</Text></AnimatedPressable>
          <AnimatedPressable style={styles.cardActionBtn}><Text style={[styles.cardActionText, { fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'تكرار' : 'Dup'}</Text></AnimatedPressable>
          <AnimatedPressable style={styles.cardActionBtn}><Text style={[styles.cardActionText, { fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'إخفاء' : 'Hide'}</Text></AnimatedPressable>
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
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
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
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },

  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 999,
    height: 48,
    alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
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
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryPillActive: { backgroundColor: colors.light.btnPrimaryBg },
  categoryPillText: { fontSize: 14, color: colors.light.foreground },
  categoryPillTextActive: { color: '#fff' },
  categoryCount: { backgroundColor: colors.light.muted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  categoryCountActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  categoryCountText: { fontSize: 10, color: colors.light.foreground },
  categoryCountTextActive: { color: '#fff' },

  actionsRow: { paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  actionBtnWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  actionBtnText: { fontSize: 13, color: colors.light.foreground },

  productsGrid: { paddingHorizontal: 20, gap: 16, paddingBottom: 24 },
  productCard: { width: '100%' },
  cardInner: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  productImageContainer: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  productImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  productBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.light.destructive,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  productBadgeText: { color: '#fff', fontSize: 12 },
  favoriteBtn: {
    position: 'absolute',
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: { gap: 4 },
  productBrand: { fontSize: 11, color: colors.light.mutedForeground, textTransform: 'uppercase' },
  productName: { fontSize: 16, color: colors.light.foreground },
  productSku: { fontSize: 11, color: colors.light.textTertiary },
  priceRow: { alignItems: 'center', gap: 8, marginTop: 4 },
  productPrice: { fontSize: 20, color: colors.light.foreground },
  productOldPrice: { fontSize: 14, color: colors.light.textTertiary, textDecorationLine: 'line-through' },
  stockRow: { alignItems: 'center', gap: 6, marginTop: 8 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: 13 },
  stockAlertText: { fontSize: 13, color: colors.light.destructive, textDecorationLine: 'underline' },
  statsRow: { alignItems: 'center', gap: 12, marginTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  statItem: { alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: colors.light.mutedForeground },
  productActions: { paddingTop: 12, justifyContent: 'space-between' },
  cardActionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  cardActionText: { fontSize: 14, color: colors.light.foreground },

  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, paddingBottom: 32 },
  miniStatCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  miniStatIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  miniStatValue: { fontSize: 24, color: colors.light.foreground, marginBottom: 4 },
  miniStatLabel: { fontSize: 12, color: colors.light.mutedForeground, marginBottom: 12 },
  miniStatSparkline: { height: 4, borderRadius: 2, width: '100%' },

  fab: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: colors.light.primary,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 10,
    paddingVertical: 10,
    shadowColor: colors.light.shadowFabGlow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 8,
    gap: 12,
  },
  fabText: { color: '#fff', fontSize: 15 },
  fabIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
