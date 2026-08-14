import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getGetProductsQueryKey, useGetProducts } from '@workspace/api-client-react';
import ProductCard from '@/components/ProductCard';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLayout } from '@/hooks/useLayout';

export default function SearchResultsScreen() {
  const { query = '' } = useLocalSearchParams<{ query: string }>();
  const search = query.trim();
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { isTablet } = useLayout();
  const { width } = useWindowDimensions();
  const params = search ? { search } : undefined;
  const { data: products = [], isLoading } = useGetProducts(
    params,
    {
      query: {
        enabled: Boolean(search),
        queryKey: getGetProductsQueryKey(params),
      },
    },
  );

  const topInset = isTablet ? 24 : Platform.OS === 'web' ? 67 : insets.top;
  const columns = isTablet ? 3 : 2;
  const gap = 12;
  const cardWidth = Math.floor((width - 32 - gap * (columns - 1)) / columns);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}> 
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.light.foreground} />
        </Pressable>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
          {language === 'ar' ? `نتائج البحث: ${search}` : `Search results: ${search}`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.state}><ActivityIndicator size="large" color={colors.light.primary} /></View>
        ) : products.length === 0 ? (
          <View style={styles.state}>
            <Ionicons name="search-outline" size={44} color={colors.light.primary} />
            <Text style={styles.emptyTitle}>{language === 'ar' ? 'لا توجد نتائج' : 'No results found'}</Text>
            <Text style={styles.emptyText}>{language === 'ar' ? 'جرّب اسم هاتف أو شركة أو موديل آخر.' : 'Try another phone, brand, or model.'}</Text>
          </View>
        ) : (
          <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
            {products.map((product) => (
              <View key={product.id} style={{ width: cardWidth }}>
                <ProductCard product={product} width={cardWidth} onPress={() => router.push(`/product/${product.id}`)} />
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
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(226,232,240,0.6)' },
  back: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.light.muted, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, marginHorizontal: 12, fontSize: 19, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  content: { padding: 16, paddingBottom: 48 },
  grid: { flexWrap: 'wrap', gap: 12 },
  state: { minHeight: 320, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  emptyText: { marginTop: 8, textAlign: 'center', fontSize: 14, lineHeight: 22, color: colors.light.mutedForeground },
});
