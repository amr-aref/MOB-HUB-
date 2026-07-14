import React from 'react';
import {
  ActivityIndicator,
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
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetStores } from '@workspace/api-client-react';
import StoreCard from '@/components/StoreCard';
import { useLayout } from '@/hooks/useLayout';

type StoreFilterType = 'featured' | 'topRated' | 'all';

export default function StoresListScreen() {
  const { filter = 'all' } = useLocalSearchParams<{ filter: string }>();
  const { isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();

  const topInset = isTablet ? 24 : (Platform.OS === 'web' ? 67 : insets.top);

  const queryParams = (): Record<string, string> => {
    switch (filter as StoreFilterType) {
      case 'featured':
        return { isVerified: 'true' };
      case 'topRated':
        return { sort: 'rating' };
      default:
        return {};
    }
  };

  const params = queryParams();
  const { data: stores = [], isLoading } = useGetStores(
    Object.keys(params).length ? params : undefined,
  );

  function getScreenTitle(): string {
    switch (filter as StoreFilterType) {
      case 'featured':
        return language === 'ar' ? 'المتاجر المميزة' : 'Featured Stores';
      case 'topRated':
        return language === 'ar' ? 'الأعلى تقييماً' : 'Top Rated';
      default:
        return language === 'ar' ? 'جميع المتاجر' : 'All Stores';
    }
  }

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
        ) : stores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="storefront-outline" size={40} color={colors.light.primary} />
            </View>
            <Text style={[styles.emptyTitle, { textAlign: 'center' }]}>
              {language === 'ar' ? 'لا توجد متاجر' : 'No Stores Found'}
            </Text>
            <Text style={[styles.emptySubtitle, { textAlign: 'center' }]}>
              {language === 'ar'
                ? 'لا توجد متاجر في هذه الفئة حالياً'
                : 'No stores available right now'}
            </Text>
          </View>
        ) : (
          <View style={styles.storeList}>
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                listMode
                onPress={() => router.push(`/store/${store.id}`)}
              />
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
    paddingHorizontal: 16,
    paddingBottom: 16,
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

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 10 },
  tabletScrollContent: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },

  storeList: { gap: 10 },

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
