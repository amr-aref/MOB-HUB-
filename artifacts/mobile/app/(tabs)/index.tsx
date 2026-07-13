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
import { categories, products, stores } from '@/data/mockData';
import SearchBar from '@/components/SearchBar';
import CategoryChip from '@/components/CategoryChip';
import StoreCard from '@/components/StoreCard';
import ProductCard from '@/components/ProductCard';

export default function HomeScreen() {
  const { t, isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const featuredStores = stores.filter((s) => s.isVerified);
  const newArrivals = products.filter((p) => p.isNew);
  const bestSellers = products.filter((p) => p.isBestSeller);

  return (
    <View style={styles.container}>
      {/* Hero gradient header */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.appName, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('appName')}
            </Text>
            <Text style={[styles.tagline, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('appTagline')}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.9)" />
          </View>
        </View>

        <View style={styles.searchWrap}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('searchPlaceholder')}
            isRTL={isRTL}
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomInset + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        <View style={styles.section}>
          <SectionHeader title={t('categories')} onPress={() => {}} t={t} isRTL={isRTL} />
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
        </View>

        {/* Today's Deals banner */}
        <View style={styles.section}>
          <Pressable style={styles.dealsBanner}>
            <LinearGradient
              colors={['#DC2626', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dealsGradient}
            >
              <View style={[styles.dealsContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View>
                  <Text style={[styles.dealsTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                    🔥 {t('todayDeals')}
                  </Text>
                  <Text style={[styles.dealsSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {language === 'ar' ? 'خصومات تصل إلى ٣٠٪' : 'Discounts up to 30%'}
                  </Text>
                </View>
                <Ionicons
                  name={isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={24}
                  color="rgba(255,255,255,0.8)"
                />
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* New Arrivals */}
        <View style={styles.section}>
          <SectionHeader title={t('newArrivals')} onPress={() => {}} t={t} isRTL={isRTL} />
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
                  width={170}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Best Sellers */}
        <View style={styles.section}>
          <SectionHeader title={t('bestSellers')} onPress={() => {}} t={t} isRTL={isRTL} />
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
                  width={170}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Top Rated Stores */}
        <View style={styles.section}>
          <SectionHeader title={t('topRated')} onPress={() => router.push('/(tabs)/stores')} t={t} isRTL={isRTL} />
          <View style={styles.storesListWrap}>
            {stores.slice(0, 3).map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                variant="compact"
                onPress={() => router.push(`/store/${store.id}`)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

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
    <Pressable
      onPress={onPress}
      style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
    >
      <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
      <View style={[styles.seeAllRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={styles.seeAll}>{t('seeAll')}</Text>
        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={14}
          color={colors.light.primary}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.backgroundSecondary },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  tagline: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: { marginBottom: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 20 },
  section: { marginBottom: 24 },
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.primary,
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 10,
  },
  chipWrap: {},
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  productWrap: {},
  dealsBanner: {
    marginHorizontal: 16,
    borderRadius: colors.radiusLg,
    overflow: 'hidden',
    shadowColor: colors.light.destructive,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  dealsGradient: { borderRadius: colors.radiusLg },
  dealsContent: {
    padding: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dealsTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  dealsSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  storesListWrap: { paddingHorizontal: 16 },
});
