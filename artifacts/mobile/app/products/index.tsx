import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetProducts, useGetCategories } from '@workspace/api-client-react';
import ProductCard from '@/components/ProductCard';
import CategoryChip from '@/components/CategoryChip';
import { useLayout } from '@/hooks/useLayout';

type FilterType = 'new' | 'bestSeller' | 'featured' | 'all' | string;

function getQueryParams(filter: FilterType): Record<string, string> {
  switch (filter) {
    case 'new':
      return { isNew: 'true' };
    case 'bestSeller':
      return { isBestSeller: 'true' };
    case 'featured':
      return { isFeatured: 'true' };
    case 'all':
      return {};
    default:
      // Treat as a category ID
      return { category: filter };
  }
}

export default function ProductsScreen() {
  const { filter = 'all' } = useLocalSearchParams<{ filter: string }>();
  const { t, isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();

  const topInset = isTablet ? 24 : (Platform.OS === 'web' ? 67 : insets.top);
  const { width: screenWidth } = useWindowDimensions();
  const H_PAD = 32; // 16px × 2
  const GAP = 12;
  const numCols = isTablet ? 3 : 2;
  const cardWidth = Math.floor((screenWidth - H_PAD - GAP * (numCols - 1)) / numCols);

  // Category chip filter — only available in 'all' mode
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: allCategories = [] } = useGetCategories();

  const activeFilter = filter === 'all' && selectedCategory ? selectedCategory : filter;
  const queryParams = getQueryParams(activeFilter);

  const { data: products = [], isLoading } = useGetProducts(
    Object.keys(queryParams).length ? queryParams : undefined,
  );

  function getScreenTitle(): string {
    switch (filter) {
      case 'new':
        return language === 'ar' ? 'وصل حديثاً' : 'New Arrivals';
      case 'bestSeller':
        return language === 'ar' ? 'الأكثر مبيعاً' : 'Best Sellers';
      case 'featured':
        return language === 'ar' ? 'منتجات مميزة' : 'Featured';
      case 'all':
        return language === 'ar' ? 'جميع المنتجات' : 'All Products';
      default: {
        // Category ID — look up its label
        const cat = allCategories.find((c) => c.id === filter);
        if (cat) return t(cat.id as any);
        return language === 'ar' ? 'المنتجات' : 'Products';
      }
    }
  }

  const showCategoryChips = filter === 'all';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View
          style={[
            styles.headerRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
            isTablet && styles.tabletCentered,
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={language === 'ar' ? 'رجوع' : 'Go back'}
            accessibilityHint={language === 'ar' ? 'العودة للشاشة السابقة' : 'Navigate to previous screen'}
            hitSlop={12}
          >
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={colors.light.foreground}
            />
          </Pressable>
          <Text
            style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}
            numberOfLines={1}
          >
            {getScreenTitle()}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Category chips — shown only for 'all' filter */}
        {showCategoryChips && allCategories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.chipsRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
            style={styles.chipsScroll}
          >
            {allCategories.map((cat) => (
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
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.light.primary} />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="phone-portrait-outline" size={40} color={colors.light.primary} />
            </View>
            <Text style={[styles.emptyTitle, { textAlign: 'center' }]}>
              {language === 'ar' ? 'لا توجد منتجات' : 'No Products Found'}
            </Text>
            <Text style={[styles.emptySubtitle, { textAlign: 'center' }]}>
              {language === 'ar'
                ? 'لا توجد منتجات في هذه الفئة حالياً'
                : 'No products available in this category right now'}
            </Text>
          </View>
        ) : (
          <View
            style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            {products.map((product) => (
              <View key={product.id} style={[styles.gridItem, isTablet && styles.tabletGridItem]}>
                <ProductCard
                  product={product}
                  onPress={() => router.push(`/product/${product.id}`)}
                  width={cardWidth}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  tabletCentered: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    flex: 1,
    marginHorizontal: 12,
  },
  headerSpacer: { width: 38 },

  chipsScroll: { marginTop: 8 },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  chipWrap: {},

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  tabletScrollContent: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },

  grid: {
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48.5%',
  },
  tabletGridItem: {
    width: '31.5%',
  },

  loadingContainer: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    lineHeight: 22,
  },
});
