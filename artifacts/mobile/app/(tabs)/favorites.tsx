import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useGetStores, useGetProducts } from '@workspace/api-client-react';
import StoreCard from '@/components/StoreCard';
import ProductCard from '@/components/ProductCard';
import { useLayout } from '@/hooks/useLayout';

export default function FavoritesScreen() {
  const { t, isRTL, language } = useLanguage();
  const { favoriteStores, favoriteProducts } = useFavorites();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<'stores' | 'products'>('stores');
  const { isTablet } = useLayout();

  const topInset = isTablet ? 24 : (Platform.OS === 'web' ? 67 : insets.top);
  const bottomInset = isTablet ? 0 : (Platform.OS === 'web' ? 34 : 0);

  const storeIdsParam = favoriteStores.join(',');
  const productIdsParam = favoriteProducts.join(',');
  const { data: fetchedFavStores = [] } = useGetStores(
    { ids: storeIdsParam },
    { query: { enabled: favoriteStores.length > 0, queryKey: ['getStores', storeIdsParam] } },
  );
  const { data: fetchedFavProducts = [] } = useGetProducts(
    { ids: productIdsParam },
    { query: { enabled: favoriteProducts.length > 0, queryKey: ['getProducts', productIdsParam] } },
  );
  const favStores = favoriteStores.length > 0 ? fetchedFavStores : [];
  const favProducts = favoriteProducts.length > 0 ? fetchedFavProducts : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={isTablet ? styles.tabletCentered : undefined}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('favoritesTitle')}
          </Text>

          {/* Segment tabs */}
          <View style={[styles.segmentRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable
              onPress={() => setTab('stores')}
              style={[styles.segment, tab === 'stores' && styles.segmentActive]}
            >
              <Ionicons
                name="storefront-outline"
                size={16}
                color={tab === 'stores' ? '#fff' : colors.light.mutedForeground}
              />
              <Text style={[styles.segmentText, tab === 'stores' && styles.segmentTextActive]}>
                {t('favoriteStores')} {favoriteStores.length > 0 ? `(${favoriteStores.length})` : ''}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('products')}
              style={[styles.segment, tab === 'products' && styles.segmentActive]}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={16}
                color={tab === 'products' ? '#fff' : colors.light.mutedForeground}
              />
              <Text style={[styles.segmentText, tab === 'products' && styles.segmentTextActive]}>
                {t('favoriteProducts')} {favoriteProducts.length > 0 ? `(${favoriteProducts.length})` : ''}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomInset + 100 },
          isTablet && styles.tabletScrollContent
        ]}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'stores' && (
          <View style={[isTablet && styles.tabletGridStores, isTablet && { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {favStores.length === 0 ? (
              <View style={{ width: '100%' }}>
                <EmptyState
                  icon="heart-outline"
                  text={t('emptyFavoritesStores')}
                  hint={t('emptyFavoritesHint')}
                />
              </View>
            ) : (
              favStores.map((store) => (
                <View key={store.id} style={[styles.cardWrap, isTablet && styles.tabletGridItemStore]}>
                  <StoreCard
                    store={store}
                    variant="compact"
                    onPress={() => router.push(`/store/${store.id}`)}
                  />
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'products' && (
          <View style={[styles.productGrid, isTablet && styles.tabletGridProducts, isTablet && { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {favProducts.length === 0 ? (
              <View style={{ width: '100%' }}>
                <EmptyState
                  icon="heart-outline"
                  text={t('emptyFavoritesProducts')}
                  hint={t('emptyFavoritesHint')}
                />
              </View>
            ) : (
              favProducts.map((product) => (
                <View key={product.id} style={isTablet ? styles.tabletGridItemProduct : undefined}>
                  <ProductCard
                    product={product}
                    onPress={() => router.push(`/product/${product.id}`)}
                    width={isTablet ? undefined : 168}
                  />
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function EmptyState({ icon, text, hint }: { icon: string; text: string; hint: string }) {
  return (
    <View style={emptyStyles.wrap}>
      <View style={emptyStyles.iconWrap}>
        <Ionicons name={icon as any} size={48} color={colors.light.mutedForeground} />
      </View>
      <Text style={emptyStyles.text}>{text}</Text>
      <Text style={emptyStyles.hint}>{hint}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 100,
    gap: 16,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.backgroundSecondary },

  tabletCentered: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  tabletScrollContent: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  tabletGridStores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tabletGridItemStore: {
    width: '48.5%',
    marginBottom: 0,
  },
  tabletGridProducts: {
    justifyContent: 'flex-start',
  },
  tabletGridItemProduct: {
    width: '31.5%',
  },

  header: {
    backgroundColor: colors.light.background,
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    marginBottom: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: '#2B2B2E',
  },
  segmentText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
  },
  segmentTextActive: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  cardWrap: { marginBottom: 8 },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
});
