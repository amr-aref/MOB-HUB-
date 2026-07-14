import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useGetStores,
  useGetProducts,
  useGetCategories,
} from '@workspace/api-client-react';
import { BlurView } from 'expo-blur';
import SearchBar from '@/components/SearchBar';
import CategoryChip from '@/components/CategoryChip';
import StoreCard from '@/components/StoreCard';
import ProductCard from '@/components/ProductCard';
import { useLayout } from '@/hooks/useLayout';

function SectionHeader({
  title,
  onPress,
  t,
  isRTL,
}: {
  title: string;
  onPress: () => void;
  t: (k: any) => string;
  isRTL: boolean;
}) {
  return (
    <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
      <Pressable onPress={onPress} style={styles.seeAllBtn} hitSlop={8}>
        <Text style={styles.seeAllText}>{t('seeAll')}</Text>
        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={14}
          color={colors.light.primary}
        />
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { t, isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { isTablet } = useLayout();

  const topInset = isTablet ? 24 : (Platform.OS === 'web' ? 67 : insets.top);
  const bottomInset = isTablet ? 0 : (Platform.OS === 'web' ? 34 : 0);

  const { data: featuredStores = [] } = useGetStores({ isVerified: 'true' });
  const { data: newArrivals = [] } = useGetProducts({ isNew: 'true' });
  const { data: bestSellers = [] } = useGetProducts({ isBestSeller: 'true' });
  const { data: topRatedStores = [] } = useGetStores({ sort: 'rating' });
  const { data: categories = [] } = useGetCategories();

  return (
    <View style={styles.container}>
      {/* Premium White Header */}
      <BlurView intensity={26} tint="light" style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={isTablet ? styles.tabletCentered : undefined}>
          <View style={[styles.headerTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {/* App Brand */}
            <View style={[styles.brandRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.appIcon}>
                <Ionicons name="phone-portrait" size={18} color="#fff" />
              </View>
              <View style={{ marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }}>
                <Text style={[styles.appName, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t('appName')}
                </Text>
                <Text style={[styles.tagline, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t('appTagline')}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Pressable
                style={styles.iconBtn}
                hitSlop={8}
                onPress={() => router.push('/notifications')}
                accessibilityRole="button"
                accessibilityLabel={language === 'ar' ? 'الإشعارات' : 'Notifications'}
                accessibilityHint={language === 'ar' ? 'فتح صفحة الإشعارات' : 'Open notifications'}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.light.foreground} />
                <View style={styles.notifDot} />
              </Pressable>
              <Pressable
                style={styles.avatarBtn}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Ionicons name="person" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.searchWrap}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('searchPlaceholder')}
              isRTL={isRTL}
            />
          </View>
        </View>
      </BlurView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomInset + 100 },
          isTablet && styles.tabletScrollContent
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        <View style={styles.section}>
          <SectionHeader title={t('categories')} onPress={() => router.push({ pathname: '/products', params: { filter: 'all' } })} t={t} isRTL={isRTL} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.chipsRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            {categories.map((cat) => (
              <View key={cat.id} style={styles.chipWrap}>
                <CategoryChip
                  label={t(cat.id as any)}
                  icon={cat.icon}
                  iconColor={cat.color}
                  isSelected={selectedCategory === cat.id}
                  onPress={() =>
                    setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
                  }
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Featured Stores */}
        <View style={styles.section}>
          <SectionHeader
            title={t('featuredStores')}
            onPress={() => router.push('/(tabs)/stores')}
            t={t}
            isRTL={isRTL}
          />
          {isTablet ? (
            <View style={[styles.tabletGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {featuredStores.map((store) => (
                <View key={store.id} style={styles.tabletGridItem}>
                  <StoreCard store={store} onPress={() => router.push(`/store/${store.id}`)} />
                </View>
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.horizontalList,
                { paddingLeft: isRTL ? 0 : 16, paddingRight: isRTL ? 16 : 0 },
              ]}
            >
              {featuredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onPress={() => router.push(`/store/${store.id}`)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Today's Deals Banner */}
        <View style={styles.section}>
          <Pressable
            style={styles.dealsBanner}
            onPress={() => router.push({ pathname: '/products', params: { filter: 'featured' } })}
            accessibilityRole="button"
            accessibilityLabel={language === 'ar' ? 'عروض اليوم' : "Today's Deals"}
            accessibilityHint={language === 'ar' ? 'عرض جميع العروض المميزة' : 'View all featured deals and offers'}
          >
            <LinearGradient
              colors={['#FF8A3D', '#FF6B1A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dealsGradient}
            >
              <View style={styles.dealsShine} />
              <View
                style={[
                  styles.dealsContent,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <View style={styles.dealsIconWrap}>
                  <Text style={styles.dealsEmoji}>🔥</Text>
                </View>
                <View style={{ flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                  <Text style={[styles.dealsTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('todayDeals')}
                  </Text>
                  <Text style={[styles.dealsSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {language === 'ar' ? 'خصومات تصل إلى ٣٠٪ على الهواتف' : 'Up to 30% off on phones'}
                  </Text>
                </View>
                <View style={styles.dealsArrow}>
                  <Ionicons
                    name={isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={20}
                    color="rgba(255,255,255,0.9)"
                  />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* New Arrivals */}
        <View style={styles.section}>
          <SectionHeader title={t('newArrivals')} onPress={() => router.push({ pathname: '/products', params: { filter: 'new' } })} t={t} isRTL={isRTL} />
          {isTablet ? (
            <View style={[styles.tabletGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {newArrivals.map((product) => (
                <View key={product.id} style={styles.tabletGridItem}>
                  <ProductCard product={product} onPress={() => router.push(`/product/${product.id}`)} width="100%" />
                </View>
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.horizontalList,
                { paddingLeft: isRTL ? 0 : 16, paddingRight: isRTL ? 16 : 0 },
              ]}
            >
              {newArrivals.map((product) => (
                <View key={product.id} style={styles.productWrap}>
                  <ProductCard
                    product={product}
                    onPress={() => router.push(`/product/${product.id}`)}
                    width={172}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Best Sellers */}
        <View style={styles.section}>
          <SectionHeader title={t('bestSellers')} onPress={() => router.push({ pathname: '/products', params: { filter: 'bestSeller' } })} t={t} isRTL={isRTL} />
          {isTablet ? (
            <View style={[styles.tabletGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {bestSellers.map((product) => (
                <View key={product.id} style={styles.tabletGridItem}>
                  <ProductCard product={product} onPress={() => router.push(`/product/${product.id}`)} width="100%" />
                </View>
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.horizontalList,
                { paddingLeft: isRTL ? 0 : 16, paddingRight: isRTL ? 16 : 0 },
              ]}
            >
              {bestSellers.map((product) => (
                <View key={product.id} style={styles.productWrap}>
                  <ProductCard
                    product={product}
                    onPress={() => router.push(`/product/${product.id}`)}
                    width={172}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Top Rated Stores */}
        <View style={styles.section}>
          <SectionHeader
            title={t('topRated')}
            onPress={() => router.push('/(tabs)/stores')}
            t={t}
            isRTL={isRTL}
          />
          <View style={[styles.storeList, isTablet && { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }]}>
            {topRatedStores.slice(0, isTablet ? 4 : 3).map((store) => (
              <View key={store.id} style={isTablet && { width: '48.5%' }}>
                <StoreCard
                  store={store}
                  listMode
                  onPress={() => router.push(`/store/${store.id}`)}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  tabletCentered: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  tabletScrollContent: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  tabletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  tabletGridItem: {
    width: '48.5%',
  },

  // Header
  header: {
    backgroundColor: 'rgba(247, 243, 236, 0.82)',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236, 230, 217, 0.8)',
    shadowColor: 'rgba(30,25,15,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    zIndex: 10,
  },
  headerTop: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandRow: {
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.light.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    marginTop: 1,
  },
  headerActions: {
    gap: 8,
    alignItems: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.light.destructive,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: { marginTop: 4 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8 },

  // Sections
  section: { marginBottom: 4 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#FF8A3D',
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  chipWrap: {},
  horizontalList: {
    gap: 12,
    paddingRight: 16,
  },
  productWrap: {},

  // Deals banner
  dealsBanner: {
    marginHorizontal: 16,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 6,
  },
  dealsGradient: {
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  dealsShine: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dealsContent: {
    alignItems: 'center',
  },
  dealsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealsEmoji: { fontSize: 22 },
  dealsTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  dealsSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  dealsArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Store list
  storeList: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 8,
  },
});
