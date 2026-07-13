import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { stores, products } from '@/data/mockData';
import StoreCard from '@/components/StoreCard';
import ProductCard from '@/components/ProductCard';

export default function FavoritesScreen() {
  const { t, isRTL, language } = useLanguage();
  const { favoriteStores, favoriteProducts } = useFavorites();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<'stores' | 'products'>('stores');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const favStores = stores.filter((s) => favoriteStores.includes(s.id));
  const favProducts = products.filter((p) => favoriteProducts.includes(p.id));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
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
              color={tab === 'stores' ? colors.light.primary : colors.light.mutedForeground}
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
              color={tab === 'products' ? colors.light.primary : colors.light.mutedForeground}
            />
            <Text style={[styles.segmentText, tab === 'products' && styles.segmentTextActive]}>
              {t('favoriteProducts')} {favoriteProducts.length > 0 ? `(${favoriteProducts.length})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomInset + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'stores' && (
          <>
            {favStores.length === 0 ? (
              <EmptyState
                icon="heart-outline"
                text={t('emptyFavoritesStores')}
                hint={t('emptyFavoritesHint')}
              />
            ) : (
              favStores.map((store) => (
                <View key={store.id} style={styles.cardWrap}>
                  <StoreCard
                    store={store}
                    variant="compact"
                    onPress={() => router.push(`/store/${store.id}`)}
                  />
                </View>
              ))
            )}
          </>
        )}

        {tab === 'products' && (
          <>
            {favProducts.length === 0 ? (
              <EmptyState
                icon="heart-outline"
                text={t('emptyFavoritesProducts')}
                hint={t('emptyFavoritesHint')}
              />
            ) : (
              <View style={styles.productGrid}>
                {favProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onPress={() => router.push(`/product/${product.id}`)}
                    width={168}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function EmptyState({ icon, text, hint }: { icon: string; text: string; hint: string }) {
  return (
    <View style={emptyStyles.wrap}>
      <View style={emptyStyles.iconWrap}>
        <Ionicons name={icon as any} size={40} color={colors.light.mutedForeground} />
      </View>
      <Text style={emptyStyles.text}>{text}</Text>
      <Text style={emptyStyles.hint}>{hint}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.light.muted,
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
  header: {
    backgroundColor: colors.light.background,
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  segmentRow: {
    flexDirection: 'row',
    borderBottomWidth: 0,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentActive: {
    borderBottomColor: colors.light.primary,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
  },
  segmentTextActive: {
    color: colors.light.primary,
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
