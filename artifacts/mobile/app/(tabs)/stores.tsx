import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetStores } from '@workspace/api-client-react';
import SearchBar from '@/components/SearchBar';
import StoreCard from '@/components/StoreCard';

const CITIES_AR = ['الكل', 'القاهرة', 'الإسكندرية', 'الجيزة'];
const CITIES_EN = ['All', 'Cairo', 'Alexandria', 'Giza'];

export default function StoresScreen() {
  const { t, isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(0);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const cities = language === 'ar' ? CITIES_AR : CITIES_EN;
  const citiesFilter = ['', 'القاهرة', 'الإسكندرية', 'الجيزة'];

  const { data: allStores = [] } = useGetStores();
  const filtered = useMemo(() => {
    return allStores.filter((store) => {
      const name = language === 'ar' ? store.nameAr : store.nameEn;
      const matchSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        store.governorate.includes(search) ||
        store.nameEn.toLowerCase().includes(search.toLowerCase());
      const matchCity =
        selectedCity === 0 || store.governorate === citiesFilter[selectedCity];
      return matchSearch && matchCity;
    });
  }, [allStores, search, selectedCity, language]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={[styles.headerTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('stores')}
          </Text>
          <View style={styles.sortBtn}>
            <Ionicons name="options-outline" size={18} color={colors.light.primary} />
            <Text style={styles.sortText}>{language === 'ar' ? 'ترتيب' : 'Sort'}</Text>
          </View>
        </View>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('searchPlaceholder')}
          isRTL={isRTL}
        />

        {/* City filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filterRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          {cities.map((city, idx) => (
            <Pressable
              key={idx}
              onPress={() => setSelectedCity(idx)}
              style={[styles.filterChip, selectedCity === idx && styles.filterChipActive]}
            >
              <Text
                style={[styles.filterText, selectedCity === idx && styles.filterTextActive]}
              >
                {city}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Stats bar */}
      <View style={[styles.statsBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.statsLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Ionicons name="storefront-outline" size={15} color={colors.light.primary} />
          <Text style={styles.statsText}>
            {filtered.length} {language === 'ar' ? 'متجر' : 'stores'}
          </Text>
        </View>
        {filtered.some((s) => s.isOpen) && (
          <View style={[styles.openBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.openDot} />
            <Text style={styles.openText}>
              {language === 'ar'
                ? `${filtered.filter((s) => s.isOpen).length} مفتوح`
                : `${filtered.filter((s) => s.isOpen).length} open`}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomInset + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="storefront-outline" size={32} color={colors.light.mutedForeground} />
            </View>
            <Text style={styles.emptyText}>{t('noResults')}</Text>
            <Text style={styles.emptyHint}>
              {language === 'ar' ? 'جرب البحث بكلمات مختلفة' : 'Try different search terms'}
            </Text>
          </View>
        ) : (
          filtered.map((store) => (
            <View key={store.id} style={styles.cardWrap}>
              <StoreCard
                store={store}
                listMode
                onPress={() => router.push(`/store/${store.id}`)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: colors.light.background,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  headerTop: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.light.primaryLight,
    borderRadius: colors.radiusFull,
  },
  sortText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.primary,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: colors.radiusFull,
    backgroundColor: colors.light.muted,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: colors.light.primaryLight,
    borderColor: colors.light.primary,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
  },
  filterTextActive: {
    color: colors.light.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  statsBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F7FA',
  },
  statsLeft: { alignItems: 'center', gap: 6 },
  statsText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
  },
  openBadge: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.light.successLight,
    borderRadius: colors.radiusFull,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.light.success,
  },
  openText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.success,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  cardWrap: { marginBottom: 0 },
  empty: { alignItems: 'center', paddingTop: 64, gap: 10 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
  },
});
